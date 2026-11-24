import type { DiceExpression } from '../data/types';
import type { DiceResult } from './types';
import type { RandomSource } from './random';

/** Resource limits for a single expression, not Pokémon 5e rules. */
export function validateDiceExpression(expression: DiceExpression): void {
  const { count, sides, modifier } = expression;
  if (!Number.isInteger(count) || count < 1 || count > 1000 ||
      !Number.isInteger(sides) || sides < 2 || sides > 1000000 ||
      !Number.isSafeInteger(modifier) || !Number.isSafeInteger(count + modifier) ||
      !Number.isSafeInteger(count * sides + modifier)) throw new RangeError('Invalid dice expression');
}
export function parseDiceExpression(input: string): DiceExpression {
  const match = /^([0-9]*)d([0-9]+)(?:\s*([+-])\s*([0-9]+))?$/i.exec(input.trim());
  if (!match) throw new Error('Expected dice notation such as 2d6+3');
  const expression = { count: Number(match[1] || 1), sides: Number(match[2]), modifier: match[3] ? Number(match[4]) * (match[3] === '-' ? -1 : 1) : 0 };
  validateDiceExpression(expression);
  return Object.freeze(expression);
}
export function formatDiceExpression(expression: DiceExpression): string {
  validateDiceExpression(expression);
  return `${expression.count}d${expression.sides}${expression.modifier > 0 ? '+' + expression.modifier : expression.modifier < 0 ? expression.modifier : ''}`;
}
function result(expression: DiceExpression, rolls: readonly number[], mode: DiceResult['mode']): DiceResult {
  if (rolls.length !== expression.count || Array.from(rolls).some(n => !Number.isInteger(n) || n < 1 || n > expression.sides)) throw new RangeError('Invalid dice values');
  return Object.freeze({ expression: Object.freeze({...expression}), rolls: Object.freeze([...rolls]), total: rolls.reduce((sum, n) => sum + n, 0) + expression.modifier, mode });
}
export function rollDice(expression: DiceExpression, random: Pick<RandomSource, 'nextInt'>, mode: 'automatic' | 'digital' = 'automatic'): DiceResult {
  validateDiceExpression(expression);
  if (mode !== 'automatic' && mode !== 'digital') throw new Error('Invalid generated roll mode');
  return result(expression, Array.from({length: expression.count}, () => random.nextInt(1, expression.sides)), mode);
}
export function recordManualRoll(expression: DiceExpression, rolls: readonly number[]): DiceResult {
  validateDiceExpression(expression);
  return result(expression, rolls, 'manual');
}
