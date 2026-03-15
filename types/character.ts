export enum CharacterArchetype {
  DerGroszer = 'DerGroszer',
  TheDon = 'TheDon',
  TheChairman = 'TheChairman',
  TheNationalist = 'TheNationalist',
  TheAyatollah = 'TheAyatollah',
  TheGeneralissimo = 'TheGeneralissimo',
  TheOligarch = 'TheOligarch',
  TheTechMessiah = 'TheTechMessiah',
}

export interface CharacterStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  strength: number;
  speed: number;
  defense: number;
  momentum: number;
}

export interface Move {
  name: string;
  animationKey: string;
  damage: number;
  staminaCost: number;
  duration: number;
  ragdollForce: { x: number; y: number };
  comboMultiplier: number;
}

export interface Character {
  id: string;
  archetype: CharacterArchetype;
  name: string;
  nickname: string;
  description: string;
  unlocked: boolean;
  isPaidDLC: boolean;
  dlcProductId?: string;
  stats: CharacterStats;
  moves: Move[];
  signatureMove: Move;
  catchphrases: string[];
  spriteKey: string;
  arenaKey: string;
  aiStyle: string;
  difficultyRating: 1 | 2 | 3 | 4 | 5 | 6;
}
