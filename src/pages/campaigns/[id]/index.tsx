import {resolveCampaignRules} from '@/engine/core/campaign-rules';
import {request} from '@/lib/game-client';
import CampaignAdmin from '@/components/campaign/CampaignAdmin';
import CampaignCharacter from '@/components/campaign/CampaignCharacter';
import Invitations from '@/components/campaign/Invitations';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { requireSession } from '@/lib/require-session';
import { getCampaign,listMembers,modeLabel,roles,type CampaignEntry,type Member } from '@/lib/campaign-client';
export const getServerSideProps=requireSession;
export default function CampaignOverview(){
 const router=useRouter(); const id=typeof router.query.id==='string'?router.query.id:'';
 return <CampaignDetails key={id} id={id}/>;
}
function CampaignDetails({id}:{id:string}){
 const [data,setData]=useState<{entry:CampaignEntry;members:Member[]}|null>(null); const [error,setError]=useState(''); const [retry,setRetry]=useState(0);
 useEffect(()=>{if(!id)return;let active=true;Promise.all([getCampaign(id),listMembers(id)]).then(([entry,members])=>{if(active)setData({entry,members})}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load campaign')});return()=>{active=false};},[id,retry]);
 const router=useRouter();
 const [leaving,setLeaving]=useState(false);const [leaveError,setLeaveError]=useState('');
 async function leave(){if(leaving||!window.confirm('Leave this campaign? Your trainer and Pokémon will be preserved.'))return;setLeaving(true);setLeaveError('');try{await request(`/api/campaigns/${id}/leave`,'DELETE');await router.push('/campaigns');}catch(e){setLeaveError(e instanceof Error?e.message:'Unable to leave');}finally{setLeaving(false);}}
 const c=data?.entry.campaign;
 return <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-8"><Head><title>{c?`${c.name} | PokemonDND`:'Campaign | PokemonDND'}</title></Head><Link href="/campaigns" className="text-sm font-semibold text-yellow-400 hover:underline">← All campaigns</Link>
 {error?<div role="alert" className="mt-6 rounded-xl border border-red-900 p-5">{error} <button className="ml-3 underline" onClick={()=>{setError('');setData(null);setRetry(v=>v+1)}}>Retry</button></div>:!data||!c?<p className="mt-6" role="status">Loading campaign…</p>:<><header className="mt-5 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-10"><p className="text-xs font-bold tracking-widest text-yellow-400">CAMPAIGN HEADQUARTERS</p><h1 className="mt-5 break-words text-4xl font-bold">{c.name}</h1><p className="mt-2 break-words text-slate-400">{c.description||'No description yet.'}</p><p className="mt-3 text-sm text-yellow-400">{roles(data.entry.membership,c.ownerId)} · <span className="capitalize">{c.status}</span></p><div className="mt-5 flex flex-wrap items-center gap-4"><span className="rounded-lg bg-slate-800 px-4 py-3">{data.members.filter(m=>m.status==='active'&&m.isPlayer).length} active trainers</span>{c.status==='active'&&(c.ownerId===data.entry.membership.userId||(data.entry.membership.isDm&&c.dmMode!=='automated'))&&<Link className="rounded-lg bg-yellow-400 px-5 py-3 font-bold text-slate-950" href={`/campaigns/${id}/battle`}>Start encounter →</Link>}</div></header><nav className="mt-5 flex flex-wrap gap-4 text-sm text-yellow-400"><a href="#party">Party</a><a href="#settings">Settings</a><a href="#encounters">Encounters</a></nav>
 <div className="mt-8 grid gap-4 sm:grid-cols-3">{[c.playMode,c.experienceType,c.dmMode].map(v=><div key={v} className="rounded-xl border border-slate-800 bg-slate-900 p-5 font-semibold">{modeLabel(v)}</div>)}</div>
 <div className="mt-8 grid gap-6 lg:grid-cols-2"><section id="party" className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-bold">Party members</h2><p className="mt-1 text-sm text-slate-400">{data.members.filter(m=>m.status==='active'&&m.isPlayer).length} / {c.settings.maxPlayers} trainers</p><ul className="mt-4 divide-y divide-slate-800">{data.members.filter(m=>m.status==='active').map(m=><li key={m.id} className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-yellow-400">{(m.name||'Trainer').slice(0,1).toUpperCase()}</span><div className="min-w-0"><p className="break-words font-semibold">{m.name||'Trainer'}</p><p className="text-sm text-slate-400">{roles(m,c.ownerId)}</p></div></li>)}</ul></section>
 <section id="settings" className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-bold">Campaign settings</h2><dl className="mt-4 space-y-3">{[['Weather',resolveCampaignRules(c.settings).weather?'Enabled':'Disabled'],['Terrain effects',resolveCampaignRules(c.settings).terrain?'Enabled':'Disabled'],['Difficulty',c.settings.difficulty],['Active Pokémon per trainer',c.settings.defaultActivePokemonLimit],['Late joining',c.settings.allowLateJoin?'Allowed':'Disabled'],['Player invitations',c.settings.allowPlayerInvites?'Allowed':'Disabled'],['Player encounter creation',c.settings.allowPlayerEncounterCreation?'Allowed':'Disabled'],['Character import',c.settings.characterImportPolicy.replace(/_/g,' ')],['Disconnected players',c.settings.disconnectedPlayerPolicy],['Grace period',`${c.settings.disconnectTimeoutSeconds} seconds`]].map(([label,value])=><div key={label} className="flex justify-between gap-4 border-b border-slate-800 pb-2 text-sm"><dt className="text-slate-400">{label}</dt><dd className="text-right capitalize">{value}</dd></div>)}</dl></section></div>
 {c.ownerId!==data.entry.membership.userId&&<div className="mt-6"><button disabled={leaving} className="rounded border border-red-800 px-4 py-2 text-red-400" onClick={()=>void leave()}>Leave campaign</button>{leaveError&&<p role="alert">{leaveError}</p>}</div>}
 {c.ownerId===data.entry.membership.userId&&<CampaignAdmin key={`${id}:${retry}`} entry={data.entry} members={data.members} onRefresh={()=>{setData(null);setError('');setRetry(v=>v+1)}}/>}
 {c.playMode==='multiplayer'&&(c.ownerId===data.entry.membership.userId||(data.entry.membership.isDm&&c.dmMode!=='automated')||(data.entry.membership.isPlayer&&c.settings.allowPlayerInvites))&&<Invitations id={id}/>}
 {data.entry.membership.isPlayer&&<CampaignCharacter id={id} policy={c.settings.characterImportPolicy} active={c.status==='active'}/>}
 <section id="encounters" className="mt-6 rounded-xl border border-dashed border-slate-700 p-6"><h2 className="text-lg font-bold">Campaign gameplay</h2><p className="mt-2 text-slate-400">Launch a local DM-controlled battle prototype.</p>{c.status==='active'&&(c.ownerId===data.entry.membership.userId||(data.entry.membership.isDm&&c.dmMode!=='automated'))&&<Link className="btn btn-primary mt-4" href={`/campaigns/${id}/battle`}>Launch battle prototype</Link>}</section></>}
 </div>;
}
