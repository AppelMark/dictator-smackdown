export class AudioManager {
  private scene: Phaser.Scene;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playSFX(key: string, volume: number = 1.0): void {
    if (!this.sfxEnabled) return;
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume });
    }
  }

  playCommentary(key: string): void {
    if (!this.sfxEnabled) return;
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: 0.8 });
    }
  }

  playCatchphrase(key: string): void {
    if (!this.sfxEnabled) return;
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: 0.9 });
    }
  }

  toggleSFX(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }

  destroy(): void {
    this.scene.sound.removeAll();
  }
}
