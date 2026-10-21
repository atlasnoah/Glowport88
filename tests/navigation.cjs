'use strict';
// Navigation regressions use the production adapter and renderer. Travel is positioned by
// fixtures; clue inspection, handoffs, completion, acceptance and retry use real UI handlers.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
const ready=new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',d=>{output+=d;const m=output.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}/Glowport88_ArtRehaul_v11.html`)}});server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code))})});
let browser;const passed=[],errors=[];
const check=async(name,fn)=>{await fn();passed.push(name);console.log('PASS',name)};
(async()=>{try{
 const url=await ready;browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 async function dismiss(){for(let i=0;i<60;i++){await page.waitForTimeout(25);if(await page.locator('#conversationPanel').isVisible()){const buttons=page.locator('#conversationChoices button');if(await buttons.count()>1)throw Error('Unexpected branching conversation');await buttons.first().tap()}else if(!await page.evaluate(()=>GlowportTest.system.dialogues.length))return}throw Error('Conversation did not settle')}
 async function scenario(id,index=0){await dismiss();assert(await page.evaluate(([id,index])=>GlowportTest.setMissionStage(id,index),[id,index]));await dismiss()}
 async function rendered(){return page.evaluate(()=>{const g=GlowportTest.system,markers=[],arrows=[],marker=g.api.marker,arrow=g.api.arrow;g.api.marker=(c,x,y,color,label)=>{markers.push({x,y,color,label});return marker(c,x,y,color,label)};g.api.arrow=(dest,color,label)=>{arrows.push({x:dest.x,y:dest.y,color,label});return arrow(dest,color,label)};try{GlowportTest.drawGame();return{markers,arrows,semantic:g.marker(),navigation:g.navigationMarker(),hud:g.hud(),prompt:g.prompt()}}finally{g.api.marker=marker;g.api.arrow=arrow}})}
 async function interact(){await page.locator('#touchE').tap();await dismiss()}
 await page.goto(url);await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);
 // Install migration data before launch, so background autosave cannot replace the fixture.
 await page.evaluate(()=>localStorage.setItem('glowport88-neongrid-v08',JSON.stringify({version:2,story:6,money:50000,owned:[true,true,true,false,false],weapon:2,mag:{pistol:12},ammo:{pistol:84}})));
 await page.reload();await page.locator('#startBtn').tap();await dismiss();

 await check('indoor story objectives draw an outdoor entrance arrow',async()=>{
  await scenario('m07');await page.evaluate(()=>GlowportTest.teleport('hotel'));
  const result=await rendered(),door=await page.evaluate(()=>{const l=GlowportTest.system.location('radio');return{x:l.x,y:l.y}});
  assert.equal(result.semantic.inside,true);assert.equal(result.semantic.where,'radio');assert.equal(result.semantic.x,211);assert.equal(result.semantic.y,223);
  assert.equal(result.navigation.inside,false);assert.equal(result.navigation.navigation,'enter');assert.equal(result.navigation.x,door.x);assert.equal(result.navigation.y,door.y);
  assert(result.arrows.some(a=>a.x===door.x&&a.y===door.y&&a.label==='ENTER'),'Actual world renderer must invoke entrance guidance, not room coordinates');
  await page.screenshot({path:path.join(out,'navigation-entrance.png')});
  await page.evaluate(()=>GlowportTest.teleport('radio'));const nearby=await rendered();assert(nearby.markers.some(m=>m.label==='ENTER'));assert.match(nearby.prompt,/E · ENTER/);
 });
 await check('correct rooms preserve clue targets and wrong rooms show the exit',async()=>{
  await page.evaluate(()=>{GlowportTest.enterInterior('radio');GlowportTest.setInteriorPosition(400,300)});let result=await rendered();
  assert.equal(result.navigation.x,211);assert.equal(result.navigation.y,223);assert(result.markers.some(m=>m.x===211&&m.y===223&&m.label==='MIXING DESK'));assert.equal(result.arrows.length,0);
  await page.evaluate(()=>GlowportTest.enterInterior('hotel'));result=await rendered();assert.equal(result.navigation.navigation,'exit');assert.equal(result.navigation.where,'hotel');assert(result.markers.some(m=>m.x===400&&m.y===370&&m.label==='EXIT'));
 });
 await check('real investigation and handoff retain exit, street and entrance guidance',async()=>{
  await scenario('m07');await page.evaluate(()=>GlowportTest.enterInterior('radio'));
  const clues=await page.evaluate(()=>GlowportTest.system.stage().clues);
  for(const clue of clues){await page.evaluate(p=>GlowportTest.setInteriorPosition(p.x,p.y),clue);await interact()}
  assert.equal(await page.evaluate(()=>GlowportTest.system.stage().type),'collect');
  await page.evaluate(()=>GlowportTest.setInteriorPosition(403,149));await interact();
  assert.equal(await page.evaluate(()=>GlowportTest.system.stage().type),'deliver');let result=await rendered();assert.equal(result.navigation.navigation,'exit');assert(result.markers.some(m=>m.label==='EXIT'));
  await page.evaluate(()=>GlowportTest.setInteriorPosition(400,370));await interact();assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),null);
  result=await rendered();const door=await page.evaluate(()=>{const l=GlowportTest.system.location('records');return{x:l.x,y:l.y}});assert(result.arrows.some(a=>a.x===door.x&&a.y===door.y&&a.label==='ENTER'));
  await page.evaluate(()=>GlowportTest.teleport('records'));await interact();assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),'records');
  await page.evaluate(()=>GlowportTest.setInteriorPosition(403,149));await interact();assert.equal(await page.evaluate(()=>GlowportTest.system.stage().type),'talk');await interact();
  assert.equal(await page.evaluate(()=>GlowportTest.system.engine.state.active.status),'complete');
 });
 await check('completion previews the next unlocked story without autoaccepting it',async()=>{
  const before=await page.evaluate(()=>GlowportTest.system.engine.state.active.id);assert.equal(before,'m07');
  let result=await rendered();assert.equal(result.semantic.preview,true);assert.equal(result.semantic.mission,'m08');assert.equal(result.navigation.navigation,'exit');assert.match(result.hud.objective,/CHANGE OF A LIFETIME/);assert.match(result.hud.objective,/Jobs/i);assert.equal(result.hud.time,null);
  await page.evaluate(()=>{GlowportTest.enterInterior('diner');GlowportTest.setInteriorPosition(403,149)});result=await rendered();assert.equal(result.navigation.preview,true);assert.equal(result.navigation.x,403);assert.equal(result.navigation.y,149);assert.match(result.prompt,/P · JOBS/,'Unaccepted job must guide to phone acceptance instead of a nonfunctional Interact action');
  await page.evaluate(()=>GlowportTest.teleport('hotel'));result=await rendered();assert(result.arrows.some(a=>a.label==='NEXT JOB'));assert.equal(await page.evaluate(()=>GlowportTest.system.engine.state.active.id),'m07');
 });
 await check('next-story guidance survives save and reload',async()=>{
  await page.locator('#saveBtn').tap();await page.reload();await page.locator('#startBtn').tap();await dismiss();const result=await rendered();assert.equal(result.semantic.preview,true);assert.equal(result.semantic.mission,'m08');assert(result.arrows.some(a=>a.label==='NEXT JOB'));
 });
 await check('phone acceptance replaces next-job guidance with the accepted entrance',async()=>{
  await page.locator('#phoneBtn').tap();await page.locator('#phoneTab-jobs').tap();await page.locator('#phonePanel button[data-job-id="m08"]').tap();await dismiss();
  const result=await rendered();assert.equal(await page.evaluate(()=>GlowportTest.system.engine.state.active.id),'m08');assert(!result.semantic.preview);assert.equal(result.semantic.where,'diner');assert.equal(result.navigation.navigation,'enter');assert(result.arrows.some(a=>a.label==='ENTER'));
 });
 await check('route checkpoints and moving pursuit targets retain their world coordinates',async()=>{
  const route=await page.evaluate(()=>{const d=GlowportCampaign.missions.find(m=>m.id==='m10');return d.stages.findIndex(s=>s.type==='drive_route')});await scenario('m10',route);await page.evaluate(()=>GlowportTest.teleport('hotel'));
  let result=await rendered();assert.equal(result.navigation.x,result.semantic.x);assert.equal(result.navigation.y,result.semantic.y);assert(result.arrows.some(a=>a.label==='ROUTE 1'));
  const chase=await page.evaluate(()=>{for(const m of GlowportCampaign.missions){const index=m.stages.findIndex(s=>s.type==='chase');if(index>=0)return{id:m.id,index}}});await scenario(chase.id,chase.index);
  await page.evaluate(()=>{const g=GlowportTest.system,l=g.location(g.stage().where);GlowportTest.setPosition(l.x,l.y);GlowportTest.update(.02)});
  const target=await page.evaluate(()=>{const g=GlowportTest.system,c=g.api.cars().find(c=>c._missionTarget===g.key());if(!c)return null;Object.assign(c,{ai:false,parked:true,speed:0,x:c.x+137,y:c.y+79});return{x:c.x,y:c.y}});assert(target,'Actual pursuit must spawn a marked traffic vehicle');result=await rendered();assert.equal(result.navigation.x,target.x);assert.equal(result.navigation.y,target.y);assert(result.arrows.some(a=>a.x===target.x&&a.y===target.y&&a.label==='TAIL VEHICLE'));
 });
 await check('all post-training story stages resolve world and room coordinates consistently',async()=>{
  const failures=await page.evaluate(()=>{const g=GlowportTest.system,failures=[],missions=GlowportCampaign.missions.slice(6);for(const m of missions){for(let index=0;index<m.stages.length;index++){
   g.fixture(m.id,index);g.api.player().inside=null;const marker=g.marker(),nav=g.navigationMarker();if(!marker||!nav){failures.push(m.id+'/'+index+': missing marker');continue}
   const target=marker.inside?g.location(marker.where):marker;if(nav.inside||nav.x!==target.x||nav.y!==target.y)failures.push(m.id+'/'+index+': outdoor mismatch');
   if(marker.inside){g.api.player().inside=marker.where;const room=g.navigationMarker();if(!room.inside||room.x!==marker.x||room.y!==marker.y)failures.push(m.id+'/'+index+': room mismatch')}
   g.api.player().inside=marker.where==='hotel'?'radio':'hotel';const exit=g.navigationMarker();if(!exit.inside||exit.x!==400||exit.y!==370||exit.navigation!=='exit')failures.push(m.id+'/'+index+': missing exit');
  }}g.api.player().inside=null;return failures});assert.deepEqual(failures,[]);
 });
 await check('failed missions retain retry guidance and restore arrows after retry',async()=>{
  await scenario('m07');await page.evaluate(()=>{GlowportTest.teleport('hotel');const g=GlowportTest.system;g.engine.fail('Navigation regression checkpoint');g.pumpEvents()});let result=await rendered();assert.equal(result.semantic,null);assert.equal(result.navigation,null);assert.match(result.prompt,/RETRY/);assert.equal(result.arrows.length,0);
  await page.locator('#missionRetryBtn').tap();await dismiss();result=await rendered();assert.equal(result.navigation.navigation,'enter');assert(result.arrows.some(a=>a.label==='ENTER'));
 });
 await check('finale completion keeps free roam without an obsolete story arrow',async()=>{
  const index=await page.evaluate(()=>{const m=GlowportCampaign.missions.find(m=>m.id==='m40');return m.stages.findIndex(s=>s.type==='choice'&&s.choices.some(c=>c.ending))});await scenario('m40',index);
  await page.evaluate(()=>{const g=GlowportTest.system;GlowportTest.enterInterior(g.stage().where);GlowportTest.setInteriorPosition(403,149)});await page.locator('#touchE').tap();await page.locator('#conversationPanel').waitFor({state:'visible'});await page.locator('#conversationChoices button').first().tap();await dismiss();
  assert(await page.evaluate(()=>GlowportTest.system.engine.state.ending));await page.evaluate(()=>GlowportTest.teleport('hotel'));const result=await rendered();assert.equal(result.semantic,null);assert.equal(result.navigation,null);assert.equal(result.arrows.length,0);assert.doesNotMatch(result.hud.objective,/next operation/i);
 });
 await check('navigation changes produce no critical browser errors or missing assets',async()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(path.join(out,'navigation-results.json'),JSON.stringify({time:new Date().toISOString(),passed,errors,viewport:{width:390,height:844},scope:'Production navigation resolution and render calls; actual touch investigations, handoffs, story completion/acceptance and checkpoint retry. Fixture travel and catalogue-stage sweep are not a full human campaign playthrough.'},null,2));fs.rmSync(path.join(out,'navigation-failure.txt'),{force:true});console.log(`${passed.length} navigation browser checks passed`);
 }finally{if(browser)await browser.close();server.kill()}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'navigation-failure.txt'),e.stack);process.exitCode=1});
