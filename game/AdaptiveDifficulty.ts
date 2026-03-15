interface DifficultyState {
  winRate: number;
  totalFights: number;
  consecutiveLosses: number;
  consecutiveWins: number;
}

export class AdaptiveDifficulty {
  private state: DifficultyState;

  constructor() {
    this.state = {
      winRate: 0.5,
      totalFights: 0,
      consecutiveLosses: 0,
      consecutiveWins: 0,
    };
  }

  recordResult(won: boolean): void {
    this.state.totalFights++;
    if (won) {
      this.state.consecutiveWins++;
      this.state.consecutiveLosses = 0;
    } else {
      this.state.consecutiveLosses++;
      this.state.consecutiveWins = 0;
    }
    this.state.winRate =
      (this.state.winRate * (this.state.totalFights - 1) + (won ? 1 : 0)) /
      this.state.totalFights;
  }

  getAIDamageMultiplier(): number {
    if (this.state.consecutiveLosses >= 3) return 0.75;
    if (this.state.consecutiveLosses >= 2) return 0.85;
    if (this.state.consecutiveWins >= 5) return 1.15;
    if (this.state.winRate > 0.8 && this.state.totalFights >= 5) return 1.1;
    return 1.0;
  }

  getAIReactionSpeedMultiplier(): number {
    if (this.state.consecutiveLosses >= 3) return 1.3;
    if (this.state.consecutiveLosses >= 2) return 1.15;
    if (this.state.consecutiveWins >= 5) return 0.85;
    return 1.0;
  }

  getState(): DifficultyState {
    return { ...this.state };
  }
}
