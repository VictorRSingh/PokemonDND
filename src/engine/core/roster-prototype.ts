import {registerCombatant,startEncounter} from './encounter';
import {supportedBattleMoves} from './battle';
import {canonicalId,moveId} from '../data/normalize/pokemon';
import {ABILITY_KEYS,type AbilityScores} from '../data/types';
import type {GameDataRegistry} from '../data/registry';
import type {EncounterState,PokemonCombatant} from './types';
export interface RosterEntry {id:string;trainerId:string;trainerName:string;name:string;number:number;data:{given_name?:string;current_level:number|null;level:number;armor_class:number;hit_points:number;current_hit_points:number|null;stats:Record<string,unknown>;selected_moves?:string[];selected_ability?:string}}
export function rosterCombatant(row:RosterEntry,registry:GameDataRegistry,sideId:string,x:number):PokemonCombatant {
 const species=registry.getSpecies(row.name);if(!species||species.number!==row.number)throw new Error('Unknown saved species: '+row.name);
 const d=row.data;const level=d.current_level??d.level;const maximumHP=d.hit_points;const currentHP=d.current_hit_points??maximumHP;
 if(currentHP<=0)throw new Error('Saved Pokémon has fainted');
 const abilityScores=Object.fromEntries(ABILITY_KEYS.map(k=>[k,(d.stats[k] as {value?:unknown}|undefined)?.value])) as AbilityScores;
 const learnedMoves=[...new Set((d.selected_moves??[]).map(moveId))].map(id=>{const m=registry.getMove(id);if(!m)throw new Error('Unknown saved move: '+id);return {moveId:id,pp:m.pp.kind==='limited'?{kind:'limited' as const,remaining:m.pp.maximum}:{kind:'unlimited' as const}};});
 const abilityId=d.selected_ability?canonicalId(d.selected_ability.split(':')[0]):undefined;
 if(abilityId&&!registry.getSpeciesAbility(species.id,abilityId))throw new Error('Unknown saved ability: '+abilityId);
 const pokemon={id:row.id,speciesId:species.id,level,xp:0,abilityScores,armorClass:d.armor_class,maximumHP,currentHP,learnedMoves,...(abilityId?{abilityId}: {})};
 return {...pokemon,kind:'pokemon',sideId,name:d.given_name?.trim()||species.name,speed:species.speed,temporaryHP:0,deployment:'active',volatile:[],pokemon,position:{x,y:0,elevation:0}};
}
export function startRosterPrototype(state:EncounterState,registry:GameDataRegistry,left:RosterEntry,right:RosterEntry|string){
 return startGroupPrototype(state,registry,[[left],[right]]);
}

/** Additional local encounter participants. Trainer stats are explicit prototype defaults. */
export function startGroupPrototype(state:EncounterState,registry:GameDataRegistry,sides:readonly (readonly (RosterEntry|string)[])[]){
 if(state.rules.rollMode==='manual'||state.rules.weather||state.rules.terrain)throw new Error('Unsupported prototype rules');
 if(sides.length!==2||sides.some(s=>!s.length||s.length>6))throw new Error('Select 1–6 Pokémon per side');
 const trainers=new Map<string,string>();let index=0;
 for(const [side,entries] of sides.entries())for(const [row,entry] of entries.entries()){
 const sideId=`side-${side}`;const x=side*5;const y=row*5;index++;
 if(typeof entry==='string'){
 const species=registry.getSpecies(entry);if(!species)throw new Error('Unknown species');
 const learnedMoves=registry.getLearnableMoves(entry,species.baseLevel).flatMap(m=>m.kind==='defined'&&supportedBattleMoves().includes(m.move.id)?[{moveId:m.move.id,pp:m.move.pp.kind==='limited'?{kind:'limited' as const,remaining:m.move.pp.maximum}:{kind:'unlimited' as const}}]:[]);
 const p={id:`wild-${index}`,speciesId:species.id,level:species.baseLevel,xp:0,abilityScores:species.abilityScores,armorClass:species.armorClass,maximumHP:species.baseHP,currentHP:species.baseHP,learnedMoves};
 state=registerCombatant(state,{...p,kind:'pokemon',sideId,name:species.name,speed:species.speed,temporaryHP:0,deployment:'active',volatile:[],pokemon:p,position:{x,y,elevation:0}},state.version);
 }else{
 const existing=trainers.get(entry.trainerId);if(existing&&existing!==sideId)throw new Error('Trainer cannot join opposing sides');
 const trainerId=`trainer-${entry.trainerId}`;
 if(!existing){trainers.set(entry.trainerId,sideId);state=registerCombatant(state,{id:trainerId,kind:'trainer',sideId,name:entry.trainerName,level:1,abilityScores:{str:10,dex:10,con:10,int:10,wis:10,cha:10},armorClass:10,maximumHP:10,currentHP:10,temporaryHP:0,speed:{walking:30},position:{x:side===0?-5:10,y,elevation:0}},state.version);}
 state=registerCombatant(state,{...rosterCombatant(entry,registry,sideId,x),position:{x,y,elevation:0},trainerId},state.version);
 }
 }
 return startEncounter(state,state.version);
}
