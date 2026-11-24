/** Canonical data contracts; independent of the legacy UI and persistence. */
export const ELEMENTAL_TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'] as const;
export type ElementalType = typeof ELEMENTAL_TYPES[number];
export type DamageType = ElementalType | 'typeless';
export const ABILITY_KEYS = ['str','dex','con','int','wis','cha'] as const;
export type AbilityKey = typeof ABILITY_KEYS[number];
export type AbilityScores = Readonly<Record<AbilityKey, number>>;
export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
export type MovementMode = 'walking' | 'swimming' | 'flying' | 'climbing' | 'burrowing' | 'hovering';
export type MovementSpeed = Readonly<Partial<Record<MovementMode, number>>>;
export type SpeciesId = string;
export type MoveId = string;
export type AbilityId = string;
export type NatureId = string;
export interface DiceExpression { readonly count: number; readonly sides: number; readonly modifier: number }
export type HitDie = { readonly kind: 'die'; readonly sides: number } | { readonly kind: 'special'; readonly ruleId: string };
export type PowerPoints = { readonly kind: 'limited'; readonly maximum: number } | { readonly kind: 'unlimited' };
export type MoveTyping = { readonly kind: 'fixed'; readonly type: DamageType } | { readonly kind: 'dynamic'; readonly ruleId: string };
/** Metadata never implies an executable implementation exists. */
export type Implementation = { readonly kind: 'unsupported'; readonly reason: string } | { readonly kind: 'handler'; readonly handlerId: string };
export interface SourceReference { readonly document: string; readonly page?: number; readonly originalText?: string }
export type EvolutionRequirement =
  | { readonly kind: 'level'; readonly minimum: number }
  | { readonly kind: 'loyalty'; readonly minimum: number }
  | { readonly kind: 'item'; readonly itemId: string }
  | { readonly kind: 'all' | 'any'; readonly requirements: readonly EvolutionRequirement[] }
  | { readonly kind: 'manual'; readonly description: string };
export interface EvolutionDefinition { readonly targetSpeciesId: SpeciesId; readonly requirement: EvolutionRequirement; readonly abilityScorePoints: number; readonly description: string }
export interface LearnsetEntry { readonly moveId: MoveId; readonly minimumLevel: number }
export interface PokemonSpeciesDefinition {
  readonly id: SpeciesId; readonly number: number; readonly name: string; readonly form?: string;
  readonly size: CreatureSize; readonly types: readonly [ElementalType, ...ElementalType[]];
  readonly baseLevel: number; readonly speciesRating: number; readonly armorClass: number; readonly baseHP: number;
  readonly hitDie: HitDie; readonly speed: MovementSpeed; readonly abilityScores: AbilityScores;
  readonly proficientSkills: readonly string[]; readonly savingThrows: readonly AbilityKey[];
  readonly resistances: readonly ElementalType[]; readonly vulnerabilities: readonly ElementalType[]; readonly immunities: readonly ElementalType[];
  readonly senses: readonly string[]; readonly abilityIds: readonly AbilityId[]; readonly hiddenAbilityId?: AbilityId;
  readonly learnset: readonly LearnsetEntry[]; readonly tmIds: readonly string[]; readonly evolutions: readonly EvolutionDefinition[];
  readonly source?: SourceReference;
}
export interface MoveDefinition {
  readonly id: MoveId; readonly name: string; readonly typing: MoveTyping; readonly movePower: readonly AbilityKey[];
  readonly pp: PowerPoints; readonly timing: string; readonly range: string; readonly duration: string;
  readonly description: string; readonly higherLevels?: string; readonly implementation: Implementation; readonly source?: SourceReference;
}
export interface AbilityDefinition { readonly id: AbilityId; readonly name: string; readonly description: string; readonly implementation: Implementation; readonly source?: SourceReference }
export interface NatureDefinition { readonly id: NatureId; readonly name: string; readonly abilityScoreModifiers: Readonly<Partial<Record<AbilityKey, number>>>; readonly armorClassModifier: number }
export type LearnedMove = { readonly moveId: MoveId; readonly pp: { readonly kind: 'limited'; readonly remaining: number } | { readonly kind: 'unlimited' } };
/** Persistent individual state, not encounter-specific effects or position. */
export interface PokemonInstance {
  readonly id: string; readonly speciesId: SpeciesId; readonly nickname?: string; readonly level: number; readonly xp: number;
  readonly abilityScores: AbilityScores; readonly armorClass: number; readonly maximumHP: number; readonly currentHP: number;
  readonly abilityId?: AbilityId; readonly natureId?: NatureId; readonly loyalty?: number; readonly heldItemId?: string;
  readonly learnedMoves: readonly LearnedMove[];
}
/** Invalid raw records stay outside the canonical registry until reviewed. */
export interface DataIssue { readonly dataset: string; readonly record: string; readonly field: string; readonly message: string }
export type NormalizationResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly issues: readonly DataIssue[] };
