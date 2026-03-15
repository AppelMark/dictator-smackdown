import type { PunchEvent, DamageResult } from '../types/battle';
import {
  PUNCH_DAMAGE,
  COMBO_MULTIPLIERS,
  COUNTER_MULTIPLIER,
  MOMENTUM_HIGH_THRESHOLD,
  MOMENTUM_LOW_THRESHOLD,
  MOMENTUM_HIGH_BONUS,
  MOMENTUM_LOW_PENALTY,
} from './constants';

export class DamageCalculator {
  static calculate(
    punch: PunchEvent,
    attackerStrength: number,
    defenderDefense: number,
    momentum: number,
    isBlocked: boolean,
    isCounter: boolean = false
  ): DamageResult {
    const baseDamage = PUNCH_DAMAGE[punch.type] ?? 0;
    let damage = baseDamage * punch.power;
    damage *= attackerStrength / 80;

    const comboIndex = Math.min(punch.comboPosition, COMBO_MULTIPLIERS.length - 1);
    const comboMultiplier = COMBO_MULTIPLIERS[comboIndex];
    damage *= comboMultiplier;

    if (isBlocked) {
      damage *= 1 - defenderDefense / 200;
      damage = Math.max(1, damage);
    }

    if (isCounter) {
      damage *= COUNTER_MULTIPLIER;
    }

    if (momentum > MOMENTUM_HIGH_THRESHOLD) {
      damage *= 1 + MOMENTUM_HIGH_BONUS;
    } else if (momentum < MOMENTUM_LOW_THRESHOLD) {
      damage *= 1 - MOMENTUM_LOW_PENALTY;
    }

    const finalDamage = Math.max(1, Math.round(damage));

    return {
      damage: finalDamage,
      isBlocked,
      hitPart: 'body',
      triggerDetach: false,
      isCritical: finalDamage > baseDamage * 2,
      isCounter,
    };
  }
}
