import { createRulesetSnapshot, restoreRulesetSnapshot } from './rules';
import { createEncounter } from './encounter';
import type { EncounterKind, EncounterState, RulesetSnapshot } from './types';

/** Structural subset of persisted campaign settings; no database dependency. */
export interface CampaignBattleSettings {
  readonly defaultActivePokemonLimit: number;
  readonly battleRules?: RulesetSnapshot;
}

/** Existing campaigns use classic rules. The campaign's active limit is authoritative. */
export function resolveCampaignRules(settings: CampaignBattleSettings): RulesetSnapshot {
  if (!settings || typeof settings !== 'object') throw new Error('Invalid campaign settings');
  const base = settings.battleRules === undefined ? createRulesetSnapshot() : restoreRulesetSnapshot(settings.battleRules);
  return restoreRulesetSnapshot({...base, activePokemonLimit: settings.defaultActivePokemonLimit});
}

/** Capture rules at encounter creation; later campaign edits cannot change an ongoing battle. */
export function createCampaignEncounter(campaign: {readonly id:string; readonly status:string; readonly settings:CampaignBattleSettings}, id:string, kind:EncounterKind, seed:number): EncounterState {
  if (typeof campaign.id !== 'string' || !campaign.id.trim()) throw new Error('Invalid campaign identifier');
  if (campaign.status !== 'active') throw new Error('Campaign must be active');
  return Object.freeze({...createEncounter(id,kind,resolveCampaignRules(campaign.settings),seed),campaignId:campaign.id});
}
