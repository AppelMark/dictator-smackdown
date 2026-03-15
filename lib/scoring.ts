import type { BattleResult } from '../types/battle';
import { STAR_TWO_TIME_LIMIT } from '../game/constants';

export function calculateScore(result: BattleResult): number {
  return result.scoreBreakdown.totalScore;
}

export function calculateStars(result: BattleResult): number {
  let stars = 0;

  if (result.winner === 'player') {
    stars = 1;
    if (result.timeSeconds < STAR_TWO_TIME_LIMIT) {
      stars = 2;
    }
    if (result.tookNoDamage) {
      stars = 3;
    }
  }

  return stars;
}
