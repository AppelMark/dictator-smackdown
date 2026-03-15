import { CharacterArchetype, PunchType } from './character';

export interface PunchEvent {
  type: PunchType;
  power: number;
  timestamp: number;
  isCounter: boolean;
  comboPosition: number;
}

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  isBlocked: boolean;
  isCritical: boolean;
  isCounter: boolean;
  comboMultiplier: number;
  momentumMultiplier: number;
}

export interface BattleState {
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
  difficulty: 1 | 2 | 3;
}

export interface HUDData {
  playerHealth: number;
  playerMaxHealth: number;
  opponentHealth: number;
  opponentMaxHealth: number;
  comboCount: number;
  momentum: number;
  timeElapsed: number;
  score: number;
}

export interface BattleResult {
  won: boolean;
  archetype: CharacterArchetype;
  score: number;
  timeSeconds: number;
  maxCombo: number;
  damageDealt: number;
  damageTaken: number;
  dodgesSuccessful: number;
  countersLanded: number;
  perfectDodges: number;
  stars: number;
}

export interface DodgeEvent {
  direction: 'left' | 'right';
  timestamp: number;
  successful: boolean;
}

export interface CounterWindow {
  active: boolean;
  startTime: number;
  duration: number;
}
