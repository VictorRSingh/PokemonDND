import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const dir = mkdtempSync(join(tmpdir(), 'pokemon-dice-'));
try {
  const require = createRequire(import.meta.url);
  const tsc = process.env.ENGINE_TSC || require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, '--strict', '--skipLibCheck', '--target', 'es2020', '--module', 'commonjs', '--outDir', dir, 'src/engine/core/index.ts'], {stdio:'inherit'});
  const {getAbilityModifier: mod, getAbilityModifiers: mods, validateAbilityScores: validate} = require(join(dir,'core/index.js'));
  for(let score=1;score<=30;score++) assert.equal(mod(score),Math.floor((score-10)/2));
  assert.equal(mod(9),-1); assert.equal(mod(1),-5); assert.equal(mod(20),5); assert.equal(mod(30),10);
  const scores={str:15,dex:9,con:12,int:8,wis:10,cha:21};
  const result=mods(scores); assert.deepEqual(result,{str:2,dex:-1,con:1,int:-1,wis:0,cha:5});
  assert.ok(Object.isFrozen(result)); scores.str=20; assert.equal(result.str,2);
  for(const bad of [0,-1,1.5,NaN,Infinity,'10',null,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>mod(bad));
  for(const bad of [null,[],{}, {...scores,extra:1},{...scores,dex:0},{str:10,dex:10,con:10,int:10,wis:10},Object.create(scores)]) assert.throws(()=>validate(bad));
  console.log(JSON.stringify({modifiers:'passed',validation:'passed',immutability:'passed',result:'passed'},null,2));
} finally { rmSync(dir,{recursive:true,force:true}); }
