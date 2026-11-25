# Phase 5.12 — Engine readiness

Run `node scripts/test-engine.mjs` from the repository root. The existing 13 suites include the new campaign replay checks in `validate-engine-battle.mjs`.

## Acceptance coverage
- Create an active campaign-linked encounter with a captured ruleset and register two opposing Pokémon.
- Start initiative and execute Tackle, advance turns, and reach a victory using public commands in automatic, digital and manual modes.
- Reject stale versions and repeated actions; preserve prior state and increment versions on attacks.
- Compare every serialized state across repeated runs with identical seed and inputs; verify a different automatic seed changes the trace.
- Repeat with a JSON round trip after every recorded transition; compare the full trace with uninterrupted execution.
- Verify campaign linkage, completed turn/reaction cleanup and rejection of further turn advancement.

## Phase 6.1 scope
Build a DM-facing campaign encounter prototype using the campaign encounter factory and public engine commands. Start with arena combat, supported moves, initiative, HP/PP, turn advancement and outcome display. Keep unsupported mechanics explicit; do not silently substitute rules. Use server-side membership and authorization checks before exposing commands, and version checks when persisting state. JSON round-trip testing is not a persistence or untrusted-state validation API.

## Remaining limitations
The engine is not a complete implementation of every Pokémon 5e rule. Move and ability automation is partial; weather, terrain, concentration and move/item buffs are not fully modeled. Per-Pokémon first-full-turn switching eligibility remains outstanding. The new replay scenarios disable abilities and use Tackle to isolate the core loop; separate existing tests cover representative ability, status, reaction and switching behavior. Database persistence, authorization integration, multiplayer synchronization and full Next.js compilation are not validated by these engine suites. Two known unavailable move references remain in the dataset. No production code or dependencies change in this validation patch.
