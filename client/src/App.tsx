import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { GameRoom, Vector3D } from './types';
import { audioManager } from './utils/AudioManager';

const SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState<string>(() => localStorage.getItem('hideout_username') || '');
  const [playerId] = useState<string>(() => {
    let id = localStorage.getItem('hideout_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('hideout_player_id', id);
    }
    return id;
  });

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    newSocket.on('room_joined', (roomState: GameRoom) => {
      setRoom(roomState);
      setError(null);
    });

    newSocket.on('room_updated', (roomState: GameRoom) => {
      setRoom(roomState);
    });

    newSocket.on('game_started', (roomState: GameRoom) => {
      setRoom(roomState);
      audioManager.playTagAlert();
    });

    newSocket.on('state_update', (update: Partial<GameRoom>) => {
      setRoom((prev) => (prev ? { ...prev, ...update } : null));
    });

    newSocket.on('player_caught', ({ seekerId, hiderId, players }: any) => {
      setRoom((prev) => (prev ? { ...prev, players } : null));
      audioManager.playCatchSound();
    });

    newSocket.on('game_over', (roomState: GameRoom) => {
      setRoom(roomState);
      audioManager.playGameOver();
    });

    newSocket.on('error_message', (msg: string) => {
      setError(msg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSetUsername = (name: string) => {
    setUsername(name);
    localStorage.setItem('hideout_username', name);
  };

  const handleCreateRoom = (mapId: string) => {
    if (!socket || !username.trim()) return;
    socket.emit('create_room', { playerId, username, mapId });
  };

  const handleJoinRoom = (code: string) => {
    if (!socket || !username.trim()) return;
    socket.emit('join_room', { code, playerId, username });
  };

  const handleToggleReady = () => {
    if (!socket) return;
    socket.emit('toggle_ready');
  };

  const handleChangeMap = (mapId: string) => {
    if (!socket) return;
    socket.emit('change_map', { mapId });
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start_game');
  };

  const handleLeaveRoom = () => {
    if (socket) socket.disconnect();
    setRoom(null);
    window.location.reload();
  };

  const handleMove = (position: Vector3D, rotationY: number) => {
    if (!socket) return;
    socket.emit('player_move', { position, rotationY });
  };

  const handleCatch = (targetId: string) => {
    if (!socket) return;
    socket.emit('catch_player', { targetId });
  };

  return (
    <div className="w-full min-h-screen bg-slate-950">
      {!room && (
        <MainMenu
          username={username}
          setUsername={handleSetUsername}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
        />
      )}

      {room && room.phase === 'LOBBY' && (
        <Lobby
          room={room}
          playerId={playerId}
          onToggleReady={handleToggleReady}
          onChangeMap={handleChangeMap}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {room && room.phase !== 'LOBBY' && (
        <Game
          room={room}
          playerId={playerId}
          onMove={handleMove}
          onCatch={handleCatch}
          onReturnToLobby={handleLeaveRoom}
        />
      )}
    </div>
  );
}
export default App;
