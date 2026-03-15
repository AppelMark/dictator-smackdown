import { CharacterArchetype } from './character';

export interface PlayerProfile {
  id: string;
  anonymousId: string;
  displayName: string;
  createdAt: string;
  lastPlayedAt: string;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  purchasedDLC: string[];
  hasCompletedRoad: boolean;
  hardModeUnlocked: boolean;
}

export interface CharacterProgress {
  playerId: string;
  archetype: CharacterArchetype;
  wins: number;
  losses: number;
  stars: number;
  bestScore: number;
  bestTime: number;
  unlocked: boolean;
}

export interface DailyChallenge {
  challengeDate: string;
  archetype: CharacterArchetype;
  parScore: number;
  description: string;
}

export interface ChallengeLink {
  id: string;
  challengerId: string;
  challengerName: string;
  archetype: CharacterArchetype;
  score: number;
  createdAt: string;
  expiresAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  archetype: CharacterArchetype;
  score: number;
  timeSeconds: number;
  maxCombo: number;
}
