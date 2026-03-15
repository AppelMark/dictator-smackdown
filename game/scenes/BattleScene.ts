import { CharacterArchetype } from '../../types/character';
import { BattleState } from '../../types/battle';

interface BattleSceneState {
  playerHealth: number;
  opponentHealth: number;
  playerMaxHealth: number;
  opponentMaxHealth: number;
  playerMomentum: number;
  opponentMomentum: number;
  comboCount: number;
  timeElapsed: number;
  isPlayerTurn: boolean;
  isPaused: boolean;
  archetype: CharacterArchetype;
  difficulty: number;
  phase: BattleState;
}

export class BattleScene extends Phaser.Scene {
  private battleState!: BattleSceneState;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { archetype?: CharacterArchetype }): void {
    const archetype = data.archetype ?? CharacterArchetype.DerGroszer;
    this.battleState = {
      playerHealth: 100,
      opponentHealth: 100,
      playerMaxHealth: 100,
      opponentMaxHealth: 100,
      playerMomentum: 50,
      opponentMomentum: 50,
      comboCount: 0,
      timeElapsed: 0,
      isPlayerTurn: true,
      isPaused: false,
      archetype,
      difficulty: 1,
      phase: BattleState.Loading,
    };
  }

  create(): void {
    this.scene.launch('HUDScene');

    this.game.events.emit('hud_update', {
      playerHealth: this.battleState.playerHealth,
      playerMaxHealth: this.battleState.playerMaxHealth,
      opponentHealth: this.battleState.opponentHealth,
      opponentMaxHealth: this.battleState.opponentMaxHealth,
      comboCount: this.battleState.comboCount,
      momentum: this.battleState.playerMomentum,
      timeElapsed: this.battleState.timeElapsed,
      score: 0,
    });
  }

  update(_time: number, delta: number): void {
    if (this.battleState.isPaused) return;
    this.battleState.timeElapsed += delta / 1000;
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
