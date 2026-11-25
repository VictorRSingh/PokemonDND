# Phase 5.11.3 — Triggered abilities

Static, Rough Skin and Iron Barbs use a d4 on melee hits; Aftermath retaliates on melee knockout. Retaliation is resolved before victory detection and does not recursively trigger another retaliation. Static uses electric type effectiveness; other retaliation is typeless. Damage is rounded down. The three d4 abilities are restricted to surviving defenders for this initial implementation; knockout timing can be refined later.

Manual mode requires `manualAbility` (1–4) for a triggered d4. Automatic/digital mode uses encounter RNG. `declineAbility` opts out of Rough Skin or Iron Barbs; default is to attempt the optional roll. Opportunity attacks accept the same fields. Attack results expose `abilityEvents` with ability ID, roll and damage. Aftermath uses the resolved damage amount before HP clamping. Unsupported abilities remain manual. No dependencies or migrations.
