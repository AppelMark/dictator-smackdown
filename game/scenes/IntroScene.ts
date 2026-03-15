export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 2, 'DICTATOR SMACKDOWN', {
        fontSize: '32px',
        color: '#FFD700',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 60, 'Tap to begin', {
        fontSize: '16px',
        color: '#AAAAAA',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      localStorage.setItem('dictator_has_seen_intro', 'true');
      this.scene.start('TutorialScene');
    });
  }
}
