import type { EncounterState, Position } from './types';
export type Cover = 'none'|'half'|'three-quarters'|'full';
// Trace three parallel rays across a square's footprint. Walls block sight;
// occupied intervening squares provide half cover, not total obstruction.
export function tacticalCover(s:EncounterState, from:Position, to:Position):Cover {
 if(s.rules.battlefield!=='grid')return 'none';
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(!length)return 'none';
 const steps=Math.ceil(length/0.5);let blocked=0, creature=false;
 for(const offset of [-2,0,2]){let wall=false;for(let i=1;i<steps;i++){const x=Math.round((from.x+dx*i/steps-dy/length*offset)/5)*5,y=Math.round((from.y+dy*i/steps+dx/length*offset)/5)*5;if((x===from.x&&y===from.y)||(x===to.x&&y===to.y))continue;if(s.battlefieldTerrain?.[`${x},${y}`]==='wall'){wall=true;break;}if(s.combatants.some(c=>c.currentHP>0&&c.position?.x===x&&c.position.y===y&&c.position.elevation===from.elevation&&(c.kind==='pokemon'?c.deployment==='active':s.rules.trainerParticipation)))creature=true;}if(wall)blocked++;}
 return blocked===3?'full':blocked===2?'three-quarters':blocked===1||creature?'half':'none';
}
export const coverBonus=(cover:Cover)=>cover==='half'?2:cover==='three-quarters'?5:0;
// Explicit DM preview only; does not imply automated multi-target resolution.
export function areaPreview(center:Position,p:Position,radius:number){return center.elevation===p.elevation&&Math.max(Math.abs(center.x-p.x),Math.abs(center.y-p.y))<=radius;}
