'use strict';
// Browser objectives, not a simulated full-campaign playthrough. Fixtures select scenarios;
// progression below is earned through the actual input/interaction/deadline handlers.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
const ready=new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',d=>{text+=d;const m=text.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}/Glowport88_ArtRehaul_v11.html`)}});server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code))})});
let browser;const passed=[],errors=[];
const check=async(name,fn)=>{await fn();passed.push(name);console.log('PASS',name)};
(async()=>{try{
 const url=await ready;browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 async function dismiss(){for(let i=0;i<40;i++){await page.waitForTimeout(40);if(!await page.locator('#conversationPanel').isVisible()){const pending=await page.evaluate(()=>GlowportTest.system.dialogues?.length||0);if(pending)continue;return}const choices=await page.locator('#conversationChoices button').count();if(choices>1)return;await page.keyboard.press('Enter')}}
 async function campaign(){return page.evaluate(()=>GlowportTest.campaign())}
 async function state(){return (await campaign()).state}
 async function scenario(id,index){assert(await page.evaluate(([id,index])=>GlowportTest.setMissionStage(id,index),[id,index]),'Scenario fixture rejected '+id+'/'+index);await dismiss();return campaign()}
 async function atObjective(stage){
  await page.evaluate(s=>{GlowportTest.teleport(s.where);if(s.inside){GlowportTest.enterInterior(s.where);const marker=GlowportTest.system.marker();GlowportTest.setInteriorPosition(marker?.inside?marker.x:403,marker?.inside?marker.y:149)}},stage);await page.waitForTimeout(30);
 }
 await page.goto(url);await page.waitForFunction(()=>window.GlowportTest&&typeof GlowportTest.campaign==='function');
 await page.evaluate(()=>localStorage.setItem('glowport88-neongrid-v08',JSON.stringify({version:2,story:6,money:50000,owned:[true,true,true,false,false],weapon:2,mag:{pistol:12},ammo:{pistol:84}})));
 await page.reload();await page.locator('#startBtn').click();await dismiss();
 await check('v2 save migrates the radio chapter into m07',async()=>{assert.equal((await state()).active.id,'m07');assert.equal(await page.evaluate(()=>GlowportTest.getState().money),50000);assert((await state()).completed.m06)});
 await check('phone freezes simulation and captures gameplay input',async()=>{
  await page.keyboard.press('p');await page.locator('#phonePanel').waitFor({state:'visible'});const before=await page.evaluate(()=>GlowportTest.getState());await page.keyboard.down('w');await page.waitForTimeout(250);await page.keyboard.up('w');await page.keyboard.press('f');const after=await page.evaluate(()=>GlowportTest.getState());assert.equal(after.time,before.time);assert.deepEqual(after.player,before.player);assert.deepEqual(after.ammo,before.ammo);await page.screenshot({path:path.join(out,'overhaul-phone.png')});await page.keyboard.press('Escape');await page.locator('#phonePanel').waitFor({state:'detached'});
 });
 await check('property purchase is a real one-time transaction',async()=>{
  await page.keyboard.press('p');await page.locator('#phoneTab-properties').click();const buy=page.locator('#phonePanel button[data-property-id]:not(:disabled)').first();const property=await buy.getAttribute('data-property-id'),cash=await page.evaluate(()=>GlowportTest.getState().money);const cost=await page.evaluate(id=>GlowportProgression.properties.find(p=>p.id===id).cost,property);await buy.click();assert.equal(await page.evaluate(()=>GlowportTest.getState().money),cash-cost);assert.equal(await page.locator(`#phonePanel button[data-property-id="${property}"]`).count(),0);await page.keyboard.press('Escape');await page.locator('#saveBtn').click();await page.reload();await page.locator('#startBtn').click();await dismiss();const ownership=(await campaign()).progression.properties;assert(ownership[property]?.owned,'Ownership must survive reload');
 });
 await check('phone accepts a side story and persists it',async()=>{
  await page.keyboard.press('p');await page.locator('#phoneTab-jobs').click();const button=page.locator('#phonePanel button[data-job-id^="side-"]:not(:disabled)').first();const id=await button.getAttribute('data-job-id');await button.click();if(await page.locator('#phonePanel').isVisible())await page.keyboard.press('Escape');await dismiss();assert.equal((await state()).active.id,id);await page.locator('#saveBtn').click();await page.reload();await page.locator('#startBtn').click();await dismiss();assert.equal((await state()).active.id,id,'Accepted side story must resume');
 });
 await check('actual ordered investigation advances and reloads',async()=>{
  const index=await page.evaluate(()=>GlowportCampaign.missions.find(m=>m.id==='m07').stages.findIndex(s=>s.type==='investigate'));const data=await scenario('m07',index);const stage=data.stage;assert(stage.clues.length>=2);await atObjective({...stage,inside:true});
  // The final clue cannot finish the objective before earlier evidence is inspected.
  await page.evaluate(n=>GlowportTest.setInteriorPosition(n.x,n.y),stage.clues.at(-1));await page.keyboard.press('e');await dismiss();assert.equal((await state()).active.stage,index);
  for(const clue of stage.clues){await page.evaluate(n=>GlowportTest.setInteriorPosition(n.x,n.y),clue);await page.keyboard.press('e');await dismiss()}
  const after=await state();assert(after.active.stage>index||after.active.status==='complete','All actual clues must advance the objective');const savedStage=after.active.stage;await page.locator('#saveBtn').click();await page.reload();await page.locator('#startBtn').click();await dismiss();assert.equal((await state()).active.stage,savedStage);
 });
 await check('objective deadline fails and checkpoint retry grants no cash',async()=>{
  const fixture=await page.evaluate(()=>{for(const m of GlowportCampaign.missions){const i=m.stages.findIndex(s=>s.timeLimit&&['drive_route','race','chase'].includes(s.type));if(i>=0)return{id:m.id,index:i}}return null});assert(fixture);await scenario(fixture.id,fixture.index);const cash=await page.evaluate(()=>GlowportTest.getState().money);await page.evaluate(()=>{const active=GlowportTest.system.engine.state.active;active.stageElapsed=GlowportTest.campaign().stage.timeLimit-.01;GlowportTest.update(.1)});assert.equal((await state()).active.status,'failed');await page.locator('#missionRetryBtn').waitFor({state:'visible'});await page.locator('#missionRetryBtn').click();await dismiss();assert.equal((await state()).active.status,'active');assert.equal(await page.evaluate(()=>GlowportTest.getState().money),cash);
 });
 await check('heist uses actual timing-window input',async()=>{
  const fixture=await page.evaluate(()=>{for(const m of GlowportCampaign.missions){const i=m.stages.findIndex(s=>s.type==='heist');if(i>=0)return{id:m.id,index:i}}return null});assert(fixture);const data=await scenario(fixture.id,fixture.index);await atObjective({...data.stage,inside:true});await page.keyboard.press('e');await page.locator('#operationPanel').waitFor({state:'visible'});await page.screenshot({path:path.join(out,'overhaul-heist.png')});
  for(let i=0;i<(data.stage.beats||4)+3;i++){if(!await page.locator('#operationPanel').isVisible())break;await page.waitForFunction(()=>{const m=document.querySelector('#operationMeter');if(!m)return false;const phase=Number(m.dataset.phase),low=Number(m.dataset.low),high=Number(m.dataset.high);return Number.isFinite(phase)&&phase>low+.02&&phase<high-.02});await page.locator('#operationHit').click();if(await page.locator('#operationPanel').isVisible())await page.waitForFunction(()=>{const m=document.querySelector('#operationMeter');return !m||Number(m.dataset.phase)<.1})}
  await page.locator('#operationPanel').waitFor({state:'hidden'});await dismiss();const active=(await state()).active;assert.notEqual(active.status,'failed');assert(active.stage>fixture.index||active.status==='complete','Successful timing inputs must advance the heist');
 });
 await check('street encounter offer can be accepted through its dialogue',async()=>{
  await scenario('m07',0);await page.evaluate(()=>GlowportTest.teleport('hotel'));const id=await page.evaluate(()=>GlowportSideContent.events.find(e=>e.minAct===1).id);assert(await page.evaluate(id=>GlowportTest.system.offerEvent(id),id));const offer=(await campaign()).offer;assert(offer);const where=offer.where||offer.definition?.where||await page.evaluate(id=>GlowportSideContent.events.find(e=>e.id===id).where,id);if(where)await page.evaluate(where=>GlowportTest.teleport(where),where);else if(Number.isFinite(offer.x))await page.evaluate(o=>GlowportTest.setPosition(o.x,o.y),offer);await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});await page.keyboard.press('1');await dismiss();assert.equal((await state()).active.id,id);
 });
 await check('all final choices resolve distinct endings with free roam',async()=>{
  const fixture=await page.evaluate(()=>{const m=GlowportCampaign.missions.find(d=>d.id==='m40'),index=m.stages.findIndex(s=>s.type==='choice'&&s.choices.some(c=>c.ending));return {index,choices:m.stages[index].choices}});const endings=[];
  for(let i=0;i<fixture.choices.length;i++){if(!fixture.choices[i].ending)continue;const data=await scenario('m40',fixture.index);await atObjective(data.stage);if(!await page.locator('#conversationPanel').isVisible())await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});await page.locator('#conversationChoices button').nth(i).click();await dismiss();const s=await state();assert.equal(s.ending,fixture.choices[i].ending);assert.equal(s.active.status,'complete');endings.push(s.ending);await page.keyboard.press('m');await page.locator('#mapClose').waitFor({state:'visible'});await page.locator('#mapClose').click()}
  assert(new Set(endings).size>=2);await page.screenshot({path:path.join(out,'overhaul-ending.png')});
 });
 await check('police search begins after losing sight inside',async()=>{
  await scenario('m07',0);await page.evaluate(()=>{GlowportTest.setPosition(2320,1180);GlowportTest.setWanted(2)});await page.waitForFunction(()=>GlowportTest.getPolice().length>0);assert((await page.evaluate(()=>GlowportTest.getState().wanted))>0);
  const approach=await page.evaluate(()=>{const cop=GlowportTest.getPolice()[0];for(const [dx,dy] of [[0,90],[90,0],[0,-90],[-90,0]])if(Array.from({length:10},(_,i)=>({x:cop.x+dx*i/9,y:cop.y+dy*i/9})).every(p=>GlowportTest.canStand(p.x,p.y)))return {x:cop.x+dx,y:cop.y+dy};return null});assert(approach,'Need an unobstructed police sight line');await page.evaluate(p=>GlowportTest.setPosition(p.x,p.y),approach);await page.waitForFunction(()=>GlowportTest.campaign().police.mode==='pursuit');await page.evaluate(()=>GlowportTest.enterInterior('hotel'));await page.evaluate(()=>{for(let i=0;i<70;i++)GlowportTest.update(.1)});const police=(await campaign()).police;assert.equal(police.mode,'search');assert(police.lastKnown,'Search requires a last-known position');
 });

 await check('complete side story consumes its inventory and pays once',async()=>{
  const data=await scenario('side-static-1',0),cash=await page.evaluate(()=>GlowportTest.getState().money);
  await atObjective(data.stage);for(const clue of data.stage.clues){await page.evaluate(n=>GlowportTest.setInteriorPosition(n.x,n.y),clue);await page.keyboard.press('e');await dismiss()}
  assert.equal((await state()).active.stage,1);await page.evaluate(()=>GlowportTest.teleport('records'));await page.keyboard.press('e');assert.equal((await campaign()).progression.inventory['static-decoder'],1);
  await page.evaluate(()=>GlowportTest.teleport('observatory'));await page.keyboard.press('e');assert.equal((await campaign()).progression.inventory['static-decoder'],undefined);
  await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});await page.locator('#conversationChoices button').first().click();await dismiss();assert.equal((await state()).active.status,'complete');assert.equal((await state()).flags.static_first_case,'evidence');assert.equal(await page.evaluate(()=>GlowportTest.getState().money),cash+300);
  await page.locator('#saveBtn').click();await page.reload();await page.locator('#startBtn').click();await dismiss();assert.equal(await page.evaluate(()=>GlowportTest.getState().money),cash+300);
 });
 async function vehicle(){await page.evaluate(()=>{const c=GlowportTest.system.api.cars().find(c=>c.personal&&!c._missionTarget);Object.assign(c,{x:2320,y:1180,speed:0});GlowportTest.setPosition(c.x+24,c.y)});await page.keyboard.press('e');assert(await page.evaluate(()=>GlowportTest.getState().car),'Enter the actual personal vehicle')}
 await check('route checkpoints require driving and a stopped arrival',async()=>{
  const index=await page.evaluate(()=>GlowportCampaign.missions.find(m=>m.id==='m10').stages.findIndex(s=>s.type==='drive_route'));await scenario('m10',index);await vehicle();
  const points=await page.evaluate(()=>GlowportTest.system.route(GlowportTest.system.stage(),GlowportTest.system.engine.state.active.data));
  for(const point of points){await page.evaluate(p=>{const car=GlowportTest.system.api.player().inCar;Object.assign(car,p,{speed:0});GlowportTest.update(.02)},point)}
  assert((await state()).active.stage>index);await dismiss();
 });
 await check('escort boards the getaway and reaches a real handoff',async()=>{
  const fixture=await page.evaluate(()=>{for(const d of GlowportCampaign.missions){const i=d.stages.findIndex(s=>s.type==='escort'&&s.where!==s.fromWhere);if(i>=0)return{id:d.id,index:i}}});const data=await scenario(fixture.id,fixture.index);await vehicle();
  await page.evaluate(s=>{const g=GlowportTest.system,p=g.api.player(),loc=g.location(s.fromWhere||s.where);Object.assign(p.inCar,{x:loc.x,y:loc.y,speed:0})},data.stage);await page.keyboard.press('e');await dismiss();assert(await page.evaluate(()=>GlowportTest.system.actor?.passenger));
  await page.evaluate(s=>{const g=GlowportTest.system,p=g.api.player(),loc=g.location(s.where);Object.assign(p.inCar,{x:loc.x,y:loc.y,speed:0});GlowportTest.update(.02)},data.stage);await page.keyboard.press('e');await dismiss();assert((await state()).active.stage>fixture.index);
 });
 await check('stealth requires crouching through the ordered quiet route',async()=>{
  const fixture=await page.evaluate(()=>{for(const d of GlowportCampaign.missions){const i=d.stages.findIndex(s=>s.type==='stealth');if(i>=0)return{id:d.id,index:i}}});await scenario(fixture.id,fixture.index);
  const points=await page.evaluate(()=>GlowportTest.system.stealthPoints(GlowportTest.system.stage(),GlowportTest.system.engine.state.active.data));await page.evaluate(p=>GlowportTest.setPosition(p.x,p.y),points[0]);await page.evaluate(()=>GlowportTest.update(.02));assert.equal((await state()).active.stage,fixture.index);assert.equal((await state()).active.data.goal,0,'Standing on the point without crouching must not pass');
  await page.keyboard.press('c');for(const point of points){await page.evaluate(p=>GlowportTest.setPosition(p.x,p.y),point);for(let n=0;n<90;n++){if((await state()).active.stage>fixture.index)break;await page.evaluate(()=>GlowportTest.update(.03));if((await state()).active.data.goal>points.indexOf(point))break}}
  assert.notEqual((await state()).active.status,'failed');assert((await state()).active.stage>fixture.index);await page.keyboard.press('c');await dismiss();
 });
 await check('pursuit follows a physical traffic target before the handoff',async()=>{
  const fixture=await page.evaluate(()=>{for(const d of GlowportCampaign.missions){const i=d.stages.findIndex(s=>s.type==='chase');if(i>=0)return{id:d.id,index:i}}});const data=await scenario(fixture.id,fixture.index);await vehicle();
  await page.evaluate(s=>{const g=GlowportTest.system,loc=g.location(s.where);Object.assign(g.api.player().inCar,{x:loc.x,y:loc.y,speed:0});GlowportTest.update(.02)},data.stage);assert((await state()).active.data.target);
  await page.evaluate(seconds=>{const g=GlowportTest.system;for(let i=0;i<(seconds+1)*30;i++){const target=g.api.cars().find(c=>c._missionTarget===g.key());if(!target)break;Object.assign(g.api.player().inCar,{x:target.x+45,y:target.y,speed:0});GlowportTest.update(1/30)}},data.stage.duration||20);
  assert((await state()).active.data.stopped);await page.keyboard.press('e');await dismiss();assert((await state()).active.stage>fixture.index);
 });
 await check('garage storage, tuning and controlled vehicle survive reload',async()=>{
  await scenario('m07',0);await page.evaluate(()=>GlowportTest.system.forceWanted(0));await vehicle();
  await page.evaluate(()=>{const g=GlowportTest.system,loc=g.location('motel');Object.assign(g.api.player().inCar,{x:loc.x,y:loc.y,speed:0,health:50})});
  const purchase=await page.evaluate(()=>GlowportTest.system.purchase('palm-garage'));assert(purchase.ok||purchase.reason==='You already own this property.');
  const cash=await page.evaluate(()=>GlowportTest.getState().money);assert((await page.evaluate(()=>GlowportTest.system.propertyService('palm-garage','repair'))).ok);assert((await page.evaluate(()=>GlowportTest.system.propertyService('palm-garage','tune'))).ok);assert.equal(await page.evaluate(()=>GlowportTest.getState().money),cash-570);
  const stored=await page.evaluate(()=>GlowportTest.system.storeVehicle('palm-garage'));assert(stored.ok);assert.equal((await campaign()).progression.vehicles['palm-garage'][0].tuning,1);assert(!await page.evaluate(()=>GlowportTest.getState().car));
  await page.locator('#saveBtn').click();await page.reload();await page.locator('#startBtn').click();await dismiss();assert.equal((await campaign()).progression.vehicles['palm-garage'][0].tuning,1);
  assert((await page.evaluate(()=>GlowportTest.system.retrieveVehicle('palm-garage'))).ok);await vehicle();await page.locator('#saveBtn').click();assert.equal(await page.evaluate(()=>GlowportTest.system.api.player().inCar.tuning),1);const color=await page.evaluate(()=>GlowportTest.system.api.player().inCar.color);await page.reload();await page.locator('#startBtn').click();await dismiss();assert(await page.evaluate(()=>GlowportTest.getState().car));assert.equal(await page.evaluate(()=>GlowportTest.system.api.player().inCar.color),color);
 });
 await check('no critical browser errors or missing assets',async()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(path.join(out,'overhaul-results.json'),JSON.stringify({time:new Date().toISOString(),passed,errors,scope:'Scenario-based browser mechanic coverage; not a timed full-campaign playthrough'},null,2));fs.rmSync(path.join(out,'overhaul-failure.txt'),{force:true});console.log(`${passed.length} overhaul browser checks passed`);
}finally{if(browser)await browser.close();server.kill()}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'overhaul-failure.txt'),e.stack);process.exitCode=1});
