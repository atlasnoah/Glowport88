'use strict';
// Actual production-host ambient simulation. Travel and time are accelerated;
// vehicle/pedestrian updates, collision checks and route decisions are untouched.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],samples=[],timings=[],visited=new Map(),motionWindows=[];
const sourceHashes=Object.fromEntries(['Glowport88_ArtRehaul_v11.html','assets/ambient-traffic.js','assets/ambient-pedestrians.js','assets/neighborhood-details.js','assets/art.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'Glowport88',file))).digest('hex')]));
let browser,server,page;
const check=async(name,run)=>{await run();checks.push(name);console.log('PASS city-life host:',name)};

async function snapshot(){return page.evaluate(()=>{
 const t=GlowportTest,g=t.system,cars=g.api.cars(),npcs=g.api.npcs(),nav=t.cityLayout.navigation;
 return {clock:g.api.world().clock,diagnostics:t.ambientDiagnostics(),
  cars:cars.map(c=>({id:c.id,x:c.x,y:c.y,speed:c.speed,ai:c.ai,personal:c.personal,mission:c._missionTarget,
   district:g.api.district(c.x,c.y).id,solid:g.api.solid(c.x,c.y,18),road:nav.isRoad(c.x,c.y,12)})),
  npcs:npcs.map(n=>({id:n.id,x:n.x,y:n.y,solid:g.api.solid(n.x,n.y,8),distance:n._ambientDistance||0,
   trips:n._ambientTrips||0,crossings:n._ambientCrossings||0,stuck:n.stuckTime||0})),
  terrain:t.terrain(),camera:{...t.getState().camera},player:{...t.getState().player},
  mission:JSON.parse(JSON.stringify(g.engine.state.active)),actor:JSON.parse(JSON.stringify(g.actor))};
})}

function validate(sample,baseline){
 const ambient=sample.cars.filter(c=>c.ai&&!c.personal&&!c.mission);
 assert(sample.cars.every(c=>[c.x,c.y,c.speed].every(Number.isFinite)),'All vehicle positions/speeds must remain finite');
 assert(sample.npcs.every(n=>[n.x,n.y].every(Number.isFinite)),'All civilian positions must remain finite');
 assert.deepEqual(ambient.filter(c=>c.solid||!c.road).map(c=>c.id),[],'Ambient vehicles must remain on the original collision-free roads');
 assert.deepEqual(sample.npcs.filter(n=>n.solid).map(n=>n.id),[],'Pedestrian centers must remain outside building collision geometry');
 assert(ambient.length<=43,'Ambient traffic may never exceed the configurable 43-car budget');
 assert(sample.npcs.length<=170,'Ambient civilians may never exceed the 170-person budget');
 assert(ambient.length>=25,'Fixing congestion must not empty the city of moving cars');
 assert(sample.npcs.length>=50,'Population management must retain a living city');
 assert(sample.terrain.estimatedResidentMiB<=24,'Original terrain memory budget remains bounded');
 assert(sample.cars.some(c=>c.id==='starter'&&c.personal),'The persistent starter car must survive population management');
 if(baseline)assert.deepEqual(sample.mission,baseline.mission,'Ambient-only simulation must not advance or rewrite a scripted objective');
 for(const car of ambient){if(!visited.has(car.id))visited.set(car.id,new Set());visited.get(car.id).add(car.district)}
}

function validateRollingMotion(){
 if(samples.length<7)return;
 const before=samples[samples.length-7],after=samples.at(-1),oldNPCs=new Map(before.npcs.map(n=>[n.id,n]));
 const oldCars=new Map(before.diagnostics.traffic.cars.map(c=>[c.id,c]));
 const npcs=after.npcs.filter(n=>oldNPCs.has(n.id)).map(n=>({id:n.id,distance:n.distance-oldNPCs.get(n.id).distance,x:n.x,y:n.y}));
 const cars=after.diagnostics.traffic.cars.filter(c=>!c.protected&&oldCars.has(c.id)).map(c=>({id:c.id,distance:c.distance-oldCars.get(c.id).distance,reason:c.reason,x:c.x,y:c.y}));
 const row={fromClock:before.clock,toClock:after.clock,minNPCDistance:Math.min(...npcs.map(n=>n.distance)),minCarDistance:Math.min(...cars.map(c=>c.distance)),starvedNPCs:npcs.filter(n=>n.distance<30),starvedCars:cars.filter(c=>c.distance<30)};
 motionWindows.push(row);
 assert.deepEqual(row.starvedNPCs,[],'Every civilian must resume meaningful movement within a rolling 120-second window: '+JSON.stringify(row));
 assert.deepEqual(row.starvedCars,[],'Every unprotected ambient vehicle must resume movement within a rolling 120-second window without unexplained permanent blockage: '+JSON.stringify(row));
}

(async()=>{try{
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const url=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',data=>{text+=data;const m=text.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}/Glowport88_ArtRehaul_v11.html?debug=1`)}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
 await page.addInitScript(()=>{
  // Make simulation advancement explicit and reproducible rather than racing
  // background requestAnimationFrame callbacks during a long browser evaluation.
  window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
  localStorage.setItem('glowport88-debug-v04',JSON.stringify({version:6,mapVersion:3,story:21,money:32100,x:2320,y:1180}));
 });
 await page.goto(url);await page.waitForFunction(()=>window.GlowportTest?.ambientStep&&!document.querySelector('#startBtn').disabled);
 await page.locator('#startBtn').click();
 await page.evaluate(()=>{const t=GlowportTest,g=t.system;g.nextEvent=1e12;g.offer=null;g.forceWanted(0);g.api.player().invuln=1e8;t.setEnvironment(12,'CLEAR');t.ambientStep(.1,.05)});
 const baseline=await snapshot();validate(baseline);
 assert(baseline.diagnostics.pedestrians.entities.filter(n=>!n.protected).every(n=>n.waypoints>0),'Every initial ambient citizen needs a valid sidewalk route');
 console.log('Initial actual-host population:',baseline.cars.length,'vehicles /',baseline.npcs.length,'civilians; all ambient citizens have routes');
 const started=Date.now();

 await check('30 simulated minutes keep traffic and civilians bounded on the restored city',async()=>{
  const landmarks=['hotel','radio','observatory','clinic','warehouse'];
  for(let batch=0;batch<90;batch++){
   if(batch%18===0)await page.evaluate(key=>{GlowportTest.teleport(key);GlowportTest.system.api.player().invuln=1e8},landmarks[Math.floor(batch/18)]);
   const result=await page.evaluate(()=>{
    const t=GlowportTest,g=t.system,elapsed=performance.now(),camera=g.api.camera();let visibleJumps=0;
    // Each production update is only 50ms. Offscreen recovery may relocate an
    // unrecoverable ambient entity, but visible vehicles/NPCs must never jump.
    const visible=p=>p.x>=camera.x-32&&p.x<=camera.x+832&&p.y>=camera.y-32&&p.y<=camera.y+482;
    for(let step=0;step<400;step++){
     const before=new Map([...g.api.cars(),...g.api.npcs()].map(e=>[e,{x:e.x,y:e.y,visible:visible(e)}]));
     t.ambientStep(.05,.05);
     for(const e of [...g.api.cars(),...g.api.npcs()]){const p=before.get(e);if(p&&(p.visible||visible(e))&&Math.hypot(e.x-p.x,e.y-p.y)>18)visibleJumps++}
    }
    t.drawGame();return {milliseconds:performance.now()-elapsed,visibleJumps};
   });
   timings.push(result.milliseconds);assert.equal(result.visibleJumps,0,'Traffic or pedestrian recovery must never visibly teleport');
   const sample=await snapshot();samples.push(sample);validate(sample,baseline);validateRollingMotion();
   if((batch+1)%9===0)console.log('Simulated ambient minutes:',(batch+1)/3);
  }
  const after=samples.at(-1);assert(after.clock-baseline.clock>=1800-.1,'Actual 50ms ambient updates must advance at least 1,800 seconds');
 });

 const after=await snapshot();
 await check('long-running traffic reaches new routes and travels between neighborhoods',async()=>{
  const crossDistrict=[...visited].filter(([,districts])=>districts.size>=2);
  assert(crossDistrict.length>=15,'At least fifteen observed cars must roam beyond their original district');
  assert(new Set([...visited.values()].flatMap(s=>[...s])).size===5,'Traffic must reach all five existing neighborhoods');
  const d=after.diagnostics.traffic;
  assert(d,'Production traffic diagnostics must remain available after the soak');
  assert(d.distance>100000,'Traffic must actually drive a substantial distance rather than merely advancing a simulation clock');
  assert(d.trips>43&&d.turns>43,'Cars must select further destinations and make real intersection turns');
  assert.equal(d.invalidSteps,0,'Production traffic must not repeatedly attempt collision-invalid road steps');
  assert(d.cars.filter(c=>!c.protected).every(c=>c.distance>1000),'Every remaining ambient car must make meaningful progress during the soak');
 });
 await check('civilians continue traveling and using crosswalks after long simulation',async()=>{
  const walkers=after.npcs.filter(n=>n.distance>400),crossers=after.npcs.filter(n=>n.crossings>0);
  assert(walkers.length>=Math.floor(after.npcs.length*.8),'At least eighty percent of civilians must actually walk over 400px, not remain decorations');
  assert(after.npcs.every(n=>n.distance>30),'No ambient citizen may remain permanently frozen throughout the thirty-minute simulation');
  assert(crossers.length>=10,'Ambient civilians must actually travel across existing crosswalk connections');
 });

 let actorProof;
 await check('ambient updates preserve actual protected mission actors and target vehicles',async()=>{
  actorProof=await page.evaluate(()=>{
   const t=GlowportTest,g=t.system;g.fixture('m13',2);g.dialogues=[];g.offer=null;g.nextEvent=1e12;t.teleport('club');g.tick(.02);
   const actor=g.actor;if(!actor)throw Error('Production defend objective did not create its protected actor');
   const actorBefore=JSON.stringify(actor),missionBefore=JSON.stringify(g.engine.state.active),enemiesBefore=JSON.stringify(g.api.enemies());
   t.ambientStep(30,.05);
   const result={actorUnchanged:JSON.stringify(g.actor)===actorBefore,objectiveUnchanged:JSON.stringify(g.engine.state.active)===missionBefore,enemiesUnchanged:JSON.stringify(g.api.enemies())===enemiesBefore};
   g.fixture('m12',2);g.dialogues=[];t.teleport('warehouse');g.tick(.02);const target=g.api.cars().find(c=>c._missionTarget);
   if(!target)throw Error('Production chase objective did not designate a target vehicle');
   const targetId=target.id;t.ambientStep(60,.05);result.targetPreserved=g.api.cars().includes(target)&&target.id===targetId&&!!target._missionTarget;result.targetFinite=[target.x,target.y].every(Number.isFinite);return result;
  });
  assert(Object.values(actorProof).every(Boolean),'Ambient population logic must preserve story actors, enemies, target vehicles and objective data: '+JSON.stringify(actorProof));
 });

 let missionProof;
 await check('main jobs, side jobs and random encounters remain startable after the city soak',async()=>{
  missionProof=await page.evaluate(()=>{
   const t=GlowportTest,g=t.system;g.reset(null,6);g.dialogues=[];g.offer=null;g.nextEvent=1e12;g.forceWanted(0);
   const main=g.engine.state.active?.id,side=g.accept('side-darla-1');g.dialogues=[];
   const sideId=g.engine.state.active?.id,putAside=g.abandonOptional();g.dialogues=[];
   g.reset(null,21);g.dialogues=[];t.teleport('diner');const offer=g.offerEvent('event-lost-wallet');
   const offeredId=g.offer?.id,accepted=g.accept('event-lost-wallet');g.dialogues=[];
   return {main,side:side.ok,sideId,putAside:putAside.ok,offer:!!offer,offeredId,event:accepted.ok,eventId:g.engine.state.active?.id};
  });
  assert.equal(missionProof.main,'m07');assert(missionProof.side&&missionProof.putAside);assert.equal(missionProof.sideId,'side-darla-1');
  assert(missionProof.offer&&missionProof.event);assert.equal(missionProof.offeredId,'event-lost-wallet');assert.equal(missionProof.eventId,'event-lost-wallet');
 });

 await check('East Diner remains enterable and exitable through actual E interactions',async()=>{
  await page.evaluate(()=>{const t=GlowportTest,g=t.system;g.reset(null,21);g.dialogues=[];g.offer=null;g.nextEvent=1e12;t.teleport('diner');g.api.hud()});
  const actions=await page.evaluate(()=>GlowportTest.interactions());assert(actions.some(a=>a.id==='door-diner'));
  if(actions[0].id==='door-diner')await page.keyboard.press('e');else{await page.locator('#interactionMore').click();await page.locator('[data-interaction-id="door-diner"]').click()}
  assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),'diner');
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),null);
 });

 let savedProof;
 await check('current saves and a legacy ring-traffic vehicle reload without losing progress',async()=>{
  savedProof=await page.evaluate(()=>{
   const t=GlowportTest,g=t.system;g.reset(null,21);g.dialogues=[];g.offer=null;g.nextEvent=1e12;t.teleport('hotel');
   const persistent=g.api.cars().find(c=>c.id==='starter');persistent.paint='blue';persistent.health=83;g.api.player().money=27654;g.api.save();
   const saved=JSON.parse(localStorage.getItem(t.debugSaveKey));
   // An older saved driven AI car may contain only its original ring coordinates.
   saved.gameplay.drivenCars.push({id:'legacy-ai-proof',x:900,y:1192,angle:Math.PI/2,speed:60,targetSpeed:90,ai:true,ring:'west',trackDist:25,_trafficMapVersion:3,wasDriven:true,modelId:'sedan',health:91,w:17,h:32});
   localStorage.setItem(t.debugSaveKey,JSON.stringify(saved));return {money:saved.money,completed:Object.keys(saved.gameplay.engine.completed).length};
  });
  // The init script creates only the first seeded fixture; remove it before reload
  // so browser storage, including the legacy vehicle, remains the source of truth.
  // addInitScript persists across reload. Protect the existing saved bytes first.
  const storage=await page.evaluate(()=>localStorage.getItem(GlowportTest.debugSaveKey));
  const reloadPage=await page.context().newPage();reloadPage.on('pageerror',e=>errors.push(e.stack));
  await reloadPage.addInitScript(value=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};localStorage.setItem('glowport88-debug-v04',value)},storage);
  await reloadPage.goto(url);await reloadPage.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await reloadPage.locator('#startBtn').click();
  const restored=await reloadPage.evaluate(()=>{const t=GlowportTest,g=t.system;t.ambientStep(2,.05);const starter=g.api.cars().find(c=>c.id==='starter'),legacy=g.api.cars().find(c=>c.id==='legacy-ai-proof');return {money:g.api.player().money,completed:Object.keys(g.engine.state.completed).length,starters:g.api.cars().filter(c=>c.id==='starter').length,starter:{paint:starter.paint,health:starter.health},legacy:legacy?{id:legacy.id,x:legacy.x,y:legacy.y,finite:[legacy.x,legacy.y].every(Number.isFinite),solid:g.api.solid(legacy.x,legacy.y,18),road:t.cityLayout.navigation.isRoad(legacy.x,legacy.y,12)}:null}});
  assert.equal(restored.money,savedProof.money);assert.equal(restored.completed,savedProof.completed);assert.equal(restored.starters,1);assert.deepEqual(restored.starter,{paint:'blue',health:83});assert(restored.legacy?.finite&&!restored.legacy.solid&&restored.legacy.road,'A legacy driven AI car must rehydrate to a valid original street without crashing');savedProof.restored=restored;await reloadPage.close();
 });
 await check('browser host has no new critical script or asset errors',async()=>assert.deepEqual(errors,[]));
 await page.screenshot({path:path.join(out,'citylife-host.png')});
 const result={time:new Date().toISOString(),sourceHashes,checks,errors,baseline,after,actorProof,missionProof,savedProof,motionWindows,
  simulation:{seconds:1800,deltaSeconds:.05,updates:36000,wallMilliseconds:Date.now()-started,maxCars:Math.max(...samples.map(s=>s.cars.length)),maxNPCs:Math.max(...samples.map(s=>s.npcs.length)),maxBatchMilliseconds:Math.max(...timings),crossDistrictCars:[...visited].filter(([,v])=>v.size>1).map(([id,v])=>({id,districts:[...v]}))},
  scope:'Actual Chromium production ambient traffic and pedestrian updates on the restored city, accelerated 50ms simulation across all five neighborhoods; counters, collision, original road bounds, visible relocation, caps, persistent/story entities, mission starts, actual East Diner entry/exit and legacy/current save reload. No physical-device FPS guarantee or full human playthrough claim.'};
 fs.writeFileSync(path.join(out,'citylife-host-results.json'),JSON.stringify(result,null,2)+'\n');fs.rmSync(path.join(out,'citylife-host-failure.txt'),{force:true});
 fs.rmSync(path.join(out,'citylife-host-failure-state.json'),{force:true});
 console.log('PASS city-life host:',checks.length,'checks; 30 actual simulated minutes');
}finally{await browser?.close();server?.kill()}})().catch(async error=>{fs.writeFileSync(path.join(out,'citylife-host-failure.txt'),error.stack);fs.writeFileSync(path.join(out,'citylife-host-failure-state.json'),JSON.stringify({checks,errors,motionWindows,samples:samples.slice(-3)},null,2)+'\n');console.error(error);process.exitCode=1});
