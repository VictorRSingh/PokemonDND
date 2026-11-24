import Link from "next/link";
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { requireSession } from '@/lib/require-session';
import { listCampaigns, type CampaignEntry } from '@/lib/campaign-client';
import CampaignCard from '@/components/campaign/CampaignCard';
export const getServerSideProps = requireSession;
export default function CampaignsPage() {
  const [entries,setEntries]=useState<CampaignEntry[] | null>(null);
  const [error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  const [search,setSearch]=useState('');
  const [mode,setMode]=useState('all');
  useEffect(()=>{let active=true; listCampaigns().then(data=>{if(active)setEntries(data)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load campaigns')}); return ()=>{active=false};},[retry]);
  const visible=(entries||[]).filter(({campaign:c})=>(mode==='all'||c.playMode===mode)&&`${c.name} ${c.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
    <Head><title>Campaigns | PokemonDND</title></Head>
    <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Trainer headquarters</p><h1 className="mt-2 text-4xl font-bold">Your campaigns</h1><p className="mt-2 text-slate-400">Explore your saved adventures and battle sessions.</p>
    <Link href="/campaigns/create" className="mt-5 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-slate-950">+ Create campaign</Link>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{[{label:'Campaigns',count:entries?.length},{label:'Single-player',count:entries?.filter(e=>e.campaign.playMode==='solo').length},{label:'Multiplayer',count:entries?.filter(e=>e.campaign.playMode==='multiplayer').length}].map(s=><div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{s.label}</p><p className="mt-2 text-3xl font-bold text-yellow-400">{s.count??'—'}</p></div>)}</div>
    <div className="my-6 flex flex-wrap gap-3"><input aria-label="Search campaigns" placeholder="Search campaigns…" value={search} onChange={e=>setSearch(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"/><select aria-label="Filter play mode" value={mode} onChange={e=>setMode(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"><option value="all">All modes</option><option value="solo">Single-player</option><option value="multiplayer">Multiplayer</option></select></div>
    {error?<div role="alert" className="rounded-xl border border-red-900 p-5">{error} <button className="ml-3 underline" onClick={()=>{setError('');setEntries(null);setRetry(v=>v+1)}}>Retry</button></div>:!entries?<p role="status">Loading campaigns…</p>:!entries.length?<div className="rounded-xl border border-dashed border-slate-700 p-10 text-center"><h2 className="text-xl font-bold">No campaigns yet</h2><p className="mt-2 text-slate-400">Create your first campaign to get started.</p></div>:!visible.length?<p>No matching campaigns.</p>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(e=><CampaignCard key={e.campaign.id} entry={e}/>)}</div>}
  </div>;
}
