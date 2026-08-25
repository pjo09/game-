import { GameRoomState, PlayerState } from './types.js';
import { generateRoomCode } from '../utils/roomCode.js';
import { GameStateMachine } from './GameStateMachine.js';

export class RoomManager {
  private rooms: Map<string, { state: GameRoomState; fsm: GameStateMachine }> = new Map();

  public createRoom(hostSocketId: string, hostPlayerId: string, username: string, mapId: string = 'school'): GameRoomState {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const hostPlayer: PlayerState = {
      id: hostPlayerId,
      socketId: hostSocketId,
      username: username || 'Player 1',
      role: 'HIDER',
      position: { x: 0, y: 1, z: 0 },
      rotationY: 0,
      score: 0,
      isReady: true,
      isHost: true,
      isCaught: false,
      color: '#3B82F6',
      catchesCount: 0,
      timeAsHider: 0,
      timeAsSeeker: 0,
      lastMoveTimestamp: Date.now(),
    };

    const roomState: GameRoomState = {
      code,
      phase: 'LOBBY',
      mapId,
      players: { [hostPlayerId]: hostPlayer },
      timeRemaining: 300,
      seekerStunRemaining: 15,
      hostId: hostPlayerId,
      maxPlayers: 7,
    };

    this.rooms.set(code, { state: roomState, fsm: new GameStateMachine() });
    return roomState;
  }

  public getRoom(code: string): { state: GameRoomState; fsm: GameStateMachine } | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public joinRoom(code: string, socketId: string, playerId: string, username: string): GameRoomState | { error: string } {
    const room = this.getRoom(code);
    if (!room) {
      return { error: 'Room not found.' };
    }

    if (room.state.phase !== 'LOBBY') {
      return { error: 'Game already in progress.' };
    }

    const currentPlayersCount = Object.keys(room.state.players).length;
    if (currentPlayersCount >= room.state.maxPlayers) {
      return { error: 'Room is full (Max 7 players).' };
    }

    const playerColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
    const chosenColor = playerColors[currentPlayersCount % playerColors.length];

    const newPlayer: PlayerState = {
      id: playerId,
      socketId,
      username: username || `Player ${currentPlayersCount + 1}`,
      role: 'HIDER',
      position: { x: (Math.random() - 0.5) * 4, y: 1, z: (Math.random() - 0.5) * 4 },
      rotationY: 0,
      score: 0,
      isReady: false,
      isHost: false,
      isCaught: false,
      color: chosenColor,
      catchesCount: 0,
      timeAsHider: 0,
      timeAsSeeker: 0,
      lastMoveTimestamp: Date.now(),
    };

    room.state.players[playerId] = newPlayer;
    return room.state;
  }

  public leaveRoom(code: string, playerId: string): { state?: GameRoomState; roomDeleted?: boolean } {
    const room = this.getRoom(code);
    if (!room) return { roomDeleted: true };

    delete room.state.players[playerId];
    const remainingPlayerIds = Object.keys(room.state.players);

    if (remainingPlayerIds.length === 0) {
      this.rooms.delete(code);
      return { roomDeleted: false };
    }

    if (room.state.hostId === playerId) {
      const nextHostId = remainingPlayerIds[0];
      room.state.hostId = nextHostId;
      room.state.players[nextHostId].isHost = true;
      room.state.players[nextHostId].isReady = true;
    }

    return { state: room.state, roomDeleted: false };
  }

  public getAllRooms(): GameRoomState[] {
    return Array.from(this.rooms.values()).map(r => r.state);
  }
}
