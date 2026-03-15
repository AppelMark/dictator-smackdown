import type { BattleResult, ScoreBreakdown } from '../../types/battle';
import { GAME_WIDTH, GAME_HEIGHT, STAR_TWO_TIME_LIMIT, ROAD_TO_CHAMPION } from '../constants';
import { CharacterArchetype } from '../../types/character';

const CONFETTI_COLORS = [0xFFD700, 0xFF4444, 0x33CC33, 0x3366FF, 0xFF66FF, 0xFF8C00];

export class KOScene extends Phaser.Scene {
  private result!: BattleResult;
  private archetype!: CharacterArchetype;
  private unlockedNext: CharacterArchetype | null = null;
  private isFirstWin: boolean = false;

  constructor() {
    super({ key: 'KOScene' });
  }

  init(data: Record<string, unknown>): void {
    this.result = data.result as BattleResult;
    this.archetype = (data.archetype as CharacterArchetype) ?? CharacterArchetype.DerGroszer;
    this.unlockedNext = (data.unlockedNext as CharacterArchetype) ?? null;
    this.isFirstWin = (data.isFirstWin as boolean) ?? false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    // --- KO Splash (1.5s replay simulation + knockout text) ---
    this.showKOSplash();
  }

  // ============================================================
  // KO Splash
  // ============================================================

  private showKOSplash(): void {
    // Simulated slow-mo replay: grey tinted rectangles fading in
    const replayBg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111111)
      .setDepth(0);

    const replayPlayer = this.add.rectangle(80, 500, 80, 160, 0x223366).setDepth(1);
    const replayAI = this.add.rectangle(310, 500, 80, 160, 0x662222).setDepth(1);

    // Slow-motion hit animation
    this.tweens.add({
      targets: replayAI,
      x: replayAI.x + 40,
      duration: 1500,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: replayPlayer,
      x: replayPlayer.x + 15,
      duration: 800,
      ease: 'Power2',
    });

    // Freeze after 1.5s, show KNOCKOUT
    this.time.delayedCall(1500, () => {
      // KNOCKOUT text
      const koText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'KNOCKOUT!', {
          fontSize: '56px',
          color: '#FF2222',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setScale(0.1)
        .setDepth(20);

      this.tweens.add({
        targets: koText,
        scale: 2.0,
        duration: 300,
        ease: 'Back.easeOut',
      });

      // Confetti burst
      this.spawnConfetti();

      // Camera shake
      this.cameras.main.shake(600, 0.015);

      // After 2s, fade to score screen
      this.time.delayedCall(2000, () => {
        this.tweens.add({
          targets: [replayBg, replayPlayer, replayAI, koText],
          alpha: 0,
          duration: 400,
          onComplete: () => {
            replayBg.destroy();
            replayPlayer.destroy();
            replayAI.destroy();
            koText.destroy();
            this.showScoreScreen();
          },
        });
      });
    });
  }

  // ============================================================
  // Score Screen
  // ============================================================

  private showScoreScreen(): void {
    const breakdown = this.result.scoreBreakdown;

    // Title
    this.add
      .text(GAME_WIDTH / 2, 60, 'VICTORY', {
        fontSize: '36px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(30);

    // Time
    this.add
      .text(GAME_WIDTH / 2, 100, `Time: ${this.result.timeSeconds}s`, {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(30);

    // Score breakdown — animate one by one
    const lines: { label: string; value: number }[] = [
      { label: 'Base Damage', value: breakdown.baseDamageScore },
      { label: 'Time Bonus', value: breakdown.timeBonus },
      { label: 'Combo Bonus', value: breakdown.comboBonus },
      { label: 'Parts Bonus', value: breakdown.partsDetachedBonus },
      { label: 'Counter Bonus', value: breakdown.counterBonus },
      { label: 'No Damage Bonus', value: breakdown.noDamageBonus },
    ];

    const startY = 160;
    const lineHeight = 36;

    lines.forEach((line, i) => {
      this.time.delayedCall(400 * i, () => {
        this.animateScoreLine(line.label, line.value, startY + i * lineHeight);
      });
    });

    // Total score (after all lines)
    const totalDelay = 400 * lines.length + 200;
    this.time.delayedCall(totalDelay, () => {
      this.animateTotalScore(breakdown, startY + lines.length * lineHeight + 20);
    });

    // Stars (after total)
    const starDelay = totalDelay + 800;
    this.time.delayedCall(starDelay, () => {
      this.showStars(startY + lines.length * lineHeight + 80);
    });

    // Buttons (after stars)
    const buttonDelay = starDelay + 1600;
    this.time.delayedCall(buttonDelay, () => {
      this.showButtons(startY + lines.length * lineHeight + 160);
    });
  }

  private animateScoreLine(label: string, value: number, y: number): void {
    const labelText = this.add
      .text(30, y, label, {
        fontSize: '14px',
        color: '#AAAAAA',
        fontFamily: 'Arial',
      })
      .setDepth(30)
      .setAlpha(0);

    const valueText = this.add
      .text(GAME_WIDTH - 30, y, '0', {
        fontSize: '16px',
        color: value > 0 ? '#FFFFFF' : '#555555',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(30)
      .setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: [labelText, valueText],
      alpha: 1,
      duration: 200,
    });

    // Count up
    if (value > 0) {
      const counter = { val: 0 };
      this.tweens.add({
        targets: counter,
        val: value,
        duration: 400,
        ease: 'Power2',
        onUpdate: () => {
          valueText.setText(`+${Math.round(counter.val)}`);
        },
        onComplete: () => {
          valueText.setText(`+${value}`);
        },
      });
    } else {
      valueText.setText('+0');
    }
  }

  private animateTotalScore(breakdown: ScoreBreakdown, y: number): void {
    // Divider line
    const divider = this.add.graphics().setDepth(30);
    divider.lineStyle(1, 0x444444, 1);
    divider.lineBetween(30, y - 8, GAME_WIDTH - 30, y - 8);

    const totalLabel = this.add
      .text(30, y, 'TOTAL', {
        fontSize: '20px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setDepth(30);

    const totalValue = this.add
      .text(GAME_WIDTH - 30, y, '0', {
        fontSize: '24px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(30);

    const counter = { val: 0 };
    this.tweens.add({
      targets: counter,
      val: breakdown.totalScore,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        totalValue.setText(Math.round(counter.val).toLocaleString());
      },
      onComplete: () => {
        totalValue.setText(breakdown.totalScore.toLocaleString());

        // Scale pulse on complete
        this.tweens.add({
          targets: totalValue,
          scale: { from: 1.0, to: 1.2 },
          duration: 200,
          yoyo: true,
        });
      },
    });
  }

  // ============================================================
  // Stars
  // ============================================================

  private showStars(y: number): void {
    const starCount = this.calculateStars();
    const spacing = 44;
    const startX = GAME_WIDTH / 2 - spacing;

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 400, () => {
        const earned = i < starCount;
        const star = this.add
          .text(startX + i * spacing, y, earned ? '★' : '☆', {
            fontSize: '36px',
            color: earned ? '#FFD700' : '#333333',
            fontFamily: 'Arial',
          })
          .setOrigin(0.5)
          .setScale(0)
          .setDepth(30);

        this.tweens.add({
          targets: star,
          scale: 1,
          duration: 300,
          ease: 'Back.easeOut',
        });

        if (earned) {
          // Small star label
          const labels = ['WIN', 'SPEED', 'PERFECT'];
          this.add
            .text(startX + i * spacing, y + 28, labels[i], {
              fontSize: '8px',
              color: '#888888',
              fontFamily: 'Arial',
            })
            .setOrigin(0.5)
            .setDepth(30);
        }
      });
    }
  }

  private calculateStars(): number {
    if (this.result.winner !== 'player') return 0;
    let stars = 1;
    if (this.result.timeSeconds < STAR_TWO_TIME_LIMIT) stars = 2;
    if (this.result.tookNoDamage) stars = 3;
    return stars;
  }

  // ============================================================
  // Buttons
  // ============================================================

  private showButtons(y: number): void {
    // Check if next archetype unlocked
    if (this.unlockedNext) {
      this.time.delayedCall(800, () => {
        this.scene.start('UnlockScene', { archetype: this.unlockedNext });
      });
      return;
    }

    // Rematch button
    const rematchBtn = this.add
      .text(GAME_WIDTH / 2 - 80, y, 'REMATCH', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#CC3333',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    rematchBtn.on('pointerdown', () => {
      this.scene.start('AnnouncementScene', { archetype: this.archetype });
    });

    // Next fighter button
    const nextBtn = this.add
      .text(GAME_WIDTH / 2 + 80, y, 'SELECT', {
        fontSize: '16px',
        color: '#000000',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#FFD700',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    nextBtn.on('pointerdown', () => {
      window.location.href = '/select';
    });

    // Fade in buttons
    this.tweens.add({
      targets: [rematchBtn, nextBtn],
      alpha: 1,
      duration: 300,
    });
  }

  // ============================================================
  // Confetti
  // ============================================================

  private spawnConfetti(): void {
    for (let i = 0; i < 40; i++) {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const confetti = this.add
        .rectangle(
          Math.random() * GAME_WIDTH,
          -10 - Math.random() * 40,
          6 + Math.random() * 6,
          6 + Math.random() * 6,
          color
        )
        .setDepth(15);

      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 20,
        x: confetti.x + (Math.random() - 0.5) * 100,
        angle: Math.random() * 720,
        duration: 1500 + Math.random() * 1000,
        ease: 'Quad.easeIn',
        onComplete: () => confetti.destroy(),
      });
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
