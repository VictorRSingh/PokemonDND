import { ABILITY_KEYS, type AbilityKey, type AbilityScores } from '../data/types';

export type AbilityModifiers = Readonly<Record<AbilityKey, number>>;

/** Validate a score without imposing a character creation or progression cap. */
export function validateAbilityScore(score: unknown): asserts score is number {
  if (typeof score !== 'number' || !Number.isSafeInteger(score) || score < 1) {
    throw new RangeError('Ability score must be a positive safe integer');
  }
}

export function getAbilityModifier(score: number): number {
  validateAbilityScore(score);
  return Math.floor((score - 10) / 2);
}

export function validateAbilityScores(scores: unknown): asserts scores is AbilityScores {
  if (!scores || typeof scores !== 'object' || Array.isArray(scores)) throw new TypeError('Expected six ability scores');
  const keys = Object.keys(scores);
  if (keys.length !== ABILITY_KEYS.length || ABILITY_KEYS.some(key => !Object.prototype.hasOwnProperty.call(scores, key))) throw new TypeError('Expected exactly six ability scores');
  for (const key of ABILITY_KEYS) validateAbilityScore((scores as Record<string, unknown>)[key]);
}

export function getAbilityModifiers(scores: AbilityScores): AbilityModifiers {
  validateAbilityScores(scores);
  return Object.freeze(Object.fromEntries(ABILITY_KEYS.map(key => [key, getAbilityModifier(scores[key])])) as Record<AbilityKey, number>);
}
