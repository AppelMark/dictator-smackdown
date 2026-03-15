'use client';

import type { CharacterArchetype } from '@/types/character';

interface TrophyCardProps {
  archetype: CharacterArchetype;
  stars: number;
  bestScore: number;
  bestTime: number;
}

export default function TrophyCard({
  archetype,
  stars,
  bestScore,
  bestTime,
}: TrophyCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-gray-700 p-4">
      <h3 className="font-[family-name:var(--font-bebas-neue)] text-xl">
        {archetype}
      </h3>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3].map((star) => (
          <span key={star} className={star <= stars ? 'text-yellow-400' : 'text-gray-600'}>
            ★
          </span>
        ))}
      </div>
      <p className="mt-1 text-sm">Best: {bestScore} pts</p>
      <p className="text-xs text-gray-400">{bestTime}s</p>
    </div>
  );
}
