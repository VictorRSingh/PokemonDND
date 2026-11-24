import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { campaigns, campaignMembers } from "@/db/schema/campaigns";
import { ApiError } from "@/lib/game-api";
import type { createCampaignInput, updateCampaignInput } from "@/lib/campaign-validation";

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
  const [campaign] = await db.update(campaigns).set({ ...input, updatedAt: new Date() })
    .where(and(eq(campaigns.id, id), eq(campaigns.ownerId, userId))).returning();
  if (!campaign) throw new ApiError(404, "Campaign not found or not owned by you");
  return campaign;
}

export async function deleteCampaign(userId: string, id: string) {
  const [deleted] = await db.delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.ownerId, userId)))
    .returning({ id: campaigns.id });
  if (!deleted) throw new ApiError(404, "Campaign not found or not owned by you");
}
