export type GameRole = 'SEEKER' | 'HIDER';

export type GamePhase = 'LOBBY' | 'COUNTDOWN' | 'SEEKER_STUNNED' | 'HIDE_AND_SEEK' | 'GAME_OVER';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  socketId: string;
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
  lastMoveTimestamp: number;
}

export interface GameRoomState {
  code: string;
  phase: GamePhase;
  mapId: string;
  players: Record<string, PlayerState>;
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
