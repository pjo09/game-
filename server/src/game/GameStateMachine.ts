import { GamePhase } from './types.js';

export class GameStateMachine {
  private currentPhase: GamePhase = 'LOBBY';

  public get phase(): GamePhase {
    return this.currentPhase;
  }

  public canTransitionTo(nextPhase: GamePhase): boolean {
    switch (this.currentPhase) {
      case 'LOBBY':
        return nextPhase === 'COUNTDOWN';
      case 'COUNTDOWN':
        return nextPhase === 'SEEKER_STUNNED' || nextPhase === 'LOBBY';
      case 'SEEKER_STUNNED':
        return nextPhase === 'HIDE_AND_SEEK' || nextPhase === 'LOBBY';
      case 'HIDE_AND_SEEK':
        return nextPhase === 'GAME_OVER' || nextPhase === 'LOBBY';
      case 'GAME_OVER':
        return nextPhase === 'LOBBY' || nextPhase === 'COUNTDOWN';
      default:
        return false;
    }
  }

  public transitionTo(nextPhase: GamePhase): boolean {
    if (this.canTransitionTo(nextPhase)) {
      this.currentPhase = nextPhase;
      return true;
    }
    return false;
  }

  public reset(): void {
    this.currentPhase = 'LOBBY';
  }
}
