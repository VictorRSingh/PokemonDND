import { canonicalId } from './pokemon';
import type { AbilityDefinition, DataIssue } from '../types';
export interface ReferencedAbility extends AbilityDefinition {
  readonly descriptionVariants: readonly string[];
  readonly activation: 'unclassified';
  readonly standard: boolean;
  readonly hidden: boolean;
}
/** Species descriptions are evidence, not executable rules. Conflicts remain explicit. */
export function normalizeAbilityDataset(raw: readonly unknown[]) {
  const issues: DataIssue[] = [];
  const groups = new Map<string,{name:string; descriptions:Set<string>; standard:boolean; hidden:boolean}>();
  for (const entry of raw) {
    const r = entry as Record<string,unknown> | null;
    const record = String(r?.name ?? 'unknown');
    const add = (value:unknown, hidden:boolean) => {
      if (typeof value === 'string' && (!value.trim() || value.trim().toLowerCase()==='none')) return;
      if (hidden && (value == null || (Array.isArray(value) && value.length === 0))) return;
      const match = typeof value === 'string' ? /^([^:]+):\s*([\s\S]+)$/.exec(value.trim()) : null;
      if (!match || !match[2].trim() || !canonicalId(match[1])) { issues.push({dataset:'pokemon_master_list',record,field:hidden?'hidden_ability':'abilities',message:'Invalid ability reference'}); return; }
      const name=match[1].trim(), id=canonicalId(name);
      const group=groups.get(id) ?? {name,descriptions:new Set<string>(),standard:false,hidden:false};
      group.descriptions.add(match[2].trim());
      if(hidden) group.hidden=true; else group.standard=true;
      groups.set(id,group);
    };
    if(Array.isArray(r?.abilities)) r.abilities.forEach(v=>add(v,false));
    else issues.push({dataset:'pokemon_master_list',record,field:'abilities',message:'Expected ability array'});
    add(r?.hidden_ability,true);
  }
  const abilities: ReferencedAbility[] = [...groups].map(([id,g]):ReferencedAbility=>{
    const descriptionVariants=[...g.descriptions].sort();
    return {id,name:g.name,description:descriptionVariants.length===1?descriptionVariants[0]:'Conflicting source descriptions; review required.',descriptionVariants,activation:'unclassified',standard:g.standard,hidden:g.hidden,implementation:{kind:'unsupported',reason:'Combat handler not implemented'},source:{document:'pokemon_master_list.json'}};
  }).sort((a,b)=>a.id.localeCompare(b.id));
  return {abilities,issues,conflicts:abilities.filter(a=>a.descriptionVariants.length>1).map(a=>a.id)};
}
