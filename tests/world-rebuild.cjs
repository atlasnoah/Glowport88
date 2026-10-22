'use strict';
// Real-host navigation/collision and map integration. Route travel below uses the
// production collision adapter; a separate curved-road run uses actual keyboard
// input and updateDriving. This does not stand in for a human campaign playthrough.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
let browser,server;
const passed=[],errors=[],evidence={};
const check=async(name,run)=>{await run();passed.push(name);console.log('PASS rebuilt host:',name)};

(async()=>{try{
 fs.mkdirSync(out,{recursive:true});
 server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',path.join(root,'Glowport88')],{stdio:['ignore','pipe','ignore']});
 const origin=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),7000);server.stdout.on('data',d=>{text+=d;const m=text.match(/port (\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1])}});server.once('error',reject)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(origin+'/Glowport88_ArtRehaul_v11.html?debug=1');
 await page.waitForFunction(()=>window.GlowportTest&&!document.querySelector('#startBtn').disabled);
 await page.locator('#startBtn').tap();
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;GlowportAudio.configure({muted:true});const g=GlowportTest.system;g.api.world().story=21;g.reset(null,21);g.nextEvent=1e12;g.offer=null;g.api.player().invuln=1e6});
 await page.waitForTimeout(50);

 await check('production host contains rebuilt districts, zoning and fifteen house designs',async()=>{
  evidence.world=await page.evaluate(()=>{const layout=GlowportTest.cityLayout;if(!layout)throw Error('Rebuilt city layout missing from actual game host');return{diagnostics:layout.diagnostics(),state:GlowportTest.getState(),architecture:window.GlowportEnvironment?.diagnostics?.()||null}});
  assert.equal(evidence.world.state.landmarks,12);assert.equal(evidence.world.state.mapW,7200);assert.equal(evidence.world.state.mapH,5040);
  assert((Array.isArray(evidence.world.diagnostics.houseVariants)?evidence.world.diagnostics.houseVariants.length:evidence.world.diagnostics.houseVariants)>=15,'All fifteen architecture variants must exist in the generated playable city');
  for(const district of ['core','west','north','south','east'])assert(evidence.world.diagnostics.byDistrict[district],`Missing playable ${district} district`);
  assert(evidence.world.diagnostics.buildingsByKind,'Actual zoning diagnostics missing');
 });

 await check('all twelve original landmark doors remain safe and expose real entrance actions',async()=>{
  const baseline=JSON.parse(fs.readFileSync(path.join(out,'rebuild-before-results.json'),'utf8')).performance.landmarks;
  evidence.landmarks=await page.evaluate(()=>{const result=[];for(const l of GlowportTest.landmarks()){GlowportTest.teleport(l.key);result.push({...l,actions:GlowportTest.interactions()})}return result});
  assert.equal(evidence.landmarks.length,12);assert(baseline?.length===12,'Stable baseline landmark evidence required');
  for(const l of evidence.landmarks){const old=baseline.find(b=>b.key===l.key);assert(old,`Unknown landmark ${l.key}`);assert.equal(l.x,old.x,`${l.key} moved horizontally`);assert.equal(l.y,old.y,`${l.key} moved vertically`);assert(l.safe&&l.onLand,`Unsafe ${l.key} approach`);assert(l.actions.some(a=>/enter/i.test(a.label)),`No real entrance action at ${l.key}`)}
 });

 await check('actual player collision blocks residential and commercial building facades',async()=>{
  evidence.buildingCollision=await page.evaluate(()=>{
   const g=GlowportTest.system,buildings=GlowportTest.cityLayout.buildings,results=[];
   if(!Array.isArray(buildings))throw Error('Actual rebuilt buildings missing');
   const stride=Math.max(1,Math.floor(buildings.length/80));
   for(let i=0;i<buildings.length;i+=stride){const b=buildings[i],x=b.x+b.w/2,y=b.y+b.h/2,actor={x,y:b.y+b.h+28};if(g.api.solid(actor.x,actor.y,9))continue;const centerSolid=g.api.solid(x,y,9);let crossed=false;for(let step=0;step<Math.ceil((b.h+60)/4);step++){g.api.move(actor,0,-4,9);if(actor.x>b.x&&actor.x<b.x+b.w&&actor.y>b.y&&actor.y<b.y+b.h)crossed=true}results.push({kind:b.kind,district:b.district,centerSolid,crossed})}
   return{tested:results.length,results,failures:results.filter(r=>!r.centerSolid||r.crossed)};
  });
  assert(evidence.buildingCollision.tested>=20,'Not enough actual accessible facade collision probes');assert.deepEqual(evidence.buildingCollision.failures,[]);
 });

 await check('every landmark pair completes pedestrian and vehicle routes through host collision',async()=>{
  evidence.routes=await page.evaluate(()=>{
   const g=GlowportTest.system,layout=GlowportTest.cityLayout,places=GlowportTest.landmarks(),failures=[],results=[];
   function traverse(route,radius){if(!Array.isArray(route)||route.length<2)return{error:'no route'};const actor={x:route[0].x,y:route[0].y};let distance=0,steps=0;for(let i=1;i<route.length;i++){const target=route[i],start={...actor},length=Math.hypot(target.x-start.x,target.y-start.y),count=Math.max(1,Math.ceil(length/4));for(let k=1;k<=count;k++){const x=start.x+(target.x-start.x)*k/count,y=start.y+(target.y-start.y)*k/count;g.api.move(actor,x-actor.x,y-actor.y,radius);steps++;if(radius===19&&!layout.navigation.isRoad(actor.x,actor.y,radius))return{error:'route left actual road',segment:i,x,y};if(Math.hypot(actor.x-x,actor.y-y)>.02)return{error:'collision',segment:i,x,y,actual:{...actor}}}distance+=length}return{distance,steps,points:route.length,end:{...actor}}}
   for(let a=0;a<places.length;a++)for(let b=a+1;b<places.length;b++)for(const vehicle of [false,true]){const from={x:places[a].x,y:places[a].y+10},to={x:places[b].x,y:places[b].y+10},route=layout.navigation.route(from,to,{vehicle}),result=traverse(route,vehicle?19:9),startGap=route?.length?Math.hypot(route[0].x-from.x,route[0].y-from.y):Infinity,endGap=route?.length?Math.hypot(route.at(-1).x-to.x,route.at(-1).y-to.y):Infinity,id=places[a].key+'→'+places[b].key+(vehicle?' vehicle':' pedestrian');if(result.error)failures.push({id,...result});if(startGap>(vehicle?100:1)||endGap>(vehicle?100:1))failures.push({id,error:'route misses requested endpoint',startGap,endGap});results.push({id,startGap,endGap,...result})}
   const culdesacs=[];for(const road of layout.roads.filter(r=>r.deadEnd||r.type==='culdesac')){const first=road.points[0],last=road.points.at(-1);for(const vehicle of [false,true]){const outward=traverse(layout.navigation.route(first,last,{vehicle}),vehicle?19:9),back=traverse(layout.navigation.route(last,first,{vehicle}),vehicle?19:9);culdesacs.push({name:road.name,vehicle,outward,back});if(outward.error||back.error)failures.push({id:road.name,vehicle,outward,back})}}
   return{pairs:places.length*(places.length-1)/2,pedestrian:results.filter(r=>r.id.endsWith('pedestrian')).length,vehicle:results.filter(r=>r.id.endsWith('vehicle')).length,steps:results.reduce((sum,r)=>sum+(r.steps||0),0),results,culdesacs,failures};
  });
  assert.equal(evidence.routes.pairs,66);assert.equal(evidence.routes.pedestrian,66);assert.equal(evidence.routes.vehicle,66);assert(evidence.routes.culdesacs.length>=20,'All ten real dead ends require both pedestrian and vehicle round trips');assert.deepEqual(evidence.routes.failures,[]);
 });

 await check('walking and driving GPS routes avoid structures and citizen routes reach real destinations',async()=>{
  evidence.guidance=await page.evaluate(()=>{
   const g=GlowportTest.system,layout=GlowportTest.cityLayout,places=GlowportTest.landmarks(),failures=[],gps=[],pedestrians=[];
   const pathLength=path=>path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);
   function inspect(path,radius,vehicle=false){if(!Array.isArray(path)||path.length<2)return{error:'missing path'};let steps=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));for(let j=0;j<=count;j++){const x=a.x+(b.x-a.x)*j/count,y=a.y+(b.y-a.y)*j/count;steps++;if(g.api.solid(x,y,radius))return{error:'guidance crosses a structure',segment:i,x,y};if(vehicle&&!layout.navigation.isRoad(x,y,radius))return{error:'driving guidance leaves the road',segment:i,x,y}}}return{points:path.length,steps,distance:pathLength(path)}}
   GlowportTest.setMission('m07');GlowportTest.teleport('hotel');const destination=g.navigationMarker();
   if(!destination||destination.inside)throw Error('Outdoor mission entrance guidance missing');
   for(const vehicle of [false,true]){GlowportTest.teleport('hotel');const player=g.api.player();if(vehicle){const car=g.api.cars().find(c=>c.personal);if(!car)throw Error('Personal vehicle fixture missing');const nearest=layout.navigation.nearest(player.x,player.y,{vehicle:true});Object.assign(car,{x:nearest.x,y:nearest.y,speed:0});player.inCar=car}const path=GlowportTest.guidance(destination),result=inspect(path,vehicle?19:9,vehicle);const endpointGap=path?.length?Math.hypot(path.at(-1).x-destination.x,path.at(-1).y-destination.y):Infinity;if(result.error||endpointGap>(vehicle?100:1))failures.push({vehicle,...result,endpointGap});gps.push({vehicle,destination:{x:destination.x,y:destination.y,label:destination.label},endpointGap,...result});player.inCar=null}
   const houses=layout.buildings.filter(b=>b.kind==='house'),stride=Math.max(1,Math.floor(houses.length/40));let blockedDirect=0;
   for(let i=0;i<houses.length;i+=stride){const b=houses[i],from={x:b.doorX,y:b.doorY},to=places[(i*7)%places.length],path=GlowportTest.pedestrianRoute(from,to),result=inspect([from,...(path||[])],9);const endpointGap=path?.length?Math.hypot(path.at(-1).x-to.x,path.at(-1).y-to.y):Infinity;let directBlocked=false;for(let j=1;j<100;j++)if(g.api.solid(from.x+(to.x-from.x)*j/100,from.y+(to.y-from.y)*j/100,9)){directBlocked=true;break}if(directBlocked)blockedDirect++;if(result.error||endpointGap>1)failures.push({id:b.id,...result,endpointGap});pedestrians.push({id:b.id,district:b.district,to:to.key,directBlocked,endpointGap,...result})}
   GlowportTest.teleport('hotel');return{gps,pedestrians,blockedDirect,failures};
  });
  assert.equal(evidence.guidance.gps.length,2);assert(evidence.guidance.gps.every(r=>r.points>=3),'GPS must include actual street turns');assert(evidence.guidance.pedestrians.length>=30);assert(evidence.guidance.blockedDirect>=10,'Citizen route probes must include real obstructed direct paths');assert.deepEqual(evidence.guidance.failures,[]);
 });

 await check('East Diner services, parking and residential driveways connect to actual streets',async()=>{
  evidence.neighborhoodAccess=await page.evaluate(()=>{
   const g=GlowportTest.system,layout=GlowportTest.cityLayout,diner=GlowportTest.landmarks().find(l=>l.key==='diner'),neighborhood=layout.neighborhoods?.find(n=>n.id==='east-diner'),failures=[];
   function traverse(path,radius){if(!Array.isArray(path)||path.length<2)return{error:'missing path'};const actor={x:path[0].x,y:path[0].y};let steps=0;for(let i=1;i<path.length;i++){const a={...actor},b=path[i],count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));for(let j=1;j<=count;j++){const x=a.x+(b.x-a.x)*j/count,y=a.y+(b.y-a.y)*j/count;g.api.move(actor,x-actor.x,y-actor.y,radius);steps++;if(Math.hypot(actor.x-x,actor.y-y)>.02)return{error:'collision',segment:i,x,y}}}return{steps,end:{...actor}}}
   const services=[];for(const name of ['EAST DINER FUEL','MAGNOLIA CORNER STORE']){const b=layout.buildings.find(b=>b.name===name);if(!b){failures.push({name,error:'missing service'});continue}const to={x:b.doorX,y:b.doorY},path=layout.navigation.route(diner,to,{vehicle:false}),result=traverse(path,9),endGap=path?.length?Math.hypot(path.at(-1).x-to.x,path.at(-1).y-to.y):Infinity;if(result.error||endGap>1)failures.push({name,endGap,...result});services.push({name,neighborhood:b.neighborhood,endGap,...result})}
   const parking=layout.spaces.find(s=>s.id==='east-diner-parking');let parkingAccess=null;if(parking){const target={x:parking.x+parking.w/2,y:parking.y+parking.h/2},path=layout.navigation.route(diner,target,{vehicle:false}),result=traverse(path,9),endGap=path?.length?Math.hypot(path.at(-1).x-target.x,path.at(-1).y-target.y):Infinity;parkingAccess={...result,endGap};if(result.error||endGap>1)failures.push({name:'East Diner parking',endGap,...result})}else failures.push({name:'East Diner parking',error:'missing lot'});
   const driveways=[];for(const b of layout.buildings.filter(b=>b.kind==='house'&&b.lot?.driveway?.length>=2)){const path=b.lot.driveway,result=traverse(path,19),streetEnd=layout.navigation.isRoad(path.at(-1).x,path.at(-1).y,19);if(result.error||!streetEnd)failures.push({name:b.id,streetEnd,...result});driveways.push({id:b.id,district:b.district,streetEnd,...result})}
   return{neighborhood,services,parkingAccess,driveways,failures,terrainProps:GlowportTest.getWorld().details?.length||0,hudDistrict:g.api.district(diner.x,diner.y).name};
  });
  assert(evidence.neighborhoodAccess.neighborhood,'East Diner needs an actual bounded neighborhood');assert.equal(evidence.neighborhoodAccess.services.length,2);assert(evidence.neighborhoodAccess.services.every(s=>s.neighborhood==='east-diner'));assert(/EAST DINER/.test(evidence.neighborhoodAccess.hudDistrict));assert(evidence.neighborhoodAccess.driveways.length>=100,'Residential driveways must exist in the playable host');assert(evidence.neighborhoodAccess.terrainProps>=100,'Neighborhood street details missing');assert.deepEqual(evidence.neighborhoodAccess.failures,[]);
 });

 await check('full map and minimap display the same rebuilt road geometry as the playable city',async()=>{
  await page.evaluate(()=>{GlowportTest.teleport('hotel');GlowportTest.drawGame();GlowportTest.system.api.hud()});
  await page.locator('#mapBtn').tap();await page.locator('#mapPanel').waitFor({state:'visible'});
  evidence.maps=await page.evaluate(()=>{
   const base=GlowportTest.mapBase;if(!(base instanceof HTMLCanvasElement))throw Error('Actual map base canvas hook missing');const layout=GlowportTest.cityLayout,state=GlowportTest.getState(),ctx=base.getContext('2d'),data=ctx.getImageData(0,0,base.width,base.height).data,samples=[];
   for(const road of layout.roads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i];if(Math.hypot(b.x-a.x,b.y-a.y)<35)continue;const wx=(a.x+b.x)/2,wy=(a.y+b.y)/2,x=Math.round(wx/state.mapW*base.width),y=Math.round(wy/state.mapH*base.height);let found=false;for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const index=((y+oy)*base.width+x+ox)*4,r=data[index],g=data[index+1],b=data[index+2];if(r>=70&&g>=80&&b>=90&&Math.max(r,g,b)-Math.min(r,g,b)<45)found=true}samples.push({road:road.name,type:road.type,wx,wy,found})}
   function matches(canvas){const expected=document.createElement('canvas');expected.width=canvas.width;expected.height=canvas.height;const ec=expected.getContext('2d'),ac=canvas.getContext('2d');ec.imageSmoothingEnabled=ac.imageSmoothingEnabled;ec.drawImage(base,0,0,canvas.width,canvas.height);const a=ac.getImageData(0,0,canvas.width,canvas.height).data,b=ec.getImageData(0,0,canvas.width,canvas.height).data;let same=0;for(let i=0;i<a.length;i+=4)if(a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2])same++;return same/(a.length/4)}
   return{roadSamples:samples,roadCoverage:samples.filter(s=>s.found).length/samples.length,fullMapBaseMatch:matches(document.querySelector('#fullmap')),minimapBaseMatch:matches(document.querySelector('#minimap'))};
  });
  assert(evidence.maps.roadSamples.length>30);assert(evidence.maps.roadCoverage>.94,`Map roads missing: ${JSON.stringify(evidence.maps.roadSamples.filter(s=>!s.found))}`);assert(evidence.maps.fullMapBaseMatch>.94);assert(evidence.maps.minimapBaseMatch>.94);
  await page.locator('#fullmap').screenshot({path:path.join(out,'rebuild-world-map.png')});await page.locator('#mapClose').tap();await page.screenshot({path:path.join(out,'rebuild-mobile-city.png')});
 });

 await check('real simulation keeps pedestrians, traffic and archive spawns finite and out of solids',async()=>{
  evidence.simulation=await page.evaluate(()=>{const g=GlowportTest.system;GlowportTest.teleport('radio');const snapshots=[],tracking=new Map(g.api.cars().filter(c=>c.ai).map(c=>[c,{car:c,x:c.x,y:c.y,distance:0,stalled:0,maxStalled:0}]));for(let i=0;i<1800;i++){GlowportTest.update(1/60);for(const t of tracking.values()){const step=Math.hypot(t.car.x-t.x,t.car.y-t.y);t.distance+=step;t.stalled=step<.01?t.stalled+1/60:0;t.maxStalled=Math.max(t.maxStalled,t.stalled);t.x=t.car.x;t.y=t.car.y}if(i%300===299){const npcs=g.api.npcs(),traffic=g.api.cars().filter(c=>c.ai);snapshots.push({time:i+1,npcs:npcs.length,traffic:traffic.length,npcSolid:npcs.filter(n=>g.api.solid(n.x,n.y,8)).map(n=>({id:n.id,x:n.x,y:n.y})),trafficSolid:traffic.filter(c=>g.api.solid(c.x,c.y,18)).map(c=>({x:c.x,y:c.y})),trafficOffRoad:traffic.filter(c=>!GlowportTest.cityLayout.navigation.isRoad(c.x,c.y,18)).map(c=>({id:c.id,ring:c.ring,x:c.x,y:c.y})),nonfinite:npcs.concat(traffic).filter(n=>!Number.isFinite(n.x)||!Number.isFinite(n.y)).length})}}return{snapshots,trafficProgress:Array.from(tracking.values(),t=>({ring:t.car.ring,distance:t.distance,maxStalled:t.maxStalled,x:t.x,y:t.y})),archives:GlowportTest.livingCity.diagnostics().sites.map(t=>({...t,safe:GlowportTest.canStand(t.x,t.y)}))}});
  assert(evidence.simulation.snapshots.every(s=>s.nonfinite===0));assert(evidence.simulation.snapshots.every(s=>s.npcSolid.length===0),JSON.stringify(evidence.simulation.snapshots.filter(s=>s.npcSolid.length)));assert(evidence.simulation.snapshots.every(s=>s.trafficSolid.length===0),JSON.stringify(evidence.simulation.snapshots.filter(s=>s.trafficSolid.length)));assert(evidence.simulation.snapshots.every(s=>s.trafficOffRoad.length===0),JSON.stringify(evidence.simulation.snapshots.filter(s=>s.trafficOffRoad.length)));assert(evidence.simulation.archives.every(s=>s.safe));assert(evidence.simulation.trafficProgress.every(t=>t.maxStalled<15),`Traffic stalled for too long: ${JSON.stringify(evidence.simulation.trafficProgress.filter(t=>t.maxStalled>=15))}`);assert(evidence.simulation.trafficProgress.every(t=>t.distance>100),`Traffic permanently stalled: ${JSON.stringify(evidence.simulation.trafficProgress.filter(t=>t.distance<=100))}`);
 });

 await check('actual keyboard driving follows a curved residential street and reverses safely',async()=>{
  evidence.driving=await page.evaluate(()=>{
   const g=GlowportTest.system,layout=GlowportTest.cityLayout,road=layout.roads.find(r=>r.points.length>=6&&r.w>=54&&r.type!=='culdesac'&&r.district!=='core');if(!road)throw Error('No curved driveable residential road');
   const points=road.points.slice(),first=points[0],next=points[1];g.api.cars().length=0;g.api.npcs().length=0;g.forceWanted(0);const car=GlowportVehicles.spawn('compact',{x:first.x,y:first.y,angle:Math.atan2(next.x-first.x,-(next.y-first.y))});car.personal=true;car.health=100;g.api.cars().push(car);const p=g.api.player();p.inside=null;p.inCar=car;p.hp=150;p.invuln=1e6;
   const keys=new Set();function input(key,on){if(keys.has(key)===on)return;on?keys.add(key):keys.delete(key);window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{key,bubbles:true}))}function clear(){for(const key of [...keys])input(key,false)}
   const angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),samples=[];let index=1,frames=0,solidFrames=0,offRoadFrames=0,minHealth=100;
   for(;frames<18000&&index<points.length;frames++){const dest=points[index];if(Math.hypot(dest.x-car.x,dest.y-car.y)<14){index++;continue}const aim=Math.atan2(dest.x-car.x,-(dest.y-car.y)),error=angle(aim-car.angle);input('a',error<-.035);input('d',error>.035);input('w',car.speed<62);input('s',car.speed>75);GlowportTest.update(1/60);if(g.api.solid(car.x,car.y,19))solidFrames++;if(!layout.navigation.isRoad(car.x,car.y,0))offRoadFrames++;minHealth=Math.min(minHealth,car.health);if(frames%120===0)samples.push({frame:frames,waypoint:index,x:car.x,y:car.y,speed:car.speed,error})}
   clear();const routeEnd={x:car.x,y:car.y},completed=index>=points.length;
   // Use the final clear road segment for a real reverse input. This tests the
   // actual reverse gear while the route collision test covers dead-end return paths.
   let reverseDistance=0;if(completed){car.speed=0;input('s',true);const start={x:car.x,y:car.y};for(let i=0;i<45;i++)GlowportTest.update(1/60);reverseDistance=Math.hypot(car.x-start.x,car.y-start.y);clear()}
   p.inCar=null;p.x=car.x;p.y=car.y;return{road:road.name,type:road.type,points:points.length,frames,completed,waypointsReached:index,solidFrames,offRoadFrames,minHealth,routeEnd,reverseDistance,samples};
  });
  assert(evidence.driving.completed,`Driver stalled: ${JSON.stringify(evidence.driving)}`);assert.equal(evidence.driving.solidFrames,0);assert.equal(evidence.driving.offRoadFrames,0,'Actual curve driving left the road');assert(evidence.driving.minHealth>=99,'Driving through the curve collided with solid world geometry');assert(evidence.driving.reverseDistance>8,'Actual reverse input did not move car');
 });

 await check('real renderer remains within the six-tile terrain budget without browser errors',async()=>{
  evidence.terrain=await page.evaluate(()=>{for(const key of ['hotel','radio','observatory','clinic','warehouse','diner','pier','motel']){GlowportTest.teleport(key);GlowportTest.drawGame()}return GlowportTest.terrain()});assert(evidence.terrain.cachedTiles<=6);assert(evidence.terrain.peakResidentBytes<=24*1024*1024);assert.deepEqual(errors,[]);
 });

 fs.writeFileSync(path.join(out,'rebuild-world-results.json'),JSON.stringify({time:new Date().toISOString(),passed,errors,...evidence,scope:'Production mobile Chromium host: actual collision traversal of 66 pedestrian and 66 vehicle routes, original landmark entrance actions, house-to-landmark citizen routes and walking/driving GPS, East Diner services/parking, car-radius driveway traversal, full/minimap pixels, simulation safety and keyboard/updateDriving curved-road/reverse run. Travel/traffic isolation fixtures used; campaign regressions are covered by the separate existing gameplay suites. Not a physical-device performance claim.'},null,2));
 fs.rmSync(path.join(out,'rebuild-world-failure.txt'),{force:true});fs.rmSync(path.join(out,'rebuild-world-partial.json'),{force:true});console.log(`${passed.length} rebuilt world host checks passed`);
}finally{await browser?.close();server?.kill()}})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'rebuild-world-failure.txt'),e.stack);fs.writeFileSync(path.join(out,'rebuild-world-partial.json'),JSON.stringify({time:new Date().toISOString(),passed,errors,...evidence},null,2));console.error(e);process.exitCode=1});
