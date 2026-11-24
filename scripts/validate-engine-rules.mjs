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
  const {createRulesetSnapshot:create,restoreRulesetSnapshot:restore} = require(join(dir,'core/index.js'));
  const classic=create(); assert.equal(classic.initiative,'shared'); assert.equal(classic.activePokemonLimit,1);
  assert.equal(create('casual').trackPP,false); assert.equal(create('expanded').weather,true);
  const overrides={activePokemonLimit:3,initiative:'individual'}; const snap=create('custom',overrides); overrides.activePokemonLimit=5; assert.equal(snap.activePokemonLimit,3); assert.ok(Object.isFrozen(snap));
  assert.deepEqual(restore(JSON.parse(JSON.stringify(snap))),snap);
  for(const bad of [{activePokemonLimit:0},{activePokemonLimit:7},{activePokemonLimit:1.5},{initiative:'bad'},{trackPP:'false'},{version:2},{extra:true},{reactions:false},{abilities:false,hiddenAbilities:true}]) assert.throws(()=>create('classic',bad));
  for(const bad of [null,{}, {...snap,version:2},{...snap,extra:true}]) assert.throws(()=>restore(bad));
  assert.throws(()=>create('unknown')); assert.throws(()=>create('toString'));
  console.log(JSON.stringify({presets:'passed',overrides:'passed',validation:'passed',immutability:'passed',restoration:'passed',result:'passed'},null,2));
} finally { rmSync(dir,{recursive:true,force:true}); }
