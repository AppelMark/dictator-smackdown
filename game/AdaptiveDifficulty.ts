import { CharacterArchetype } from '../types/character';
import { createBrowserClient } from '../lib/supabase';

export class AdaptiveDifficulty {
  async getModifier(
    anonymousId: string,
    archetype: CharacterArchetype
  ): Promise<number> {
    const supabase = createBrowserClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('player_profiles') as any)
      .select('id')
      .eq('anonymous_id', anonymousId)
      .single();

    if (!profile) return 1.0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: progress } = await (supabase.from('character_progress') as any)
      .select('wins, losses')
      .eq('player_id', profile.id)
      .eq('archetype', archetype)
      .single();

    if (!progress) return 1.0;

    const totalFights = progress.wins + progress.losses;
    if (totalFights < 3) return 1.0;

    const winRate = progress.wins / totalFights;

    if (winRate > 0.75) return 1.2;
    if (winRate > 0.60) return 1.1;
    if (winRate < 0.35) return 0.8;
    if (winRate < 0.50) return 0.9;

    return 1.0;
  }
}
