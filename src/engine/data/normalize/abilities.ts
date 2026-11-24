import { handbookDescriptions } from './ability-reconciliation';
import { canonicalId } from './pokemon';
import type { AbilityDefinition, DataIssue } from '../types';
export interface ReferencedAbility extends AbilityDefinition {
  readonly descriptionVariants: readonly string[];
  readonly speciesDescriptions?: Readonly<Record<string,string>>;
  readonly reconciliation: 'single' | 'handbook' | 'species-specific' | 'unresolved';
  readonly activation: 'unclassified';
  readonly standard: boolean;
  readonly hidden: boolean;
}
/** Species descriptions are evidence, not executable rules. Conflicts remain explicit. */
export function normalizeAbilityDataset(raw: readonly unknown[]) {
  const issues: DataIssue[] = [];
  const groups = new Map<string,{name:string; descriptions:Set<string>; bySpecies:Map<string,Set<string>>; standard:boolean; hidden:boolean}>();
  for (const entry of raw) {
    const r = entry as Record<string,unknown> | null;
    const record = String(r?.name ?? 'unknown');
    const add = (value:unknown, hidden:boolean) => {
      if (typeof value === 'string' && (!value.trim() || value.trim().toLowerCase()==='none')) return;
      if (hidden && (value == null || (Array.isArray(value) && value.length === 0))) return;
      const match = typeof value === 'string' ? /^([^:]+):\s*([\s\S]+)$/.exec(value.trim()) : null;
      if (!match || !match[2].trim() || !canonicalId(match[1])) { issues.push({dataset:'pokemon_master_list',record,field:hidden?'hidden_ability':'abilities',message:'Invalid ability reference'}); return; }
      const name=match[1].trim(), id=canonicalId(name);
      const group=groups.get(id) ?? {name,descriptions:new Set<string>(),bySpecies:new Map<string,Set<string>>(),standard:false,hidden:false};
      group.descriptions.add(match[2].trim());
      const speciesKey=canonicalId(record);
      const variants=group.bySpecies.get(speciesKey) ?? new Set<string>();
      variants.add(match[2].trim()); group.bySpecies.set(speciesKey,variants);
      if(hidden) group.hidden=true; else group.standard=true;
      groups.set(id,group);
    };
    if(Array.isArray(r?.abilities)) r.abilities.forEach(v=>add(v,false));
    else issues.push({dataset:'pokemon_master_list',record,field:'abilities',message:'Expected ability array'});
    add(r?.hidden_ability,true);
  }
  const abilities: ReferencedAbility[] = [...groups].map(([id,g]):ReferencedAbility=>{
    const descriptionVariants=[...g.descriptions].sort();
    const handbook = Object.prototype.hasOwnProperty.call(handbookDescriptions,id) ? handbookDescriptions[id] : undefined;
    const expectedSpecies = id==='power-construct' ? ['zygarde-10-percent-forme','zygarde-50-percent-forme'] : id==='variable-size' ? ['pumpkaboo','gourgeist'] : [];
    const speciesSpecific = expectedSpecies.length>0 && g.bySpecies.size===expectedSpecies.length && expectedSpecies.every(key=>g.bySpecies.get(key)?.size===1);
    const reconciliation = descriptionVariants.length===1?'single':handbook?'handbook':speciesSpecific?'species-specific':'unresolved';
    const speciesDescriptions = speciesSpecific ? Object.fromEntries([...g.bySpecies].map(([key,values])=>[key,[...values][0]])) : undefined;
    return {id,name:g.name,reconciliation,speciesDescriptions,description:reconciliation==='single'?descriptionVariants[0]:reconciliation==='handbook'?handbook!:speciesSpecific?'Species-specific description; consult speciesDescriptions.':'Conflicting source descriptions; review required.',descriptionVariants,activation:'unclassified',standard:g.standard,hidden:g.hidden,implementation:{kind:'unsupported',reason:'Combat handler not implemented'},source:{document:reconciliation==='handbook'?'Pokemon_5e_Gen_1_-_7.pdf, section 11':'pokemon_master_list.json'}};
  }).sort((a,b)=>a.id.localeCompare(b.id));
  return {abilities,issues,conflicts:abilities.filter(a=>a.reconciliation==='unresolved').map(a=>a.id)};
}
