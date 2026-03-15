import { CharacterArchetype } from '../../types/character';

export class UnlockScene extends Phaser.Scene {
  private unlockedArchetype: CharacterArchetype = CharacterArchetype.TheDon;

  constructor() {
    super({ key: 'UnlockScene' });
  }

  init(data: { archetype: CharacterArchetype }): void {
    this.unlockedArchetype = data.archetype;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 3, 'NEW CHALLENGER!', {
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, this.unlockedArchetype, {
        fontSize: '36px',
        color: '#FFFFFF',
        fontFamily: 'Bebas Neue',
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
