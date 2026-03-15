export class ChampionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ChampionScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 3, 'WORLD CHAMPION!', {
        fontSize: '36px',
        color: '#FFD700',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, 'You defeated all dictators.', {
        fontSize: '18px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 40, 'Hard Mode Unlocked!', {
        fontSize: '20px',
        color: '#FF4444',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 100, 'Tap to continue', {
        fontSize: '16px',
        color: '#AAAAAA',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      window.location.href = '/select';
    });
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
