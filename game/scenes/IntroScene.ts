import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class IntroScene extends Phaser.Scene {
  private noiseGfx!: Phaser.GameObjects.Graphics;
  private noiseActive: boolean = false;
  private skipped: boolean = false;
  private timers: Phaser.Time.TimerEvent[] = [];
  private tweenRefs: Phaser.Tweens.Tween[] = [];

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.noiseGfx = this.add.graphics();

    // --- Skip button (min 44px touch area) ---
    const skipZone = this.add
      .zone(GAME_WIDTH - 44, 22, 88, 44)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH - 16, 22, '[ SKIP ]', {
        fontSize: '14px',
        color: '#555555',
        fontFamily: 'Arial',
      })
      .setOrigin(1, 0)
      .setDepth(100);

    skipZone.on('pointerdown', () => this.skip());

    // --- Timeline ---
    this.schedule(300, () => this.startNoise());
    this.schedule(900, () => this.stopNoiseAndShowBar());
    this.schedule(1400, () => this.startTypewriter());
    this.schedule(3800, () => this.showSecondBar());
    this.schedule(5400, () => this.showAreYouReady());
    this.schedule(6900, () => this.showFight());
    this.schedule(8000, () => this.fadeAndFinish());
  }

  update(): void {
    if (!this.noiseActive) return;
    this.noiseGfx.clear();
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const b = Math.floor(Math.random() * 255);
      this.noiseGfx.fillStyle(Phaser.Display.Color.GetColor(b, b, b), 0.5);
      this.noiseGfx.fillRect(x, y, 3, 2);
    }
  }

  // --- Timeline steps ---

  private startNoise(): void {
    if (this.skipped) return;
    this.noiseActive = true;
  }

  private stopNoiseAndShowBar(): void {
    if (this.skipped) return;
    this.noiseActive = false;
    this.noiseGfx.clear();

    // Red BREAKING NEWS bar slides in
    const bar = this.add.rectangle(-GAME_WIDTH / 2, 200, GAME_WIDTH, 44, 0xcc0000).setDepth(10);
    const label = this.add
      .text(-GAME_WIDTH / 2, 200, 'BREAKING NEWS', {
        fontSize: '24px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);

    const t = this.tweens.add({
      targets: [bar, label],
      x: GAME_WIDTH / 2,
      duration: 300,
      ease: 'Power2',
    });
    this.tweenRefs.push(t);
  }

  private startTypewriter(): void {
    if (this.skipped) return;
    const fullText = "WORLD'S MOST QUESTIONABLE LEADERS\nCHALLENGE LOCAL CITIZEN\nTO BOXING MATCH";
    const textObj = this.add
      .text(GAME_WIDTH / 2, 260, '', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 40 },
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    let idx = 0;
    const timer = this.time.addEvent({
      delay: 40,
      repeat: fullText.length - 1,
      callback: () => {
        if (this.skipped) return;
        idx++;
        textObj.setText(fullText.substring(0, idx));
      },
    });
    this.timers.push(timer);
  }

  private showSecondBar(): void {
    if (this.skipped) return;
    const bar2 = this.add
      .rectangle(GAME_WIDTH / 2, 460, GAME_WIDTH - 32, 38, 0xcc0000)
      .setAlpha(0)
      .setDepth(10);
    const label2 = this.add
      .text(GAME_WIDTH / 2, 460, 'DEMOCRACY MAY DEPEND ON YOUR FISTS', {
        fontSize: '13px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(11);

    const t = this.tweens.add({
      targets: [bar2, label2],
      alpha: 1,
      duration: 400,
      ease: 'Linear',
    });
    this.tweenRefs.push(t);
  }

  private showAreYouReady(): void {
    if (this.skipped) return;
    const readyText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'ARE YOU READY?', {
        fontSize: '42px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0.1)
      .setAlpha(0)
      .setDepth(20);

    const t = this.tweens.add({
      targets: readyText,
      scale: 1.5,
      alpha: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });
    this.tweenRefs.push(t);
  }

  private showFight(): void {
    if (this.skipped) return;
    const fightText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'FIGHT!', {
        fontSize: '80px',
        color: '#FF2222',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0.1)
      .setAlpha(0)
      .setDepth(30);

    const t = this.tweens.add({
      targets: fightText,
      scale: 2.0,
      alpha: 1,
      duration: 350,
      ease: 'Power3',
    });
    this.tweenRefs.push(t);

    // Particle burst
    const particles = this.add.graphics().setDepth(25);
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const px = GAME_WIDTH / 2;
      const py = GAME_HEIGHT / 2;
      const dot = this.add
        .rectangle(px, py, 6, 6, 0xFFD700)
        .setDepth(25);

      const pt = this.tweens.add({
        targets: dot,
        x: px + Math.cos(angle) * 200,
        y: py + Math.sin(angle) * 200,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
      this.tweenRefs.push(pt);
    }
    particles.destroy();
  }

  private fadeAndFinish(): void {
    if (this.skipped) return;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.finish();
    });
  }

  // --- Skip & Finish ---

  private skip(): void {
    if (this.skipped) return;
    this.skipped = true;
    this.noiseActive = false;
    this.noiseGfx.clear();

    for (const timer of this.timers) {
      timer.destroy();
    }
    for (const tween of this.tweenRefs) {
      tween.stop();
    }
    this.timers = [];
    this.tweenRefs = [];

    this.finish();
  }

  private finish(): void {
    localStorage.setItem('dictator_has_seen_intro', 'true');
    this.scene.start('TutorialScene');
  }

  // --- Helpers ---

  private schedule(delayMs: number, callback: () => void): void {
    const timer = this.time.delayedCall(delayMs, callback);
    this.timers.push(timer);
  }

  shutdown(): void {
    this.noiseActive = false;
    for (const timer of this.timers) {
      timer.destroy();
    }
    for (const tween of this.tweenRefs) {
      tween.stop();
    }
    this.events.removeAllListeners();
  }
}
