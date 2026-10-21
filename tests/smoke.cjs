'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const port=18788,url=`http://127.0.0.1:${port}/Glowport88_ArtRehaul_v11.html`;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:'ignore'});
const results=[];let browser;
const check=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name)};
(async()=>{try{
 for(let n=0;n<50;n++){try{const r=await fetch(url);if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,100));if(n===49)throw Error('Server failed to start')}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(url);
 await check('menu and Start',async()=>{await page.locator('#startBtn').click();await page.waitForFunction(()=>window.GlowportTest?.getState().screen==='playing');assert(await page.locator('#menu').evaluate(e=>e.classList.contains('hidden')))});
 await check('city rendering',async()=>{await page.waitForTimeout(300);assert(await page.locator('#game').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return new Set(d).size>100}))});
 await page.locator('#game').screenshot({path:path.join(out,process.env.BASELINE?'baseline.png':'city-day.png')});
 await check('movement and camera',async()=>{await page.evaluate(()=>GlowportTest.setPosition(2320,1180));const before=await page.evaluate(()=>GlowportTest.getState().player);await page.keyboard.down('s');await page.waitForTimeout(500);await page.keyboard.up('s');const after=await page.evaluate(()=>GlowportTest.getState().player);assert(after.y>before.y+15)});
 for(const [open,close] of [['mapBtn','mapClose'],['journalBtn','journalClose'],['pauseBtn','pauseClose']])await check(open,async()=>{await page.locator('#'+open).click();await page.locator('#'+close).waitFor({state:'visible'});await page.locator('#'+close).click()});
 await check('hotel entry and exit',async()=>{await page.evaluate(()=>GlowportTest.teleport('hotel'));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),'hotel');await page.locator('#game').screenshot({path:path.join(out,'hotel.png')});await page.keyboard.press('e');assert.equal(await page.evaluate(()=>GlowportTest.getState().inside),null)});
 await check('intro conversation and chapter reward',async()=>{await page.evaluate(()=>{GlowportTest.enterInterior('hotel');GlowportTest.startIntro?.()});
 // Use public movement to reach Vee, then the existing dialogue controls.
 await page.keyboard.down('w');await page.waitForTimeout(1350);await page.keyboard.up('w');await page.keyboard.press('e');await page.locator('#conversationPanel').waitFor({state:'visible'});
 await page.screenshot({path:path.join(out,'conversation.png')});
 for(let i=0;i<15&&await page.locator('#conversationPanel').isVisible();i++)await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>GlowportTest.getState().story),1)});
 await check('weapon purchase and equip tutorial',async()=>{await page.evaluate(()=>{GlowportTest.leaveInterior();GlowportTest.enterInterior('armory');GlowportTest.buyItem('pistol')});assert.equal(await page.evaluate(()=>GlowportTest.getState().story),2);await page.keyboard.press('1');await page.keyboard.press('3');assert.equal(await page.evaluate(()=>GlowportTest.getState().story),3);await page.evaluate(()=>GlowportTest.leaveInterior())});
 await check('weapon fire and reload',async()=>{await page.evaluate(()=>GlowportTest.setPosition(2320,1180));await page.keyboard.press('f');await page.keyboard.press('r');await page.waitForTimeout(1500)});
 await check('police response',async()=>{await page.evaluate(()=>GlowportTest.setWanted(2));await page.waitForTimeout(300);assert((await page.evaluate(()=>GlowportTest.getState().police))>0);await page.evaluate(()=>GlowportTest.setWanted(-10))});
 await check('save and restore',async()=>{await page.locator('#saveBtn').click();const before=await page.evaluate(()=>GlowportTest.getState());const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('glowport88-neongrid-v08')));assert.equal(saved.story,before.story);await page.reload();await page.locator('#startBtn').click();assert.equal(await page.evaluate(()=>GlowportTest.getState().story),before.story)});
 await check('new story resets campaign',async()=>{await page.reload();await page.locator('#newBtn').click();assert.equal(await page.evaluate(()=>GlowportTest.getState().story),0)});
 if(await page.evaluate(()=>!!GlowportTest.setEnvironment)){
 await check('night and rain rendering',async()=>{await page.evaluate(()=>{GlowportTest.teleport('hotel');GlowportTest.setEnvironment(22,'RAIN')});await page.waitForTimeout(300);await page.locator('#game').screenshot({path:path.join(out,'city-night-rain.png')})});
 }
 await check('no browser errors or missing assets',async()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(path.join(out,'smoke-results.json'),JSON.stringify({time:new Date().toISOString(),passed:results,errors},null,2));
 console.log(`${results.length} checks passed`);
 }finally{if(browser)await browser.close();server.kill()}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'smoke-failure.txt'),e.stack);process.exitCode=1});
