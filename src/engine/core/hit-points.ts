import type { HitDie } from '../data/types';
import { getAbilityModifier } from './ability-scores';
import { validateLevel } from './progression';
import { rollDice, recordManualRoll } from './dice';
import type { RandomSource } from './random';
export function getLevelHpGain(die: HitDie, constitution: number, method: 'roll'|'average'|'maximum'|'manual', random?: Pick<RandomSource,'nextInt'>, manual?: number) {
  const modifier = getAbilityModifier(constitution);
  if (die.kind !== 'die') throw new Error('Special hit die requires explicit rule resolution');
  const expression = {count:1,sides:die.sides,modifier};
  if (method === 'roll' && !random) throw new Error('Random source required');
  if (!['roll','average','maximum','manual'].includes(method)) throw new Error('Unknown HP growth method');
  const result = method === 'roll' ? rollDice(expression,random!) : recordManualRoll(expression,[method === 'average' ? Math.floor(die.sides/2)+1 : method === 'maximum' ? die.sides : manual!]);
  return Object.freeze({method,die:result.rolls[0],modifier,gain:Math.max(1,result.total)});
}
export function getConstitutionHpAdjustment(level: number, previous: number, next: number): number {
  validateLevel(level); return level * (getAbilityModifier(next)-getAbilityModifier(previous));
}
export function getEvolutionHpBonus(level: number): number { validateLevel(level); return 2*level; }
