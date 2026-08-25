import React, { useEffect, useRef, useState } from 'react';
import { GameRoom, Vector3D } from '../types';
import { GameScene } from './GameScene';
import { MobileControls } from './MobileControls';
import { audioManager } from '../utils/AudioManager';
import { Shield, Target, Volume2, VolumeX, Trophy, RotateCcw } from 'lucide-react';

interface GameProps {
  room: GameRoom;
  playerId: string;
  onMove: (pos: Vector3D, rotY: number) => void;
  onCatch: (targetId: string) => void;
  onReturnToLobby: () => void;
}

export const Game: React.FC<GameProps> = ({
  room,
  playerId,
  onMove,
  onCatch,
  onReturnToLobby,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const currentPlayer = room.players[playerId];

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new GameScene(mountRef.current, playerId);
    scene.setMap(room.mapId);
    scene.setOnMove(onMove);
    scene.setOnCatch(onCatch);
    gameSceneRef.current = scene;

    return () => {
      scene.destroy();
    };
  }, [room.mapId, playerId]);

  useEffect(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.updatePlayers(room.players);
    }
  }, [room.players]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTouchMove = (vector: { x: number; y: number }) => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setTouchMove(vector);
    }
  };

  const toggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      <div ref={mountRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
        <div
          className={`px-4 py-2 rounded-2xl border backdrop-blur-md shadow-xl flex items-center gap-2.5 font-black text-sm uppercase tracking-wider ${
            currentPlayer?.role === 'SEEKER'
              ? 'bg-red-600/80 border-red-400 text-white animate-pulse'
              : 'bg-emerald-600/80 border-emerald-400 text-white'
          }`}
        >
          {currentPlayer?.role === 'SEEKER' ? (
            <>
              <Target className="w-5 h-5" /> SEEKER (TAG HIDERS!)
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" /> HIDER (HIDE NOW!)
            </>
          )}
        </div>

        <div className="glass-panel px-6 py-2 rounded-2xl border border-slate-700 text-center shadow-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">MATCH TIMER</span>
          <span className="text-2xl font-black font-mono text-indigo-400">
            {formatTime(room.timeRemaining)}
          </span>
        </div>

        <button
          onClick={toggleMute}
          className="pointer-events-auto p-3 rounded-2xl glass-panel text-slate-300 hover:text-white transition-colors shadow-xl"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {room.phase === 'SEEKER_STUNNED' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500/90 border border-amber-300 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-2xl z-30 text-center animate-bounce">
          {currentPlayer?.role === 'SEEKER'
            ? `SEEKER STUNNED! Hiders are hiding (${room.seekerStunRemaining}s)`
            : `HIDER HEADSTART! Run and hide! (${room.seekerStunRemaining}s)`}
        </div>
      )}

      <MobileControls
        onMove={handleTouchMove}
        onCatch={() => {
          const seekerPos = currentPlayer?.position;
          if (seekerPos) {
            for (const p of Object.values(room.players)) {
              if (p.id !== playerId && p.role === 'HIDER') {
                const dist = Math.hypot(seekerPos.x - p.position.x, seekerPos.z - p.position.z);
                if (dist <= 3.2) {
                  onCatch(p.id);
                  break;
                }
              }
            }
          }
        }}
        isSeeker={currentPlayer?.role === 'SEEKER'}
      />

      {room.phase === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-8 border border-slate-700 shadow-2xl text-center space-y-6">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            
            <div>
              <h2 className="text-4xl font-black text-white">MATCH OVER</h2>
              <p className="text-lg font-bold text-indigo-400 mt-1">
                {room.winner === 'HIDER' ? '🎉 HIDERS SURVIVED AND WON!' : '🔥 SEEKER CAUGHT ALL HIDERS!'}
              </p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {Object.values(room.players)
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-slate-500">#{idx + 1}</span>
                      <span className="font-semibold text-sm text-slate-200">{p.username}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-400 text-sm block">{p.score} pts</span>
                      <span className="text-[10px] text-slate-500">Catches: {p.catchesCount}</span>
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={onReturnToLobby}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all"
            >
              <RotateCcw className="w-5 h-5" /> RETURN TO LOBBY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
