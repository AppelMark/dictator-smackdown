import { CharacterArchetype } from '../../types/character';

export class DefeatScene extends Phaser.Scene {
  private archetype: CharacterArchetype = CharacterArchetype.DerGroszer;

  constructor() {
    super({ key: 'DefeatScene' });
  }

  init(data: { archetype: CharacterArchetype }): void {
    this.archetype = data.archetype;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 3, 'DEFEATED', {
        fontSize: '48px',
        color: '#888888',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, `${this.archetype} wins this round.`, {
        fontSize: '18px',
        color: '#AAAAAA',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 100, 'Tap to retry', {
        fontSize: '18px',
        color: '#FFD700',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('BattleScene', { archetype: this.archetype });
    });
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
