import { normalizePokemonDataset } from './normalize/pokemon';
import { normalizeMoveDataset } from './normalize/moves';
import { normalizeAbilityDataset } from './normalize/abilities';
import { normalizeNatureDataset } from './normalize/natures';
import type { DataIssue } from './types';
export function validateGameReferences(rawSpecies: readonly unknown[], rawMoves: readonly unknown[], rawNatures: readonly unknown[]) {
  const p=normalizePokemonDataset(rawSpecies), m=normalizeMoveDataset(rawMoves), a=normalizeAbilityDataset(rawSpecies), n=normalizeNatureDataset(rawNatures);
  const issues: DataIssue[]=[...p.issues,...m.issues,...a.issues,...n.issues];
  const species=new Set(p.species.map(x=>x.id)), moves=new Set(m.moves.map(x=>x.id)), abilities=new Set(a.abilities.map(x=>x.id));
  const references: DataIssue[]=[];
  for(const x of p.species) {
    const check=(field:string,id:string,ids:Set<string>)=>{if(!ids.has(id))references.push({dataset:'pokemon_master_list',record:x.name,field,message:'Unresolved reference: '+id});};
    for(const token of x.unresolvedTmReferences ?? []) references.push({dataset:'pokemon_master_list',record:x.name,field:'tm',message:'Unresolved source TM: '+token});
    for(const l of x.learnset)check('learnset',l.moveId,moves);
    for(const id of x.abilityIds)check('abilities',id,abilities);
    if(x.hiddenAbilityId)check('hidden_ability',x.hiddenAbilityId,abilities);
    for(const e of x.evolutions)check('evolution',e.targetSpeciesId,species);
  }
  return {species:p.species.length,moves:m.moves.length,abilities:a.abilities.length,natures:n.natures.length,normalizationIssues:issues,referenceIssues:references,abilityConflicts:a.conflicts};
}
