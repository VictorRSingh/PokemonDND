import { spendTurnResource } from './encounter';
import { resolveManualDamage } from './battle-completion';
import { statusRestrictions } from './status-rules';
import type { EncounterState } from './types';
export function manualPrototype(s:EncounterState,actorId:string,targetId:string,moveId:string,amount:number,reason:string){
 const actor=s.combatants.find(c=>c.id===actorId),target=s.combatants.find(c=>c.id===targetId);
 if(actor?.kind!=='pokemon'||actor.deployment!=='active'||actor.currentHP<=0||actor.actionForfeited||statusRestrictions(actor).incapacitated||target?.kind!=='pokemon'||target.sideId===actor.sideId||target.deployment!=='active'||target.currentHP<=0||!reason.trim()||!Number.isSafeInteger(amount)||amount<0)throw new Error('Invalid manual ruling');
 const move=actor.pokemon.learnedMoves.find(m=>m.moveId===moveId);if(!move&&moveId!=='struggle')throw new Error('Move not learned');if(s.rules.trackPP&&move?.pp.kind==='limited'&&move.pp.remaining<=0)throw new Error('No PP');
 const next=spendTurnResource(s,s.version,actorId,'action');
 const used:EncounterState={...next,combatants:next.combatants.map(c=>c.id===actorId?{...actor,pokemon:{...actor.pokemon,learnedMoves:actor.pokemon.learnedMoves.map(m=>s.rules.trackPP&&m.moveId===moveId&&m.pp.kind==='limited'?{...m,pp:{kind:'limited' as const,remaining:m.pp.remaining-1}}:m)}}:c)};
 const result=resolveManualDamage(used,used.version,targetId,amount,reason,'local-dm');return {state:{...result.state,version:s.version+1},message:`DM ruling: ${actor.name} used ${moveId} on ${target.name}: ${amount} damage. ${reason}`};
}
