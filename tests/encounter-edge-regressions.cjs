'use strict';
// Real restored-city race lifecycle: opponents wait for the first vehicle, then
// continue racing independently while the player is on foot or reloads a save.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts'),errors=[],passed=[];
let browser;
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
const ready=new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',data=>{text+=data;const match=text.match(/port (\d+)/);if(match){clearTimeout(timer);resolve(`http://127.0.0.1:${match[1]}/Glowport88_ArtRehaul_v11.html?debug=1`)}});server.once('error',reject)});
(async()=>{try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',error=>errors.push(error.stack));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto(await ready);await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').tap();
 async function dismiss(){for(let n=0;n<40;n++){if(await page.locator('#conversationPanel').isVisible())await page.locator('#conversationChoices button').first().tap();else if(!await page.evaluate(()=>GlowportTest.system.dialogues.length))return;await page.waitForTimeout(15)}throw Error('Dialogue did not settle')}
 async function check(name,run){await run();passed.push(name);console.log('PASS encounter edge:',name)}
 await page.evaluate(()=>{const g=GlowportTest.system,p=g.api.player();g.offer=null;g.nextEvent=1e12;g.forceWanted(0);p.inCar=null;p.inside=null;p.hp=150;p.invuln=1e6;g.fixture('event-street-race',1)});await dismiss();
 await check('race rivals wait until the player first acquires a vehicle',async()=>{await page.evaluate(()=>{for(let n=0;n<10;n++)GlowportTest.update(.1)});assert.equal(await page.evaluate(()=>GlowportTest.system.api.cars().filter(c=>c.racing).length),0)});
 await check('started rivals continue moving when the player leaves their vehicle',async()=>{
  await page.evaluate(()=>{const g=GlowportTest.system,p=g.api.player(),car=g.api.cars().find(c=>c.personal),road=g.api.road(p.x,p.y);Object.assign(car,{x:road.x,y:road.y,health:100,speed:0,ai:false});p.inCar=car;GlowportTest.update(.1)});
  const spacing=await page.evaluate(()=>{const g=GlowportTest.system,rivals=g.engine.state.active.data.rivals,p=g.api.player().inCar;return{player:rivals.map(r=>Math.hypot(r.x-p.x,r.y-p.y)),rivals:Math.hypot(rivals[0].x-rivals[1].x,rivals[0].y-rivals[1].y)}});
  assert(spacing.player.every(d=>d>=34)&&spacing.rivals>=34,'Rivals must not spawn inside the player or each other: '+JSON.stringify(spacing));
  const before=await page.evaluate(()=>GlowportTest.system.engine.state.active.data.rivals.map(r=>({x:r.x,y:r.y,raceTime:r.raceTime})));
  assert.equal(before.length,2);await page.evaluate(()=>{const p=GlowportTest.system.api.player();p.x=p.inCar.x+40;p.y=p.inCar.y;p.inCar.speed=0;p.inCar=null;for(let n=0;n<10;n++)GlowportTest.update(.1)});
  const after=await page.evaluate(()=>GlowportTest.system.engine.state.active.data.rivals.map(r=>({x:r.x,y:r.y,raceTime:r.raceTime})));
  for(let i=0;i<2;i++){assert(after[i].raceTime>before[i].raceTime+.9,'Opponent race time must not pause on foot');assert(Math.hypot(after[i].x-before[i].x,after[i].y-before[i].y)>20,'Opponent must continue driving on foot')}
 });
 await check('disabled opponents stop while undamaged rivals keep racing',async()=>{
  const before=await page.evaluate(()=>{const g=GlowportTest.system,rivals=g.engine.state.active.data.rivals;rivals[0].health=0;rivals[0].speed=90;return rivals.map(r=>({x:r.x,y:r.y}))});
  await page.evaluate(()=>{for(let n=0;n<10;n++)GlowportTest.update(.1)});const after=await page.evaluate(()=>GlowportTest.system.engine.state.active.data.rivals.map(r=>({x:r.x,y:r.y,speed:r.speed})));
  assert.equal(after[0].x,before[0].x,'A destroyed opponent must stay stopped');assert.equal(after[0].y,before[0].y);assert.equal(after[0].speed,0);assert(Math.hypot(after[1].x-before[1].x,after[1].y-before[1].y)>20);
 });
 await check('reloading a race while on foot resumes opponents without duplicating cars',async()=>{
  await page.locator('#saveBtn').tap();await page.reload();await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').tap();await dismiss();
  assert.equal(await page.evaluate(()=>GlowportTest.getState().car),false);const before=await page.evaluate(()=>GlowportTest.system.engine.state.active.data.rivals.map(r=>r.raceTime));await page.evaluate(()=>{for(let n=0;n<10;n++)GlowportTest.update(.1)});
  const result=await page.evaluate(()=>{const g=GlowportTest.system;return{times:g.engine.state.active.data.rivals.map(r=>r.raceTime),cars:g.api.cars().filter(c=>c.racing).length,safe:g.engine.state.active.data.rivals.every(r=>!g.api.solid(r.x,r.y,18)),status:g.engine.state.active.status}});
  assert.equal(result.cars,2);assert(result.safe);assert.equal(result.status,'active');for(let i=0;i<2;i++)assert(result.times[i]>before[i]+.9);
 });
 await check('all 32 event scenes spawn safely and remove their temporary actors and cars',async()=>{
  const result=await page.evaluate(()=>{const g=GlowportTest.system,d=g.encounters;d.clear();const baseline=g.api.cars().length,failures=[];for(const def of GlowportSideContent.events){const origin=d.point(def);if(!origin){failures.push(def.id+': no reachable scene');continue}for(const active of[false,true]){d.update({catalogue:GlowportSideContent.events,offer:active?null:{id:def.id,...origin},definition:active?def:null,active:active?{id:def.id,run:9000,stage:0,status:'active',data:{}}:null,stage:active?def.stages[0]:null,dt:.1});if(!d.scene||!d.scene.actors.length||d.scene.actors.some(a=>g.api.solid(a.x,a.y,9)))failures.push(def.id+': invalid actor');if(d.scene?.vehicle&&g.api.solid(d.scene.vehicle.x,d.scene.vehicle.y,19))failures.push(def.id+': invalid vehicle');if(g.api.cars().length>baseline+1)failures.push(def.id+': accumulating cars')}d.update({dt:.1});if(d.scene||g.api.cars().length!==baseline)failures.push(def.id+': incomplete cleanup')}return{count:GlowportSideContent.events.length,failures}});
  assert.equal(result.count,32);assert.deepEqual(result.failures,[]);
 });
 assert.deepEqual(errors,[]);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'encounter-edge-results.json'),JSON.stringify({time:new Date().toISOString(),passed,errors,scope:'Actual restored mobile Chromium host, production updates and normal Save/Start taps; controlled time steps test race lifecycle and all32offer/active-scene spawn/cleanup geometry. No physical device or full human event-outcome claim.'},null,2)+'\n');
 console.log(`${passed.length} encounter edge browser checks passed`);
}finally{await browser?.close();server.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
