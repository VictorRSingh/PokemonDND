import { ABILITY_KEYS } from '../types';
import type { AbilityKey, NatureDefinition, NormalizationResult, DataIssue } from '../types';
import { canonicalId } from './pokemon';
export function normalizeNature(raw:unknown):NormalizationResult<NatureDefinition> {
  const r=raw as Record<string,unknown>|null;
  const record=String(r?.name??'unknown');
  const fail=(message:string):NormalizationResult<NatureDefinition>=>({ok:false,issues:[{dataset:'nature_list',record,field:'stats',message}]});
  if(typeof r?.name!=='string'||!canonicalId(r.name)||!r.stats||typeof r.stats!=='object'||Array.isArray(r.stats))return fail('Invalid nature');
  const modifiers:Partial<Record<AbilityKey,number>>={}; let armorClassModifier=0;
  for(const [key,value] of Object.entries(r.stats)) {
    if(key==='armor_class'&&value===1)armorClassModifier=1;
    else if((ABILITY_KEYS as readonly string[]).includes(key)&&(value===2||value===-2))modifiers[key as AbilityKey]=value;
    else return fail('Invalid modifier: '+key);
  }
  const values=Object.values(modifiers);
  if(values.filter(v=>v===-2).length!==1||values.filter(v=>v===2).length+armorClassModifier!==1)return fail('Expected one benefit and one penalty');
  return {ok:true,value:{id:canonicalId(r.name),name:r.name.trim(),abilityScoreModifiers:modifiers,armorClassModifier}};
}
export function normalizeNatureDataset(raw:readonly unknown[]) {
  const natures:NatureDefinition[]=[];const issues:DataIssue[]=[];const ids=new Set<string>();
  for(const entry of raw){const result=normalizeNature(entry);if(!result.ok){issues.push(...result.issues);continue;}const n=result.value;if(ids.has(n.id)){issues.push({dataset:'nature_list',record:n.name,field:'name',message:'Duplicate nature identifier'});continue;}ids.add(n.id);natures.push(n);}
  return {natures,issues};
}
