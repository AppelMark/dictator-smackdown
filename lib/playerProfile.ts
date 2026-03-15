import type { PlayerProfile, CharacterProgress } from '../types/progression';
import { CharacterArchetype } from '../types/character';
import { createBrowserClient } from './supabase';

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
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      totalWins: 0,
      totalLosses: 0,
      currentStreak: 0,
      bestStreak: 0,
      purchasedDLC: [],
      hasCompletedRoad: false,
      hardModeUnlocked: false,
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
