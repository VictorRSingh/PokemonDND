import { tacticalCover, coverBonus } from './targeting';
import {getAbilityModifier} from './ability-scores';
import {getProficiencyBonus} from './progression';
import {rollD20} from './d20';
import {restoreRandom} from './random';
import {resolveAttack} from './resolution';
import {battlefieldDistance} from './battle';
import {statusRestrictions} from './status-rules';
import {spendTurnResource} from './encounter';
import {resolveManualDamage} from './battle-completion';
import type {EncounterState} from './types';
export function trainerActionReason(s:EncounterState,id:string,targetId:string,action:'attack'|'potion'|'help'):string|undefined {
 const a=s.combatants.find(c=>c.id===id),t=s.combatants.find(c=>c.id===targetId);
 if(s.status!=='active'||!s.turn||a?.kind!=='trainer'||!s.rules.trainerParticipation||a.currentHP<=0||s.rules.rollMode==='manual')return 'Trainer action unavailable';
 if(!s.initiative[s.turn.slotIndex]?.combatantIds.includes(id))return 'Not your turn';
 if(!s.turn.resources.actionAvailable)return 'Action already spent';
 if(action==='potion'&&!(a.potions&&a.potions>0))return 'No potions remaining';
 if(t?.kind!=='pokemon'||t.deployment!=='active'||t.currentHP<=0)return 'Select a living Pokémon';
 if((action==='attack')===(a.sideId===t.sideId))return 'Invalid target side';
 if(s.rules.battlefield==='grid'&&(!a.position||!t.position||battlefieldDistance(a.position,t.position)>5))return 'Target must be within 5 ft';
 if(a.position&&t.position&&tacticalCover(s,a.position,t.position)==='full')return 'Line of sight blocked';
 if(action==='potion'&&t.currentHP>=t.maximumHP)return 'Target already at full HP';
 return undefined;
}
export function trainerAction(s:EncounterState,id:string,targetId:string,action:'attack'|'potion'|'help'){
 const reason=trainerActionReason(s,id,targetId,action);if(reason)throw new Error(reason);
 const a=s.combatants.find(c=>c.id===id),t=s.combatants.find(c=>c.id===targetId);
 if(a?.kind!=='trainer'||!s.rules.trainerParticipation||a.currentHP<=0||t?.kind!=='pokemon'||t.deployment!=='active'||t.currentHP<=0||s.rules.rollMode==='manual')throw new Error('Trainer action unavailable');
 if(s.rules.battlefield==='grid'&&(!a.position||!t.position||battlefieldDistance(a.position,t.position)>5))throw new Error('Target must be within 5 ft');
 if((action==='attack')===(a.sideId===t.sideId))throw new Error('Invalid target side');
 const next=spendTurnResource(s,s.version,id,'action'),rng=restoreRandom(s.rngState);
 if(action==='attack'){
 const mod=getAbilityModifier(a.abilityScores.str);const roll=rollD20(mod+getProficiencyBonus(a.level),rng,{disadvantage:t.dodging&&!statusRestrictions(t).incapacitated?['Dodge']:[]},s.rules.rollMode);const hit=resolveAttack(roll,t.armorClass+(a.position&&t.position?coverBonus(tacticalCover(s,a.position,t.position)):0));const amount=hit.hit?Math.max(0,1+mod):0;
 const result=resolveManualDamage({...next,rngState:rng.snapshot()},next.version,t.id,amount,'Prototype unarmed attack',id);
 return {state:{...result.state,version:s.version+1},message:`${a.name} unarmed attack: ${roll.total} vs AC ${hit.ac}, ${hit.hit?amount+' damage':'miss'}`};
 }
 if(action==='potion'){
 if(!(a.potions&&a.potions>0)||t.currentHP===t.maximumHP)throw new Error('No potion or target already healthy');
 const amount=Math.min(10,t.maximumHP-t.currentHP);return {state:{...next,combatants:next.combatants.map(c=>c.id===id?{...a,potions:a.potions!-1}:c.id===t.id?{...t,currentHP:t.currentHP+amount,pokemon:{...t.pokemon,currentHP:t.currentHP+amount}}:c)},message:`${a.name} used a prototype potion on ${t.name}: restored ${amount} HP`};
 }
 return {state:{...next,combatants:next.combatants.map(c=>c.id===t.id?{...t,helped:true}:c)},message:`${a.name} helped ${t.name}: advantage on next attack`};
}
