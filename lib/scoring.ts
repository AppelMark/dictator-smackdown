import type { BattleResult } from '../types/battle';
import { STAR_TIME_THRESHOLD_SECONDS } from '../game/constants';

export function calculateScore(result: BattleResult): number {
  return result.scoreBreakdown.totalScore;
}

export function calculateStars(result: BattleResult): number {
  let stars = 0;

  if (result.winner === 'player') {
    stars = 1;
    if (result.timeSeconds < STAR_TIME_THRESHOLD_SECONDS) {
      stars = 2;
    }
    if (result.tookNoDamage) {
      stars = 3;
    }
  }

  return stars;
}
