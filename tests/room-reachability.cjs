'use strict';
// Test the actual room definitions and production movement handler, not sprite centers.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
const ready=new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',data=>{text+=data;const match=text.match(/port (\d+)/);if(match){clearTimeout(timeout);resolve('http://127.0.0.1:'+match[1]+'/Glowport88_ArtRehaul_v11.html?debug=1')}});server.once('error',reject)});
let browser;
(async()=>{try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',error=>errors.push(error.stack));page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url())});
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;localStorage.setItem('glowport88-debug-v04',JSON.stringify({version:6,mapVersion:3,story:21,money:10000,x:2320,y:1180}))});
 await page.goto(await ready);await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').click();
 const result=await page.evaluate(()=>{
  const t=GlowportTest,g=t.system,p=g.api.player(),landmarks=g.api.locations(),keys=new Set(landmarks.map(l=>l.key)),failures=[],objectives=[],baseRooms=[],movement=[],configurations=new Map();
  const entry={x:400,y:377},exit={x:400,y:370},defaultClues=[{x:211,y:223},{x:651,y:195},{x:403,y:149}];
  function blocked(solids,x,y){return x<68||x>730||y<78||y>388||solids.some(([l,top,r,b])=>x>l-6&&x<r+6&&y>top-7&&y<b+8)}
  function flood(solids){const seen=new Map(),queue=[entry],name=p=>p.x+','+p.y;seen.set(name(entry),null);for(let at=0;at<queue.length;at++){const pos=queue[at];for(const [dx,dy]of [[4,0],[-4,0],[0,4],[0,-4]]){const next={x:pos.x+dx,y:pos.y+dy},key=name(next);if(!seen.has(key)&&!blocked(solids,next.x,next.y)){seen.set(key,name(pos));queue.push(next)}}}return{queue,seen,name}}
  function endpoint(map,target,radius){return map.queue.find(pos=>Math.hypot(pos.x-target.x,pos.y-target.y)<radius)}
  function pathTo(map,target){let key=map.name(target),route=[];while(key!==null){const [x,y]=key.split(',').map(Number);route.push({x,y});key=map.seen.get(key)}return route.reverse()}
  function setup(id,index,where){g.dialogues=[];g.offer=null;g.nextEvent=1e12;g.forceWanted(0);p.inCar=null;p.inside=null;p.invuln=1e9;p.sneaking=false;if(id&&!t.setMissionStage(id,index))throw Error('Fixture failed '+id+':'+index);if(!id)g.reset(null,21);g.dialogues=[];g.offer=null;g.nextEvent=1e12;t.enterInterior(where)}
  // All supported rooms must permit arrival, a room tour, and a return to the exit.
  for(const landmark of landmarks){setup(null,0,landmark.key);const solids=GlowportArt.roomSolids(landmark.key),map=flood(solids),targets=[{x:403,y:149,radius:60,label:'central objective'},{x:570,y:195,radius:55,label:'counter/services'},{...exit,radius:35,label:'exit'}];const rows=targets.map(target=>({label:target.label,target,standpoint:endpoint(map,target,target.radius)||null}));for(const row of rows)if(!row.standpoint)failures.push({room:landmark.key,reason:'unreachable '+row.label});baseRooms.push({where:landmark.key,reachableCells:map.queue.length,targets:rows});configurations.set('base:'+landmark.key,{where:landmark.key,id:null,index:0,solids,targets});}
  // Every authored interior stage, including all clue/quiet-route points, is checked.
  for(const definition of g.catalogue)for(let index=0;index<definition.stages.length;index++){
   const stage=definition.stages[index];if(!stage.inside)continue;if(!keys.has(stage.where)){failures.push({mission:definition.id,index,where:stage.where,reason:'unknown interior'});continue}
   setup(definition.id,index,stage.where);const solids=GlowportArt.roomSolids(stage.where).concat(g.roomSolids()),map=flood(solids);let targets;
   if(stage.type==='investigate')targets=(stage.clues||defaultClues).map((point,clue)=>({...point,radius:45,label:'clue '+(clue+1)}));
   else if(stage.type==='stealth')targets=g.stealthPoints(g.stage(),g.engine.state.active.data).map((point,goal)=>({...point,radius:20,label:'quiet checkpoint '+(goal+1)}));
   else targets=[{...g.roomPoint(stage),radius:stage.type==='go'?65:60,label:stage.type+' objective'}];
   targets.push({...exit,radius:35,label:'exit'});const rows=targets.map(target=>({label:target.label,target,standpoint:endpoint(map,target,target.radius)||null}));for(const row of rows)if(!row.standpoint)failures.push({mission:definition.id,index,where:stage.where,type:stage.type,reason:'unreachable '+row.label,target:row.target});objectives.push({mission:definition.id,index,where:stage.where,type:stage.type,reachableCells:map.queue.length,targets:rows});
   if(stage.type==='investigate')configurations.set('investigation:'+stage.where+':'+JSON.stringify(solids),{where:stage.where,id:definition.id,index,solids,targets});
  }
  // Actual keyboard handlers and production update() traverse representative paths.
  // Investigations remain active until E, so their mission colliders stay in force.
  for(const [key,configuration]of configurations){setup(configuration.id,configuration.index,configuration.where);const map=flood(configuration.solids);let frames=0;
   for(const target of configuration.targets){const stand=endpoint(map,target,target.radius);if(!stand)continue;const route=pathTo(map,stand);p.ix=entry.x;p.iy=entry.y;
    for(let i=1;i<route.length;i++){const previous=route[i-1],next=route[i],key=next.x>previous.x?'d':next.x<previous.x?'a':next.y>previous.y?'s':'w';window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));t.update(4/125);window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));frames++;if(Math.abs(p.ix-next.x)>.001||Math.abs(p.iy-next.y)>.001){failures.push({configuration:key,where:configuration.where,reason:'production movement disagrees with room collision path',expected:next,actual:{x:p.ix,y:p.iy}});break}}
    if(Math.hypot(p.ix-target.x,p.iy-target.y)>=target.radius)failures.push({configuration:key,where:configuration.where,reason:'production walking did not reach '+target.label,actual:{x:p.ix,y:p.iy},target});
   }movement.push({configuration:key,where:configuration.where,targets:configuration.targets.length,productionMovementFrames:frames});
  }
  return{landmarks:landmarks.map(l=>l.key),baseRooms,objectives,movement,failures,scope:'Actual browser room definitions: exhaustive 4px connected-component checks from the standard entry against the host exact padded rectangle collision rule; all authored interior objective interaction ranges and exits. Production keydown/keyup plus update() walk every base room and each distinct investigation collider arrangement. Setup fixtures choose rooms/stages and initial position only; no completion flags or objective evaluator overrides. Entry/exit E and touch interaction are verified by the companion all-entrances-host suite.'};
 });
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'room-reachability-results.json'),JSON.stringify({time:new Date().toISOString(),...result,errors},null,2)+'\n');assert.equal(result.landmarks.length,12);assert(result.objectives.length>80,'Expected broad authored interior objective coverage');assert.deepEqual(result.failures,[]);console.log(`PASS room reachability: ${result.landmarks.length} supported interiors, ${result.objectives.length} authored interior stages, ${result.movement.length} production-walk collider configurations, no blocked objective/exit or browser errors`);
}finally{await browser?.close();server.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
