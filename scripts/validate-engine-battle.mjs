import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const dir=mkdtempSync(join(tmpdir(),'battle-'));const require=createRequire(import.meta.url);
try{
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--strict','--skipLibCheck','--target','es2020','--module','commonjs','--outDir',dir,'src/engine/core/index.ts','src/engine/data/index.ts'],{stdio:'inherit'});
const e=require(join(dir,'core/index.js')),d=require(join(dir,'data/index.js'));
const path=process.argv[2]??'public/data';const read=n=>JSON.parse(readFileSync(join(path,n+'.json'),'utf8'));const registry=d.createGameDataRegistry(read('pokemon_master_list'),read('move_list'),read('nature_list'));
assert.equal(e.resolveAttack(e.recordManualD20(30,[1]),1).hit,false);assert.equal(e.resolveAttack(e.recordManualD20(0,[19]),30,19).critical,false);assert.equal(e.resolveAttack(e.recordManualD20(0,[20]),30).critical,true);assert.equal(e.resolveSave(e.recordManualD20(0,[20]),21).success,false);
const rng=e.createRandom(42);assert.equal(e.resolveDamage({count:1,sides:6,modifier:0},3,2,true,rng,{manual:[[4,5]]}).amount,24);
let s=e.createEncounter('test','wild',e.campaignBattleRules({defaultActivePokemonLimit:1},'casual',{rollMode:'manual',abilities:false,trackPP:true}),42);
for(const [id,speciesId,moveId] of [['a','charmander','ember'],['b','bulbasaur','tackle']]){const sp=registry.getSpecies(speciesId);const p={id,speciesId,level:5,xp:0,abilityScores:sp.abilityScores,armorClass:sp.armorClass,maximumHP:20,currentHP:20,learnedMoves:[{moveId,pp:{kind:'limited',remaining:3}}]};s=e.registerCombatant(s,{...p,kind:'pokemon',sideId:id,name:sp.name,speed:sp.speed,temporaryHP:0,deployment:'active',volatile:[],pokemon:p},s.version);}
s=e.startEncounter(s,s.version,{a:20,b:1}).state;const before=s;assert.throws(()=>e.useBattleMove(s,s.version,registry,{actorId:'a',targetId:'b',moveId:'unknown'}));const r=e.useBattleMove(s,s.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualAttack:[20],manualDamage:[[12,12]]});assert.equal(r.state.status,'completed');assert.equal(r.outcome.winner,'a');assert.equal(r.state.combatants[0].pokemon.learnedMoves[0].pp.remaining,2);assert.equal(before.combatants[1].currentHP,20);assert.equal(r.state.version,before.version+1);console.log('Battle integration passed');
}finally{rmSync(dir,{recursive:true,force:true});}
