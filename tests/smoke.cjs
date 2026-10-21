'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
let url;
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
const serverReady=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not become ready')),7000);let output='';server.stdout.on('data',data=>{output+=data;const match=output.match(/port (\d+)/);if(match){url=`http://127.0.0.1:${match[1]}/Glowport88_ArtRehaul_v11.html`;clearTimeout(timer);resolve()}});server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code))})});
const results=[];let browser;
const check=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name)};
(async()=>{try{
 await serverReady;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(url);
 await check('menu and Start',async()=>{await page.locator('#startBtn').click();await page.waitForFunction(()=>window.GlowportTest?.getState().screen==='playing');assert(await page.locator('#menu').evaluate(e=>e.classList.contains('hidden')))});
 await check('city rendering',async()=>{await page.waitForTimeout(300);assert(await page.locator('#game').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return new Set(d).size>100}))});
 await page.locator('#game').screenshot({path:path.join(out,process.env.BASELINE?'baseline.png':'city-day.png')});
 await check('movement and camera',async()=>{await page.evaluate(()=>GlowportTest.setPosition(2320,1180));const before=await page.evaluate(()=>GlowportTest.getState().player);await page.keyboard.down('s');await page.waitForTimeout(500);await page.keyboard.up('s');const after=await page.evaluate(()=>GlowportTest.getState().player);assert(after.y>before.y+15)});
 for(const [open,close] of [['mapBtn','mapClose'],['journalBtn','journalClose'],['pauseBtn','pauseClose']])await check(open,async()=>{await page.locator('#'+open).click();await page.locator('#'+close).waitFor({state:'visible'});await page.locator('#'+close).click()});
 await check('pause freezes simulation time',async()=>{await page.locator('#pauseBtn').click();const t=await page.evaluate(()=>GlowportTest.getState().time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>GlowportTest.getState().time),t);await page.locator('#pauseClose').click()});
 await check('enter, drive, brake and exit personal car',async()=>{const car=await page.evaluate(()=>GlowportTest.getVehicles().find(c=>c.personal));await page.evaluate(c=>GlowportTest.setPosition(c.x+30,c.y),car);await page.keyboard.press('e');assert(await page.evaluate(()=>GlowportTest.getState().car));await page.keyboard.down('w');await page.waitForTimeout(550);await page.keyboard.up('w');const moved=await page.evaluate(()=>GlowportTest.getVehicles().find(c=>c.personal));assert(Math.hypot(moved.x-car.x,moved.y-car.y)>10);await page.keyboard.down('Space');await page.waitForTimeout(500);await page.keyboard.up('Space');await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().car),false)});
 await check('hotel entry and exit',async()=>{await page.evaluate(()=>GlowportTest.teleport('hotel'));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),'hotel');await page.locator('#game').screenshot({path:path.join(out,'hotel.png')});await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),null)});
 await check('intro conversation and chapter reward',async()=>{await page.evaluate(()=>{GlowportTest.enterInterior('hotel');GlowportTest.startIntro?.()});
 // Use public movement to reach Vee, then the existing dialogue controls.
 await page.keyboard.down('w');await page.waitForTimeout(1350);await page.keyboard.up('w');await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});
 await page.screenshot({path:path.join(out,'conversation.png')});
 for(let i=0;i<15&&await page.locator('#conversationPanel').isVisible();i++)await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>GlowportTest.getState().story),1)});
 await check('weapon purchase and equip tutorial',async()=>{await page.evaluate(()=>{GlowportTest.leaveInterior();GlowportTest.enterInterior('armory');GlowportTest.setInteriorPosition(520,157)});await page.keyboard.press('e');await page.locator('#shopPanel').waitFor({state:'visible'});await page.locator('[data-buy="pistol"]').click();await page.locator('#shopClose').click();assert.equal(await page.evaluate(()=>GlowportTest.getState().story),2);await page.keyboard.press('1');await page.keyboard.press('3');assert.equal(await page.evaluate(()=>GlowportTest.getState().story),3);await page.evaluate(()=>GlowportTest.leaveInterior())});
 await check('weapon fire and reload',async()=>{await page.evaluate(()=>GlowportTest.setPosition(2320,1180));const before=await page.evaluate(()=>GlowportTest.getState().ammo.pistol);await page.keyboard.press('f');assert.equal(await page.evaluate(()=>GlowportTest.getState().ammo.pistol),before-1);await page.keyboard.press('r');await page.waitForFunction(()=>GlowportTest.getState().reloading<=0);assert.equal(await page.evaluate(()=>GlowportTest.getState().ammo.pistol),before)});
 await check('police response',async()=>{await page.evaluate(()=>GlowportTest.setWanted(2));await page.waitForTimeout(300);assert((await page.evaluate(()=>GlowportTest.getState().police))>0);await page.evaluate(()=>GlowportTest.setWanted(-10))});
 await check('save and restore',async()=>{await page.locator('#saveBtn').click();const before=await page.evaluate(()=>GlowportTest.getState());const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('glowport88-neongrid-v08')));assert.equal(saved.story,before.story);await page.reload();await page.locator('#startBtn').click();assert.equal(await page.evaluate(()=>GlowportTest.getState().story),before.story)});
 await check('new story resets campaign',async()=>{await page.reload();await page.locator('#newBtn').click();assert.equal(await page.evaluate(()=>GlowportTest.getState().story),0)});
 await check('old-save migration and three-stage investigation',async()=>{
 await page.evaluate(()=>localStorage.setItem('glowport88-neongrid-v08',JSON.stringify({story:6,money:900,owned:[true,false,true,false,false],weapon:2,mag:{pistol:12},ammo:{pistol:36}})));
 await page.reload();await page.locator('#startBtn').click();await page.evaluate(()=>GlowportTest.enterInterior('radio'));
 assert.equal(await page.evaluate(()=>GlowportTest.getState().investigation.step),0);
 // Taking the final evidence early must not advance the chapter.
 await page.evaluate(()=>GlowportTest.setInteriorPosition(403,149));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().story),6);
 for(let step=0;step<2;step++){
 const node=await page.evaluate(()=>GlowportTest.getState().investigation.node);await page.evaluate(n=>GlowportTest.setInteriorPosition(n.x,n.y),node);await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>GlowportTest.getState().investigation.step),step+1);
 if(step===0){await page.locator('#saveBtn').click();await page.reload();await page.locator('#startBtn').click();await page.evaluate(()=>GlowportTest.enterInterior('radio'));assert.equal(await page.evaluate(()=>GlowportTest.getState().investigation.step),1)}
 }
 await page.evaluate(()=>GlowportTest.setInteriorPosition(403,149));await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});for(let i=0;i<5&&await page.locator('#conversationPanel').isVisible();i++)await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>GlowportTest.getState().story),7);
 });
 await check('clinic purchase and interactive arcade',async()=>{
 await page.evaluate(()=>{GlowportTest.enterInterior('clinic');GlowportTest.setInteriorPosition(570,195)});const cash=await page.evaluate(()=>GlowportTest.getState().money);await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});await page.keyboard.press('1');assert.equal(await page.evaluate(()=>GlowportTest.getState().money),cash-90);assert.equal(await page.evaluate(()=>GlowportTest.getState().hp),150);
 await page.evaluate(()=>{GlowportTest.enterInterior('arcade');GlowportTest.setInteriorPosition(570,195)});await page.keyboard.press('e');await page.keyboard.press('1');await page.locator('#arcadeActivity').waitFor({state:'visible'});const time=await page.evaluate(()=>GlowportTest.getState().time);await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');await page.screenshot({path:path.join(out,'arcade-activity.png')});assert.equal(await page.evaluate(()=>GlowportTest.getState().time),time);await page.locator('#arcadeQuit').click();await page.locator('#arcadeActivity').waitFor({state:'detached'});
 });
 await check('distinct interior assets',async()=>{for(const key of ['armory','arcade','clinic','club','warehouse']){await page.evaluate(k=>GlowportTest.enterInterior(k),key);await page.waitForTimeout(50);await page.locator('#game').screenshot({path:path.join(out,key+'.png')})}await page.evaluate(()=>GlowportTest.leaveInterior())});
 if(await page.evaluate(()=>!!GlowportTest.setEnvironment)){
 await check('night and rain rendering',async()=>{await page.evaluate(()=>{GlowportTest.teleport('hotel');GlowportTest.setEnvironment(22,'RAIN')});await page.waitForTimeout(300);await page.locator('#game').screenshot({path:path.join(out,'city-night-rain.png')})});
 }
 await check('no browser errors or missing assets',async()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(path.join(out,'smoke-results.json'),JSON.stringify({time:new Date().toISOString(),passed:results,errors},null,2));
 fs.rmSync(path.join(out,'smoke-failure.txt'),{force:true});console.log(`${results.length} checks passed`);
 }finally{if(browser)await browser.close();server.kill()}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'smoke-failure.txt'),e.stack);process.exitCode=1});
