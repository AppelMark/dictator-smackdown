import { CharacterArchetype } from '../types/character';
import type { BattleResult } from '../types/battle';
import { createBrowserClient } from './supabase';
import type { Database } from './supabase';
import { ROAD_TO_CHAMPION, STAR_TWO_TIME_LIMIT } from '../game/constants';

type PlayerProfileRow = Database['public']['Tables']['player_profiles']['Row'];

// ---- Module-level cache ----

let cachedProfile: PlayerProfileRow | null = null;

// ---- Anonymous ID ----

function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('dictator_anonymous_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('dictator_anonymous_id', id);
  }
  return id;
}

// ---- Funny Name Generator ----

const ADJECTIVES = [
  'Iron', 'Steel', 'Golden', 'Mighty', 'Savage',
  'Thunderous', 'Devastating', 'Brutal', 'Ferocious',
  'Unstoppable', 'Relentless', 'Crushing',
];

const NOUNS = [
  'Fist', 'Jaw', 'Knuckles', 'Thunder', 'Crusher',
  'Smasher', 'Brawler', 'Champion', 'Hammer',
  'Fury', 'Storm', 'Titan',
];

export function generateFunnyName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

// ---- Get or Create Profile ----

export async function getOrCreateProfile(): Promise<PlayerProfileRow> {
  if (cachedProfile) return cachedProfile;

  const anonymousId = getAnonymousId();
  if (!anonymousId) throw new Error('Cannot create profile server-side');

  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .single();

  if (!error && data) {
    cachedProfile = data;
    return cachedProfile;
  }

  const displayName = generateFunnyName();

  const { data: newData, error: insertError } = await supabase
    .from('player_profiles')
    .insert({
      anonymous_id: anonymousId,
      display_name: displayName,
    })
    .select()
    .single();

  if (insertError || !newData) {
    throw new Error(`Failed to create profile: ${insertError?.message}`);
  }

  cachedProfile = newData;
  return cachedProfile;
}

// ---- Update After Fight ----

export async function updateAfterFight(
  result: BattleResult,
  archetype: CharacterArchetype,
  difficulty: number
): Promise<CharacterArchetype | null> {
  const profile = await getOrCreateProfile();
  const supabase = createBrowserClient();
  const won = result.winner === 'player';

  // --- Update player_profiles ---
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({
      total_fights: profile.total_fights + 1,
      total_wins: won ? profile.total_wins + 1 : profile.total_wins,
      current_streak: won ? profile.current_streak + 1 : 0,
      last_seen: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

  // Update cache
  cachedProfile = {
    ...profile,
    total_fights: profile.total_fights + 1,
    total_wins: won ? profile.total_wins + 1 : profile.total_wins,
    current_streak: won ? profile.current_streak + 1 : 0,
    last_seen: new Date().toISOString(),
  };

  // --- Calculate stars ---
  let stars = 0;
  if (won) {
    stars = 1;
    if (result.timeSeconds < STAR_TWO_TIME_LIMIT) stars = 2;
    if (result.tookNoDamage) stars = 3;
  }

  // --- Upsert character_progress ---
  const { data: existing } = await supabase
    .from('character_progress')
    .select('*')
    .eq('player_id', profile.id)
    .eq('archetype', archetype)
    .single();

  if (existing) {
    const timeSeconds = Math.round(result.timeSeconds);
    const { error: progressError } = await supabase
      .from('character_progress')
      .update({
        wins: won ? existing.wins + 1 : existing.wins,
        losses: won ? existing.losses : existing.losses + 1,
        best_score: Math.max(existing.best_score, result.scoreBreakdown.totalScore),
        stars: Math.max(existing.stars, stars),
        fastest_ko_seconds:
          won && (existing.fastest_ko_seconds === null || timeSeconds < existing.fastest_ko_seconds)
            ? timeSeconds
            : existing.fastest_ko_seconds,
        total_damage_dealt: existing.total_damage_dealt + result.playerDamageDealt,
        highest_combo: Math.max(existing.highest_combo, result.highestCombo),
      })
      .eq('id', existing.id);

    if (progressError) throw new Error(`Progress update failed: ${progressError.message}`);
  } else {
    const { error: insertError } = await supabase
      .from('character_progress')
      .insert({
        player_id: profile.id,
        archetype,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        best_score: result.scoreBreakdown.totalScore,
        stars,
        is_unlocked: true,
        fastest_ko_seconds: won ? Math.round(result.timeSeconds) : null,
        total_damage_dealt: result.playerDamageDealt,
        highest_combo: result.highestCombo,
      });

    if (insertError) throw new Error(`Progress insert failed: ${insertError.message}`);
  }

  // --- Save score ---
  const { error: scoreError } = await supabase
    .from('scores')
    .insert({
      player_id: profile.id,
      archetype,
      score: result.scoreBreakdown.totalScore,
      time_seconds: Math.round(result.timeSeconds),
      highest_combo: result.highestCombo,
      parts_detached: result.partsDetached,
      difficulty,
    });

  if (scoreError) throw new Error(`Score insert failed: ${scoreError.message}`);

  // --- Check and unlock next archetype ---
  let unlocked: CharacterArchetype | null = null;

  if (won) {
    unlocked = checkAndUnlockNext(archetype);

    if (unlocked) {
      const { data: alreadyExists } = await supabase
        .from('character_progress')
        .select('id')
        .eq('player_id', profile.id)
        .eq('archetype', unlocked)
        .single();

      if (!alreadyExists) {
        await supabase
          .from('character_progress')
          .insert({
            player_id: profile.id,
            archetype: unlocked,
            is_unlocked: true,
          });
      } else {
        await supabase
          .from('character_progress')
          .update({ is_unlocked: true })
          .eq('id', alreadyExists.id);
      }
    }
  }

  return unlocked;
}

// ---- Check and Unlock Next ----

export function checkAndUnlockNext(
  currentArchetype: CharacterArchetype
): CharacterArchetype | null {
  const index = ROAD_TO_CHAMPION.indexOf(currentArchetype);
  if (index === -1 || index >= ROAD_TO_CHAMPION.length - 1) return null;
  return ROAD_TO_CHAMPION[index + 1];
}

// ---- DLC Check ----

export function hasUnlockedDLC(
  profile: PlayerProfileRow,
  productId: string
): boolean {
  return profile.purchased_dlc.includes(productId);
}

// ---- Update Last Seen ----

export async function updateLastSeen(): Promise<void> {
  const profile = await getOrCreateProfile();
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from('player_profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', profile.id);

  if (error) throw new Error(`Last seen update failed: ${error.message}`);

  if (cachedProfile) {
    cachedProfile = { ...cachedProfile, last_seen: new Date().toISOString() };
  }
}
