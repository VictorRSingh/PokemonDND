# Phase 5.9.3 — Frozen recovery

Frozen recovery is an end-of-turn Strength saving throw (Pokémon 5e Frozen rule), DC 10 + source proficiency. The target adds its Strength modifier and proficiency if its species lists STR saves. Flinch and sleep disadvantage are included; caller-provided roll sources may cancel disadvantage or grant advantage. Manual mode accepts a single face or an array of two faces when required. Automatic/digital modes reject manual faces.

Call `advanceBattleTurn(state, version, actorId, statusRolls, registry)` when frozen recovery is required. The fifth argument is optional for other turns; missing species data fails explicitly rather than silently dropping proficiency. Roll sources are trusted engine inputs, not yet an authorized client API. Out-of-combat thawing is outside this patch.

Baseline reconstructed from the supplied source and patches through 5.9.2 (reported commit e0466d0). Engine regression: 13/13 suites passed. Full application typecheck not run.
