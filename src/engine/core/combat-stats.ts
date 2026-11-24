import { ABILITY_KEYS, type AbilityKey, type PokemonInstance, type PokemonSpeciesDefinition } from '../data/types';
import { getAbilityModifiers } from './ability-scores';
import { getProficiencyBonus, getStabBonus } from './progression';
import { getLoyaltyModifiers } from './nature-loyalty';
/** Stored scores, AC and HP are authoritative; do not apply nature or loyalty HP twice. */
export function deriveCombatStats(pokemon: PokemonInstance, species: PokemonSpeciesDefinition, loyaltyEnabled = true) {
  if (pokemon.speciesId !== species.id) throw new Error('Species mismatch');
  const {armorClass,maximumHP,currentHP} = pokemon;
  if (![armorClass,maximumHP,currentHP].every(Number.isSafeInteger) || armorClass<1 || maximumHP<1 || currentHP<0 || currentHP>maximumHP) throw new RangeError('Invalid stored combat stats');
  const modifiers = getAbilityModifiers(pokemon.abilityScores), proficiency = getProficiencyBonus(pokemon.level);
  const loyalty = getLoyaltyModifiers(pokemon.level,pokemon.loyalty??0,loyaltyEnabled);
  const savingThrows = Object.fromEntries(ABILITY_KEYS.map(k=>[k,modifiers[k]+(species.savingThrows.includes(k)?proficiency:0)+loyalty.savingThrowBonus])) as Record<AbilityKey,number>;
  return Object.freeze({modifiers,proficiency,stab:getStabBonus(pokemon.level),initiativeModifier:modifiers.dex,armorClass,maximumHP,currentHP,savingThrows:Object.freeze(savingThrows),loyalty});
}
