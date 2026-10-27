'use strict';
// A recovered c9b4af6 renderer is the visual oracle. The correction must keep
// original nighttime colors and light effects, while making only a small day adjustment.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');let browser,server;
(async()=>{try{
 const historical=fs.readFileSync(path.join(__dirname,'fixtures/original-neon-art.js'),'utf8');
 assert.equal(crypto.createHash('sha256').update(historical).digest('hex'),'fd658afd96c0a5488a7ce844dfe18ef280cbe8d711e8a692b9c45cd8ec1d1b47','The visual oracle must remain the actual recovered renderer');
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const origin=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',d=>{text+=d;const m=text.match(/port (\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1])}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.goto(origin+'/');
 await page.addScriptTag({url:origin+'/assets/atlas.js'});
 await page.addScriptTag({content:historical.replace("const base=new URL('.',document.currentScript.src);","const base=new URL('/assets/',location.href);")});
 await page.evaluate(async()=>{await GlowportArt.ready;window.OriginalNeonArt=GlowportArt});
 await page.addScriptTag({url:origin+'/assets/art.js'});await page.evaluate(()=>GlowportArt.ready);
 const result=await page.evaluate(()=>{
  const W=400,H=240,make=()=>{const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;return canvas};
  const world={MW:1200,MH:900,lands:[],roadXs:[],roadYs:[],STREET:66,buildings:[{x:35,y:45,w:90,h:75,doorX:80,doorY:133,name:'NEON',district:'core',kind:'store'},{x:235,y:20,w:100,h:90,doorX:285,doorY:123,name:'CLUB',district:'core',kind:'landmark',landmark:{key:'club'}}],trees:[],debris:[],streetlights:[{x:200,y:160}]};
  const tile=document.createElement('canvas');tile.width=tile.height=128;
  const cars=[{x:300,y:205,angle:.3,color:'cyan'}],police=[{x:80,y:215,angle:.7,kind:'police'}];
  const scenes=[],render=(art,hour,weather,empty=false)=>{
   art.bakeTerrain(tile.getContext('2d'),empty?{...world,buildings:[],streetlights:[]}:world);
   const canvas=make(),c=canvas.getContext('2d');for(let y=0;y<H;y+=8)for(let x=0;x<W;x+=8){c.fillStyle=['#37445b','#987b91','#5c728a','#a28572'][(x/8+y/8)%4];c.fillRect(x,y,8,8)}
   // The host blue wash precedes the recovered atmospheric renderer.
   c.globalAlpha=art.hostWashAlpha?art.hostWashAlpha(hour):.07;c.fillStyle='#87a8ff';c.fillRect(0,0,W,H);c.globalAlpha=1;
   art.atmosphere(c,{clock:7.25,hour,weather,camera:{x:0,y:0},W,H,cars,police});return c.getImageData(0,0,W,H).data;
  };
  function compare(a,b){let changedChannels=0,totalDifference=0,maxDifference=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)changedChannels++;totalDifference+=d;maxDifference=Math.max(maxDifference,d)}return{changedChannels,meanDifference:totalDifference/a.length,maxDifference}}
  for(const hour of [8,12,18.5,23])for(const weather of ['CLEAR','RAIN','MIST'])scenes.push({hour,weather,...compare(render(OriginalNeonArt,hour,weather),render(GlowportArt,hour,weather))});
  const lit=render(GlowportArt,23,'CLEAR'),unlit=render(GlowportArt,23,'CLEAR',true);let brightenedPixels=0,brightenedCyan=0,brightenedPink=0;
  for(let i=0;i<lit.length;i+=4){if(lit[i]+lit[i+1]+lit[i+2]>unlit[i]+unlit[i+1]+unlit[i+2]+12){brightenedPixels++;if(lit[i+1]+lit[i+2]>lit[i]*2)brightenedCyan++;if(lit[i]+lit[i+2]>lit[i+1]*2)brightenedPink++}}
  return{scenes,hostWash:[0,5,8,12,18.5,23].map(hour=>({hour,alpha:GlowportArt.hostWashAlpha?.(hour)})),nightLights:{brightenedPixels,brightenedCyan,brightenedPink}};
 });
 assert.deepEqual(errors,[]);
 for(const item of result.hostWash){assert(Number.isFinite(item.alpha));assert(item.alpha>=.045&&item.alpha<=.07);if(item.hour===8||item.hour===12)assert.equal(item.alpha,.045);if(item.hour===0||item.hour===5||item.hour===23)assert.equal(item.alpha,.07)}
 for(const scene of result.scenes){if(scene.hour===23)assert.equal(scene.changedChannels,0,'Original night atmosphere changed: '+JSON.stringify(scene));else{assert(scene.changedChannels>0,'Daylight clarity adjustment must actually be applied');assert(scene.meanDifference<6,'Daylight changed too far from original palette');assert(scene.maxDifference<24,'Clarity correction changed a local source excessively')}}
 assert(result.nightLights.brightenedPixels>2500);assert(result.nightLights.brightenedCyan>500);assert(result.nightLights.brightenedPink>500);
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'restored-lighting-results.json'),JSON.stringify({time:new Date().toISOString(),originalCommit:'c9b4af6',originalRendererSHA256:'fd658afd96c0a5488a7ce844dfe18ef280cbe8d711e8a692b9c45cd8ec1d1b47',...result,errors,scope:'Actual Chromium RGBA comparisons of original and corrected host wash plus atmosphere using identical ground colors, neon sources, streetlight, vehicles, clear/rain/mist and fixed time. Full-night pixels must remain exact; bounded day/dusk adjustment and visible pink/cyan night light effects are required. Full gameplay screenshots are covered separately.'},null,2)+'\n');
 console.log('PASS restored lighting: original clear/rain/mist night pixels exact; bounded daytime clarification; cyan/pink atmosphere and vehicle lights retained');
 }finally{await browser?.close();server?.kill()}})().catch(e=>{console.error(e);process.exitCode=1});
