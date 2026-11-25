import { createCampaignEncounter } from '@/engine/core/campaign-rules';
import type { EncounterKind } from '@/engine/core/types';
import { ApiError } from '@/lib/game-api';
import { campaignPermissions, requireCampaignMember } from './campaign-permissions';

/** Server-side factory for Phase 6. Does not persist or expose an encounter endpoint. */
export async function prepareCampaignEncounter(userId:string, campaignId:string, encounterId:string, kind:EncounterKind, seed:number) {
  const access = await requireCampaignMember(userId,campaignId);
  if (!campaignPermissions(access).createEncounter) throw new ApiError(403,'Encounter creation permission required');
  if (access.campaign.status !== 'active') throw new ApiError(409,'Campaign must be active');
  return createCampaignEncounter(access.campaign,encounterId,kind,seed);
}
