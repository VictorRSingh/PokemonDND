# Final strict cross-reference validation

Strict validation fails on normalization issues, unexpected reference issues or unresolved ability conflicts. The five exact species-ID/TM-token pairs previously quarantined are reported separately as `documentedTmReferences`; they are not usable TM IDs. The two known unavailable moves remain in `unavailableMoveReferences`, matched by species, move and level. No raw data is changed. The validation script also checks that an unknown learnset reference and a malformed TM on another species are rejected. This is data validation, not combat execution validation; egg moves and TM-to-move mappings remain outside its scope.

Run `node scripts/validate-game-references.mjs --strict` from the project root. Baseline: 856 species, 673 moves, 235 abilities, 20 natures, zero unexpected issues, five documented TM references, two unavailable move references. Exit 0.
