'use strict';
// Deterministic production-director tests. Actual objective evaluation across all content
// remains covered by campaign-playthrough.cjs; these tests cover scene/rival/context state.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.window=global;for(const name of ['side-content','mission-engine','encounter-system'])require('../Glowport88/assets/'+name+'.js');
const oldEvents=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/encounters-0.4.2.json'),'utf8'));
const passed=[];function test(name,fn){fn();passed.push(name);console.log('PASS living encounters:',name)}
let player,world,cars,blocked,environment,seed;
const places=['hotel','armory','club','records','warehouse','radio','arcade','motel','diner','clinic','observatory','pier'];
const locations=places.map((key,index)=>({key,x:100+(index%3)*200,y:100+Math.floor(index/3)*140}));
function setup(){player={x:100,y:100,inside:null,inCar:null,lastShot:-100},world={clock:1000,wanted:0},cars=[],blocked=()=>false,environment={hour:22,weather:'CLEAR'},seed=88;
 const api={player:()=>player,world:()=>world,cars:()=>cars,locations:()=>locations,solid:(x,y,r)=>blocked(x,y,r),random:()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),environment:()=>environment,road:(x,y)=>({x,y}),roadsX:[100,300,500,700],roadsY:[100,300,500,700],screenPoint:(x,y)=>[x,y],person(){}};return new GlowportEncounters(api)}
function active(def,stage=0){return{id:def.id,run:7,stage,status:'active',data:{}}}
function context(def,a,dt=.1){return{definition:def,active:a,stage:def.stages[a.stage],catalogue:GlowportSideContent.events,data:a.data,clock:world.clock,dt,player,focus:player.inCar||player,elapsed:a.stageElapsed||0}}
let director;
test('32 event types retain all 20 old event IDs and original objective slots',()=>{
 const events=GlowportSideContent.events;assert.equal(events.length,32);assert.equal(new Set(events.map(d=>d.category)).size,32);
 for(const old of oldEvents){const now=events.find(e=>e.id===old.id);assert(now,old.id);old.stages.forEach((stage,index)=>{assert.equal(now.stages[index].id,stage.id);assert.equal(now.stages[index].type,stage.type);assert.equal(now.stages[index].where,stage.where)})}
 new GlowportMissionEngine(events);for(const event of events.slice(20)){assert(event.stages.length>=3);assert(event.stages.some(s=>!['choice','talk','collect'].includes(s.type)));const ids=new Map(event.stages.map((s,i)=>[s.id,i]));event.stages.forEach((s,i)=>{for(const option of s.choices||[])if(option.nextStage&&option.nextStage!=='complete')assert(ids.get(option.nextStage)>i)})}
});
test('required new canonical encounters contain actual stages and distinct outcomes',()=>{
 for(const category of ['missing_person','car_accident','street_scam','blackout','lost_wallet','street_performer','undercover_officer','stolen_vehicle_recovery','secret_transmission','shopkeeper_problem','false_accusation','wrong_delivery'])assert(GlowportSideContent.events.some(d=>d.category===category),category);
 const wrong=GlowportSideContent.events.find(d=>d.id==='event-wrong-delivery'),decision=wrong.stages.find(s=>s.id==='event-wrong-delivery-s4');assert.notEqual(decision.choices[0].nextStage,decision.choices[1].nextStage);
 const stranded=GlowportSideContent.events.find(d=>d.id==='event-stranded-driver');assert(stranded.stages.at(-1).lawful);assert.equal(stranded.stages.at(-1).type,'heist');
});
test('time, district, progression, proximity and cooldown gates affect selection',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-street-race'),focus=director.point(def),ctx={act:2,district:'south',clock:1000,focus,eventTimes:{},environment:{hour:22,weather:'CLEAR'}};
 assert.equal(director.choose([def],{...ctx,act:1}),null);assert.equal(director.choose([def],{...ctx,district:'core'}),null);assert.equal(director.choose([def],{...ctx,focus:{x:10000,y:10000}}),null);assert.equal(director.choose([def],{...ctx,eventTimes:{[def.id]:999}}),null);assert.equal(director.choose([def],{...ctx,environment:{hour:12}}),null);assert.equal(director.choose([def],ctx).id,def.id);
});
test('weather and reputation gates are enforceable and force still validates geometry',()=>{
 director=setup();const base=GlowportSideContent.events[0],def={...base,minReputation:15,weather:['RAIN']},focus=director.point(def),ctx={act:5,district:def.districts[0],clock:1000,focus,reputation:20,environment:{hour:22,weather:'RAIN'}};
 assert(director.choose([def],ctx));assert.equal(director.choose([def],{...ctx,reputation:0}),null);assert.equal(director.choose([def],{...ctx,environment:{hour:22,weather:'CLEAR'}}),null);blocked=()=>true;assert.equal(director.choose([def],{...ctx,forceId:def.id}),null);
});
test('safe spawn searches bounded alternatives and rejects inaccessible targets',()=>{
 director=setup();blocked=(x,y)=>x>90&&x<115&&y>90&&y<125;const point=director.safePoint(100,110);assert(point&&!blocked(point.x,point.y));blocked=()=>true;assert.equal(director.safePoint(100,110),null);assert.equal(director.point(GlowportSideContent.events[0]),null);
});
test('variety history avoids immediate repeats when alternatives exist',()=>{
 director=setup();const defs=GlowportSideContent.events.filter(d=>d.districts.includes('core')&&!d.hours).slice(0,4),ctx={act:5,district:'core',clock:1000,focus:{x:300,y:300},eventTimes:{},environment:{hour:22,weather:'CLEAR'}};const chosen=[];for(let i=0;i<16;i++)chosen.push(director.choose(defs,ctx).id);for(let i=1;i<chosen.length;i++)assert.notEqual(chosen[i],chosen[i-1]);assert(director.state.history.length<=12);
});
test('offer and active street scenes use visible safe actors and bounded temporary cars',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-car-accident'),point=director.point(def);director.update({offer:{id:def.id,...point},catalogue:GlowportSideContent.events,dt:.1});assert.equal(director.scene.actors.length,3);assert(cars.length>=1);assert(director.scene.actors.every(p=>!director.solid(p.x,p.y,9)));const a=active(def);director.update(context(def,a));assert(director.scene.active);assert.equal(cars.length,1);assert.equal(director.hazards().length,1);
 for(let i=0;i<100;i++){director.update({offer:{id:def.id,...point},catalogue:GlowportSideContent.events,dt:.1});director.update(context(def,{...a,run:i+20}));assert(cars.length<=1)}director.update({dt:.1});assert.equal(cars.length,0);assert.equal(director.scene,null);
});
test('scene witnesses visibly flee danger without moving into blocked geometry',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-car-accident'),a=active(def);director.update(context(def,a));const actor=director.scene.actors[0];player.x=actor.x-20;player.y=actor.y;const before=actor.x;world.wanted=2;director.update(context(def,a,.2));assert.equal(actor.state,'FLEEING');assert(actor.x>before);assert(!director.solid(actor.x,actor.y,9));
});
test('blackout darkens its local block, restores after relay stage, and cleans up',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-blackout'),a=active(def,1);director.update(context(def,a));assert(director.blackout());const dark=[];director.draw({save(){},restore(){},fillRect(...p){dark.push(p)},fillText(){},set fillStyle(v){},set font(v){}},false);assert(dark.some(r=>r[2]===420&&r[3]===420));a.stage=def.stages.length-1;director.update(context(def,a));assert.equal(director.blackout(),null);director.clear();assert.equal(director.scene,null);
});
test('road routes follow connected streets and route around solid blocks',()=>{
 director=setup();blocked=(x,y,r=0)=>x>200-r&&x<400+r&&y>200-r&&y<400+r;const route=director.roadPath({x:100,y:100},{x:500,y:500});assert(route&&route.length>=3);for(let i=1;i<route.length;i++)assert(director.clearLine(route[i-1],route[i]));assert(route.every(p=>!director.solid(p.x,p.y,18)));
});
test('two physical race rivals wait for a vehicle, drive safe routes and record real finish times',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-street-race'),a=active(def,1),route=[{x:500,y:100},{x:500,y:500}];let ctx={...context(def,a),route};director.update(ctx);assert.equal(cars.filter(c=>c.racing).length,0);player.inCar={id:'player-car',x:100,y:100};cars.push(player.inCar);let traveled=false;
 for(let i=0;i<180;i++){a.stageElapsed=i*.1;world.clock+=.1;director.update({...context(def,a),route});const rivals=cars.filter(c=>c.racing);assert.equal(rivals.length,2);traveled ||= rivals.some(c=>c.x!==100||c.y!==100);assert(rivals.every(c=>!director.solid(c.x,c.y,18)))}assert(traveled);assert.equal(a.data.rivalFinishTimes.length,2);assert(a.data.rivalFinishTimes.every(r=>r.time>5));assert(a.data.rivals.every(r=>r.finished));
});
test('saved race progress restores rivals without duplicate cars or reset finish times',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-street-race'),a=active(def,1),route=[{x:500,y:100},{x:500,y:500}];player.inCar={id:'player',x:100,y:100};cars.push(player.inCar);director.update({...context(def,a),route});for(let i=0;i<10;i++)director.update({...context(def,a),route});const saved=JSON.parse(JSON.stringify(a)),x=saved.data.rivals[0].x;director.clear();director= new GlowportEncounters(director.api);director.update({...context(def,saved),route});assert.equal(cars.filter(c=>c.racing).length,2);assert(saved.data.rivals[0].x>x);director.update({...context(def,saved),route});assert.equal(cars.filter(c=>c.racing).length,2);
});
test('temporary cleanup preserves the player’s controlled car',()=>{
 director=setup();player.inCar={id:'borrowed-rival',x:100,y:100,racing:true,_encounterRace:'old'};cars.push(player.inCar);director.clear();assert.equal(cars.length,1);assert.equal(cars[0],player.inCar);assert(!cars[0]._encounterRace);assert(!cars[0].racing);
});
test('outcome memory persists real choices and safely validates damaged imports',()=>{
 director=setup();const def=GlowportSideContent.events.find(d=>d.id==='event-false-accusation');director.record(def,{run:8,reward:{cash:70,reputation:4}},{event_accusation:'cleared'});const saved=director.export(),restored=setup();assert(restored.import(saved));assert.equal(restored.state.memory.false_accusation.choices.event_accusation,'cleared');assert.equal(restored.state.memory.false_accusation.runs,1);assert.equal(restored.state.memory.false_accusation.reward.cash,70);assert(restored.import({memory:{bad:{id:'valid',runs:Infinity,reward:{cash:NaN}}},history:['good',null,'__proto__']}));assert.equal(restored.state.memory.bad.runs,0);assert.deepEqual(restored.state.history,['good']);
});
fs.writeFileSync(path.resolve(__dirname,'../artifacts/living-events-results.json'),JSON.stringify({time:new Date().toISOString(),passed,eventTypes:GlowportSideContent.events.length,newEventTypes:12,legacyEventStagePrefixesPreserved:true,scope:'Deterministic production encounter-director tests: context selection, safe scenes, bounded cleanup, original-sprite actor reactions, blackout, physical road-following race rivals, memory and persistence. Objective-handler sweeps run separately in campaign-playthrough.cjs; not a continuous human playthrough.'},null,2));console.log(`${passed.length} Living City encounter checks passed`);
