import { battlefieldDistance, moveWithOpportunity } from './battle';
import { opportunityCandidates } from './status-rules';
import { spendMovement } from './encounter';
import type { EncounterState, Position } from './types';
import type { GameDataRegistry } from '../data/registry';
export function tacticalStep(s:EncounterState,registry:GameDataRegistry,id:string,destination:Position,declineReactions=false){
 const actor=s.combatants.find(c=>c.id===id);
 if(s.status!=='active'||s.rules.battlefield!=='grid'||!actor?.position||actor.currentHP<=0||!s.turn||!s.initiative[s.turn.slotIndex].combatantIds.includes(id)||destination.elevation!==actor.position.elevation||battlefieldDistance(actor.position,destination)!==5||destination.x%5||destination.y%5)throw new Error('Select an adjacent five-foot square');
 if(s.combatants.some(c=>c.id!==id&&c.currentHP>0&&c.position&&(c.kind==='trainer'?s.rules.trainerParticipation:c.deployment==='active')&&battlefieldDistance(c.position,destination)===0))throw new Error('Occupied square');
 const reach=Object.fromEntries(s.combatants.map(c=>[c.id,c.kind==='pokemon'&&['huge','gargantuan'].includes(registry.getSpecies(c.pokemon.speciesId)?.size??'')?10:5]));
 const candidates=opportunityCandidates(s,id,destination,reach);
 if(candidates.length&&!declineReactions)throw new Error('Opportunity attacks possible: explicitly decline reactions to move');
 const state=actor.kind==='pokemon'?moveWithOpportunity(s,s.version,registry,id,destination,reach,[]).state:{...spendMovement(s,s.version,id,5),combatants:s.combatants.map(c=>c.id===id?{...c,position:destination}:c)};
 return {state,message:`${actor.name} moved 5 ft${candidates.length?' (DM declined opportunity attacks)':''}`};
}
