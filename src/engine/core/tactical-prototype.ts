import { battlefieldDistance, moveWithOpportunity, supportedBattleMoves } from './battle';
import { opportunityCandidates,statusRestrictions } from './status-rules';
import { spendMovement,spendTurnResource } from './encounter';
import type { EncounterState, Position } from './types';
import type { GameDataRegistry } from '../data/registry';
type ReactionChoice=Parameters<typeof moveWithOpportunity>[6][number];
const reachFor=(s:EncounterState,r:GameDataRegistry)=>Object.fromEntries(s.combatants.map(c=>[c.id,c.kind==='pokemon'&&['huge','gargantuan'].includes(r.getSpecies(c.pokemon.speciesId)?.size??'')?10:5]));
export function tacticalCandidates(s:EncounterState,r:GameDataRegistry,id:string,p:Position){return opportunityCandidates(s,id,p,reachFor(s,r));}
export function tacticalReactionMoves(s:EncounterState,r:GameDataRegistry,id:string){const c=s.combatants.find(c=>c.id===id);return c?.kind==='pokemon'?[...c.pokemon.learnedMoves.filter(m=>supportedBattleMoves().includes(m.moveId)&&r.getMove(m.moveId)?.range.trim().toLowerCase()==='melee'&&r.getMove(m.moveId)?.timing.trim().toLowerCase()==='1 action'&&(!s.rules.trackPP||m.pp.kind!=='limited'||m.pp.remaining>0)).map(m=>m.moveId),'struggle']:[];}
export function tacticalCost(s:EncounterState,id:string){const c=s.combatants.find(c=>c.id===id);const multiplier=c?.kind==='pokemon'?(statusRestrictions(c).incapacitated?0:statusRestrictions(c).movementMultiplier):1;return multiplier?Math.ceil(5/multiplier):Infinity;}
export function tacticalAction(s:EncounterState,id:string,action:'dash'|'disengage'){
 const c=s.combatants.find(c=>c.id===id);if(!c||s.rules.battlefield!=='grid'||(c.kind==='pokemon'&&(statusRestrictions(c).incapacitated||c.actionForfeited)))throw new Error('Action unavailable');
 const next=spendTurnResource(s,s.version,id,'action');const t=next.turn!;
 return {state:{...next,turn:action==='dash'?{...t,movementRemaining:{...t.movementRemaining,[id]:(t.movementRemaining[id]??0)+(c.speed.walking??0)}}:{...t,disengagedIds:[...new Set([...(t.disengagedIds??[]),id])]}},message:`${c.name} used ${action}`};
}
export function tacticalStep(s:EncounterState,registry:GameDataRegistry,id:string,destination:Position,declineReactions=false,choices:readonly ReactionChoice[]=[]){
 const actor=s.combatants.find(c=>c.id===id);
 if(s.status!=='active'||s.rules.battlefield!=='grid'||!actor?.position||actor.currentHP<=0||!s.turn||!s.initiative[s.turn.slotIndex].combatantIds.includes(id)||destination.elevation!==actor.position.elevation||battlefieldDistance(actor.position,destination)!==5||destination.x%5||destination.y%5)throw new Error('Select an adjacent five-foot square');
 if(s.combatants.some(c=>c.id!==id&&c.currentHP>0&&c.position&&(c.kind==='trainer'?s.rules.trainerParticipation:c.deployment==='active')&&battlefieldDistance(c.position,destination)===0))throw new Error('Occupied square');
 if(!Number.isFinite(tacticalCost(s,id))||(s.turn.movementRemaining[id]??0)<tacticalCost(s,id))throw new Error('Insufficient movement remaining');
 const reach=reachFor(s,registry),candidates=opportunityCandidates(s,id,destination,reach);
 if(candidates.some(id=>!choices.some(choice=>choice.actorId===id))&&!declineReactions)throw new Error('Opportunity attacks possible: resolve or decline reactions to move');
 if(actor.kind==='trainer'&&choices.length)throw new Error('Trainer reaction damage requires manual resolution');
 const result=actor.kind==='pokemon'?moveWithOpportunity(s,s.version,registry,id,destination,reach,choices):{state:{...spendMovement(s,s.version,id,5),combatants:s.combatants.map(c=>c.id===id?{...c,position:destination}:c)},reactions:[]};
 const moved=result.state.combatants.find(c=>c.id===id)?.position;
 return {state:result.state,message:[...result.reactions.map(r=>`${s.combatants.find(c=>c.id===r.actorId)?.name} opportunity attack: ${r.moveId}, ${r.amount} damage`),`${actor.name} ${moved&&battlefieldDistance(moved,destination)===0?'moved 5 ft':'movement interrupted'}${candidates.length>choices.length?' (remaining reactions declined)':''}`].join(' | ')};
}
