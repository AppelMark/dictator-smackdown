import { GAME_WIDTH, GAME_HEIGHT, TAP_DOUBLE_WINDOW } from '../constants';
import { PunchType } from '../../types/battle';
import type { PunchEvent } from '../../types/battle';
import { TapZoneManager } from '../managers/TapZoneManager';

export class TutorialScene extends Phaser.Scene {
  private tapZoneManager!: TapZoneManager;
  private tutorialPhase: number = 1;

  private player!: Phaser.GameObjects.Rectangle;
  private henchman!: Phaser.GameObjects.Rectangle;
  private henchmanHealth: number = 200;
  private henchmanMaxHealth: number = 200;
  private henchmanHealthBar!: Phaser.GameObjects.Rectangle;
  private instructionText!: Phaser.GameObjects.Text;

  private arrowGfx!: Phaser.GameObjects.Graphics;
  private arrowTween?: Phaser.Tweens.Tween;
  private glowGfx?: Phaser.GameObjects.Graphics;
  private glowTween?: Phaser.Tweens.Tween;
  private counterWindowActive: boolean = false;
  private comboTimer?: Phaser.Time.TimerEvent;
  private lastPunchTime: number = 0;
  private isFinished: boolean = false;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // --- Fighters ---
    this.player = this.add.rectangle(100, 500, 80, 160, 0x3366ff);
    this.henchman = this.add.rectangle(290, 500, 80, 160, 0xcccc33);

    // --- Henchman label ---
    this.add
      .text(290, 390, 'HENCHMAN #1', {
        fontSize: '12px',
        color: '#CCCC33',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // --- Health bars ---
    this.add.rectangle(290, 40, 120, 14, 0x444444);
    this.henchmanHealthBar = this.add.rectangle(290, 40, 120, 14, 0xcccc33);

    // --- Instruction text ---
    this.instructionText = this.add
      .text(GAME_WIDTH / 2, 80, '', {
        fontSize: '20px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 40 },
      })
      .setOrigin(0.5)
      .setDepth(20);

    // --- Arrow graphics ---
    this.arrowGfx = this.add.graphics().setDepth(15);

    // --- Input ---
    this.tapZoneManager = new TapZoneManager(this);

    this.events.on('punch', (event: PunchEvent) => {
      if (this.isFinished) return;
      this.handlePunch(event);
    });

    this.events.on('dodge', () => {
      if (this.isFinished) return;
      this.handleDodge();
    });

    // --- Start phase 1 ---
    this.startPhase1();
  }

  // ============================================================
  // Phase 1: Jab
  // ============================================================

  private startPhase1(): void {
    this.tutorialPhase = 1;
    this.instructionText.setText('TAP LEFT to jab!');
    this.drawArrowLeft();
  }

  // ============================================================
  // Phase 2: Cross (right tap)
  // ============================================================

  private startPhase2(): void {
    this.tutorialPhase = 2;
    this.clearArrow();
    this.instructionText.setText('TAP RIGHT for a cross!');
    this.drawArrowRight();
  }

  // ============================================================
  // Phase 3: Combo
  // ============================================================

  private startPhase3(): void {
    this.tutorialPhase = 3;
    this.clearArrow();
    this.instructionText.setText('TAP LEFT then RIGHT quickly\n— COMBO!');
    this.drawArrowBoth();
    this.lastPunchTime = 0;
  }

  // ============================================================
  // Phase 4: Dodge + Counter
  // ============================================================

  private startPhase4(): void {
    this.tutorialPhase = 4;
    this.clearArrow();
    this.instructionText.setText('He is attacking —\nSWIPE LEFT or RIGHT to dodge!');
    this.showTelegraph();
  }

  // ============================================================
  // Phase 5: Finish
  // ============================================================

  private startPhase5(): void {
    this.tutorialPhase = 5;
    this.clearArrow();
    this.henchmanHealth = 30;
    this.updateHealthBar();
    this.instructionText.setText('Now finish him!\nTAP TAP TAP!');
  }

  // ============================================================
  // Punch handler
  // ============================================================

  private handlePunch(event: PunchEvent): void {
    switch (this.tutorialPhase) {
      case 1:
        if (event.type === PunchType.Jab) {
          this.dealDamage(8);
          this.showFloatingText('+8', 0x33cc33);
          this.showComment('Nice jab! That is it!');
          this.tutorialPhase = 0; // lock input during transition
          this.time.delayedCall(1200, () => this.startPhase2());
        }
        break;

      case 2:
        if (event.type === PunchType.Hook) {
          this.dealDamage(18);
          this.showFloatingText('+18', 0x33cc33);
          this.showComment('Powerful cross!');
          this.tutorialPhase = 0;
          this.time.delayedCall(1200, () => this.startPhase3());
        }
        break;

      case 3:
        this.handleComboPunch(event);
        break;

      case 4:
        if (this.counterWindowActive) {
          const damage = 26 * 2;
          this.dealDamage(damage);
          this.showFloatingText(`+${damage}`, 0xFFD700);
          this.showComment('COUNTER STRIKE!');
          this.counterWindowActive = false;
          this.removePlayerHighlight();
          this.tutorialPhase = 0;
          this.time.delayedCall(1200, () => this.startPhase5());
        }
        break;

      case 5:
        this.dealDamage(Math.round(event.power * 15));
        this.showFloatingText(`+${Math.round(event.power * 15)}`, 0x33cc33);
        this.animateHit();
        if (this.henchmanHealth <= 0) {
          this.showKO();
        }
        break;
    }
  }

  // ============================================================
  // Combo logic (phase 3)
  // ============================================================

  private handleComboPunch(event: PunchEvent): void {
    const now = Date.now();

    if (this.lastPunchTime === 0) {
      // First hit of combo
      this.dealDamage(8);
      this.showFloatingText('+8', 0x33cc33);
      this.animateHit();
      this.lastPunchTime = now;

      // Show combo window bar
      this.showComboWindowBar();
      return;
    }

    const elapsed = now - this.lastPunchTime;
    if (elapsed < TAP_DOUBLE_WINDOW) {
      // Combo success!
      const comboDamage = 24;
      this.dealDamage(comboDamage);
      this.showFloatingText(`+${comboDamage}`, 0xFFD700);
      this.animateHit();

      // Big combo text
      const comboText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'COMBO x2!', {
          fontSize: '36px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(30);

      this.tweens.add({
        targets: comboText,
        y: comboText.y - 80,
        alpha: 0,
        scale: 1.5,
        duration: 800,
        onComplete: () => comboText.destroy(),
      });

      this.showComment('COMBO! That is how you do it!');
      this.tutorialPhase = 0;
      this.time.delayedCall(1200, () => this.startPhase4());
    } else {
      // Too slow — reset
      this.lastPunchTime = now;
      this.dealDamage(8);
      this.showFloatingText('+8', 0x33cc33);
      this.animateHit();
      this.showComboWindowBar();
    }
  }

  private showComboWindowBar(): void {
    if (this.comboTimer) this.comboTimer.destroy();

    const barWidth = 120;
    const barX = GAME_WIDTH / 2 - barWidth / 2;
    const barY = GAME_HEIGHT - 60;

    const bg = this.add.rectangle(GAME_WIDTH / 2, barY, barWidth, 8, 0x444444).setDepth(20);
    const fill = this.add.rectangle(GAME_WIDTH / 2, barY, barWidth, 8, 0xFFD700).setDepth(21);

    this.tweens.add({
      targets: fill,
      scaleX: 0,
      duration: TAP_DOUBLE_WINDOW,
      ease: 'Linear',
      onComplete: () => {
        bg.destroy();
        fill.destroy();
      },
    });

    this.comboTimer = this.time.delayedCall(TAP_DOUBLE_WINDOW + 50, () => {
      bg.destroy();
      fill.destroy();
    });
  }

  // ============================================================
  // Dodge handler (phase 4)
  // ============================================================

  private handleDodge(): void {
    if (this.tutorialPhase !== 4) return;

    // Dodge animation
    this.tweens.add({
      targets: this.player,
      x: this.player.x - 30,
      duration: 100,
      yoyo: true,
    });

    // Remove telegraph glow
    this.removeTelegraph();

    // Green flash on player
    const flash = this.add.graphics().setDepth(15);
    flash.fillStyle(0x33cc33, 0.3);
    flash.fillRect(this.player.x - 50, this.player.y - 90, 100, 180);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    this.instructionText.setText('You dodged it!\nCounter NOW!');

    // Counter window
    this.counterWindowActive = true;
    this.highlightPlayer();

    this.time.delayedCall(2000, () => {
      if (this.counterWindowActive && this.tutorialPhase === 4) {
        this.counterWindowActive = false;
        this.removePlayerHighlight();
        this.showTelegraph();
        this.instructionText.setText('He is attacking —\nSWIPE LEFT or RIGHT to dodge!');
      }
    });
  }

  // ============================================================
  // Telegraph (phase 4)
  // ============================================================

  private showTelegraph(): void {
    this.glowGfx = this.add.graphics().setDepth(5);
    this.glowGfx.fillStyle(0xff0000, 0.3);
    this.glowGfx.fillRect(
      this.henchman.x - 50,
      this.henchman.y - 90,
      100,
      180
    );

    this.glowTween = this.tweens.add({
      targets: this.glowGfx,
      alpha: 0.1,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  private removeTelegraph(): void {
    this.glowTween?.stop();
    this.glowGfx?.destroy();
    this.glowGfx = undefined;
    this.glowTween = undefined;
  }

  // ============================================================
  // Player highlight (counter window)
  // ============================================================

  private playerHighlight?: Phaser.GameObjects.Graphics;
  private playerHighlightTween?: Phaser.Tweens.Tween;

  private highlightPlayer(): void {
    this.playerHighlight = this.add.graphics().setDepth(4);
    this.playerHighlight.lineStyle(3, 0xFFD700, 1);
    this.playerHighlight.strokeRect(
      this.player.x - 45,
      this.player.y - 85,
      90,
      170
    );

    this.playerHighlightTween = this.tweens.add({
      targets: this.playerHighlight,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  private removePlayerHighlight(): void {
    this.playerHighlightTween?.stop();
    this.playerHighlight?.destroy();
    this.playerHighlight = undefined;
    this.playerHighlightTween = undefined;
  }

  // ============================================================
  // KO & Finish
  // ============================================================

  private showKO(): void {
    this.isFinished = true;
    this.tutorialPhase = 0;

    const koText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'TUTORIAL\nCOMPLETE!', {
        fontSize: '48px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setScale(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: koText,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Confetti
    for (let i = 0; i < 40; i++) {
      const colors = [0xFFD700, 0xFF4444, 0x33CC33, 0x3366FF, 0xFF66FF];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const confetti = this.add
        .rectangle(
          Math.random() * GAME_WIDTH,
          -20,
          8,
          8,
          color
        )
        .setDepth(45);

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

    this.time.delayedCall(2000, () => {
      localStorage.setItem('dictator_has_seen_tutorial', 'true');
      window.location.href = '/select';
    });
  }

  // ============================================================
  // Shared helpers
  // ============================================================

  private dealDamage(amount: number): void {
    this.henchmanHealth = Math.max(0, this.henchmanHealth - amount);
    this.updateHealthBar();
    this.animateHit();
  }

  private updateHealthBar(): void {
    const ratio = this.henchmanHealth / this.henchmanMaxHealth;
    this.henchmanHealthBar.setScale(ratio, 1);
  }

  private animateHit(): void {
    this.tweens.add({
      targets: this.henchman,
      x: this.henchman.x + 20,
      duration: 75,
      yoyo: true,
    });
  }

  private showFloatingText(text: string, color: number): void {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const floater = this.add
      .text(this.henchman.x, this.henchman.y - 100, text, {
        fontSize: '24px',
        color: hex,
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: floater,
      y: floater.y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => floater.destroy(),
    });
  }

  private showComment(text: string): void {
    const comment = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 120, text, {
        fontSize: '16px',
        color: '#33CC33',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(25);

    this.tweens.add({
      targets: comment,
      alpha: 0,
      duration: 1000,
      delay: 800,
      onComplete: () => comment.destroy(),
    });
  }

  // ============================================================
  // Arrow drawing
  // ============================================================

  private drawArrowLeft(): void {
    this.arrowGfx.clear();
    this.arrowGfx.fillStyle(0xFFD700, 1);
    // Triangle pointing left
    this.arrowGfx.fillTriangle(
      40, GAME_HEIGHT / 2,
      100, GAME_HEIGHT / 2 - 30,
      100, GAME_HEIGHT / 2 + 30
    );
    this.startArrowPulse();
  }

  private drawArrowRight(): void {
    this.arrowGfx.clear();
    this.arrowGfx.fillStyle(0xFFD700, 1);
    // Triangle pointing right
    this.arrowGfx.fillTriangle(
      GAME_WIDTH - 40, GAME_HEIGHT / 2,
      GAME_WIDTH - 100, GAME_HEIGHT / 2 - 30,
      GAME_WIDTH - 100, GAME_HEIGHT / 2 + 30
    );
    this.startArrowPulse();
  }

  private drawArrowBoth(): void {
    this.arrowGfx.clear();
    this.arrowGfx.fillStyle(0xFFD700, 1);
    this.arrowGfx.fillTriangle(
      40, GAME_HEIGHT / 2,
      100, GAME_HEIGHT / 2 - 30,
      100, GAME_HEIGHT / 2 + 30
    );
    this.arrowGfx.fillTriangle(
      GAME_WIDTH - 40, GAME_HEIGHT / 2,
      GAME_WIDTH - 100, GAME_HEIGHT / 2 - 30,
      GAME_WIDTH - 100, GAME_HEIGHT / 2 + 30
    );
    this.startArrowPulse();
  }

  private startArrowPulse(): void {
    this.arrowTween?.stop();
    this.arrowTween = this.tweens.add({
      targets: this.arrowGfx,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private clearArrow(): void {
    this.arrowTween?.stop();
    this.arrowGfx.clear();
    this.arrowGfx.setAlpha(1);
  }

  // ============================================================
  // Cleanup
  // ============================================================

  shutdown(): void {
    this.tapZoneManager.destroy();
    this.removeTelegraph();
    this.removePlayerHighlight();
    this.events.removeAllListeners();
  }
}
