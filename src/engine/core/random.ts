export interface DicePrompt { min:number; max:number; value:number; label:string }
export class PendingDice extends Error { constructor(public readonly prompt:DicePrompt){super('Dice input required');} }
let scope: {faces:readonly (number|null)[]; manual:boolean; rolls:DicePrompt[]; label:string}|undefined;
export function diceLabel<T>(label:string,fn:()=>T):T {const old=scope?.label;if(scope)scope.label=label;try{return fn();}finally{if(scope)scope.label=old??'Roll';}}
/** Synchronous transactional replay: no encounter state is committed until all dice resolve. */
export function withDice<T>(faces:readonly (number|null)[],manual:boolean,fn:()=>T){
 if(scope)throw new Error('Nested dice transaction');const local={faces,manual,rolls:[] as DicePrompt[],label:'Status / other roll'};scope=local;
 try{const result=fn();if(faces.length>local.rolls.length)throw new Error('Unused dice input');return {result,rolls:local.rolls};}finally{scope=undefined;}
}
/** Versioned, serializable Mulberry32 state. Not for cryptographic use. */
export interface RandomSource {
  nextUint32(): number;
  nextFloat(): number;
  nextInt(min: number, max: number): number;
  snapshot(): string;
}
const RANGE = 0x100000000;
export function createRandom(seed: number): RandomSource {
  if (!Number.isInteger(seed) || seed < 0 || seed >= RANGE) throw new RangeError('Seed must be an unsigned 32-bit integer');
  let state = seed >>> 0;
  function nextUint32(): number {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }
  return {
    nextUint32,
    nextFloat: () => nextUint32() / RANGE,
    nextInt(min, max) {
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min || max - min >= RANGE) throw new RangeError('Invalid integer range');
      const span = max - min + 1;
      const limit = RANGE - RANGE % span;
      let value: number;
      do { value = nextUint32(); } while (value >= limit);
      const generated=min+value%span;
      if(!scope)return generated;
      const i=scope.rolls.length,face=scope.faces[i];
      const prompt={min,max,value:generated,label:scope.label};
      if(scope.manual&&i>=scope.faces.length)throw new PendingDice(prompt);
      const chosen=face===null||face===undefined?generated:face;
      if(!Number.isInteger(chosen)||chosen<min||chosen>max)throw new RangeError('Invalid physical die result');
      scope.rolls.push({...prompt,value:chosen});return chosen;
    },
    snapshot: () => `mulberry32:v1:${state.toString(16).padStart(8, '0')}`,
  };
}
export function restoreRandom(snapshot: string): RandomSource {
  if (typeof snapshot !== 'string' || !/^mulberry32:v1:[0-9a-f]{8}$/.test(snapshot)) throw new Error('Invalid random state');
  return createRandom(Number.parseInt(snapshot.slice(-8), 16));
}
