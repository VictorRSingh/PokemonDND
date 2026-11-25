import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const dir=mkdtempSync(join(tmpdir(),'battle-'));const require=createRequire(import.meta.url);
try{
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--strict','--skipLibCheck','--target','es2020','--module','commonjs','--outDir',dir,'src/engine/core/index.ts','src/engine/data/index.ts','src/engine/core/prototype.ts','src/engine/core/roster-prototype.ts','src/engine/core/tactical-prototype.ts'],{stdio:'inherit'});
const e=require(join(dir,'core/index.js')),d=require(join(dir,'data/index.js'));
const path=process.argv[2]??'public/data';const read=n=>JSON.parse(readFileSync(join(path,n+'.json'),'utf8'));const registry=d.createGameDataRegistry(read('pokemon_master_list'),read('move_list'),read('nature_list'));
assert.equal(e.resolveAttack(e.recordManualD20(30,[1]),1).hit,false);assert.equal(e.resolveAttack(e.recordManualD20(0,[19]),30,19).critical,false);assert.equal(e.resolveAttack(e.recordManualD20(0,[20]),30).critical,true);assert.equal(e.resolveSave(e.recordManualD20(0,[20]),21).success,false);
const rng=e.createRandom(42);assert.equal(e.resolveDamage({count:1,sides:6,modifier:0},3,2,true,rng,{manual:[[4,5]]}).amount,24);
let s=e.createEncounter('test','wild',e.campaignBattleRules({defaultActivePokemonLimit:1},'casual',{rollMode:'manual',abilities:false,trackPP:true}),42);
for(const [id,speciesId,moveId] of [['a','charmander','ember'],['b','bulbasaur','tackle']]){const sp=registry.getSpecies(speciesId);const p={id,speciesId,level:5,xp:0,abilityScores:sp.abilityScores,armorClass:sp.armorClass,maximumHP:20,currentHP:20,learnedMoves:[{moveId,pp:{kind:'limited',remaining:3}}]};s=e.registerCombatant(s,{...p,kind:'pokemon',sideId:id,name:sp.name,speed:sp.speed,temporaryHP:0,deployment:'active',volatile:[],pokemon:p},s.version);}
s=e.startEncounter(s,s.version,{a:20,b:1}).state;const before=s;assert.throws(()=>e.useBattleMove(s,s.version,registry,{actorId:'a',targetId:'b',moveId:'unknown'}));const r=e.useBattleMove(s,s.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualAttack:[20],manualDamage:[[12,12]]});assert.equal(r.state.status,'completed');assert.equal(r.outcome.winner,'a');assert.equal(r.state.combatants[0].pokemon.learnedMoves[0].pp.remaining,2);assert.equal(before.combatants[1].currentHP,20);assert.equal(r.state.version,before.version+1);const manual=e.resolveManualDamage(before,before.version,'b',20,'DM ruling','dm');assert.equal(manual.state.status,'completed');assert.equal(manual.event.operatorId,'dm');assert.throws(()=>e.resolveManualDamage(before,before.version-1,'b',1,'test','dm'));assert.throws(()=>e.resolveManualDamage(before,before.version,'b',1,'','dm'));assert.equal(before.combatants[1].currentHP,20);
let sw=e.createEncounter('switch','wild',e.createRulesetSnapshot('casual',{rollMode:'manual'}),42);const a=before.combatants[0],b=before.combatants[1];sw=e.registerCombatant(sw,{...a,id:'trainer',kind:'trainer'},sw.version);sw=e.registerCombatant(sw,{...a,trainerId:'trainer'},sw.version);sw=e.registerCombatant(sw,{...a,id:'reserve',trainerId:'trainer',deployment:'recalled'},sw.version);sw=e.registerCombatant(sw,b,sw.version);sw=e.startEncounter(sw,sw.version,{trainer:20,b:1}).state;assert.throws(()=>e.switchBattlePokemon(sw,sw.version,'a','reserve'));sw=e.resolveManualDamage(sw,sw.version,'a',20,'faint','dm').state;const switched=e.switchBattlePokemon(sw,sw.version,'a','reserve');assert.equal(switched.combatants.find(c=>c.id==='reserve').deployment,'active');assert.equal(switched.combatants.find(c=>c.id==='a').deployment,'recalled');assert.equal(switched.version,sw.version+1);assert.equal(switched.turn.resources.actionAvailable,true);assert.equal(e.paralysisBlocksTurn(1),true);assert.equal(e.paralysisBlocksTurn(4),false);assert.throws(()=>e.paralysisBlocksTurn(5));assert.equal(e.sleepRecovery(10),false);assert.equal(e.sleepRecovery(11),true);assert.deepEqual(e.confusionOutcome(10,5),{recovered:false,forfeit:true,selfDamage:3});assert.equal(e.confusionOutcome(16,5).recovered,true);const confused={...a,volatile:[{kind:'confused',appliedRound:1}]};assert.equal(e.statusRestrictions(confused).reactions,false);assert.equal(e.statusRestrictions(confused).movementMultiplier,0.5);assert.equal(e.statusRestrictions({...a,nonvolatile:{kind:'frozen',appliedRound:1}}).incapacitated,true);assert.deepEqual(e.statusDisadvantages({...a,nonvolatile:{kind:'paralyzed',appliedRound:1}},'save','dex'),['Paralyzed']);assert.equal(e.frozenRecovery(a,5,20,false).recovered,true);const grid={...before,rules:e.createRulesetSnapshot('classic'),combatants:before.combatants.map((c,i)=>({...c,position:{x:i*5,y:0,elevation:0}})),reactionAvailable:{a:true,b:true}};assert.deepEqual(e.opportunityCandidates(grid,'a',{x:-5,y:0,elevation:0},{b:5}),['b']);assert.deepEqual(e.opportunityCandidates(grid,'a',{x:-5,y:0,elevation:0},{b:5},true),[]);const individual={...sw,rules:{...sw.rules,initiative:'individual',battlefield:'grid'},combatants:sw.combatants.map((c,i)=>({...c,position:{x:i*5,y:0,elevation:0}}))};const replaced=e.switchBattlePokemon(individual,individual.version,'a','reserve');assert.deepEqual(replaced.combatants.find(c=>c.id==='reserve').position,individual.combatants.find(c=>c.id==='a').position);assert.equal(replaced.initiative.some(slot=>slot.combatantIds.includes('reserve')),true);const flinch={...before,combatants:before.combatants.map(c=>c.id==='a'?{...c,volatile:[{kind:'flinched',appliedRound:1}]}:c)};const miss=e.useBattleMove(flinch,flinch.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualAttack:[1,20]});assert.equal(miss.attack.hit,false);assert.equal(miss.attack.roll.condition,'disadvantage');const sleeping={...before,combatants:before.combatants.map(c=>c.id==='a'?{...c,volatile:[{kind:'asleep',appliedRound:1}]}:c)};
const woke=e.advanceBattleTurn(sleeping,sleeping.version,'a',{a:{sleep:11}});assert.equal(woke.combatants[0].volatile.length,0);assert.equal(woke.combatants[0].statusGrace.asleep,1);
const paralyzed={...before,combatants:before.combatants.map(c=>c.id==='b'?{...c,nonvolatile:{kind:'paralyzed',appliedRound:1}}:c)};const blocked=e.advanceBattleTurn(paralyzed,paralyzed.version,'a',{b:{paralysis:1}});assert.equal(e.statusRestrictions(blocked.combatants[1]).incapacitated,true);
const confusedState={...before,combatants:before.combatants.map(c=>c.id==='a'?confused:c)};const self=e.useBattleMove(confusedState,confusedState.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualConfusion:1});assert.equal(self.state.combatants[0].currentHP,17);assert.equal(self.state.combatants[0].pokemon.learnedMoves[0].pp.remaining,3);
const reactionGrid={...grid,rules:{...grid.rules,rollMode:'manual',abilities:false},combatants:grid.combatants.map(c=>({...c,speed:{walking:30}})),turn:{...grid.turn,movementRemaining:{a:30}}};const moved=e.moveWithOpportunity(reactionGrid,reactionGrid.version,registry,'a',{x:-5,y:0,elevation:0},{b:5},[{actorId:'b',moveId:'tackle',manualAttack:[1]}]);assert.equal(moved.state.reactionAvailable.b,false);assert.equal(moved.state.combatants[0].position.x,-5);assert.equal(moved.state.version,reactionGrid.version+1);assert.throws(()=>e.moveWithOpportunity(reactionGrid,reactionGrid.version,registry,'a',{x:-5,y:0,elevation:0},{b:5},[{actorId:'a',moveId:'ember'}]));
// First-turn status initialization uses the same processing as later turns.
function initialStatus(kind, mode='manual', hp=20){let state=e.createEncounter('initial','wild',e.campaignBattleRules({defaultActivePokemonLimit:1},'casual',{rollMode:mode,abilities:false}),42);state=e.registerCombatant(state,{...a,currentHP:hp,nonvolatile:{kind,appliedRound:0}},state.version);state=e.registerCombatant(state,b,state.version);return state;}
const initial=initialStatus('paralyzed');assert.throws(()=>e.startEncounter(initial,initial.version,{a:20,b:1}),/Manual status roll required/);const first=e.startEncounter(initial,initial.version,{a:20,b:1},{a:{paralysis:1}}).state;assert.equal(first.combatants[0].paralysisBlocked,true);assert.equal(first.version,initial.version+1);assert.equal(initial.combatants[0].paralysisBlocked,false);assert.equal(e.startEncounter(initial,initial.version,{a:20,b:1},{a:{paralysis:4}}).state.combatants[0].paralysisBlocked,false);
const burn=initialStatus('burned');assert.equal(e.startEncounter(burn,burn.version,{a:20,b:1}).state.combatants[0].currentHP,17);const lethal=initialStatus('burned','manual',1);const ended=e.startEncounter(lethal,lethal.version,{a:20,b:1}).state;assert.equal(ended.status,'completed');assert.equal(ended.version,lethal.version+1);
for(const mode of ['automatic','digital']){const auto=initialStatus('paralyzed',mode);assert.deepEqual(e.startEncounter(auto,auto.version),e.startEncounter(auto,auto.version));}
// Grace and duration regression: same-round application does not consume a duration.
const fresh=e.applyVolatile(a,'confused','b',1);assert.equal(fresh.volatile[0].remainingRounds,3);
assert.equal(e.applyVolatile(fresh,'confused','b',1),fresh);
const timed={...before,combatants:before.combatants.map(c=>c.id==='a'?fresh:c)};
let clock=e.advanceBattleTurn(timed,timed.version,'a');assert.equal(clock.combatants[0].volatile[0].remainingRounds,3);
for(let i=0;i<3;i++){clock=e.advanceBattleTurn(clock,clock.version,'b');clock=e.advanceBattleTurn(clock,clock.version,'a');if(i<2)assert.equal(clock.combatants[0].volatile[0].remainingRounds,2-i);}
assert.equal(clock.combatants[0].volatile.length,0);assert.equal(clock.combatants[0].statusGrace.confused,1);assert.equal(e.applyVolatile(clock.combatants[0],'confused','b',4),clock.combatants[0]);
clock=e.advanceBattleTurn(clock,clock.version,'b');clock=e.advanceBattleTurn(clock,clock.version,'a');assert.equal(clock.combatants[0].statusGrace.confused,undefined);assert.equal(e.applyVolatile(clock.combatants[0],'confused','b',5).volatile.length,1);
const cleared=e.useBattleMove(confusedState,confusedState.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualConfusion:16,manualAttack:[1]}).state;assert.equal(cleared.combatants[0].statusGrace.confused,2);const afterClear=e.advanceBattleTurn(cleared,cleared.version,'a');assert.equal(afterClear.combatants[0].statusGrace.confused,1);
// Frozen recovery uses STR, source proficiency, and species save proficiency.
const ice={...before,combatants:before.combatants.map(c=>c.id==='a'?{...c,abilityScores:{...c.abilityScores,str:10},nonvolatile:{kind:'frozen',sourceId:'b',appliedRound:1}}:c)};
const proficient=registry.getSpecies(a.pokemon.speciesId).savingThrows.includes('str');
const threshold=10+e.getProficiencyBonus(b.level)-(proficient?e.getProficiencyBonus(a.level):0);
const thaw=(rolls,state=ice)=>e.advanceBattleTurn(state,state.version,'a',{a:rolls},registry);
assert.equal(thaw({frozen:threshold}).combatants[0].nonvolatile,undefined);
assert.equal(thaw({frozen:threshold-1}).combatants[0].nonvolatile.kind,'frozen');
assert.equal(thaw({frozen:threshold}).combatants[0].statusGrace.frozen,1);
assert.throws(()=>thaw({frozen:21}));assert.throws(()=>thaw({}));
assert.equal(thaw({frozen:[1,20],frozenSources:{advantage:['test']}}).combatants[0].nonvolatile,undefined);
const flinchedIce={...ice,combatants:ice.combatants.map(c=>c.id==='a'?{...c,volatile:[{kind:'flinched',appliedRound:1}]}:c)};
assert.equal(thaw({frozen:[1,20]},flinchedIce).combatants[0].nonvolatile.kind,'frozen');
assert.throws(()=>thaw({frozen:20},flinchedIce));
assert.equal(thaw({frozen:20,frozenSources:{advantage:['test']}},flinchedIce).combatants[0].nonvolatile,undefined);
for(const mode of ['automatic','digital']){const state={...ice,rules:{...ice.rules,rollMode:mode}};assert.deepEqual(thaw({},state),thaw({},state));assert.throws(()=>thaw({frozen:20},state));}
// Disengage consumes the action, protects only its actor, and expires on turn change.
const safe=e.disengageBattlePokemon(reactionGrid,reactionGrid.version,'a');
assert.equal(safe.version,reactionGrid.version+1);assert.equal(safe.turn.resources.actionAvailable,false);assert.equal(safe.turn.resources.bonusActionAvailable,true);assert.deepEqual(safe.turn.disengagedIds,['a']);assert.equal(reactionGrid.turn.resources.actionAvailable,true);
assert.deepEqual(e.opportunityCandidates(safe,'a',{x:-5,y:0,elevation:0},{b:5}),[]);
assert.throws(()=>e.disengageBattlePokemon(safe,safe.version,'a'));assert.throws(()=>e.disengageBattlePokemon(reactionGrid,reactionGrid.version,'b'));assert.throws(()=>e.disengageBattlePokemon(reactionGrid,reactionGrid.version-1,'a'));
assert.throws(()=>e.moveWithOpportunity(safe,safe.version,registry,'a',{x:-5,y:0,elevation:0},{b:5},[{actorId:'b',moveId:'tackle',manualAttack:[1]}]));
const safeMove=e.moveWithOpportunity(safe,safe.version,registry,'a',{x:-5,y:0,elevation:0},{b:5},[]);assert.equal(safeMove.reactions.length,0);assert.equal(safeMove.state.reactionAvailable.b,true);assert.equal(safeMove.state.turn.movementRemaining.a,25);
assert.equal(e.moveOnGrid(safe,safe.version,'a',{x:-5,y:0,elevation:0}).combatants[0].position.x,-5);
const nextSafe=e.advanceBattleTurn(safeMove.state,safeMove.state.version,'a');assert.equal(nextSafe.turn.disengagedIds,undefined);
assert.throws(()=>e.disengageBattlePokemon(sleeping,sleeping.version,'a'));
for(const mode of ['automatic','digital']){const state={...reactionGrid,rules:{...reactionGrid.rules,rollMode:mode}};assert.equal(e.disengageBattlePokemon(state,state.version,'a').turn.resources.actionAvailable,false);}
// Path enters reach, then leaves it; endpoint-only detection would miss this.
const pos=(x,y=0)=>({x,y,elevation:0});
const pathGrid={...reactionGrid,combatants:reactionGrid.combatants.map(c=>c.id==='a'?{...c,position:pos(-5)}:c)};
const route=[pos(0),pos(0,5),pos(0,10)];
const traversal=e.moveWithOpportunity(pathGrid,pathGrid.version,registry,'a',route[2],{b:5},[{actorId:'b',moveId:'tackle',manualAttack:[1]}],route);
assert.equal(traversal.reactions.length,1);assert.equal(traversal.state.turn.movementRemaining.a,15);assert.deepEqual(traversal.state.combatants[0].position,route[2]);assert.equal(traversal.state.version,pathGrid.version+1);
const fragile={...pathGrid,combatants:pathGrid.combatants.map(c=>c.id==='a'?{...c,currentHP:1}:c)};
const stopped=e.moveWithOpportunity(fragile,fragile.version,registry,'a',route[2],{b:5},[{actorId:'b',moveId:'tackle',manualAttack:[20],manualDamage:[[10,10]]}],route);
assert.equal(stopped.state.status,'completed');assert.deepEqual(stopped.state.combatants[0].position,route[1]);assert.equal(stopped.state.version,fragile.version+1);
assert.throws(()=>e.moveWithOpportunity(pathGrid,pathGrid.version,registry,'a',route[2],{b:5},[],[route[2]]),/adjacent/);
assert.throws(()=>e.moveWithOpportunity(pathGrid,pathGrid.version,registry,'a',pos(5),{b:5},[],[pos(0),pos(5)]),/Occupied/);
assert.throws(()=>e.moveWithOpportunity(pathGrid,pathGrid.version,registry,'a',route[2],{b:5},[],[route[0]]),/destination/);
assert.deepEqual(pathGrid.combatants[0].position,pos(-5));
// Expanded melee reactions use normal PP and preserve the mover's action.
for(const moveId of ['pound','peck','wing-attack','cut','struggle']){
 const state={...reactionGrid,combatants:reactionGrid.combatants.map(c=>c.id==='b'?{...c,pokemon:{...c.pokemon,learnedMoves:[{moveId,pp:{kind:'limited',remaining:3}}]}}:c)};
 const result=e.moveWithOpportunity(state,state.version,registry,'a',pos(-5),{},[{actorId:'b',moveId,manualAttack:[1]}]);
 assert.equal(result.reactions.length,1);assert.equal(result.state.reactionAvailable.b,false);assert.equal(result.state.turn.resources.actionAvailable,true);
 assert.equal(result.state.combatants[1].pokemon.learnedMoves[0].pp.remaining,moveId==='struggle'?3:2);
}
for(const moveId of ['vine-whip','water-gun','ember','quick-attack']){
 const state={...reactionGrid,combatants:reactionGrid.combatants.map(c=>c.id==='b'?{...c,pokemon:{...c.pokemon,learnedMoves:[{moveId,pp:{kind:'limited',remaining:3}}]}}:c)};
 assert.throws(()=>e.moveWithOpportunity(state,state.version,registry,'a',pos(-5),{},[{actorId:'b',moveId,manualAttack:[1]}]));
}
assert.throws(()=>e.moveWithOpportunity(reactionGrid,reactionGrid.version,registry,'a',pos(-5),{b:10},[]),/reach/);
// Forced replacement preserves spent resources and validates trainer range.
assert.deepEqual(e.faintedReplacementOptions(sw,'a'),['reserve']);
assert.throws(()=>e.advanceBattleTurn(sw,sw.version,'a'),/replacement/);
const spent={...sw,turn:{...sw.turn,resources:{actionAvailable:false,bonusActionAvailable:false}}};
const free=e.switchBattlePokemon(spent,spent.version,'a','reserve');
assert.deepEqual(free.turn.resources,spent.turn.resources);assert.equal(free.turn.movementRemaining.reserve,0);
assert.equal(free.reactionAvailable.reserve,false);assert.equal(free.version,spent.version+1);
const far={...individual,rules:{...individual.rules,trainerParticipation:true},combatants:individual.combatants.map(c=>c.id==='a'?{...c,position:pos(65)}:c)};
assert.deepEqual(e.faintedReplacementOptions(far,'a'),[]);
assert.throws(()=>e.switchBattlePokemon(far,far.version,'a','reserve',pos(10)),/range/);
const near={...far,combatants:far.combatants.map(c=>c.id==='a'?{...c,position:pos(60)}:c)};
assert.throws(()=>e.switchBattlePokemon(near,near.version,'a','reserve',pos(20)),/range/);
const released=e.switchBattlePokemon(near,near.version,'a','reserve',pos(10));
assert.deepEqual(released.combatants.find(c=>c.id==='reserve').position,pos(10));
assert.deepEqual(e.faintedReplacementOptions(released,'a'),[]);
// Voluntary switching uses the same recall/release range as forced replacement.
const voluntary={...near,turn:{...near.turn,round:2},combatants:near.combatants.map(c=>c.id==='a'?{...c,currentHP:10}:c)};
const voluntaryResult=e.switchBattlePokemon(voluntary,voluntary.version,'a','reserve',pos(15,5));
assert.equal(voluntaryResult.turn.resources.actionAvailable,false);
assert.equal(voluntaryResult.turn.resources.bonusActionAvailable,true);
assert.equal(voluntaryResult.version,voluntary.version+1);
assert.deepEqual(voluntaryResult.combatants.find(c=>c.id==='reserve').position,pos(15,5));
assert.equal(voluntary.combatants.find(c=>c.id==='a').deployment,'active');
assert.throws(()=>e.switchBattlePokemon(voluntary,voluntary.version,'a','reserve',pos(20)),/range/);
assert.throws(()=>e.switchBattlePokemon(voluntary,voluntary.version,'a','reserve',pos(0)),/unavailable/);
assert.throws(()=>e.switchBattlePokemon(voluntary,voluntary.version,'a','reserve',pos(NaN)),/unavailable/);
const voluntaryFar={...voluntary,combatants:voluntary.combatants.map(c=>c.id==='a'?{...c,position:pos(65)}:c)};
assert.throws(()=>e.switchBattlePokemon(voluntaryFar,voluntaryFar.version,'a','reserve',pos(15,5)),/range/);
assert.throws(()=>e.switchBattlePokemon({...voluntary,turn:{...voluntary.turn,round:1}},voluntary.version,'a','reserve',pos(15,5)),/Switch unavailable/);
assert.throws(()=>e.switchBattlePokemon({...voluntary,turn:{...voluntary.turn,resources:{...voluntary.turn.resources,actionAvailable:false}}},voluntary.version,'a','reserve',pos(15,5)),/spent/);
// Recall preserves persistent conditions and pauses their clocks; a partial turn is not a full status turn.
const lifecycle={...voluntary,combatants:voluntary.combatants.map(c=>c.id==='a'?{...c,nonvolatile:{kind:'burned',appliedRound:1},volatile:[{kind:'asleep',appliedRound:1,remainingRounds:2},{kind:'confused',appliedRound:1},{kind:'flinched',appliedRound:1}],paralysisBlocked:true,actionForfeited:true}:c.id==='reserve'?{...c,nonvolatile:{kind:'poisoned',appliedRound:1},volatile:[{kind:'asleep',appliedRound:1,remainingRounds:2}],statusGrace:{confused:2},paralysisBlocked:true,actionForfeited:true}:c)};
const deployed=e.switchBattlePokemon(lifecycle,lifecycle.version,'a','reserve',pos(15,5));
const get=(state,id)=>state.combatants.find(c=>c.id===id);
assert.equal(get(deployed,'a').nonvolatile.kind,'burned');assert.deepEqual(get(deployed,'a').volatile.map(x=>x.kind),['asleep']);
assert.equal(get(deployed,'reserve').paralysisBlocked,false);assert.equal(get(deployed,'reserve').actionForfeited,false);assert.deepEqual(deployed.turn.releasedIds,['reserve']);
const partial=e.advanceBattleTurn(deployed,deployed.version,'reserve');
assert.equal(get(partial,'reserve').currentHP,get(deployed,'reserve').currentHP);assert.equal(get(partial,'reserve').volatile[0].remainingRounds,2);assert.equal(get(partial,'reserve').statusGrace.confused,2);assert.equal(partial.turn.releasedIds,undefined);
const full=e.advanceBattleTurn(partial,partial.version,'b');
const afterFull=e.advanceBattleTurn(full,full.version,'reserve',{reserve:{sleep:1}});
assert.equal(get(afterFull,'reserve').currentHP,get(deployed,'reserve').currentHP-3);assert.equal(get(afterFull,'reserve').volatile[0].remainingRounds,1);assert.equal(get(afterFull,'reserve').statusGrace.confused,1);assert.equal(get(afterFull,'a').currentHP,get(deployed,'a').currentHP);assert.equal(get(afterFull,'a').volatile[0].remainingRounds,2);
// Terminal outcomes are persisted and disable all reactions.
assert.deepEqual(r.state.result,{kind:'victory',winner:'a'});
assert.equal(r.state.turn,undefined);
assert.ok(Object.values(r.state.reactionAvailable).every(x=>!x));
assert.throws(()=>e.advanceBattleTurn(r.state,r.state.version,'a'));
assert.throws(()=>e.resolveManualDamage(r.state,r.state.version,'a',1,'test','dm'));
const drawState={...before,combatants:before.combatants.map(c=>({...c,currentHP:0}))};
const draw=e.advanceBattleTurn(drawState,drawState.version,'a');
assert.deepEqual(draw.result,{kind:'draw',winner:null});
assert.equal(draw.version,drawState.version+1);
assert.deepEqual(e.battleOutcome(draw),{finished:true,winner:null});
const terminated=e.completeEncounter(before,before.version);
assert.deepEqual(terminated.result,{kind:'terminated',winner:null});
assert.deepEqual(e.battleOutcome(terminated),{finished:true,winner:null});
const reserveAlive={...before,combatants:[...before.combatants.map(c=>c.id==='b'?{...c,currentHP:0}:c),{...before.combatants[1],id:'b-reserve',deployment:'recalled'}]};
assert.equal(e.battleOutcome(reserveAlive).finished,false);
// Ability framework: opt-out, unsupported fallback, hook dispatch and immutable registry.
const abilityId='unsupported-test';
const owner={...a,pokemon:{...a.pokemon,abilityId}};
const abilityState={...before,rules:{...before.rules,abilities:true},combatants:[owner,b]};
const context={hook:'before-attack',state:abilityState,owner,counterpart:b,moveId:'ember'};
assert.equal(e.evaluateAbility(context,registry)[0].kind,'manual');
assert.deepEqual(e.evaluateAbility({...context,state:before},registry),[]);
assert.throws(()=>e.useBattleMove(abilityState,abilityState.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualAttack:[1]}),/Unsupported ability/);
const handler={id:'blaze',hooks:['before-attack'],execute:(ctx,definition)=>[{kind:'note',message:definition.id+':'+ctx.moveId}]};
const effects=e.createAbilityEffectRegistry([handler]);
assert.deepEqual(e.evaluateAbility({...context,owner:{...owner,pokemon:{...owner.pokemon,abilityId:'blaze'}}},registry,effects),[{kind:'note',message:'blaze:ember'}]);
assert.deepEqual(e.evaluateAbility({...context,hook:'turn-end',owner:{...owner,pokemon:{...owner.pokemon,abilityId:'blaze'}}},registry,effects),[]);
assert.throws(()=>e.createAbilityEffectRegistry([handler,handler]));
assert.equal(Object.isFrozen(effects.get('blaze').hooks),true);
assert.deepEqual(e.evaluateAbility({...context,owner:{...owner,deployment:'recalled'}},registry,effects),[]);
// Passive abilities: use actual species definitions, not invented ability ownership.
const passiveOwner=(speciesId,abilityId)=>({...b,pokemon:{...b.pokemon,speciesId,abilityId}});
const fat=passiveOwner('snorlax','thick-fat');
const fatState={...abilityState,combatants:[a,fat]};
assert.deepEqual(e.evaluateAbility({hook:'before-damage',state:fatState,owner:fat,damageType:'fire'},registry),[{kind:'damage-multiplier',multiplier:0.5}]);
const fireInput={actorId:'a',targetId:'b',moveId:'ember',manualAttack:[19],manualDamage:[[8]]};
const fatHit=e.useBattleMove(fatState,fatState.version,registry,fireInput);
const plainHit=e.useBattleMove({...fatState,rules:{...fatState.rules,abilities:false}},fatState.version,registry,fireInput);
assert.equal(fatHit.amount,Math.floor(plainHit.amount/2));
assert.equal(fatHit.damage.amount,fatHit.amount);
const veil=passiveOwner('goldeen','water-veil');
assert.equal(e.applyNonvolatile(veil,'burned','a',1,registry,abilityState),veil);
assert.equal(e.applyNonvolatile(veil,'burned','a',1,registry,before).nonvolatile.kind,'burned');
const tempo=passiveOwner('slowpoke','own-tempo');
assert.equal(e.applyVolatile(tempo,'confused','a',1,abilityState,registry),tempo);
const levitate=passiveOwner('gastly','levitate');
assert.deepEqual(e.evaluateAbility({hook:'before-damage',state:abilityState,owner:levitate,damageType:'ground'},registry),[{kind:'damage-multiplier',multiplier:0}]);
// Triggered abilities resolve before battle outcome and preserve input state.
const meleeActor={...a,pokemon:{...a.pokemon,learnedMoves:[{moveId:'tackle',pp:{kind:'limited',remaining:3}}]}};
const meleeInput={actorId:'a',targetId:'b',moveId:'tackle',manualAttack:[19],manualDamage:[[4]],manualAbility:4};
for(const [speciesId,id] of [['pikachu','static'],['carvanha','rough-skin'],['ferroseed','iron-barbs']]){
 const state={...abilityState,combatants:[meleeActor,passiveOwner(speciesId,id)]};
 const hit=e.useBattleMove(state,state.version,registry,meleeInput);
 assert.equal(hit.abilityEvents[0].abilityId,id);assert.equal(hit.abilityEvents[0].amount,3);
 assert.equal(hit.state.combatants[0].currentHP,17);assert.equal(state.combatants[0].currentHP,20);
 assert.equal(e.useBattleMove(state,state.version,registry,{...meleeInput,manualAbility:1}).abilityEvents[0].amount,0);
 assert.throws(()=>e.useBattleMove(state,state.version,registry,{...meleeInput,manualAbility:5}));
 assert.equal(e.useBattleMove(state,state.version,registry,{...meleeInput,manualAttack:[1]}).abilityEvents.length,0);
 if(id!=='static')assert.equal(e.useBattleMove(state,state.version,registry,{...meleeInput,declineAbility:true}).abilityEvents.length,0);
}
const aftermathState={...abilityState,combatants:[{...meleeActor,currentHP:1},{...passiveOwner('drifloon','aftermath'),currentHP:1}]};
// Drifloon is immune to Normal, so use a non-ghost Aftermath owner.
const blastState={...aftermathState,combatants:[aftermathState.combatants[0],{...passiveOwner('stunky','aftermath'),currentHP:1}]};
const blast=e.useBattleMove(blastState,blastState.version,registry,meleeInput);
assert.equal(blast.abilityEvents[0].amount,Math.floor(blast.amount/2));assert.equal(blast.state.result.kind,'draw');
// Phase 5.12: replay a complete campaign-linked encounter using only public commands.
function campaignReplay(mode, seed, checkpoint=false){
 const settings={defaultActivePokemonLimit:1,battleRules:e.createRulesetSnapshot('casual',{rollMode:mode,abilities:false,trackPP:true})};
 let state=e.createCampaignEncounter({id:'campaign-ready',status:'active',settings},'replay','wild',seed);
 const trace=[];
 const record=()=>{trace.push(JSON.parse(JSON.stringify(state)));if(checkpoint)state=JSON.parse(JSON.stringify(state));};
 for(const c of [a,b]) state=e.registerCombatant(state,{...c,pokemon:{...c.pokemon,learnedMoves:[{moveId:'tackle',pp:{kind:'limited',remaining:20}}]}},state.version);
 record();
 state=e.startEncounter(state,state.version,mode==='manual'?{a:20,b:1}:undefined).state;record();
 for(let step=0;state.status==='active'&&step<40;step++){
  const actorId=state.initiative[state.turn.slotIndex].combatantIds[0],targetId=actorId==='a'?'b':'a';
  const prior=state, snapshot=JSON.stringify(prior);
  const input={actorId,targetId,moveId:'tackle',...(mode==='manual'?{manualAttack:[19],manualDamage:[[4]]}:{})};
  assert.throws(()=>e.useBattleMove(prior,prior.version-1,registry,input));
  state=e.useBattleMove(prior,prior.version,registry,input).state;
  assert.equal(JSON.stringify(prior),snapshot);assert.equal(state.version,prior.version+1);record();
  if(state.status==='active'){assert.throws(()=>e.useBattleMove(state,state.version,registry,input));state=e.advanceBattleTurn(state,state.version,actorId,{},registry);record();}
 }
 assert.equal(state.status,'completed');assert.equal(state.result.kind,'victory');assert.equal(state.campaignId,'campaign-ready');
 assert.equal(state.turn,undefined);assert.ok(Object.values(state.reactionAvailable).every(x=>!x));
 assert.throws(()=>e.advanceBattleTurn(state,state.version,'a'));
 return trace;
}
for(const mode of ['automatic','digital','manual']){
 const trace=campaignReplay(mode,42);
 assert.deepEqual(campaignReplay(mode,42),trace);
 assert.deepEqual(campaignReplay(mode,42,true),trace);
}
assert.notDeepEqual(campaignReplay('automatic',42),campaignReplay('automatic',43));
console.log('Campaign end-to-end and deterministic replay passed');
const proto=require(join(dir,'core/prototype.js'));
assert.ok(proto.prototypeChoices(registry).some(x=>x.id==='charmander'));
let demo=proto.startPrototype(e.createCampaignEncounter({id:'demo',status:'active',settings:{defaultActivePokemonLimit:1}},'demo','wild',42),registry,['charmander','bulbasaur']).state;
for(let i=0;i<100&&demo.status==='active';i++){const actor=demo.combatants.find(c=>c.id===demo.initiative[demo.turn.slotIndex].combatantIds[0]);const move=actor.pokemon.learnedMoves.find(m=>m.pp.kind==='unlimited'||m.pp.remaining>0)?.moveId??'struggle';demo=proto.prototypeAction(demo,registry,move).state;if(demo.status==='active')demo=proto.prototypeAction(demo,registry).state;}
assert.equal(demo.status,'completed');
const rosterProto=require(join(dir,'core/roster-prototype.js'));
const saved={id:'saved-1',trainerId:'trainer-1',trainerName:'Ash',name:'Charmander',number:4,data:{given_name:'Flame',current_level:5,level:1,armor_class:14,hit_points:40,current_hit_points:27,stats:Object.fromEntries(Object.entries(registry.getSpecies('charmander').abilityScores).map(([k,value])=>[k,{value}])),selected_moves:['Scratch','Ember'],selected_ability:'Blaze'}};
const setup=e.createCampaignEncounter({id:'demo',status:'active',settings:{defaultActivePokemonLimit:1}},'roster','wild',42);
const rosterState=rosterProto.startRosterPrototype(setup,registry,saved,'bulbasaur').state;
const flame=rosterState.combatants.find(c=>c.id===saved.id);
assert.equal(flame.name,'Flame');assert.equal(flame.level,5);assert.equal(flame.currentHP,27);assert.equal(flame.maximumHP,40);assert.equal(flame.armorClass,14);assert.equal(flame.pokemon.abilityId,'blaze');assert.equal(flame.pokemon.learnedMoves.length,2);
assert.throws(()=>rosterProto.startRosterPrototype(setup,registry,saved,saved));
assert.throws(()=>rosterProto.startRosterPrototype(setup,registry,{...saved,data:{...saved.data,current_hit_points:0}},'bulbasaur'));
assert.equal(saved.data.current_hit_points,27);
// Starter abilities must not block ordinary attacks, and only double matching STAB below 25%.
for(const [id,type,speciesId] of [['blaze','fire','charmander'],['overgrow','grass','bulbasaur'],['torrent','water','squirtle']]){
 const p={...a,pokemon:{...a.pokemon,speciesId,abilityId:id}};
 for(const [hp,expected] of [[4,true],[5,false],[20,false]]){
  const ctx={hook:'before-attack',state:abilityState,owner:{...p,currentHP:hp},damageType:type};
  assert.equal(e.evaluateAbility(ctx,registry).some(x=>x.kind==='double-stab'),expected);
  assert.deepEqual(e.evaluateAbility({...ctx,damageType:'normal'},registry),[]);
 }
}
const boostedState={...before,rules:{...before.rules,abilities:true},combatants:[{...a,currentHP:4,pokemon:{...a.pokemon,abilityId:'blaze'}},b]};
const boosted=e.useBattleMove(boostedState,boostedState.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualAttack:[15],manualDamage:[[1]]});
const normal=e.useBattleMove({...boostedState,rules:{...boostedState.rules,abilities:false}},boostedState.version,registry,{actorId:'a',targetId:'b',moveId:'ember',manualAttack:[15],manualDamage:[[1]]});
assert.equal(boosted.damage.subtotal-normal.damage.subtotal,e.getStabBonus(a.level));
let live=rosterState;
for(let i=0;i<100&&live.status==='active';i++){const actor=live.combatants.find(c=>c.kind==='pokemon'&&c.currentHP>0&&live.initiative[live.turn.slotIndex].combatantIds.includes(c.id));if(!actor){live=proto.prototypeAction(live,registry).state;continue;}const move=actor.pokemon.learnedMoves.find(m=>e.supportedBattleMoves().includes(m.moveId)&&m.pp.remaining>0)?.moveId??'struggle';live=proto.prototypeAction(live,registry,move,actor.id).state;if(live.status==='active')live=proto.prototypeAction(live,registry).state;}
assert.equal(live.status,'completed');
const groupSetup={...setup,rules:{...setup.rules,battlefield:'arena',activePokemonLimit:2}};
const group=rosterProto.startGroupPrototype(groupSetup,registry,[[saved,'charmander'],['bulbasaur','bulbasaur']]).state;
assert.equal(group.combatants.length,5);
assert.ok(group.initiative.some(s=>s.combatantIds.includes(saved.id)&&s.combatantIds.includes('trainer-'+saved.trainerId)));
assert.throws(()=>rosterProto.startGroupPrototype(groupSetup,registry,[[saved],[saved]]));
let g=group;for(let i=0;i<10&& !g.initiative[g.turn.slotIndex].combatantIds.includes(saved.id);i++)g=proto.prototypeAction(g,registry).state;
assert.ok(g.initiative[g.turn.slotIndex].combatantIds.includes(saved.id));
assert.throws(()=>proto.prototypeAction(g,registry,'scratch',saved.id,saved.id));
const foe=g.combatants.find(c=>c.sideId==='side-1');
const hit=proto.prototypeAction(g,registry,'scratch',saved.id,foe.id).state;
assert.equal(hit.turn.resources.actionAvailable,false);
assert.throws(()=>proto.prototypeAction(hit,registry,'scratch',saved.id,foe.id));
const tactical=require(join(dir,'core/tactical-prototype.js'));
assert.equal(e.battleMoveRange(registry,flame,'scratch'),5);
assert.equal(e.battleMoveRange(registry,flame,'ember'),60);
const step=tactical.tacticalStep(reactionGrid,registry,'a',{x:-5,y:0,elevation:0},true);
assert.equal(step.state.turn.movementRemaining.a,25);
assert.equal(step.state.combatants[0].position.x,-5);
assert.throws(()=>tactical.tacticalStep(reactionGrid,registry,'a',{x:5,y:0,elevation:0},true),/Occupied/);
assert.throws(()=>tactical.tacticalStep(reactionGrid,registry,'a',{x:-5,y:0,elevation:0}),/Opportunity/);
assert.equal(reactionGrid.combatants[0].position.x,0);
console.log('Tactical movement and range validation passed');
console.log('Group initiative and target validation passed');
console.log('Starter ability and roster battle validation passed');
console.log('Roster snapshot validation passed');
console.log('Prototype battle passed');
console.log('Battle integration passed');
}finally{rmSync(dir,{recursive:true,force:true});}
