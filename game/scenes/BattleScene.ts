import { BattleState } from '../../types/battle';
import type { PunchEvent } from '../../types/battle';
import { TapZoneManager } from '../managers/TapZoneManager';

export class BattleScene extends Phaser.Scene {
  private playerHealth: number = 100;
  private aiHealth: number = 100;
  private playerStamina: number = 100;
  private playerMomentum: number = 50;
  private specialMeter: number = 0;
  private currentState: BattleState = BattleState.PlayerTurn;

  private tapZoneManager!: TapZoneManager;

  private player!: Phaser.GameObjects.Rectangle;
  private ai!: Phaser.GameObjects.Rectangle;
  private playerHealthBar!: Phaser.GameObjects.Rectangle;
  private aiHealthBar!: Phaser.GameObjects.Rectangle;
  private momentumBar!: Phaser.GameObjects.Rectangle;

  private isOver: boolean = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // --- Fighter blocks ---
    this.player = this.add.rectangle(100, 500, 80, 160, 0x3366ff);
    this.ai = this.add.rectangle(290, 500, 80, 160, 0xcc3333);

    // --- Health bar backgrounds ---
    this.add.rectangle(100, 40, 120, 14, 0x444444);
    this.add.rectangle(290, 40, 120, 14, 0x444444);

    // --- Health bar fills ---
    this.playerHealthBar = this.add.rectangle(100, 40, 120, 14, 0x33cc33);
    this.aiHealthBar = this.add.rectangle(290, 40, 120, 14, 0xcc3333);

    // --- Momentum bar ---
    this.momentumBar = this.add.rectangle(100, 58, 60, 6, 0xffcc00);

    // --- Input ---
    this.tapZoneManager = new TapZoneManager(this);

    // --- Punch event ---
    this.events.on('punch', (event: PunchEvent) => {
      if (this.currentState !== BattleState.PlayerTurn || this.isOver) return;

      const damage = Math.round(event.power * 15);
      this.aiHealth = Math.max(0, this.aiHealth - damage);

      const direction = event.direction === 'left' ? -25 : 25;
      this.tweens.add({
        targets: this.ai,
        x: this.ai.x + direction,
        duration: 75,
        yoyo: true,
        duration2: 75,
      });

      this.updateHealthBar(this.aiHealthBar, this.aiHealth, 100);
      this.checkKO();
    });

    // --- Dodge event ---
    this.events.on('dodge', (event: { direction: 'left' | 'right' }) => {
      if (this.isOver) return;

      const direction = event.direction === 'left' ? -30 : 30;
      this.tweens.add({
        targets: this.player,
        x: this.player.x + direction,
        duration: 100,
        yoyo: true,
      });
    });

    // --- Simple AI loop ---
    this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => {
        if (this.isOver) return;

        this.playerHealth = Math.max(0, this.playerHealth - 8);

        this.tweens.add({
          targets: this.player,
          x: this.player.x - 20,
          duration: 75,
          yoyo: true,
        });

        this.updateHealthBar(this.playerHealthBar, this.playerHealth, 100);
        this.checkKO();
      },
    });
  }

  private updateHealthBar(
    bar: Phaser.GameObjects.Rectangle,
    currentHealth: number,
    maxHealth: number
  ): void {
    const ratio = currentHealth / maxHealth;
    bar.setScale(ratio, 1);
  }

  private checkKO(): void {
    if (this.isOver) return;

    if (this.aiHealth <= 0) {
      this.isOver = true;
      this.currentState = BattleState.KO;
      this.add
        .text(195, 400, 'K.O.!', {
          fontSize: '72px',
          color: '#FFD700',
          fontFamily: 'Bebas Neue',
        })
        .setOrigin(0.5);
    } else if (this.playerHealth <= 0) {
      this.isOver = true;
      this.currentState = BattleState.Defeat;
      this.add
        .text(195, 400, 'DEFEAT', {
          fontSize: '72px',
          color: '#FF4444',
          fontFamily: 'Bebas Neue',
        })
        .setOrigin(0.5);
    }
  }

  shutdown(): void {
    this.tapZoneManager.destroy();
    this.events.removeAllListeners();
  }
}
