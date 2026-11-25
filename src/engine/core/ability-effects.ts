import type { GameDataRegistry } from '../data/registry';
import type { AbilityDefinition } from '../data/types';
import type { EncounterState, PokemonCombatant } from './types';

export type AbilityHook = 'before-attack' | 'before-damage' | 'after-damage' | 'turn-start' | 'turn-end' | 'switch-in' | 'switch-out';
export interface AbilityContext {
 readonly hook: AbilityHook;
 readonly state: EncounterState;
 readonly owner: PokemonCombatant;
 readonly counterpart?: PokemonCombatant;
 readonly moveId?: string;
 readonly amount?: number;
}
export type AbilityEffect = { readonly kind: 'note'; readonly message: string } | { readonly kind: 'manual'; readonly reason: string };
export interface AbilityHandler {
 readonly id: string;
 readonly hooks: readonly AbilityHook[];
 readonly execute: (context: AbilityContext, definition: AbilityDefinition) => readonly AbilityEffect[];
}
/** Registry is immutable; handlers must be pure and return effects rather than mutate state. */
export function createAbilityEffectRegistry(handlers: readonly AbilityHandler[] = []) {
 const entries = new Map<string, AbilityHandler>();
 for (const handler of handlers) {
  if (!handler.id || entries.has(handler.id)) throw new Error(`Invalid or duplicate ability handler: ${handler.id}`);
  entries.set(handler.id, Object.freeze({...handler, hooks: Object.freeze([...handler.hooks])}));
 }
 return Object.freeze({get: (id: string) => entries.get(id), ids: Object.freeze([...entries.keys()])});
}
export type AbilityEffectRegistry = ReturnType<typeof createAbilityEffectRegistry>;
export const defaultAbilityEffects = createAbilityEffectRegistry();
export function evaluateAbility(context: AbilityContext, data: GameDataRegistry, effects: AbilityEffectRegistry = defaultAbilityEffects): readonly AbilityEffect[] {
 const {state, owner} = context;
 const id = owner.pokemon.abilityId;
 if (!state.rules.abilities || !id || owner.currentHP <= 0 || owner.deployment !== 'active') return Object.freeze([]);
 const species = data.getSpecies(owner.pokemon.speciesId);
 if (!species) return Object.freeze([{kind:'manual', reason:'Unknown ability owner species'}]);
 if (species.hiddenAbilityId === id && !species.abilityIds.includes(id) && !state.rules.hiddenAbilities) return Object.freeze([]);
 const definition = data.getSpeciesAbility(species.id,id);
 const handler = effects.get(id);
 if (!definition || !handler) return Object.freeze([{kind:'manual',reason:`Unsupported ability: ${id}`}]);
 if (!handler.hooks.includes(context.hook)) return Object.freeze([]);
 return Object.freeze(handler.execute(context,definition).map(effect=>Object.freeze({...effect})));
}
