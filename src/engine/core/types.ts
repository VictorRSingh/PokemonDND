import type { AbilityKey, AbilityScores, DamageType, DiceExpression, MovementSpeed, PokemonInstance, MoveId } from '../data/types';

export type CombatantId = string;
export type EncounterId = string;
export type EncounterKind = 'wild' | 'trainer' | 'gym' | 'boss' | 'raid' | 'pvp' | 'custom';
export type RollMode = 'automatic' | 'digital' | 'manual';
export type RollCondition = 'normal' | 'advantage' | 'disadvantage';
export interface DiceResult {
  readonly expression: DiceExpression;
  readonly rolls: readonly number[];
  readonly total: number;
  readonly mode: RollMode;
}
export interface RulesetSnapshot {
  readonly version: 1;
  readonly initiative: 'shared' | 'individual';
  readonly battlefield: 'arena' | 'grid';
  readonly trainerParticipation: boolean;
  readonly activePokemonLimit: number;
  readonly rollMode: RollMode;
  readonly opportunityAttacks: boolean;
  readonly reactions: boolean;
  readonly trackPP: boolean;
  readonly abilities: boolean;
  readonly hiddenAbilities: boolean;
  readonly weather: boolean;
  readonly terrain: boolean;
}
export interface Position { readonly x: number; readonly y: number; readonly elevation: number }
export type NonvolatileStatus = 'poisoned' | 'frozen' | 'burned' | 'paralyzed';
export type VolatileStatus = 'asleep' | 'confused' | 'flinched';
export interface StatusEffect<T extends string> {
  readonly kind: T;
  readonly sourceId?: CombatantId;
  readonly appliedRound: number;
  readonly remainingRounds?: number;
}
interface CombatantBase {
  readonly modifiers?: readonly {kind: "growl" | "leer" | "tail-whip"; expiresRound: number}[];
  readonly dodging?: boolean;
  readonly helped?: boolean;
  readonly id: CombatantId;
  readonly sideId: string;
  readonly name: string;
  readonly level: number;
  readonly abilityScores: AbilityScores;
  readonly armorClass: number;
  readonly maximumHP: number;
  readonly currentHP: number;
  readonly temporaryHP: number;
  readonly speed: MovementSpeed;
  readonly position?: Position;
}
export interface TrainerCombatant extends CombatantBase { readonly kind: 'trainer'; readonly campaignCharacterId?: string; readonly potions?: number }
export interface PokemonCombatant extends CombatantBase {
  readonly kind: 'pokemon';
  readonly pokemon: PokemonInstance;
  readonly trainerId?: CombatantId;
  readonly deployment: 'active' | 'recalled';
  readonly nonvolatile?: StatusEffect<NonvolatileStatus>;
  readonly paralysisBlocked?: boolean;
  readonly actionForfeited?: boolean;
  readonly statusGrace?: Readonly<Partial<Record<NonvolatileStatus | VolatileStatus, number>>>;
  readonly volatile: readonly StatusEffect<VolatileStatus>[];
}
export type Combatant = TrainerCombatant | PokemonCombatant;
/** A shared slot can contain a trainer and multiple active Pokémon. */
export interface InitiativeSlot { readonly id: string; readonly combatantIds: readonly CombatantId[]; readonly initiative: number }
export interface TurnResources { readonly actionAvailable: boolean; readonly bonusActionAvailable: boolean }
export interface TurnState {
  readonly round: number;
  readonly slotIndex: number;
  readonly resources: TurnResources;
  /** Pokémon released after this turn started; status ticks begin on their next full turn. */
  readonly releasedIds?: readonly CombatantId[];
  readonly disengagedIds?: readonly CombatantId[];
  readonly movementRemaining: Readonly<Record<CombatantId, number>>;
}
export type BattleResult = { readonly kind: "victory"; readonly winner: string } | { readonly kind: "draw" | "terminated"; readonly winner: null };
export interface EncounterState {
  readonly campaignId?: string;
  readonly result?: BattleResult;
  readonly id: EncounterId;
  readonly kind: EncounterKind;
  readonly status: 'setup' | 'active' | 'paused' | 'completed';
  readonly version: number;
  readonly rules: RulesetSnapshot;
  readonly combatants: readonly Combatant[];
  readonly initiative: readonly InitiativeSlot[];
  readonly turn?: TurnState;
  readonly reactionAvailable: Readonly<Record<CombatantId, boolean>>;
  readonly rngState: string;
}
interface CommandBase { readonly id: string; readonly encounterId: EncounterId; readonly expectedVersion: number; readonly actorId: CombatantId }
export type CombatCommand = CommandBase & (
  | { readonly kind: 'use-move'; readonly moveId: MoveId; readonly targetIds: readonly CombatantId[]; readonly movePower?: AbilityKey }
  | { readonly kind: 'move'; readonly destination: Position }
  | { readonly kind: 'switch'; readonly outgoingId: CombatantId; readonly incomingId: CombatantId }
  | { readonly kind: 'end-turn' }
);
interface EventBase { readonly id: string; readonly commandId: string; readonly sequence: number }
export type CombatEvent = EventBase & (
  | { readonly kind: 'roll'; readonly actorId: CombatantId; readonly result: DiceResult }
  | { readonly kind: 'damage'; readonly targetId: CombatantId; readonly amount: number; readonly damageType: DamageType }
  | { readonly kind: 'healing'; readonly targetId: CombatantId; readonly amount: number }
  | { readonly kind: 'turn-ended'; readonly slotId: string }
  | { readonly kind: 'manual-resolution-required'; readonly reason: string }
);
export type CommandResult =
  | { readonly ok: true; readonly state: EncounterState; readonly events: readonly CombatEvent[] }
  | { readonly ok: false; readonly code: 'invalid-command' | 'stale-version' | 'unsupported' | 'invalid-state'; readonly message: string };
