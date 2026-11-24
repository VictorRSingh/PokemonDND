import { ABILITY_KEYS, ELEMENTAL_TYPES } from '../types';
import type { AbilityKey, AbilityScores, CreatureSize, ElementalType, MovementMode, PokemonSpeciesDefinition, NormalizationResult, DataIssue, EvolutionDefinition, EvolutionRequirement, HitDie } from '../types';

export function canonicalId(name: string): string {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/♂/g, ' male ').replace(/♀/g, ' female ').toLowerCase().replace(/[’'\"]/g, '').replace(/%/g, ' percent ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const aliases: Record<string,string> = { 'XScissor':'X-Scissor', 'Extreme "Speed"':'Extreme Speed', 'Reflect "Type"':'Reflect Type', 'Nature’s Madness':"Nature's Madness", 'Baby- Doll Eyes':'Baby-Doll Eyes', '"Speed" Swap':'Speed Swap' };
export const moveId = (name: string) => canonicalId(aliases[name] ?? name);
const sizes = ['tiny','small','medium','large','huge','gargantuan'];
const unique = <T>(values: T[]): T[] => [...new Set(values)];
const strings = (value: unknown): string[] => { if (!Array.isArray(value) || value.some(x => typeof x !== 'string')) throw new Error('Expected string array'); return value.map(x=>x.trim()).filter(Boolean); };
const number = (value: unknown, min: number, max = Infinity): number => { if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) throw new Error('Invalid integer'); return value; };

/** Source-verified corrections, scoped to the exact original record. */
function corrected(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.name === 'Alolan Muk' && Number(raw.number) === 89) return {...raw, hit_dice:'d12', tm: strings(raw.tm).map(t=>t==='100 10'?'100':t)};
  if (raw.name === 'Forme' && Number(raw.number) === 718) return {...raw,name:'Zygarde Complete Forme'};
  if (raw.name === '"Type": Null' && Number(raw.number) === 772) return {...raw,name:'Type: Null',type:['Normal'], evolution:'Type: Null can evolve into Silvally at level 16 and above if its Loyalty is +2 or higher. When it evolves, its health increases by double its level, and it gains 11 points to add to its ability scores (max 20).'};
  return raw;
}
/** Only unambiguous level-only requirements are executable; all others retain source text for review. */
function evolutions(text: unknown, names: readonly string[]): EvolutionDefinition[] {
  if (text === null || text === '') return [];
  if (typeof text !== 'string') throw new Error('Invalid evolution text');
  const points = /gains? (\d+) points?/i.exec(text);
  const clause = text.split(/When it evolves/i)[0];
  const targets = names.filter(n => new RegExp('(?:into |, or | or )'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?= at | with | if | when |\\.|,|$)','i').test(clause));
  if (/^Espurr can evolve into Meowstic at level 7/.test(text)) targets.push('Meowstic ♂','Meowstic ♀');
  if (!targets.length || !points) throw new Error('Unresolved evolution: '+text);
  return unique(targets).map(target => {
    const simple = /can evolve into (.+?) at level (\d+) and above\.$/i.exec(clause.trim());
    let requirement: EvolutionRequirement = {kind:'manual',description:text};
    if (simple && simple[1]===target) requirement={kind:'level',minimum:Number(simple[2])};
    if (target==='Silvally' && /^Type: Null can evolve into Silvally at level 16 and above if its Loyalty is \+2 or higher\./.test(text)) requirement={kind:'all',requirements:[{kind:'level',minimum:16},{kind:'loyalty',minimum:2}]};
    return {targetSpeciesId:canonicalId(target),requirement,abilityScorePoints:Number(points[1]),description:text};
  });
}
export function normalizePokemon(raw: unknown, speciesNames: readonly string[]): NormalizationResult<PokemonSpeciesDefinition> {
  let field='record'; let record='unknown';
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected object');
    const r=corrected(raw as Record<string,unknown>); record=String(r.name);
    field='name'; if(typeof r.name!=='string'||!canonicalId(r.name)) throw new Error('Invalid name');
    const name=r.name;
    field='number'; const dex=number(Number(r.number),1);
    field='type'; const tags=strings(r.type).map(t=>t.toLowerCase());
    const size=String(r.classification ?? tags.find(t=>sizes.includes(t))).toLowerCase();
    if(!sizes.includes(size)) throw new Error('Invalid size');
    const elements=(v: string[]): ElementalType[] => unique(v.flatMap(t=>t.toLowerCase()==='none'?[]:t.toLowerCase().split(/\s+/)).map(t=>{if(!(ELEMENTAL_TYPES as readonly string[]).includes(t))throw new Error('Unknown type: '+t);return t as ElementalType;}));
    const types=elements(tags.filter(t=>!sizes.includes(t))); if(!types.length)throw new Error('No elemental types');
    field='level'; const baseLevel=number(r.level,1,20);
    field='sr'; const sr=String(r.sr).split('/').map(Number); const speciesRating=sr[0]/(sr[1]??1); if(sr.length>2||!Number.isFinite(speciesRating)||speciesRating<=0)throw new Error('Invalid rating');
    field='hit_dice'; const die=/^d(\d+)$/.exec(String(r.hit_dice)); if(!die)throw new Error('Invalid hit die');
    const hitDie: HitDie = name==='Shedinja'&&die[1]==='0'?{kind:'special',ruleId:'shedinja-paper-thin'}:{kind:'die',sides:number(Number(die[1]),1)};
    field='speed'; const speed: Partial<Record<MovementMode,number>>={}; for(const s of strings(r.speed)){const m=/^(\d+)ft\. (walking|swimming|flying|climbing|burrowing)( \(hover\))?$/.exec(s);if(!m)throw new Error('Invalid speed: '+s);speed[m[2] as MovementMode]=Number(m[1]);if(m[3])speed.hovering=Number(m[1]);}
    field='stats'; const stats=r.stats as Record<string,{value:unknown}>; const abilityScores=Object.fromEntries(ABILITY_KEYS.map(k=>[k,number(stats[k]?.value,0,30)])) as AbilityScores;
    field='saving_throws'; const saves: Record<string,AbilityKey>={strength:'str',stength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha'};
    const savingThrows=unique(strings(r.saving_throws).flatMap(s=>{const k=s.toLowerCase();if(k==='none')return [];if(k==='all abilities')return [...ABILITY_KEYS];if(!saves[k])throw new Error('Unknown save '+s);return [saves[k]];}));
    field='moves'; if(!r.moves||typeof r.moves!=='object'||Array.isArray(r.moves))throw new Error('Invalid moves');
    const learnset=Object.entries(r.moves).filter(([key])=>key!=='egg_moves').flatMap(([key,v])=>{const minimumLevel=key==='starting_moves'?baseLevel:number(Number(key),1,20);return unique(strings(v).map(moveId)).map(moveId=>({moveId,minimumLevel}));});
    field='abilities'; const abilityIds=unique(strings(r.abilities).filter(a=>a.toLowerCase()!=='none').map(a=>canonicalId(a.split(':')[0])));
    const hidden=typeof r.hidden_ability==='string'?canonicalId(r.hidden_ability.split(':')[0]):undefined;
    field='evolution'; const evolution=evolutions(r.evolution,speciesNames);
    field='tm'; const tmIds=unique(strings(r.tm).flatMap(t=>{if(t==='EVERY \"TM\"')return Array.from({length:100},(_,i)=>String(i+1).padStart(2,'0'));if(t==='None')return [];if(/^100 (?:10[1-9]|11[0-8])(?: Zygarde Complete)?$/.test(t)||t.startsWith('100 Portions of the material'))return ['100'];if(/^None \d+$/.test(t))return []; if(!/^[\d\s.,]+$/.test(t))throw new Error('Invalid TM '+t);return (t.match(/\d+/g)??[]).map(n=>String(number(Number(n),1,100)).padStart(2,'0'));}));
    field='armor_class';const armorClass=number(r.armor_class,1);field='hit_points';const baseHP=number(r.hit_points,1);
    field='resistances';const resistances=elements(strings(r.resistances));field='vulnerabilities';const vulnerabilities=elements(strings(r.vulnerabilities));field='immunities';const immunities=elements(strings(r.immunities));
    field='skills/senses';const proficientSkills=strings(r.proficient_skills).filter(s=>s.toLowerCase()!=='none');const senses=strings(r.senses).filter(s=>s.toLowerCase()!=='none');
    return {ok:true,value:{id:canonicalId(name),number:dex,name,size:size as CreatureSize,types:types as [ElementalType,...ElementalType[]],baseLevel,speciesRating,armorClass,baseHP,hitDie,speed,abilityScores,proficientSkills,savingThrows,resistances,vulnerabilities,immunities,senses,abilityIds,hiddenAbilityId:hidden&&hidden!=='none'?hidden:undefined,learnset,tmIds,evolutions:evolution}};
  } catch(e) {const issue:DataIssue={dataset:'pokemon_master_list',record,field,message:e instanceof Error?e.message:String(e)};return {ok:false,issues:[issue]};}
}
export function normalizePokemonDataset(raw: readonly unknown[]) {
  const names=raw.flatMap(r=>r&&typeof r==='object'&&!Array.isArray(r)?[String(corrected(r as Record<string,unknown>).name)]:[]);
  const species:PokemonSpeciesDefinition[]=[];const issues:DataIssue[]=[];const ids=new Set<string>();
  for(const r of raw){const result=normalizePokemon(r,names);if(!result.ok){issues.push(...result.issues);continue;}const v=result.value;if(ids.has(v.id)){issues.push({dataset:'pokemon_master_list',record:v.name,field:'id',message:'Duplicate canonical ID '+v.id});continue;}ids.add(v.id);species.push(v);}
  return {species,issues};
}
