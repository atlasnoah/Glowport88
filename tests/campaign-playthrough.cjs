 'use strict';
// Accelerated adapter integration: actual objective evaluators and actions, with a deterministic
// host replacing movement/aiming/AI. This proves transitions and inventory, not city navigation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.window=global;for(const name of ['mission-engine','campaign','side-content','progression','police-system','encounter-system','gameplay'])require('../Glowport88/assets/'+name+'.js');
global.GlowportPhone={active:false,close(){}};
const keys=['hotel','armory','club','records','warehouse','radio','arcade','motel','diner','clinic','observatory','pier'];
const locations=keys.map((key,i)=>({key,x:1000+(i%4)*600,y:1000+Math.floor(i/4)*600}));
let player,world,cars,enemies,npcs,dialogue,choice,game,shots=0;
function setup(){player={x:1000,y:1000,ix:403,iy:149,inside:null,money:100000,hp:150,maxHp:150,ammo:{pistol:84},mag:{pistol:12},inCar:null};world={story:6,clock:0,wanted:0};cars=[{id:'driver',x:1000,y:1000,speed:0,health:100,ai:false},{id:'target',x:1000,y:1000,speed:50,health:100,ai:true}];enemies=[];npcs=[];dialogue=null;choice=null;
 const api={player:()=>player,world:()=>world,cars:()=>cars,enemies:()=>enemies,npcs:()=>npcs,cops:()=>[],locations:()=>locations,roadsX:locations.map(l=>l.x),roadsY:locations.map(l=>l.y),solid:()=>false,move:(p,dx,dy)=>{p.x+=dx;p.y+=dy;return false},road:(x,y)=>({x,y}),district:()=>({id:'core'}),random:()=>.4,camera:()=>({x:0,y:0}),recenter(){},announce(){},save(){},hud(){},busy:()=>!!dialogue||!!choice,resetControls(){},dialogue:(who,lines,callback)=>{dialogue={lines,callback}},choice:(who,text,options,unused,callback)=>{choice={options,callback}}};game=new GlowportGameplay(api);game.reset(null,6);game.nextEvent=1e12;
 // Preserve the actual timing minigame's completion boundary; browser tests cover its DOM/input.
 game.openOperation=()=>{throw Error('The timing minigame must be completed by the harness signal interface')};
}
function flush(){for(let i=0;i<100;i++){game.uiTick();if(dialogue){const q=dialogue;dialogue=null;q.callback?.()}else if(!game.dialogues.length)return}throw Error('Dialogue loop')}
function step(dt=.01){world.clock+=dt;game.policeTick(dt);game.tick(dt);flush()}
function at(stage,where=stage.where){const loc=game.location(where);player.x=loc.x;player.y=loc.y;player.inside=stage.inside?where:null;player.ix=game.roomPoint(stage).x;player.iy=game.roomPoint(stage).y;if(player.inCar){player.inCar.x=loc.x;player.inCar.y=loc.y;player.inCar.speed=0}}
function drive(){player.inside=null;player.inCar=cars.find(c=>c.id==='driver');player.inCar.x=player.x;player.inCar.y=player.y;player.inCar.speed=0;player.inCar.wasDriven=true}
let stageCount=0,completeCount=0;const byType={},results=[];
function run(def,optionIndex=0){flush();assert.equal(game.definition().id,def.id);for(let guard=0;guard<60&&game.active()&&game.definition()?.id===def.id;guard++){
 const stage=game.stage(),active=game.engine.state.active,index=active.stage;byType[stage.type]=(byType[stage.type]||0)+1;stageCount++;
 switch(stage.type){
 case 'legacy':world.story=stage.chapter;step();break;
 case 'go':at(stage);step();break;
 case 'talk':case 'interact':case 'collect':case 'deliver':case 'choice':{
  if(stage.needsCar&&!stage.inside)drive();at(stage);
  if(stage.needsCar&&stage.inside){const car=cars.find(c=>c.id==='driver');Object.assign(car,{x:player.x,y:player.y,wasDriven:true});player.inCar=null}
  assert(game.action(),`${def.id}/${index} action rejected`);flush();
  if(stage.type==='choice'){assert(choice,`${def.id}/${index} missing choice`);const q=choice;choice=null;q.callback(Math.min(optionIndex,q.options.length-1));flush()}
  break;
 }
 case 'investigate':player.inCar=null;at(stage);for(const clue of stage.clues){player.ix=clue.x;player.iy=clue.y;assert(game.action());flush()}break;
 case 'acquire_vehicle':at(stage);drive();step();break;
 case 'drive_route':case 'race':{
  at(stage);drive();const points=game.route(stage,active.data);for(const point of points){Object.assign(player.inCar,point);step()}break;
 }
 case 'combat':case 'defend':{
  player.inCar=null;at(stage);step();assert(enemies.some(e=>e._mission===game.key()),`${def.id}/${index} must spawn real opponents`);
  // Damage comes from a deterministic combat host. No objective flags or stage methods are set.
  for(const enemy of enemies.filter(e=>e._mission===game.key())){while(enemy.hp>0){enemy.hp-=26;shots++}}
  for(let n=0;n<(stage.duration||0)*10+2&&game.active()&&game.stage()===stage;n++)step(.1);step();break;
 }
 case 'stealth':{
  player.inCar=null;at(stage);player.sneaking=true;const points=game.stealthPoints(stage,active.data);for(const point of points){if(stage.inside){player.ix=point.x;player.iy=point.y}else{player.x=point.x;player.y=point.y}step()}player.sneaking=false;break;
 }
 case 'escort':{
  at({...stage,inside:false},stage.fromWhere||stage.where);drive();assert(game.action());flush();assert(game.actor?.hp>0,`${def.id}/${index} escort pickup; choice=${!!choice} offer=${game.offer?.id}`);step();at({...stage,inside:false});assert(game.action());flush();break;
 }
 case 'chase':{
  at(stage);drive();const target=cars.find(c=>c.id==='target');Object.assign(target,{ai:true,x:player.x+50,y:player.y});step();
  for(let n=0;n<(stage.duration||20)*10+2&&game.active()&&game.stage()===stage;n++){const marked=cars.find(c=>c._missionTarget===game.key());assert(marked);player.inCar.x=marked.x+45;player.inCar.y=marked.y;step(.1)}
  assert(game.action());flush();break;
 }
 case 'escape':{
  player.inCar=null;player.inside='hotel';for(let n=0;n<2000&&game.active()&&game.stage()===stage;n++)step(.1);player.inside=null;break;
 }
 case 'heist':{
  // Timing is covered through actual input in overhaul.cjs. Here invoke the same successful
  // close boundary as the host so every subsequent collect/deliver/escape chain is exercised.
  at(stage);active.data.done=true;active.data.precision=1;if(!stage.lawful)game.forceWanted(Math.max(world.wanted,stage.heat||1.5));step();break;
 }
 default:throw Error('Unhandled '+stage.type);
 }
 const after=game.engine.state.active;
 assert(after.status!=='failed',`${def.id}/${index}: ${after.reason}`);
 assert(after.id!==def.id||after.stage!==index||after.status==='complete',`${def.id}/${index} ${stage.type} did not advance; ${JSON.stringify(after.data)}`);
 }
 assert(game.engine.state.completed[def.id],def.id+' did not complete');completeCount++;results.push(def.id);
}

const endings=['broadcast','control','deal'];
for(let selection=0;selection<3;selection++){
 setup();flush();for(const def of GlowportCampaign.missions.slice(6)){if(game.definition()?.id!==def.id||!game.active()){const result=game.accept(def.id);assert(result.ok,def.id+': '+result.reason)}run(def,selection)}
 assert.equal(Object.keys(game.engine.state.completed).filter(id=>id.startsWith('m')).length,40);assert.equal(game.engine.state.ending,endings[selection]);
 for(const def of GlowportSideContent.missions){assert(game.accept(def.id).ok,def.id+' unavailable after campaign');run(def,selection)}
 for(const def of GlowportSideContent.events){assert(game.accept(def.id).ok);run(def,selection)}
 assert.equal(game.engine.state.ending,endings[selection]);assert(game.engine.state.flags.safehouseAccess&&game.engine.state.flags.garageAccess&&game.engine.state.flags.businessAccess);
 const saved=game.export(),cash=player.money;game.reset(saved,world.story);flush();assert.equal(player.money,cash,'Loading a completion cannot pay it again');assert.equal(game.engine.state.ending,endings[selection]);
}
// A suspended main objective resumes without clearing police or duplicating the old tutorial.
setup();flush();const mainKey=game.key();assert.equal(game.accept('m07').ok,false,'Accepting an active mission cannot restart it');game.forceWanted(2);assert(game.accept('side-static-1').ok);run(GlowportSideContent.missions.find(d=>d.id==='side-static-1'));assert.equal(game.key(),mainKey);assert(world.wanted>0,'Finishing a side job must not erase a pursuit');assert(game.usesCampaign());
// The first successful heist pays a skill bonus; failure removes the clean-run portion.
setup();flush();const def=GlowportCampaign.missions.find(d=>d.id==='m08');game.fixture(def.id,0);flush();run(def);const clean=game.engine.state.completed.m08.reward.cash;
setup();game.fixture(def.id,0);game.engine.state.active.failures=1;run(def);assert(clean>game.engine.state.completed.m08.reward.cash,'Performance must affect money actually paid');
// Retained completed old saves stay completed instead of dropping the player into the finale.
setup();game.reset(null,21);assert.equal(game.engine.state.active,null);assert.equal(game.engine.state.ending,'broadcast');assert.equal(Object.keys(game.engine.state.completed).length,40);
// Owned storage removes regenerated traffic identities and retains tuning without duplicate cars.
setup();const car=cars[0];car.tuning=2;car.wasDriven=true;game.progression.purchaseProperty('palm-garage',100000);assert(game.progression.storeVehicle('palm-garage',car).ok);const savedGarage=game.export();game.reset(savedGarage,6);assert(!cars.some(c=>c.id==='driver'));assert.equal(game.progression.listVehicles('palm-garage')[0].tuning,2);
fs.writeFileSync(path.join(__dirname,'../artifacts/campaign-playthrough-results.json'),JSON.stringify({time:new Date().toISOString(),definitions:[...new Set(results)],uniqueDefinitions:new Set(results).size,completedRuns:completeCount,choiceSweeps:3,stages:stageCount,objectiveTypes:byType,hostShots:shots,scope:'Accelerated adapter integration; deterministic travel/combat host and successful heist boundary. Three ordered choice sweeps cover all authored options, not all combinations. Not a real-time browser campaign playthrough or duration measurement.'},null,2));
console.log(`PASS accelerated campaign integration: ${new Set(results).size} definitions / three choice sweeps / ${stageCount} objectives; handoffs, routes, actors, pursuit, all endings, reward receipts, storage and migration`);
