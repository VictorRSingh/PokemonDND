import { createHash, randomBytes } from 'node:crypto';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { campaigns, campaignMembers, campaignInvitations as invites } from '@/db/schema/campaigns';
import { ApiError } from '@/lib/game-api';
import { requireCampaignMember, campaignPermissions } from './campaign-permissions';
const hash = (code: string) => createHash('sha256').update(code).digest('hex');
const fields = { id: invites.id, createdBy: invites.createdBy, expiresAt: invites.expiresAt, maxUses: invites.maxUses, useCount: invites.useCount, revokedAt: invites.revokedAt, createdAt: invites.createdAt };
export async function listInvitations(userId:string,id:string) {
 const access=await requireCampaignMember(userId,id); const p=campaignPermissions(access);
 if(!p.invite) throw new ApiError(403,'Invitation permission required');
 return db.select(fields).from(invites).where(and(eq(invites.campaignId,id),p.owner||p.dm?undefined:eq(invites.createdBy,userId))).orderBy(desc(invites.createdAt));
}
export async function createInvitation(userId:string,id:string,input:{hours:number;maxUses:number}) {
 return db.transaction(async tx=>{
  await tx.select({id:campaigns.id}).from(campaigns).where(eq(campaigns.id,id)).for('update');
  const access=await requireCampaignMember(userId,id,tx);
  if(!campaignPermissions(access).invite) throw new ApiError(403,'Invitation permission required');
  if(access.campaign.status!=='active'||(access.campaign.startedAt&&!access.campaign.settings.allowLateJoin)) throw new ApiError(409,'Campaign is not accepting invitations');
  const code=randomBytes(32).toString('hex');
  const [invitation]=await tx.insert(invites).values({campaignId:id,createdBy:userId,codeHash:hash(code),expiresAt:new Date(Date.now()+input.hours*3600000),maxUses:input.maxUses}).returning(fields);
  return {invitation,code};
 });
}
export async function revokeInvitation(userId:string,id:string,inviteId:string) {
 return db.transaction(async tx=>{
  await tx.select({id:campaigns.id}).from(campaigns).where(eq(campaigns.id,id)).for('update');
  const p=campaignPermissions(await requireCampaignMember(userId,id,tx));
  if(!p.invite) throw new ApiError(403,'Invitation permission required');
  const [row]=await tx.update(invites).set({revokedAt:new Date()}).where(and(eq(invites.id,inviteId),eq(invites.campaignId,id),p.owner||p.dm?undefined:eq(invites.createdBy,userId))).returning(fields);
  if(!row) throw new ApiError(404,'Invitation not found');
 });
}
export async function joinCampaign(userId:string,code:string) {
 return db.transaction(async tx=>{
  const [hint]=await tx.select({campaignId:invites.campaignId}).from(invites).where(eq(invites.codeHash,hash(code)));
  if(!hint) throw new ApiError(404,'Invitation not found');
  const [campaign]=await tx.select().from(campaigns).where(eq(campaigns.id,hint.campaignId)).for('update');
  if(!campaign) throw new ApiError(404,'Invitation not found');
  const [invite]=await tx.select().from(invites).where(eq(invites.codeHash,hash(code)));
  if(!invite||invite.revokedAt||invite.expiresAt<=new Date()) throw new ApiError(410,'Invitation expired or revoked');
  const [issuer]=await tx.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId,campaign.id),eq(campaignMembers.userId,invite.createdBy ?? ''),eq(campaignMembers.status,'active')));
  if(!issuer || !campaignPermissions({campaign,membership:issuer}).invite) throw new ApiError(410,'Invitation issuer no longer authorized');
  const [existing]=await tx.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId,campaign.id),eq(campaignMembers.userId,userId)));
  if(existing?.status==='active') return {campaignId:campaign.id};
  if(existing?.status==='removed') throw new ApiError(403,'Removed membership requires owner restoration');
  if(invite.useCount>=invite.maxUses) throw new ApiError(410,'Invitation usage limit reached');
  if(campaign.playMode!=='multiplayer'||campaign.status!=='active'||(campaign.startedAt&&!campaign.settings.allowLateJoin)) throw new ApiError(409,'Campaign is not accepting players');
  const members=await tx.select({id:campaignMembers.id}).from(campaignMembers).where(and(eq(campaignMembers.campaignId,campaign.id),eq(campaignMembers.status,'active'),eq(campaignMembers.isPlayer,true)));
  if(members.length>=campaign.settings.maxPlayers) throw new ApiError(409,'Campaign is full');
  if(existing) await tx.update(campaignMembers).set({status:'active',isPlayer:true,isDm:false,leftAt:null,updatedAt:new Date()}).where(eq(campaignMembers.id,existing.id));
  else await tx.insert(campaignMembers).values({campaignId:campaign.id,userId,isPlayer:true,isDm:false});
  await tx.update(invites).set({useCount:sql`${invites.useCount}+1`}).where(eq(invites.id,invite.id));
  return {campaignId:campaign.id};
 });
}
