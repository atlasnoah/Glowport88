'use strict';
// Real save/mission/director implementations against a rebuilt perimeter road. The
// legacy grid's center intersection has become a solid residential block.
const assert=require('node:assert/strict');
global.window=global;
for(const name of ['mission-engine','campaign','side-content','progression','police-system','encounter-system','gameplay','save-system'])require('../Glowport88/assets/'+name+'.js');
global.GlowportPhone={active:false,close(){}};
const clone=value=>JSON.parse(JSON.stringify(value)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const keys=['hotel','armory','club','records','warehouse','radio','arcade','motel','diner','clinic','observatory','pier'];
const locations=keys.map((key,i)=>({key,x:100,y:100+i*45}));
const solid=(x,y,r=0)=>x<20+r||x>780-r||y<20+r||y>780-r||x>240-r&&x<560+r&&y>240-r&&y<560+r;
function nearest(x,y){const candidates=[{x:Math.max(100,Math.min(700,x)),y:100},{x:700,y:Math.max(100,Math.min(700,y))},{x:Math.max(100,Math.min(700,x)),y:700},{x:100,y:Math.max(100,Math.min(700,y))}];return candidates.sort((a,b)=>distance(a,{x,y})-distance(b,{x,y}))[0]}
const position=t=>{t=(t%2400+2400)%2400;return t<600?{x:100+t,y:100}:t<1200?{x:700,y:100+t-600}:t<1800?{x:700-(t-1200),y:700}:{x:100,y:700-(t-1800)}};
const parameter=p=>p.y===100?p.x-100:p.x===700?600+p.y-100:p.y===700?1200+700-p.x:1800+700-p.y;
let navigationCalls=0;
const navigation={nearest:(x,y)=>nearest(x,y),route(from,to){navigationCalls++;const a=nearest(from.x,from.y),b=nearest(to.x,to.y),start=parameter(a),end=parameter(b),forward=(end-start+2400)%2400,back=(start-end+2400)%2400,sign=forward<=back?1:-1,length=Math.min(forward,back),points=[a];for(let n=1;n<=4;n++){const t=sign>0?(Math.floor(start/600)+n)*600:(Math.ceil(start/600)-n)*600,span=sign*(t-start);if(span>0&&span<length)points.push(position(t))}points.push(b);return points}};
let game,player,world,cars,enemies;
function setup(revision=1){player={x:100,y:100,inside:null,ix:403,iy:149,hp:150,maxHp:150,money:1900,ammo:{pistol:84},mag:{pistol:12},inCar:null};world={story:6,clock:500,wanted:0,mapVersion:revision};cars=[];enemies=[];navigationCalls=0;
 const api={player:()=>player,world:()=>world,cars:()=>cars,enemies:()=>enemies,npcs:()=>[],cops:()=>[],locations:()=>locations,roadsX:[100,350,700],roadsY:[100,350,700],solid,road:(x,y)=>nearest(x,y),navigation:()=>world.mapVersion>=2?navigation:null,move:(p,x,y)=>{p.x+=x;p.y+=y},district:()=>({id:'east'}),random:()=>.5,camera:()=>({x:0,y:0}),recenter(){},announce(){},save(){},hud(){},busy:()=>false,resetControls(){},dialogue:(who,lines,callback)=>callback?.(),choice(){}};
 game=new GlowportGameplay(api);game.reset(null,6);game.nextEvent=1e12;flush();return game;
}
function flush(){for(let n=0;game.dialogues.length&&n<100;n++)game.uiTick()}
function fixture(id,index=0){assert(game.fixture(id,index));flush()}
function legacyRoute(stage){return [{x:350,y:350},{x:700,y:350},{...game.location(stage.where)}]}
function saveV4(gameplay){const engine=new GlowportMissionEngine(game.catalogue);engine.import(gameplay.engine);gameplay.engine=engine.export();const memory=new Map(),storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)},key='glowport-v11-save',raw=JSON.stringify({version:4,story:6,mapVersion:1,money:player.money,gameplay});storage.setItem(key,raw);const read=GlowportSave.read(storage,key);assert(read.needsMigration);return {memory,storage,key,raw,state:read.state}}
function load(saved){world.mapVersion=2;game.reset(saved,6);game.nextEvent=1e12;flush()}
function safePath(path){assert(path.length);for(let i=0;i<path.length;i++){assert(!solid(path[i].x,path[i].y,19),'safe route endpoint');if(i)assert(game.encounters.clearLine(path[i-1],path[i]),'safe route segment')}}
let checks=0;
function check(name,run){setup();run();checks++;console.log('PASS world migration:',name)}
check('v4 active routes, vehicles, wallet, inventory, receipts and decisions survive v5 migration',()=>{
 fixture('m10',2);const active=game.engine.state.active;Object.assign(active,{elapsed:139,stageElapsed:46,claimed:{'stage:0':true},choices:{'recorded-choice':1}});active.data={points:legacyRoute(game.stage()),goal:1};game.progression.addItem('duplicate_tape',1);game.progression.addItem('cassette',2);game.rewardReceipts={'cash-once':true};
 const controlled={id:'saved-driver',x:350,y:350,health:64,modelId:'muscle',handling:2,durability:1,paint:'blue',personal:true,speed:80};const driven={id:'saved-parked',x:400,y:400,health:37,modelId:'van',handling:1,wasDriven:true};cars.push(controlled,driven);player.inCar=controlled;game.checkpoint={x:350,y:350,hp:100,ammo:{pistol:84},mag:{pistol:12},inventory:{duplicate_tape:1}};
 const legacy=saveV4(game.export()),original=clone(legacy.state.gameplay);load(legacy.state.gameplay);const restored=game.engine.state.active;
 assert.equal(restored.id,'m10');assert.equal(restored.stage,2);assert.equal(restored.status,'active');assert.equal(restored.run,active.run);assert.equal(restored.elapsed,139);assert.equal(restored.stageElapsed,46);assert.equal(restored.data.goal,1);assert.equal(restored.data.routeMapVersion,2);assert.deepEqual(restored.choices,active.choices);assert.deepEqual(restored.claimed,active.claimed);assert.deepEqual(game.engine.state.completed,original.engine.completed);assert.deepEqual(game.rewardReceipts,original.rewardReceipts);assert.deepEqual(game.progression.state.inventory,original.progression.inventory);assert.equal(player.money,1900);assert(navigationCalls>0);assert(restored.data.points.every(p=>!solid(p.x,p.y,19)));assert(distance(restored.data.points.at(-1),navigation.nearest(game.location(game.stage().where).x,game.location(game.stage().where).y))<1);assert(!solid(game.checkpoint.x,game.checkpoint.y,9));
 assert.equal(player.inCar.id,controlled.id);for(const field of ['health','modelId','handling','durability','paint'])assert.equal(player.inCar[field],controlled[field]);assert(!solid(player.inCar.x,player.inCar.y,19));const parked=cars.find(c=>c.id===driven.id);assert.equal(parked.health,37);assert.equal(parked.modelId,'van');assert.equal(parked.handling,1);assert(!solid(parked.x,parked.y,19));assert.deepEqual(legacy.state.gameplay,original,'Loading must not mutate the legacy backup object');
 GlowportSave.write(legacy.storage,legacy.key,{...legacy.state,mapVersion:2,gameplay:game.export()});assert.equal(legacy.storage.getItem(legacy.key+'.backup.migration'),legacy.raw);assert.equal(GlowportSave.read(legacy.storage,legacy.key).state.version,5);
});
check('suspended driving and abandoned outdoor stealth preserve their checkpoint progress',()=>{
 fixture('m10',2);const driving=clone(game.engine.state.active);driving.data={points:legacyRoute(game.stage()),goal:2};driving.stageElapsed=39;
 const stealthDef=game.catalogue.find(d=>d.stages.some(s=>s.type==='stealth'&&!s.inside));fixture(stealthDef.id,stealthDef.stages.findIndex(s=>s.type==='stealth'&&!s.inside));const stealth=clone(game.engine.state.active);stealth.data={points:[{x:350,y:350},{x:400,y:400},{...game.location(game.stage().where)}],goal:1,alert:1.25,guards:true};stealth.stageElapsed=17;
 const saved=game.export();saved.stack=[{active:driving,checkpoint:{x:350,y:350},startCheckpoint:{x:350,y:350}}];saved.abandoned={savedStealth:{active:stealth,checkpoint:{x:400,y:400}}};load(saved);
 assert.equal(game.stack[0].active.data.goal,2);assert.equal(game.stack[0].active.stageElapsed,39);assert(game.stack[0].active.data.points.every(p=>!solid(p.x,p.y,19)));const parked=game.abandoned.savedStealth.active;assert.equal(parked.data.goal,1);assert.equal(parked.data.alert,1.25);assert.equal(parked.stageElapsed,17);assert(parked.data.points.every(p=>!solid(p.x,p.y,9)));
 game.engine.state.active=null;assert(game.engine.resume(parked));game.pumpEvents();assert.equal(game.engine.state.active.data.goal,1);assert.equal(game.engine.state.active.stageElapsed,17);assert(!game.engine.state.active.data.guards,'Resumed stealth respawns its temporary guards without resetting route progress');
});
check('saved rivals replan remaining checkpoints and preserve actual finish records',()=>{
 fixture('event-street-race',1);const a=game.engine.state.active,route=legacyRoute(game.stage());a.data={points:route,goal:1,rivalFinishTimes:[{id:'finished-rival',time:21.5}],rivals:[{id:'finished-rival',x:350,y:350,path:clone(route),pathIndex:route.length,raceTime:21.5,finished:true,health:89},{id:'moving-rival',x:700,y:380,path:[{x:100,y:100},route[0],route[1],route[2]],pathIndex:3,raceTime:24,finished:false,pace:136,health:75}]};a.stageElapsed=33;
 const car={id:'driver',x:100,y:100,health:100};player.inCar=car;cars.push(car);load(game.export());const data=game.engine.state.active.data;
 assert.equal(data.goal,1);assert.equal(data.rivals[0].finished,true);assert.deepEqual(data.rivalFinishTimes,[{id:'finished-rival',time:21.5}]);assert.equal(data.rivals[1].raceTime,24);assert.equal(data.rivals[1].checkpointGoal,2);assert.equal(data.rivals[1].finished,false);for(const rival of data.rivals)safePath(rival.path);assert.equal(game.engine.state.active.stageElapsed,33);
 for(let n=0;n<4;n++)game.encounters.updateRace({active:game.engine.state.active,data,route:data.points,player,focus:player.inCar,dt:.1,elapsed:33+n*.1});assert.equal(data.rivalFinishTimes.length,1);assert.equal(data.rivals[1].finished,false);assert(data.rivals[1].raceTime>24);assert.equal(cars.filter(c=>c.id==='moving-rival').length,1);
});
check('damaged temporary rival paths recover safely without awarding a finish',()=>{
 world.mapVersion=2;fixture('event-street-race',1);const active=game.engine.state.active,route=game.route(game.stage(),active.data),car={id:'driver',x:100,y:100,health:100};player.inCar=car;cars.push(car);active.data.rivals=[{id:'broken-rival',x:350,y:350,path:null,pathIndex:-2,raceTime:12,finished:false,health:44}];active.data.rivalFinishTimes=[];game.encounters.updateRace({active,data:active.data,route,player,focus:car,dt:0,elapsed:12});const rival=active.data.rivals[0];safePath(rival.path);assert.equal(rival.health,44);assert.equal(rival.raceTime,12);assert.equal(rival.finished,false);assert.equal(active.data.rivalFinishTimes.length,0);assert.match(active.data.raceRecovery,/saved rival route was damaged/i);
});
check('new checkpoints and rivals use connected shared roads rather than legacy grid intersections',()=>{
 world.mapVersion=2;fixture('event-street-race',1);const active=game.engine.state.active,route=game.route(game.stage(),active.data);assert(route.every(p=>!solid(p.x,p.y,19)));const destination=game.location(game.stage().where),final=navigation.nearest(destination.x,destination.y);assert(distance(route.at(-1),final)<1);for(let i=1;i<route.length;i++)safePath(navigation.route(route[i-1],route[i]));const car={id:'driver',x:100,y:100,health:100};player.inCar=car;cars.push(car);game.encounters.roadGraph=()=>{throw Error('Legacy anchor graph must not be used with shared navigation')};game.encounters.updateRace({active,data:active.data,route,player,focus:car,dt:.1,elapsed:1});assert.equal(active.data.rivals.length,2);for(const rival of active.data.rivals)safePath(rival.path);
});
check('disconnected rebuilt roads fail with an explicit checkpoint recovery path',()=>{
 world.mapVersion=2;fixture('m10',2);const active=game.engine.state.active,original=navigation.route;navigation.route=()=>null;try{game.route(game.stage(),active.data);assert.equal(active.data.goal,0);assert.equal(game.validateObjective(),false);assert.equal(active.status,'failed');assert.match(active.reason,/route is unavailable.*Retry/);assert.equal(player.money,1900)}finally{navigation.route=original}assert(game.retry().ok);assert.equal(game.engine.state.active.status,'active');
});
check('large rival movement steps cannot snap through a newly blocked waypoint segment',()=>{
 fixture('event-street-race',1);const active=game.engine.state.active,car={id:'driver',x:100,y:350,health:100};player.inCar=car;cars.push(car);active.data={rivalFinishTimes:[],rivals:[{id:'unsafe',x:100,y:350,path:[{x:100,y:350},{x:700,y:350}],pathIndex:1,pathMapVersion:1,raceTime:0,finished:false,pace:1000}]};game.encounters.updateRace({active,data:active.data,route:[{x:700,y:350}],player,focus:car,dt:1,elapsed:1});assert.equal(active.data.rivals[0].x,100);assert.equal(active.data.rivals[0].finished,false);assert.equal(active.data.rivalFinishTimes.length,0);assert.match(active.data.raceUnavailable,/blocked/);
});
console.log(`${checks} rebuilt-world save and route checks passed`);
