import { registerCombatant,startEncounter } from './encounter';
import { supportedBattleMoves,useBattleMove,advanceBattleTurn } from './battle';
import type { EncounterState } from './types';
import type { GameDataRegistry } from '../data/registry';
export function prototypeChoices(registry:GameDataRegistry){return registry.species.filter(s=>s.learnset.some(m=>m.minimumLevel<=s.baseLevel&&supportedBattleMoves().includes(m.moveId))).map(s=>({id:s.id,name:s.name,level:s.baseLevel}));}
export function startPrototype(state:EncounterState,registry:GameDataRegistry,ids:readonly [string,string]){
 if(state.rules.rollMode==='manual'||state.rules.weather||state.rules.terrain)throw new Error('Prototype requires automatic or digital rolls without weather or terrain');
 for(const [i,id] of ids.entries()){
 const s=registry.getSpecies(id);if(!s)throw new Error('Unknown species');
 const learnedMoves=registry.getLearnableMoves(id,s.baseLevel).flatMap(x=>x.kind==='defined'&&supportedBattleMoves().includes(x.move.id)?[{moveId:x.move.id,pp:x.move.pp.kind==='limited'?{kind:'limited' as const,remaining:x.move.pp.maximum}:{kind:'unlimited' as const}}]:[]);
 if(!learnedMoves.length)throw new Error('No supported moves');
 const p={id:`side-${i}`,speciesId:s.id,level:s.baseLevel,xp:0,abilityScores:s.abilityScores,armorClass:s.armorClass,maximumHP:s.baseHP,currentHP:s.baseHP,learnedMoves};
 state=registerCombatant(state,{...p,kind:'pokemon',sideId:p.id,name:s.name,speed:s.speed,temporaryHP:0,deployment:'active',volatile:[],pokemon:p,position:{x:i*5,y:0,elevation:0}},state.version);
 }
 return startEncounter(state,state.version);
}
export function prototypeAction(state:EncounterState,registry:GameDataRegistry,moveId?:string){
 if(state.status!=='active'||!state.turn)throw new Error('Battle is not active');
 const actorId=state.initiative[state.turn.slotIndex].combatantIds[0];const target=state.combatants.find(c=>c.id!==actorId&&c.currentHP>0);if(!target)throw new Error('No target');
 if(!moveId)return {state:advanceBattleTurn(state,state.version,actorId,{},registry),message:'Turn ended'};
 const r=useBattleMove(state,state.version,registry,{actorId,targetId:target.id,moveId});return {state:r.state,message:`${state.combatants.find(c=>c.id===actorId)?.name} used ${registry.getMove(moveId)?.name??moveId}: ${r.attack?`roll ${r.attack.roll.natural}, ${r.attack.hit?`${r.amount} damage`:'miss'}`:'action forfeited'}`};
}
