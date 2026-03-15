import { PunchType } from '../../types/battle';
import type { PunchEvent } from '../../types/battle';
import {
  COOLDOWN_BETWEEN_PUNCHES_MS,
  DOUBLE_TAP_THRESHOLD_MS,
  LONG_PRESS_THRESHOLD_MS,
  DODGE_MIN_DELTA_X,
  DODGE_MAX_DURATION_MS,
} from '../constants';

/** Locally defined since DodgeEvent was removed from the types. */
interface DodgeEvent {
  direction: 'left' | 'right';
  timestamp: number;
  successful: boolean;
}

export class TapZoneManager {
  private scene: Phaser.Scene;
  private lastTapTime: number = 0;
  private lastTapSide: 'left' | 'right' | null = null;
  private pointerDownTime: number = 0;
  private pointerDownX: number = 0;
  private comboPosition: number = 0;
  private lastPunchTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInput();
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerDownTime = pointer.downTime;
      this.pointerDownX = pointer.x;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const now = Date.now();
      if (now - this.lastPunchTime < COOLDOWN_BETWEEN_PUNCHES_MS) return;

      const deltaX = pointer.x - this.pointerDownX;
      const duration = pointer.upTime - pointer.downTime;

      if (Math.abs(deltaX) > DODGE_MIN_DELTA_X && duration < DODGE_MAX_DURATION_MS) {
        this.emitDodge(deltaX < 0 ? 'left' : 'right');
        return;
      }

      if (duration >= LONG_PRESS_THRESHOLD_MS) {
        this.emitPunch(PunchType.Special, duration);
        return;
      }

      const side: 'left' | 'right' =
        pointer.x < this.scene.cameras.main.width / 2 ? 'left' : 'right';

      const isDoubleTap =
        this.lastTapSide === side &&
        now - this.lastTapTime < DOUBLE_TAP_THRESHOLD_MS;

      if (isDoubleTap) {
        const punchType = side === 'left' ? PunchType.Cross : PunchType.Uppercut;
        this.emitPunch(punchType, duration);
        this.lastTapSide = null;
      } else {
        const punchType = side === 'left' ? PunchType.Jab : PunchType.Hook;
        this.emitPunch(punchType, duration);
        this.lastTapSide = side;
        this.lastTapTime = now;
      }
    });
  }

  private emitPunch(type: PunchType, tapDuration: number): void {
    const power = Math.max(0.3, Math.min(1.0, 1.0 - tapDuration / 400));
    const side: 'left' | 'right' = type === PunchType.Jab || type === PunchType.Cross ? 'left' : 'right';
    const punch: PunchEvent = {
      type,
      power,
      direction: side,
      comboPosition: this.comboPosition,
    };
    this.comboPosition++;
    this.lastPunchTime = Date.now();
    this.scene.events.emit('punch', punch);
  }

  private emitDodge(direction: 'left' | 'right'): void {
    const dodge: DodgeEvent = {
      direction,
      timestamp: Date.now(),
      successful: false,
    };
    this.scene.events.emit('dodge', dodge);
  }

  resetCombo(): void {
    this.comboPosition = 0;
  }

  destroy(): void {
    this.scene.input.removeAllListeners();
  }
}
