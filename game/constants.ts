import { CharacterArchetype } from '../types/character';
import { PunchType } from '../types/battle';

// --- Scherm ---
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

// --- Tap Zones ---
export const TAP_ZONE_SPLIT = 195;
export const TAP_DOUBLE_WINDOW = 300;
export const TAP_HOLD_DURATION = 500;
export const TAP_COOLDOWN = 200;

// --- Dodge ---
export const DODGE_MIN_DELTA_X = 60;
export const DODGE_MAX_DURATION_MS = 150;

// --- Schade per PunchType (Special wordt per character bepaald via signatureMove) ---
export const PUNCH_DAMAGE: Partial<Record<PunchType, number>> = {
  [PunchType.Jab]: 8,
  [PunchType.Cross]: 14,
  [PunchType.Hook]: 18,
  [PunchType.Uppercut]: 26,
};

// --- Hit-stop frames per PunchType ---
export const HIT_STOP_FRAMES: Record<PunchType, number> = {
  [PunchType.Jab]: 3,
  [PunchType.Cross]: 4,
  [PunchType.Hook]: 5,
  [PunchType.Uppercut]: 8,
  [PunchType.Special]: 12,
};

// --- Camera shake intensiteit per PunchType ---
export const CAMERA_SHAKE_INTENSITY: Record<PunchType, number> = {
  [PunchType.Jab]: 0.003,
  [PunchType.Cross]: 0.005,
  [PunchType.Hook]: 0.008,
  [PunchType.Uppercut]: 0.015,
  [PunchType.Special]: 0.025,
};

// --- Combo multipliers (index = combo positie) ---
export const COMBO_MULTIPLIERS: number[] = [1.0, 1.1, 1.2, 1.4, 1.6];

// --- Telegraph en Counter ---
export const TELEGRAPH_DURATION = 450;
export const COUNTER_WINDOW = 200;
export const COUNTER_MULTIPLIER = 2.0;

// --- Momentum ---
export const MOMENTUM_HIT_GAIN = 8;
export const MOMENTUM_DAMAGE_LOSS = 12;
export const MOMENTUM_MISS_LOSS = 5;
export const MOMENTUM_HIGH_THRESHOLD = 70;
export const MOMENTUM_LOW_THRESHOLD = 30;
export const MOMENTUM_HIGH_BONUS = 0.20;
export const MOMENTUM_LOW_PENALTY = 0.20;

// --- Onderdeel loslaat-thresholds (percentage van maxHealth verlies) ---
export const FACE_PART_THRESHOLDS: Record<string, number> = {
  left_ear: 0.25,
  right_ear: 0.35,
  nose: 0.50,
  left_eye: 0.65,
  tooth: 0.75,
};

// --- Road to Champion volgorde ---
export const ROAD_TO_CHAMPION: CharacterArchetype[] = [
  CharacterArchetype.DerGroszer,
  CharacterArchetype.TheDon,
  CharacterArchetype.TheNationalist,
  CharacterArchetype.TheChairman,
  CharacterArchetype.TheAyatollah,
  CharacterArchetype.TheGeneralissimo,
];

// --- Ster eisen ---
export const STAR_TWO_TIME_LIMIT = 90;
export const STAR_THREE_NO_DAMAGE = true;

// --- Archetype stats ---
export interface ArchetypeConfig {
  strength: number;
  speed: number;
  defense: number;
  maxHealth: number;
  maxStamina: number;
  aiStyle: string;
  difficultyRating: number;
}

export const ARCHETYPE_STATS: Record<CharacterArchetype, ArchetypeConfig> = {
  [CharacterArchetype.DerGroszer]: { strength: 95, speed: 35, defense: 80, maxHealth: 120, maxStamina: 100, aiStyle: 'berserker', difficultyRating: 1 },
  [CharacterArchetype.TheDon]: { strength: 65, speed: 55, defense: 40, maxHealth: 100, maxStamina: 110, aiStyle: 'chaotic', difficultyRating: 2 },
  [CharacterArchetype.TheNationalist]: { strength: 75, speed: 90, defense: 55, maxHealth: 100, maxStamina: 120, aiStyle: 'speedster', difficultyRating: 3 },
  [CharacterArchetype.TheChairman]: { strength: 70, speed: 70, defense: 90, maxHealth: 110, maxStamina: 100, aiStyle: 'defensive', difficultyRating: 4 },
  [CharacterArchetype.TheAyatollah]: { strength: 80, speed: 50, defense: 85, maxHealth: 105, maxStamina: 95, aiStyle: 'counter', difficultyRating: 5 },
  [CharacterArchetype.TheGeneralissimo]: { strength: 100, speed: 20, defense: 70, maxHealth: 140, maxStamina: 90, aiStyle: 'boss', difficultyRating: 6 },
};
