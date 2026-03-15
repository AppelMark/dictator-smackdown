import type { PlayerProfile } from '../types/progression';
import { CharacterArchetype } from '../types/character';
import { createBrowserClient } from './supabase';

/** Locally defined since CharacterProgress was removed from the types. */
interface CharacterProgress {
  archetype: CharacterArchetype;
  bestScore: number;
  bestTime: number;
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  defeated: boolean;
}

function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('dictator_anonymous_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('dictator_anonymous_id', id);
  }
  return id;
}

export async function getOrCreateProfile(): Promise<PlayerProfile> {
  const anonymousId = getAnonymousId();
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .single();

  if (error || !data) {
    const newProfile: PlayerProfile = {
      id: '',
      anonymousId,
      displayName: 'Fighter',
      totalFights: 0,
      totalWins: 0,
      currentStreak: 0,
      highScores: {} as Record<CharacterArchetype, number>,
      stars: {} as Record<CharacterArchetype, 0 | 1 | 2 | 3>,
      unlockedArchetypes: [],
      purchasedDLC: [],
      activeSeasonPass: false,
      trophies: [],
      createdAt: new Date(),
      lastSeen: new Date(),
    };
    return newProfile;
  }

  return data as unknown as PlayerProfile;
}

export async function getCharacterProgress(
  archetype: CharacterArchetype
): Promise<CharacterProgress | null> {
  const anonymousId = getAnonymousId();
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('character_progress')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .eq('archetype', archetype)
    .single();

  if (error || !data) return null;

  return data as unknown as CharacterProgress;
}

export function isArchetypeUnlocked(
  _archetype: CharacterArchetype,
  _progress: CharacterProgress[]
): boolean {
  // Placeholder for unlock logic
  return false;
}
