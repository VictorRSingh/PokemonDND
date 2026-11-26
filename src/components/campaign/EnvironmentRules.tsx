import {resolveCampaignRules, type CampaignBattleSettings} from '@/engine/core/campaign-rules';
export default function EnvironmentRules({settings,onChange}:{settings:CampaignBattleSettings;onChange:(flag:'weather'|'terrain',enabled:boolean)=>void}) {
 const rules=resolveCampaignRules(settings);
 return <div className="space-y-3 rounded-lg border border-slate-700 p-4"><h3 className="font-semibold">Environmental rules</h3>{([['weather','Enable weather'],['terrain','Enable terrain effects']] as const).map(([flag,label])=><label key={flag} className="flex items-center gap-2"><input type="checkbox" checked={rules[flag]} onChange={e=>onChange(flag,e.target.checked)}/>{label}</label>)}<p className="text-sm text-slate-400">Applies to new encounters. Configure active weather and field terrain in the battle DM tab.</p></div>;
}
