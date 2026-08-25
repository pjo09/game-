import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export function useReconnection(socket: Socket | null, roomCode: string | null, playerId: string | null, username: string) {
  const [isConnected, setIsConnected] = useState<boolean>(socket?.connected || false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);

      const savedRoom = localStorage.getItem('hideout_room_code') || roomCode;
      const savedPlayerId = localStorage.getItem('hideout_player_id') || playerId;
      
      if (savedRoom && savedPlayerId) {
        socket.emit('join_room', {
          code: savedRoom,
          playerId: savedPlayerId,
          username: username || 'Player',
        });
      }
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
      setIsReconnecting(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket, roomCode, playerId, username]);

  return { isConnected, isReconnecting };
}
