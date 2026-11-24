import {useState} from 'react';
import {useRouter} from 'next/router';
import {request} from '@/lib/game-client';
import type {CampaignEntry,Member} from '@/lib/campaign-client';
import type {CampaignSettings} from '@/db/schema/campaigns';
const field='w-full rounded-md border border-slate-700 bg-slate-950 p-2';
export default function CampaignAdmin({entry,members,onRefresh}:{entry:CampaignEntry;members:Member[];onRefresh:()=>void}){
 const c=entry.campaign;
 const router=useRouter();
 const [confirmName,setConfirmName]=useState('');
 async function removeCampaign(){
  if(busy||confirmName!==c.name)return;
  setBusy(true);setError('');
  try{await request(`/api/campaigns/${c.id}`,'DELETE');await router.replace('/campaigns');}
  catch(e){setError(e instanceof Error?e.message:'Unable to delete campaign');setBusy(false);}
 }
 const [name,setName]=useState(c.name),[description,setDescription]=useState(c.description),[dmMode,setDmMode]=useState(c.dmMode),[ownerIsPlayer,setOwnerIsPlayer]=useState(entry.membership.isPlayer),[settings,setSettings]=useState(c.settings),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function change<K extends keyof CampaignSettings>(key:K,value:CampaignSettings[K]){setSettings(s=>({...s,[key]:value}));}
 async function run(action:()=>Promise<unknown>){setBusy(true);setError('');try{await action();onRefresh();}catch(e){setError(e instanceof Error?e.message:'Request failed');}finally{setBusy(false);}}
 const path=`/api/campaigns/${c.id}`;
 function select<K extends keyof CampaignSettings>(key:K,label:string,options:CampaignSettings[K][]){return <label className="block">{label}<select className={field} value={String(settings[key])} onChange={e=>change(key,e.target.value as CampaignSettings[K])}>{options.map(v=><option key={String(v)} value={String(v)}>{String(v).replace(/_/g,' ')}</option>)}</select></label>}
 function number(key:'maxPlayers'|'defaultActivePokemonLimit'|'disconnectTimeoutSeconds',label:string,min:number,max:number){return <label className="block">{label}<input className={field} type="number" min={min} max={max} required value={settings[key]} onChange={e=>change(key,Number(e.target.value))}/></label>}
 return <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-bold">Campaign administration</h2>{error&&<p role="alert" className="my-3 text-red-400">{error}</p>}
 <form className="mt-4 space-y-4" onSubmit={e=>{e.preventDefault();void run(()=>request(path,'PATCH',{name,description,dmMode,ownerIsPlayer,settings}));}}><fieldset disabled={busy} className="space-y-4">
 <label className="block">Name<input className={field} required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label className="block">Description<textarea className={field} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 {c.playMode==='multiplayer'&&<><label className="block">DM mode<select className={field} value={dmMode} onChange={e=>{const v=e.target.value as typeof dmMode;setDmMode(v);if(v==='automated'){setOwnerIsPlayer(true);if(settings.characterImportPolicy==='dm_approval')change('characterImportPolicy','unrestricted');}}}><option value="automated">Automated</option><option value="human">Human</option><option value="assisted">Assisted</option></select></label><label><input type="checkbox" checked={ownerIsPlayer} disabled={dmMode==='automated'} onChange={e=>setOwnerIsPlayer(e.target.checked)}/> Owner participates as trainer</label>{number('maxPlayers','Maximum trainers',2,10)}</>}
 {select('difficulty','Difficulty',['easy','normal','hard','custom'])}{number('defaultActivePokemonLimit','Active Pokémon per trainer',1,6)}{select('characterImportPolicy','Character import policy',dmMode==='automated'?['unrestricted','fresh_start','restricted']:['unrestricted','fresh_start','restricted','dm_approval'])}
 {c.playMode==='multiplayer'&&<>{(['allowLateJoin','allowPlayerInvites','allowPlayerEncounterCreation'] as const).map((k,i)=><label className="block" key={k}><input type="checkbox" checked={settings[k]} onChange={e=>change(k,e.target.checked)}/> {['Allow late joining','Allow player invitations','Allow player encounter creation'][i]}</label>)}{select('disconnectedPlayerPolicy','Disconnected players',['pause','skip','automated'])}{number('disconnectTimeoutSeconds','Disconnect grace period (seconds)',15,180)}</>}
 <button className="rounded-md bg-yellow-400 px-4 py-2 font-semibold text-slate-950" type="submit">Save settings</button></fieldset></form>
 <h3 className="mt-8 font-bold">Manage members</h3><p className="text-sm text-slate-400">Role changes preserve existing trainers. Save or discard settings edits before changing roles.</p>{members.filter(m=>m.userId!==c.ownerId&&m.status==='active').map(m=><div key={m.id} className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3"><span className="mr-auto">{m.name||'Trainer'}</span><button disabled={busy||c.dmMode==='automated'} className="rounded border border-slate-600 p-2 disabled:opacity-50" onClick={()=>void run(()=>request(`${path}/members/${m.id}`,'PATCH',{isDm:!m.isDm}))}>{m.isDm?'Revoke DM':'Grant DM'}</button><button disabled={busy} className="rounded border border-slate-600 p-2" onClick={()=>void run(()=>request(`${path}/members/${m.id}`,'PATCH',{isPlayer:!m.isPlayer}))}>{m.isPlayer?'Revoke trainer':'Grant trainer'}</button><button disabled={busy} className="text-red-400" onClick={()=>{if(window.confirm(`Remove ${m.name||'this member'}?`))void run(()=>request(`${path}/members/${m.id}`,'DELETE'));}}>Remove</button></div>)}
 <h3 className="mt-6 font-bold">Inactive members</h3>{members.filter(m=>m.status!=='active').map(m=><div key={m.id} className="mt-3 flex items-center gap-3"><span className="mr-auto">{m.name||'Trainer'} · {m.status}</span><button disabled={busy} className="rounded border border-slate-600 p-2" onClick={()=>void run(()=>request(`${path}/members/${m.id}`,'POST',{}))}>Restore trainer</button></div>)}
 <div className="mt-8 space-y-3 rounded-lg border border-red-900 p-4">
 <h3 className="font-bold text-red-400">Danger Zone</h3>
 <p className="text-sm text-slate-300">{c.status==='archived'?'Activate this campaign again to resume normal availability.':'Archive this campaign to prevent new invitations, joining and trainer creation without deleting its data.'}</p>
 <button type="button" disabled={busy} className="rounded border border-slate-600 px-4 py-2 disabled:opacity-50" onClick={()=>{if(window.confirm(c.status==='archived'?'Activate this campaign?':'Archive this campaign?'))void run(()=>request(path,'PATCH',{status:c.status==='archived'?'active':'archived'}));}}>{c.status==='archived'?'Activate campaign':'Archive campaign'}</button>
 <div className="border-t border-red-900 pt-4"><h4 className="font-semibold">Delete campaign permanently</h4><p className="my-2 text-sm text-slate-300">All campaign members, invitations, trainers and Pokémon will be deleted. Personal trainers and Pokémon are unaffected. This cannot be undone.</p>
 <label className="block text-sm">Type <strong className="break-all">{c.name}</strong> to confirm<input className={field} value={confirmName} disabled={busy} onChange={e=>setConfirmName(e.target.value)} autoComplete="off"/></label>
 <button type="button" disabled={busy||confirmName!==c.name} className="mt-3 rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-40" onClick={()=>void removeCampaign()}>Delete campaign</button></div></div>
 </section>;
}
