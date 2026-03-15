import { CharacterArchetype, PunchType } from '../types/character';

export const HIT_COMMENTARY: Record<PunchType, string[]> = {
  [PunchType.Jab]: ['Nice jab!', 'Quick hands!', 'Snap!'],
  [PunchType.Cross]: ['Solid cross!', 'Right through the guard!', 'Textbook cross!'],
  [PunchType.Hook]: ['What a hook!', 'Devastating!', 'That one rattled teeth!'],
  [PunchType.Uppercut]: ['UPPERCUT!', 'Lifting off!', 'Jaw-breaker!'],
  [PunchType.Special]: ['SPECIAL MOVE!', 'INCREDIBLE!', 'UNBELIEVABLE POWER!'],
};

export const COMBO_COMMENTARY: Record<number, string[]> = {
  3: ['Combo!', 'Three in a row!'],
  5: ['COMBO MASTER!', 'Unstoppable!'],
  8: ['LEGENDARY COMBO!', 'Is this even legal?!'],
};

export const DEFEAT_TAUNT: Record<CharacterArchetype, string[]> = {
  [CharacterArchetype.DerGroszer]: ['You call that fighting?', 'Too weak!'],
  [CharacterArchetype.TheDon]: ['Nobody beats The Don!', 'Pathetic!'],
  [CharacterArchetype.TheNationalist]: ['Too slow!', 'Can\'t keep up!'],
  [CharacterArchetype.TheChairman]: ['Impenetrable!', 'Your punches are nothing!'],
  [CharacterArchetype.TheAyatollah]: ['So predictable!', 'Learn to vary your attacks!'],
  [CharacterArchetype.TheGeneralissimo]: ['I am invincible!', 'Kneel before me!'],
  [CharacterArchetype.TheOligarch]: ['Money talks!', 'You can\'t afford to beat me!'],
  [CharacterArchetype.TheTechMessiah]: ['I computed your defeat!', 'Algorithm wins!'],
};

export const ARCHETYPE_CATCHPHRASES: Record<CharacterArchetype, string[]> = {
  [CharacterArchetype.DerGroszer]: ['SMASH!', 'I CRUSH YOU!'],
  [CharacterArchetype.TheDon]: ['Surprise!', 'You never know what\'s next!'],
  [CharacterArchetype.TheNationalist]: ['Speed kills!', 'Too fast for you!'],
  [CharacterArchetype.TheChairman]: ['Try again!', 'Your efforts are futile!'],
  [CharacterArchetype.TheAyatollah]: ['Predictable!', 'I see your pattern!'],
  [CharacterArchetype.TheGeneralissimo]: ['BOW DOWN!', 'I am the supreme leader!'],
  [CharacterArchetype.TheOligarch]: ['Everything has a price!', 'I always win!'],
  [CharacterArchetype.TheTechMessiah]: ['Disrupted!', 'Innovation beats tradition!'],
};
