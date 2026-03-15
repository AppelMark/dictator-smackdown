import { COMBO_MULTIPLIERS } from '../constants';

export class ComboManager {
  private comboCount: number = 0;
  private maxCombo: number = 0;
  private lastHitTime: number = 0;
  private comboTimeout: number = 2000;

  getComboCount(): number {
    return this.comboCount;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getMultiplier(): number {
    const index = Math.min(this.comboCount, COMBO_MULTIPLIERS.length - 1);
    return COMBO_MULTIPLIERS[index];
  }

  registerHit(): number {
    const now = Date.now();
    if (now - this.lastHitTime > this.comboTimeout) {
      this.comboCount = 0;
    }
    this.comboCount++;
    this.lastHitTime = now;
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }
    return this.comboCount;
  }

  breakCombo(): void {
    this.comboCount = 0;
  }

  reset(): void {
    this.comboCount = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
  }
}
