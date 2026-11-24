import { ABILITY_KEYS, type AbilityScores, type NatureDefinition } from '../data/types';
import { validateAbilityScores } from './ability-scores';
import { validateLevel } from './progression';
export function applyNature(scores: AbilityScores, armorClass: number, nature?: NatureDefinition) {
  validateAbilityScores(scores);
  const adjusted = {...scores};
  for (const key of ABILITY_KEYS) adjusted[key] += nature?.abilityScoreModifiers[key] ?? 0;
  validateAbilityScores(adjusted);
  const ac = armorClass + (nature?.armorClassModifier ?? 0);
  if (!Number.isSafeInteger(armorClass) || armorClass < 1 || !Number.isSafeInteger(ac) || ac < 1) throw new RangeError('Invalid AC');
  return Object.freeze({abilityScores:Object.freeze(adjusted),armorClass:ac});
}
export function getLoyaltyModifiers(level: number, loyalty: number, enabled = true) {
  validateLevel(level);
  if (!Number.isInteger(loyalty) || loyalty < -3 || loyalty > 3) throw new RangeError('Loyalty must be -3 to 3');
  const value = enabled ? loyalty : 0;
  return Object.freeze({savingThrowBonus:Math.sign(value),maximumHpBonus:value===3?level:value===2?Math.ceil(level/2):0,extraSkillProficiencies:value===3?2:value===2?1:0,obedienceMinimumRoll:value===-3?16:value===-2?11:null});
}
