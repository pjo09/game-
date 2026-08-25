import { PlayerState, GameRole } from './types.js';

export class ScoringSystem {
  public static calculateTickScores(players: Record<string, PlayerState>, dtSec: number): void {
    for (const id of Object.keys(players)) {
      const p = players[id];
      if (p.role === 'HIDER' && !p.isCaught) {
        p.timeAsHider += dtSec;
        p.score += Math.round(dtSec * 10);
      } else if (p.role === 'SEEKER') {
        p.timeAsSeeker += dtSec;
      }
    }
  }

  public static awardCatchBonus(seeker: PlayerState, hider: PlayerState): void {
    seeker.catchesCount += 1;
    seeker.score += 250;
    hider.isCaught = true;
  }

  public static finalizeScores(players: Record<string, PlayerState>): GameRole | 'DRAW' {
    const activeHiders = Object.values(players).filter(p => p.role === 'HIDER' && !p.isCaught);
    if (activeHiders.length > 0) {
      for (const p of activeHiders) {
        p.score += 500;
      }
      return 'HIDER';
    } else {
      for (const p of Object.values(players)) {
        if (p.role === 'SEEKER') {
          p.score += 750;
        }
      }
      return 'SEEKER';
    }
  }
}
