import type { EncounterState, PokemonCombatant } from './types';
import { spendTurnResource, completeEncounter } from './encounter';
import { battleOutcome, applyDamage } from './battle';
function freeze<T>(v:T):T {if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function check(s:EncounterState,v:number){if(s.status!=='active'||s.version!==v||!s.turn)throw new Error('Invalid state or stale version');}
function find(s:EncounterState,id:string):PokemonCombatant {const p=s.combatants.find(c=>c.id===id);if(p?.kind!=='pokemon')throw new Error('Unknown Pokémon');return p;}
/** Shared initiative replacement. Individual initiative requires a separate initiative policy. */
export function switchBattlePokemon(s:EncounterState,v:number,outgoingId:string,incomingId:string){
 check(s,v);
 const a=find(s,outgoingId),b=find(s,incomingId);if(!a.trainerId||a.trainerId!==b.trainerId||a.sideId!==b.sideId||a.deployment!=='active'||b.deployment!=='recalled'||b.currentHP<=0)throw new Error('Invalid replacement');
 if(s.rules.battlefield==='grid'&&(!a.position||s.combatants.some(c=>c.id!==a.id&&c.id!==b.id&&c.currentHP>0&&(c.kind==='trainer'||c.deployment==='active')&&c.position&&c.position.x===a.position!.x&&c.position.y===a.position!.y&&c.position.elevation===a.position!.elevation)))throw new Error('Replacement position unavailable');
 const slot=s.initiative.find(x=>x.combatantIds.includes(a.id));if(!slot)throw new Error('Missing initiative slot');
 const current=s.initiative[s.turn!.slotIndex].id===slot.id;
 if(a.currentHP>0&&(!current||s.turn!.round===1))throw new Error('Switch unavailable');
 const next=a.currentHP>0?spendTurnResource(s,v,a.id,'action'):s;
 const movement={...next.turn!.movementRemaining};if(current){delete movement[a.id];movement[b.id]=0;}
 return freeze({...next,version:v+1,combatants:next.combatants.map(c=>c.id===a.id?{...a,deployment:'recalled' as const,volatile:a.volatile.filter(x=>x.kind==='asleep')}:c.id===b.id?{...b,deployment:'active' as const,position:s.rules.battlefield==='grid'?a.position:b.position}:c),initiative:next.initiative.map(x=>x.id===slot.id?{...x,combatantIds:x.combatantIds.map(id=>id===a.id?b.id:id)}:x),turn:{...next.turn!,movementRemaining:movement},reactionAvailable:{...next.reactionAvailable,[a.id]:false,[b.id]:false}});
}
/** Trusted server adapter must authorize the operator before calling. */
export function resolveManualDamage(s:EncounterState,v:number,targetId:string,amount:number,reason:string,operatorId:string){check(s,v);if(!reason.trim()||!operatorId.trim())throw new Error('Audit details required');const p=find(s,targetId);if(p.deployment!=='active'||p.currentHP<=0)throw new Error('Invalid target');let state:EncounterState=freeze({...s,version:v+1,combatants:s.combatants.map(c=>c.id===targetId?applyDamage(p,amount):c)});if(battleOutcome(state).finished)state=freeze({...completeEncounter(state,state.version),version:v+1});return freeze({state,event:{kind:'manual-damage' as const,operatorId,reason,targetId,amount,version:state.version}});}
