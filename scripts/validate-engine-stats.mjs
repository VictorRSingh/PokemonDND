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
  const e = require(join(dir,'core/index.js'));
  for(let l=1;l<=20;l++){assert.equal(e.getProficiencyBonus(l),2+Math.floor((l-1)/4));assert.equal(e.getStabBonus(l),[0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5][l-1]);}
  for(const l of [0,21,1.5,NaN]) assert.throws(()=>e.getProficiencyBonus(l));
  const scores={str:16,dex:12,con:14,int:8,wis:10,cha:10};
  assert.deepEqual(e.getMoveStats(5,scores,['str','dex'],['fire'],'fire'),{ability:'str',modifier:3,recommended:'str',proficiency:3,stab:1,attackBonus:6,damageBonus:4,saveDC:14});
  assert.equal(e.resolveMovePower(scores,['str','dex'],'dex').modifier,1);
  assert.throws(()=>e.resolveMovePower(scores,[])); assert.throws(()=>e.resolveMovePower(scores,['str'],'wis'));
  assert.equal(e.getApplicableStab(20,['fire','flying'],'typeless'),0);
  const die={kind:'die',sides:8};
  assert.equal(e.getLevelHpGain(die,14,'average').gain,7);
  assert.equal(e.getLevelHpGain(die,14,'maximum').gain,10);
  assert.equal(e.getLevelHpGain(die,1,'manual',undefined,1).gain,1);
  assert.throws(()=>e.getLevelHpGain(die,14,'manual',undefined,9));
  assert.throws(()=>e.getLevelHpGain({kind:'special',ruleId:'shedinja'},14,'average'));
  assert.deepEqual(e.getLevelHpGain(die,14,'roll',e.createRandom(42)),e.getLevelHpGain(die,14,'roll',e.createRandom(42)));
  assert.equal(e.getConstitutionHpAdjustment(5,12,14),5); assert.equal(e.getEvolutionHpBonus(10),20);
  const nature=e.applyNature(scores,12,{id:'brave',name:'Brave',abilityScoreModifiers:{str:2,wis:-2},armorClassModifier:0});
  assert.equal(nature.abilityScores.str,18); assert.equal(nature.abilityScores.wis,8); assert.equal(scores.str,16);
  assert.equal(e.getLoyaltyModifiers(5,2).maximumHpBonus,3); assert.equal(e.getLoyaltyModifiers(5,3).maximumHpBonus,5); assert.equal(e.getLoyaltyModifiers(5,-3).obedienceMinimumRoll,16); assert.equal(e.getLoyaltyModifiers(5,3,false).maximumHpBonus,0);
  const stats=e.deriveCombatStats({speciesId:'test',level:5,abilityScores:scores,armorClass:12,maximumHP:30,currentHP:20,loyalty:2},{id:'test',savingThrows:['str']});
  assert.equal(stats.savingThrows.str,7); assert.equal(stats.savingThrows.dex,2); assert.equal(stats.maximumHP,30); assert.ok(Object.isFrozen(stats.savingThrows));
  console.log('Stat calculations passed');
} finally { rmSync(dir,{recursive:true,force:true}); }
