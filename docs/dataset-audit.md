# Phase 5.2.1 — Dataset audit

Inputs: uploaded `data.zip` and `phase-5-source.zip` (November 24, 2026). The source helper fetches `/data/pokemon_master_list.json` and `/data/move_list.json`; the script assumes Next.js `public/data` by default, with an optional directory argument. No original data modified.

## Reproduce

```powershell
node scripts/audit-game-data.mjs
node scripts/audit-game-data.mjs --json
node scripts/audit-game-data.mjs --strict
```

Default mode reports findings without failing; strict exits 1 on review findings (including legitimate exceptions); unreadable or invalid input exits 2. This is a structural audit, not full rulebook verification.

## Baseline

- species: 856
- moves: 673
- natures: 20
- legacy: 856
- numbers: 856
- mixedSize: 740
- stringPP: 673
- sharedNumberGroups: 17

## Review findings

- `name-invalid-or-duplicate`: 1
- `unmatched-move`: 20
- `invalid-hit-die`: 2
- `unknown-type`: 6
- `missing-elemental-type`: 1
- `unknown-move-type`: 5
- `invalid-pp`: 1

| Check | Record | Detail |
|---|---|---|
| name-invalid-or-duplicate | numbers | form: 2 |
| unmatched-move | Paras | 18: XScissor |
| unmatched-move | Parasect | 18: XScissor |
| unmatched-move | Arcanine | 14: Extreme "Speed" |
| unmatched-move | Tentacruel | starting_moves: Reflect "Type" |
| unmatched-move | Staryu | 14: Reflect "Type" |
| unmatched-move | Mew | starting_moves: Reflect "Type" |
| invalid-hit-die | Shedinja | d0 |
| unmatched-move | Latias | starting_moves: Reflect "Type" |
| unmatched-move | Rayquaza | starting_moves: Extreme "Speed" |
| unmatched-move | Lopunny | starting_moves: Baby- Doll Eyes |
| unmatched-move | Lucario | 18: Extreme "Speed" |
| unmatched-move | Togekiss | starting_moves: Extreme "Speed" |
| unmatched-move | Arceus | starting_moves: Extreme "Speed" |
| unmatched-move | Sylveon | starting_moves: Baby- Doll Eyes |
| invalid-hit-die | Alolan Muk | null |
| unknown-type | "Type": Null | "\"" |
| unknown-type | "Type": Null | "Evolution\": " |
| unknown-type | "Type": Null | "Null can evolve into " |
| unknown-type | "Type": Null | "Silvally at level 16 and above if its " |
| unknown-type | "Type": Null | "Loyalty is +2 or higher. " |
| unknown-type | "Type": Null | "When it evolves, its health increases by double its level, and it gains 11 points to add to its ability scores (max 20)." |
| missing-elemental-type | "Type": Null | ["\"","Evolution\": ","Null can evolve into ","Silvally at level 16 and above if its ","Loyalty is +2 or higher. ","When it evolves, its health increases by double its level, and it gains 11 points to add to its ability scores (max 20)."] |
| unmatched-move | Tapu Koko | starting_moves: Nature’s Madness |
| unmatched-move | Tapu Lele | starting_moves: Nature’s Madness |
| unmatched-move | Tapu Bulu | starting_moves: Nature’s Madness |
| unmatched-move | Tapu Fini | starting_moves: Nature’s Madness |
| unmatched-move | Pheromosa | 18: "Speed" Swap |
| unmatched-move | Blacephalon | 18: Mind Blown |
| unmatched-move | Zeraora | 18: Plasma Fists |
| unknown-move-type | Curse | 1d6 ghost damage at the end of each of its turns for the duration. If you are any other You place a curse on yourself. For the duration, your STR and CON scores increase by 2, but your DEX score decreases by 4. |
| unknown-move-type | Judgment | Varies |
| unknown-move-type | Multi-Attack | Varies |
| unknown-move-type | Natural Gift | Varies |
| invalid-pp | Struggle | Unlimited |
| unknown-move-type | Struggle | Typeless |

## Shared numbers

Shared numbers can represent alternate forms; do not deduplicate by number. Use stable species/form IDs.

- 103: Exeggutor, Alolan Exeggutor
- 105: Marowak, Alolan Marowak
- 351: Castform, Sunny Castform, Rainy Castform, Snowy Castform
- 413: Wormadam Plant Cloak, Wormadam Sand Cloak, Wormadam Trash Cloak
- 479: Rotom, Rotom Heat, Rotom Wash, Rotom Frost, Rotom Fan, Rotom Mow
- 487: Giratina Altered Forme, Giratina Origin Forme
- 492: Shaymin Land, Shaymin Sky
- 646: Kyurem, White Kyurem, Black Kyurem
- 648: Meloetta - Aria, Meloetta - Pirouette
- 678: Meowstic ♂, Meowstic ♀
- 718: Zygarde 10% Forme, Zygarde 50% Forme, Forme
- 720: Hoopa Confined, Hoopa Unbound
- 741: Oricorio Baile Style, Oricorio Pom-Pom Style, Oricorio Pa'u Style, Oricorio Sensu Style
- 745: Lycanroc Midday Form, Lycanroc Midnight Form, Lycanroc Dusk Form
- 746: Wishiwashi Solo Form, Wishiwashi School Form
- 774: Minior Meteor Form, Minior Core Form
- 800: Necrozma, Dusk Mane Necrozma, Dawn Wings Necrozma, Ultra Necrozma

## Interpretation and next steps

- Size tokens appear in 740 master entries; separate size from elemental types. Missing size must not be invented.
- All 673 PP fields are strings. Struggle's unlimited PP, variable move types and Shedinja's d0 may be legitimate special cases; model explicitly after handbook verification, not as ordinary numeric values.
- Type: Null, Curse and Alolan Muk require source verification. Duplicate `Form` number-map entries and incomplete form names require manual review. Do not silently repair them.
- Six spelling/format variants among unmatched moves are candidates for explicit aliases; Mind Blown and Plasma Fists have no matching definition by trimmed case-insensitive name. Verify against handbook before adding.
- Existing helper's proficiency threshold starts +3 at level 3 rather than handbook level 5; fix in engine calculations, not this audit patch.
- Phase 5.2.2 defines canonical types, followed by normalization, explicit exceptions, cross-reference checks and compatibility tests. Move prose remains descriptive until a verified executable handler exists.
- Audit does not yet validate all evolution chains, move effects, abilities, TM mappings, or correctness against PDFs. Counts are for uploaded snapshot, not a live checkout.
