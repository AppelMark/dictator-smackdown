import type { PunchEvent, DamageResult } from '../types/battle';
import type { CharacterStats } from '../types/character';
import {
  PUNCH_DAMAGE,
  COMBO_MULTIPLIERS,
  COUNTER_MULTIPLIER,
  MOMENTUM_HIGH_THRESHOLD,
  MOMENTUM_LOW_THRESHOLD,
  MOMENTUM_HIGH_BONUS,
  MOMENTUM_LOW_PENALTY,
  FACE_PART_THRESHOLDS,
} from './constants';

const HIT_PARTS: { name: string; weight: number }[] = [
  { name: 'head', weight: 40 },
  { name: 'jaw', weight: 15 },
  { name: 'nose', weight: 15 },
  { name: 'ear', weight: 15 },
  { name: 'eye', weight: 15 },
];

function pickWeightedHitPart(): string {
  const total = HIT_PARTS.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const part of HIT_PARTS) {
    roll -= part.weight;
    if (roll <= 0) return part.name;
  }
  return 'head';
}

const THRESHOLD_ENTRIES = Object.entries(FACE_PART_THRESHOLDS).sort(
  (a, b) => a[1] - b[1]
);

export class DamageCalculator {
  static calculate(
    punch: PunchEvent,
    attackerStats: CharacterStats,
    defenderStats: CharacterStats,
    isBlocked: boolean,
    isCounter: boolean,
    currentMomentum: number
  ): DamageResult {
    // 1. Base damage from constants
    const baseDamage = PUNCH_DAMAGE[punch.type] ?? 0;

    // 2. Multiply by punch power
    let damage = baseDamage * punch.power;

    // 3. Strength scaling
    damage *= attackerStats.strength / 80;

    // 4. Combo multiplier
    const multiplierIndex = Math.min(punch.comboPosition, 4);
    damage *= COMBO_MULTIPLIERS[multiplierIndex];

    // 5. Blocked reduction
    if (isBlocked) {
      damage *= 1 - defenderStats.defense / 200;
      damage = Math.max(1, damage);
    }

    // 6. Counter multiplier
    if (isCounter) {
      damage *= COUNTER_MULTIPLIER;
    }

    // 7. Momentum bonus/penalty
    if (currentMomentum > MOMENTUM_HIGH_THRESHOLD) {
      damage *= 1 + MOMENTUM_HIGH_BONUS;
    } else if (currentMomentum < MOMENTUM_LOW_THRESHOLD) {
      damage *= 1 - MOMENTUM_LOW_PENALTY;
    }

    // 8. Round and enforce minimum
    let finalDamage = Math.round(damage);
    if (!isBlocked) {
      finalDamage = Math.max(1, finalDamage);
    }

    // 9. Critical check
    const isCritical = finalDamage > baseDamage * 2;

    // 10. Hit part (weighted random)
    const hitPart = pickWeightedHitPart();

    // 11. Detachment check
    const healthBefore = defenderStats.health;
    const healthAfter = Math.max(0, healthBefore - finalDamage);
    const lossBefore = 1 - healthBefore / defenderStats.maxHealth;
    const lossAfter = 1 - healthAfter / defenderStats.maxHealth;

    let triggerDetach = false;
    let partName: string | undefined;

    for (const [part, threshold] of THRESHOLD_ENTRIES) {
      if (lossBefore < threshold && lossAfter >= threshold) {
        triggerDetach = true;
        partName = part;
        break;
      }
    }

    return {
      damage: finalDamage,
      isBlocked,
      hitPart,
      triggerDetach,
      partName,
      isCounter,
      isCritical,
    };
  }
}
