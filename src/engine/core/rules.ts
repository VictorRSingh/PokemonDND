import type { RulesetSnapshot } from './types';
export type RulesetPreset = 'classic' | 'casual' | 'expanded' | 'custom';
export type RulesetOverrides = Partial<Omit<RulesetSnapshot, 'version'>>;
const classic: RulesetSnapshot = Object.freeze({version:1, initiative:'shared', battlefield:'grid', trainerParticipation:true, activePokemonLimit:1, rollMode:'automatic', opportunityAttacks:true, reactions:true, trackPP:true, abilities:true, hiddenAbilities:false, weather:false, terrain:false});
const presets: Readonly<Record<RulesetPreset, RulesetSnapshot>> = Object.freeze({classic, custom:classic, casual:Object.freeze({...classic,battlefield:'arena',trainerParticipation:false,opportunityAttacks:false,reactions:false,trackPP:false}), expanded:Object.freeze({...classic,weather:true,terrain:true})});
const enums = {initiative:['shared','individual'], battlefield:['arena','grid'], rollMode:['automatic','digital','manual']} as const;
const flags = ['trainerParticipation','opportunityAttacks','reactions','trackPP','abilities','hiddenAbilities','weather','terrain'] as const;
function validate(input: unknown): RulesetSnapshot {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid ruleset');
  const r = input as Record<string, unknown>;
  const keys = Object.keys(classic);
  if (Object.keys(r).length !== keys.length || keys.some(k=>!Object.prototype.hasOwnProperty.call(r,k))) throw new Error('Invalid ruleset fields');
  if (r.version !== 1) throw new Error('Unsupported ruleset version');
  for (const [key, values] of Object.entries(enums)) if (!(values as readonly unknown[]).includes(r[key])) throw new Error(`Invalid ${key}`);
  for (const key of flags) if (typeof r[key] !== 'boolean') throw new Error(`Invalid ${key}`);
  if (typeof r.activePokemonLimit !== 'number' || !Number.isInteger(r.activePokemonLimit) || r.activePokemonLimit < 1 || r.activePokemonLimit > 6) throw new Error('Invalid activePokemonLimit');
  if (r.opportunityAttacks && !r.reactions) throw new Error('Opportunity attacks require reactions');
  if (r.hiddenAbilities && !r.abilities) throw new Error('Hidden abilities require abilities');
  return Object.freeze({...r}) as unknown as RulesetSnapshot;
}
export function createRulesetSnapshot(preset: RulesetPreset = 'classic', overrides: RulesetOverrides = {}): RulesetSnapshot {
  if (!Object.prototype.hasOwnProperty.call(presets,preset)) throw new Error('Unknown ruleset preset');
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Invalid overrides');
  for (const key of Object.keys(overrides)) if (key === 'version' || !Object.prototype.hasOwnProperty.call(classic,key)) throw new Error(`Unknown override: ${key}`);
  return validate({...presets[preset],...overrides});
}
export function restoreRulesetSnapshot(input: unknown): RulesetSnapshot { return validate(input); }
