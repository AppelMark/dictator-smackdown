import { CharacterArchetype } from '../types/character';
import type { CharacterStats } from '../types/character';
import { PunchType } from '../types/battle';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const ROAD_TO_CHAMPION: CharacterArchetype[] = [
  CharacterArchetype.DerGroszer,
  CharacterArchetype.TheDon,
  CharacterArchetype.TheNationalist,
  CharacterArchetype.TheChairman,
  CharacterArchetype.TheAyatollah,
  CharacterArchetype.TheGeneralissimo,
];

export const PUNCH_DAMAGE: Record<PunchType, number> = {
  [PunchType.Jab]: 8,
  [PunchType.Cross]: 14,
  [PunchType.Hook]: 18,
  [PunchType.Uppercut]: 25,
  [PunchType.Special]: 40,
};

export const COMBO_MULTIPLIERS: number[] = [1.0, 1.1, 1.2, 1.4, 1.6];

export const HIT_STOP_FRAMES: Record<PunchType, number> = {
  [PunchType.Jab]: 3,
  [PunchType.Cross]: 4,
  [PunchType.Hook]: 5,
  [PunchType.Uppercut]: 8,
  [PunchType.Special]: 12,
};

export const CAMERA_SHAKE_INTENSITY: Record<PunchType, number> = {
  [PunchType.Jab]: 0.005,
  [PunchType.Cross]: 0.008,
  [PunchType.Hook]: 0.012,
  [PunchType.Uppercut]: 0.018,
  [PunchType.Special]: 0.025,
};

export const FACE_PART_THRESHOLDS: Record<string, number> = {
  left_ear: 0.25,
  right_ear: 0.35,
  nose: 0.5,
  left_eye: 0.65,
  tooth: 0.75,
  all: 1.0,
};

export const ARCHETYPE_STATS: Record<CharacterArchetype, CharacterStats> = {
  [CharacterArchetype.DerGroszer]: { health: 100, maxHealth: 100, stamina: 80, maxStamina: 80, strength: 90, defense: 40, speed: 30, momentum: 50 },
  [CharacterArchetype.TheDon]: { health: 85, maxHealth: 85, stamina: 90, maxStamina: 90, strength: 70, defense: 50, speed: 60, momentum: 50 },
  [CharacterArchetype.TheNationalist]: { health: 75, maxHealth: 75, stamina: 100, maxStamina: 100, strength: 60, defense: 35, speed: 95, momentum: 50 },
  [CharacterArchetype.TheChairman]: { health: 90, maxHealth: 90, stamina: 85, maxStamina: 85, strength: 55, defense: 85, speed: 40, momentum: 50 },
  [CharacterArchetype.TheAyatollah]: { health: 80, maxHealth: 80, stamina: 90, maxStamina: 90, strength: 75, defense: 60, speed: 55, momentum: 50 },
  [CharacterArchetype.TheGeneralissimo]: { health: 110, maxHealth: 110, stamina: 70, maxStamina: 70, strength: 95, defense: 70, speed: 25, momentum: 50 },
};

export const COOLDOWN_BETWEEN_PUNCHES_MS = 200;
export const DOUBLE_TAP_THRESHOLD_MS = 300;
export const LONG_PRESS_THRESHOLD_MS = 500;
export const DODGE_MIN_DELTA_X = 60;
export const DODGE_MAX_DURATION_MS = 150;
export const TELEGRAPH_DURATION_MS = 450;
export const COUNTER_WINDOW_DURATION_MS = 200;
export const COUNTER_DAMAGE_MULTIPLIER = 2.0;
export const MOMENTUM_HIGH_THRESHOLD = 70;
export const MOMENTUM_LOW_THRESHOLD = 30;
export const MOMENTUM_HIGH_MULTIPLIER = 1.2;
export const MOMENTUM_LOW_MULTIPLIER = 0.8;

export const STAR_TIME_THRESHOLD_SECONDS = 90;

export const PLAYER_BASE_HEALTH = 100;
export const PLAYER_BASE_STRENGTH = 80;
export const PLAYER_BASE_DEFENSE = 50;
