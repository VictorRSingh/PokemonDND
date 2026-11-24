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
  const {validateGameReferences,normalizeAbilityDataset}=require(join(dir,'index.js'));
  const root=resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))??'public/data');
  const load=name=>JSON.parse(readFileSync(join(root,name+'.json'),'utf8'));
  const raw=[load('pokemon_master_list'),load('move_list'),load('nature_list')];
  const before=JSON.stringify(raw);
  const result=validateGameReferences(...raw);
  assert.equal(JSON.stringify(raw),before);
  assert.equal(result.unavailableMoveReferences.length,2);
  assert.ok(result.unavailableMoveReferences.every(x=>x.field==='learnset'));
  assert.equal(normalizeAbilityDataset([{name:'test',abilities:[],hidden_ability:[]}]).issues.length,0);
  assert.equal(normalizeAbilityDataset([{name:'test',abilities:[],hidden_ability:['bad']}]).issues.length,1);
  console.log(JSON.stringify(result,null,2));
  if(process.argv.includes('--strict')&&(result.normalizationIssues.length||result.referenceIssues.length||result.abilityConflicts.length))process.exitCode=1;
} finally {rmSync(dir,{recursive:true,force:true});}
