# Ability scores and modifiers

Reuse the canonical six ability keys and score record. `getAbilityModifier` applies the standard 5e floor((score - 10) / 2) calculation. The Pokémon 5e handbook's Battling section uses ability modifiers for Move Power, attack, damage and saving throw DCs.

`validateAbilityScore` requires positive safe integers; `validateAbilityScores` requires exactly six own enumerable score fields. `getAbilityModifiers` returns a frozen independent record. No score cap is imposed by this primitive: progression caps, nature adjustments and special effects belong in later rules. Zero scores are rejected here; special effects that reduce scores to zero need explicit handling in the future.

Run `node scripts/validate-engine-ability-scores.mjs` or `node scripts/test-engine.mjs`. No database or UI changes.
