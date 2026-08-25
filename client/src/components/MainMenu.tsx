import React, { useState, useEffect } from 'react';
import { Play, Users, Trophy, HelpCircle, Shield, Sparkles } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { PlayerStats } from '../types';

interface MainMenuProps {
  username: string;
  setUsername: (name: string) => void;
  onCreateRoom: (mapId: string) => void;
  onJoinRoom: (code: string) => void;
  error?: string | null;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const MainMenu: React.FC<MainMenuProps> = ({
  username,
  setUsername,
  onCreateRoom,
  onJoinRoom,
  error,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMap, setSelectedMap] = useState('school');
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard' | 'rules'>('play');
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (activeTab === 'leaderboard' && supabase) {
      setIsLoadingLeaderboard(true);
      supabase
        .from('player_stats')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(10)
        .then(({ data, error }) => {
          if (!error && data) {
            setLeaderboard(data as PlayerStats[]);
          }
          setIsLoadingLeaderboard(false);
        });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 3D Real-Time Hide & Seek
          </div>
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-red-400">
            HIDEOUT
          </h1>
          <p className="text-slate-400 text-sm mt-1">Outsmart the Seeker or catch all Hiders before time runs out!</p>
        </div>

        <div className="flex bg-slate-900/60 p-1.5 rounded-xl mb-6 border border-slate-800">
          <button
            onClick={() => setActiveTab('play')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'play' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" /> Play Game
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" /> Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Rules
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {activeTab === 'play' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Player Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                maxLength={16}
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select 3D Map
              </label>
              <select
                value={selectedMap}
                onChange={(e) => setSelectedMap(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none cursor-pointer"
              >
                <option value="school">🏫 Abandoned School</option>
                <option value="apartment">🏢 Apartment Complex</option>
                <option value="warehouse">📦 Industrial Warehouse</option>
                <option value="campus">🌳 University Campus</option>
              </select>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onCreateRoom(selectedMap)}
                disabled={!username.trim()}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Users className="w-4 h-4" /> Create Room
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="5-CHAR CODE"
                  maxLength={5}
                  className="w-2/3 bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 text-center uppercase tracking-widest font-mono text-white placeholder-slate-500 outline-none"
                />
                <button
                  onClick={() => onJoinRoom(roomCodeInput)}
                  disabled={!username.trim() || roomCodeInput.length !== 5}
                  className="w-1/3 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Global Top Players
            </h3>
            {isLoadingLeaderboard ? (
              <div className="text-center py-8 text-slate-500 animate-pulse">Loading Leaderboard...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No scores recorded yet. Be the first!</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {leaderboard.map((player, idx) => (
                  <div
                    key={player.username}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-500 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm text-slate-200">{player.username}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-400 text-sm">{player.total_score} pts</span>
                      <span className="text-xs text-slate-500 block">{player.catches} catches</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-400 block mb-0.5">Objective & Roles</strong>
                2 to 7 players per room. One player starts as Seeker; the rest are Hiders. Hiders get a 15-second head start to hide in 3D cover.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Sparkles className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-400 block mb-0.5">Role Swapping Mechanics</strong>
                Seeker must chase and tag a Hider within 3 meters. Tagging immediately swaps roles: Seeker becomes Hider, Hider becomes Seeker!
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400 block mb-0.5">Controls</strong>
                PC: WASD / Arrow keys for movement + Mouse Look. <br />
                Mobile: Virtual Joystick + On-screen TAG button.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
