'use strict';
// A saved v4 AI chase car used distances on the old rectangular circuit.
// Loading it onto a redesigned circuit must not teleport it on its first frame.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
let browser,server;const errors=[];
(async()=>{try{
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const url=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',d=>{output+=d;const m=output.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}/Glowport88_ArtRehaul_v11.html?debug=1`)}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(e.stack));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
 await page.goto(url);await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').tap();
 const prepared=await page.evaluate(()=>{
  const g=GlowportTest.system,def=g.catalogue.find(d=>d.stages.some(s=>s.type==='chase')),index=def.stages.findIndex(s=>s.type==='chase');g.fixture(def.id,index);g.dialogues=[];g.offer=null;g.nextEvent=1e12;g.forceWanted(0);
  const target=g.api.cars().find(c=>c.id==='traffic-west-0'),car=g.api.cars().find(c=>c.personal),p=g.api.player();
  // Exact valid origin of the old west circuit: roadXs[2],roadYs[3].
  Object.assign(target,{x:880,y:1180,trackDist:0,ring:'west',ai:true,speed:73,targetSpeed:80,health:71,modelId:'delivery',_missionTarget:g.key()});
  Object.assign(car,{x:990,y:1180,speed:0,ai:false});p.x=car.x;p.y=car.y;p.inCar=car;p.inside=null;p.invuln=1e6;p.money=12345;g.rewardReceipts={'audit-paid':true};
  const active=g.engine.state.active;active.data={target:true,tail:7,engaged:true,lost:0};active.claimed={'stage:0':true};g.api.save();
  const key=GlowportTest.debugSaveKey,state=JSON.parse(localStorage.getItem(key));state.version=4;delete state.mapVersion;const raw=JSON.stringify(state);localStorage.setItem(key,raw);
  return{key,raw,mission:def.id,index,run:active.run,targetId:target.id};
 });
 await page.reload();await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').tap();
 const result=await page.evaluate(({targetId})=>{
  const g=GlowportTest.system,car=g.api.cars().find(c=>c.id===targetId),active=g.engine.state.active;if(!car)throw Error('Saved chase target disappeared');const before={x:car.x,y:car.y},tail=active.data.tail;
  GlowportTest.update(.016);return{before,after:{x:car.x,y:car.y},jump:Math.hypot(car.x-before.x,car.y-before.y),safe:!g.api.solid(car.x,car.y,19),road:GlowportTest.cityLayout.navigation.isRoad(car.x,car.y,18),id:active.id,stage:active.stage,run:active.run,status:active.status,tailBefore:tail,tailAfter:active.data.tail,marked:car._missionTarget===g.key(),health:car.health,modelId:car.modelId,money:g.api.player().money,receipts:g.rewardReceipts,claimed:active.claimed};
 },prepared);
 assert(result.jump<10,`Saved AI car teleported ${result.jump.toFixed(2)}px on its first16ms frame`);assert(result.safe&&result.road);assert.equal(result.id,prepared.mission);assert.equal(result.stage,prepared.index);assert.equal(result.run,prepared.run);assert.equal(result.status,'active');assert.equal(result.tailBefore,7);assert(result.tailAfter>=7);assert(result.marked);assert.equal(result.health,71);assert.equal(result.modelId,'delivery');assert.equal(result.money,12345);assert.deepEqual(result.receipts,{'audit-paid':true});assert.deepEqual(result.claimed,{'stage:0':true});assert.deepEqual(errors,[]);
 const escort=await page.evaluate(()=>{
  const g=GlowportTest.system,layout=GlowportTest.cityLayout,from=layout.buildings.find(b=>b.id==='parcel-3'),to=layout.buildings.find(b=>b.id==='parcel-371');if(!from||!to)throw Error('Neighborhood escort fixture missing');
  const start={x:from.doorX,y:from.doorY},target={x:to.doorX,y:to.doorY},path=layout.navigation.route(start,target,{vehicle:false});
  const def=g.catalogue.find(d=>d.stages.some(s=>s.type==='escort')),index=def.stages.findIndex(s=>s.type==='escort');g.fixture(def.id,index);g.dialogues=[];g.offer=null;g.nextEvent=1e12;g.forceWanted(0);g.api.enemies().length=0;
  const p=g.api.player();p.inCar=null;p.inside=null;p.x=target.x;p.y=target.y;p.hp=150;p.invuln=1e6;
  g.engine.state.active.data={picked:true,lost:0};g.actor={...start,hp:100,face:'down',shirt:'#4c9b94',id:43,role:'escort',passenger:false};
  let frames=0,solidFrames=0;for(;frames<1800&&Math.hypot(g.actor.x-target.x,g.actor.y-target.y)>36;frames++){g.api.world().clock+=1/30;g.tick(1/30);if(g.api.solid(g.actor.x,g.actor.y,8))solidFrames++}
  return{start,target,pathPoints:path?.length||0,frames,end:{x:g.actor.x,y:g.actor.y},gap:Math.hypot(g.actor.x-target.x,g.actor.y-target.y),solidFrames,status:g.engine.state.active.status,route:g.actor._followRoute,index:g.actor._followIndex};
 });
 assert(escort.pathPoints>=3,'Escort fixture must require a real route around houses');assert(escort.gap<=36,`Escort stuck around residential corners: ${JSON.stringify(escort)}`);assert.equal(escort.solidFrames,0);assert.equal(escort.status,'active');assert.deepEqual(errors,[]);
 const dropoff=await page.evaluate(()=>{
  const g=GlowportTest.system,b=GlowportTest.cityLayout.buildings.find(b=>b.kind==='house'&&!g.api.solid(b.x-10,b.y+b.h/2,9)&&g.api.solid(b.x+5,b.y+b.h/2+15,8));if(!b)throw Error('No real wall-adjacent passenger dropoff fixture');
  const def=g.catalogue.find(d=>d.stages.some(s=>s.type==='escort')),index=def.stages.findIndex(s=>s.type==='escort');g.fixture(def.id,index);g.dialogues=[];g.offer=null;g.nextEvent=1e12;g.forceWanted(0);g.api.enemies().length=0;
  const p=g.api.player();p.x=b.x-10;p.y=b.y+b.h/2;p.inCar=null;p.inside=null;g.actor={x:p.x,y:p.y,hp:83,passenger:true};g.engine.state.active.data={picked:true,lost:0};g.tick(.016);
  const immediateSafe=!g.api.solid(g.actor.x,g.actor.y,8);for(let i=0;i<90;i++){g.api.world().clock+=1/30;g.tick(1/30)}return{building:b.id,playerSafe:!g.api.solid(p.x,p.y,9),immediateSafe,finalSafe:!g.api.solid(g.actor.x,g.actor.y,8),health:g.actor.hp,passenger:g.actor.passenger,gap:Math.hypot(g.actor.x-p.x,g.actor.y-p.y)};
 });
 assert(dropoff.playerSafe&&dropoff.immediateSafe&&dropoff.finalSafe,`Passenger spawned inside a house: ${JSON.stringify(dropoff)}`);assert.equal(dropoff.health,83);assert.equal(dropoff.passenger,false);assert.deepEqual(errors,[]);
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'rebuild-host-audit-results.json'),JSON.stringify({time:new Date().toISOString(),passed:['v4 AI chase target reprojects circuit distance without a first-frame teleport','chase progress, run, marker, model and damaged health survive import','actual escort navigates residential corners without crossing solids','passenger disembarks safely beside a residential wall'],errors,...result,escort,dropoff,scope:'Actual mobile Chromium host: synthetic v4 chase progress reloads through normal save controls and production traffic updates. Fixture-positioned escort scenarios run the production adapter and collision with advancing world time across residential corners and a wall-adjacent passenger dropoff.'},null,2));
 console.log('PASS rebuilt host audit: old AI chase circuit migration has bounded first-frame movement and preserves mission progress; escort corners and wall-adjacent passenger dropoff remain safe');
 }finally{await browser?.close();server?.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
