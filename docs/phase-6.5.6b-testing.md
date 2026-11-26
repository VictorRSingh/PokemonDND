# Phase 6.5.6b — Environmental regression testing
Requires Phase 6.5.6 and 6.5.6a, Node.js and installed project dependencies.

Run `node scripts/validate-engine-environment.mjs` for the 34 deterministic scenarios or `node scripts/test-engine.mjs` for all 14 suites. Both accept an optional data directory. No database or browser required.

Validated: all 14 suites passed on the uploaded source with both prior patches applied. No production engine changes were needed. Electric/Psychic/Dragon damage modifiers and sleep/poison prevention are tested through engine helpers because the current move dispatcher does not implement those moves. Ember burn prevention is tested through the actual move dispatcher. Snow has no additional mechanical effect in this version.

UI smoke tests (not automated):
1. Save weather and terrain flags in campaign administration, refresh and confirm persistence. Check creation controls if creating a new campaign.
2. Start a new encounter; apply weather and terrain in DM controls.
3. End a turn in sandstorm or Grassy Terrain and inspect the combat log.
4. Paint a hazard, export/import the map, and check the tile survives.
5. Inspect UI layout and run `npm run build` locally.
