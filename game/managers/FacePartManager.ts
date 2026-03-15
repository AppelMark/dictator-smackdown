import { FACE_PART_THRESHOLDS } from '../constants';
import { PunchType } from '../../types/battle';
import type { PunchEvent } from '../../types/battle';

const PART_NAMES = ['left_ear', 'right_ear', 'nose', 'left_eye', 'tooth'] as const;
export class FacePartManager {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private detachedParts: Set<string> = new Set();
  private parts: Map<string, Phaser.GameObjects.Shape> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setDepth(10);

    this.createParts();
  }

  private createParts(): void {
    // Left ear — orange circle
    const leftEar = this.scene.add.circle(-45, -20, 12, 0xFF8C00);
    this.container.add(leftEar);
    this.parts.set('left_ear', leftEar);

    // Right ear — orange circle
    const rightEar = this.scene.add.circle(45, -20, 12, 0xFF8C00);
    this.container.add(rightEar);
    this.parts.set('right_ear', rightEar);

    // Nose — red ellipse
    const nose = this.scene.add.ellipse(0, 10, 20, 28, 0xCC3333);
    this.container.add(nose);
    this.parts.set('nose', nose);

    // Left eye — white circle
    const leftEye = this.scene.add.circle(-20, -15, 8, 0xFFFFFF);
    this.container.add(leftEye);
    this.parts.set('left_eye', leftEye);

    // Tooth — yellow rectangle
    const tooth = this.scene.add.rectangle(5, 25, 6, 10, 0xFFFF66);
    this.container.add(tooth);
    this.parts.set('tooth', tooth);
  }

  checkAndDetach(
    currentHealth: number,
    maxHealth: number,
    lastPunch: PunchEvent
  ): string | null {
    const healthRatio = currentHealth / maxHealth;

    for (const partName of PART_NAMES) {
      const threshold = FACE_PART_THRESHOLDS[partName];
      if (threshold === undefined) continue;

      // threshold represents how much health must be LOST (e.g. 0.25 = 25% lost)
      // healthRatio < (1 - threshold) means enough damage has been dealt
      if (healthRatio <= 1 - threshold && !this.detachedParts.has(partName)) {
        this.detachPart(partName, lastPunch, 1.0);
        return partName;
      }
    }

    return null;
  }

  private detachPart(
    partName: string,
    punch: PunchEvent,
    velocityScale: number
  ): void {
    const shape = this.parts.get(partName);
    if (!shape || this.detachedParts.has(partName)) return;

    this.detachedParts.add(partName);

    // Calculate world position
    const matrix = this.container.getWorldTransformMatrix();
    const worldX = matrix.tx + shape.x * matrix.a;
    const worldY = matrix.ty + shape.y * matrix.d;

    // Remove from container
    this.container.remove(shape);

    // Re-add to scene at world position
    shape.setPosition(worldX, worldY);
    shape.setDepth(12);

    // Add Matter.js physics body
    const physicsShape = this.scene.matter.add.gameObject(shape, {
      restitution: 0.65,
      frictionAir: 0.02,
      density: 0.002,
      shape: { type: 'circle', radius: 10 },
    }) as Phaser.Physics.Matter.Sprite;

    // Calculate velocity based on punch direction
    const dirSign = punch.direction === 'left' ? -1 : 1;
    const baseVelX = dirSign * (6 + Math.random() * 4);
    const isUppercut = punch.type === PunchType.Uppercut;
    const baseVelY = isUppercut
      ? -(12 + Math.random() * 6)
      : -(3 + Math.random() * 3);

    const velX = baseVelX * velocityScale;
    const velY = baseVelY * velocityScale;
    const angularVel = (Math.random() - 0.5) * 0.8;

    physicsShape.setVelocity(velX, velY);
    physicsShape.setAngularVelocity(angularVel);

    // Fade out and destroy after 4 seconds
    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: shape,
        alpha: 0,
        duration: 500,
        onComplete: () => shape.destroy(),
      });
    });

    // Emit event for JuiceManager
    this.scene.events.emit('face_part_detached', partName, worldX, worldY);
  }

  detachAll(punch: PunchEvent): void {
    for (const partName of PART_NAMES) {
      if (!this.detachedParts.has(partName)) {
        this.detachPart(partName, punch, 2.5);
      }
    }
  }

  updateContainerPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  reset(): void {
    // Destroy remaining physics parts
    for (const [name, shape] of this.parts) {
      if (this.detachedParts.has(name)) {
        shape.destroy();
      }
    }
    this.parts.clear();
    this.detachedParts.clear();
    this.container.removeAll(true);
    this.createParts();
  }

  destroy(): void {
    for (const shape of this.parts.values()) {
      shape.destroy();
    }
    this.parts.clear();
    this.detachedParts.clear();
    this.container.destroy();
  }
}
