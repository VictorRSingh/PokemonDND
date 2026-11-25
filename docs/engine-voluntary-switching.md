# Phase 5.10.2 — Voluntary switching

Voluntary grid switches accept an explicit release position. With trainer participation enabled, recall is limited to 60 feet and release to 15 feet, inclusive, using the existing battlefield distance metric. Occupied and invalid positions are rejected. Shared arenas do not accept explicit positions. Voluntary switching retains the existing current-slot and round-two-or-later checks and spends one action; forced replacement remains free. Incoming movement and reactions remain unavailable until the next turn. Trainer-independent grid modes retain abstract range handling. Individual initiative uses the outgoing Pokémon's slot rather than a separate trainer action; this is an existing convention. Incoming status initialization and per-Pokémon first-full-turn tracking after replacement are deferred.

Regression: node scripts/test-engine.mjs (13/13 passed). Full application compilation not tested.
