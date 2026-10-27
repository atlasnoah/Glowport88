'use strict';
// Gallery navigation is checked separately from the game's visual/gameplay tests.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
const galleries=[
 {id:'city',file:'restoration-visual-comparison.html',other:'restoration-infill-comparison.html',result:stage=>`restoration-${stage}-results.json`,scenes:21,stages:['stage-a','stage-b','stage-c','stage-d','final'],screenshot:'restoration-gallery'},
 {id:'infill',file:'restoration-infill-comparison.html',other:'restoration-visual-comparison.html',result:stage=>`restoration-infill-${stage}-results.json`,scenes:8,stages:['stage-b','stage-c','stage-d','final'],screenshot:'restoration-infill-gallery'}
];
const viewports=[{width:1440,height:1000},{width:390,height:844}],errors=[],references=[],results=[];
let server,browser;
(async()=>{try{
 for(const gallery of galleries){
  const html=fs.readFileSync(path.join(out,gallery.file),'utf8'),files=[...new Set(html.match(/restoration-[a-z0-9-]+\.png/g)||[])];
  assert(files.length>gallery.scenes*2,'Gallery must include its historical stage image references');
  for(const file of files)assert(fs.existsSync(path.join(out,file)),`Missing ${gallery.id} gallery image ${file}`);
  references.push({gallery:gallery.id,localPNGReferences:files.length,allReferencesExist:true});
 }
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',out],{stdio:['ignore','pipe','ignore']});
 const origin=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Gallery server timeout')),7000);server.stdout.on('data',data=>{output+=data;const match=output.match(/port (\d+)/);if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1])}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const gallery of galleries)for(const viewport of viewports){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.stack));page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(`${response.status()} ${response.url()}`)});
  await page.goto(origin+'/'+gallery.file);
  assert.equal(await page.locator('article').count(),gallery.scenes,'Wrong number of matched scenes');
  const stages=await page.locator('#stage option').evaluateAll(options=>options.map(option=>option.value));
  assert.deepEqual(stages,gallery.stages,'Every completed restoration stage must be selectable');
  const originals=await page.locator('article figure:first-child img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
  for(const stage of stages){
   await page.selectOption('#stage',stage);
   await page.locator('article img').evaluateAll(images=>images.forEach(image=>image.loading='eager'));
   await page.waitForFunction(()=>[...document.querySelectorAll('article img')].every(image=>image.complete&&image.naturalWidth===800&&image.naturalHeight===450));
   const actual=await page.locator('article').evaluateAll(cards=>cards.map(card=>({name:card.dataset.scene,file:card.querySelector('.after').getAttribute('src'),caption:card.querySelector('figure:last-child figcaption').textContent.trim()})));
   const expected=JSON.parse(fs.readFileSync(path.join(out,gallery.result(stage)),'utf8'));
   for(const card of actual){assert.equal(card.file,expected.shots.find(shot=>shot.name===card.name)?.file,`Wrong selected ${stage} image for ${card.name}`);assert(card.caption.length>5,'Missing stage caption')}
   assert.deepEqual(await page.locator('article figure:first-child img').evaluateAll(images=>images.map(image=>image.getAttribute('src'))),originals,'Stage selection changed the original reference images');
  }
  const scenes=await page.locator('#scene option').evaluateAll(options=>options.map(option=>option.value));assert.equal(scenes.length,gallery.scenes);
  for(const scene of scenes){
   await page.selectOption('#scene',scene);
   await page.evaluate(()=>new Promise((resolve,reject)=>{let last=window.scrollY,stable=0,frames=0;const tick=()=>{const current=window.scrollY;stable=Math.abs(current-last)<1?stable+1:0;last=current;if(stable>=6)return resolve();if(frames++>300)return reject(Error('Scene scroll never settled'));requestAnimationFrame(tick)};requestAnimationFrame(tick)}));
   const position=await page.locator('[id="'+scene+'"]').evaluate(element=>{const rect=element.getBoundingClientRect();return{top:rect.top,bottom:rect.bottom,height:innerHeight}});
   assert(position.top<position.height&&position.bottom>0,'Scene selector failed to reveal '+scene);
  }
  const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(layout.scrollWidth<=layout.width+1,'Gallery overflows horizontally');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  const screenshot=gallery.screenshot+'-'+viewport.width+'.png';await page.screenshot({path:path.join(out,screenshot)});
  await page.locator('a[href="'+gallery.other+'"]').click();await page.waitForURL(origin+'/'+gallery.other);assert.equal(await page.locator('#stage').count(),1,'Cross-gallery link failed');
  results.push({gallery:gallery.id,viewport,scenes:gallery.scenes,stages:stages.length,allStageImagesLoaded:true,allSceneJumps:true,originalImagesPreserved:true,crossGalleryLink:true,noHorizontalOverflow:true,screenshot});
  await page.close();
 }
 assert.deepEqual(errors,[],'Gallery browser errors');
 fs.writeFileSync(path.join(out,'restoration-gallery-results.json'),JSON.stringify({time:new Date().toISOString(),references,results,errors,scope:'Actual Chromium rendering of both final comparison galleries at desktop and phone widths. Every stage image is decoded, every scene selector is exercised, original references remain unchanged, and cross-gallery links/layout are verified. Separate from gameplay and physical-device testing.'},null,2));
 console.log('PASS restoration galleries: 2 galleries × 2 viewports, 18 stage selections, 58 scene jumps; all PNG references/images, links and layouts valid; no browser errors');
}finally{await browser?.close();server?.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
