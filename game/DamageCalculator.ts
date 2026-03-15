import type { PunchEvent, DamageResult } from '../types/battle';
import {
  PUNCH_DAMAGE,
  COMBO_MULTIPLIERS,
  COUNTER_DAMAGE_MULTIPLIER,
  MOMENTUM_HIGH_THRESHOLD,
  MOMENTUM_LOW_THRESHOLD,
  MOMENTUM_HIGH_MULTIPLIER,
  MOMENTUM_LOW_MULTIPLIER,
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
    const baseDamage = PUNCH_DAMAGE[punch.type];
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
      damage *= COUNTER_DAMAGE_MULTIPLIER;
    }

    let momentumMultiplier = 1.0;
    if (momentum > MOMENTUM_HIGH_THRESHOLD) {
      momentumMultiplier = MOMENTUM_HIGH_MULTIPLIER;
    } else if (momentum < MOMENTUM_LOW_THRESHOLD) {
      momentumMultiplier = MOMENTUM_LOW_MULTIPLIER;
    }
    damage *= momentumMultiplier;

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
