-- ============================================================
-- Dictator Smackdown — Volledig Supabase Schema
-- Kopieer en plak dit volledig in de Supabase SQL Editor
-- Veilig om meerdere keren uit te voeren (IF NOT EXISTS)
-- ============================================================


-- ============================================================
-- 1. Helper functie
-- ============================================================

create or replace function get_anonymous_id()
returns text
language sql
stable
as $$
  select coalesce(
    current_setting('request.headers', true)::json->>'x-anonymous-id',
    ''
  )
$$;


-- ============================================================
-- 2. Tabellen
-- ============================================================

create table if not exists player_profiles (
  id                 uuid primary key default gen_random_uuid(),
  anonymous_id       text unique not null,
  email              text,
  display_name       text not null,
  auth_provider      text,
  total_fights       integer not null default 0,
  total_wins         integer not null default 0,
  current_streak     integer not null default 0,
  purchased_dlc      text[] not null default '{}',
  active_season_pass boolean not null default false,
  season_pass_expiry timestamptz,
  created_at         timestamptz not null default now(),
  last_seen          timestamptz not null default now()
);

create table if not exists character_progress (
  id                 uuid primary key default gen_random_uuid(),
  player_id          uuid not null references player_profiles(id) on delete cascade,
  archetype          text not null,
  wins               integer not null default 0,
  losses             integer not null default 0,
  best_score         integer not null default 0,
  stars              integer not null default 0 check (stars between 0 and 3),
  is_unlocked        boolean not null default false,
  trophy_earned      boolean not null default false,
  fastest_ko_seconds integer,
  total_damage_dealt integer not null default 0,
  highest_combo      integer not null default 0,
  unique (player_id, archetype)
);

create table if not exists scores (
  id                 uuid primary key default gen_random_uuid(),
  player_id          uuid not null references player_profiles(id) on delete cascade,
  archetype          text not null,
  score              integer not null,
  time_seconds       integer,
  highest_combo      integer,
  parts_detached     integer,
  difficulty         integer,
  is_daily_challenge boolean not null default false,
  challenge_date     date,
  created_at         timestamptz not null default now()
);

create table if not exists daily_challenges (
  challenge_date date primary key,
  archetype      text not null,
  par_score      integer not null,
  created_at     timestamptz not null default now()
);

create table if not exists challenge_links (
  id              uuid primary key default gen_random_uuid(),
  challenger_id   uuid references player_profiles(id),
  challenger_name text not null,
  archetype       text not null,
  score           integer not null,
  created_at      timestamptz not null default now(),
  completions     integer not null default 0,
  expires_at      timestamptz not null default (now() + interval '7 days')
);

create table if not exists purchases (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid references player_profiles(id),
  product_id            text not null,
  platform              text not null check (platform in ('ios', 'android', 'web')),
  amount_cents          integer,
  currency              text not null default 'EUR',
  purchased_at          timestamptz not null default now(),
  stripe_payment_intent text
);

create table if not exists push_tokens (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references player_profiles(id) on delete cascade,
  token      text not null,
  platform   text not null,
  created_at timestamptz not null default now(),
  unique (player_id, platform)
);


-- ============================================================
-- 3. Indexen
-- ============================================================

create index if not exists idx_scores_leaderboard
  on scores(archetype, score desc, created_at);

create index if not exists idx_scores_player_id
  on scores(player_id);

create index if not exists idx_character_progress_player_id
  on character_progress(player_id);

create index if not exists idx_challenge_links_expires_at
  on challenge_links(expires_at);


-- ============================================================
-- 4. Row Level Security inschakelen
-- ============================================================

alter table player_profiles enable row level security;
alter table character_progress enable row level security;
alter table scores enable row level security;
alter table daily_challenges enable row level security;
alter table challenge_links enable row level security;
alter table purchases enable row level security;
alter table push_tokens enable row level security;


-- ============================================================
-- 5. RLS Policies
-- ============================================================

-- ---- Player Profiles ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'player_profiles_select_own') then
    create policy "player_profiles_select_own"
      on player_profiles for select
      using (anonymous_id = get_anonymous_id());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'player_profiles_insert_own') then
    create policy "player_profiles_insert_own"
      on player_profiles for insert
      with check (anonymous_id = get_anonymous_id());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'player_profiles_update_own') then
    create policy "player_profiles_update_own"
      on player_profiles for update
      using (anonymous_id = get_anonymous_id());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'player_profiles_service_role') then
    create policy "player_profiles_service_role"
      on player_profiles for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;


-- ---- Character Progress ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'character_progress_select_own') then
    create policy "character_progress_select_own"
      on character_progress for select
      using (player_id in (
        select id from player_profiles where anonymous_id = get_anonymous_id()
      ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'character_progress_insert_own') then
    create policy "character_progress_insert_own"
      on character_progress for insert
      with check (player_id in (
        select id from player_profiles where anonymous_id = get_anonymous_id()
      ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'character_progress_update_own') then
    create policy "character_progress_update_own"
      on character_progress for update
      using (player_id in (
        select id from player_profiles where anonymous_id = get_anonymous_id()
      ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'character_progress_service_role') then
    create policy "character_progress_service_role"
      on character_progress for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;


-- ---- Scores ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'scores_select_public') then
    create policy "scores_select_public"
      on scores for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'scores_insert_free') then
    create policy "scores_insert_free"
      on scores for insert
      with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'scores_service_role') then
    create policy "scores_service_role"
      on scores for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;


-- ---- Daily Challenges ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'daily_challenges_select_public') then
    create policy "daily_challenges_select_public"
      on daily_challenges for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'daily_challenges_service_role') then
    create policy "daily_challenges_service_role"
      on daily_challenges for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;


-- ---- Challenge Links ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'challenge_links_select_public') then
    create policy "challenge_links_select_public"
      on challenge_links for select
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'challenge_links_insert_own') then
    create policy "challenge_links_insert_own"
      on challenge_links for insert
      with check (challenger_id in (
        select id from player_profiles where anonymous_id = get_anonymous_id()
      ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'challenge_links_service_role') then
    create policy "challenge_links_service_role"
      on challenge_links for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;


-- ---- Purchases ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'purchases_service_role') then
    create policy "purchases_service_role"
      on purchases for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;


-- ---- Push Tokens ----

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'push_tokens_select_own') then
    create policy "push_tokens_select_own"
      on push_tokens for select
      using (player_id in (
        select id from player_profiles where anonymous_id = get_anonymous_id()
      ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'push_tokens_insert_own') then
    create policy "push_tokens_insert_own"
      on push_tokens for insert
      with check (player_id in (
        select id from player_profiles where anonymous_id = get_anonymous_id()
      ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'push_tokens_service_role') then
    create policy "push_tokens_service_role"
      on push_tokens for all
      using (current_setting('role') = 'service_role');
  end if;
end $$;
