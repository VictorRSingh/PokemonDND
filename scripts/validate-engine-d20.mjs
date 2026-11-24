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
  const {createRandom,rollD20,recordManualD20,resolveRollCondition} = require(join(dir,'core/index.js'));
  const a={advantage:['a','b']}, d={disadvantage:['c']}, both={...a,...d};
  assert.equal(resolveRollCondition(both),'normal');
  assert.equal(recordManualD20(3,[4,17],a).total,20);
  assert.equal(recordManualD20(-2,[4,17],d).total,2);
  assert.equal(recordManualD20(0,[20],both).natural,20);
  assert.equal(recordManualD20(0,[7,7],a).selectedIndex,0);
  for(const rolls of [[1],[0,2],[21,2],[1,2,3]]) assert.throws(()=>recordManualD20(0,rolls,a));
  const x=createRandom(42), y=createRandom(42);
  for(let i=0;i<1000;i++) assert.deepEqual(rollD20(2,x,a),rollD20(2,y,a));
  const before=x.snapshot(); assert.throws(()=>rollD20(Infinity,x)); assert.equal(x.snapshot(),before);
  const r=rollD20(0,{nextInt:()=>1},d,'digital'); assert.equal(r.mode,'digital'); assert.equal(r.natural,1); assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.rolls)&&Object.isFrozen(r.sources.disadvantage));
  let calls=0; rollD20(0,{nextInt:()=>{calls++;return 10}},both); assert.equal(calls,1);
  console.log(JSON.stringify({selection:'passed',cancellation:'passed',manual:'passed',determinism:'passed',validation:'passed',result:'passed'},null,2));
} finally { rmSync(dir,{recursive:true,force:true}); }
