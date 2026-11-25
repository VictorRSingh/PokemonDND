import type { DamageType, PokemonSpeciesDefinition, DiceExpression } from '../data/types';
import type { D20Result } from './d20';
import { rollDice, recordManualRoll } from './dice';
import { diceLabel } from './random';
import type { RandomSource } from './random';
export function resolveAttack(roll:D20Result, ac:number, criticalThreshold=20) {
 if(!Number.isSafeInteger(ac)||ac<1||!Number.isInteger(criticalThreshold)||criticalThreshold<2||criticalThreshold>20) throw new Error('Invalid attack parameters');
 const hit=roll.natural!==1&&(roll.natural===20||roll.total>=ac); return Object.freeze({hit,critical:hit&&roll.natural>=criticalThreshold,roll,ac});
}
export function resolveSave(roll:D20Result,dc:number){if(!Number.isSafeInteger(dc))throw new Error('Invalid DC');return Object.freeze({success:roll.total>=dc,roll,dc});}
export function typeMultiplier(type:DamageType,species:Pick<PokemonSpeciesDefinition,'immunities'|'resistances'|'vulnerabilities'>):number {
 if(type==='typeless')return 1; if(species.immunities.includes(type))return 0; return (species.resistances.includes(type)?0.5:1)*(species.vulnerabilities.includes(type)?2:1);
}
export function resolveDamage(expression:DiceExpression, bonus:number, multiplier:number, critical:boolean, random:Pick<RandomSource,'nextInt'>, options:{burned?:boolean;half?:boolean;manual?:readonly (readonly number[])[];digital?:boolean}={}) {
 if(!Number.isSafeInteger(bonus)||![0,0.5,1,2].includes(multiplier))throw new Error('Invalid damage parameters');
 const expr={...expression,count:expression.count*(critical?2:1),modifier:expression.modifier+bonus};
 const count=options.burned?2:1;if(options.manual&&options.manual.length!==count)throw new Error('Incorrect manual damage rolls');
 const rolls=Array.from({length:count},(_,i)=>options.manual?recordManualRoll(expr,options.manual[i]):diceLabel(`Damage ${expr.count}d${expr.sides} (${expr.modifier>=0?'+':''}${expr.modifier})${critical?' · critical':''}`,()=>rollDice(expr,random,options.digital?'digital':'automatic')));
 const subtotal=Math.max(0,Math.min(...rolls.map(r=>r.total)));return Object.freeze({rolls:Object.freeze(rolls),subtotal,multiplier,amount:Math.floor(Math.floor(subtotal*(options.half?0.5:1))*multiplier)});
}
