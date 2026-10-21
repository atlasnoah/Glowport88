'use strict';
const assert=require('node:assert/strict');
require('../Glowport88/assets/police-system.js');
const Police=globalThis.GlowportPolice;
const player={x:100,y:100,inside:null,inCar:null,moving:false,speed:0};
const clear=()=>({clock:0,wanted:0,player:{...player},witnesses:[],cops:[],lineOfSight:()=>true});
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS',name)}
check('minor crime requires a living, in-range witness and clear line of sight',()=>{
 const p=new Police(),s=clear();assert.equal(p.report(.2,s).accepted,false);
 s.witnesses=[{x:130,y:100,hp:40}];s.lineOfSight=()=>false;assert.equal(p.report(.2,s).accepted,false);
 s.lineOfSight=()=>true;s.witnesses=[{x:500,y:100}];assert.equal(p.report(.2,s).accepted,false);
 s.witnesses=[{x:130,y:100,hp:0}];assert.equal(p.report(.2,s).accepted,false);
 s.witnesses=[{x:130,y:100,hp:40}];const report=p.report(.2,s);assert(report.accepted&&report.witnessed);assert.equal(report.mode,'reported');assert.equal(report.wanted,.2);
});
check('alarms and explicit script crimes dispatch without inventing witnesses',()=>{
 const p=new Police(),s=clear();const report=p.report(.8,s);assert(report.accepted&&report.alarm&&!report.witnessed);s.wanted=report.wanted;
 let r=p.update(.5,{...s,clock:.5});assert.equal(r.spawnRequest,null);assert.equal(r.mode,'reported');
 r=p.update(1,{...s,clock:1.5});assert.equal(r.mode,'search');assert(r.spawnRequest);assert.equal(r.canEngage,false);
 const forced=new Police().report(.1,clear(),{force:true});assert(forced.accepted&&forced.alarm);
});
check('officers cannot see or engage through walls; last known position stays fixed',()=>{
 const p=new Police(),s=clear();s.cops=[{x:180,y:100,foot:true}];p.setWanted(2,s);let r=p.update(.1,{...s,wanted:2,clock:.1});assert.equal(r.mode,'pursuit');assert(r.canEngage);assert.deepEqual(r.target,{x:100,y:100});
 s.player.x=350;s.player.y=300;s.lineOfSight=()=>false;r=p.update(1,{...s,wanted:r.wanted,clock:1.1});assert.equal(r.mode,'search');assert.equal(r.canEngage,false);assert.deepEqual(r.target,{x:100,y:100});assert.deepEqual(r.lastKnown,{x:100,y:100});
});
check('wanted level does not decay while officers see the player',()=>{
 const p=new Police(),s=clear();s.cops=[{x:180,y:100,foot:true}];p.setWanted(3,s);let wanted=3;
 for(let i=1;i<=45;i++){const r=p.update(1,{...s,wanted,clock:i});wanted=r.wanted;assert.equal(r.mode,'pursuit')}
 assert.equal(wanted,3);assert.equal(p.state.escapes,0);
});
check('breaking line of sight produces a finite search and successful escape',()=>{
 const p=new Police(),s=clear();s.cops=[{x:180,y:100,foot:true}];p.setWanted(2,s);p.update(.1,{...s,wanted:2,clock:.1});s.lineOfSight=()=>false;let wanted=2,r;
 for(let i=1;i<=70;i++){r=p.update(1,{...s,wanted,clock:i+1});wanted=r.wanted}
 assert.equal(r.mode,'clear');assert.equal(wanted,0);assert.equal(p.state.escapes,1);assert.equal(r.spawnRequest,null);
});
check('reacquisition renews pursuit and search; interiors cannot be magically observed',()=>{
 const p=new Police(),s=clear();s.cops=[{x:180,y:100,foot:true}];p.setWanted(2,s);let r=p.update(1,{...s,wanted:2,clock:1});s.lineOfSight=()=>false;r=p.update(1,{...s,wanted:r.wanted,clock:2});assert.equal(r.mode,'search');
 s.lineOfSight=()=>true;r=p.update(1,{...s,wanted:r.wanted,clock:3});assert.equal(r.mode,'pursuit');
 s.player.inside='hotel';s.player.x=600;r=p.update(1,{...s,wanted:r.wanted,clock:4});assert.equal(r.mode,'search');assert.deepEqual(r.lastKnown,{x:100,y:100});
});
check('dispatch/backup and high-level roadblocks are rate limited',()=>{
 const p=new Police(),s=clear();let r=p.setWanted(4,s);r=p.update(.1,{...s,wanted:4,clock:1});assert(r.spawnRequest);assert(r.roadblockRequest);assert.equal(r.spawnRequest.desired,4);
 r=p.update(.1,{...s,wanted:r.wanted,clock:1.1});assert.equal(r.spawnRequest,null);assert.equal(r.roadblockRequest,null);
 const cops=Array.from({length:4},(_,i)=>({x:900+i*30,y:100}));r=p.update(.1,{...s,wanted:r.wanted,cops,clock:4});assert.equal(r.spawnRequest,null);
 r=p.update(.1,{...s,wanted:r.wanted,cops:[],clock:5});assert(r.spawnRequest);assert.equal(r.roadblockRequest,null);
});
check('low-level stationary suspects can be arrested, with a fair hold and cancellation',()=>{
 const p=new Police(),s=clear();s.cops=[{x:115,y:100,foot:true}];p.setWanted(1,s);
 let r=p.update(1,{...s,wanted:1,clock:1});assert(!r.arrest&&r.arrestProgress===1);r=p.update(1,{...s,wanted:1,player:{...player,moving:true},clock:2});assert.equal(r.arrestProgress,0);
 r=p.update(1,{...s,wanted:1,clock:3});r=p.update(1,{...s,wanted:1,clock:4});r=p.update(.5,{...s,wanted:1,clock:4.5});assert(r.arrest);assert.equal(r.wanted,0);assert.equal(p.state.arrests,1);
 r=p.update(1,{...s,wanted:0,clock:5});assert.equal(r.arrest,false);
});
check('missing geometry fails closed instead of granting omniscient perception',()=>{
 const p=new Police(),s=clear();delete s.lineOfSight;s.cops=[{x:110,y:100,foot:true}];assert.equal(p.report(.1,s).accepted,false);p.setWanted(2,s);assert.equal(p.update(1,{...s,wanted:2,clock:1}).canEngage,false);
});
check('state roundtrips without restoring an unavoidable arrest and validates unsafe input',()=>{
 const p=new Police(),s=clear();p.report(3,s);p.state.arrestProgress=2.49;const saved=p.export(),q=new Police();assert(q.import(saved));assert.equal(q.state.wanted,3);assert.deepEqual(q.state.lastKnown,{x:100,y:100});assert.equal(q.state.arrestProgress,0);saved.wanted=99;assert.equal(q.state.wanted,3);
 assert(q.import({wanted:Infinity,mode:'hack',lastKnown:{x:NaN,y:2},searchRemaining:-50}));assert.equal(q.state.wanted,0);assert.equal(q.state.mode,'clear');assert.equal(q.state.lastKnown,null);assert.equal(q.import(null),false);
});
check('external hospital/reset and negative legacy heat adjustments clear pursuit',()=>{
 const p=new Police(),s=clear();p.setWanted(3,s);const report=p.report(-10,{...s,wanted:3});assert.equal(report.wanted,0);assert.equal(report.mode,'clear');p.setWanted(3,s);const r=p.update(.1,{...s,wanted:0,clock:1});assert.equal(r.mode,'clear');assert.equal(r.wanted,0);
});
console.log(`${checks} police model checks passed`);
