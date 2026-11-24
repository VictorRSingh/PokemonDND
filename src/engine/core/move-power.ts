import { ABILITY_KEYS, ELEMENTAL_TYPES, type AbilityKey, type AbilityScores, type DamageType, type ElementalType } from '../data/types';
import { getAbilityModifiers } from './ability-scores';
import { getProficiencyBonus, getStabBonus } from './progression';
export function resolveMovePower(scores: AbilityScores, allowed: readonly AbilityKey[], selected?: AbilityKey) {
  const modifiers = getAbilityModifiers(scores);
  if (!allowed.length || allowed.some(k => !ABILITY_KEYS.includes(k))) throw new RangeError('Move Power requires resolved ability options');
  const recommended = allowed.reduce((best, k) => modifiers[k] > modifiers[best] ? k : best);
  const ability = selected ?? recommended;
  if (!allowed.includes(ability)) throw new RangeError('Invalid Move Power selection');
  return Object.freeze({ ability, modifier: modifiers[ability], recommended });
}
export function getApplicableStab(level: number, types: readonly ElementalType[], moveType: DamageType): number {
  const bonus = getStabBonus(level);
  if (!types.length || types.some(t => !ELEMENTAL_TYPES.includes(t)) || (moveType !== 'typeless' && !ELEMENTAL_TYPES.includes(moveType))) throw new RangeError('Invalid typing');
  return moveType !== 'typeless' && types.includes(moveType) ? bonus : 0;
}
export function getMoveStats(level: number, scores: AbilityScores, allowed: readonly AbilityKey[], types: readonly ElementalType[], moveType: DamageType, selected?: AbilityKey) {
  const power = resolveMovePower(scores, allowed, selected);
  const proficiency = getProficiencyBonus(level), stab = getApplicableStab(level, types, moveType);
  return Object.freeze({ ...power, proficiency, stab, attackBonus: power.modifier + proficiency, damageBonus: power.modifier + stab, saveDC: 8 + proficiency + power.modifier });
}
