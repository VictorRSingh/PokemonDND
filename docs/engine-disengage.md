# Phase 5.9.4 — Disengage

Call `disengageBattlePokemon(state, version, actorId)` before moving. It spends the existing action resource and records the actor ID on the current turn. Both grid movement APIs honor this protection; explicit reaction choices against a disengaged mover are rejected. Turn advancement discards the marker and switching removes the outgoing actor's marker. No dice are needed. Older snapshots without the optional marker remain compatible.

Shared initiative retains its existing shared action budget. Disengage protects only the acting Pokémon, not its allies. Confusion-specific action resolution and path-based opportunity triggers remain future refinements. The legacy explicit disengaged argument to the pure candidate query remains supported; execution uses turn state.

Validation: all 13 engine regression suites passed using the supplied data and reconstructed baseline through 5.9.3. Full Next.js application build not run.
