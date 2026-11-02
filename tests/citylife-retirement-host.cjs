'use strict';
// A real authored chase stops a managed traffic car, then production E contact
// ends its quest protection. Only travel and clock advancement are accelerated.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts'),checks=[],errors=[],quests=[];
fs.mkdirSync(out,{recursive:true});
const sourceHashes=Object.fromEntries(['Glowport88_ArtRehaul_v11.html','assets/ambient-traffic.js','assets/gameplay.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'Glowport88',file))).digest('hex')]));
let browser,server,page;
const check=async(name,run)=>{await run();checks.push(name);console.log('PASS retirement host:',name)};
async function snapshot(id){return page.evaluate(id=>{const t=GlowportTest,g=t.system,c=g.api.cars().find(c=>c.id===id),d=t.ambientDiagnostics().traffic;return {clock:g.api.world().clock,car:c?{id:c.id,x:c.x,y:c.y,ai:c.ai,health:c.health,personal:!!c.personal,wasDriven:!!c.wasDriven,mission:c._missionTarget||null,managed:!!c._ambientManaged}:null,stage:g.engine.state.active?.stage,status:g.engine.state.active?.status,population:d.population,totalCars:g.api.cars().length,retired:d.retired}},id)}
(async()=>{try{
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const url=await new Promise((resolve,reject)=>{let data='';const timer=setTimeout(()=>reject(Error('HTTP startup timeout')),7000);server.stdout.on('data',chunk=>{data+=chunk;const m=data.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}/Glowport88_ArtRehaul_v11.html?debug=1`)}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{}});
 await page.goto(url);await page.waitForFunction(()=>window.GlowportTest?.ambientStep&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').click();
 for(let run=0;run<3;run++){
  const target=await page.evaluate(()=>{
   const t=GlowportTest,g=t.system,p=g.api.player();p.inCar=null;p.inside=null;p.hp=150;p.invuln=1e9;g.fixture('m12',2);g.dialogues=[];g.offer=null;g.nextEvent=1e12;g.forceWanted(0);t.teleport('warehouse');
   const car=g.api.cars().find(c=>c.id==='starter'),loc=g.location('warehouse'),road=g.api.road(loc.x,loc.y);Object.assign(car,{x:road.x,y:road.y,speed:0,health:100,ai:false,wasDriven:true});p.inCar=car;g.api.recenter();g.tick(.05);
   const target=g.api.cars().find(c=>c._missionTarget===g.key());if(!target)throw Error('The authored chase did not select a traffic target');
   if(!target._ambientManaged||target.personal||target.wasDriven)throw Error('Chase must select an ordinary managed ambient car');
   window.__retirementTarget=target;
   const follow=()=>{const candidates=[];for(const r of[60,45])for(let i=0;i<16;i++){const a=target.angle+Math.PI+i*Math.PI/8,q={x:target.x+Math.sin(a)*r,y:target.y-Math.cos(a)*r};if(!g.api.solid(q.x,q.y,19)&&t.cityLayout.navigation.isRoad(q.x,q.y,12))candidates.push(q)}const q=candidates[0];if(!q)throw Error('No safe road position to follow the chase target');Object.assign(car,{x:q.x,y:q.y,speed:0});p.x=q.x;p.y=q.y;g.api.recenter()};
   const duration=g.stage().duration||20;let ticks=0;while(!g.engine.state.active.data.stopped&&ticks++<Math.ceil((duration+4)/.05)){follow();t.ambientStep(.05,.05);follow();g.tick(.05)}
   if(!g.engine.state.active.data.stopped||target.ai||target.speed!==0)throw Error('Real chase tail timer did not stop its target');
   return{id:target.id,tail:g.engine.state.active.data.tail,duration,ticks,health:target.health,stage:g.engine.state.active.stage};
  });
  const row={run:run+1,target};quests.push(row);assert(target.tail>=target.duration);assert.equal(target.stage,2);assert(target.health>40,'The target must stop by the real tail timer, not damage');
  if(run===0){
   await check('a stopped active quest target remains protected offscreen before contact',async()=>{
    const before=await snapshot(target.id);await page.evaluate(()=>{GlowportTest.teleport('radio');GlowportTest.ambientStep(70,.1)});const after=await snapshot(target.id);row.beforeContact={before,after};assert(after.car?.mission);assert.equal(after.car.ai,false);assert.equal(after.car.x,before.car.x);assert.equal(after.car.y,before.car.y);assert.equal(after.stage,2);assert.equal(after.status,'active');
   });
  }
  await page.evaluate(id=>{
   const t=GlowportTest,g=t.system,p=g.api.player(),target=g.api.cars().find(c=>c.id===id),car=g.api.cars().find(c=>c.id==='starter');p.inside=null;p.inCar=car;
   const q=[0,1,2,3,4,5,6,7].map(i=>({x:target.x+Math.cos(i*Math.PI/4)*50,y:target.y+Math.sin(i*Math.PI/4)*50})).find(q=>!g.api.solid(q.x,q.y,19));if(!q)throw Error('No safe stopped-car contact position');Object.assign(car,{x:q.x,y:q.y,speed:0});p.x=q.x;p.y=q.y;g.api.recenter();g.api.hud();
  },target.id);
  assert((await page.evaluate(()=>GlowportTest.interactions())).some(c=>c.label==='CONTACT STOPPED DRIVER'),'Production contact interaction must remain available');
  await page.keyboard.press('e');const contacted=await snapshot(target.id);row.contacted=contacted;assert.equal(contacted.stage,3,'Actual E contact must advance from chase to escape');assert(contacted.car,'Completing a chase must not instantly remove the visible target');assert.equal(contacted.car.mission,null);assert.equal(contacted.car.ai,false);assert.equal(contacted.car.health,target.health);
  if(run===0){
   await check('completed healthy targets stay visible beyond the retirement grace without resuming AI',async()=>{
    await page.evaluate(()=>GlowportTest.ambientStep(75,.1));const visible=await snapshot(target.id);row.visibleAfter75=visible;assert(visible.car);assert.equal(visible.car.ai,false);assert.equal(visible.car.x,contacted.car.x);assert.equal(visible.car.y,contacted.car.y);
   });
   await page.evaluate(()=>{GlowportTest.teleport('radio');GlowportTest.ambientStep(5,.1)});
  }else{
   await page.evaluate(()=>{GlowportTest.teleport('radio');GlowportTest.ambientStep(30,.1)});const grace=await snapshot(target.id);row.offscreenGrace=grace;assert(grace.car,'Healthy unowned targets must retain their full one-minute contact grace');assert.equal(grace.car.ai,false);
   await page.evaluate(()=>GlowportTest.ambientStep(45,.1));
  }
  const retired=await snapshot(target.id);row.retired=retired;assert.equal(retired.car,null,'An unprotected healthy target must retire after its grace and only offscreen');assert.equal(retired.population,43,'Ambient population must return to its configured 43-car budget');assert.equal(retired.totalCars,44,'Repeated completed chases must not accumulate inactive quest traffic');
 }
 await check('three authored chase contacts retire their unowned cars without growing the fleet',async()=>{assert.equal(quests.length,3);assert(quests.every(q=>!q.retired.car&&q.retired.population===43&&q.retired.totalCars===44));assert(quests.at(-1).retired.retired>=3)});
 let legacy;
 await check('loaded legacy driven and owned ambient cars remain durable while offscreen',async()=>{
  const saved=await page.evaluate(()=>{
   const t=GlowportTest,g=t.system,p=g.api.player();p.inCar=null;g.api.save();const save=JSON.parse(localStorage.getItem(t.debugSaveKey)),road=g.api.road(g.location('hotel').x,g.location('hotel').y);
   for(const [id,personal,health,modelId]of[['legacy-retired-driven',false,91,'sedan'],['legacy-retired-owned',true,87,'compact']])save.gameplay.drivenCars.push({id,x:road.x,y:road.y,angle:0,speed:0,targetSpeed:90,ai:false,parked:true,health,modelId,personal,wasDriven:!personal,_ambientManaged:true,_trafficMapVersion:3,w:17,h:32});
   return JSON.stringify(save);
  });
  await page.addInitScript(value=>localStorage.setItem('glowport88-debug-v04',value),saved);await page.reload();await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').click();
  legacy=await page.evaluate(()=>{const t=GlowportTest,g=t.system,ids=['legacy-retired-driven','legacy-retired-owned'],before=ids.map(id=>({...g.api.cars().find(c=>c.id===id)}));t.teleport('observatory');t.ambientStep(90,.1);return{before,after:ids.map(id=>g.api.cars().find(c=>c.id===id)||null),starters:g.api.cars().filter(c=>c.id==='starter').length,population:t.ambientDiagnostics().traffic.population}});
  assert.equal(legacy.starters,1);assert.equal(legacy.population,43);for(let i=0;i<2;i++){const old=legacy.before[i],car=legacy.after[i];assert(car,'Retirement must never remove legacy player-persistent vehicles');for(const key of['id','x','y','health','modelId','personal','wasDriven'])assert.equal(car[key],old[key]);assert.equal(car.ai,false)}
 });
 await check('quest retirement produces no browser script or missing-asset errors',async()=>assert.deepEqual(errors,[]));
 const result={time:new Date().toISOString(),sourceHashes,checks,quests,legacy,errors,scope:'Actual Chromium production host. Three authored m12 chase fixtures use production target selection, real elapsed tail evaluation, ambient vehicle movement and keyboard E contact. QA accelerates travel/time and supplies invulnerability; no evaluator or completion override, no quest-target AI/health mutation. Visibility/grace and repeated cleanup are checked, then saved legacy driven/owned cars reload through production save handling and remain durable.'};
 fs.writeFileSync(path.join(out,'citylife-retirement-host-results.json'),JSON.stringify(result,null,2)+'\n');fs.rmSync(path.join(out,'citylife-retirement-host-failure.json'),{force:true});console.log(`PASS retirement host: ${checks.length} checks, three real chase contacts, healthy offscreen cleanup and legacy ownership preservation`);
}catch(error){fs.writeFileSync(path.join(out,'citylife-retirement-host-failure.json'),JSON.stringify({time:new Date().toISOString(),sourceHashes,checks,quests,errors,error:error.stack},null,2)+'\n');throw error}finally{await browser?.close();server?.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
