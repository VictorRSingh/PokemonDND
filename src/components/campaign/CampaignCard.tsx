import Link from 'next/link';
import { modeLabel, roles, type CampaignEntry } from '@/lib/campaign-client';
export default function CampaignCard({ entry }: { entry: CampaignEntry }) {
  const {campaign:c, membership:m} = entry;
  return <article className="flex min-w-0 flex-col rounded-xl border border-slate-800 bg-slate-900 p-5">
    <div className="flex items-start justify-between gap-3"><h2 className="break-words text-xl font-bold">{c.name}</h2><span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize">{c.status}</span></div>
    <p className="mt-2 break-words text-sm text-slate-400">{c.description || 'No description yet.'}</p>
    <div className="my-5 flex flex-wrap gap-2">{[c.playMode,c.experienceType,c.dmMode].map(v=><span key={v} className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200">{modeLabel(v)}</span>)}</div>
    <p className="mb-4 text-sm text-slate-400">{roles(m,c.ownerId)} · {c.settings.maxPlayers} trainer capacity</p>
    <Link href={`/campaigns/${c.id}`} className="mt-auto rounded-lg bg-yellow-400 px-4 py-2 text-center font-semibold text-slate-950 hover:bg-yellow-300">Open campaign</Link>
  </article>;
}
