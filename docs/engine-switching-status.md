# Phase 5.10.3 — Switching status lifecycle

Recall retains nonvolatile conditions and sleep, clears confusion/flinch and transient action flags. Recalled Pokémon are excluded from status ticks and duration processing. A Pokémon released into the current slot is marked in optional `turn.releasedIds`; it skips end-of-turn status processing for that partial turn. The next full turn uses the existing initialization (burn and paralysis) and end processing (poison, recovery, duration and grace). The marker resets when a new turn is constructed. Existing saved states without the marker remain readable.

The partial-turn policy is an implementation convention consistent with the existing movement/reaction restriction on release. Concentration and move/item buffs are not modeled yet. Full per-Pokémon first-turn switching eligibility is not changed. Baseline reconstructed from uploaded source and patches through 5.10.2.

Regression: recall persistence, confusion/flinch cleanup, stale flags, partial turn suspension, full-turn resumption and recalled HP/duration stability. All 13 engine suites passed.
