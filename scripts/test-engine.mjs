import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length > 1 || args.some(a => a.startsWith('-') && a !== '--core-only')) {
  console.error('Usage: node scripts/test-engine.mjs [--core-only | data-directory]');
  process.exit(2);
}
const coreOnly = args[0] === '--core-only';
const data = resolve(root, coreOnly ? 'public/data' : args[0] ?? 'public/data');
const core = ['random', 'dice', 'd20', 'rules', 'ability-scores', 'stats', 'encounter'].map(name => [`validate-engine-${name}.mjs`, []]);
const datasets = ['normalized-pokemon', 'normalized-moves', 'normalized-abilities-natures', 'game-references', 'game-registry'].map(name => [`validate-${name}.mjs`, [data, '--strict']]);
const suites = coreOnly ? core : [...core, ...datasets, ['validate-engine-battle.mjs', [data]], ['validate-engine-environment.mjs', [data]]];
const results = [];
for (const [script, flags] of suites) {
  console.log(`\n=== ${script} ===`);
  const start = performance.now();
  const result = spawnSync(process.execPath, [resolve(root, 'scripts', script), ...flags], { cwd: root, stdio: 'inherit', timeout: 120000 });
  const passed = result.status === 0 && !result.error;
  if (result.error) console.error(result.error.message);
  if (result.signal) console.error(`Terminated by ${result.signal}`);
  results.push({ script, passed, seconds: ((performance.now() - start) / 1000).toFixed(2) });
}
console.log('\n=== Engine regression summary ===');
for (const r of results) console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.script} (${r.seconds}s)`);
const passed = results.filter(r => r.passed).length;
console.log(`${passed}/${results.length} suites passed`);
process.exitCode = passed === results.length ? 0 : 1;
