import type { HUDData } from '../../types/battle';

export class HUDScene extends Phaser.Scene {
  private playerHealthText?: Phaser.GameObjects.Text;
  private opponentHealthText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.playerHealthText = this.add.text(20, 20, 'HP: 100', {
      fontSize: '16px',
      color: '#00FF00',
    });

    this.opponentHealthText = this.add.text(20, 50, 'Enemy: 100', {
      fontSize: '16px',
      color: '#FF4444',
    });

    this.comboText = this.add.text(20, 80, '', {
      fontSize: '20px',
      color: '#FFD700',
    });

    this.timerText = this.add.text(this.cameras.main.width - 80, 20, '0:00', {
      fontSize: '16px',
      color: '#FFFFFF',
    });

    this.game.events.on('hud_update', this.updateHUD, this);
  }

  private updateHUD(data: HUDData): void {
    if (this.playerHealthText) {
      this.playerHealthText.setText(`HP: ${data.playerHealth}`);
    }
    if (this.opponentHealthText) {
      this.opponentHealthText.setText(`Enemy: ${data.opponentHealth}`);
    }
    if (this.comboText) {
      this.comboText.setText(
        data.comboCount > 1 ? `${data.comboCount}x COMBO` : ''
      );
    }
    if (this.timerText) {
      const minutes = Math.floor(data.timeElapsed / 60);
      const seconds = Math.floor(data.timeElapsed % 60);
      this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  }

  shutdown(): void {
    this.game.events.off('hud_update', this.updateHUD, this);
    this.events.removeAllListeners();
  }
}
