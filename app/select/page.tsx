'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CHARACTERS } from '@/data/characters';
import { ROAD_TO_CHAMPION } from '@/game/constants';
import { getOrCreateProfile, updateLastSeen } from '@/lib/playerProfile';
import { createBrowserClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import type { Character } from '@/types/character';
import { CharacterArchetype } from '@/types/character';
import WelcomeBack from '@/components/WelcomeBack';

type ProgressRow = Database['public']['Tables']['character_progress']['Row'];
type ProfileRow = Database['public']['Tables']['player_profiles']['Row'];

const ACCENT_COLORS: Record<string, string> = {
  [CharacterArchetype.DerGroszer]: '#FF4444',
  [CharacterArchetype.TheDon]: '#FF8C00',
  [CharacterArchetype.TheNationalist]: '#00BFFF',
  [CharacterArchetype.TheChairman]: '#FF2222',
  [CharacterArchetype.TheAyatollah]: '#22CC44',
  [CharacterArchetype.TheGeneralissimo]: '#9933FF',
  [CharacterArchetype.TheOligarch]: '#FFD700',
  [CharacterArchetype.TheTechMessiah]: '#00FFCC',
};

const PREV_NAMES: Record<string, string> = {
  [CharacterArchetype.TheNationalist]: 'The Don',
  [CharacterArchetype.TheChairman]: 'The Nationalist',
  [CharacterArchetype.TheAyatollah]: 'The Chairman',
  [CharacterArchetype.TheGeneralissimo]: 'The Ayatollah',
};

export default function SelectPage(): React.JSX.Element {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showStartHere, setShowStartHere] = useState(false);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        const p = await getOrCreateProfile();
        setProfile(p);

        const supabase = createBrowserClient();
        const { data } = await supabase
          .from('character_progress')
          .select('*')
          .eq('player_id', p.id);

        if (data) setProgress(data);

        await updateLastSeen();

        // Welcome back check (>23 hours)
        const lastSeen = new Date(p.last_seen).getTime();
        const hoursSince = (Date.now() - lastSeen) / (1000 * 60 * 60);
        if (hoursSince > 23) setShowWelcome(true);

        // Start here arrow
        if (!localStorage.getItem('dictator_seen_start_here')) {
          setShowStartHere(true);
        }

        // Restore difficulty
        const saved = sessionStorage.getItem('dictator_difficulty');
        if (saved === '2' || saved === '3') setDifficulty(Number(saved) as 1 | 2 | 3);
      } catch {
        // Profile creation may fail without Supabase — continue with defaults
      }
      setLoading(false);
    };
    init();
  }, []);

  const getProgress = useCallback(
    (archetype: CharacterArchetype): ProgressRow | undefined =>
      progress.find((p) => p.archetype === archetype),
    [progress]
  );

  const isUnlocked = useCallback(
    (char: Character): boolean => {
      if (char.isPaidDLC) {
        return profile?.purchased_dlc.includes(char.dlcProductId ?? '') ?? false;
      }
      if (char.unlocked) return true;
      const prog = getProgress(char.archetype);
      return prog?.is_unlocked ?? false;
    },
    [profile, getProgress]
  );

  const defeatedCount = ROAD_TO_CHAMPION.filter((a) => {
    const p = getProgress(a);
    return p && p.wins > 0;
  }).length;

  const handleSelect = (char: Character): void => {
    if (char.isPaidDLC && !isUnlocked(char)) {
      router.push('/shop');
      return;
    }
    if (!isUnlocked(char)) return;

    if (showStartHere) {
      localStorage.setItem('dictator_seen_start_here', 'true');
      setShowStartHere(false);
    }

    sessionStorage.setItem('dictator_selected_archetype', char.archetype);
    sessionStorage.setItem('dictator_difficulty', String(difficulty));
    router.push('/battle');
  };

  const handleDifficulty = (d: 1 | 2 | 3): void => {
    setDifficulty(d);
    sessionStorage.setItem('dictator_difficulty', String(d));
  };

  if (loading) {
    return (
      <main style={{ backgroundColor: 'black', minHeight: '100vh' }} />
    );
  }

  const baseChars = CHARACTERS.filter((c) =>
    ROAD_TO_CHAMPION.includes(c.archetype)
  );
  const dlcChars = CHARACTERS.filter((c) => c.isPaidDLC);

  return (
    <main
      style={{
        backgroundColor: 'black',
        minHeight: '100vh',
        maxWidth: '390px',
        margin: '0 auto',
        padding: '16px 12px',
        position: 'relative',
      }}
    >
      {/* Welcome Back Banner */}
      {showWelcome && profile && (
        <div style={{ marginBottom: '12px' }}>
          <WelcomeBack
            displayName={profile.display_name}
            currentStreak={profile.current_streak}
            onDismiss={() => setShowWelcome(false)}
          />
        </div>
      )}

      {/* Title */}
      <h1
        className="font-(family-name:--font-bebas-neue)"
        style={{
          fontSize: '36px',
          color: '#FFD700',
          textAlign: 'center',
          margin: '0 0 8px',
        }}
      >
        CHOOSE YOUR OPPONENT
      </h1>

      {/* Difficulty Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {([1, 2, 3] as const).map((d) => {
          const labels = ['EASY', 'MEDIUM', 'HARD'];
          const active = difficulty === d;
          return (
            <button
              key={d}
              onClick={() => handleDifficulty(d)}
              style={{
                flex: 1,
                padding: '8px',
                border: active ? '2px solid #FFD700' : '1px solid #444',
                borderRadius: '8px',
                backgroundColor: active ? '#FFD700' : '#1a1a1a',
                color: active ? '#000' : '#888',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {labels[d - 1]}
            </button>
          );
        })}
      </div>

      {/* Road to Champion Progress */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
          ROAD TO CHAMPION — {defeatedCount}/6
        </p>
        <div style={{ display: 'flex', gap: '3px', height: '6px' }}>
          {ROAD_TO_CHAMPION.map((a, i) => (
            <div
              key={a}
              style={{
                flex: 1,
                borderRadius: '3px',
                backgroundColor:
                  i < defeatedCount ? ACCENT_COLORS[a] : '#333',
              }}
            />
          ))}
        </div>
      </div>

      {/* Character Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {baseChars.map((char) => {
          const unlocked = isUnlocked(char);
          const prog = getProgress(char.archetype);
          const accent = ACCENT_COLORS[char.archetype] ?? '#FFD700';
          const isFirst = char.archetype === CharacterArchetype.DerGroszer;

          return (
            <div key={char.id} style={{ position: 'relative' }}>
              {/* START HERE overlay */}
              {showStartHere && isFirst && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    textAlign: 'center',
                    animation: 'pulse 1s ease-in-out infinite',
                  }}
                >
                  <div style={{ fontSize: '28px', color: '#FFD700' }}>
                    ▼
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#FFD700',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    START HERE
                  </div>
                </div>
              )}

              <button
                onClick={() => handleSelect(char)}
                disabled={!unlocked}
                style={{
                  width: '100%',
                  padding: '12px 10px',
                  border: `2px solid ${unlocked ? accent : '#333'}`,
                  borderRadius: '12px',
                  backgroundColor: unlocked ? '#111' : '#0a0a0a',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  opacity: unlocked ? 1 : 0.6,
                  transition: 'transform 100ms',
                }}
                className={unlocked ? 'active:scale-95' : ''}
              >
                {unlocked ? (
                  <>
                    <p
                      className="font-(family-name:--font-bebas-neue)"
                      style={{
                        fontSize: '22px',
                        color: accent,
                        margin: 0,
                        lineHeight: 1.1,
                      }}
                    >
                      {char.name}
                    </p>
                    <p style={{ fontSize: '10px', color: '#888', margin: '2px 0 6px' }}>
                      {char.nickname}
                    </p>
                    <p style={{ fontSize: '10px', color: '#aaa', margin: '0 0 8px', lineHeight: 1.3 }}>
                      {char.description.length > 60
                        ? char.description.substring(0, 60) + '...'
                        : char.description}
                    </p>

                    {/* Stat bars */}
                    <StatBar label="STR" value={char.stats.strength} color={accent} />
                    <StatBar label="SPD" value={char.stats.speed} color={accent} />
                    <StatBar label="DEF" value={char.stats.defense} color={accent} />

                    {/* Stars */}
                    <div style={{ marginTop: '6px', fontSize: '14px' }}>
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          style={{
                            color: s <= (prog?.stars ?? 0) ? '#FFD700' : '#333',
                          }}
                        >
                          ★
                        </span>
                      ))}
                      {(prog?.best_score ?? 0) > 0 && (
                        <span style={{ fontSize: '10px', color: '#888', marginLeft: '6px' }}>
                          {prog?.best_score}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: '28px', color: '#444', marginBottom: '4px' }}>
                      🔒
                    </div>
                    <p
                      className="font-(family-name:--font-bebas-neue)"
                      style={{ fontSize: '20px', color: '#555', margin: '0 0 4px' }}
                    >
                      ???
                    </p>
                    <p style={{ fontSize: '10px', color: '#555' }}>
                      Defeat {PREV_NAMES[char.archetype] ?? '???'} to unlock
                    </p>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* DLC Section */}
      {dlcChars.length > 0 && (
        <>
          <h2
            className="font-(family-name:--font-bebas-neue)"
            style={{ fontSize: '24px', color: '#FFD700', margin: '0 0 8px' }}
          >
            DLC FIGHTERS
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            {dlcChars.map((char) => {
              const owned = isUnlocked(char);
              const accent = ACCENT_COLORS[char.archetype] ?? '#FFD700';

              return (
                <button
                  key={char.id}
                  onClick={() => handleSelect(char)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    border: `2px solid ${accent}`,
                    borderRadius: '12px',
                    backgroundColor: '#111',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'transform 100ms',
                  }}
                  className="active:scale-95"
                >
                  {!owned && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: '#FF4444',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      DLC
                    </span>
                  )}
                  <p
                    className="font-(family-name:--font-bebas-neue)"
                    style={{
                      fontSize: '20px',
                      color: accent,
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {char.name}
                  </p>
                  <p style={{ fontSize: '10px', color: '#888', margin: '2px 0' }}>
                    {char.description}
                  </p>
                  {!owned && (
                    <p style={{ fontSize: '12px', color: '#FFD700', margin: '4px 0 0', fontWeight: 700 }}>
                      €1.99
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Pulse animation for START HERE */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) translateY(0); }
          50% { opacity: 0.6; transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </main>
  );
}

// ---- Stat Bar Component ----

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
      <span style={{ fontSize: '8px', color: '#666', width: '22px' }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: '4px',
          backgroundColor: '#333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  );
}
