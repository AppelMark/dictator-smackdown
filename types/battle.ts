export enum TapZone {
  Left = 'Left',
  Right = 'Right',
}

export enum PunchType {
  Jab = 'Jab',
  Cross = 'Cross',
  Hook = 'Hook',
  Uppercut = 'Uppercut',
  Special = 'Special',
}

export interface PunchEvent {
  type: PunchType;
  power: number;
  direction: 'left' | 'right';
  hand: 'left' | 'right';
  comboPosition: number;
}

export interface DamageResult {
  damage: number;
  isBlocked: boolean;
  hitPart: string;
  triggerDetach: boolean;
  partName?: string;
  isCounter: boolean;
  isCritical: boolean;
}

export enum BattleState {
  Loading = 'Loading',
  Tutorial = 'Tutorial',
  Idle = 'Idle',
  PlayerTurn = 'PlayerTurn',
  EnemyTelegraph = 'EnemyTelegraph',
  PlayerReact = 'PlayerReact',
  Animating = 'Animating',
  AITurn = 'AITurn',
  ComboWindow = 'ComboWindow',
  SpecialCharging = 'SpecialCharging',
  SpecialExecuting = 'SpecialExecuting',
  KnockDown = 'KnockDown',
  KO = 'KO',
  Victory = 'Victory',
  Defeat = 'Defeat',
}

export interface ScoreBreakdown {
  baseDamageScore: number;
  comboBonus: number;
  timeBonus: number;
  counterBonus: number;
  noDamageBonus: number;
  partsDetachedBonus: number;
  totalScore: number;
}

export interface BattleResult {
  winner: 'player' | 'ai';
  timeSeconds: number;
  playerDamageDealt: number;
  highestCombo: number;
  specialUsed: boolean;
  partsDetached: number;
  tookNoDamage: boolean;
  counterHits: number;
  scoreBreakdown: ScoreBreakdown;
}
