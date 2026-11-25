# Movement path and opportunity attacks (5.9.5)

`moveWithOpportunity` accepts an optional final `path` argument: ordered positions excluding the starting position and including the destination. Each step is five feet in Chebyshev distance, at unchanged elevation. Occupied active combatant positions are rejected. Without a path, only a single five-foot step is accepted. Validate the entire path and movement budget before resolving reactions. Reactions occur at the first eligible exit, before moving; movement stops on fainting and only completed steps consume movement. One reaction per chosen actor; simultaneous choices use supplied order. The encounter version advances once for the command.

Limitations: reach is still caller-supplied, supported reaction moves remain Scratch/Tackle, no terrain or vertical traversal, and the separate `moveOnGrid` endpoint API is unchanged. Trainer opportunity attack execution is not supported. No database changes.

Regression: `node scripts/test-engine.mjs` passed 13/13 suites, including intermediate exit, lethal interruption, invalid paths and existing disengage tests.
