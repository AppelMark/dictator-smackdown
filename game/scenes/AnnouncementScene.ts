import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { CHARACTERS } from '../../data/characters';
import { CharacterArchetype } from '../../types/character';

export class AnnouncementScene extends Phaser.Scene {
  private archetype: CharacterArchetype = CharacterArchetype.DerGroszer;
  private sceneData: Record<string, unknown> = {};
  private timers: Phaser.Time.TimerEvent[] = [];
  private tweenRefs: Phaser.Tweens.Tween[] = [];
  private skipped: boolean = false;

  constructor() {
    super({ key: 'AnnouncementScene' });
  }

  init(data: Record<string, unknown>): void {
    this.archetype = (data.archetype as CharacterArchetype) ?? CharacterArchetype.DerGroszer;
    this.sceneData = data;
    this.skipped = false;
    this.timers = [];
    this.tweenRefs = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    // --- Skip button ---
    const skipZone = this.add
      .zone(GAME_WIDTH - 44, 22, 88, 44)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);

    this.add
      .text(GAME_WIDTH - 16, 22, '[ SKIP ]', {
        fontSize: '14px',
        color: '#555555',
        fontFamily: 'Arial',
      })
      .setOrigin(1, 0)
      .setDepth(100);

    skipZone.on('pointerdown', () => this.goToBattle());

    // --- Check if first time ---
    const storageKey = `dictator_seen_announcement_${this.archetype}`;
    const hasSeen = localStorage.getItem(storageKey) === 'true';

    if (hasSeen) {
      this.playShortVersion();
    } else {
      localStorage.setItem(storageKey, 'true');
      this.playFullVersion();
    }
  }

  // ============================================================
  // Full version (5 seconds)
  // ============================================================

  private playFullVersion(): void {
    const charName = this.getCharacterName();

    // 300ms — "TONIGHT" bar scales up
    this.schedule(300, () => {
      if (this.skipped) return;

      const tonightBar = this.add
        .rectangle(GAME_WIDTH / 2, 200, GAME_WIDTH - 40, 44, 0xcc0000)
        .setScale(0, 1)
        .setDepth(10);

      const tonightText = this.add
        .text(GAME_WIDTH / 2, 200, 'TONIGHT', {
          fontSize: '28px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(11);

      this.addTween({
        targets: tonightBar,
        scaleX: 1,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (!this.skipped) tonightText.setAlpha(1);
        },
      });
    });

    // 1000ms — Character name zooms in
    this.schedule(1000, () => {
      if (this.skipped) return;

      const nameText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, charName.toUpperCase(), {
          fontSize: '44px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScale(3)
        .setAlpha(0)
        .setDepth(20);

      this.addTween({
        targets: nameText,
        scale: 1,
        alpha: 1,
        duration: 500,
        ease: 'Power3',
      });
    });

    // 2000ms — "VS" appears
    this.schedule(2000, () => {
      if (this.skipped) return;

      const vs = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'VS', {
          fontSize: '36px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(20);

      this.addTween({
        targets: vs,
        alpha: 1,
        duration: 300,
      });
    });

    // 2600ms — "YOU" appears
    this.schedule(2600, () => {
      if (this.skipped) return;

      const you = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'YOU', {
          fontSize: '40px',
          color: '#3366FF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(0.3)
        .setAlpha(0)
        .setDepth(20);

      this.addTween({
        targets: you,
        scale: 1,
        alpha: 1,
        duration: 400,
        ease: 'Back.easeOut',
      });
    });

    // 3500ms — "FIGHT!" explodes with particles
    this.schedule(3500, () => {
      if (this.skipped) return;
      this.showFightBurst();
    });

    // 4700ms — Fade out and transition
    this.schedule(4700, () => {
      if (this.skipped) return;
      this.fadeAndGo();
    });
  }

  // ============================================================
  // Short version (1.5 seconds)
  // ============================================================

  private playShortVersion(): void {
    const charName = this.getCharacterName();

    // Instant name
    const nameText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, charName.toUpperCase(), {
        fontSize: '40px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScale(2)
      .setAlpha(0)
      .setDepth(20);

    this.addTween({
      targets: nameText,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // 500ms — FIGHT!
    this.schedule(500, () => {
      if (this.skipped) return;
      this.showFightBurst();
    });

    // 1200ms — Fade
    this.schedule(1200, () => {
      if (this.skipped) return;
      this.fadeAndGo();
    });
  }

  // ============================================================
  // Shared
  // ============================================================

  private showFightBurst(): void {
    const fightText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'FIGHT!', {
        fontSize: '72px',
        color: '#FF2222',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0.1)
      .setAlpha(0)
      .setDepth(30);

    this.addTween({
      targets: fightText,
      scale: 2.0,
      alpha: 1,
      duration: 300,
      ease: 'Power3',
    });

    // Particle burst
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const dot = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 5, 5, 0xFFD700)
        .setDepth(25);

      this.addTween({
        targets: dot,
        x: GAME_WIDTH / 2 + Math.cos(angle) * 160,
        y: GAME_HEIGHT / 2 + 50 + Math.sin(angle) * 160,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private fadeAndGo(): void {
    if (this.skipped) return;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.goToBattle();
    });
  }

  private goToBattle(): void {
    if (this.skipped) return;
    this.skipped = true;

    for (const t of this.timers) t.destroy();
    for (const tw of this.tweenRefs) tw.stop();

    this.scene.start('BattleScene', this.sceneData);
  }

  private getCharacterName(): string {
    const char = CHARACTERS.find((c) => c.archetype === this.archetype);
    return char?.name ?? this.archetype;
  }

  // ============================================================
  // Helpers
  // ============================================================

  private schedule(delayMs: number, callback: () => void): void {
    const timer = this.time.delayedCall(delayMs, callback);
    this.timers.push(timer);
  }

  private addTween(config: Phaser.Types.Tweens.TweenBuilderConfig): void {
    const tween = this.tweens.add(config);
    this.tweenRefs.push(tween);
  }

  shutdown(): void {
    for (const t of this.timers) t.destroy();
    for (const tw of this.tweenRefs) tw.stop();
    this.events.removeAllListeners();
  }
}
