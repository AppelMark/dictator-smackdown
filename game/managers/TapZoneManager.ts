import { TapZone, PunchType } from '../../types/battle';
import type { PunchEvent } from '../../types/battle';
import { TAP_ZONE_SPLIT, TAP_DOUBLE_WINDOW, TAP_HOLD_DURATION, TAP_COOLDOWN } from '../constants';

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
  private comboPosition: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.cooldownActive) return;

      this.startX = pointer.x;
      this.startY = pointer.y;
      this.startTime = Date.now();

      this.holdTimer = this.scene.time.delayedCall(TAP_HOLD_DURATION, () => {
        this.isHolding = true;
        this.scene.events.emit('special_charge');
      });
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.holdTimer) {
        this.holdTimer.destroy();
        this.holdTimer = undefined;
      }

      if (this.isHolding) {
        this.isHolding = false;
        return;
      }

      const deltaX = pointer.x - this.startX;
      const deltaY = pointer.y - this.startY;
      const tapDuration = Date.now() - this.startTime;

      if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) && tapDuration < 200) {
        const direction: 'left' | 'right' = deltaX < 0 ? 'left' : 'right';
        this.scene.events.emit('dodge', { direction });
        this.startCooldown();
        return;
      }

      const zone: TapZone = this.startX < TAP_ZONE_SPLIT ? TapZone.Left : TapZone.Right;
      const now = Date.now();
      const timeSinceLastTap = now - this.lastTapTime;
      const isDoubleTap = this.lastTapZone === zone && timeSinceLastTap < TAP_DOUBLE_WINDOW;

      let punchType: PunchType;

      if (zone === TapZone.Left) {
        punchType = isDoubleTap ? PunchType.Cross : PunchType.Jab;
      } else {
        punchType = isDoubleTap ? PunchType.Uppercut : PunchType.Hook;
      }

      const power = Math.max(0.3, Math.min(1.0, 1.0 - tapDuration / 400));
      const direction: 'left' | 'right' = zone === TapZone.Left ? 'left' : 'right';

      const punch: PunchEvent = {
        type: punchType,
        power,
        direction,
        comboPosition: this.comboPosition,
      };

      this.scene.events.emit('punch', punch);
      this.comboPosition++;
      this.lastTapTime = now;
      this.lastTapZone = zone;
      this.startCooldown();
    });
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
    if (this.holdTimer) {
      this.holdTimer.destroy();
    }
    this.scene.input.removeAllListeners();
  }
}
