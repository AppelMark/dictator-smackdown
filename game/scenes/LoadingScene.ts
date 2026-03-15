import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const LOADING_MESSAGES = [
  'Polishing medals...',
  'Counting dollar bills...',
  'Training bears...',
  'Ironing the Mao suit...',
  'Inflating the ego...',
  'Buffing the gold combover...',
  'Preparing propaganda...',
  'Scheduling rigged elections...',
];

export class LoadingScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private messageTimer?: Phaser.Time.TimerEvent;
  private slowTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#000000');

    // --- Title ---
    this.add
      .text(GAME_WIDTH / 2, 120, 'DICTATOR\nSMACKDOWN', {
        fontSize: '48px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    // --- Progress bar background ---
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(GAME_WIDTH / 2 - 140, GAME_HEIGHT / 2 - 10, 280, 20, 10);

    // --- Progress bar fill ---
    this.progressBar = this.add.graphics();

    // --- Loading message ---
    this.loadingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, this.randomMessage(), {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // --- Rotate message every 1.5s ---
    this.messageTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        this.loadingText.setText(this.randomMessage());
      },
    });

    // --- Slow connection warning after 12s ---
    this.slowTimer = this.time.delayedCall(12000, () => {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Slow connection detected — still loading...', {
          fontSize: '12px',
          color: '#FF6666',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);
    });

    // --- Progress callback ---
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xcc0000, 1);
      this.progressBar.fillRoundedRect(
        GAME_WIDTH / 2 - 140,
        GAME_HEIGHT / 2 - 10,
        280 * value,
        20,
        10
      );
    });

    // --- Placeholder asset loads (vervang later met echte assets) ---
    this.load.image('placeholder_player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    this.load.image('placeholder_ai', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==');
    this.load.image('placeholder_arena', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==');
  }

  create(): void {
    // Cleanup timers
    this.messageTimer?.destroy();
    this.slowTimer?.destroy();

    const hasSeenIntro = localStorage.getItem('dictator_has_seen_intro') === 'true';
    const hasSeenTutorial = localStorage.getItem('dictator_has_seen_tutorial') === 'true';

    if (!hasSeenIntro) {
      this.scene.start('IntroScene');
    } else if (!hasSeenTutorial) {
      this.scene.start('TutorialScene');
    } else {
      this.game.events.emit('goto_select');
      window.location.href = '/select';
    }
  }

  private randomMessage(): string {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  }

  shutdown(): void {
    this.messageTimer?.destroy();
    this.slowTimer?.destroy();
    this.events.removeAllListeners();
  }
}
