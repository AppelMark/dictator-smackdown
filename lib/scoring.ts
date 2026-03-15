import type { BattleResult } from '../types/battle';
import { STAR_TIME_THRESHOLD_SECONDS } from '../game/constants';

export function calculateScore(result: BattleResult): number {
  let score = result.damageDealt * 10;
  score += result.maxCombo * 50;
  score += result.dodgesSuccessful * 25;
  score += result.countersLanded * 100;
  score += result.perfectDodges * 75;

  if (result.timeSeconds < STAR_TIME_THRESHOLD_SECONDS) {
    score *= 1.2;
  }

  if (result.damageTaken === 0) {
    score *= 1.5;
  }

  return Math.round(score);
}

export function calculateStars(result: BattleResult): number {
  let stars = 0;

  if (result.won) {
    stars = 1;
    if (result.timeSeconds < STAR_TIME_THRESHOLD_SECONDS) {
      stars = 2;
    }
    if (result.damageTaken === 0) {
      stars = 3;
    }
  }

  return stars;
}
