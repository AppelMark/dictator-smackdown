import { TapZone, PunchType } from '../../types/battle';
import type { PunchEvent } from '../../types/battle';
import { TAP_ZONE_SPLIT, TAP_DOUBLE_WINDOW, TAP_HOLD_DURATION, TAP_COOLDOWN } from '../constants';

const SIMULTANEOUS_TAP_WINDOW = 100;
const SWIPE_UP_MIN_DELTA = 80;
const SWIPE_UP_MAX_DURATION = 250;

export class TapZoneManager {
  private scene: Phaser.Scene;
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private lastTapTime: number = 0;
  private lastTapZone?: TapZone;
  private cooldownActive: boolean = false;
  private holdTimer?: Phaser.Time.TimerEvent;
  private isHolding: boolean = false;
  private holdZone?: TapZone;
  private comboPosition: number = 0;

  // Simultaneous tap detection
  private pendingTap?: { zone: TapZone; time: number; power: number };
  private simultaneousTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.cooldownActive) return;

      this.startX = pointer.x;
      this.startY = pointer.y;
      this.startTime = Date.now();

      const zone: TapZone = pointer.x < TAP_ZONE_SPLIT ? TapZone.Left : TapZone.Right;
      this.holdZone = zone;

      // Long press = block
      this.holdTimer = this.scene.time.delayedCall(TAP_HOLD_DURATION, () => {
        this.isHolding = true;
        const hand: 'left' | 'right' = zone === TapZone.Left ? 'left' : 'right';
        this.scene.events.emit('block', { hand });
      });
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.holdTimer) {
        this.holdTimer.destroy();
        this.holdTimer = undefined;
      }

      if (this.isHolding) {
        this.isHolding = false;
        this.scene.events.emit('block_release', { hand: this.holdZone === TapZone.Left ? 'left' : 'right' });
        return;
      }

      const deltaX = pointer.x - this.startX;
      const deltaY = pointer.y - this.startY;
      const tapDuration = Date.now() - this.startTime;

      // --- Swipe left/right = dodge ---
      if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) && tapDuration < 200) {
        const direction: 'left' | 'right' = deltaX < 0 ? 'left' : 'right';
        this.scene.events.emit('dodge', { direction });
        this.startCooldown();
        return;
      }

      // --- Swipe up from bottom = body shot ---
      if (deltaY < -SWIPE_UP_MIN_DELTA && Math.abs(deltaY) > Math.abs(deltaX) && tapDuration < SWIPE_UP_MAX_DURATION) {
        const zone: TapZone = this.startX < TAP_ZONE_SPLIT ? TapZone.Left : TapZone.Right;
        const hand: 'left' | 'right' = zone === TapZone.Left ? 'left' : 'right';
        const power = Math.max(0.3, Math.min(1.0, 1.0 - tapDuration / 400));
        this.emitPunch(PunchType.Cross, hand, power);
        return;
      }

      // --- Tap detection ---
      const zone: TapZone = this.startX < TAP_ZONE_SPLIT ? TapZone.Left : TapZone.Right;
      const now = Date.now();
      const power = Math.max(0.3, Math.min(1.0, 1.0 - tapDuration / 400));

      // Check for simultaneous tap (uppercut)
      if (this.pendingTap && this.pendingTap.zone !== zone) {
        const elapsed = now - this.pendingTap.time;
        if (elapsed < SIMULTANEOUS_TAP_WINDOW) {
          // Both sides tapped — uppercut!
          this.simultaneousTimer?.destroy();
          this.pendingTap = undefined;
          const avgPower = (this.pendingTap ? power : power);
          this.emitPunch(PunchType.Uppercut, 'right', avgPower);
          return;
        }
      }

      // Check for double tap (hook)
      const isDoubleTap = this.lastTapZone === zone && (now - this.lastTapTime) < TAP_DOUBLE_WINDOW;

      if (isDoubleTap) {
        const hand: 'left' | 'right' = zone === TapZone.Left ? 'left' : 'right';
        this.emitPunch(PunchType.Hook, hand, power);
        this.lastTapZone = undefined;
        this.pendingTap = undefined;
        this.simultaneousTimer?.destroy();
        return;
      }

      // Store as pending tap — wait briefly for simultaneous tap
      this.pendingTap = { zone, time: now, power };
      this.simultaneousTimer = this.scene.time.delayedCall(SIMULTANEOUS_TAP_WINDOW, () => {
        if (!this.pendingTap) return;

        // No second tap arrived — emit jab
        const hand: 'left' | 'right' = this.pendingTap.zone === TapZone.Left ? 'left' : 'right';
        this.emitPunch(PunchType.Jab, hand, this.pendingTap.power);
        this.lastTapTime = this.pendingTap.time;
        this.lastTapZone = this.pendingTap.zone;
        this.pendingTap = undefined;
      });
    });
  }

  private emitPunch(type: PunchType, hand: 'left' | 'right', power: number): void {
    const punch: PunchEvent = {
      type,
      power,
      direction: hand,
      hand,
      comboPosition: this.comboPosition,
    };

    this.scene.events.emit('punch', punch);
    this.comboPosition++;
    this.startCooldown();
  }

  private startCooldown(): void {
    this.cooldownActive = true;
    this.scene.time.delayedCall(TAP_COOLDOWN, () => {
      this.cooldownActive = false;
    });
  }

  resetCombo(): void {
    this.comboPosition = 0;
  }

  destroy(): void {
    if (this.holdTimer) this.holdTimer.destroy();
    if (this.simultaneousTimer) this.simultaneousTimer.destroy();
    this.scene.input.removeAllListeners();
  }
}
