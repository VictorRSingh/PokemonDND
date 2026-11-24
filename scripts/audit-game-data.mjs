import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const args = process.argv.slice(2);
const dir = resolve(args.find(a => !a.startsWith('--')) ?? 'public/data');
const strict = args.includes('--strict');
const issues = [];
const issue = (code, record, detail) => issues.push({code, record, detail});
const load = name => { const data = JSON.parse(readFileSync(resolve(dir, name), 'utf8').replace(/^\uFEFF/, '')); if (!Array.isArray(data)) throw new Error(`${name}: expected array`); return data; };
const types = new Set('normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split(' '));
const sizes = new Set('tiny small medium large huge gargantuan'.split(' '));
const key = s => typeof s === 'string' ? s.trim().toLowerCase() : '';
const group = (rows, fn) => { const m = new Map(); for (const row of rows) { const k = fn(row); m.set(k, [...(m.get(k) ?? []), row]); } return m; };
try {
 const species = load('pokemon_master_list.json'), moves = load('move_list.json'), natures = load('nature_list.json'), legacy = load('pokemon_list.json'), numbers = load('pokemon_number.json');
 for (const [label, rows] of Object.entries({species,moves,natures,legacy,numbers})) for (const [name, entries] of group(rows, r => key(r.name))) if (!name || entries.length > 1) issue('name-invalid-or-duplicate',label,`${name}: ${entries.length}`);
 const moveNames = new Set(moves.map(m => key(m.name)));
 const sharedNumbers = [...group(species, p => String(p.number)).entries()].filter(([,v]) => v.length > 1).map(([number,v]) => ({number,names:v.map(p=>p.name)}));
 let mixedSize = 0, stringPP = 0;
 for (const p of species) {
  const name = p.name;
  if (!Array.isArray(p.type)) issue('invalid-type-field',name,JSON.stringify(p.type));
  else { if (p.type.some(t=>sizes.has(key(t)))) mixedSize++; for (const t of p.type) if (!types.has(key(t)) && !sizes.has(key(t))) issue('unknown-type',name,JSON.stringify(t)); if (!p.type.some(t=>types.has(key(t)))) issue('missing-elemental-type',name,JSON.stringify(p.type)); }
  for (const field of ['armor_class','hit_points','level']) if (!Number.isInteger(p[field]) || p[field]<1) issue('invalid-stat',name,`${field}: ${p[field]}`);
  if (!/^d(?:4|6|8|10|12|20)$/.test(String(p.hit_dice))) issue('invalid-hit-die',name,String(p.hit_dice));
  if (!p.moves || typeof p.moves !== 'object' || Array.isArray(p.moves)) issue('invalid-learnset',name,JSON.stringify(p.moves));
  else for (const [level, list] of Object.entries(p.moves)) { if (!Array.isArray(list)) {issue('invalid-move-list',name,level);continue;} for (const move of list) if (!moveNames.has(key(move))) issue('unmatched-move',name,`${level}: ${move}`); }
  for (const stat of ['str','dex','con','int','wis','cha']) if (!Number.isInteger(p.stats?.[stat]?.value)) issue('invalid-ability-score',name,stat);
 }
 for (const m of moves) { if (typeof m.pp==='string') stringPP++; if (!/^\d+$/.test(String(m.pp).trim()) || Number(m.pp)<0) issue('invalid-pp',m.name,String(m.pp)); if (!types.has(key(m.type))) issue('unknown-move-type',m.name,String(m.type)); }
 const summary = {species:species.length,moves:moves.length,natures:natures.length,legacy:legacy.length,numbers:numbers.length,mixedSize,stringPP,sharedNumberGroups:sharedNumbers.length,issueCounts:Object.fromEntries([...group(issues,x=>x.code)].map(([k,v])=>[k,v.length]))};
 if(args.includes('--json')) console.log(JSON.stringify({summary,sharedNumbers,issues},null,2)); else {console.log(JSON.stringify(summary,null,2)); for(const x of issues) console.log(`${x.code} | ${x.record} | ${x.detail}`); console.log('Shared numbers (review, not necessarily errors):',JSON.stringify(sharedNumbers));}
 if(strict && issues.length) process.exitCode=1;
} catch(e) {console.error(`Audit failed: ${e.message}`);process.exitCode=2;}
