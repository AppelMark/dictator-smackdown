import { PunchType, type AIStyle } from '../../types/character';
import type { PunchEvent } from '../../types/battle';
import { TELEGRAPH_DURATION_MS } from '../constants';

interface AIAction {
  type: PunchType;
  delay: number;
}

export class AIOpponent {
  private scene: Phaser.Scene;
  private style: AIStyle;
  private lastPlayerMoves: PunchType[] = [];
  private attackTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, style: AIStyle) {
    this.scene = scene;
    this.style = style;
  }

  startAI(): void {
    this.scheduleNextAttack();
  }

  recordPlayerMove(type: PunchType): void {
    this.lastPlayerMoves.push(type);
    if (this.lastPlayerMoves.length > 5) {
      this.lastPlayerMoves.shift();
    }
  }

  private scheduleNextAttack(): void {
    const action = this.decideAction();
    this.attackTimer = this.scene.time.delayedCall(action.delay, () => {
      this.telegraph(action.type);
    });
  }

  private decideAction(): AIAction {
    switch (this.style) {
      case 'berserker':
        return {
          type: Math.random() > 0.4 ? PunchType.Uppercut : PunchType.Hook,
          delay: 1500 + Math.random() * 1000,
        };
      case 'chaotic':
        return {
          type: this.randomPunchType(),
          delay: 500 + Math.random() * 2000,
        };
      case 'speedster':
        return {
          type: Math.random() > 0.5 ? PunchType.Jab : PunchType.Cross,
          delay: 400 + Math.random() * 600,
        };
      case 'defensive':
        return {
          type: PunchType.Jab,
          delay: 2000 + Math.random() * 1500,
        };
      case 'counter':
        return {
          type: this.counterPlayerPattern(),
          delay: 800 + Math.random() * 1200,
        };
      case 'boss':
        return {
          type: Math.random() > 0.2 ? PunchType.Hook : PunchType.Special,
          delay: 2000 + Math.random() * 1500,
        };
    }
  }

  private telegraph(punchType: PunchType): void {
    this.scene.events.emit('ai_telegraph', { type: punchType });

    this.scene.time.delayedCall(TELEGRAPH_DURATION_MS, () => {
      const punch: PunchEvent = {
        type: punchType,
        power: 0.8 + Math.random() * 0.2,
        timestamp: Date.now(),
        isCounter: false,
        comboPosition: 0,
      };
      this.scene.events.emit('ai_punch', punch);
      this.scheduleNextAttack();
    });
  }

  private randomPunchType(): PunchType {
    const types = [PunchType.Jab, PunchType.Cross, PunchType.Hook, PunchType.Uppercut];
    return types[Math.floor(Math.random() * types.length)];
  }

  private counterPlayerPattern(): PunchType {
    if (this.lastPlayerMoves.length < 3) return this.randomPunchType();

    const last = this.lastPlayerMoves[this.lastPlayerMoves.length - 1];
    const repeated = this.lastPlayerMoves.filter((m) => m === last).length;

    if (repeated >= 3) {
      return PunchType.Uppercut;
    }
    return this.randomPunchType();
  }

  stopAI(): void {
    this.attackTimer?.destroy();
  }

  destroy(): void {
    this.stopAI();
  }
}
