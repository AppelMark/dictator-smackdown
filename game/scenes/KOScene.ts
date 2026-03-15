import type { BattleResult } from '../../types/battle';

export class KOScene extends Phaser.Scene {
  private result!: BattleResult;

  constructor() {
    super({ key: 'KOScene' });
  }

  init(data: { result: BattleResult }): void {
    this.result = data.result;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add
      .text(width / 2, height / 3, 'K.O.!', {
        fontSize: '64px',
        color: '#FF4444',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, `Score: ${this.result.score}`, {
        fontSize: '32px',
        color: '#FFD700',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 50, `Time: ${this.result.timeSeconds}s`, {
        fontSize: '20px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    const stars = '★'.repeat(this.result.stars) + '☆'.repeat(3 - this.result.stars);
    this.add
      .text(width / 2, height / 2 + 90, stars, {
        fontSize: '32px',
        color: '#FFD700',
      })
      .setOrigin(0.5);
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
