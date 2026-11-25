import type { Combatant, EncounterState, EncounterKind, InitiativeSlot, RulesetSnapshot, TurnState } from './types';
import { createRandom, restoreRandom } from './random';
import { rollD20, recordManualD20, type D20Result } from './d20';
import { getAbilityModifier, validateAbilityScores } from './ability-scores';
import { getProficiencyBonus } from './progression';
import { restoreRulesetSnapshot } from './rules';
import { initializeBattleTurn, battleOutcome, type StatusTurnRolls } from './battle';

function freeze<T>(value:T):T { if(value && typeof value==='object'){ for(const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function copy<T>(value:T):T { return JSON.parse(JSON.stringify(value)) as T; }
function requireState(state:EncounterState,status:EncounterState['status'],version:number) { if(state.version!==version) throw new Error('Stale encounter version'); if(state.status!==status) throw new Error(`Expected ${status} encounter`); }
function update(state:EncounterState,patch:Partial<EncounterState>):EncounterState { return freeze({...state,...patch,version:state.version+1}); }
function id(value:string){ if(typeof value!=='string'||!value.trim()) throw new Error('Invalid identifier'); }
export function createEncounter(idValue:string,kind:EncounterKind,rules:RulesetSnapshot,seed:number):EncounterState {
  id(idValue); if(!['wild','trainer','gym','boss','raid','pvp','custom'].includes(kind)) throw new Error('Invalid encounter kind');
  return freeze({id:idValue,kind,status:'setup',version:0,rules:restoreRulesetSnapshot(rules),combatants:[],initiative:[],reactionAvailable:{},rngState:createRandom(seed).snapshot()});
}
export function registerCombatant(state:EncounterState,combatant:Combatant,version:number):EncounterState {
  requireState(state,'setup',version); const c=copy(combatant); id(c.id); id(c.sideId); id(c.name);
  if(state.combatants.some(x=>x.id===c.id)) throw new Error('Duplicate combatant');
  if(c.kind!=='trainer'&&c.kind!=='pokemon') throw new Error('Invalid combatant kind');
  validateAbilityScores(c.abilityScores); getProficiencyBonus(c.level);
  if(![c.armorClass,c.maximumHP,c.currentHP,c.temporaryHP].every(Number.isSafeInteger)||c.armorClass<1||c.maximumHP<1||c.currentHP<0||c.currentHP>c.maximumHP||c.temporaryHP<0) throw new Error('Invalid combatant stats');
  for(const [key,speed] of Object.entries(c.speed)) if(!['walking','swimming','flying','climbing','burrowing','hovering'].includes(key)||!Number.isSafeInteger(speed)||speed<0) throw new Error('Invalid movement speed');
  if(c.kind==='pokemon') {
    if(!['active','recalled'].includes(c.deployment)) throw new Error('Invalid deployment');
    if(c.trainerId){ const trainer=state.combatants.find(x=>x.id===c.trainerId); if(!trainer||trainer.kind!=='trainer'||trainer.sideId!==c.sideId) throw new Error('Invalid trainer');
      if(c.deployment==='active'&&state.combatants.filter(x=>x.kind==='pokemon'&&x.trainerId===c.trainerId&&x.deployment==='active').length>=state.rules.activePokemonLimit) throw new Error('Active Pokémon limit exceeded'); }
  }
  return update(state,{combatants:[...state.combatants,c]});
}
function eligible(c:Combatant,state:EncounterState){return c.currentHP>0&&(c.kind==='pokemon'?c.deployment==='active':state.rules.trainerParticipation);}
function makeTurn(state:EncounterState,index:number,round:number):TurnState {
  const slot=state.initiative[index]; const members=state.combatants.filter(c=>slot.combatantIds.includes(c.id)&&eligible(c,state));
  return {round,slotIndex:index,resources:{actionAvailable:true,bonusActionAvailable:true},movementRemaining:Object.fromEntries(members.map(c=>[c.id,c.speed.walking??0]))};
}
export function startEncounter(state:EncounterState,version:number,manualRolls?:Readonly<Record<string,number>>,manualStatus:Readonly<Record<string,StatusTurnRolls>>={}):{state:EncounterState; rolls:readonly {slotId:string;actorId:string;result:D20Result}[]} {
  requireState(state,'setup',version);
  const active=state.combatants.filter(c=>eligible(c,state));
  if(new Set(active.filter(c=>c.kind==='pokemon').map(c=>c.sideId)).size<2) throw new Error('At least two opposing Pokémon sides required');
  const groups=new Map<string,Combatant[]>();
  for(const c of active){const key=state.rules.initiative==='shared'&&c.kind==='pokemon'&&c.trainerId?c.trainerId:c.id; groups.set(key,[...(groups.get(key)??[]),c]);}
  const rng=restoreRandom(state.rngState); const rolls:{slotId:string;actorId:string;result:D20Result}[]=[];
  if(state.rules.rollMode==='manual'&&(!manualRolls||Object.keys(manualRolls).length!==groups.size||[...groups.keys()].some(k=>!Object.prototype.hasOwnProperty.call(manualRolls,k)))) throw new Error('Manual initiative requires one roll per slot');
  if(state.rules.rollMode!=='manual'&&manualRolls!==undefined) throw new Error('Manual initiative not enabled');
  const slots:InitiativeSlot[]=[];
  for(const [key,members] of groups){const actor=state.combatants.find(c=>c.id===key)!; const modifier=getAbilityModifier(actor.abilityScores.dex); const result=state.rules.rollMode==='manual'?recordManualD20(modifier,[manualRolls![key]]):rollD20(modifier,rng,{},state.rules.rollMode); rolls.push({slotId:key,actorId:actor.id,result}); slots.push({id:key,combatantIds:members.map(c=>c.id),initiative:result.total});}
  slots.sort((a,b)=>b.initiative-a.initiative||(a.id<b.id?-1:a.id>b.id?1:0));
  const next={...state,initiative:slots};
  return freeze({state:initializeBattleTurn(update(state,{status:'active',initiative:slots,turn:makeTurn(next,0,1),reactionAvailable:Object.fromEntries(active.map(c=>[c.id,state.rules.reactions])),rngState:rng.snapshot()}),manualStatus),rolls});
}
function actorInTurn(state:EncounterState,actorId:string){ const actor=state.combatants.find(c=>c.id===actorId); if(!actor||!eligible(actor,state)||!state.turn||!state.initiative[state.turn.slotIndex].combatantIds.includes(actorId)) throw new Error('Actor is not in current turn'); return actor; }
export function spendTurnResource(state:EncounterState,version:number,actorId:string,resource:'action'|'bonus-action'):EncounterState {
  requireState(state,'active',version); actorInTurn(state,actorId); if(resource!=='action'&&resource!=='bonus-action') throw new Error('Invalid resource'); const turn=state.turn!; const key=resource==='action'?'actionAvailable':'bonusActionAvailable'; if(!turn.resources[key]) throw new Error('Resource already spent'); return update(state,{turn:{...turn,resources:{...turn.resources,[key]:false}}});
}
export function spendReaction(state:EncounterState,version:number,actorId:string):EncounterState {
  requireState(state,'active',version); const actor=state.combatants.find(c=>c.id===actorId); if(!state.rules.reactions||!actor||!eligible(actor,state)||!state.reactionAvailable[actorId]) throw new Error('Reaction unavailable'); return update(state,{reactionAvailable:{...state.reactionAvailable,[actorId]:false}});
}
export function spendMovement(state:EncounterState,version:number,actorId:string,feet:number):EncounterState {
  requireState(state,'active',version); actorInTurn(state,actorId); const turn=state.turn!; const remaining=turn.movementRemaining[actorId]??0; if(!Number.isSafeInteger(feet)||feet<=0||feet>remaining) throw new Error('Invalid movement expenditure'); return update(state,{turn:{...turn,movementRemaining:{...turn.movementRemaining,[actorId]:remaining-feet}}});
}
export function endTurn(state:EncounterState,version:number,actorId:string):EncounterState {
  requireState(state,'active',version); const turn=state.turn!; if(!state.initiative[turn.slotIndex].combatantIds.includes(actorId))throw new Error('Actor is not in current turn'); const count=state.initiative.length;
  for(let offset=1;offset<=count;offset++){const absolute=turn.slotIndex+offset,index=absolute%count; const slot=state.initiative[index]; const members=state.combatants.filter(c=>slot.combatantIds.includes(c.id)&&eligible(c,state)); if(!members.length) continue; const reactions={...state.reactionAvailable}; for(const c of members) reactions[c.id]=state.rules.reactions; return update(state,{turn:makeTurn(state,index,turn.round+Math.floor(absolute/count)),reactionAvailable:reactions});} throw new Error('No eligible turn remains');
}
export function pauseEncounter(state:EncounterState,version:number):EncounterState {requireState(state,'active',version);return update(state,{status:'paused'});}
export function resumeEncounter(state:EncounterState,version:number):EncounterState {requireState(state,'paused',version);return update(state,{status:'active'});}
export function completeEncounter(state:EncounterState,version:number):EncounterState {if(state.version!==version||!['active','paused'].includes(state.status)) throw new Error('Cannot complete encounter'); const {turn:_,...rest}=state; const outcome=battleOutcome(state); const result=outcome.finished?(outcome.winner===null?{kind:'draw' as const,winner:null}:{kind:'victory' as const,winner:outcome.winner}):{kind:'terminated' as const,winner:null}; return freeze({...rest,result,reactionAvailable:Object.fromEntries(Object.keys(state.reactionAvailable).map(id=>[id,false])),status:'completed',version:state.version+1});}
