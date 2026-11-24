# Deterministic random source

The pure engine uses Mulberry32 with an unsigned 32-bit seed. `nextInt(min,max)` is inclusive and uses rejection sampling to avoid modulo bias. `nextFloat()` returns [0,1). `snapshot()` returns a versioned string compatible with EncounterState.rngState; `restoreRandom()` resumes the exact sequence. Store the snapshot only with committed encounter state. A rejected command must not advance committed RNG state. Server-generated seeds and authorization are future integration responsibilities. This generator is not cryptographically secure; do not expose live state to players or use it for tokens. Manual dice and dice expressions are separate milestones.

Run `node scripts/validate-engine-random.mjs` from the project root.
