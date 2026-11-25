import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const dir = mkdtempSync(join(tmpdir(), 'pokemon-rng-'));
try {
  const require = createRequire(import.meta.url);
  const tsc = process.env.ENGINE_TSC || require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, '--strict', '--skipLibCheck', '--target', 'es2020', '--module', 'commonjs', '--outDir', dir, 'src/engine/core/random.ts'], {stdio:'inherit'});
  const {createRandom, restoreRandom, withDice, PendingDice} = require(join(dir, 'random.js'));
  const a = createRandom(42), b = createRandom(42);
  for (let i=0;i<1000;i++) assert.equal(a.nextUint32(), b.nextUint32());
  assert.notEqual(createRandom(42).nextUint32(), createRandom(43).nextUint32());
  const restored = restoreRandom(a.snapshot());
  for(let i=0;i<1000;i++) assert.equal(a.nextInt(1,20), restored.nextInt(1,20));
  const seen = new Set();
  for(let i=0;i<10000;i++) { const n=a.nextInt(1,20); assert.ok(n>=1 && n<=20); seen.add(n); const f=a.nextFloat(); assert.ok(f>=0 && f<1); }
  assert.equal(seen.size,20);
  assert.equal(a.nextInt(-5,-5),-5);
  assert.ok(a.nextInt(0,0xffffffff)>=0);
  for(const seed of [-1, 2**32, 1.5, NaN]) assert.throws(()=>createRandom(seed));
  for(const args of [[2,1],[0,2**32],[1.5,2],[NaN,2]]) assert.throws(()=>a.nextInt(...args));
  for(const state of ['', 'mulberry32:v2:00000000','mulberry32:v1:xyz']) assert.throws(()=>restoreRandom(state));
  assert.equal(createRandom(0).snapshot(),'mulberry32:v1:00000000');
  const operation=()=>{const r=createRandom(42);return [r.nextInt(1,20),r.nextInt(1,6),r.snapshot()];};
  assert.deepEqual(withDice([],false,operation).result,operation());
  assert.throws(()=>withDice([],true,operation),PendingDice);
  assert.throws(()=>withDice([20],true,operation),PendingDice);
  assert.throws(()=>withDice([21],true,operation),RangeError);
  assert.deepEqual(withDice([20,6],true,operation).result,[20,6,operation()[2]]);
  assert.deepEqual(withDice([null,null],true,operation).result,operation());
  assert.throws(()=>withDice([1,2,3],true,operation),/Unused/);
  assert.deepEqual(operation(),withDice([],false,operation).result);
  console.log(JSON.stringify({determinism:'passed',restoration:'passed',bounds:'passed',invalidInputs:'passed',result:'passed'},null,2));
} finally { rmSync(dir,{recursive:true,force:true}); }
