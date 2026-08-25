import React, { useState } from 'react';
import { Crown, CheckCircle, Clock, Copy, Play, ArrowLeft, Map } from 'lucide-react';
import { GameRoom } from '../types';
import { MAPS } from '../maps/maps';

interface LobbyProps {
  room: GameRoom;
  playerId: string;
  onToggleReady: () => void;
  onChangeMap: (mapId: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  room,
  playerId,
  onToggleReady,
  onChangeMap,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const currentPlayer = room.players[playerId];
  const isHost = room.hostId === playerId;
  const playerList = Object.values(room.players);
  const canStart = isHost && playerList.length >= 2 && playerList.every(p => p.isReady || p.isHost);
  const currentMap = MAPS[room.mapId] || MAPS['school'];

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <button
              onClick={onLeaveRoom}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Leave Lobby
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              Room Lobby
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                {playerList.length}/{room.maxPlayers} Players
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 font-semibold uppercase">CODE:</span>
            <span className="text-lg font-mono font-bold tracking-wider text-indigo-400">{room.code}</span>
            <button
              onClick={copyRoomCode}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors ml-1"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copied && <span className="text-[10px] text-emerald-400 font-bold ml-1">COPIED!</span>}
          </div>
        </div>

        <div className="my-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-200">{currentMap.name}</h4>
              <p className="text-xs text-slate-400">{currentMap.description}</p>
            </div>
          </div>

          {isHost ? (
            <select
              value={room.mapId}
              onChange={(e) => onChangeMap(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-indigo-300 font-semibold outline-none cursor-pointer"
            >
              <option value="school">🏫 School</option>
              <option value="apartment">🏢 Apartment</option>
              <option value="warehouse">📦 Warehouse</option>
              <option value="campus">🌳 Campus</option>
            </select>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
              Selected by Host
            </span>
          )}
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Players in Room</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {playerList.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      {player.username}
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {player.id === playerId ? '(You)' : 'Player'}
                    </span>
                  </div>
                </div>

                <div>
                  {player.isHost ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      HOST
                    </span>
                  ) : player.isReady ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> READY
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> WAITING
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
          {!isHost && (
            <button
              onClick={onToggleReady}
              className={
                currentPlayer?.isReady
                  ? "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  : "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              }
            >
              <CheckCircle className="w-5 h-5" />
              {currentPlayer?.isReady ? 'CANCEL READY' : 'I AM READY'}
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01]"
            >
              <Play className="w-5 h-5 fill-white" /> START MATCH
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
