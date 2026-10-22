'use strict';
// Compare actual browser pixels: clear-day lighting must be an identity operation,
// emitters stay inside their falloff, and tile eviction must not rebuild sources.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');let browser,server;
(async()=>{try{
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const origin=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/port (\d+)/);if(match){clearTimeout(timer);resolve(`http://127.0.0.1:${match[1]}`)}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();await page.goto(origin+'/');
 for(const name of ['atlas','art'])await page.addScriptTag({url:origin+'/assets/'+name+'.js'});await page.evaluate(()=>GlowportArt.ready);
 const result=await page.evaluate(()=>{
  const W=400,H=240,make=()=>{const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;return canvas},base=make(),bc=base.getContext('2d');
  for(let y=0;y<H;y+=4)for(let x=0;x<W;x+=4){bc.fillStyle=['#56824c','#ba876a','#d3bd82','#343d48'][(x/4+y/4)%4];bc.fillRect(x,y,4,4)}
  const source=bc.getImageData(0,0,W,H).data;
  const world={MW:1600,MH:1200,roadXs:[],roadYs:[],STREET:66,buildings:[{x:210,y:70,w:70,h:70,doorX:245,doorY:150,name:'TEST',district:'core',landmark:{key:'club'}}],streetlights:[{x:140,y:100}],trees:[],debris:[]};
  const tile=document.createElement('canvas');tile.width=tile.height=128;const tc=tile.getContext('2d');
  for(let y=0;y<3;y++)for(let x=0;x<4;x++){tc.setTransform(1,0,0,1,-x*128,-y*128);GlowportArt.bakeTerrain(tc,world)}
  const initialIndex=GlowportArt.getLightingDiagnostics(world);
  const render=(hour,weather,customWorld=world)=>{const canvas=make(),c=canvas.getContext('2d');c.drawImage(base,0,0);GlowportArt.atmosphere(c,{clock:3,hour,weather,camera:{x:0,y:0},W,H,world:customWorld,cars:[],police:[]});return {canvas,data:c.getImageData(0,0,W,H).data}};
  const compare=data=>{let pixels=0,opaque=true,total=0;for(let i=0;i<data.length;i+=4){if(data[i]!==source[i]||data[i+1]!==source[i+1]||data[i+2]!==source[i+2])pixels++;opaque&&=data[i+3]===255;total+=data[i]+data[i+1]+data[i+2]}return {pixels,fraction:pixels/(W*H),opaque,mean:total/(W*H*3)}};
  const clear=render(12,'CLEAR'),morning=render(8,'CLEAR'),rain=render(12,'RAIN'),mist=render(12,'MIST'),night=render(23,'CLEAR');
  const day=compare(clear.data),am=compare(morning.data),wet=compare(rain.data),fog=compare(mist.data),dark=compare(night.data),original=compare(source);
  const savedAmbient=GlowportArt.lighting.ambient.night,savedVignette=GlowportArt.lighting.shadows.nightVignette;GlowportArt.lighting.ambient.night=0;GlowportArt.lighting.shadows.nightVignette=0;
  const lampWorld={...world,buildings:[]},lamp=render(23,'CLEAR',lampWorld);let escapedFalloff=0,illuminated=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,changed=lamp.data[i]!==source[i]||lamp.data[i+1]!==source[i+1]||lamp.data[i+2]!==source[i+2];if(changed){illuminated++;if(Math.hypot(x+.5-140,y+.5-85)>GlowportArt.lighting.streetlight.radius+1)escapedFalloff++}}
  GlowportArt.lighting.ambient.night=savedAmbient;GlowportArt.lighting.shadows.nightVignette=savedVignette;
  // Switching worlds and baking new tiles must preserve the original world index.
  render(12,'CLEAR',world);tc.setTransform(1,0,0,1,-1024,-512);GlowportArt.bakeTerrain(tc,world);const finalIndex=GlowportArt.getLightingDiagnostics(world);
  // A real curved road fixture also checks that legacy grid anchors no longer
  // paint invisible roads, while road and walkway surface pixels stay opaque.
  const roads={MW:400,MH:240,STREET:66,roadXs:[350],roadYs:[200],buildings:[],streetlights:[],trees:[],debris:[],roads:[{w:40,type:'residential',points:[{x:25,y:50},{x:120,y:55},{x:190,y:120},{x:280,y:130}]},{w:14,type:'walkway',points:[{x:190,y:120},{x:190,y:175}]},{w:54,type:'avenue',points:[{x:190,y:20},{x:190,y:220}]}],intersections:[{x:190,y:120}]};
  const paved=make(),plain=make();GlowportArt.bakeTerrain(paved.getContext('2d'),roads);GlowportArt.bakeTerrain(plain.getContext('2d'),{...roads,roads:[],roadXs:[],roadYs:[]});const a=paved.getContext('2d').getImageData(0,0,W,H).data,b=plain.getContext('2d').getImageData(0,0,W,H).data,at=(data,x,y)=>Array.from(data.slice((y*W+x)*4,(y*W+x)*4+4));
  const roadPixels={actual:at(a,120,55),ground:at(b,120,55),oldGrid:at(a,350,200),oldGridGround:at(b,350,200),walkway:at(a,190,170),allOpaque:Array.from(a).filter((_,i)=>i%4===3).every(v=>v===255)};
  // The same regional texture and curved roads must survive translated tile
  // bakes exactly; opaque base pixels also catch unpainted seams.
  const landscaped={...roads,lands:[{id:'west',x0:0,x1:200,y0:0,y1:H,ground:'#526d60'},{id:'south',x0:200,x1:W,y0:0,y1:H,ground:'#5f765c'}]},full=make(),tiled=make(),out=tiled.getContext('2d');GlowportArt.bakeTerrain(full.getContext('2d'),landscaped);
  for(let ty=0;ty<H;ty+=128)for(let tx=0;tx<W;tx+=128){const tile=document.createElement('canvas');tile.width=Math.min(128,W-tx);tile.height=Math.min(128,H-ty);const c=tile.getContext('2d');c.setTransform(1,0,0,1,-tx,-ty);GlowportArt.bakeTerrain(c,landscaped);out.drawImage(tile,tx,ty)}
  const fullData=full.getContext('2d').getImageData(0,0,W,H).data,tileData=out.getImageData(0,0,W,H).data;let seamDifferences=0;const seamSamples=[];for(let i=0;i<fullData.length;i++)if(fullData[i]!==tileData[i]){seamDifferences++;if(seamSamples.length<30)seamSamples.push({x:Math.floor(i/4)%W,y:Math.floor(i/4/W),c:i%4,a:fullData[i],b:tileData[i]})};
  return {day,morning:am,rain:wet,mist:fog,night:dark,original,index:{initial:initialIndex,final:finalIndex},falloff:{illuminated,escapedFalloff},roadPixels,seamDifferences,seamSamples};
 });
 assert.equal(result.day.pixels,0,'Clear midday must preserve every terrain pixel');assert.equal(result.morning.pixels,0,'Clear morning must preserve every terrain pixel');assert(result.rain.fraction>0&&result.rain.fraction<.06,'Rain should affect only sparse drops/splashes, never apply fog');assert(result.mist.fraction>.85,'Explicit MIST must remain visibly available');assert(result.night.mean<result.original.mean*.92,'Night should darken the environment');assert(result.night.mean>result.original.mean*.6,'Night must retain terrain detail');assert(result.falloff.illuminated>500);assert.equal(result.falloff.escapedFalloff,0,'Streetlight escaped its radius');assert.deepEqual(result.index.initial,result.index.final,'Tile bakes duplicated or reset light sources');assert.equal(result.index.final.builds,1);assert.equal(result.index.final.streetlights,1);assert(result.index.final.neon>=1);assert.deepEqual(result.roadPixels.oldGrid,result.roadPixels.oldGridGround,'Old grid anchors drew a road under the new layout');assert.notDeepEqual(result.roadPixels.actual,result.roadPixels.ground);assert(result.roadPixels.allOpaque);assert.equal(result.seamDifferences,0,'Regional ground, connected road or junction marking tile seam differs from full reference');for(const scene of [result.day,result.rain,result.mist,result.night])assert(scene.opaque);
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/lighting-results.json'),JSON.stringify({time:new Date().toISOString(),...result,scope:'Desktop Chromium actual RGBA pixel comparisons. Confirms clear morning/midday identity, explicit-only fog, sparse rain, local lamp falloff, retained night detail, opaque road surfaces and per-world light index stability across translated tile bakes.'},null,2));
 console.log(`PASS lighting: exact clear-day pixels, ${(result.rain.fraction*100).toFixed(2)}% rain coverage, explicit mist, bounded falloff, stable world index, connected curved-road surfaces`);
 }finally{await browser?.close();server?.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
