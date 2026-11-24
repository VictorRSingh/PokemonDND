# Phase 5.2.2 — Canonical data contracts

The engine data contracts are additive and do not replace the existing builder types or JSON. Species IDs identify forms independently of Pokédex numbers. IDs are strings for now; uniqueness and reference integrity will be enforced by the registry. All distances are feet. Numeric constraints (positive dice, valid levels, HP bounds, unique elemental types, etc.) require runtime validation in later phases; TypeScript alone cannot enforce them.

Special hit dice use a rule identifier (e.g. Shedinja), unlimited PP uses a discriminated union, and dynamic move types use a rule identifier. Missing or corrupted fields must produce review issues rather than invented defaults. Move timing, range, duration and descriptions retain textual metadata until executable rules are implemented. A handler identifier is a contract, not proof a handler exists; registry validation must check it. Unsupported mechanics are explicit. Evolution requirements support compound conditions and manual review. Nature modifiers include AC. Individual state excludes temporary combat effects; persistent conditions and other gameplay state will be designed with the encounter and persistence contracts in later phases.

No runtime normalization, rule execution, database migration or legacy data edits are included. Next: species normalization and verified corrections.
