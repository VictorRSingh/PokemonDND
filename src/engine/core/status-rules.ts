import type { PokemonCombatant, EncounterState, Position } from './types';
import type { AbilityKey } from '../data/types';
import { getAbilityModifier } from './ability-scores';
import { getProficiencyBonus } from './progression';
import { battlefieldDistance } from './battle';

/** Pure status queries; paralysis incapacitation requires a turn-specific roll. */
export function statusRestrictions(p: PokemonCombatant, paralysisBlocked = p.paralysisBlocked ?? false) {
 const asleep=p.volatile.some(x=>x.kind==='asleep'), confused=p.volatile.some(x=>x.kind==='confused');
 const incapacitated=asleep||p.nonvolatile?.kind==='frozen'||paralysisBlocked;
 return Object.freeze({incapacitated, restrained:incapacitated, reactions:!incapacitated&&!confused, movementMultiplier:incapacitated?0:confused||p.nonvolatile?.kind==='paralyzed'?0.5:1});
}
export function statusDisadvantages(p:PokemonCombatant, check:'attack'|'ability'|'save', ability?:AbilityKey):readonly string[] {
 const out:string[]=[];
 if(p.volatile.some(x=>x.kind==='flinched'))out.push('Flinched');
 if(p.nonvolatile?.kind==='poisoned'&&check!=='save')out.push('Poisoned');
 if(check==='save'&&p.volatile.some(x=>x.kind==='asleep'))out.push('Asleep');
 if(check==='save'&&p.nonvolatile?.kind==='paralyzed'&&(ability==='str'||ability==='dex'))out.push('Paralyzed');
 return Object.freeze(out);
}
function face(n:number,sides:number){if(!Number.isInteger(n)||n<1||n>sides)throw new Error('Invalid die face');return n;}
export function paralysisBlocksTurn(roll:number){return face(roll,4)===1;}
export function sleepRecovery(roll:number){return face(roll,20)>=11;}
export function confusionOutcome(roll:number,level:number){face(roll,20);const proficiency=getProficiencyBonus(level);return Object.freeze({recovered:roll>=16,forfeit:roll<=10,selfDamage:roll<=10?proficiency:0});}
/** Caller supplies the selected natural STR save, including any advantage/disadvantage. */
export function frozenRecovery(p:PokemonCombatant,sourceLevel:number,natural:number,proficient:boolean,extraModifier=0){face(natural,20);if(!Number.isSafeInteger(extraModifier))throw new Error('Invalid modifier');const dc=10+getProficiencyBonus(sourceLevel);const total=natural+getAbilityModifier(p.abilityScores.str)+(proficient?getProficiencyBonus(p.level):0)+extraModifier;return Object.freeze({dc,total,recovered:total>=dc});}
/** Endpoint-only trigger detection; path traversal and reaction execution remain separate. */
export function opportunityCandidates(s:EncounterState,moverId:string,destination:Position,reachById:Readonly<Record<string,number>>,disengaged=false):readonly string[]{
 if(s.status!=='active'||s.rules.battlefield!=='grid'||!s.turn)throw new Error('Grid encounter required');
 const mover=s.combatants.find(c=>c.id===moverId);if(!mover?.position||!s.initiative[s.turn.slotIndex].combatantIds.includes(moverId))throw new Error('Invalid mover');
 if(!s.rules.reactions||!s.rules.opportunityAttacks||disengaged||s.turn.disengagedIds?.includes(moverId))return Object.freeze([]);
 return Object.freeze(s.combatants.filter(c=>{if(c.sideId===mover.sideId||c.currentHP<=0||!c.position||!s.reactionAvailable[c.id]||c.kind==='trainer'&&!s.rules.trainerParticipation||c.kind==='pokemon'&&(c.deployment!=='active'||!statusRestrictions(c).reactions))return false;const reach=reachById[c.id];if(reach!==5&&reach!==10)throw new Error('Missing or invalid reach');return battlefieldDistance(c.position,mover.position!)<=reach&&battlefieldDistance(c.position,destination)>reach;}).map(c=>c.id));
}
