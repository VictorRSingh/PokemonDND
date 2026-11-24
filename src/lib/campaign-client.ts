import type { campaigns, campaignMembers } from '@/db/schema/campaigns';
import { request } from './game-client';
type Serialized<T> = { [K in keyof T]: T[K] extends Date | null ? string | Extract<T[K], null> : T[K] };
export type CampaignEntry = { campaign: Serialized<typeof campaigns.$inferSelect>; membership: Serialized<typeof campaignMembers.$inferSelect> };
export type Member = { id: string; userId: string; name: string | null; image: string | null; isDm: boolean; isPlayer: boolean; status: string; joinedAt: string };
export const listCampaigns = () => request<CampaignEntry[]>('/api/campaigns');
export const getCampaign = (id: string) => request<CampaignEntry>(`/api/campaigns/${encodeURIComponent(id)}`);
export const listMembers = (id: string) => request<Member[]>(`/api/campaigns/${encodeURIComponent(id)}/members`);
export const modeLabel = (mode: string) => (({solo:'Single-player', multiplayer:'Multiplayer', encounter:'Encounter simulator', adventure:'Full adventure', automated:'Automated DM', human:'Human DM', assisted:'Assisted DM'} as Record<string,string>)[mode] || mode);
export function roles(member: {userId:string; isDm:boolean; isPlayer:boolean}, ownerId:string) {
  return [member.userId === ownerId && 'Owner', member.isDm && 'DM', member.isPlayer && 'Trainer'].filter(Boolean).join(' · ') || 'Member';
}
