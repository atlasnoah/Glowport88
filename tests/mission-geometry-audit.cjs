'use strict';
// Audit actual production room/landmark geometry for every authored objective.
// Clue objects are solid: test a reachable interaction position, not their centers.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
const ready=new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',data=>{output+=data;const match=output.match(/port (\d+)/);if(match){clearTimeout(timeout);resolve('http://127.0.0.1:'+match[1]+'/Glowport88_ArtRehaul_v11.html?debug=1')}});server.once('error',reject)});
let browser;
(async()=>{try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});await page.goto(await ready);await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);await page.locator('#startBtn').click();
 const result=await page.evaluate(()=>{
  const g=GlowportTest.system,p=g.api.player(),rows=[],failures=[],graphs=new Map(),landmarks=g.api.locations();
  const graphFor=(where,solids)=>{const key=where+JSON.stringify(solids);if(graphs.has(key))return graphs.get(key);const step=4,blocked=(x,y)=>x<68||x>730||y<78||y>388||solids.some(([l,t,r,b])=>x>l-6&&x<r+6&&y>t-7&&y<b+8),points=[],seen=new Set(),queue=[{x:400,y:377}],origin=queue[0];
   if(blocked(origin.x,origin.y))return{blockedSpawn:true,points:[]};seen.add(origin.x+','+origin.y);
   for(let head=0;head<queue.length;head++){const at=queue[head];points.push(at);for(const[dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const x=at.x+dx,y=at.y+dy,key=x+','+y;if(seen.has(key)||blocked(x,y))continue;seen.add(key);queue.push({x,y})}}
   const graph={blockedSpawn:false,points};graphs.set(key,graph);return graph;
  };
  for(const def of g.catalogue)for(let index=0;index<def.stages.length;index++){
   const stage=def.stages[index],id=def.id+':'+index,loc=landmarks.find(l=>l.key===stage.where),row={id,type:stage.type,where:stage.where,inside:!!stage.inside};rows.push(row);
   if(!loc){failures.push({id,reason:'Missing landmark'});continue}
   if(stage.fromWhere&&!landmarks.some(l=>l.key===stage.fromWhere))failures.push({id,reason:'Missing pickup landmark'});
   if(!stage.inside){row.doorClear=!g.api.solid(loc.x,loc.y,9);if(!row.doorClear)failures.push({id,reason:'Outdoor objective doorway is blocked'});continue}
   GlowportTest.setMissionStage(def.id,index);g.dialogues=[];g.offer=null;g.nextEvent=1e12;GlowportTest.enterInterior(stage.where);
   const solids=GlowportArt.roomSolids(stage.where).concat(g.roomSolids()),graph=graphFor(stage.where,solids);row.reachableSamples=graph.points.length;if(graph.blockedSpawn){failures.push({id,reason:'Room entry spawn is inside furniture'});continue}
   const targets=stage.type==='investigate'?(stage.clues||[{x:211,y:223},{x:651,y:195},{x:403,y:149}]).map(point=>({point,radius:54})):stage.type==='stealth'?g.stealthPoints(stage,{}).map(point=>({point,radius:27})):[{point:g.roomPoint(stage),radius:75}];
   row.targets=targets.map(({point,radius})=>{let nearest=null,distance=Infinity;for(const pos of graph.points){const d=Math.hypot(pos.x-point.x,pos.y-point.y);if(d<distance){nearest=pos;distance=d}}if(distance>=radius)failures.push({id,reason:'No reachable interaction position',target:point,radius,distance});return{point,radius,nearest,distance}});
   row.exitReachable=graph.points.some(pos=>Math.hypot(pos.x-400,pos.y-370)<55);if(!row.exitReachable)failures.push({id,reason:'Cannot return to room exit'});
  }
  const types={};for(const row of rows)types[row.type]=(types[row.type]||0)+1;
  return{definitions:g.catalogue.length,stages:rows.length,interiorStages:rows.filter(row=>row.inside).length,landmarks:landmarks.length,roomConfigurations:graphs.size,types,rows,failures};
 });
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'artifacts/mission-geometry-audit-results.json'),JSON.stringify({time:new Date().toISOString(),...result,errors,scope:'Actual production host/catalogue/landmarks and room solids. Four-pixel cardinal movement flood fill from exact entry spawn checks every interior objective interaction radius, including solid investigation props, all indoor stealth points and exit return. Outdoor objective landmark doors checked against actual world collision. This verifies geometry, not objective completion or difficulty.'},null,2)+'\n');assert.deepEqual(result.failures,[]);console.log(`PASS mission geometry: ${result.definitions} definitions / ${result.stages} stages / ${result.interiorStages} interior stages; reachable interaction ranges and exits; ${result.roomConfigurations} actual room configurations; no browser errors`);
}finally{await browser?.close();server.kill()}})().catch(error=>{console.error(error);process.exitCode=1});
