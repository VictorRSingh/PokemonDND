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
  const {normalizeMoveDataset,normalizeMove,moveId,unavailableMoves}=require(join(dir,'index.js'));
  const raw=JSON.parse(readFileSync(resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))??'public/data','move_list.json'),'utf8'));
  const before=JSON.stringify(raw);const result=normalizeMoveDataset(raw);
  assert.equal(JSON.stringify(raw),before);assert.equal(result.moves.length+result.issues.length,raw.length);
  assert.equal(new Set(result.moves.map(m=>m.id)).size,result.moves.length);
  const get=n=>result.moves.find(m=>m.id===moveId(n));
  assert.deepEqual(get('Struggle').pp,{kind:'unlimited'});assert.equal(get('Struggle').typing.type,'typeless');
  assert.equal(get('Curse').typing.type,'ghost');assert.equal(get('Curse').concentration,true);
  assert.equal(get('Judgment').typing.kind,'dynamic');assert.equal(get('Hidden Power').powerMode,'any');
  assert.equal(get('Metronome').powerMode,'dynamic');assert.equal(get('Absorb').pp.maximum,15);
  assert.equal(get('XScissor').id,get('X-Scissor').id);
  assert.equal(normalizeMove({...raw[0],pp:'-1'}).ok,false);
  assert.equal(normalizeMoveDataset([raw[0],raw[0]]).issues.length,1);
  assert.ok(result.moves.every(m=>m.implementation.kind==='unsupported'));
  console.log(JSON.stringify({input:raw.length,normalized:result.moves.length,quarantined:result.issues.length,unsupported:result.moves.filter(m=>m.implementation.kind==='unsupported').length,knownUnavailableMoves:unavailableMoves.filter(m=>!get(m.name)).map(m=>m.name),issues:result.issues},null,2));
  if(process.argv.includes('--strict')&&result.issues.length)process.exitCode=1;
} finally {rmSync(dir,{recursive:true,force:true});}
