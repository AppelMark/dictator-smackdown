import { FACE_PART_THRESHOLDS } from '../constants';

/** Locally defined since FacePart was removed from the types. */
interface FacePart {
  id: string;
  name: string;
  healthThreshold: number;
  sprite: string;
}

export class FacePartManager {
  private scene: Phaser.Scene;
  private detachedParts: Set<string> = new Set();
  private faceParts: FacePart[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.faceParts = Object.entries(FACE_PART_THRESHOLDS)
      .filter(([id]) => id !== 'all')
      .map(([id, threshold]) => ({
        id,
        name: id.replace('_', ' '),
        healthThreshold: threshold,
        sprite: `face_${id}`,
      }));
  }

  checkDetachment(healthLostPercent: number): FacePart[] {
    const newlyDetached: FacePart[] = [];

    for (const part of this.faceParts) {
      if (this.detachedParts.has(part.id)) continue;
      if (healthLostPercent >= part.healthThreshold) {
        this.detachedParts.add(part.id);
        newlyDetached.push(part);
        this.detachPart(part);
      }
    }

    return newlyDetached;
  }

  private detachPart(part: FacePart): void {
    this.scene.events.emit('face_part_detached', part);
  }

  detachAll(): void {
    for (const part of this.faceParts) {
      if (!this.detachedParts.has(part.id)) {
        this.detachedParts.add(part.id);
        this.detachPart(part);
      }
    }
  }

  reset(): void {
    this.detachedParts.clear();
  }

  destroy(): void {
    this.detachedParts.clear();
  }
}
