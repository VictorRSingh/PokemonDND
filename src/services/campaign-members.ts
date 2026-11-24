import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignMembers } from "@/db/schema/campaigns";
import { users } from "@/db/schema/auth";
import { ApiError } from "@/lib/game-api";
import { requireCampaignMember, requireCampaignOwner } from "./campaign-permissions";

export async function listCampaignMembers(userId: string, campaignId: string) {
  await requireCampaignMember(userId, campaignId);
  return db.select({ id: campaignMembers.id, userId: campaignMembers.userId,
    name: users.name, image: users.image, isDm: campaignMembers.isDm,
    isPlayer: campaignMembers.isPlayer, status: campaignMembers.status, joinedAt: campaignMembers.joinedAt })
    .from(campaignMembers).innerJoin(users, eq(users.id, campaignMembers.userId))
    .where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.status, "active")))
    .orderBy(asc(campaignMembers.joinedAt));
}

export async function changeCampaignMember(userId: string, campaignId: string, memberId: string,
  patch: { isDm?: boolean; isPlayer?: boolean } | null) {
  return db.transaction(async tx => {
    // Serialize membership mutations on the campaign row. Future invitation and settings services must use the same lock.
    await tx.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.id, campaignId)).for("update");
    const access = await requireCampaignMember(userId, campaignId, tx);
    requireCampaignOwner(access);
    const { campaign } = access;
    const [target] = await tx.select().from(campaignMembers).where(and(eq(campaignMembers.id, memberId),
      eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.status, "active"))).limit(1);
    if (!target) throw new ApiError(404, "Member not found");
    if (target.userId === campaign.ownerId) throw new ApiError(409, "Owner membership cannot be changed here");
    const members = await tx.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.status, "active")));
    const next = patch === null ? null : { ...target, ...patch };
    if (next && !next.isDm && !next.isPlayer) throw new ApiError(400, "Member must be a DM or player");
    if (next?.isDm && campaign.dmMode === "automated") throw new ApiError(400, "Automated campaigns cannot assign human DMs");
    const remaining = members.filter(m => m.id !== memberId);
    if (next) remaining.push(next);
    if (remaining.filter(m => m.isPlayer).length > campaign.settings.maxPlayers) throw new ApiError(409, "Player capacity exceeded");
    if (campaign.dmMode !== "automated" && !remaining.some(m => m.isDm)) throw new ApiError(409, "Campaign requires a DM");
    const now = new Date();
    const [updated] = await tx.update(campaignMembers).set(patch === null
      ? { status: "removed", leftAt: now, isDm: false, isPlayer: false, updatedAt: now }
      : { ...patch, updatedAt: now }).where(eq(campaignMembers.id, target.id)).returning();
    return updated;
  });
}
