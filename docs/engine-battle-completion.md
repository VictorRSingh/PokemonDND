# Battle extensions

Shared initiative arena switching supports a free fainted replacement and an action-cost voluntary switch after round one. This is conservative: voluntary switching during round one is rejected, grid recall/release and individual initiative switching are unsupported. Incoming movement and reaction are unavailable until the next turn. Recalled Pokémon retain nonvolatile status and sleep. No concentration model exists yet.

Manual damage is a trusted server primitive, not a public command. The caller must authenticate and authorize the operator and persist the returned event atomically with state. The operator ID is not proof of authorization. It does not spend actions or PP or resolve arbitrary moves.

The battle integration suite tests free replacement, first-round rejection, manual damage, stale versions and immutability. Remaining: full status timing/recovery, reaction triggers, ability handlers, grid and individual switching, campaign UI/settings, authorized command dispatch and durable event history. This patch is incremental, not full Phase 5 completion.
