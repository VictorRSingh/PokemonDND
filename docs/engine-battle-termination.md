# Phase 5.10.4 — Battle termination

Completed encounters persist a result: victory (winning side ID), draw (no surviving Pokémon sides), or terminated (explicit completion while multiple sides remain). Completion removes the turn and disables reactions. Existing completed snapshots without a result remain readable. Healthy recalled Pokémon continue to count toward their side, even if immediate release is unavailable; the DM may explicitly terminate a stalled encounter. Trainers do not independently count toward victory. Draw detection evaluates the complete state after a damage batch, not a new simultaneous-action API.

Regression: node scripts/test-engine.mjs — 13/13 passed. Full application compilation is left to the local project.
