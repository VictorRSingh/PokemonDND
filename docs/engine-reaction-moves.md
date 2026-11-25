# Phase 5.9.6 — Expanded reaction moves

Opportunity attacks require a supported melee move with a timing of 1 action. Struggle is permitted in its melee mode. Added Pound, Peck, Wing Attack and Cut using the canonical move damage progression. These moves are also available for ordinary actions. Pokémon reach is derived from species size (5 feet through Large, 10 feet for Huge/Gargantuan); contradictory supplied reach is rejected. Trainer reach remains caller-supplied and trainer reaction execution is not implemented. Unsupported moves with additional effects remain manual. The path API retains its existing arguments and now accepts movePower and manualSleep on reaction choices.

Validation: all 13 engine regression suites passed against the uploaded data. Full application compilation was not run. Baseline reconstructed from prior uploaded patches.
