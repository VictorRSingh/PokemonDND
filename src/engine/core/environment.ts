import type { Combatant, EncounterState } from './types';
import type { GameDataRegistry } from '../data/registry';
export const weatherKinds=['clear','sun','rain','sandstorm','hail','snow'] as const;
export const terrainKinds=['none','electric','grassy','misty','psychic'] as const;
export type Weather=typeof weatherKinds[number];
export type FieldTerrain=typeof terrainKinds[number];
export interface Environment { readonly weather:Weather; readonly terrain:FieldTerrain; readonly weatherUntil:number; readonly terrainUntil:number }
export const emptyEnvironment:Environment={weather:'clear',terrain:'none',weatherUntil:0,terrainUntil:0};
export function setEnvironment(s:EncounterState,version:number,kind:'weather'|'terrain',value:string,rounds:number):EncounterState {
 if(s.status!=='active'||!s.turn||s.version!==version||!Number.isSafeInteger(rounds)||rounds<1||rounds>100)throw new Error('Invalid environment update');
 if(!s.rules[kind])throw new Error(`${kind} disabled by rules`);
 if(!(kind==='weather'?weatherKinds:terrainKinds).some(x=>x===value))throw new Error('Invalid environment kind');
 const env=s.environment??emptyEnvironment;
 return {...s,version:version+1,environment:{...env,[kind]:value,[kind==='weather'?'weatherUntil':'terrainUntil']:s.turn.round+rounds}};
}
export function environmentAt(s:EncounterState):Environment {const e=s.environment??emptyEnvironment;const round=s.turn?.round??0;return {...e,weather:s.rules.weather&&round<e.weatherUntil?e.weather:'clear',terrain:s.rules.terrain&&round<e.terrainUntil?e.terrain:'none'};}
const grounded=(c:Combatant)=>!c.position||c.position.elevation===0;
export function environmentMultiplier(s:EncounterState,actor:Combatant,target:Combatant,type:string):number {const e=environmentAt(s);let n=1;if(e.weather==='sun')n*=type==='fire'?1.5:type==='water'?0.5:1;if(e.weather==='rain')n*=type==='water'?1.5:type==='fire'?0.5:1;if(grounded(actor)&&((e.terrain==='electric'&&type==='electric')||(e.terrain==='grassy'&&type==='grass')||(e.terrain==='psychic'&&type==='psychic')))n*=1.3;if(grounded(target)&&e.terrain==='misty'&&type==='dragon')n*=0.5;return n;}
export function environmentStatusImmune(s:EncounterState,c:Combatant,kind:string):boolean {const t=environmentAt(s).terrain;return grounded(c)&&((t==='electric'&&kind==='asleep')||(t==='misty'&&['asleep','confused','burned','poisoned','paralyzed','frozen'].includes(kind)));}
export function tickEnvironment(s:EncounterState,ids:readonly string[],registry?:GameDataRegistry):EncounterState {const e=environmentAt(s);const events:string[]=[];const combatants=s.combatants.map(c=>{if(!ids.includes(c.id)||c.currentHP<=0||(c.kind==='pokemon'&&c.deployment!=='active'))return c;let hp=c.currentHP,temp=c.temporaryHP;const types:readonly string[]|undefined=c.kind==='pokemon'?registry?.getSpecies(c.pokemon.speciesId)?.types:[];const unit=Math.max(1,Math.floor(c.maximumHP/16));const hurt=(amount:number,label:string)=>{const absorbed=Math.min(temp,amount);temp-=absorbed;hp=Math.max(0,hp-amount+absorbed);events.push(`${c.name}: ${label} (${amount} damage)`);};if(types&&(e.weather==='sandstorm'&&!types.some(t=>['rock','ground','steel'].includes(t))||e.weather==='hail'&&!types.includes('ice')))hurt(unit,e.weather);if(hp>0&&grounded(c)&&c.position&&s.battlefieldTerrain?.[`${c.position.x},${c.position.y}`]==='hazard')hurt(unit,'hazard');if(hp>0&&grounded(c)&&e.terrain==='grassy'){const healed=Math.min(unit,c.maximumHP-hp);hp+=healed;if(healed)events.push(`${c.name}: grassy terrain (+${healed} HP)`);}return {...c,currentHP:hp,temporaryHP:temp};});return {...s,combatants,environmentEvents:events};}
