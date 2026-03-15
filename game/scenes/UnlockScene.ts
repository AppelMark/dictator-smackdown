import { CharacterArchetype } from '../../types/character';
import { CHARACTERS } from '../../data/characters';
import { GAME_WIDTH, GAME_HEIGHT, ROAD_TO_CHAMPION, ARCHETYPE_STATS } from '../constants';

const CONFETTI_COLORS = [0xFFD700, 0xFF4444, 0x33CC33, 0x3366FF, 0xFF66FF];

export class UnlockScene extends Phaser.Scene {
  private unlockedArchetype: CharacterArchetype = CharacterArchetype.TheDon;
  private canContinue: boolean = false;

  constructor() {
    super({ key: 'UnlockScene' });
  }

  init(data: Record<string, unknown>): void {
    this.unlockedArchetype =
      (data.archetype as CharacterArchetype) ?? CharacterArchetype.TheDon;
    this.canContinue = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    const char = CHARACTERS.find((c) => c.archetype === this.unlockedArchetype);
    const charName = char?.name ?? this.unlockedArchetype;
    const config = ARCHETYPE_STATS[this.unlockedArchetype];

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 60;

    // --- Tap to skip at any time ---
    this.input.on('pointerdown', () => {
      if (this.canContinue) {
        this.goToSelect();
      }
    });

    // ---- 0ms: Black screen ----

    // ---- 300ms: Golden lock scales up ----
    this.time.delayedCall(300, () => {
      const lockGfx = this.add.graphics().setDepth(10);
      this.drawLock(lockGfx, cx, cy, true);
      lockGfx.setScale(0);

      this.tweens.add({
        targets: lockGfx,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // ---- 800ms: Lock shakes ----
          this.tweens.add({
            targets: lockGfx,
            x: { from: -3, to: 3 },
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
              // ---- 1000ms: Lock opens ----
              lockGfx.clear();
              this.drawLock(lockGfx, cx, cy, false);

              // Spotlight
              this.time.delayedCall(200, () => {
                this.showSpotlight(cx, cy);
              });

              // ---- 1400ms: Name zooms in ----
              this.time.delayedCall(400, () => {
                lockGfx.setAlpha(0.3);
                this.showNameAndUnlocked(cx, charName);
              });

              // ---- 2200ms: Stats slide in ----
              this.time.delayedCall(1200, () => {
                this.showStats(config);
              });

              // ---- 2800ms: Next archetype hint ----
              this.time.delayedCall(1800, () => {
                this.showNextHint();
              });

              // ---- 3000ms: Continue button ----
              this.time.delayedCall(2700, () => {
                this.showContinueButton();
              });
            },
          });
        },
      });
    });

    // Auto-enable continue after 3s
    this.time.delayedCall(3000, () => {
      this.canContinue = true;
    });
  }

  // ============================================================
  // Lock drawing
  // ============================================================

  private drawLock(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    closed: boolean
  ): void {
    // Lock body
    gfx.fillStyle(0xFFD700, 1);
    gfx.fillRoundedRect(cx - 25, cy - 10, 50, 40, 6);

    // Keyhole
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(cx, cy + 5, 6);
    gfx.fillRect(cx - 3, cy + 5, 6, 12);

    // Shackle
    gfx.lineStyle(6, 0xFFD700, 1);
    if (closed) {
      gfx.beginPath();
      gfx.arc(cx, cy - 10, 18, Math.PI, 0, false);
      gfx.strokePath();
    } else {
      // Open shackle — left side only
      gfx.beginPath();
      gfx.arc(cx - 5, cy - 10, 18, Math.PI, Math.PI * 1.5, false);
      gfx.strokePath();
    }
  }

  // ============================================================
  // Spotlight
  // ============================================================

  private showSpotlight(cx: number, cy: number): void {
    const spotlight = this.add.graphics().setDepth(2);

    // Dark surround with transparent center
    for (let r = 200; r > 0; r -= 4) {
      const alpha = r > 120 ? 0.0 : (120 - r) / 120 * 0.6;
      spotlight.fillStyle(0x000000, alpha);
      spotlight.fillCircle(cx, cy, r);
    }

    // Golden glow center
    const glow = this.add.graphics().setDepth(3);
    glow.fillStyle(0xFFD700, 0.08);
    glow.fillCircle(cx, cy, 100);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.08, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  // ============================================================
  // Name + UNLOCKED text
  // ============================================================

  private showNameAndUnlocked(cx: number, charName: string): void {
    // Character name
    const nameText = this.add
      .text(cx, GAME_HEIGHT / 2 - 60, charName.toUpperCase(), {
        fontSize: '42px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0.1)
      .setDepth(20);

    this.tweens.add({
      targets: nameText,
      scale: 1.0,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // UNLOCKED! text after name lands
    this.time.delayedCall(500, () => {
      const unlockText = this.add
        .text(cx, GAME_HEIGHT / 2, 'UNLOCKED!', {
          fontSize: '32px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setScale(0.3)
        .setAlpha(0)
        .setDepth(20);

      this.tweens.add({
        targets: unlockText,
        scale: 1.2,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });

      // Particle burst
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const dot = this.add
          .rectangle(cx, GAME_HEIGHT / 2, 6, 6, color)
          .setDepth(18);

        this.tweens.add({
          targets: dot,
          x: cx + Math.cos(angle) * 150,
          y: GAME_HEIGHT / 2 + Math.sin(angle) * 150,
          alpha: 0,
          duration: 600,
          ease: 'Power2',
          onComplete: () => dot.destroy(),
        });
      }
    });
  }

  // ============================================================
  // Stats slide in
  // ============================================================

  private showStats(config: { strength: number; speed: number; defense: number }): void {
    const stats = [
      { label: 'STRENGTH', value: config.strength, color: '#FF4444' },
      { label: 'SPEED', value: config.speed, color: '#00BFFF' },
      { label: 'DEFENSE', value: config.defense, color: '#33CC33' },
    ];

    const startY = GAME_HEIGHT / 2 + 70;

    stats.forEach((stat, i) => {
      const label = this.add
        .text(GAME_WIDTH + 50, startY + i * 30, `${stat.label}: ${stat.value}`, {
          fontSize: '15px',
          color: stat.color,
          fontFamily: 'Arial',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(20);

      this.tweens.add({
        targets: label,
        x: GAME_WIDTH / 2,
        duration: 400,
        delay: i * 150,
        ease: 'Power2',
      });
    });
  }

  // ============================================================
  // Next archetype hint
  // ============================================================

  private showNextHint(): void {
    const idx = ROAD_TO_CHAMPION.indexOf(this.unlockedArchetype);
    let hintText: string;

    if (idx >= 0 && idx < ROAD_TO_CHAMPION.length - 1) {
      const nextArchetype = ROAD_TO_CHAMPION[idx + 1];
      const nextChar = CHARACTERS.find((c) => c.archetype === nextArchetype);
      const nextName = nextChar?.name ?? nextArchetype;
      hintText = `Next in the Road to Champion — ${nextName}`;
    } else {
      hintText = 'Final challenger on the Road to Champion!';
    }

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 140, hintText, {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'Arial',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 40 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);

    this.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 400,
    });
  }

  // ============================================================
  // Continue button
  // ============================================================

  private showContinueButton(): void {
    this.canContinue = true;

    const btn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'CONTINUE', {
        fontSize: '20px',
        color: '#000000',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#FFD700',
        padding: { x: 32, y: 12 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: btn,
      alpha: 1,
      duration: 300,
    });

    btn.on('pointerdown', () => this.goToSelect());
    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1.0));
  }

  // ============================================================
  // Navigation
  // ============================================================

  private goToSelect(): void {
    const char = CHARACTERS.find((c) => c.archetype === this.unlockedArchetype);
    const id = char?.id ?? this.unlockedArchetype;
    window.location.href = `/select?highlighted=${id}`;
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
