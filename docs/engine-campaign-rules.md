# Campaign rules integration

Existing campaign settings resolve to classic rules with the persisted defaultActivePokemonLimit. An optional version-1 battleRules snapshot can be stored in the existing settings JSONB field through campaign create/update validation. The existing active limit field takes precedence over the snapshot's limit. No migration is needed.

Use prepareCampaignEncounter(userId, campaignId, encounterId, kind, seed) on the server after authentication. It checks active membership, encounter creation permission and active campaign status. The pure createCampaignEncounter factory captures an immutable rules snapshot and campaign ID. Later campaign edits affect new encounters only. Existing standalone encounters remain compatible.

Phase 6 must supply the encounter persistence, endpoint, authenticated actor authorization, UI and seed generation. The service is not an endpoint and does not persist state. Difficulty and weather/terrain automation are not implemented here. The existing campaign admin UI exposes the active limit; editing the full rules snapshot through UI is deferred. Engine tests exercise the pure factory and rule enforcement; database service and Zod integration require application-level testing with installed dependencies.
