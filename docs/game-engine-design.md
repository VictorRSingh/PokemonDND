# PokémonDND — Game engine design

Phase 5.1 approved decisions, November 24, 2026. The Pokémon in 5th Edition Generations I–VII handbook and accompanying Monster Manual are the baseline; application extensions are not inherited house rules.

## Trainer and Pokémon progression (5.1.1–2)
- Support simple and full trainer creation. Simple trainer capture modifiers and upgrade mechanics remain to be specified.
- Campaign HP growth configurable; Pokémon advancement supports XP and manual DM leveling. Evolution requires player confirmation when eligible. Nature and loyalty configurable. Personal Pokémon editing remains unrestricted; campaign copies are independent and gameplay changes validated.
- Handbook pp. 4–12, 15–16: trainer progression, species progression, proficiency, STAB, moves, evolution and care. Preserve original formulas unless an approved setting explicitly changes them.

## Combat (5.1.3–4)
- Initiative configurable (shared trainer/Pokémon or individual); action economy follows initiative. Support simple arena and tactical grid, configurable trainer participation, campaign active Pokémon default with encounter overrides.
- Original switching and fainting rules; automatic, player-triggered digital and authorized manual dice; configurable opportunity attacks and reactions.
- Original attack and save calculations, type multipliers 0/0.5/1/2, STAB and critical hits. PP configurable; four learned moves with feat exceptions. Recommend strongest valid Move Power but permit selection. Future custom moves; detailed dice and damage logs.
- Handbook pp. 13–16, move list p. 37 onward. Preserve move-specific exceptions.

## Effects (5.1.5)
- Original status conditions, concentration, stacking and recovery grace period. Abilities, hidden abilities, weather and terrain configurable. Mandatory effects automatic, optional effects controlled by player. Future custom abilities. Authorized DM effect overrides with logging.
- Handbook pp. 24, 26, 121 onward. Reusable effect handlers and event triggers; unsupported mechanics explicitly flagged.

## Capture and resources (5.1.6)
- Original capture mechanics. Capture level restrictions, party limits, recovery, inventory, held items, currency/shops, resting/bonding and defeat penalties configurable. Unlimited PC storage. Breeding deferred until adventure systems.
- Handbook pp. 10–12, 19, 28 onward. Separate stored, carried and active Pokémon. No automatic export of campaign captures to personal collections.

## Encounters (5.1.7)
- Wild, trainer, gym, boss/legendary, cooperative raid, PvP and custom encounters. Balance by SR, level and combatant strength; configurable difficulty scaling and environment pools. Manual and generated encounters; rule-based opponent profiles. Original boss modifiers plus future custom mechanics. Configurable XP rewards, equal/participation-weighted/manual allocation; configurable enemy information visibility. Existing permissions govern player-created encounters.
- Handbook pp. 25–27, 132–133. XP table is not a validated encounter balance formula. Tune and test the application-specific generator.
- No required LLM; optional AI storytelling and n8n orchestration cannot bypass gameplay validation.

## Architecture (5.1.8)
- Customizable ruleset presets. Snapshot encounter rules at start. Save after every resolved action. Authorized DM undo of latest action with audit history; detailed events and future replay support. Seedable RNG, unit/integration/manual tests, incremental playable milestones. Explicit unsupported mechanics and authorized manual resolution.
- WebSockets from the beginning of persistent encounters, not polling-first. Transport choice (Socket.IO proposed) pending compatibility review. Authenticate connections and room subscriptions; authorize every action; filter hidden enemy data per recipient. Reconnect from authoritative snapshot and event version. Never trust client-calculated damage or random rolls; manual rolls are explicit authorized inputs.
- Pure TypeScript engine independent of React, Next.js, PostgreSQL and AI. Next API/service validates permissions, resolves commands and commits state/events atomically. Publish updates only after commit; use concurrency/version checks and idempotent action IDs. Persist RNG state or resolved rolls for reproducibility. Undo must restore affected state and record compensating audit events; reject unsafe undo across later dependent actions.
- Solo automated DM only; multiplayer human/assisted/automated. Preserve existing campaign ownership, roles, permissions and independent copies. DM changes at safe turn boundaries. Combat settings apply next encounter; progression settings to future progression; resolve party conflicts before enforcing changed limits.
- Proposed presets: Classic Pokémon 5e, Casual Simulator, Expanded Adventure, Custom. Exact defaults and schema migration policy to be finalized before integration.

## Implementation sequence
1. 5.2: audit, canonical types, normalization, cross-reference validation, registry, regression checks.
2. 5.3: engine types, rulesets, dice. 5.4: stats and modifiers. 5.5: combat state and turns. 5.6: attack/save/critical. 5.7: damage/STAB/type. 5.8: movement/actions. 5.9: effects/abilities. 5.10: PP/switch/faint/victory. 5.11: campaign integration. 5.12: tests.
3. Phase 6: persistent solo playable encounter with WebSocket foundation. Phase 7: multiplayer expansion. Phase 8: DM tools. Phase 9: progression/capture/inventory. Phase 10: adventures. Phase 11: optional AI/n8n. Phase 12: deployment.

First milestone: level-one Charmander versus Bulbasaur, legal moves, initiative, opponent decisions, HP/PP, victory, logs and resume. No unsupported move may silently approximate effects.

## Compatibility and open questions
Keep legacy JSON and personal builder intact during normalization. Verify exact handbook exceptions before coding. Resolve simple trainer progression/capture defaults, preset defaults, transport/deployment topology, imported stat validation, data versioning, undo boundaries and balancing thresholds in their respective implementation phases. This document records requirements, not implemented functionality.
