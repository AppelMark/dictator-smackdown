export class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 3, 'HOW TO FIGHT', {
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    const instructions = [
      'Tap LEFT = Jab',
      'Tap RIGHT = Hook',
      'Double tap = Cross / Uppercut',
      'Swipe = Dodge',
      'Hold = Special Move',
    ];

    instructions.forEach((text, i) => {
      this.add
        .text(width / 2, height / 3 + 60 + i * 35, text, {
          fontSize: '16px',
          color: '#FFFFFF',
        })
        .setOrigin(0.5);
    });

    this.add
      .text(width / 2, height - 100, 'Tap to start fighting!', {
        fontSize: '18px',
        color: '#AAAAAA',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      localStorage.setItem('dictator_has_seen_tutorial', 'true');
      window.location.href = '/select';
    });
  }
}
