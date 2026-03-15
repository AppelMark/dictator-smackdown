export class ComboManager {
  private scene: Phaser.Scene;
  private currentCombo: number = 0;
  private maxComboThisFight: number = 0;
  private lastHitTime: number = 0;
  private breakTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  registerHit(): number {
    this.currentCombo++;

    if (this.currentCombo > this.maxComboThisFight) {
      this.maxComboThisFight = this.currentCombo;
    }

    if (this.breakTimer) {
      this.breakTimer.destroy();
    }

    this.breakTimer = this.scene.time.delayedCall(1500, () => {
      this.onBreakTimeout();
    });

    this.lastHitTime = Date.now();

    return this.currentCombo;
  }

  registerMiss(): void {
    if (this.currentCombo > 1) {
      this.scene.events.emit('combo_broken', this.currentCombo);
    }
    this.currentCombo = 0;
  }

  registerTakeDamage(): void {
    if (this.currentCombo > 1) {
      this.scene.events.emit('combo_broken', this.currentCombo);
    }
    this.currentCombo = 0;
  }

  getMultiplierIndex(): number {
    return Math.min(this.currentCombo, 4);
  }

  getComboCount(): number {
    return this.currentCombo;
  }

  getMaxCombo(): number {
    return this.maxComboThisFight;
  }

  getLastHitTime(): number {
    return this.lastHitTime;
  }

  private onBreakTimeout(): void {
    this.currentCombo = 0;
  }

  reset(): void {
    this.currentCombo = 0;
    this.maxComboThisFight = 0;

    if (this.breakTimer) {
      this.breakTimer.destroy();
      this.breakTimer = undefined;
    }
  }

  destroy(): void {
    this.reset();
  }
}
