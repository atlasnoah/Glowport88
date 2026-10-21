'use strict';
const assert=require('node:assert/strict');
global.window={};require('../Glowport88/assets/mission-engine.js');const Engine=window.GlowportMissionEngine;
let checks=0;function check(name,fn){fn();checks++;console.log('PASS mission engine:',name)}
const defs=[
 {id:'m01',title:'First transmission',kind:'main',act:1,stages:[
  {id:'visit',type:'go',label:'Meet Vee',checkpoint:true,reward:{cash:5}},
  {id:'guards',type:'combat',label:'Defeat the enforcers',checkpoint:true,timeLimit:5},
  {id:'decision',type:'choice',label:'Choose the broadcast',choices:[{label:'Expose Meridian',flag:'broadcast',value:'truth',ending:'city',nextStage:'complete',reward:{cash:50},relationships:{vee:1}},{label:'Sell the tape',flag:'broadcast',value:'sale',ending:'empire',nextStage:'complete'}]}
 ],reward:{cash:100,reputation:2}},
 {id:'m02',title:'After the broadcast',kind:'main',requires:['m01'],stages:[{type:'go',label:'Reach home'}],reward:{cash:25}},
 {id:'event-wallet',title:'Found wallet',kind:'event',repeatable:true,stages:[{type:'interact',label:'Return the wallet',reward:{cash:10}}],reward:{cash:20,reputation:1}}
];
const evaluate=(stage,active,s)=>({complete:stage.type==='go'?s.at==='hotel':stage.type==='combat'?s.enemies===0:stage.type==='interact'?s.interact===true:false,progress:s.progress,failed:s.dead===true,reason:'Player incapacitated'});
check('prerequisites and active mission exclusivity',()=>{
 const e=new Engine(defs,{evaluate});assert.equal(e.start('m02'),false);assert.equal(e.start('unknown'),false);assert.equal(e.start('m01'),true);assert.equal(e.start('m01'),false);assert.equal(e.start('event-wallet'),false);assert.deepEqual(e.consumeEvents().map(v=>v.type),['mission-start','stage-start']);assert.equal(e.currentDefinition().title,'First transmission');assert.equal(e.getHUD().objective,'Meet Vee');
});
check('actual evaluator conditions and strict deadline',()=>{
 const e=new Engine(defs,{evaluate});e.start('m01');e.consumeEvents();e.tick(1,{at:'elsewhere',progress:'0/1'});assert.equal(e.state.active.stage,0);assert.equal(e.getHUD().progress,'0/1');e.tick(1,{at:'hotel'});assert.equal(e.state.active.stage,1);assert.equal(e.state.active.checkpoint,1);assert.equal(e.state.active.stageElapsed,0);e.consumeEvents();e.tick(5,{enemies:0});assert.equal(e.state.active.status,'failed');assert.equal(e.state.active.failures,1);assert.match(e.state.active.reason,/time limit/);assert.equal(e.consumeEvents().filter(v=>v.type==='mission-failed').length,1);e.tick(20,{enemies:0});assert.equal(e.consumeEvents().length,0);assert.equal(e.completeStage(),false);
});
check('checkpoint retry clears objective data but retains failures',()=>{
 const e=new Engine(defs,{evaluate});e.start('m01');e.tick(1,{at:'hotel'});e.state.active.data={spawned:true,enemiesDefeated:1};e.fail('Getaway destroyed');e.consumeEvents();const elapsed=e.state.active.elapsed;assert(e.retry());assert.equal(e.state.active.stage,1);assert.equal(e.state.active.status,'active');assert.equal(e.state.active.stageElapsed,0);assert.equal(e.state.active.elapsed,elapsed);assert.deepEqual(e.state.active.data,{});assert.equal(e.state.active.failures,1);assert.equal(e.state.active.attempt,1);assert(e.consumeEvents().some(v=>v.type==='stage-start'&&v.retry));assert.equal(e.retry(),false);
});
check('choices cannot resolve by proximity and terminal branches work',()=>{
 const e=new Engine(defs,{evaluate:()=>({complete:true})});e.start('m01');e.tick(0,{});e.tick(0,{});e.consumeEvents();assert.equal(e.currentStage().type,'choice');e.tick(0,{});assert.equal(e.state.active.status,'active');assert.equal(e.completeStage(),false);assert.equal(e.choose(-1),false);assert.equal(e.choose(100),false);assert.equal(e.choose('0'),false);assert(e.choose(0));assert.equal(e.state.flags.broadcast,'truth');assert.equal(e.state.relationships.vee,1);assert.equal(e.state.ending,'city');assert.equal(e.state.active.status,'complete');const events=e.consumeEvents();assert.equal(events.find(v=>v.type==='choice').reward.cash,50);assert.equal(events.find(v=>v.type==='mission-complete').reward.cash,100);assert(events.every(v=>v.definition&&v.objective));assert.equal(e.choose(0),false);assert.equal(e.completeStage(),false);assert.equal(e.consumeEvents().length,0);assert(e.start('m02'));
});
check('an ending is not re-awarded by later free-roam jobs',()=>{
 const e=new Engine(defs,{evaluate:()=>({complete:true})});e.start('m01');e.tick(0,{});e.tick(0,{});e.choose(0);e.consumeEvents();e.start('m02');e.tick(0,{});assert.equal(e.state.ending,'city');assert.equal(e.state.completed.m02.ending,null);assert.equal(e.consumeEvents().find(v=>v.type==='mission-complete').record.ending,null);
});
check('a final implicit choice advances without an explicit branch',()=>{
 const e=new Engine([{id:'final',stages:[{type:'choice',choices:[{label:'Stay',flag:'stay'}]}]}]);e.start('final');assert(e.choose(0));assert.equal(e.state.active.status,'complete');assert.equal(e.state.flags.stay,true);
});
check('forward stage-id branches skip objectives safely',()=>{
 const e=new Engine([{id:'branch',stages:[{id:'approach',type:'choice',choices:[{label:'Quiet',nextStage:'exit'},{label:'Invalid',nextStage:'missing'},{label:'Backward',nextStage:0}]},{id:'fight',type:'combat'},{id:'exit',type:'go'}]}]);e.start('branch');assert.equal(e.choose(1),false);assert.equal(e.choose(2),false);assert.equal(e.state.active.stage,0);assert(e.choose(0));assert.equal(e.state.active.stage,2);assert.equal(e.completeStage(),true);
});
check('interact signal and repeatable encounter run rewards',()=>{
 const e=new Engine(defs,{evaluate});assert(e.start('event-wallet'));e.tick(1,{});assert.equal(e.state.active.status,'active');e.interact({});const first=e.consumeEvents();assert.equal(first.find(v=>v.type==='stage-complete').reward.cash,10);assert.equal(first.find(v=>v.type==='mission-complete').reward.cash,20);const run=e.state.active.run;assert(e.start('event-wallet'));assert(e.state.active.run>run);e.interact({});assert.equal(e.state.completed['event-wallet'].runs,2);const second=e.consumeEvents();assert.equal(second.find(v=>v.type==='mission-complete').reward.cash,20);assert.notEqual(first.at(-1).id,second.at(-1).id);
});
check('checkpoint replay cannot farm stage payouts',()=>{
 const e=new Engine([{id:'retry',stages:[{type:'interact',checkpoint:true,reward:{cash:40}},{type:'go',timeLimit:1}],reward:{cash:100}}],{evaluate});e.start('retry');e.interact({});assert.equal(e.consumeEvents().find(v=>v.type==='stage-complete').reward.cash,40);e.tick(1,{});assert(e.retry());e.consumeEvents();e.interact({});const replay=e.consumeEvents().find(v=>v.type==='stage-complete');assert.equal(replay.reward.cash,0);assert.equal(replay.rewardClaimed,true);
});
check('save/load restores objective state and pending rewards',()=>{
 const e=new Engine(defs,{evaluate});e.start('event-wallet');e.consumeEvents();e.state.active.data={vehicleId:'pink',path:[{x:12,y:45}]};e.interact({});const saved=e.export();const restored=new Engine(defs,{evaluate});assert(restored.import(JSON.stringify(saved)));const events=restored.consumeEvents();assert.equal(events.filter(v=>v.type==='mission-complete').length,1);assert.equal(events.find(v=>v.type==='mission-complete').reward.cash,20);assert.deepEqual(restored.state.active.data,{vehicleId:'pink',path:[{x:12,y:45}]});const afterConsume=restored.export();const again=new Engine(defs,{evaluate});assert(again.import(afterConsume));assert.equal(again.consumeEvents().length,0);assert.equal(again.completeStage(),false);
});
check('repeatable pending completions survive multiple unconsumed runs',()=>{
 const e=new Engine(defs,{evaluate});e.start('event-wallet');e.interact({});e.start('event-wallet');e.interact({});const restored=new Engine(defs,{evaluate});assert(restored.import(e.export()));assert.equal(restored.consumeEvents().filter(v=>v.type==='mission-complete').length,2);
});
check('pending event duplicates are deduplicated on restore',()=>{
 const e=new Engine(defs,{evaluate});e.start('event-wallet');e.consumeEvents();e.interact({});const saved=e.export();saved.pendingEvents.push(saved.pendingEvents.at(-1));const restored=new Engine(defs);restored.import(saved);assert.equal(restored.consumeEvents().filter(v=>v.type==='mission-complete').length,1);
});
check('failed mission persists and resumes at its checkpoint',()=>{
 const e=new Engine(defs,{evaluate});e.start('m01');e.tick(.1,{at:'hotel'});e.tick(.1,{dead:true});const restored=new Engine(defs,{evaluate});assert(restored.import(e.export()));assert.equal(restored.getHUD().canRetry,true);assert.equal(restored.getHUD().reason,'Player incapacitated');assert(restored.retry());restored.tick(.1,{enemies:0});assert.equal(restored.currentStage().type,'choice');
});
check('suspend and resume preserve objective progress around a side activity',()=>{
 const e=new Engine(defs,{evaluate});e.start('m01');e.state.active.data={evidence:2};e.tick(1,{});const saved=e.suspend();assert.equal(e.state.active,null);assert(e.start('event-wallet'));assert.equal(e.resume(saved),false);e.interact({});e.consumeEvents();assert(e.resume(saved));assert.deepEqual(e.state.active.data,{evidence:2});assert.equal(e.state.active.elapsed,1);assert(e.consumeEvents().some(v=>v.type==='stage-start'&&v.resume));
});
check('bad and future saves cannot corrupt the engine or inject prototypes',()=>{
 const e=new Engine(defs,{evaluate});assert.equal(e.import('not json'),false);assert.equal(e.import(null),false);assert.equal(e.import({version:999}),false);assert(e.import(JSON.parse('{"version":1,"flags":{"__proto__":{"polluted":true},"valid":true},"completed":{"unknown":true,"m01":true},"active":{"id":"unknown","stage":0}}')));assert.equal({}.polluted,undefined);assert.equal(e.state.flags.valid,true);assert.equal(e.state.active,null);assert.equal(e.state.completed.unknown,undefined);assert(e.canStart('m02'));assert(e.import({version:1,active:{id:'m01',stage:-5}}));assert.equal(e.state.active.status,'failed');assert.equal(e.state.active.id,'m01');assert.match(e.state.active.reason,/Retry the checkpoint/);assert(e.retry());assert.equal(e.state.active.stage,0);
});
check('dynamic registration and immutable active definitions',()=>{
 const e=new Engine([]);e.addDefinition({id:'fresh',stages:[{type:'go'}]});assert.equal(e.catalogue.get('fresh').id,'fresh');assert(e.start('fresh'));assert.throws(()=>e.register({id:'fresh',stages:[{type:'go'}]}),/active mission/);assert.throws(()=>e.register({id:'__proto__',stages:[{type:'go'}]}));assert(e.abandon());assert.equal(e.state.active,null);assert(e.start('fresh'));
});
console.log(`${checks} mission-engine checks passed`);
