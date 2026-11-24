import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const dir=mkdtempSync(join(tmpdir(),'pokemon-normalize-'));
try {
  const tsc=require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath,[tsc,'--strict','--skipLibCheck','--target','es2020','--module','commonjs','--moduleResolution','node','--outDir',dir,'src/engine/data/index.ts'],{stdio:'inherit'});
  writeFileSync(join(dir,'package.json'),'{"type":"commonjs"}');
  const {normalizePokemonDataset,canonicalId}=require(join(dir,'index.js'));
  const raw=JSON.parse(readFileSync(resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))??'public/data','pokemon_master_list.json'),'utf8'));
  const before=JSON.stringify(raw);const result=normalizePokemonDataset(raw);
  assert.equal(JSON.stringify(raw),before);assert.equal(result.species.length+result.issues.length,raw.length);
  assert.equal(new Set(result.species.map(p=>p.id)).size,result.species.length);
  const get=n=>result.species.find(p=>p.id===canonicalId(n));
  assert.equal(get('Bulbasaur').baseHP,17);assert.deepEqual(get('Bulbasaur').types,['grass','poison']);
  assert.equal(get('Alolan Muk').hitDie.sides,12);assert.equal(get('Shedinja').hitDie.kind,'special');
  assert.equal(get('Type: Null').evolutions[0].requirement.kind,'all');assert.equal(get('Zygarde Complete Forme').number,718);
  assert.notEqual(get('Meowstic ♂').id,get('Meowstic ♀').id);
  console.log(JSON.stringify({input:raw.length,normalized:result.species.length,quarantined:result.issues.length,issues:result.issues},null,2));
  if(process.argv.includes('--strict')&&result.issues.length)process.exitCode=1;
} finally {rmSync(dir,{recursive:true,force:true});}
