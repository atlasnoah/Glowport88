/* Ambient traffic on the preserved road grid. No world, artwork, player handling,
 * mission logic, or global random-generator mutation belongs to this module. */
(function(global){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=(n,f=0)=>Number.isFinite(n)?n:f,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0};
const dirs=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];
function create(options={}){
 const xs=[...(options.roadXs||[])],ys=[...(options.roadYs||[])],lane=12,extent=42,stopOffset=76,cap=clamp(Math.floor(finite(options.cap,43)),0,100),speedScale=1.15;
 const signalOffsets=new Map((options.signals||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.offset)).map(p=>[p.x+','+p.y,p.offset]));
 const nodes=[],edges=[],byKey=new Map(),states=new Map(),owners=new Map(),templates=[],blockedRoads=new Map(),retiredAt=new Map();
 let clock=0,sequence=0,manageAt=0,context={},lastCars=[],peak=0,obstaclesAt=-1;
 const totals={distance:0,trips:0,turns:0,recoveries:0,recycled:0,spawned:0,blockedRecoveries:0,invalidSteps:0,maxPopulation:0,uTurns:0,retired:0};
 for(let y=0;y<ys.length;y++)for(let x=0;x<xs.length;x++)nodes.push({id:y*xs.length+x,ix:x,iy:y,x:xs[x],y:ys[y],out:[]});
 for(const a of nodes)for(let dir=0;dir<4;dir++){const d=dirs[dir],x=a.ix+d.x,y=a.iy+d.y;if(x<0||x>=xs.length||y<0||y>=ys.length)continue;const b=nodes[y*xs.length+x],key=a.id+'>'+b.id,edge={key,a,b,dir,dx:d.x,dy:d.y,length:dist(a,b)-extent*2,start:{x:a.x+d.x*extent-d.y*lane,y:a.y+d.y*extent+d.x*lane},end:{x:b.x-d.x*extent-d.y*lane,y:b.y-d.y*extent+d.x*lane}};edges.push(edge);byKey.set(key,edge);a.out.push(edge)}
 function protectedCar(car){return !!(car.personal||car.wasDriven||car._mission||car._missionTarget||car._encounterScene||car._encounterRace||car._chase||car._escort||car===context.playerCar)}
 function eligible(car){return !!car?.ai&&car!==context.playerCar}
 function solid(x,y){return options.solid?.(x,y,19)||false}
 function isRoad(x,y){return options.isRoad?options.isRoad(x,y,19):xs.some(n=>Math.abs(n-x)<=14.01)||ys.some(n=>Math.abs(n-y)<=14.01)}
 function point(edge,along){return {x:edge.start.x+edge.dx*along,y:edge.start.y+edge.dy*along,angle:Math.atan2(edge.dx,-edge.dy)}}
 function offscreen(p,margin=170){const camera=context.camera;if(camera&&Number.isFinite(camera.x)&&Number.isFinite(camera.y))return p.x<camera.x-margin||p.x>camera.x+finite(context.width,800)+margin||p.y<camera.y-margin||p.y>camera.y+finite(context.height,450)+margin;const focus=context.focus;return !focus||dist(p,focus)>700}
 function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
 function district(p){return options.district?.(p.x,p.y)?.id||options.district?.(p.x,p.y)||'core'}
 function signal(edge,time=clock){const n=edge.b,offset=signalOffsets.get(n.x+','+n.y);if(offset!==undefined){const legacyPhase=(time+offset)%28;return legacyPhase<17?'green':legacyPhase<21?'amber':'red'}const phase=(time+(n.ix*7+n.iy*3)%17)%28,horizontal=edge.dir%2===0;return horizontal?(phase<11?'green':phase<14?'amber':'red'):(phase>=14&&phase<25?'green':phase>=25?'amber':'red')}
 function release(s){for(const [id,car]of owners)if(car===s.car)owners.delete(id)}
 function destination(s){const from=s.edge.b;let node=null;for(let i=0;i<20;i++){const p=nodes[Math.floor(random(s)*nodes.length)];if(p&&Math.abs(p.ix-from.ix)+Math.abs(p.iy-from.iy)>=6){node=p;break}}s.destination=node||nodes[(from.id+Math.floor(nodes.length/2))%nodes.length];s.visited.add(district(from));s.car.trafficDestination={x:s.destination.x,y:s.destination.y};s.trips++;totals.trips++}
 function chooseNext(s,blocked=null){const at=s.edge.b;if(!s.destination||at.id===s.destination.id)destination(s);let choices=at.out.filter(e=>e.b!==s.edge.a&&e!==blocked&&!blockedRoads.has(e.key));if(!choices.length)choices=at.out.filter(e=>e!==blocked&&!blockedRoads.has(e.key));if(!choices.length)return null;let best=null,score=Infinity;for(const edge of choices){const nextCost=Math.abs(edge.b.ix-s.destination.ix)+Math.abs(edge.b.iy-s.destination.iy),cost=nextCost+random(s)*.7;if(cost<score){score=cost;best=edge}}return best}
 function turnPath(from,to){const a=from.end,b=to.start,den=from.dx*to.dy-from.dy*to.dx;if(!den)return {a,b,c:null,length:dist(a,b),turn:false};
  const delta={x:b.x-a.x,y:b.y-a.y},t=(delta.x*to.dy-delta.y*to.dx)/den,c={x:a.x+from.dx*t,y:a.y+from.dy*t},radius=8;
  // Trim the lane-line corner, then ease through a short quadratic. A single
  // wide quadratic cuts the outside curb; these tangent connectors keep even
  // the navigation adapter's conservative 19px vehicle clearance on the road.
  const enter={x:c.x-from.dx*radius,y:c.y-from.dy*radius},exit={x:c.x+to.dx*radius,y:c.y+to.dy*radius},samples=[{...a,d:0}];
  const add=p=>samples.push({...p,d:samples.at(-1).d+dist(samples.at(-1),p)});add(enter);
  for(let i=1;i<=16;i++){const v=i/16,u=1-v;add({x:u*u*enter.x+2*u*v*c.x+v*v*exit.x,y:u*u*enter.y+2*u*v*c.y+v*v*exit.y})}add(b);
  return {a,b,c,length:samples.at(-1).d,turn:true,samples};
 }
 function curve(path,t){if(!path.samples)return {x:path.a.x+(path.b.x-path.a.x)*t,y:path.a.y+(path.b.y-path.a.y)*t,angle:Math.atan2(path.b.x-path.a.x,-(path.b.y-path.a.y))};
  const along=clamp(t,0,1)*path.length,samples=path.samples;let i=1;while(i<samples.length-1&&samples[i].d<along)i++;const a=samples[i-1],b=samples[i],v=(along-a.d)/(b.d-a.d||1);return {x:a.x+(b.x-a.x)*v,y:a.y+(b.y-a.y)*v,angle:Math.atan2(b.x-a.x,-(b.y-a.y))};
 }
 function nearest(car){let best=null;const dx=Math.sin(finite(car.angle)),dy=-Math.cos(finite(car.angle));for(const edge of edges){const along=clamp((car.x-edge.start.x)*edge.dx+(car.y-edge.start.y)*edge.dy,0,edge.length),p=point(edge,along),d=dist(car,p),cost=d+(dx*edge.dx+dy*edge.dy<-.1?28:0);if((!best||cost<best.cost)&&!solid(p.x,p.y)&&isRoad(p.x,p.y))best={edge,along,p,cost,d}}return best}
 function state(car){return states.get(car)}
 function restore(car,cars=lastCars,ctx=context){if(!car?.ai)return car;context={...context,...ctx};let s=states.get(car);if(s&&dist(car,s.last)<8)return car;if(s)release(s);const near=nearest(car);if(!near)return car;
  const id=car.id||'traffic-roam-'+(++sequence),oldSeed=hash(id);s={car,edge:near.edge,along:near.along,next:null,path:null,pathAlong:0,destination:null,seed:oldSeed,wait:0,stuck:0,distance:0,trips:0,turns:0,visited:new Set(),last:{x:car.x,y:car.y},arrived:0,cruise:clamp(finite(car._ambientBaseSpeed,finite(car.targetSpeed,90)),30,110)*speedScale,reason:'cruising'};
  car.id=id;car._ambientBaseSpeed=s.cruise/speedScale;car.targetSpeed=s.cruise;car.speed=clamp(finite(car.speed),0,s.cruise);car._trafficMapVersion=3;car._ambientManaged=true;
  // Loading/bootstrap happens before the first displayed play frame. Never use
  // this projection to recover an already active visible car.
  Object.assign(car,near.p);s.last={x:car.x,y:car.y};states.set(car,s);destination(s);s.next=chooseNext(s);return car;
 }
 function gapAt(p,cars,ignore,radius=85){return cars.every(o=>o===ignore||dist(p,o)>=radius)}
 function findSpawn(s,cars,initial=false){const focus=context.focus||{x:(options.MW||7200)/2,y:(options.MH||5040)/2};let best=null,bestScore=Infinity;for(let i=0;i<260;i++){const edge=edges[Math.floor(random(s)*edges.length)];if(!edge)break;const along=60+random(s)*Math.max(1,edge.length-120),p=point(edge,along);if((!initial&&!offscreen(p,220))||solid(p.x,p.y)||!isRoad(p.x,p.y)||!gapAt(p,cars,s.car,95))continue;const kind=options.classify?.(p.x,p.y),weight={residential:.7,older:.8,mixed:1,commercial:1.15,industrial:.9}[kind]||1;if(random(s)>weight/1.15)continue;const d=dist(p,focus),score=initial?random(s)*1000:Math.abs(d-1100)+random(s)*350;if(score<bestScore){bestScore=score;best={edge,along,p}}}return best}
 function relocate(s,cars,initial=false){if(!initial&&(protectedCar(s.car)||!offscreen(s.car,220)))return false;const spawn=findSpawn(s,cars,initial);if(!spawn)return false;release(s);s.edge=spawn.edge;s.along=spawn.along;s.path=null;s.recovery=null;s.pathAlong=0;s.wait=0;s.stuck=0;s.arrived=0;s.destination=null;Object.assign(s.car,spawn.p);s.car.speed=0;s.last={x:s.car.x,y:s.car.y};destination(s);s.next=chooseNext(s);if(!initial){totals.recoveries++;totals.recycled++}return true}
 function bootstrap(cars,ctx={}){reset();context=ctx;lastCars=cars;for(const car of cars.filter(eligible)){const template={};for(const key of ['color','modelId','w','h','style','health','dir'])if(car[key]!==undefined)template[key]=car[key];template.baseSpeed=finite(car.targetSpeed,90);templates.push(template);restore(car,cars,ctx)}
  // Preserve population and approved sprites, but distribute it across the
  // existing city instead of confining it to five disjoint rectangular loops.
  for(const car of cars.filter(eligible)){const s=state(car);if(!s)continue;relocate(s,cars,true);car.speed=s.cruise*.65}
  peak=cars.filter(eligible).length;totals.maxPopulation=peak;return diagnostics();
 }
 function reset(){states.clear();owners.clear();blockedRoads.clear();retiredAt.clear();obstaclesAt=-1;templates.length=0;clock=0;sequence=0;manageAt=0;lastCars=[];peak=0;for(const key of Object.keys(totals))totals[key]=0}
 function grid(values,size){const cells=new Map();for(const o of values){const key=Math.floor(o.x/size)+','+Math.floor(o.y/size);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(o)}return (p,r)=>{const found=[];for(let x=Math.floor((p.x-r)/size);x<=Math.floor((p.x+r)/size);x++)for(let y=Math.floor((p.y-r)/size);y<=Math.floor((p.y+r)/size);y++)found.push(...cells.get(x+','+y)||[]);return found}}
 function nextPoint(s,advance){if(s.path)return curve(s.path,clamp((s.pathAlong+advance)/s.path.length,0,1));return point(s.edge,Math.min(s.edge.length,s.along+advance))}
 function boxBlocked(s,nearCars){if(!s.next)return true;const exit=point(s.next,Math.min(80,s.next.length));for(const o of nearCars(exit,115)){if(o===s.car)continue;const dx=o.x-s.next.start.x,dy=o.y-s.next.start.y,forward=dx*s.next.dx+dy*s.next.dy,side=Math.abs(dx*-s.next.dy+dy*s.next.dx);if(forward>-18&&forward<94&&side<23)return true}return false}
 function pedestrianLimit(car,peds,cruise){let cap=cruise,clearance=Infinity;const dx=Math.sin(car.angle),dy=-Math.cos(car.angle);for(const p of peds){const px=p.x-car.x,py=p.y-car.y,forward=px*dx+py*dy,side=Math.abs(px*-dy+py*dx);if(forward>0&&forward<100&&side<21){const gap=Math.max(0,forward-31);clearance=Math.min(clearance,gap);cap=Math.min(cap,Math.sqrt(2*180*gap))}}return {speed:cap,gap:clearance}}
 function refreshBlockedRoads(cars){if(clock<obstaclesAt+1&&clock>=obstaclesAt)return;obstaclesAt=clock;blockedRoads.clear();
  for(const car of cars){if(car.ai||Math.abs(finite(car.speed))>4)continue;for(const edge of edges){const dx=car.x-edge.start.x,dy=car.y-edge.start.y,along=dx*edge.dx+dy*edge.dy,side=Math.abs(dx*-edge.dy+dy*edge.dx);if(along>-12&&along<edge.length+12&&side<23)blockedRoads.set(edge.key,car)}}
 }
 function tryRoadRecovery(s,cars,pedestrians){if(s.path||s.recovery||s.stuck<6||s.along<45||s.edge.length-s.along<45||s.car.speed>2)return false;
  const obstacle=blockedRoads.get(s.edge.key);if(!obstacle)return false;const edge=s.edge,dx=obstacle.x-s.car.x,dy=obstacle.y-s.car.y,forward=dx*edge.dx+dy*edge.dy;if(forward<28||forward>150)return false;
  const reverse=byKey.get(edge.b.id+'>'+edge.a.id);if(!reverse)return false;const center={x:s.car.x+edge.dy*lane,y:s.car.y-edge.dx*lane},samples=[];
  for(let i=0;i<=32;i++){const theta=i/32*Math.PI,p={x:center.x-edge.dy*lane*Math.cos(theta)+edge.dx*lane*Math.sin(theta),y:center.y+edge.dx*lane*Math.cos(theta)+edge.dy*lane*Math.sin(theta)};if(solid(p.x,p.y)||!isRoad(p.x,p.y))return false;for(const o of cars)if(o!==s.car&&dist(p,o)<38)return false;for(const n of pedestrians||[])if(dist(p,n)<32)return false;samples.push({...p,d:i?0:0});if(i)samples[i].d=samples[i-1].d+dist(samples[i-1],p)}
  release(s);delete s.releaseNode;s.recovery={a:samples[0],b:samples.at(-1),samples,length:samples.at(-1).d,along:0,center,edge:reverse};s.car.speed=0;s.wait=0;s.reason='safe-u-turn';return true;
 }
 function recoveryClosure(car,own){let gap=Infinity;const fx=Math.sin(car.angle),fy=-Math.cos(car.angle);for(const s of states.values()){if(s===own||!s.recovery)continue;const p=s.recovery.center,dx=p.x-car.x,dy=p.y-car.y,forward=dx*fx+dy*fy,side=Math.abs(dx*-fy+dy*fx);if(forward>0&&forward<200&&side<42)gap=Math.min(gap,Math.max(0,forward-61))}return gap}
 function recoverStep(s,dt,cars,pedestrians){const r=s.recovery,car=s.car,advance=Math.min(r.length-r.along,Math.min(28,car.speed+70*dt)*dt),p=curve(r,(r.along+advance)/r.length);let safe=!solid(p.x,p.y)&&isRoad(p.x,p.y);for(const o of cars)if(o!==car&&dist(p,o)<23.5)safe=false;for(const n of pedestrians||[])if(dist(p,n)<30)safe=false;const before={x:car.x,y:car.y};if(safe){Object.assign(car,p);r.along+=advance;car.speed=dt?dist(before,p)/dt:0}else car.speed=0;const moved=dist(before,car);s.distance+=moved;totals.distance+=moved;s.stuck=moved<.1?s.stuck+dt:0;s.last={x:car.x,y:car.y};s.reason='safe-u-turn';car.trafficState=s.reason;car.trafficDistance=s.distance;
  if(r.along>=r.length-.001){s.edge=r.edge;s.along=clamp((car.x-s.edge.start.x)*s.edge.dx+(car.y-s.edge.start.y)*s.edge.dy,0,s.edge.length);s.recovery=null;s.next=chooseNext(s);s.stuck=0;s.wait=0;s.turns++;totals.turns++;totals.uTurns++}
 }
 function ambientPopulation(cars){return cars.filter(car=>eligible(car)&&!protectedCar(car)).length}
 function manage(cars){
  for(const car of retiredAt.keys())if(!cars.includes(car)||car.ai||protectedCar(car))retiredAt.delete(car);
  for(let i=cars.length-1;i>=0;i--){const car=cars[i];if(!car._ambientManaged||car.ai||protectedCar(car))continue;
   // A completed chase can leave a healthy parked ambient car. Give contact
   // interactions a full minute; only retire it after protection has ended
   // and the car is out of view. Durable player cars retain their own rules.
   if(!retiredAt.has(car))retiredAt.set(car,clock);const elapsed=clock-retiredAt.get(car);
   if((car.health<=0||elapsed>=60)&&offscreen(car,220)){const s=states.get(car);if(s)release(s);states.delete(car);retiredAt.delete(car);cars.splice(i,1);totals.recycled++;totals.retired++}
  }
  for(const [car,s]of states)if(!cars.includes(car)||!eligible(car)){release(s);states.delete(car)}const count=ambientPopulation(cars);peak=Math.max(peak,count);totals.maxPopulation=Math.max(totals.maxPopulation,count);
  // Recycle only offscreen ambient entities; mission, owned and driven cars
  // have lifetime rules outside this ambient manager.
  for(const [car,s]of states){if(!eligible(car)||protectedCar(car))continue;const focus=context.focus,tooFar=focus&&dist(car,focus)>3500;if(s.stuck>38||car.health<=0||tooFar){const wasBlocked=s.stuck>38;if(car.health<=0){if(offscreen(car,220)){release(s);states.delete(car);cars.splice(cars.indexOf(car),1);totals.recycled++}}else if(relocate(s,cars))totals.blockedRecoveries+=Number(wasBlocked)}}
  let ordinary=ambientPopulation(cars);if(ordinary>cap){for(let i=cars.length-1;i>=0&&ordinary>cap;i--){const car=cars[i];if(eligible(car)&&!protectedCar(car)&&offscreen(car,220)){const s=states.get(car);if(s)release(s);states.delete(car);cars.splice(i,1);ordinary--}}}
  if(ordinary<cap&&templates.length&&options.replenish!==false){let add=Math.min(2,cap-ordinary);while(add-->0){const template=templates[sequence%templates.length],car={...template,id:'traffic-roam-'+(++sequence),ai:true,targetSpeed:template.baseSpeed,speed:0,health:100,parked:false},s={car,seed:hash(car.id)};const spawn=findSpawn(s,cars);if(!spawn)break;Object.assign(car,spawn.p);cars.push(car);restore(car,cars);totals.spawned++}}
 }
 function update(delta,ctx={}){const dt=clamp(finite(delta),0,.1);if(!dt)return;context=ctx;clock=finite(ctx.clock,clock+dt);const cars=ctx.cars||lastCars;lastCars=cars;if(!Array.isArray(cars))return;
  for(const car of cars)if(eligible(car)&&!states.has(car))restore(car,cars,ctx);
  refreshBlockedRoads(cars);const query=grid(cars,100),peds=grid(ctx.pedestrians||[],100);for(const [node,car]of owners)if(!cars.includes(car)||!eligible(car))owners.delete(node);
  const active=cars.filter(eligible).sort((a,b)=>{const sa=state(a),sb=state(b);return finite(sb?.wait)-finite(sa?.wait)||String(a.id).localeCompare(String(b.id))});
  for(const car of active){const s=state(car);if(!s)continue;if(car.health<=0){car.speed=0;continue}tryRoadRecovery(s,cars,ctx.pedestrians);if(s.recovery){recoverStep(s,dt,cars,ctx.pedestrians);continue}let cruise=s.cruise;if(ctx.weather==='RAIN')cruise*=.78;else if(ctx.weather==='FOG'||ctx.weather==='MIST')cruise*=.65;let target=cruise,hardGap=Infinity;s.reason='cruising';
   const heading={x:Math.sin(car.angle),y:-Math.cos(car.angle)},near=query(car,180);for(const o of near){if(o===car)continue;const dx=o.x-car.x,dy=o.y-car.y,forward=dx*heading.x+dy*heading.y,side=Math.abs(dx*-heading.y+dy*heading.x);if(forward<=0||side>22)continue;
    // Opposite-direction traffic has its own 24px separated lane. On bends,
    // the junction reservation supplies the additional conflict protection.
    const sameHeading=heading.x*Math.sin(finite(o.angle))+heading.y*-Math.cos(finite(o.angle));if(o.ai&&sameHeading<-.5&&side>18)continue;
    const gap=forward-52;if(gap<hardGap)hardGap=gap;if(gap<150){target=Math.min(target,Math.sqrt(Math.max(0,2*185*gap)),Math.max(0,gap*1.7));s.reason='following'}
   }
   const closure=recoveryClosure(car,s);if(closure<Infinity){hardGap=Math.min(hardGap,closure);target=Math.min(target,Math.sqrt(2*185*closure));s.reason='recovery-yield'}
   const crossing=pedestrianLimit(car,peds(car,110),target);if(crossing.speed<target)s.reason='pedestrian';target=crossing.speed;hardGap=Math.min(hardGap,crossing.gap);
   for(const h of ctx.hazards||[])if(dist(car,h)<85){target=0;s.reason='hazard'}
   for(const cop of ctx.cops||[])if(finite(ctx.wanted)>0&&dist(car,cop)<125)target=Math.min(target,cruise*.48);
   if(!s.path){if(!s.next||blockedRoads.has(s.next.key))s.next=chooseNext(s);const remaining=s.edge.length-s.along,entryDistance=remaining-(stopOffset-extent),holder=owners.get(s.edge.b.id),blocked=boxBlocked(s,query);let allowed=holder===car;const reachesLine=hardGap>Math.max(2,entryDistance+2);if(allowed&&!reachesLine&&car.speed<2){owners.delete(s.edge.b.id);allowed=false;s.wait=0;}
    if(!allowed&&remaining<140){s.wait+=dt;const green=signal(s.edge)!=='red';if(!owners.has(s.edge.b.id)&&!blocked&&green&&reachesLine){owners.set(s.edge.b.id,car);allowed=true;s.arrived=clock}}
    if(!allowed){const gap=Math.max(0,entryDistance);target=Math.min(target,Math.sqrt(2*185*gap));hardGap=Math.min(hardGap,gap);if(remaining<150)s.reason=blocked?'exit-blocked':'junction'}
    // An occupied exit is never an excuse to enter and block the junction.
    if(!allowed&&blocked&&s.wait>8&&clock-finite(s.rerouteAt,-99)>5){const alternate=chooseNext(s,s.next);if(alternate){s.next=alternate;s.rerouteAt=clock}}
    if(remaining<90&&s.next&&s.next.dir!==s.edge.dir)target=Math.min(target,48);
    if(allowed&&clock-s.arrived>12&&remaining>5&&car.speed<1){owners.delete(s.edge.b.id);s.wait=0}
   }else if(s.path.turn)target=Math.min(target,48);
   const oldSpeed=finite(car.speed),accel=92,decel=205;car.speed=clamp(oldSpeed+clamp(target-oldSpeed,-decel*dt,accel*dt),0,s.cruise);let travel=Math.min(car.speed*dt,Math.max(0,hardGap));if(travel<car.speed*dt-.001)car.speed=travel/dt;
   let moved=0;while(travel>.0001){const step=Math.min(4,travel),before={x:car.x,y:car.y};if(!s.path&&s.along+step>=s.edge.length){const rest=s.edge.length-s.along;if(rest>.0001){const p=point(s.edge,s.edge.length);if(solid(p.x,p.y)||!isRoad(p.x,p.y)){car.speed=0;totals.invalidSteps++;break}Object.assign(car,p);moved+=rest;travel-=rest;s.along=s.edge.length}if(owners.get(s.edge.b.id)!==car){car.speed=0;break}if(!s.next){car.speed=0;break}s.path=turnPath(s.edge,s.next);s.pathAlong=0;if(s.path.turn){s.turns++;totals.turns++}continue}
    let p=nextPoint(s,step);if(solid(p.x,p.y)||!isRoad(p.x,p.y)){car.speed=0;totals.invalidSteps++;break}Object.assign(car,p);moved+=dist(before,car);travel-=step;
    if(s.path){s.pathAlong+=step;if(s.pathAlong>=s.path.length-.001){const completed=s.edge.b.id;s.edge=s.next;s.along=0;s.path=null;s.pathAlong=0;s.next=chooseNext(s);s.wait=0;s.visited.add(district(s.edge.a));s.releaseNode=completed}}
    else{s.along+=step;if(s.releaseNode!==undefined&&s.along>12){if(owners.get(s.releaseNode)===car)owners.delete(s.releaseNode);delete s.releaseNode}}
   }
   s.distance+=moved;totals.distance+=moved;s.stuck=moved<.1?s.stuck+dt:Math.max(0,s.stuck-dt*2);s.last={x:car.x,y:car.y};car.trackDist=s.distance;car.ring=district(car);car.trafficState=s.reason;car.trafficDistance=s.distance;car.trafficTrips=s.trips;car.trafficTurns=s.turns;
  }
  if(clock>=manageAt){manage(cars);manageAt=clock+2}
 }
 function diagnostics(){const rows=[...states.values()].filter(s=>eligible(s.car)).map(s=>({id:s.car.id,x:s.car.x,y:s.car.y,speed:s.car.speed,cruise:s.cruise,edge:s.edge.key,destination:s.destination?.id,next:s.next?.key||null,inJunction:!!s.path,recovering:!!s.recovery,distance:s.distance,trips:s.trips,turns:s.turns,stuck:s.stuck,wait:s.wait,reason:s.reason,visited:[...s.visited],protected:protectedCar(s.car),road:isRoad(s.car.x,s.car.y),solid:solid(s.car.x,s.car.y)}));return{version:1,cap,speedScale,laneOffset:lane,junctionStopOffset:stopOffset,nodes:nodes.length,edges:edges.length,clock,population:ambientPopulation(lastCars),managed:rows.length,peak,...totals,reservations:[...owners.keys()],reservationOwners:[...owners].map(([node,car])=>({node,id:car.id})),blockedRoads:[...blockedRoads.keys()],cars:rows}}
 return{bootstrap,restore,update,reset,diagnostics,signal,protectedCar};
}
global.GlowportAmbientTraffic=Object.freeze({create});if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportAmbientTraffic;
})(typeof window!=='undefined'?window:globalThis);
