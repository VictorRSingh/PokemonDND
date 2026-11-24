import { canonicalId, normalizePokemonDataset } from './normalize/pokemon';
import { normalizeMoveDataset } from './normalize/moves';
import { normalizeAbilityDataset } from './normalize/abilities';
import { normalizeNatureDataset } from './normalize/natures';
import { validateGameReferences } from './validate-references';
import { unavailableMoves } from './unavailable-moves';
import type { ElementalType, PokemonSpeciesDefinition } from './types';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function index<T extends {readonly id:string}>(items: readonly T[]) {
  const map = new Map<string,T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate registry ID: ${item.id}`);
    map.set(item.id,item);
  }
  return map;
}
/** Construct once per dataset version; no I/O or mutable global state. */
export function createGameDataRegistry(rawSpecies: readonly unknown[], rawMoves: readonly unknown[], rawNatures: readonly unknown[]) {
  const validation = freeze(validateGameReferences(rawSpecies,rawMoves,rawNatures));
  if (validation.normalizationIssues.length || validation.referenceIssues.length || validation.abilityConflicts.length) throw new Error('Game data failed strict validation');
  const species = freeze(normalizePokemonDataset(rawSpecies).species);
  const moves = freeze(normalizeMoveDataset(rawMoves).moves);
  const abilities = freeze(normalizeAbilityDataset(rawSpecies).abilities);
  const natures = freeze(normalizeNatureDataset(rawNatures).natures);
  const unavailable = freeze(unavailableMoves.map(x=>({...x})));
  const s=index(species), m=index(moves), a=index(abilities), n=index(natures), u=index(unavailable);
  const getSpecies=(id:string)=>s.get(canonicalId(id));
  const getMove=(id:string)=>m.get(canonicalId(id));
  const getAbility=(id:string)=>a.get(canonicalId(id));
  const getNature=(id:string)=>n.get(canonicalId(id));
  const requireSpecies=(id:string)=>{const found=getSpecies(id); if(!found) throw new Error(`Unknown species: ${id}`); return found;};
  const getEvolutionTargets=(id:string)=>freeze(requireSpecies(id).evolutions.map(e=>requireSpecies(e.targetSpeciesId)));
  const getEvolutionChain=(id:string)=>{
    const visited=new Set<string>(); const result:PokemonSpeciesDefinition[]=[];
    const walk=(x:PokemonSpeciesDefinition)=>{if(visited.has(x.id))return;visited.add(x.id);result.push(x);for(const e of x.evolutions)walk(requireSpecies(e.targetSpeciesId));};
    walk(requireSpecies(id)); return freeze(result);
  };
  return Object.freeze({validation,species,moves,abilities,natures,unavailableMoves:unavailable,getSpecies,getMove,getAbility,getNature,
    getUnavailableMove:(id:string)=>u.get(canonicalId(id)),
    getSpeciesByNumber:(number:number)=>freeze(species.filter(x=>x.number===number)),
    getSpeciesByType:(type:ElementalType)=>freeze(species.filter(x=>x.types.includes(type))),
    filterSpecies:(filter:{minRating?:number;maxRating?:number;maxBaseLevel?:number}={})=>freeze(species.filter(x=>x.speciesRating>=(filter.minRating??0)&&x.speciesRating<=(filter.maxRating??Infinity)&&x.baseLevel<=(filter.maxBaseLevel??Infinity))),
    getLearnableMoves:(id:string,level:number)=>{
      if(!Number.isInteger(level)||level<1||level>20)throw new RangeError('Level must be 1–20');
      return freeze(requireSpecies(id).learnset.filter(x=>x.minimumLevel<=level).map(entry=>{const move=m.get(entry.moveId);return move?{kind:'defined' as const,entry,move}:{kind:'unavailable' as const,entry,move:u.get(entry.moveId)!};}));
    },getEvolutionTargets,getEvolutionChain,
    getSpeciesAbility:(speciesId:string,abilityId:string)=>{
      const x=requireSpecies(speciesId), ability=getAbility(abilityId);
      if(!ability||(!x.abilityIds.includes(ability.id)&&x.hiddenAbilityId!==ability.id))return undefined;
      return freeze({...ability,description:ability.speciesDescriptions?.[x.id]??ability.description});
    }
  });
}
export type GameDataRegistry = ReturnType<typeof createGameDataRegistry>;
