import { GAME_WIDTH, TAP_ZONE_SPLIT } from '../constants';

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

const BAR_WIDTH = 150;
const BAR_HEIGHT = 16;
const BAR_Y = 40;
const PLAYER_BAR_X = 20;
const AI_BAR_X = GAME_WIDTH / 2 + 20;

function healthColor(ratio: number): number {
  if (ratio > 0.6) {
    // Green to yellow
    const t = (ratio - 0.6) / 0.4;
    const r = Math.round(255 * (1 - t));
    const g = 255;
    return (r << 16) | (g << 8) | 0;
  }
  // Yellow to red
  const t = ratio / 0.6;
  const r = 255;
  const g = Math.round(255 * t);
  return (r << 16) | (g << 8) | 0;
}

export class HUDScene extends Phaser.Scene {
  // Health bars
  private playerBarBg!: Phaser.GameObjects.Rectangle;
  private playerBarFill!: Phaser.GameObjects.Rectangle;
  private playerBarFlash!: Phaser.GameObjects.Rectangle;
  private aiBarBg!: Phaser.GameObjects.Rectangle;
  private aiBarFill!: Phaser.GameObjects.Rectangle;
  private aiBarFlash!: Phaser.GameObjects.Rectangle;

  private playerNameText!: Phaser.GameObjects.Text;
  private aiNameText!: Phaser.GameObjects.Text;

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

  // Track previous values for tween
  private prevPlayerHealth: number = 1;
  private prevAIHealth: number = 1;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    // ---- Player health bar (left) ----
    this.playerNameText = this.add
      .text(PLAYER_BAR_X, BAR_Y - 14, 'YOU', {
        fontSize: '10px',
        color: '#AAAAAA',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setDepth(60);

    this.playerBarBg = this.add
      .rectangle(PLAYER_BAR_X + BAR_WIDTH / 2, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0x333333)
      .setDepth(60);

    this.playerBarFill = this.add
      .rectangle(PLAYER_BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0x33cc33)
      .setOrigin(0, 0.5)
      .setDepth(61);

    this.playerBarFlash = this.add
      .rectangle(PLAYER_BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0xffffff)
      .setOrigin(0, 0.5)
      .setAlpha(0)
      .setDepth(62);

    // ---- AI health bar (right, mirrored) ----
    this.aiNameText = this.add
      .text(GAME_WIDTH - 16, BAR_Y - 14, 'ENEMY', {
        fontSize: '10px',
        color: '#AAAAAA',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(60);

    this.aiBarBg = this.add
      .rectangle(AI_BAR_X + BAR_WIDTH / 2, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0x333333)
      .setDepth(60);

    this.aiBarFill = this.add
      .rectangle(AI_BAR_X + BAR_WIDTH, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0xcc3333)
      .setOrigin(1, 0.5)
      .setDepth(61);

    this.aiBarFlash = this.add
      .rectangle(AI_BAR_X + BAR_WIDTH, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 0xffffff)
      .setOrigin(1, 0.5)
      .setAlpha(0)
      .setDepth(62);

    // ---- Timer (center top) ----
    this.timerText = this.add
      .text(GAME_WIDTH / 2, 16, '0:00', {
        fontSize: '20px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(60);

    // ---- Combo text (right center) ----
    this.comboText = this.add
      .text(GAME_WIDTH - 20, 200, '', {
        fontSize: '24px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5)
      .setAlpha(0)
      .setDepth(60);

    // ---- Momentum indicator (half-circle under player bar) ----
    this.momentumGfx = this.add.graphics().setDepth(60);
    this.drawMomentum(50);

    // ---- Special meter (bottom center) ----
    const specialY = 800;
    const specialWidth = 160;

    this.specialBarBg = this.add
      .rectangle(GAME_WIDTH / 2, specialY, specialWidth, 10, 0x333333)
      .setDepth(60);

    this.specialBarFill = this.add
      .rectangle(GAME_WIDTH / 2 - specialWidth / 2, specialY, 0, 10, 0xFFD700)
      .setOrigin(0, 0.5)
      .setDepth(61);

    this.specialLabel = this.add
      .text(GAME_WIDTH / 2, specialY - 14, 'SPECIAL', {
        fontSize: '11px',
        color: '#666666',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60);

    // ---- Tap zone indicators (subtle) ----
    this.add
      .rectangle(TAP_ZONE_SPLIT / 2, 750, TAP_ZONE_SPLIT - 20, 60, 0x3366ff)
      .setAlpha(0.06)
      .setDepth(55);

    this.add
      .rectangle(TAP_ZONE_SPLIT + (GAME_WIDTH - TAP_ZONE_SPLIT) / 2, 750, GAME_WIDTH - TAP_ZONE_SPLIT - 20, 60, 0xff4444)
      .setAlpha(0.06)
      .setDepth(55);

    // ---- Help button ----
    const helpText = this.add
      .text(GAME_WIDTH - 16, 50, '?', {
        fontSize: '20px',
        color: '#555555',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#222222',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
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
    // --- Health bars with tween ---
    const playerRatio = data.playerHealth / data.playerMaxHealth;
    const aiRatio = data.opponentHealth / data.opponentMaxHealth;

    if (playerRatio !== this.prevPlayerHealth) {
      this.tweenHealthBar(this.playerBarFill, playerRatio, BAR_WIDTH, false);
      this.playerBarFill.setFillStyle(healthColor(playerRatio));
      if (playerRatio < this.prevPlayerHealth) this.flashBar(this.playerBarFlash);
      this.prevPlayerHealth = playerRatio;
    }

    if (aiRatio !== this.prevAIHealth) {
      this.tweenHealthBar(this.aiBarFill, aiRatio, BAR_WIDTH, true);
      this.aiBarFill.setFillStyle(healthColor(aiRatio));
      if (aiRatio < this.prevAIHealth) this.flashBar(this.aiBarFlash);
      this.prevAIHealth = aiRatio;
    }

    // --- Timer ---
    const minutes = Math.floor(data.timeElapsed / 60);
    const seconds = Math.floor(data.timeElapsed % 60);
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // --- Combo ---
    if (data.comboCount > 1) {
      this.comboText.setText(`${data.comboCount}x`);
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

    // --- Momentum ---
    this.drawMomentum(data.momentum);

    // --- Special meter ---
    const meter = data.specialMeter ?? 0;
    const specialWidth = 160;
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
    ratio: number,
    maxWidth: number,
    _mirrored: boolean
  ): void {
    this.tweens.killTweensOf(bar);
    this.tweens.add({
      targets: bar,
      width: maxWidth * Math.max(0, ratio),
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
  // Momentum
  // ============================================================

  private drawMomentum(momentum: number): void {
    this.momentumGfx.clear();

    const cx = PLAYER_BAR_X + BAR_WIDTH / 2;
    const cy = BAR_Y + BAR_HEIGHT / 2 + 10;
    const radius = 18;
    const ratio = momentum / 100;

    // Background arc
    this.momentumGfx.lineStyle(3, 0x333333, 1);
    this.momentumGfx.beginPath();
    this.momentumGfx.arc(cx, cy, radius, Math.PI, 0, false);
    this.momentumGfx.strokePath();

    // Fill arc
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

    // Backdrop
    const bg = this.add
      .rectangle(GAME_WIDTH / 2, 422, GAME_WIDTH, 844, 0x000000)
      .setAlpha(0.85);
    this.controlsOverlay.add(bg);

    const title = this.add
      .text(GAME_WIDTH / 2, 200, 'CONTROLS', {
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.controlsOverlay.add(title);

    const lines = [
      'Tap LEFT = Jab',
      'Tap RIGHT = Hook',
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
        .text(GAME_WIDTH / 2, 260 + i * 32, line, {
          fontSize: '15px',
          color: line === '' ? '#000' : '#CCCCCC',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);
      this.controlsOverlay!.add(text);
    });

    const closeText = this.add
      .text(GAME_WIDTH / 2, 580, 'Tap anywhere to close', {
        fontSize: '13px',
        color: '#666666',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    this.controlsOverlay.add(closeText);

    // Close on tap anywhere
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
