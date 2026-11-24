# Engine dice

`parseDiceExpression` accepts a single NdS expression with an optional signed integer modifier; omitted count means one. `formatDiceExpression` produces canonical notation. `rollDice` uses an injected random source; `recordManualRoll` validates individual supplied faces without consuming RNG state. Both return immutable DiceResult objects with copied expression and rolls. Totals are not clamped. Limits: 1–1000 dice, 2–1000000 sides, safe integer totals. These are application resource limits. Mixed dice pools, advantage, critical hits, authorization of manual rolls and combat-specific modifiers are separate mechanics. Digital and automatic rolls use the same RNG; mode is metadata only.

Run `node scripts/validate-engine-dice.mjs` from project root.
