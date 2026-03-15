import { PunchType } from '../../types/character';
import { HIT_STOP_FRAMES, CAMERA_SHAKE_INTENSITY } from '../constants';

export class JuiceManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  triggerHitFeedback(punchType: PunchType, isCritical: boolean): void {
    this.hitStop(punchType);
    this.cameraShake(punchType);
    this.spawnImpactText(punchType);

    if (isCritical) {
      this.screenFlash();
    }
  }

  private hitStop(punchType: PunchType): void {
    const frames = HIT_STOP_FRAMES[punchType];
    const durationMs = frames * (1000 / 60);
    this.scene.time.timeScale = 0.05;
    this.scene.time.delayedCall(durationMs, () => {
      this.scene.time.timeScale = 1.0;
    });
  }

  private cameraShake(punchType: PunchType): void {
    const intensity = CAMERA_SHAKE_INTENSITY[punchType];
    this.scene.cameras.main.shake(100, intensity);
  }

  private spawnImpactText(punchType: PunchType): void {
    const labels: Record<PunchType, string> = {
      [PunchType.Jab]: 'POW',
      [PunchType.Cross]: 'CRACK',
      [PunchType.Hook]: 'SMASH',
      [PunchType.Uppercut]: 'BOOM',
      [PunchType.Special]: 'DEVASTATION',
    };

    const { width, height } = this.scene.cameras.main;
    const text = this.scene.add
      .text(width / 2, height / 2, labels[punchType], {
        fontSize: '48px',
        color: '#FFD700',
        fontFamily: 'Bebas Neue',
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  private screenFlash(): void {
    this.scene.cameras.main.flash(150, 255, 255, 255);
  }

  destroy(): void {
    // cleanup handled by scene
  }
}
