'use strict';
// Exercise real authored choices through the adapter's actions and dialogue callbacks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.window=global;
for(const name of ['mission-engine','campaign','side-content','progression','police-system','gameplay'])require('../Glowport88/assets/'+name+'.js');
global.GlowportPhone={active:false,close(){}};
const locations=['hotel','armory','club','records','warehouse','radio','arcade','motel','diner','clinic','observatory','pier'].map((key,i)=>({key,x:1000+i%4*600,y:1000+Math.floor(i/4)*600}));
let game,player,world,cars,enemies,choice;const passed=[];
function setup(){
 player={x:1000,y:1000,inside:null,ix:403,iy:149,hp:150,maxHp:150,money:100000,ammo:{pistol:84},mag:{pistol:12},inCar:null};world={story:6,clock:0,wanted:0};cars=[];enemies=[];choice=null;
 game=new GlowportGameplay({player:()=>player,world:()=>world,cars:()=>cars,enemies:()=>enemies,npcs:()=>[],cops:()=>[],locations:()=>locations,roadsX:locations.map(l=>l.x),roadsY:locations.map(l=>l.y),solid:()=>false,road:(x,y)=>({x,y}),move:(p,x,y)=>{p.x+=x;p.y+=y},district:()=>({id:'east'}),random:()=>.5,camera:()=>({x:0,y:0}),recenter(){},announce(){},save(){},hud(){},busy:()=>false,resetControls(){},dialogue:(who,lines,callback)=>callback?.(),choice:(who,text,options,unused,callback)=>{choice={text,options,callback}}});
 game.reset(null,6);game.nextEvent=1e12;flush();
}
function flush(){for(let n=0;game.dialogues.length&&n<50;n++)game.uiTick();assert.equal(game.dialogues.length,0)}
function arrive(){const s=game.stage(),l=game.location(s.where);Object.assign(player,{x:l.x,y:l.y,inside:s.inside?l.key:null,ix:403,iy:149,inCar:null})}
function chooseVee(){
 flush();arrive();assert.equal(game.stage().type,'investigate');for(const clue of game.stage().clues){player.ix=clue.x;player.iy=clue.y;assert(game.action());flush()}
 arrive();assert.equal(game.stage().type,'talk');assert(game.action());flush();arrive();assert.equal(game.stage().type,'choice');assert(game.action());assert(choice);choice.callback(0);choice=null;flush();assert.equal(game.engine.state.active.stage,3);
}
function check(name,run){setup();run();passed.push(name);console.log('PASS mission audit:',name)}
check('m31 checkpoint replay preserves one recorded Vee consequence',()=>{
 assert(game.fixture('m31',0));chooseVee();const first=game.engine.state.relationships.VEE,run=game.engine.state.active.run;assert.equal(first,3);
 for(let n=0;n<3;n++){assert(game.restartCheckpoint().ok);chooseVee();assert.equal(game.engine.state.relationships.VEE,first);assert.equal(game.engine.state.flags.veeDecision,'forgive');assert.equal(game.engine.state.active.run,run)}
});
check('recorded engine choices cannot switch branches after checkpoint restart or reload',()=>{
 const definitions=[{id:'recorded',stages:[{id:'decision',type:'choice',checkpoint:true,choices:[{label:'Keep',flag:'promise',value:'kept',relationships:{VEE:2}},{label:'Break',flag:'promise',value:'broken'}]},{type:'go'}]}],engine=new GlowportMissionEngine(definitions);
 assert(engine.start('recorded'));assert(engine.choose(0));assert(engine.restart());const restored=new GlowportMissionEngine(definitions);assert(restored.import(engine.export()));const snapshot=JSON.stringify(restored.export());assert.equal(restored.choose(1),false);assert.equal(JSON.stringify(restored.export()),snapshot);assert(restored.choose(0));assert.equal(restored.state.flags.promise,'kept');assert.equal(restored.state.relationships.VEE,2);
});
check('paid street-scam choice can replay with zero cash without charging again',()=>{
 assert(game.fixture('event-street-scam',0));flush();arrive();player.money=40;assert(game.action());choice.callback(0);choice=null;flush();assert.equal(player.money,0);assert.equal(game.engine.state.active.stage,1);
 assert(game.restartCheckpoint().ok);flush();arrive();assert(game.action());assert.equal(choice.options.length,1);assert.match(choice.options[0].label,/recorded/i);choice.callback(0);assert.equal(game.engine.state.active.stage,1);assert.equal(player.money,0);assert.equal(game.engine.state.flags.event_scam,'bought');
});
check('stale choice callbacks cannot resolve a newly restarted instance of the same stage',()=>{
 assert(game.fixture('event-street-scam',0));flush();arrive();assert(game.action());const stale=choice.callback,cash=player.money;assert(game.restartCheckpoint().ok);stale(0);assert.equal(game.engine.state.active.stage,0);assert.equal(player.money,cash);assert.equal(game.engine.state.flags.event_scam,undefined);
 arrive();assert(game.action());choice.callback(0);assert.equal(game.engine.state.active.stage,1);assert.equal(player.money,cash-40);
});
check('unentered owned cars export durably and restored starter identity does not duplicate',()=>{
 const starter={id:'starter',x:1000,y:1000,speed:0,health:100,personal:true,ai:false},owned={id:'owned-car-1',x:1100,y:1000,speed:0,health:81,personal:true,ai:false,modelId:'compact',handling:2,wasDriven:false},ambient={id:'traffic-1',x:1200,y:1000,speed:0,health:100,ai:true};cars.push(starter,owned,ambient);
 const saved=game.export();assert.deepEqual(saved.drivenCars.map(c=>c.id).sort(),['owned-car-1','starter']);cars.splice(0,cars.length,{...starter},ambient);game.reset(saved,6);assert.equal(cars.filter(c=>c.id==='starter').length,1);const restored=cars.find(c=>c.id==='owned-car-1');assert(restored);assert.equal(restored.handling,2);assert.equal(restored.health,81);assert.equal(restored.wasDriven,false);assert.equal(cars.filter(c=>c.id==='owned-car-1').length,1);
});
fs.writeFileSync(path.resolve(__dirname,'../artifacts/audit-mission-recovery-results.json'),JSON.stringify({time:new Date().toISOString(),passed,scope:'Production adapter and engine with deterministic host; authored m31 investigation/talk/choice retries, paid street-scam replay, stale callbacks and owned-car save identity. Actual geometry and phone interactions are verified in the separate persistence host audit.'},null,2)+'\n');
console.log(`${passed.length} mission recovery audit checks passed`);
