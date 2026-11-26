import { battlefieldDistance, moveWithOpportunity, supportedBattleMoves } from './battle';
import { opportunityCandidates,statusRestrictions } from './status-rules';
import { spendMovement,spendTurnResource } from './encounter';
import type { EncounterState, Position } from './types';
import type { GameDataRegistry } from '../data/registry';
export type Terrain = 'normal'|'wall'|'blocked'|'difficult'|'water'|'hazard';
export type TerrainMap = Readonly<Record<string,Terrain>>;
export const terrainKey=(p:Position)=>`${p.x},${p.y}`;
export const terrainMultiplier=(terrain:Terrain)=>terrain==='wall'||terrain==='blocked'?Infinity:terrain==='difficult'||terrain==='water'?2:1;
type ReactionChoice=Parameters<typeof moveWithOpportunity>[6][number];
const reachFor=(s:EncounterState,r:GameDataRegistry)=>Object.fromEntries(s.combatants.map(c=>[c.id,c.kind==='pokemon'&&['huge','gargantuan'].includes(r.getSpecies(c.pokemon.speciesId)?.size??'')?10:5]));
export function tacticalCandidates(s:EncounterState,r:GameDataRegistry,id:string,p:Position){return opportunityCandidates(s,id,p,reachFor(s,r));}
export function tacticalReactionMoves(s:EncounterState,r:GameDataRegistry,id:string){const c=s.combatants.find(c=>c.id===id);return c?.kind==='pokemon'?[...c.pokemon.learnedMoves.filter(m=>supportedBattleMoves().includes(m.moveId)&&r.getMove(m.moveId)?.range.trim().toLowerCase()==='melee'&&r.getMove(m.moveId)?.timing.trim().toLowerCase()==='1 action'&&(!s.rules.trackPP||m.pp.kind!=='limited'||m.pp.remaining>0)).map(m=>m.moveId),'struggle']:[];}
export function tacticalCost(s:EncounterState,id:string,terrain:Terrain='normal'){const c=s.combatants.find(c=>c.id===id);const multiplier=c?.kind==='pokemon'?(statusRestrictions(c).incapacitated?0:statusRestrictions(c).movementMultiplier):1;return multiplier?Math.ceil(5*terrainMultiplier(terrain)/multiplier):Infinity;}
export function tacticalAction(s:EncounterState,id:string,action:'dash'|'disengage'|'dodge'){
 const c=s.combatants.find(c=>c.id===id);if(!c||(action!=='dodge'&&s.rules.battlefield!=='grid')||(c.kind==='pokemon'&&(statusRestrictions(c).incapacitated||c.actionForfeited)))throw new Error('Action unavailable');
 const next=spendTurnResource(s,s.version,id,'action');const t=next.turn!;
 if(action==='dodge')return {state:{...next,combatants:next.combatants.map(x=>x.id===id?{...x,dodging:true}:x)},message:`${c.name} used Dodge`};
 return {state:{...next,turn:action==='dash'?{...t,movementRemaining:{...t.movementRemaining,[id]:(t.movementRemaining[id]??0)+(c.speed.walking??0)}}:{...t,disengagedIds:[...new Set([...(t.disengagedIds??[]),id])]}},message:`${c.name} used ${action}`};
}
export function tacticalStep(s:EncounterState,registry:GameDataRegistry,id:string,destination:Position,declineReactions=false,choices:readonly ReactionChoice[]=[],terrain:TerrainMap={}){
 const actor=s.combatants.find(c=>c.id===id);
 if(s.status!=='active'||s.rules.battlefield!=='grid'||!actor?.position||actor.currentHP<=0||!s.turn||!s.initiative[s.turn.slotIndex].combatantIds.includes(id)||destination.elevation!==actor.position.elevation||battlefieldDistance(actor.position,destination)!==5||destination.x%5||destination.y%5)throw new Error('Select an adjacent five-foot square');
 if(s.combatants.some(c=>c.id!==id&&c.currentHP>0&&c.position&&(c.kind==='trainer'?s.rules.trainerParticipation:c.deployment==='active')&&battlefieldDistance(c.position,destination)===0))throw new Error('Occupied square');
 const tile=terrain[terrainKey(destination)]??'normal';const cost=tacticalCost(s,id,tile);
 if(!Number.isFinite(terrainMultiplier(tile)))throw new Error('Blocked terrain');
 if(!Number.isFinite(cost)||(s.turn.movementRemaining[id]??0)<cost)throw new Error('Insufficient movement remaining');
 const reach=reachFor(s,registry),candidates=opportunityCandidates(s,id,destination,reach);
 if(candidates.some(id=>!choices.some(choice=>choice.actorId===id))&&!declineReactions)throw new Error('Opportunity attacks possible: resolve or decline reactions to move');
 if(actor.kind==='trainer'&&choices.length)throw new Error('Trainer reaction damage requires manual resolution');
 const result=actor.kind==='pokemon'?moveWithOpportunity(s,s.version,registry,id,destination,reach,choices,undefined,()=>terrainMultiplier(tile)):{state:{...spendMovement(s,s.version,id,cost),combatants:s.combatants.map(c=>c.id===id?{...c,position:destination}:c)},reactions:[]};
 const moved=result.state.combatants.find(c=>c.id===id)?.position;
 return {state:result.state,message:[...result.reactions.map(r=>`${s.combatants.find(c=>c.id===r.actorId)?.name} opportunity attack: ${r.moveId}, ${r.amount} damage`),`${actor.name} ${moved&&battlefieldDistance(moved,destination)===0?`moved 5 ft (${cost} ft movement spent${tile==='normal'?'':', '+tile})`:'movement interrupted'}${candidates.length>choices.length?' (remaining reactions declined)':''}`].join(' | ')};
}

export type TacticalMode='walking'|'swimming'|'flying';
export type TacticalRoute={path:Position[];cost:number};
export function tacticalRoutes(s:EncounterState,id:string,terrain:TerrainMap,bounds:{minX:number;maxX:number;minY:number;maxY:number},mode:TacticalMode='walking',altitude?:number){
 const actor=s.combatants.find(c=>c.id===id), routes=new Map<string,TacticalRoute>();
 if(!actor?.position||!s.turn||actor.currentHP<=0||!s.initiative[s.turn.slotIndex].combatantIds.includes(id))return routes;
 const start=actor.position, budget=s.turn.movementRemaining[id]??0, speed=actor.speed[mode]??0;
 if(!speed||(!Number.isFinite(tacticalCost(s,id))))return routes;
 const limit=mode==='walking'?budget:Math.min(budget,speed), z=altitude??start.elevation;
 const key=(p:Position)=>`${p.x},${p.y},${p.elevation}`;
 const queue:{p:Position;route:TacticalRoute}[]=[{p:start,route:{path:[],cost:0}}];const seen=new Map([[key(start),0]]);
 while(queue.length){queue.sort((a,b)=>a.route.cost-b.route.cost);const {p,route}=queue.shift()!;if(seen.get(key(p))!==route.cost)continue;
 if(route.path.length)routes.set(key(p),route);
 const neighbors:Position[]=[];for(let dx=-5;dx<=5;dx+=5)for(let dy=-5;dy<=5;dy+=5)if(dx||dy)neighbors.push({...p,x:p.x+dx,y:p.y+dy});
 if(mode==='flying'&&p.elevation!==z)neighbors.push({...p,elevation:p.elevation+Math.sign(z-p.elevation)*5});
 for(const n of neighbors){if(n.x<bounds.minX||n.x>bounds.maxX||n.y<bounds.minY||n.y>bounds.maxY||n.elevation<0||n.elevation>100)continue;
 const tile=terrain[terrainKey(n)]??'normal';const factor=routeFactor(tile,n,mode);if(!Number.isFinite(factor))continue;
 if(s.combatants.some(c=>c.id!==id&&c.currentHP>0&&c.position&&(c.kind==='pokemon'?c.deployment==='active':s.rules.trainerParticipation)&&battlefieldDistance(c.position,n)===0))continue;
 const cost=route.cost+tacticalCost(s,id,factor===2?'difficult':'normal');if(cost>limit||cost>=(seen.get(key(n))??Infinity))continue;
 seen.set(key(n),cost);queue.push({p:n,route:{path:[...route.path,n],cost}});
 }}return routes;
}
export const routeFactor=(tile:Terrain,p:Position,mode:TacticalMode)=>mode==='flying'&&p.elevation>0?1:mode==='swimming'?tile==='water'&&p.elevation===0?1:Infinity:p.elevation===0?terrainMultiplier(tile):Infinity;
export function routeCandidates(s:EncounterState,r:GameDataRegistry,id:string,path:readonly Position[]){const ids=new Set<string>();let preview=s;for(const p of path){for(const candidate of tacticalCandidates(preview,r,id,p))ids.add(candidate);preview={...preview,combatants:preview.combatants.map(c=>c.id===id?{...c,position:p}:c)};}return [...ids];}
export function tacticalRoute(s:EncounterState,r:GameDataRegistry,id:string,path:readonly Position[],terrain:TerrainMap,mode:TacticalMode,choices:readonly ReactionChoice[]=[],decline=false){
 const actor=s.combatants.find(c=>c.id===id);if(!actor?.position||!path.length||!s.turn)throw new Error('Invalid route');
 const candidates=routeCandidates(s,r,id,path);if(!decline&&candidates.some(c=>!choices.some(x=>x.actorId===c)))throw new Error('Opportunity attacks possible');
 let prev=actor.position,total=0;for(const p of path){if(battlefieldDistance(prev,p)!==5||p.x%5||p.y%5||p.elevation%5||p.elevation<0||p.elevation>100||(mode!=='flying'&&p.elevation!==prev.elevation))throw new Error('Invalid route step');const f=routeFactor(terrain[terrainKey(p)]??'normal',p,mode);total+=Number.isFinite(f)?tacticalCost(s,id,f===2?'difficult':'normal'):Infinity;if(s.combatants.some(c=>c.id!==id&&c.currentHP>0&&c.position&&(c.kind==='pokemon'?c.deployment==='active':s.rules.trainerParticipation)&&battlefieldDistance(c.position,p)===0))throw new Error('Occupied path');prev=p;}
 if(!Number.isFinite(total)||total>(mode==='walking'?(s.turn.movementRemaining[id]??0):Math.min(actor.speed[mode]??0,s.turn.movementRemaining[id]??0)))throw new Error('Insufficient movement');
 const destination=path[path.length-1];const result=actor.kind==='pokemon'?moveWithOpportunity(s,s.version,r,id,destination,reachFor(s,r),choices,path,p=>routeFactor(terrain[terrainKey(p)]??'normal',p,mode),mode==='flying'):{state:{...spendMovement(s,s.version,id,total),combatants:s.combatants.map(c=>c.id===id?{...c,position:destination}:c)},reactions:[]};
 return {state:result.state,message:[...result.reactions.map(x=>`${x.actorId} opportunity attack: ${x.amount} damage`),`${actor.name} ${mode} route (${total} ft planned)`].join(' | ')};
}
