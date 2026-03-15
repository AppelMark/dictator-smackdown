import { PunchType } from '../../types/battle';
import type { DamageResult } from '../../types/battle';
import { HIT_STOP_FRAMES, CAMERA_SHAKE_INTENSITY, GAME_WIDTH, GAME_HEIGHT } from '../constants';

const IMPACT_TEXT: Record<PunchType, string[]> = {
  [PunchType.Jab]: ['POW!', 'JAB!'],
  [PunchType.Cross]: ['CRACK!', 'CROSS!'],
  [PunchType.Hook]: ['SMASH!', 'HOOK!'],
  [PunchType.Uppercut]: ['BOOM!', 'UPPER!'],
  [PunchType.Special]: ['DEVASTATION!', 'SPECIAL!'],
};

const CLAY_COLORS = [0x8B4513, 0xA0522D, 0xCD853F];
const CONFETTI_COLORS = [0xFFD700, 0xFF4444, 0x33CC33, 0x3366FF, 0xFF66FF, 0xFF8C00];

export class JuiceManager {
  private scene: Phaser.Scene;
  private clayEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private starEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private comboText?: Phaser.GameObjects.Text;
  private comboTween?: Phaser.Tweens.Tween;
  private arenaDegraded50: boolean = false;
  private arenaDegraded25: boolean = false;

  // --- Damage vignette ---
  private warningVignette?: Phaser.GameObjects.Graphics;
  private criticalPulseTween?: Phaser.Tweens.Tween;
  private criticalOverlay?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();
    this.createEmitters();
  }

  // ============================================================
  // Setup
  // ============================================================

  private createParticleTextures(): void {
    // Clay spatter particle
    if (!this.scene.textures.exists('clay_particle')) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xCD853F, 1);
      gfx.fillCircle(16, 16, 16);
      gfx.generateTexture('clay_particle', 32, 32);
      gfx.destroy();
    }

    // Star particle
    if (!this.scene.textures.exists('star_particle')) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xFFD700, 1);
      gfx.fillCircle(8, 8, 8);
      gfx.generateTexture('star_particle', 16, 16);
      gfx.destroy();
    }

    // Confetti particle
    if (!this.scene.textures.exists('confetti_particle')) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xFFFFFF, 1);
      gfx.fillRect(0, 0, 8, 8);
      gfx.generateTexture('confetti_particle', 8, 8);
      gfx.destroy();
    }
  }

  private createEmitters(): void {
    // Clay spatter emitter — particles stay on screen
    this.clayEmitter = this.scene.add.particles(0, 0, 'clay_particle', {
      speed: { min: 80, max: 180 },
      scale: { start: 0.08, end: 0.03 },
      lifespan: 99999,
      gravityY: 200,
      emitting: false,
      tint: CLAY_COLORS,
    });
    this.clayEmitter.setDepth(5);

    // Star emitter
    this.starEmitter = this.scene.add.particles(0, 0, 'star_particle', {
      speed: { min: 60, max: 140 },
      scale: { start: 0.06, end: 0.02 },
      lifespan: 800,
      gravityY: 80,
      emitting: false,
      tint: [0xFFD700, 0xFFFF00],
    });
    this.starEmitter.setDepth(35);
  }

  // ============================================================
  // Main punch hit feedback
  // ============================================================

  onPunchHit(x: number, y: number, result: DamageResult, punchType: PunchType): void {
    this.hitStop(punchType);
    this.cameraShake(punchType);
    this.claySpatter(x, y);
    this.impactText(x, y, punchType);

    if (result.isCritical) {
      this.screenFlash();
    }
  }

  // ============================================================
  // Hit-stop
  // ============================================================

  private hitStop(punchType: PunchType): void {
    const frames = HIT_STOP_FRAMES[punchType];
    const hitStopMs = (frames / 60) * 1000;

    // Pause Matter.js world
    if (this.scene.matter?.world) {
      this.scene.matter.world.pause();
    }
    this.scene.time.timeScale = 0.05;

    this.scene.time.delayedCall(hitStopMs, () => {
      if (this.scene.matter?.world) {
        this.scene.matter.world.resume();
      }
      this.scene.time.timeScale = 1.0;
    });
  }

  // ============================================================
  // Camera shake
  // ============================================================

  private cameraShake(punchType: PunchType): void {
    const intensity = CAMERA_SHAKE_INTENSITY[punchType];
    this.scene.cameras.main.shake(150, intensity);
  }

  // ============================================================
  // Clay spatter (permanent)
  // ============================================================

  private claySpatter(x: number, y: number): void {
    this.clayEmitter?.explode(12, x, y);
  }

  // ============================================================
  // Impact text
  // ============================================================

  private impactText(x: number, y: number, punchType: PunchType): void {
    const options = IMPACT_TEXT[punchType];
    const label = options[Math.floor(Math.random() * options.length)];

    const text = this.scene.add
      .text(x, y, label, {
        fontSize: '42px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0.5)
      .setDepth(40);

    this.scene.tweens.add({
      targets: text,
      scale: 1.5,
      duration: 150,
      ease: 'Power2',
    });

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 400,
      onComplete: () => text.destroy(),
    });
  }

  // ============================================================
  // Critical screen flash
  // ============================================================

  private screenFlash(): void {
    const flash = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF)
      .setAlpha(0.7)
      .setDepth(50);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy(),
    });
  }

  // ============================================================
  // Combo feedback
  // ============================================================

  onComboHit(comboCount: number): void {
    if (!this.comboText) {
      this.comboText = this.scene.add
        .text(GAME_WIDTH / 2, 130, '', {
          fontSize: '28px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(35);
    }

    this.comboText.setText(`${comboCount}x COMBO`);
    this.comboText.setAlpha(1);

    // Stop previous tween
    this.comboTween?.stop();

    if (comboCount < 5) {
      // 2-4: small yellow
      this.comboText.setFontSize(28);
      this.comboText.setColor('#FFD700');
      this.comboText.setScale(1);
    } else if (comboCount < 10) {
      // 5-9: bigger gold
      this.comboText.setFontSize(34);
      this.comboText.setColor('#FFA500');
      this.comboText.setScale(1.2);
    } else {
      // 10+: large gold with pulse and stars
      this.comboText.setFontSize(40);
      this.comboText.setColor('#FF4500');

      this.comboTween = this.scene.tweens.add({
        targets: this.comboText,
        scale: { from: 1.0, to: 1.4 },
        duration: 200,
        yoyo: true,
      });

      this.starEmitter?.explode(8, GAME_WIDTH / 2, 130);
    }
  }

  hideComboText(): void {
    if (this.comboText) {
      this.comboText.setAlpha(0);
    }
    this.comboTween?.stop();
  }

  // ============================================================
  // Block feedback
  // ============================================================

  onBlockSuccess(x: number, y: number): void {
    const circle = this.scene.add.graphics().setDepth(30);
    circle.fillStyle(0x3366FF, 0.5);
    circle.fillCircle(x, y, 40);

    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      duration: 200,
      onComplete: () => circle.destroy(),
    });

    const text = this.scene.add
      .text(x, y - 50, 'BLOCKED!', {
        fontSize: '24px',
        color: '#3366FF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  // ============================================================
  // Dodge feedback
  // ============================================================

  onDodgeSuccess(): void {
    const flash = this.scene.add.graphics().setDepth(15);
    flash.fillStyle(0x33CC33, 0.3);
    flash.fillRect(50, 400, 100, 200);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    const text = this.scene.add
      .text(100, 380, 'DODGE!', {
        fontSize: '28px',
        color: '#33CC33',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  // ============================================================
  // Part detach slow-motion
  // ============================================================

  onPartDetach(partName: string, x: number, y: number): void {
    // Slow-motion
    this.scene.time.timeScale = 0.25;
    this.scene.time.delayedCall(500, () => {
      this.scene.time.timeScale = 1.0;
    });

    // Part name text floats up
    const text = this.scene.add
      .text(x, y, partName.toUpperCase().replace('_', ' '), {
        fontSize: '36px',
        color: '#FF4444',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(45);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 100,
      alpha: 0,
      scale: 1.3,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }

  // ============================================================
  // KO sequence
  // ============================================================

  onKO(): void {
    // Big camera shake
    this.scene.cameras.main.shake(1200, 0.025);

    // White flash
    const flash = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF)
      .setAlpha(0.8)
      .setDepth(50);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    // Confetti explosion
    for (let i = 0; i < 50; i++) {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const confetti = this.scene.add
        .rectangle(
          Math.random() * GAME_WIDTH,
          -10,
          6 + Math.random() * 6,
          6 + Math.random() * 6,
          color
        )
        .setDepth(55);

      this.scene.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 20,
        x: confetti.x + (Math.random() - 0.5) * 120,
        angle: Math.random() * 720,
        duration: 1500 + Math.random() * 1200,
        ease: 'Quad.easeIn',
        onComplete: () => confetti.destroy(),
      });
    }

    // Slow-motion
    this.scene.time.timeScale = 0.5;
    this.scene.time.delayedCall(800, () => {
      this.scene.time.timeScale = 1.0;
    });
  }

  // ============================================================
  // Arena degradation
  // ============================================================

  onArenaDegrade(healthPercent: number): void {
    if (healthPercent < 0.50 && !this.arenaDegraded50) {
      this.arenaDegraded50 = true;

      // Slight camera tilt
      this.scene.tweens.add({
        targets: this.scene.cameras.main,
        angle: 1.5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (healthPercent < 0.25 && !this.arenaDegraded25) {
      this.arenaDegraded25 = true;

      // Floor cracks
      const cracks = this.scene.add.graphics().setDepth(1);
      cracks.lineStyle(2, 0x444444, 0.6);

      for (let i = 0; i < 5; i++) {
        const sx = Math.random() * GAME_WIDTH;
        const sy = GAME_HEIGHT - 50 + Math.random() * 40;
        cracks.beginPath();
        cracks.moveTo(sx, sy);
        for (let j = 0; j < 3; j++) {
          cracks.lineTo(
            sx + (Math.random() - 0.5) * 80,
            sy + Math.random() * 30
          );
        }
        cracks.strokePath();
      }
    }
  }

  // ============================================================
  // Damage vignette (first-person hit feedback)
  // ============================================================

  onPlayerDamage(damage: number, currentHealth: number, maxHealth: number): void {
    const healthRatio = currentHealth / maxHealth;
    const intensity = Math.min(0.7, damage / maxHealth + 0.15);

    // Flash vignette — scales with damage
    this.flashDamageVignette(intensity);

    // Persistent warning vignette below 30%
    if (healthRatio < 0.3 && !this.warningVignette) {
      this.warningVignette = this.scene.add.graphics().setDepth(42);
      this.drawVignette(this.warningVignette, 0xff0000, 0.15);
    }

    // Critical pulse below 15%
    if (healthRatio < 0.15 && !this.criticalOverlay) {
      this.criticalOverlay = this.scene.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000)
        .setAlpha(0.05)
        .setDepth(41);

      this.criticalPulseTween = this.scene.tweens.add({
        targets: this.criticalOverlay,
        alpha: { from: 0.05, to: 0.15 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  clearDamageEffects(): void {
    this.warningVignette?.destroy();
    this.warningVignette = undefined;
    this.criticalPulseTween?.stop();
    this.criticalPulseTween = undefined;
    this.criticalOverlay?.destroy();
    this.criticalOverlay = undefined;
  }

  private flashDamageVignette(intensity: number): void {
    const gfx = this.scene.add.graphics().setDepth(44);
    this.drawVignette(gfx, 0xff0000, intensity);

    gfx.setAlpha(0);
    this.scene.tweens.add({
      targets: gfx,
      alpha: 1,
      duration: 100,
      onComplete: () => {
        this.scene.tweens.add({
          targets: gfx,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => gfx.destroy(),
        });
      },
    });
  }

  private drawVignette(gfx: Phaser.GameObjects.Graphics, color: number, alpha: number): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const edge = 50;

    // Top edge — gradient from opaque to transparent
    for (let i = 0; i < edge; i++) {
      const a = alpha * (1 - i / edge);
      gfx.fillStyle(color, a);
      gfx.fillRect(0, i, w, 1);
    }
    // Bottom edge
    for (let i = 0; i < edge; i++) {
      const a = alpha * (1 - i / edge);
      gfx.fillStyle(color, a);
      gfx.fillRect(0, h - 1 - i, w, 1);
    }
    // Left edge
    for (let i = 0; i < edge; i++) {
      const a = alpha * (1 - i / edge);
      gfx.fillStyle(color, a);
      gfx.fillRect(i, 0, 1, h);
    }
    // Right edge
    for (let i = 0; i < edge; i++) {
      const a = alpha * (1 - i / edge);
      gfx.fillStyle(color, a);
      gfx.fillRect(w - 1 - i, 0, 1, h);
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================

  destroy(): void {
    this.clayEmitter?.destroy();
    this.starEmitter?.destroy();
    this.comboText?.destroy();
    this.comboTween?.stop();
    this.clearDamageEffects();
  }
}
