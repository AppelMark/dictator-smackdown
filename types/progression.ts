import { CharacterArchetype } from './character';

export interface PlayerProfile {
  id: string;
  anonymousId: string;
  email?: string;
  displayName: string;
  totalFights: number;
  totalWins: number;
  currentStreak: number;
  highScores: Record<CharacterArchetype, number>;
  stars: Record<CharacterArchetype, 0 | 1 | 2 | 3>;
  unlockedArchetypes: CharacterArchetype[];
  purchasedDLC: string[];
  activeSeasonPass: boolean;
  seasonPassExpiry?: Date;
  trophies: string[];
  createdAt: Date;
  lastSeen: Date;
}

export interface DailyChallenge {
  date: string;
  archetype: CharacterArchetype;
  parScore: number;
  topPlayers: { name: string; score: number }[];
}

export interface ChallengeLink {
  id: string;
  challengerName: string;
  archetype: CharacterArchetype;
  score: number;
  createdAt: Date;
  completions: number;
  expiresAt: Date;
}
