import { ABILITY_KEYS, ELEMENTAL_TYPES } from '../types';
import type { AbilityKey, DamageType, MoveDefinition, MoveTyping, NormalizationResult, DataIssue, PowerPoints } from '../types';
import { moveId } from './pokemon';

export type NormalizedMove = MoveDefinition & {
  readonly powerMode: 'listed' | 'any' | 'none' | 'dynamic';
  readonly actionKind: 'action' | 'bonus-action' | 'reaction' | 'special';
  readonly concentration: boolean;
};
const text = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected nonempty text');
  return value.replace(/\r\n?/g, '\n').trim();
};
export function normalizeMove(raw: unknown): NormalizationResult<NormalizedMove> {
  let field = 'record', record = 'unknown';
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected object');
    const r = raw as Record<string, unknown>;
    field = 'name'; const name = text(r.name); record = name; const id = moveId(name);
    if (!id) throw new Error('Invalid identifier');
    // Curse has a corrupted type and description in the legacy extraction (PHB p.50).
    const curse = id === 'curse' && typeof r.type === 'string' && r.type.startsWith('1d6 ghost damage');
    field = 'type'; const type = curse ? 'ghost' : text(r.type).toLowerCase();
    let typing: MoveTyping;
    if (type === 'varies') typing = {kind:'dynamic',ruleId:id};
    else if (type === 'typeless' || (ELEMENTAL_TYPES as readonly string[]).includes(type)) typing = {kind:'fixed',type:type as DamageType};
    else throw new Error('Unknown type: '+type);
    field = 'move_power'; const power = text(r.move_power).toLowerCase();
    const powerMode = power === 'any' ? 'any' : power === 'none' ? 'none' : power === 'varies' ? 'dynamic' : 'listed';
    const keys = powerMode === 'any' ? [...ABILITY_KEYS] : powerMode === 'listed' ? power.split('/').map(k=>k.trim()) : [];
    if (keys.some(k=>!(ABILITY_KEYS as readonly string[]).includes(k))) throw new Error('Invalid Move Power');
    field = 'pp'; const ppText = text(r.pp); let pp: PowerPoints;
    if (ppText.toLowerCase() === 'unlimited') pp = {kind:'unlimited'};
    else { const maximum = Number(ppText); if (!/^\d+$/.test(ppText)||!Number.isSafeInteger(maximum)||maximum<1) throw new Error('Invalid PP'); pp={kind:'limited',maximum}; }
    field = 'move_time'; const timing = text(r.move_time);
    const actionKind = timing === '1 action' ? 'action' : timing === '1 bonus action' ? 'bonus-action' : timing === '1 reaction' ? 'reaction' : 'special';
    field = 'duration'; const duration = text(r.duration).replace(/^Instataneouus$/i,'Instantaneous').replace(/^instantaneous$/i,'Instantaneous');
    field = 'range'; const range = text(r.range);
    field = 'description'; const description = curse ? 'For a Ghost-type user, the target within range makes a WIS save against Move DC. On failure, the user takes 1d6 damage initially and the cursed target takes 1d6 ghost damage at the end of each turn for the duration. For other user types, the user gains 2 STR and 2 CON and loses 4 DEX for the duration.' : text(r.description);
    field = 'higher_levels'; const higherLevels = r.higher_levels == null || r.higher_levels === 'None' ? undefined : text(r.higher_levels);
    return {ok:true,value:{id,name,typing,movePower:[...new Set(keys)] as AbilityKey[],powerMode,pp,timing,actionKind,range,duration,concentration:/\bconcentration\b/i.test(duration),description,higherLevels,implementation:{kind:'unsupported',reason:'Combat effect handler not implemented'},source:curse?{document:'Pokemon 5e Player Handbook',page:50}:{document:'move_list.json'}}};
  } catch(e) { return {ok:false,issues:[{dataset:'move_list',record,field,message:e instanceof Error?e.message:String(e)}]}; }
}
export function normalizeMoveDataset(raw: readonly unknown[]): {moves: NormalizedMove[]; issues: DataIssue[]} {
  const moves: NormalizedMove[] = [], issues: DataIssue[] = [], seen = new Set<string>();
  for (const entry of raw) { const result = normalizeMove(entry); if (!result.ok) {issues.push(...result.issues);continue;} const m=result.value; if(seen.has(m.id)){issues.push({dataset:'move_list',record:m.name,field:'name',message:'Duplicate canonical ID'});continue;} seen.add(m.id);moves.push(m); }
  return {moves,issues};
}
