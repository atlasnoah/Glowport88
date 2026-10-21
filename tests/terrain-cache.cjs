'use strict';
// Actual approved terrain renderer compared with a full-world reference, plus exact
// coordinate/seam validation. Browser resampling of translated, scaled atlas sprites
// has small nearest-neighbor differences; the art comparison records and bounds these.
// Large reference surfaces exist only in this desktop test, never in the game.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');let browser,server;
(async()=>{try{
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const origin=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',chunk=>{text+=chunk;const m=text.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`)}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin+'/');
 for(const file of ['atlas','art','terrain-cache'])await page.addScriptTag({url:origin+'/assets/'+file+'.js'});await page.evaluate(()=>GlowportArt.ready);
 const result=await page.evaluate(()=>{
  const world={MW:7200,MH:5040,STREET:66,lands:[],roadXs:Array.from({length:20},(_,i)=>160+i*360),roadYs:Array.from({length:15},(_,i)=>160+i*340),buildings:[],trees:[],debris:[],streetlights:[]};
  const positions=[[880,850],[975,980],[1010,1000],[1050,1110],[2000,1010],[3060,2040],[3200,2310],[6400,4590],[7060,4900],[25,25]];
  for(let i=0;i<positions.length;i++){const [x,y]=positions[i];world.buildings.push({x,y,w:100+i%3*14,h:90+i%2*30,doorX:x+50,doorY:y+107,district:['core','east','west','south','north'][i%5],kind:'store',name:'NEON TEST '+i,landmark:i===1?{key:'hotel'}:null});world.trees.push({x:x+140,y:y+100,kind:i%2?'palm':'round'});world.streetlights.push({x:x+160,y:y+135})}
  world.debris=[{type:'park',x:950,y:950,w:170,h:130},{type:'plaza',x:2010,y:2010,w:160,h:160},{type:'parking',x:3020,y:2250,w:130,h:100}];
  const reference=document.createElement('canvas');reference.width=world.MW;reference.height=world.MH;const referenceContext=reference.getContext('2d',{alpha:false});referenceContext.imageSmoothingEnabled=false;
  let started=performance.now();GlowportArt.bakeTerrain(referenceContext,world);const fullBakeMs=performance.now()-started;
  const surfaces=[],bakedWorlds=[];const cache=GlowportTerrain.create({world,bake:(context,sameWorld)=>{surfaces.push(context.canvas);bakedWorlds.push(sameWorld===world);GlowportArt.bakeTerrain(context,sameWorld)},tileSize:1024,maxTiles:6});
  const target=document.createElement('canvas');target.width=800;target.height=450;const context=target.getContext('2d',{alpha:false});
  const expected=document.createElement('canvas');expected.width=800;expected.height=450;const expectedContext=expected.getContext('2d',{alpha:false});
  const shots=[[0,0],[800,800],[1024,1024],[990,1000],[6400,4590],[3010,2270],[6400,0],[0,4590],[0,0],[225,575]],comparisons=[];
  for(const [x,y] of shots){cache.draw(context,x,y,800,450);expectedContext.drawImage(reference,x,y,800,450,0,0,800,450);const actual=context.getImageData(0,0,800,450).data,baseline=expectedContext.getImageData(0,0,800,450).data;let differingChannels=0,maxDifference=0;for(let i=0;i<actual.length;i++){const delta=Math.abs(actual[i]-baseline[i]);if(delta){differingChannels++;maxDifference=Math.max(maxDifference,delta)}}comparisons.push({x,y,differingChannels,maxDifference,differingChannelFraction:differingChannels/actual.length});}

  const before=cache.diagnostics(),bakes=before.bakes;cache.draw(context,225,575,800,450);const after=cache.diagnostics();
  const zeroedEvictions=surfaces.filter(canvas=>canvas.width===0&&canvas.height===0).length;
  cache.clear();const cleared=cache.diagnostics();const allSurfacesReleased=surfaces.every(canvas=>canvas.width===0&&canvas.height===0);
  // Integer primitives provide an exact world-coordinate and seam oracle without
  // scaled-image resampling differences obscuring translation errors.
  const paint=(c,w)=>{c.fillStyle='#192337';c.fillRect(0,0,w.MW,w.MH);for(let x=0;x<w.MW;x+=17){c.fillStyle=x%3?'#5a5678':'#93814d';c.fillRect(x,0,3,w.MH)}for(let y=0;y<w.MH;y+=19){c.fillStyle=y%2?'#3c9a8a':'#a75a81';c.fillRect(0,y,w.MW,2)}};
  paint(referenceContext,world);const coordinateCache=GlowportTerrain.create({world,bake:paint,tileSize:1024,maxTiles:6}),coordinateComparisons=[];
  for(const [x,y] of shots){coordinateCache.draw(context,x,y,800,450);expectedContext.drawImage(reference,x,y,800,450,0,0,800,450);const actual=context.getImageData(0,0,800,450).data,baseline=expectedContext.getImageData(0,0,800,450).data;let differences=0;for(let i=0;i<actual.length;i++)if(actual[i]!==baseline[i])differences++;coordinateComparisons.push({x,y,differingChannels:differences})}coordinateCache.clear();
  reference.width=reference.height=0;target.width=target.height=0;expected.width=expected.height=0;
  return {coordinateComparisons,comparisons,fullBakeMs,cache:before,repeatedViewNewBakes:after.bakes-bakes,zeroedEvictions,allWorldArraysRetained:bakedWorlds.every(Boolean),clear:{cachedTiles:cleared.cachedTiles,residentBytes:cleared.residentBytes,allSurfacesReleased}};
 });
 assert.deepEqual(errors,[]);for(const comparison of result.coordinateComparisons)assert.equal(comparison.differingChannels,0,'Coordinate translation/seam mismatch: '+JSON.stringify(comparison));for(const comparison of result.comparisons)assert(comparison.differingChannels/(800*450*4)<.005,`Terrain differs at ${comparison.x},${comparison.y}: ${JSON.stringify(comparison)}`);
 assert(result.cache.cachedTiles<=6);assert(result.cache.peakResidentBytes<=6*1024*1024*4);assert(result.cache.evictions>0);assert(result.zeroedEvictions>0);assert.equal(result.repeatedViewNewBakes,0);assert(result.allWorldArraysRetained);assert.deepEqual(result.clear,{cachedTiles:0,residentBytes:0,allSurfacesReleased:true});
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/terrain-cache-results.json'),JSON.stringify({time:new Date().toISOString(),...result,scope:'Desktop Chromium exact integer world-coordinate/seam validation and representative approved-art comparison against full-world reference. Translated/scaled atlas rasterization permits <0.5% differing channels per view, with observed differences reported. Cache hits/eviction and bounded surface allocations verified; actual iOS memory/performance requires device testing.'},null,2));
 console.log(`PASS tiled terrain: ${result.coordinateComparisons.length} exact coordinate/seam views, ${result.comparisons.length} approved-art comparisons (<0.5% channel tolerance), ${Math.round(result.cache.peakResidentBytes/1048576)} MiB peak of 24 MiB cache budget, LRU eviction and release`);
 console.log(`PERF desktop reference ${Math.round(result.fullBakeMs)}ms; cached tile max ${Math.round(result.cache.maxBakeMs)}ms; ${result.cache.bakes} tile bakes`);
 }finally{if(browser)await browser.close();server?.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
