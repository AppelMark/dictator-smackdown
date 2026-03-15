import { CharacterArchetype } from '../../types/character';
import { GAME_WIDTH, GAME_HEIGHT, ROAD_TO_CHAMPION } from '../constants';
import { getOrCreateProfile } from '../../lib/playerProfile';
import { createBrowserClient } from '../../lib/supabase';

const ARCHETYPE_COLORS: Record<CharacterArchetype, number> = {
  [CharacterArchetype.DerGroszer]: 0xFF4444,
  [CharacterArchetype.TheDon]: 0xFF8C00,
  [CharacterArchetype.TheNationalist]: 0x00BFFF,
  [CharacterArchetype.TheChairman]: 0xFF2222,
  [CharacterArchetype.TheAyatollah]: 0x22CC44,
  [CharacterArchetype.TheGeneralissimo]: 0x9933FF,
  [CharacterArchetype.TheOligarch]: 0xFFD700,
  [CharacterArchetype.TheTechMessiah]: 0x00FFCC,
};

const CONFETTI_COLORS = [0xFFD700, 0xFF4444, 0x33CC33, 0x3366FF, 0xFF66FF, 0xFF8C00];

export class ChampionScene extends Phaser.Scene {
  private displayName: string = 'Champion';
  private globeAngle: number = 0;
  private globeGfx!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ChampionScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    const cx = GAME_WIDTH / 2;

    // Load player name async
    getOrCreateProfile()
      .then((profile) => {
        this.displayName = profile.display_name;
        this.showPlayerName();
      })
      .catch(() => {
        this.showPlayerName();
      });

    // --- Golden globe ---
    this.globeGfx = this.add.graphics().setDepth(2);

    // --- WORLD CHAMPION rotating text ---
    this.titleText = this.add
      .text(cx, 160, 'WORLD CHAMPION', {
        fontSize: '32px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Subtle float animation on title
    this.tweens.add({
      targets: this.titleText,
      y: { from: 155, to: 165 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- Dictator Smasher badge ---
    this.add
      .text(cx, 200, 'DICTATOR SMASHER', {
        fontSize: '14px',
        color: '#FF4444',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // --- Six archetype badges ---
    const badgeY = 350;
    const badgeSpacing = (GAME_WIDTH - 60) / 6;
    const badgeStartX = 30 + badgeSpacing / 2;

    ROAD_TO_CHAMPION.forEach((archetype, i) => {
      const color = ARCHETYPE_COLORS[archetype] ?? 0xFFD700;
      const badge = this.add
        .rectangle(badgeStartX + i * badgeSpacing, badgeY, 36, 36, color)
        .setDepth(10);

      // Scale in one by one
      badge.setScale(0);
      this.tweens.add({
        targets: badge,
        scale: 1,
        duration: 300,
        delay: 500 + i * 200,
        ease: 'Back.easeOut',
      });

      // Checkmark
      this.time.delayedCall(800 + i * 200, () => {
        this.add
          .text(badgeStartX + i * badgeSpacing, badgeY, '✓', {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(11);
      });
    });

    // --- Continuous confetti ---
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => this.spawnConfettiPiece(),
    });

    // --- Firework bursts ---
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.fireworkBurst(),
    });

    // --- Hard Mode section ---
    this.add
      .text(cx, 420, 'Think you are good enough?', {
        fontSize: '14px',
        color: '#AAAAAA',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, 440, 'Try Hard Mode.', {
        fontSize: '16px',
        color: '#FF4444',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    const hardBtn = this.add
      .text(cx, 485, 'HARD MODE', {
        fontSize: '20px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#CC2222',
        padding: { x: 28, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    hardBtn.on('pointerdown', () => this.startHardMode());
    hardBtn.on('pointerover', () => hardBtn.setScale(1.05));
    hardBtn.on('pointerout', () => hardBtn.setScale(1.0));

    // --- Share button ---
    const shareBtn = this.add
      .text(cx, 545, 'SHARE ACHIEVEMENT', {
        fontSize: '14px',
        color: '#000000',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#FFD700',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    shareBtn.on('pointerdown', () => this.shareAchievement());
    shareBtn.on('pointerover', () => shareBtn.setScale(1.05));
    shareBtn.on('pointerout', () => shareBtn.setScale(1.0));

    // --- Daily Challenge teaser ---
    const dailyY = 620;

    this.add
      .text(cx, dailyY, 'DAILY CHALLENGE', {
        fontSize: '16px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, dailyY + 24, 'Every day a new fight.\nBeat the par score.\nCompete for the daily ranking.', {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'Arial',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // --- Back to select ---
    const backBtn = this.add
      .text(cx, GAME_HEIGHT - 40, 'BACK TO SELECTION', {
        fontSize: '13px',
        color: '#666666',
        fontFamily: 'Arial',
        textDecoration: 'underline',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      window.location.href = '/select';
    });
  }

  // ============================================================
  // Update — rotating globe
  // ============================================================

  update(_time: number, delta: number): void {
    this.globeAngle += delta * 0.0005;
    this.drawGlobe();
  }

  private drawGlobe(): void {
    const cx = GAME_WIDTH / 2;
    const cy = 270;
    const radius = 50;

    this.globeGfx.clear();

    // Outer circle
    this.globeGfx.lineStyle(2, 0xFFD700, 0.6);
    this.globeGfx.strokeCircle(cx, cy, radius);

    // Rotating longitude lines
    for (let i = 0; i < 4; i++) {
      const offset = this.globeAngle + (i * Math.PI) / 4;
      const xScale = Math.cos(offset) * radius;

      this.globeGfx.lineStyle(1, 0xFFD700, 0.3);
      this.globeGfx.beginPath();
      this.globeGfx.ellipse(
        cx, cy, Math.abs(xScale), radius, 0, 0, Math.PI * 2, false
      );
      this.globeGfx.strokePath();
    }

    // Latitude lines
    for (let i = -1; i <= 1; i++) {
      const ly = cy + i * 20;
      const lr = Math.sqrt(radius * radius - (i * 20) * (i * 20));
      this.globeGfx.lineStyle(1, 0xFFD700, 0.2);
      this.globeGfx.strokeCircle(cx, ly, lr);
    }
  }

  // ============================================================
  // Player name (loaded async)
  // ============================================================

  private showPlayerName(): void {
    this.add
      .text(GAME_WIDTH / 2, 230, this.displayName.toUpperCase(), {
        fontSize: '24px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  // ============================================================
  // Confetti & Fireworks
  // ============================================================

  private spawnConfettiPiece(): void {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const piece = this.add
      .rectangle(
        Math.random() * GAME_WIDTH,
        -5,
        4 + Math.random() * 4,
        4 + Math.random() * 4,
        color
      )
      .setDepth(5);

    this.tweens.add({
      targets: piece,
      y: GAME_HEIGHT + 10,
      x: piece.x + (Math.random() - 0.5) * 60,
      angle: Math.random() * 360,
      duration: 3000 + Math.random() * 2000,
      onComplete: () => piece.destroy(),
    });
  }

  private fireworkBurst(): void {
    const bx = 50 + Math.random() * (GAME_WIDTH - 100);
    const by = 80 + Math.random() * 200;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const spark = this.add
        .rectangle(bx, by, 4, 4, color)
        .setDepth(6);

      this.tweens.add({
        targets: spark,
        x: bx + Math.cos(angle) * (60 + Math.random() * 40),
        y: by + Math.sin(angle) * (60 + Math.random() * 40),
        alpha: 0,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ============================================================
  // Hard Mode
  // ============================================================

  private async startHardMode(): Promise<void> {
    try {
      const profile = await getOrCreateProfile();
      const supabase = createBrowserClient();

      // Reset all character progress for hard mode replay
      await supabase
        .from('character_progress')
        .update({
          wins: 0,
          losses: 0,
          best_score: 0,
          stars: 0,
          fastest_ko_seconds: null,
          total_damage_dealt: 0,
          highest_combo: 0,
        })
        .eq('player_id', profile.id);
    } catch {
      // Continue even if reset fails
    }

    sessionStorage.setItem('dictator_difficulty', '3');
    window.location.href = '/select';
  }

  // ============================================================
  // Share
  // ============================================================

  private async shareAchievement(): Promise<void> {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body);
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share) {
          const file = new File([blob], 'dictator-smackdown-champion.png', {
            type: 'image/png',
          });
          await navigator.share({
            title: 'Dictator Smackdown — World Champion!',
            text: `I defeated all dictators in Dictator Smackdown! Can you?`,
            files: [file],
          });
        }
      }, 'image/png');
    } catch {
      // Share API not available or user cancelled
    }
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
