import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignMembers } from "@/db/schema/campaigns";
import { ApiError } from "@/lib/game-api";

type Reader = Pick<typeof db, "select">;
export async function requireCampaignMember(userId: string, campaignId: string, reader: Reader = db) {
  const [result] = await reader.select({ campaign: campaigns, membership: campaignMembers })
    .from(campaignMembers).innerJoin(campaigns, eq(campaignMembers.campaignId, campaigns.id))
    .where(and(eq(campaigns.id, campaignId), eq(campaignMembers.userId, userId), eq(campaignMembers.status, "active"))).limit(1);
  if (!result) throw new ApiError(404, "Campaign not found");
  return result;
}
export type CampaignAccess = Awaited<ReturnType<typeof requireCampaignMember>>;
export function campaignPermissions({ campaign, membership }: CampaignAccess) {
  const owner = campaign.ownerId === membership.userId;
  const dm = membership.isDm && campaign.dmMode !== "automated";
  const player = membership.isPlayer;
  return { owner, dm, player, manageMembers: owner,
    invite: campaign.playMode === "multiplayer" && (owner || dm || (player && campaign.settings.allowPlayerInvites)),
    createEncounter: owner || dm || (player && campaign.settings.allowPlayerEncounterCreation) };
}
export function requireCampaignOwner(access: CampaignAccess) {
  if (!campaignPermissions(access).owner) throw new ApiError(403, "Campaign owner permission required");
}
