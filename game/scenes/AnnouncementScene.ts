import { CharacterArchetype } from '../../types/character';

export class AnnouncementScene extends Phaser.Scene {
  private archetype: CharacterArchetype = CharacterArchetype.DerGroszer;

  constructor() {
    super({ key: 'AnnouncementScene' });
  }

  init(data: { archetype: CharacterArchetype }): void {
    this.archetype = data.archetype;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 3, 'NEXT FIGHT', {
        fontSize: '24px',
        color: '#FF4444',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, this.archetype, {
        fontSize: '36px',
        color: '#FFD700',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.scene.start('BattleScene', { archetype: this.archetype });
    });
  }
}
