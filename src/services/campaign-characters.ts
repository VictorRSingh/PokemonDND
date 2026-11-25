import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { campaigns, campaignCharacters, campaignPokemon } from '@/db/schema/campaigns';
import { characters, pokemon } from '@/db/schema/game';
import { ApiError } from '@/lib/game-api';
import { requireCampaignMember } from './campaign-permissions';

type Input = { mode: 'new'; name: string } | { mode: 'import'; sourceCharacterId: string };
export async function getCampaignCharacter(userId: string, id: string) {
  return db.transaction(async tx => {
    await tx.select({id: campaigns.id}).from(campaigns).where(eq(campaigns.id,id)).for('share');
    const {membership} = await requireCampaignMember(userId,id,tx);
    if (!membership.isPlayer) throw new ApiError(403,'Trainer permission required');
    const [character] = await tx.select().from(campaignCharacters).where(eq(campaignCharacters.memberId,membership.id));
    return character ? {character, pokemon: await tx.select().from(campaignPokemon).where(eq(campaignPokemon.characterId,character.id))} : null;
  });
}
export async function createCampaignCharacter(userId: string, id: string, input: Input) {
  return db.transaction(async tx => {
    await tx.select({id: campaigns.id}).from(campaigns).where(eq(campaigns.id,id)).for('update');
    const {campaign,membership} = await requireCampaignMember(userId,id,tx);
    if (!membership.isPlayer) throw new ApiError(403,'Trainer permission required');
    if (campaign.status !== 'active') throw new ApiError(409,'Campaign is not active');
    const [existing] = await tx.select({id:campaignCharacters.id}).from(campaignCharacters).where(eq(campaignCharacters.memberId,membership.id));
    if (existing) throw new ApiError(409,'Campaign trainer already exists');
    if (input.mode === 'new') {
      const [character] = await tx.insert(campaignCharacters).values({memberId:membership.id,name:input.name}).returning();
      return {character,pokemon:[]};
    }
    if (campaign.settings.characterImportPolicy !== 'unrestricted') throw new ApiError(403,'Character import is not available under this campaign policy');
    const [source] = await tx.select().from(characters).where(and(eq(characters.id,input.sourceCharacterId),eq(characters.userId,userId))).for('share');
    if (!source) throw new ApiError(404,'Personal character not found');
    const roster = await tx.select().from(pokemon).where(eq(pokemon.characterId,source.id));
    const [character] = await tx.insert(campaignCharacters).values({memberId:membership.id,name:source.name,sourceCharacterId:source.id}).returning();
    const copied = roster.length ? await tx.insert(campaignPokemon).values(roster.map(p=>({characterId:character.id,name:p.name,number:p.number,data:p.data}))).returning() : [];
    return {character,pokemon:copied};
  });
}

/** Read only active player rosters, restricted to campaign owner/DM. */
export async function listBattleRoster(userId:string,id:string) {
  const access=await requireCampaignMember(userId,id);
  const {campaignPermissions}=await import('./campaign-permissions');
  const permissions=campaignPermissions(access);
  if(!permissions.owner&&!permissions.dm)throw new ApiError(403,'DM permission required');
  const {campaignMembers}=await import('@/db/schema/campaigns');
  return db.select({id:campaignPokemon.id,trainerId:campaignCharacters.id,trainerName:campaignCharacters.name,name:campaignPokemon.name,number:campaignPokemon.number,data:campaignPokemon.data})
    .from(campaignPokemon).innerJoin(campaignCharacters,eq(campaignPokemon.characterId,campaignCharacters.id))
    .innerJoin(campaignMembers,eq(campaignCharacters.memberId,campaignMembers.id))
    .where(and(eq(campaignMembers.campaignId,id),eq(campaignMembers.status,'active'),eq(campaignMembers.isPlayer,true)));
}
