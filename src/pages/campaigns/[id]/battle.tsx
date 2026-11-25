import type { GetServerSideProps } from 'next';
import { useState,useEffect,useRef } from 'react';
import Link from 'next/link';
import { createGameDataRegistry,type GameDataRegistry } from '@/engine/data';
import { prototypeChoices,startPrototype,prototypeAction } from '@/engine/core/prototype';
import type { EncounterState } from '@/engine/core/types';
import { requireSession } from '@/lib/require-session';
import { requireCampaignMember,campaignPermissions } from '@/services/campaign-permissions';
import { prepareCampaignEncounter } from '@/services/campaign-encounters';
import { randomUUID,randomInt } from 'crypto';
export const getServerSideProps:GetServerSideProps=async ctx=>{
 const auth=await requireSession(ctx);if(!('props' in auth))return auth;
 const props=await auth.props;const id=ctx.params?.id;if(typeof id!=='string')return {notFound:true};
 const userId=props.session.user.id;
 try{const access=await requireCampaignMember(userId,id);const permissions=campaignPermissions(access);if(!permissions.owner&&!permissions.dm)return {notFound:true};
 const initial=await prepareCampaignEncounter(userId,id,randomUUID(),'wild',randomInt(1,2147483647));
 return {props:{...props,initial,campaignName:access.campaign.name}};
 }catch{return {notFound:true};}
};
export default function Battle({initial,campaignName}:{initial:EncounterState;campaignName:string}){
 const [registry,setRegistry]=useState<GameDataRegistry|null>(null);const [state,setState]=useState(initial);const [left,setLeft]=useState('');const [right,setRight]=useState('');const [error,setError]=useState('');const [log,setLog]=useState<string[]>([]);const current=useRef(initial);
 useEffect(()=>{let live=true;Promise.all(['pokemon_master_list','move_list','nature_list'].map(async n=>{const r=await fetch(`/data/${n}.json`);if(!r.ok)throw new Error('Unable to load game data');return r.json();})).then(([p,m,n])=>{if(live){const r=createGameDataRegistry(p,m,n);setRegistry(r);const choices=prototypeChoices(r);setLeft(choices.find(x=>x.id==='charmander')?.id??choices[0]?.id??'');setRight(choices.find(x=>x.id==='bulbasaur')?.id??choices[1]?.id??'');}}).catch(e=>{if(live)setError(String(e));});return()=>{live=false};},[]);
 function run(fn:()=>{state:EncounterState;message:string}){try{const r=fn();current.current=r.state;setState(r.state);setLog(l=>[...l,r.message]);setError('');}catch(e){setError(e instanceof Error?e.message:String(e));}}
 const actor=state.turn?state.combatants.find(c=>c.id===state.initiative[state.turn!.slotIndex].combatantIds[0]):undefined;
 const choices=registry?prototypeChoices(registry):[];
 return <main className="mx-auto max-w-5xl p-6 space-y-6"><Link href={`/campaigns/${initial.campaignId}`} className="text-yellow-400">← Campaign</Link><h1 className="text-3xl font-bold">{campaignName}: Battle prototype</h1><p className="text-slate-400">Local DM sandbox. No roster changes or saved battle history. Two Pokémon at fixed melee distance; abilities are not assigned in this prototype.</p>{error&&<p role="alert" className="text-red-400">{error}</p>}
 {!registry?<p>Loading game data…</p>:state.status==='setup'?<section className="space-y-4">{([['Player Pokémon',left,setLeft],['Opponent',right,setRight]] as const).map(([label,value,set])=><label key={label} className="block">{label}<select className="select select-bordered ml-3" value={value} onChange={e=>set(e.target.value)}>{choices.map(c=><option key={c.id} value={c.id}>{c.name} (Lv. {c.level})</option>)}</select></label>)}<button className="btn btn-primary" disabled={!left||!right} onClick={()=>run(()=>{const r=startPrototype(current.current,registry,[left,right]);return {state:r.state,message:'Initiative: '+r.rolls.map(x=>`${x.actorId}: ${x.result.natural}`).join(', ')}})}>Start battle</button></section>:<><div className="grid gap-4 sm:grid-cols-2">{state.combatants.map(c=><section key={c.id} className="rounded-xl border border-slate-700 p-5"><h2 className="text-xl font-bold">{c.name} {actor?.id===c.id?'• Active turn':''}</h2><p>Level {c.level} · AC {c.armorClass}</p><progress className="progress progress-success w-full" value={c.currentHP} max={c.maximumHP}/><p>{c.currentHP} / {c.maximumHP} HP</p>{c.kind==='pokemon'&&<><p>{c.nonvolatile?.kind??'No persistent status'} {c.volatile.map(v=>v.kind).join(', ')}</p>{c.pokemon.learnedMoves.map(m=><p key={m.moveId}>{registry.getMove(m.moveId)?.name}: {m.pp.kind==='limited'?m.pp.remaining:'∞'} PP</p>)}</>}</section>)}</div>
 {state.status==='active'&&actor?.kind==='pokemon'&&<section className="space-y-3"><h2>Round {state.turn?.round} · {actor.name}</h2><p>Initiative: {state.initiative.map(s=>s.combatantIds.map(id=>state.combatants.find(c=>c.id===id)?.name).join(', ')).join(' → ')}</p><div className="flex flex-wrap gap-2">{[...actor.pokemon.learnedMoves,{moveId:'struggle',pp:{kind:'unlimited' as const}}].map(m=><button key={m.moveId} className="btn" disabled={!state.turn?.resources.actionAvailable||(state.rules.trackPP&&m.pp.kind==='limited'&&m.pp.remaining===0)} onClick={()=>run(()=>prototypeAction(current.current,registry,m.moveId))}>{registry.getMove(m.moveId)?.name??m.moveId}</button>)}<button className="btn btn-primary" onClick={()=>run(()=>prototypeAction(current.current,registry))}>End turn</button></div></section>}
 {state.status==='completed'&&<h2 className="text-2xl font-bold">{state.result?.winner?`${state.combatants.find(c=>c.sideId===state.result?.winner)?.name} wins!`:'Battle ended — '+state.result?.kind}</h2>}<button className="btn btn-outline" onClick={()=>{current.current=initial;setState(initial);setLog([]);setError('')}}>Reset battle (same seed)</button><section><h2 className="font-bold">Combat log</h2><ol className="space-y-1">{log.map((line,i)=><li key={i}>{line}</li>)}</ol></section></> }</main>;
}
