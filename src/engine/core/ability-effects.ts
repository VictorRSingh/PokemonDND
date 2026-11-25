import { getProficiencyBonus } from './progression';
import type { GameDataRegistry } from '../data/registry';
import type { AbilityDefinition, DamageType } from '../data/types';
import type { EncounterState, PokemonCombatant, NonvolatileStatus, VolatileStatus } from './types';

export type AbilityHook = 'before-attack' | 'before-damage' | 'after-damage' | 'turn-start' | 'turn-end' | 'switch-in' | 'switch-out' | 'before-status';
export interface AbilityContext {
 readonly hook: AbilityHook;
 readonly state: EncounterState;
 readonly owner: PokemonCombatant;
 readonly counterpart?: PokemonCombatant;
 readonly moveId?: string;
 readonly amount?: number;
 readonly melee?: boolean;
 readonly knockedOut?: boolean;
 readonly damageType?: DamageType;
 readonly status?: NonvolatileStatus | VolatileStatus;
}
export type AbilityEffect = { readonly kind: 'note'; readonly message: string } | { readonly kind: 'manual'; readonly reason: string } | { readonly kind: 'damage-multiplier'; readonly multiplier: 0 | 0.5 } | { readonly kind: 'status-immunity' } | { readonly kind: 'retaliation'; readonly amount: number; readonly damageType: DamageType; readonly roll?: 4; readonly optional?: boolean };
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
const passive = (id: string, statuses: readonly (NonvolatileStatus | VolatileStatus)[], damageTypes: readonly DamageType[] = [], multiplier: 0 | 0.5 = 0): AbilityHandler => ({
 id, hooks: ['before-status', 'before-damage'], execute: context => {
  if (context.hook === 'before-status' && context.status && statuses.includes(context.status)) return [{kind:'status-immunity'}];
  if (context.hook === 'before-damage' && context.damageType && damageTypes.includes(context.damageType)) return [{kind:'damage-multiplier', multiplier}];
  return [];
 }
});
const retaliation = (id: string, damageType: DamageType, optional = false): AbilityHandler => ({
 id, hooks:['after-damage'], execute: c => c.melee && !c.knockedOut ? [{kind:'retaliation',amount:getProficiencyBonus(c.owner.level),damageType,roll:4,optional}] : []
});
export const defaultAbilityEffects = createAbilityEffectRegistry([
 retaliation('static','electric'), retaliation('rough-skin','typeless',true), retaliation('iron-barbs','typeless',true),
 {id:'aftermath',hooks:['after-damage'],execute:c=>c.melee&&c.knockedOut&&c.amount ? [{kind:'retaliation',amount:Math.floor(c.amount/2),damageType:'typeless'}]:[]},
 passive('levitate', [], ['ground']), passive('thick-fat', [], ['fire','ice'], 0.5),
 passive('heatproof', ['burned'], ['fire'], 0.5), passive('water-veil', ['burned']),
 passive('immunity', ['poisoned']), passive('magma-armor', ['frozen']), passive('limber', ['paralyzed']),
 passive('insomnia', ['asleep']), passive('vital-spirit', ['asleep']), passive('own-tempo', ['confused']), passive('inner-focus', ['flinched'])
]);
export function passiveStatusImmune(state: EncounterState, owner: PokemonCombatant, status: NonvolatileStatus | VolatileStatus, data: GameDataRegistry): boolean {
 return evaluateAbility({hook:'before-status',state,owner,status},data).some(effect=>effect.kind==='status-immunity');
}

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
