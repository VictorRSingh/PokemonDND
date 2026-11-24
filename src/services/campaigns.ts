import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { campaigns, campaignMembers, campaignInvitations } from "@/db/schema/campaigns";
import { ApiError } from "@/lib/game-api";
import type { createCampaignInput, updateCampaignInput } from "@/lib/campaign-validation";

import { requireCampaignMember, requireCampaignOwner } from "./campaign-permissions";

type CreateInput = z.output<typeof createCampaignInput>;
type UpdateInput = z.output<typeof updateCampaignInput>;

export async function listCampaigns(userId: string) {
  return db.select({ campaign: campaigns, membership: campaignMembers })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaignMembers.campaignId, campaigns.id))
    .where(and(eq(campaignMembers.userId, userId), eq(campaignMembers.status, "active")))
    .orderBy(desc(campaigns.updatedAt));
}

export async function getCampaign(userId: string, id: string) {
  const [result] = await db.select({ campaign: campaigns, membership: campaignMembers })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaignMembers.campaignId, campaigns.id))
    .where(and(eq(campaigns.id, id), eq(campaignMembers.userId, userId), eq(campaignMembers.status, "active")))
    .limit(1);
  if (!result) throw new ApiError(404, "Campaign not found");
  return result;
}

export async function createCampaign(userId: string, input: CreateInput) {
  return db.transaction(async tx => {
    const [campaign] = await tx.insert(campaigns).values({
      ownerId: userId, name: input.name, description: input.description,
      playMode: input.playMode, experienceType: input.experienceType,
      dmMode: input.dmMode, settings: input.settings,
    }).returning();
    const [membership] = await tx.insert(campaignMembers).values({
      campaignId: campaign.id, userId,
      isDm: input.dmMode !== "automated", isPlayer: input.ownerIsPlayer,
    }).returning();
    return { campaign, membership };
  });
}

export async function updateCampaign(userId: string, id: string, input: UpdateInput) {
  return db.transaction(async tx => {
    await tx.select({id: campaigns.id}).from(campaigns).where(eq(campaigns.id,id)).for("update");
    const access = await requireCampaignMember(userId,id,tx);
    requireCampaignOwner(access);
    const {campaign, membership} = access;
    const {ownerIsPlayer, settings: changes, ...fields} = input;
    const settings = {...campaign.settings, ...changes};
    const dmMode = fields.dmMode ?? campaign.dmMode;
    const isPlayer = ownerIsPlayer ?? membership.isPlayer;
    const isDm = dmMode !== "automated";
    const members = await tx.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId,id),eq(campaignMembers.status,"active")));
    if (campaign.playMode === "solo" && (dmMode !== "automated" || settings.maxPlayers !== 1)) throw new ApiError(400,"Solo campaigns require automated DM and one player");
    if (campaign.playMode === "multiplayer" && settings.maxPlayers < 2) throw new ApiError(400,"Multiplayer requires at least two trainer slots");
    if (!isDm && (!isPlayer || settings.characterImportPolicy === "dm_approval")) throw new ApiError(400,"Automated campaigns require a playing owner and cannot require DM approval");
    if (!isDm && members.some(m=>m.id!==membership.id && m.isDm)) throw new ApiError(409,"Revoke other DM roles before switching to automated DM");
    if (members.filter(m=>m.id!==membership.id && m.isPlayer).length + Number(isPlayer) > settings.maxPlayers) throw new ApiError(409,"Player capacity exceeded");
    const now = new Date();
    await tx.update(campaignMembers).set({isDm,isPlayer,updatedAt:now}).where(eq(campaignMembers.id,membership.id));
    if (!settings.allowPlayerInvites) {
      const creators = members.filter(m=>m.userId!==userId && !m.isDm).map(m=>m.userId);
      if (creators.length) await tx.update(campaignInvitations).set({revokedAt:now}).where(and(eq(campaignInvitations.campaignId,id),inArray(campaignInvitations.createdBy,creators),isNull(campaignInvitations.revokedAt)));
    }
    const [updated] = await tx.update(campaigns).set({...fields,dmMode,settings,updatedAt:now}).where(eq(campaigns.id,id)).returning();
    return updated;
  });
}

export async function deleteCampaign(userId: string, id: string) {
  const [deleted] = await db.delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.ownerId, userId)))
    .returning({ id: campaigns.id });
  if (!deleted) throw new ApiError(404, "Campaign not found or not owned by you");
}
