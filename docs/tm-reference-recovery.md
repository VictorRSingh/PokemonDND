# Phase 5.2.6b: TM reference recovery

Five exact malformed tokens are retained as unresolvedTmReferences on their species, excluded from tmIds, and reported by cross-reference validation. No replacement TM numbers are inferred. All other invalid tokens still fail normalization. The original JSON is unchanged.

| Species | Unresolved token |
|---|---|
| Graveler | 8087 |
| Cherrim | 8687 |
| Alolan Sandslash | 566 |
| Toxapex | 109 |
| Mimikyu | 0 |

Expected: 856 species, zero quarantined, five unresolved TM references and two missing moves, 38 ability conflicts. Species strict validation succeeds; cross-reference strict validation fails until remaining findings are resolved or explicitly handled. TM eligibility must use only tmIds, never unresolvedTmReferences. This is not a verification of every other TM entry.
