export enum CharacterArchetype {
  DerGroszer = 'DerGroszer',
  TheDon = 'TheDon',
  TheNationalist = 'TheNationalist',
  TheChairman = 'TheChairman',
  TheAyatollah = 'TheAyatollah',
  TheGeneralissimo = 'TheGeneralissimo',
  TheOligarch = 'TheOligarch',
  TheTechMessiah = 'TheTechMessiah',
}

export enum PunchType {
  Jab = 'Jab',
  Cross = 'Cross',
  Hook = 'Hook',
  Uppercut = 'Uppercut',
  Special = 'Special',
}

export type AIStyle =
  | 'berserker'
  | 'chaotic'
  | 'speedster'
  | 'defensive'
  | 'counter'
  | 'boss';

export interface Move {
  type: PunchType;
  damage: number;
  speed: number;
  telegraphDuration: number;
}

export interface CharacterStats {
  health: number;
  strength: number;
  defense: number;
  speed: number;
  specialDamage: number;
}

export interface Character {
  archetype: CharacterArchetype;
  name: string;
  title: string;
  description: string;
  aiStyle: AIStyle;
  stats: CharacterStats;
  arena: string;
  difficulty: number;
  unlockCondition: string;
  isDLC: boolean;
  productId?: string;
}

export interface FacePart {
  id: string;
  name: string;
  healthThreshold: number;
  sprite: string;
}
