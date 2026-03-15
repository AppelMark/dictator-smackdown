import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

interface HUDData {
  playerHealth: number;
  playerMaxHealth: number;
  opponentHealth: number;
  opponentMaxHealth: number;
  comboCount: number;
  momentum: number;
  timeElapsed: number;
  score: number;
  specialMeter?: number;
}

const BAR_WIDTH = 200;
const BAR_HEIGHT = 16;

function healthColor(ratio: number): number {
  if (ratio > 0.6) {
    const t = (ratio - 0.6) / 0.4;
    const r = Math.round(255 * (1 - t));
    return (r << 16) | (255 << 8) | 0;
  }
  const t = ratio / 0.6;
  return (255 << 16) | (Math.round(255 * t) << 8) | 0;
}

export class HUDScene extends Phaser.Scene {
  // AI health bar (top center)
  private aiBarBg!: Phaser.GameObjects.Rectangle;
  private aiBarFill!: Phaser.GameObjects.Rectangle;
  private aiBarFlash!: Phaser.GameObjects.Rectangle;
  private aiNameText!: Phaser.GameObjects.Text;

  // Player health bar (bottom center)
  private playerBarBg!: Phaser.GameObjects.Rectangle;
  private playerBarFill!: Phaser.GameObjects.Rectangle;
  private playerBarFlash!: Phaser.GameObjects.Rectangle;
  private playerNameText!: Phaser.GameObjects.Text;

  // Timer
  private timerText!: Phaser.GameObjects.Text;

  // Combo
  private comboText!: Phaser.GameObjects.Text;
  private comboHideTimer?: Phaser.Time.TimerEvent;

  // Momentum
  private momentumGfx!: Phaser.GameObjects.Graphics;

  // Special meter
  private specialBarBg!: Phaser.GameObjects.Rectangle;
  private specialBarFill!: Phaser.GameObjects.Rectangle;
  private specialLabel!: Phaser.GameObjects.Text;
  private specialGlowTween?: Phaser.Tweens.Tween;
  private specialPulseTween?: Phaser.Tweens.Tween;

  // Controls overlay
  private controlsOverlay?: Phaser.GameObjects.Container;
  private controlsVisible: boolean = false;

  // Previous values
  private prevPlayerHealth: number = 1;
  private prevAIHealth: number = 1;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // ---- AI health bar (top center) ----
    const aiBarY = 30;

    this.aiNameText = this.add
      .text(cx, aiBarY - 14, 'ENEMY', {
        fontSize: '10px',
        color: '#AAAAAA',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(60);

    this.aiBarBg = this.add
      .rectangle(cx, aiBarY, BAR_WIDTH, BAR_HEIGHT, 0x333333)
      .setDepth(60);

    this.aiBarFill = this.add
      .rectangle(cx - BAR_WIDTH / 2, aiBarY, BAR_WIDTH, BAR_HEIGHT, 0xcc3333)
      .setOrigin(0, 0.5)
      .setDepth(61);

    this.aiBarFlash = this.add
      .rectangle(cx - BAR_WIDTH / 2, aiBarY, BAR_WIDTH, BAR_HEIGHT, 0xffffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setDepth(62);

    // ---- Player health bar (bottom center) ----
    const playerBarY = GAME_HEIGHT - 50;

    this.playerNameText = this.add
      .text(cx, playerBarY - 14, 'YOU', {
        fontSize: '10px',
        color: '#AAAAAA',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(60);

    this.playerBarBg = this.add
      .rectangle(cx, playerBarY, BAR_WIDTH, BAR_HEIGHT, 0x333333)
      .setDepth(60);

    this.playerBarFill = this.add
      .rectangle(cx - BAR_WIDTH / 2, playerBarY, BAR_WIDTH, BAR_HEIGHT, 0x33cc33)
      .setOrigin(0, 0.5)
      .setDepth(61);

    this.playerBarFlash = this.add
      .rectangle(cx - BAR_WIDTH / 2, playerBarY, BAR_WIDTH, BAR_HEIGHT, 0xffffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setDepth(62);

    // ---- Timer (top right) ----
    this.timerText = this.add
      .text(GAME_WIDTH - 16, 10, '0:00', {
        fontSize: '18px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(60);

    // ---- Combo text (center) ----
    this.comboText = this.add
      .text(cx, GAME_HEIGHT * 0.55, '', {
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(60);

    // ---- Momentum indicator (under AI health bar) ----
    this.momentumGfx = this.add.graphics().setDepth(60);
    this.drawMomentum(50);

    // ---- Special meter (above player health bar) ----
    const specialY = playerBarY - 30;
    const specialWidth = 120;

    this.specialBarBg = this.add
      .rectangle(cx, specialY, specialWidth, 8, 0x333333)
      .setDepth(60);

    this.specialBarFill = this.add
      .rectangle(cx - specialWidth / 2, specialY, 0, 8, 0xFFD700)
      .setOrigin(0, 0.5)
      .setDepth(61);

    this.specialLabel = this.add
      .text(cx, specialY - 12, 'SPECIAL', {
        fontSize: '9px',
        color: '#666666',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60);

    // ---- Help button ----
    const helpText = this.add
      .text(16, 10, '?', {
        fontSize: '18px',
        color: '#555555',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#222222',
        padding: { x: 6, y: 3 },
      })
      .setDepth(70)
      .setInteractive({ useHandCursor: true });

    helpText.on('pointerdown', () => this.toggleControls());

    // ---- Listen for HUD updates ----
    this.game.events.on('hud_update', this.onHUDUpdate, this);
  }

  // ============================================================
  // HUD Update
  // ============================================================

  private onHUDUpdate(data: HUDData): void {
    const playerRatio = data.playerHealth / data.playerMaxHealth;
    const aiRatio = data.opponentHealth / data.opponentMaxHealth;

    if (playerRatio !== this.prevPlayerHealth) {
      this.tweenHealthBar(this.playerBarFill, playerRatio);
      this.playerBarFill.setFillStyle(healthColor(playerRatio));
      if (playerRatio < this.prevPlayerHealth) this.flashBar(this.playerBarFlash);
      this.prevPlayerHealth = playerRatio;
    }

    if (aiRatio !== this.prevAIHealth) {
      this.tweenHealthBar(this.aiBarFill, aiRatio);
      this.aiBarFill.setFillStyle(healthColor(aiRatio));
      if (aiRatio < this.prevAIHealth) this.flashBar(this.aiBarFlash);
      this.prevAIHealth = aiRatio;
    }

    // Timer
    const minutes = Math.floor(data.timeElapsed / 60);
    const seconds = Math.floor(data.timeElapsed % 60);
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Combo
    if (data.comboCount > 1) {
      this.comboText.setText(`${data.comboCount}x COMBO`);
      this.comboText.setAlpha(1);

      this.comboHideTimer?.destroy();
      this.comboHideTimer = this.time.delayedCall(2000, () => {
        this.tweens.add({
          targets: this.comboText,
          alpha: 0,
          duration: 300,
        });
      });
    } else {
      this.comboText.setAlpha(0);
    }

    // Momentum
    this.drawMomentum(data.momentum);

    // Special meter
    const meter = data.specialMeter ?? 0;
    const specialWidth = 120;
    const fillWidth = (meter / 100) * specialWidth;

    this.tweens.killTweensOf(this.specialBarFill);
    this.tweens.add({
      targets: this.specialBarFill,
      width: fillWidth,
      duration: 150,
    });

    if (meter >= 80 && !this.specialGlowTween) {
      this.specialGlowTween = this.tweens.add({
        targets: this.specialBarFill,
        alpha: { from: 1, to: 0.5 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
      this.specialLabel.setColor('#FFD700');
    } else if (meter < 80 && this.specialGlowTween) {
      this.specialGlowTween.stop();
      this.specialGlowTween = undefined;
      this.specialBarFill.setAlpha(1);
      this.specialLabel.setColor('#666666');
    }

    if (meter >= 100 && !this.specialPulseTween) {
      this.specialPulseTween = this.tweens.add({
        targets: this.specialLabel,
        scale: { from: 1.0, to: 1.3 },
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    } else if (meter < 100 && this.specialPulseTween) {
      this.specialPulseTween.stop();
      this.specialPulseTween = undefined;
      this.specialLabel.setScale(1);
    }
  }

  // ============================================================
  // Health bar helpers
  // ============================================================

  private tweenHealthBar(
    bar: Phaser.GameObjects.Rectangle,
    ratio: number
  ): void {
    this.tweens.killTweensOf(bar);
    this.tweens.add({
      targets: bar,
      width: BAR_WIDTH * Math.max(0, ratio),
      duration: 200,
      ease: 'Power2',
    });
  }

  private flashBar(flash: Phaser.GameObjects.Rectangle): void {
    flash.setAlpha(0.6);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
    });
  }

  // ============================================================
  // Momentum (small arc under AI bar)
  // ============================================================

  private drawMomentum(momentum: number): void {
    this.momentumGfx.clear();

    const cx = GAME_WIDTH / 2;
    const cy = 52;
    const radius = 14;
    const ratio = momentum / 100;

    this.momentumGfx.lineStyle(3, 0x333333, 1);
    this.momentumGfx.beginPath();
    this.momentumGfx.arc(cx, cy, radius, Math.PI, 0, false);
    this.momentumGfx.strokePath();

    const fillAngle = Math.PI + ratio * Math.PI;
    const color = momentum > 70 ? 0xFFD700 : momentum < 30 ? 0xFF4444 : 0x888888;
    this.momentumGfx.lineStyle(3, color, 1);
    this.momentumGfx.beginPath();
    this.momentumGfx.arc(cx, cy, radius, Math.PI, fillAngle, false);
    this.momentumGfx.strokePath();
  }

  // ============================================================
  // Controls overlay
  // ============================================================

  private toggleControls(): void {
    if (this.controlsVisible) {
      this.controlsOverlay?.destroy();
      this.controlsOverlay = undefined;
      this.controlsVisible = false;
      return;
    }

    this.controlsVisible = true;
    this.controlsOverlay = this.add.container(0, 0).setDepth(90);

    const bg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setAlpha(0.85);
    this.controlsOverlay.add(bg);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'CONTROLS', {
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.controlsOverlay.add(title);

    const lines = [
      'Tap LEFT side = Jab',
      'Tap RIGHT side = Hook',
      'Double tap LEFT = Cross',
      'Double tap RIGHT = Uppercut',
      'Swipe LEFT/RIGHT = Dodge',
      'Hold = Charge Special',
      '',
      'Short tap = More power',
      'Dodge during red glow = Counter!',
    ];

    lines.forEach((line, i) => {
      const text = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3 + i * 32, line, {
          fontSize: '15px',
          color: line === '' ? '#000' : '#CCCCCC',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);
      this.controlsOverlay!.add(text);
    });

    const closeText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 'Tap anywhere to close', {
        fontSize: '13px',
        color: '#666666',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    this.controlsOverlay.add(closeText);

    bg.setInteractive();
    bg.once('pointerdown', () => this.toggleControls());
  }

  // ============================================================
  // Cleanup
  // ============================================================

  shutdown(): void {
    this.game.events.off('hud_update', this.onHUDUpdate, this);
    this.comboHideTimer?.destroy();
    this.specialGlowTween?.stop();
    this.specialPulseTween?.stop();
    this.controlsOverlay?.destroy();
    this.events.removeAllListeners();
  }
}
