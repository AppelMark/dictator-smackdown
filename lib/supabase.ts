import { createBrowserClient as createBrowser } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---- Database Types (gebaseerd op supabase/schema.sql) ----

export interface Database {
  public: {
    Tables: {
      player_profiles: {
        Row: {
          id: string;
          anonymous_id: string;
          email: string | null;
          display_name: string;
          auth_provider: string | null;
          total_fights: number;
          total_wins: number;
          current_streak: number;
          purchased_dlc: string[];
          active_season_pass: boolean;
          season_pass_expiry: string | null;
          created_at: string;
          last_seen: string;
        };
        Insert: {
          id?: string;
          anonymous_id: string;
          email?: string | null;
          display_name: string;
          auth_provider?: string | null;
          total_fights?: number;
          total_wins?: number;
          current_streak?: number;
          purchased_dlc?: string[];
          active_season_pass?: boolean;
          season_pass_expiry?: string | null;
          created_at?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          anonymous_id?: string;
          email?: string | null;
          display_name?: string;
          auth_provider?: string | null;
          total_fights?: number;
          total_wins?: number;
          current_streak?: number;
          purchased_dlc?: string[];
          active_season_pass?: boolean;
          season_pass_expiry?: string | null;
          created_at?: string;
          last_seen?: string;
        };
      };
      character_progress: {
        Row: {
          id: string;
          player_id: string;
          archetype: string;
          wins: number;
          losses: number;
          best_score: number;
          stars: number;
          is_unlocked: boolean;
          trophy_earned: boolean;
          fastest_ko_seconds: number | null;
          total_damage_dealt: number;
          highest_combo: number;
        };
        Insert: {
          id?: string;
          player_id: string;
          archetype: string;
          wins?: number;
          losses?: number;
          best_score?: number;
          stars?: number;
          is_unlocked?: boolean;
          trophy_earned?: boolean;
          fastest_ko_seconds?: number | null;
          total_damage_dealt?: number;
          highest_combo?: number;
        };
        Update: {
          id?: string;
          player_id?: string;
          archetype?: string;
          wins?: number;
          losses?: number;
          best_score?: number;
          stars?: number;
          is_unlocked?: boolean;
          trophy_earned?: boolean;
          fastest_ko_seconds?: number | null;
          total_damage_dealt?: number;
          highest_combo?: number;
        };
      };
      scores: {
        Row: {
          id: string;
          player_id: string;
          archetype: string;
          score: number;
          time_seconds: number | null;
          highest_combo: number | null;
          parts_detached: number | null;
          difficulty: number | null;
          is_daily_challenge: boolean;
          challenge_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          archetype: string;
          score: number;
          time_seconds?: number | null;
          highest_combo?: number | null;
          parts_detached?: number | null;
          difficulty?: number | null;
          is_daily_challenge?: boolean;
          challenge_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          archetype?: string;
          score?: number;
          time_seconds?: number | null;
          highest_combo?: number | null;
          parts_detached?: number | null;
          difficulty?: number | null;
          is_daily_challenge?: boolean;
          challenge_date?: string | null;
          created_at?: string;
        };
      };
      daily_challenges: {
        Row: {
          challenge_date: string;
          archetype: string;
          par_score: number;
          created_at: string;
        };
        Insert: {
          challenge_date: string;
          archetype: string;
          par_score: number;
          created_at?: string;
        };
        Update: {
          challenge_date?: string;
          archetype?: string;
          par_score?: number;
          created_at?: string;
        };
      };
      challenge_links: {
        Row: {
          id: string;
          challenger_id: string | null;
          challenger_name: string;
          archetype: string;
          score: number;
          created_at: string;
          completions: number;
          expires_at: string;
        };
        Insert: {
          id?: string;
          challenger_id?: string | null;
          challenger_name: string;
          archetype: string;
          score: number;
          created_at?: string;
          completions?: number;
          expires_at?: string;
        };
        Update: {
          id?: string;
          challenger_id?: string | null;
          challenger_name?: string;
          archetype?: string;
          score?: number;
          created_at?: string;
          completions?: number;
          expires_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          player_id: string | null;
          product_id: string;
          platform: 'ios' | 'android' | 'web';
          amount_cents: number | null;
          currency: string;
          purchased_at: string;
          stripe_payment_intent: string | null;
        };
        Insert: {
          id?: string;
          player_id?: string | null;
          product_id: string;
          platform: 'ios' | 'android' | 'web';
          amount_cents?: number | null;
          currency?: string;
          purchased_at?: string;
          stripe_payment_intent?: string | null;
        };
        Update: {
          id?: string;
          player_id?: string | null;
          product_id?: string;
          platform?: 'ios' | 'android' | 'web';
          amount_cents?: number | null;
          currency?: string;
          purchased_at?: string;
          stripe_payment_intent?: string | null;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          player_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          token: string;
          platform: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
        };
      };
    };
  };
}

// ---- Browser Client (singleton, anon key) ----

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  browserClient = createBrowser<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}

// ---- Server Client (service role key, nieuwe instantie per aanroep) ----

export function createServerClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
