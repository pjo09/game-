export type GameRole = 'SEEKER' | 'HIDER';

export type GamePhase = 'LOBBY' | 'COUNTDOWN' | 'SEEKER_STUNNED' | 'HIDE_AND_SEEK' | 'GAME_OVER';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  username: string;
  role: GameRole;
  position: Vector3D;
  rotationY: number;
  score: number;
  isReady: boolean;
  isHost: boolean;
  isCaught: boolean;
  color: string;
  catchesCount: number;
  timeAsHider: number;
  timeAsSeeker: number;
}

export interface GameRoom {
  code: string;
  phase: GamePhase;
  mapId: string;
  players: Record<string, Player>;
  timeRemaining: number;
  seekerStunRemaining: number;
  hostId: string;
  maxPlayers: number;
  winner?: GameRole | 'DRAW';
}

export interface MovePayload {
  position: Vector3D;
  rotationY: number;
}

export interface CatchPayload {
  targetId: string;
}

export interface PlayerStats {
  player_id?: string;
  username: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  catches: number;
  times_caught: number;
  total_score: number;
  total_time_as_seeker: number;
  total_time_as_hider: number;
}
