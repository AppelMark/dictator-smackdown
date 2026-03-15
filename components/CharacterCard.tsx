'use client';

import type { Character } from '@/types/character';

interface CharacterCardProps {
  character: Character;
  unlocked: boolean;
  onSelect: (character: Character) => void;
}

export default function CharacterCard({
  character,
  unlocked,
  onSelect,
}: CharacterCardProps): React.JSX.Element {
  return (
    <button
      onClick={() => unlocked && onSelect(character)}
      disabled={!unlocked}
      className={`rounded-xl border-2 p-4 transition-transform ${
        unlocked
          ? 'border-yellow-400 hover:scale-105'
          : 'cursor-not-allowed border-gray-600 opacity-50'
      }`}
    >
      <h3 className="font-[family-name:var(--font-bebas-neue)] text-xl">
        {character.name}
      </h3>
      <p className="text-sm text-gray-400">{character.title}</p>
      <p className="mt-1 text-xs">Difficulty: {character.difficulty}/6</p>
    </button>
  );
}
