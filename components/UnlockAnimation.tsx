'use client';

import type { CharacterArchetype } from '@/types/character';

interface UnlockAnimationProps {
  archetype: CharacterArchetype;
  onComplete: () => void;
}

export default function UnlockAnimation({
  archetype,
  onComplete,
}: UnlockAnimationProps): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
      onClick={onComplete}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onComplete()}
    >
      <h2 className="font-[family-name:var(--font-bebas-neue)] text-4xl text-yellow-400">
        New Challenger Unlocked!
      </h2>
      <p className="mt-4 text-2xl text-white">{archetype}</p>
      <p className="mt-8 text-sm text-gray-400">Tap to continue</p>
    </div>
  );
}
