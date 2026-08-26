import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { ScoringSystem } from './ScoringSystem';
import { RateLimiter } from '../utils/RateLimiter';
import { updatePlayerStatsInDb } from '../db/supabase';
import { MovePayload, CatchPayload, GameRole } from './types';

export class GameManager {
  private roomManager = new RoomManager();
  private rateLimiter = new RateLimiter(60, 30);
  private tickInterval: NodeJS.Timeout | null = null;

  constructor(private io: Server) {
    this.startServerLoop();
  }

  public handleConnection(socket: Socket) {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    socket.on('create_room', ({ playerId, username, mapId }: { playerId: string; username: string; mapId?: string }) => {
      const room = this.roomManager.createRoom(socket.id, playerId, username, mapId || 'school');
      currentRoomCode = room.code;
      currentPlayerId = playerId;
      socket.join(room.code);
      socket.emit('room_joined', room);
    });

    socket.on('join_room', ({ code, playerId, username }: { code: string; playerId: string; username: string }) => {
      const result = this.roomManager.joinRoom(code, socket.id, playerId, username);
      if ('error' in result) {
        socket.emit('error_message', result.error);
        return;
      }
      currentRoomCode = result.code;
      currentPlayerId = playerId;
      socket.join(result.code);
      this.io.to(result.code).emit('room_updated', result);
    });

    socket.on('toggle_ready', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = this.roomManager.getRoom(currentRoomCode);
      if (!room || room.state.phase !== 'LOBBY') return;

      const player = room.state.players[currentPlayerId];
      if (player) {
        player.isReady = !player.isReady;
        this.io.to(currentRoomCode).emit('room_updated', room.state);
      }
    });

    socket.on('change_map', ({ mapId }: { mapId: string }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = this.roomManager.getRoom(currentRoomCode);
      if (!room || room.state.phase !== 'LOBBY') return;
      if (room.state.hostId === currentPlayerId) {
        room.state.mapId = mapId;
        this.io.to(currentRoomCode).emit('room_updated', room.state);
      }
    });

    socket.on('start_game', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = this.roomManager.getRoom(currentRoomCode);
      if (!room) return;

      if (room.state.hostId !== currentPlayerId) {
        socket.emit('error_message', 'Only host can start the game.');
        return;
      }

      const playerList = Object.values(room.state.players);
      if (playerList.length < 2) {
        socket.emit('error_message', 'Need at least 2 players to start.');
        return;
      }

      const allReady = playerList.every(p => p.isReady || p.isHost);
      if (!allReady) {
        socket.emit('error_message', 'All players must be ready.');
        return;
      }

      const seekerIndex = Math.floor(Math.random() * playerList.length);
      playerList.forEach((p, idx) => {
        p.role = idx === seekerIndex ? 'SEEKER' : 'HIDER';
        p.isCaught = false;
        p.score = 0;
        p.catchesCount = 0;
        p.timeAsHider = 0;
        p.timeAsSeeker = 0;
      });

      room.state.phase = 'COUNTDOWN';
      room.state.timeRemaining = 300;
      room.state.seekerStunRemaining = 15;
      room.fsm.transitionTo('COUNTDOWN');

      this.io.to(currentRoomCode).emit('game_started', room.state);
    });

    socket.on('player_move', (payload: MovePayload) => {
      if (!currentRoomCode || !currentPlayerId) return;
      if (!this.rateLimiter.allow(socket.id)) return;

      const room = this.roomManager.getRoom(currentRoomCode);
      if (!room) return;

      const p = room.state.players[currentPlayerId];
      if (!p) return;

      if (room.state.phase === 'SEEKER_STUNNED' && p.role === 'SEEKER') return;

      const now = Date.now();
      const dt = Math.max(0.016, (now - p.lastMoveTimestamp) / 1000);
      const dx = payload.position.x - p.position.x;
      const dz = payload.position.z - p.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const speed = dist / dt;

      if (speed <= 18) {
        p.position = payload.position;
        p.rotationY = payload.rotationY;
      }
      p.lastMoveTimestamp = now;
    });

    socket.on('catch_player', ({ targetId }: CatchPayload) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = this.roomManager.getRoom(currentRoomCode);
      if (!room || room.state.phase !== 'HIDE_AND_SEEK') return;

      const seeker = room.state.players[currentPlayerId];
      const target = room.state.players[targetId];

      if (!seeker || seeker.role !== 'SEEKER') return;
      if (!target || target.role !== 'HIDER' || target.isCaught) return;

      const dx = seeker.position.x - target.position.x;
      const dy = seeker.position.y - target.position.y;
      const dz = seeker.position.z - target.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance <= 3.2) {
        ScoringSystem.awardCatchBonus(seeker, target);
        seeker.role = 'HIDER';
        target.role = 'SEEKER';

        this.io.to(currentRoomCode).emit('player_caught', {
          seekerId: currentPlayerId,
          hiderId: targetId,
          newSeekerId: targetId,
          players: room.state.players,
        });
      }
    });

    socket.on('disconnect', () => {
      this.rateLimiter.removeKey(socket.id);
      if (currentRoomCode && currentPlayerId) {
        const { state, roomDeleted } = this.roomManager.leaveRoom(currentRoomCode, currentPlayerId);
        if (!roomDeleted && state) {
          this.io.to(currentRoomCode).emit('room_updated', state);
        }
      }
    });
  }

  private startServerLoop() {
    const dt = 1 / 20;
    this.tickInterval = setInterval(() => {
      const rooms = this.roomManager.getAllRooms();

      for (const roomState of rooms) {
        if (roomState.phase === 'LOBBY' || roomState.phase === 'GAME_OVER') continue;

        const room = this.roomManager.getRoom(roomState.code);
        if (!room) continue;

        if (roomState.phase === 'COUNTDOWN') {
          roomState.seekerStunRemaining -= dt;
          if (roomState.seekerStunRemaining <= 0) {
            roomState.phase = 'SEEKER_STUNNED';
            roomState.seekerStunRemaining = 15;
            room.fsm.transitionTo('SEEKER_STUNNED');
          }
        } else if (roomState.phase === 'SEEKER_STUNNED') {
          roomState.seekerStunRemaining -= dt;
          if (roomState.seekerStunRemaining <= 0) {
            roomState.phase = 'HIDE_AND_SEEK';
            room.fsm.transitionTo('HIDE_AND_SEEK');
          }
        } else if (roomState.phase === 'HIDE_AND_SEEK') {
          roomState.timeRemaining -= dt;
          ScoringSystem.calculateTickScores(roomState.players, dt);

          if (roomState.timeRemaining <= 0) {
            roomState.phase = 'GAME_OVER';
            const winner = ScoringSystem.finalizeScores(roomState.players);
            roomState.winner = winner;
            room.fsm.transitionTo('GAME_OVER');

            Object.values(roomState.players).forEach(p => {
              updatePlayerStatsInDb({
                username: p.username,
                won: (winner === 'HIDER' && p.role === 'HIDER') || (winner === 'SEEKER' && p.role === 'SEEKER'),
                catches: p.catchesCount,
                score: p.score,
                timeSeeker: Math.round(p.timeAsSeeker),
                timeHider: Math.round(p.timeAsHider),
              });
            });

            this.io.to(roomState.code).emit('game_over', roomState);
          }
        }

        this.io.to(roomState.code).emit('state_update', {
          players: roomState.players,
          timeRemaining: Math.ceil(roomState.timeRemaining),
          seekerStunRemaining: Math.ceil(roomState.seekerStunRemaining),
          phase: roomState.phase,
        });
      }
    }, dt * 1000);
  }
}
