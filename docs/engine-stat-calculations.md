# Phase 5.4 stat calculations

Reference: Pokémon 5e seventh edition, pages 11–13 and 15–16. Proficiency and STAB follow the level tables. Move Power recommends the highest allowed modifier (ties use first listed); explicit selections are supported. Dynamic or absent Move Power must be resolved by the caller. STAB is a potential bonus; the move executor must enforce its once-per-move limit.

HP growth supports rolled, manual, fixed average (rounded up), and maximum die results. Minimum gain of one is a 5e convention adopted here. Special hit dice require explicit handling. Constitution adjustment uses the supplied level as the number of affected levels; callers must account for base-level stat blocks and avoid counting a newly rolled level twice. Evolution bonus is twice level. No historical HP is reconstructed.

Nature application expects unadjusted scores and AC. Derived stats instead expect stored effective scores, AC and HP; nature and loyalty HP are not applied again. Loyalty returns nonstacking bonuses and obedience thresholds, but does not choose skills or enforce obedience. Persistent progression and encounter integration remain future work.

Run `node scripts/test-engine.mjs` and `npx tsc --noEmit`.
