'use strict';
// Production mission adapter with a deterministic host. This suite checks interaction
// contracts and recovery receipts, not travel, combat balance, or browser rendering.
const assert=require('node:assert/strict');
global.window=global;
for(const file of ['mission-engine','campaign','side-content','progression','police-system','gameplay'])require('../Glowport88/assets/'+file+'.js');
global.GlowportPhone={active:false,close(){}};
const locationKeys=['hotel','armory','club','records','warehouse','radio','arcade','motel','diner','clinic','observatory','pier'];
const locations=locationKeys.map((key,index)=>({key,name:key.toUpperCase(),x:1000+index%4*600,y:1000+Math.floor(index/4)*600}));
let game,player,world,cars,enemies,announcements,choice;
function setup(){player={x:1000,y:1000,inside:null,ix:403,iy:149,hp:150,maxHp:150,money:100000,ammo:{pistol:84},mag:{pistol:12},inCar:null};world={story:6,clock:0,wanted:0};cars=[];enemies=[];announcements=[];choice=null;
 game=new GlowportGameplay({player:()=>player,world:()=>world,cars:()=>cars,enemies:()=>enemies,npcs:()=>[],cops:()=>[],locations:()=>locations,roadsX:locations.map(l=>l.x),roadsY:locations.map(l=>l.y),solid:()=>false,road:(x,y)=>({x,y}),move:(p,x,y)=>{p.x+=x;p.y+=y},district:()=>({id:'east'}),random:()=>.5,camera:()=>({x:0,y:0}),recenter(){},announce:text=>announcements.push(text),save(){},hud(){},busy:()=>false,resetControls(){},dialogue:(who,lines,callback)=>callback?.(),choice:(who,text,options,unused,callback)=>{choice={options,callback}}});game.reset(null,6);game.nextEvent=Infinity;flush();
}
function flush(){for(let guard=0;game.dialogues.length&&guard<100;guard++)game.uiTick();assert.equal(game.dialogues.length,0)}
function at(where,inside=false){const loc=game.location(where);Object.assign(player,{x:loc.x,y:loc.y,inside:inside?where:null,ix:403,iy:149});if(player.inCar)Object.assign(player.inCar,{x:loc.x,y:loc.y,speed:0})}
function fixture(id,index=0){assert(game.fixture(id,index));flush();at(game.stage().where,!!game.stage().inside)}
function optional(def){game.engine.register(def);game.engine.state.active=null;assert(game.engine.start(def.id));game.pumpEvents();flush();at(def.stages[0].where,!!def.stages[0].inside)}
let checks=0;function check(name,fn){setup();fn();checks++;console.log('PASS living mission:',name)}
check('next story starts on foot with briefing before vehicle acquisition',()=>{
 for(const def of GlowportCampaign.missions.slice(0,9))game.engine.state.completed[def.id]={fixture:true};game.engine.state.active=null;at('records');
 const candidate=game.interactions().find(c=>c.id==='story-start:m10');assert(candidate);assert.match(candidate.label,/START EAST SPAN RUN/);assert.equal(candidate.priority,100);assert(candidate.run());assert.equal(game.definition().id,'m10');assert.equal(game.stage().type,'acquire_vehicle');assert(game.dialogues.length>0);assert.equal(game.progression.count('duplicate_tape'),0);
});
check('next story also starts in a vehicle and rejects outside activation radius',()=>{
 for(const def of GlowportCampaign.missions.slice(0,9))game.engine.state.completed[def.id]={fixture:true};game.engine.state.active=null;at('records');const car={x:player.x+71,y:player.y,speed:0,health:100};cars.push(car);player.inCar=car;assert(!game.interactions().some(c=>c.id==='story-start:m10'));car.x=player.x;assert(game.interactions().find(c=>c.id==='story-start:m10').run());assert.equal(game.engine.state.active.stage,0);
});
check('vehicle briefing explains requirements without advancing driving objectives',()=>{
 fixture('m10',2);const before=game.key(),candidate=game.interactions().find(c=>c.id.startsWith('vehicle-briefing:'));assert(candidate);assert.match(game.prompt(),/VEHICLE REQUIRED/);assert(candidate.run());assert.equal(game.key(),before);assert.equal(game.engine.state.active.data.goal,0);assert(game.dialogues[0].lines[0].text.includes('actual checkpoints'));flush();
});
check('nearby cars remain available during vehicle-required stages',()=>{
 fixture('m10',0);cars.push({x:player.x+20,y:player.y,health:100,speed:0});assert(!game.interactions().some(c=>c.id.startsWith('vehicle-briefing:')));assert.equal(game.action(),false);
});
check('False Flag combat never advertises a nonfunctional interaction',()=>{
 fixture('m27',0);assert(!game.interactions().some(c=>c.id.startsWith('objective:')));assert.equal(game.action(),false);assert(!game.prompt().startsWith('E · THREAT'));game.tick(.01);assert.equal(game.stage().type,'combat');assert(enemies.some(e=>e._mission===game.key()));
});
check('East Diner handoff explains on-foot requirement then outranks nearby event',()=>{
 fixture('m10',3);const key=game.key();let candidate=game.interactions().find(c=>c.id.startsWith('vehicle-briefing:'));assert(candidate);assert(candidate.run());flush();assert.equal(game.key(),key);assert.equal(game.progression.count('duplicate_tape'),1);
 const car={x:player.x,y:player.y,speed:0,health:100};cars.push(car);player.inCar=car;game.offer={id:'event-stranded-driver',title:'STRANDED DRIVER',x:player.x,y:player.y,where:'diner',expires:90};
 const candidates=game.interactions().sort((a,b)=>b.priority-a.priority);assert(candidates.some(c=>c.id.startsWith('event-offer:')));candidate=candidates[0];assert(candidate.id.startsWith('objective:'));assert.match(game.prompt(),/DELIVER PACKAGE/);assert(candidate.run());assert.equal(game.engine.state.active.stage,4);assert.equal(game.progression.count('duplicate_tape'),0);assert.equal(choice,null);assert.equal(candidate.run(),false);
});
check('investigation prompt range and execution range are identical',()=>{
 fixture('m07');Object.assign(player,{ix:211+53.9,iy:223});const candidate=game.interactions().find(c=>c.id.startsWith('objective:'));assert(candidate);assert.match(game.prompt(),/INSPECT/);player.ix=211+54;assert(!game.interactions().some(c=>c.id.startsWith('objective:')));assert.equal(candidate.run(),false);assert.equal(game.engine.state.active.data.clue||0,0);
});
check('moving handoffs ask the player to stop instead of delivering at speed',()=>{
 fixture('m10',3);player.inCar={x:player.x,y:player.y,speed:60,health:100};cars.push(player.inCar);const candidate=game.interactions()[0];assert.match(candidate.label,/STOP VEHICLE/);assert(candidate.run());assert.equal(game.engine.state.active.stage,3);assert.equal(game.progression.count('duplicate_tape'),1);
});
check('checkpoint restart invalidates queued callbacks and preserves unrelated items',()=>{
 fixture('m08');game.progression.addItem('collectible-cassette',1);assert(game.action());const callback=game.dialogues[0].callback;assert(game.restartCheckpoint().ok);callback();assert.equal(game.engine.state.active.stage,0);assert(!game.engine.state.active.data.done);assert.equal(game.progression.count('collectible-cassette'),1);
});
check('checkpoint replay cannot duplicate cash or permanent granted items',()=>{
 optional({id:'test-receipts',kind:'side',stages:[{type:'collect',where:'hotel',item:'parcel',checkpoint:true,reward:{cash:25},givesItem:'commendation'},{type:'go',where:'armory',timeLimit:.1}],reward:{cash:100}});const money=player.money;assert(game.action());assert.equal(player.money,money+25);assert.equal(game.progression.count('commendation'),1);game.engine.tick(.2,{});game.pumpEvents();assert(game.retry().ok);assert.equal(game.progression.count('commendation'),1);assert(game.action());assert.equal(player.money,money+25);assert.equal(game.progression.count('commendation'),1);assert.equal(game.progression.count('parcel'),1);
});
check('replayed choice restores a needed package without repeating rewards',()=>{
 optional({id:'test-choice-package',kind:'side',stages:[{type:'choice',where:'hotel',choices:[{label:'Take parcel',givesItem:'choice-parcel',reward:{cash:15}}]},{type:'deliver',where:'hotel',item:'choice-parcel'},{type:'go',where:'armory',timeLimit:.1}],reward:{cash:100}});const money=player.money;assert(game.action());choice.callback(0);assert.equal(game.progression.count('choice-parcel'),1);assert(game.action());assert.equal(game.progression.count('choice-parcel'),0);game.engine.tick(.2,{});game.pumpEvents();assert(game.retry().ok);assert(game.action());choice.callback(0);assert.equal(game.progression.count('choice-parcel'),1);assert.equal(player.money,money+15);
});
check('missing chase and escort targets fail with recoverable checkpoint reasons',()=>{
 fixture('m27',1);game.engine.state.active.data.target=true;assert.equal(game.marker(),null);assert.equal(game.validateObjective(),false);assert.equal(game.engine.state.active.status,'failed');assert.match(game.engine.state.active.reason,/marked vehicle is missing.*Retry/);assert(game.retry().ok);assert.equal(game.engine.state.active.status,'active');
 const def=GlowportCampaign.missions.find(d=>d.stages.some(s=>s.type==='escort'));fixture(def.id,def.stages.findIndex(s=>s.type==='escort'));game.engine.state.active.data.picked=true;game.actor=null;assert.equal(game.validateObjective(),false);assert.match(game.engine.state.active.reason,/contact is missing/);
});
check('failed objectives clear temporary enemies and contacts without changing rewards',()=>{fixture('m27',0);const cash=player.money;game.engine.state.active.data.spawned=1;game.api.enemies().push({x:player.x,y:player.y,hp:80,_mission:game.key()});game.actor={x:player.x,y:player.y,hp:90};game.engine.fail('Regression interruption');game.pumpEvents();assert.equal(game.api.enemies().filter(e=>e._mission).length,0);assert.equal(game.actor,null);assert.equal(player.money,cash);assert(game.retry().ok)});
check('damaged route state yields recovery instead of throwing during navigation',()=>{
 fixture('m10',2);game.engine.state.active.data.points={broken:true};assert.equal(game.marker(),null);assert.equal(game.validateObjective(),false);assert.match(game.engine.state.active.reason,/route is damaged/);assert(game.retry().ok);assert(Array.isArray(game.route(game.stage(),game.engine.state.active.data)));
});
check('putting optional jobs aside resumes main and retains optional reward ledger',()=>{
 fixture('m07');const mainKey=game.key();assert(game.accept('side-static-1').ok);flush();const run=game.engine.state.active.run;game.engine.state.active.claimed['stage:0']=true;game.progression.addItem('collectible-cassette',1);assert(game.abandonOptional().ok);assert.equal(game.key(),mainKey);assert.equal(game.definition().id,'m07');assert.equal(game.progression.count('collectible-cassette'),1);assert(game.accept('side-static-1').ok);flush();assert.equal(game.engine.state.active.run,run);assert.equal(game.engine.state.active.claimed['stage:0'],true);
});
check('whole-operation restart retains its run and refuses to erase recorded choices',()=>{
 fixture('m08');const run=game.engine.state.active.run;assert(game.restartMission().ok);assert.equal(game.engine.state.active.run,run);flush();game.engine.state.active.choices['recorded-decision']=0;assert.equal(game.restartMission().ok,false);assert(game.restartCheckpoint().ok);
});
check('known damaged saved objectives retain mission identity and retry path',()=>{
 const saved=game.export();saved.engine.active={...saved.engine.active,id:'m10',stage:999,checkpoint:2,run:22};game.reset(saved,6);assert.equal(game.definition().id,'m10');assert.equal(game.engine.state.active.status,'failed');assert.match(game.engine.state.active.reason,/Saved objective/);assert(game.retry().ok);assert.equal(game.engine.state.active.stage,2);
});
console.log(`${checks} living mission interaction/recovery checks passed`);
