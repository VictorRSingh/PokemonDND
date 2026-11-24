import { useEffect,useState } from 'react';
import { useSession,signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { request } from '@/lib/game-client';
export default function Join(){const {status}=useSession();const router=useRouter();const [code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setCode(window.location.hash.slice(1)||sessionStorage.getItem('campaign-invite')||'')},[]);
 async function submit(){setBusy(true);setError('');try{if(status==='unauthenticated'){sessionStorage.setItem('campaign-invite',code);await signIn('discord',{callbackUrl:'/campaigns/join'});return;}const r=await request<{campaignId:string}>('/api/campaigns/join','POST',{code});sessionStorage.removeItem('campaign-invite');await router.replace(`/campaigns/${r.campaignId}`)}catch(e){setError(e instanceof Error?e.message:'Unable to join')}finally{setBusy(false)}}
 return <div className="mx-auto max-w-xl p-8"><Link href="/campaigns" className="text-yellow-400">← Campaigns</Link><h1 className="mt-4 text-3xl font-bold">Join campaign</h1><form className="mt-5 space-y-4" onSubmit={e=>{e.preventDefault();void submit()}}><label className="block">Invitation code<input required value={code} onChange={e=>setCode(e.target.value.trim())} className="mt-2 w-full rounded bg-slate-800 p-3"/></label><button disabled={busy||status==='loading'||!/^[a-f0-9]{64}$/.test(code)} className="rounded bg-yellow-400 p-3 font-bold text-slate-950">{status==='unauthenticated'?'Sign in with Discord':'Join campaign'}</button>{error&&<p role="alert" className="text-red-400">{error}</p>}</form></div>;
}
