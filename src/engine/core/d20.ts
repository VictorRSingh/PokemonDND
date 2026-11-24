import { rollDice, recordManualRoll, validateDiceExpression } from './dice';
import type { RandomSource } from './random';
import type { RollCondition } from './types';
export interface RollSources { readonly advantage?: readonly string[]; readonly disadvantage?: readonly string[] }
export function resolveRollCondition(sources: RollSources = {}): RollCondition {
  const a = !!sources.advantage?.length, d = !!sources.disadvantage?.length;
  return a === d ? 'normal' : a ? 'advantage' : 'disadvantage';
}
function prepare(modifier: number, sources: RollSources) {
  const condition = resolveRollCondition(sources);
  validateDiceExpression({count:1,sides:20,modifier});
  return {condition, expression:{count:condition === 'normal' ? 1 : 2,sides:20,modifier:0}, sources:Object.freeze({advantage:Object.freeze([...(sources.advantage ?? [])]),disadvantage:Object.freeze([...(sources.disadvantage ?? [])])})};
}
function finish(p: ReturnType<typeof prepare>, modifier: number, dice: ReturnType<typeof rollDice>) {
  const natural = p.condition === 'advantage' ? Math.max(...dice.rolls) : Math.min(...dice.rolls);
  return Object.freeze({condition:p.condition,sources:p.sources,rolls:dice.rolls,selectedIndex:dice.rolls.indexOf(natural),natural,modifier,total:natural+modifier,mode:dice.mode});
}
export type D20Result = ReturnType<typeof finish>;
export function rollD20(modifier: number, random: Pick<RandomSource,'nextInt'>, sources: RollSources = {}, mode: 'automatic' | 'digital' = 'automatic'): D20Result {
  const p = prepare(modifier,sources);
  return finish(p,modifier,rollDice(p.expression,random,mode));
}
export function recordManualD20(modifier: number, rolls: readonly number[], sources: RollSources = {}): D20Result {
  const p = prepare(modifier,sources);
  return finish(p,modifier,recordManualRoll(p.expression,rolls));
}
