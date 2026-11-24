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
  const {createRandom, parseDiceExpression: parse, formatDiceExpression: format, rollDice, recordManualRoll} = require(join(dir, 'core/index.js'));
  assert.deepEqual(parse('2d6 + 3'), {count:2,sides:6,modifier:3});
  assert.equal(format(parse('D20')), '1d20');
  assert.equal(format(parse('4d8-2')), '4d8-2');
  for(const input of ['0d6','1d1','1001d6','2d6+','2d6+1d4','2.5d6','1d6+9007199254740991']) assert.throws(()=>parse(input));
  const a=createRandom(42), b=createRandom(42);
  for(let i=0;i<1000;i++) { const r=rollDice(parse('2d6+3'),a); assert.deepEqual(r,rollDice(parse('2d6+3'),b)); assert.ok(r.total>=5 && r.total<=15); }
  const values=[2,5]; const r=recordManualRoll(parse('2d6-3'),values); assert.equal(r.total,4); assert.equal(r.mode,'manual'); values[0]=6; assert.equal(r.rolls[0],2); assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.rolls)&&Object.isFrozen(r.expression));
  for(const values of [[1],[0,2],[7,2],[1.5,2],Array(2)]) assert.throws(()=>recordManualRoll(parse('2d6'),values));
  assert.equal(rollDice(parse('1d20'),{nextInt:()=>20},'digital').total,20);
  assert.throws(()=>rollDice(parse('1d20'),{nextInt:()=>21}));
  const before=a.snapshot(); assert.throws(()=>rollDice({count:0,sides:6,modifier:0},a)); assert.equal(a.snapshot(),before);
  console.log(JSON.stringify({parsing:'passed',determinism:'passed',manual:'passed',validation:'passed',immutability:'passed',result:'passed'},null,2));
} finally { rmSync(dir,{recursive:true,force:true}); }
