# Engine regression suite

Run `node scripts/test-engine.mjs` from the project root after installing existing dependencies. This runs four core unit suites and five canonical dataset suites, with strict data validation. `node scripts/test-engine.mjs --core-only` runs only core tests. An optional data-directory argument replaces public/data (relative to project root or absolute).

Each suite runs in an isolated Node process and compiles its TypeScript targets using the existing TypeScript dependency. The runner continues after failures, reports each suite and returns exit code 1 if any suite fails, 0 if all pass, or 2 for invalid CLI arguments. Each child has a two-minute timeout. Add future suites explicitly to the runner. Individual validation scripts remain unchanged.

This does not replace full application type checking (`npx tsc --noEmit`), browser checks, database integration tests or multiplayer tests. Known documented dataset exceptions remain accepted by strict reference validation. The raw dataset audit is not included because its known raw-data issues are intentionally handled by normalization.
