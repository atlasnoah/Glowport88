/* Ambient citizens use the existing painted crossings and sidewalks. No map,
 * mission actor, rendering or input data is generated or changed here. */
(function(global){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),point=p=>({x:p.x,y:p.y}),finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
function create(options={}){
 const {roadXs=[],roadYs=[],STREET=66,MW=7200,MH=5040,landmarks=[],solid=()=>false,clearLine=(a,b)=>!solid(a.x,a.y,9)&&!solid(b.x,b.y,9),districtFor=()=>({id:'core'}),visible=()=>false}=options;
 const offset=STREET/2+10,cap=clamp(Math.floor(options.cap||170),20,220),nodes=[],edges=[],corners=new Map(),trees=new Map(),routeCacheLimit=clamp(Math.floor(options.routeCacheLimit||128),24,256);let treeBuilds=0,treeHits=0,routeFailures=0,recoveries=0,rebalanced=0,maxPopulation=0,nextPopulation=0,obstaclesAt=-Infinity,obstacleStamp='';const blockedEdges=new Set();let parkedObstacles=[];
 const protectedNpc=n=>!n||n.mission||n.missionId||n.quest||n.scripted||n.persistent||n.storyActor||n._mission||n._missionActor||n._encounterScene;
 const forbidden=p=>landmarks.some(l=>dist(p,l)<38);
 function node(x,y){const id=nodes.length;nodes.push({id,x,y,edges:[]});return id}
 function edge(a,b,crossing=false){if(!clearLine(nodes[a],nodes[b],9))return;const e={id:edges.length,a,b,crossing,length:dist(nodes[a],nodes[b])};edges.push(e);nodes[a].edges.push(e.id);nodes[b].edges.push(e.id)}
 for(let ix=0;ix<roadXs.length;ix++)for(let iy=0;iy<roadYs.length;iy++)for(const sx of[-1,1])for(const sy of[-1,1]){const x=roadXs[ix]+sx*offset,y=roadYs[iy]+sy*offset;if(!solid(x,y,9))corners.set([ix,iy,sx,sy].join(':'),node(x,y))}
 const corner=(i,j,s,t)=>corners.get([i,j,s,t].join(':'));
 function connect(a,b,crossing){if(a!==undefined&&b!==undefined)edge(a,b,crossing)}
 for(let i=0;i<roadXs.length;i++)for(let j=0;j<roadYs.length;j++){
  for(const s of[-1,1]){connect(corner(i,j,-1,s),corner(i,j,1,s),true);connect(corner(i,j,s,-1),corner(i,j,s,1),true);if(i+1<roadXs.length)connect(corner(i,j,1,s),corner(i+1,j,-1,s),false);if(j+1<roadYs.length)connect(corner(i,j,s,1),corner(i,j+1,s,-1),false)}
 }
 const edgeCells=new Map(),cellSize=350;
 for(const e of edges){const a=nodes[e.a],b=nodes[e.b];for(let x=Math.floor(Math.min(a.x,b.x)/cellSize);x<=Math.floor(Math.max(a.x,b.x)/cellSize);x++)for(let y=Math.floor(Math.min(a.y,b.y)/cellSize);y<=Math.floor(Math.max(a.y,b.y)/cellSize);y++){const key=x+':'+y;if(!edgeCells.has(key))edgeCells.set(key,[]);edgeCells.get(key).push(e)}}
 function project(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return{x:a.x+dx*t,y:a.y+dy*t}}
 function onCrosswalk(p){return roadXs.some(x=>Math.abs(Math.abs(p.x-x)-offset)<8&&roadYs.some(y=>Math.abs(p.y-y)<=offset+1))||roadYs.some(y=>Math.abs(Math.abs(p.y-y)-offset)<8&&roadXs.some(x=>Math.abs(p.x-x)<=offset+1))}
 function onRoad(p){return roadXs.some(x=>Math.abs(p.x-x)<STREET/2-1)||roadYs.some(y=>Math.abs(p.y-y)<STREET/2-1)}
 function connector(a,b){if(!clearLine(a,b,9))return false;const len=dist(a,b),steps=Math.max(1,Math.ceil(len/8));for(let k=0;k<=steps;k++){const p={x:a.x+(b.x-a.x)*k/steps,y:a.y+(b.y-a.y)*k/steps};if(onRoad(p)&&!onCrosswalk(p))return false}return true}
 function nearest(p,{sidewalkOnly=false,connect=true}={}){
  if(!finite(p))return null;let best=null;const cx=Math.floor(p.x/cellSize),cy=Math.floor(p.y/cellSize),seen=new Set();
  for(let radius=0;radius<4;radius++){for(let x=cx-radius;x<=cx+radius;x++)for(let y=cy-radius;y<=cy+radius;y++){if(radius&&Math.abs(x-cx)!==radius&&Math.abs(y-cy)!==radius)continue;for(const e of edgeCells.get(x+':'+y)||[]){if(seen.has(e.id)||sidewalkOnly&&e.crossing)continue;seen.add(e.id);const q=project(p,nodes[e.a],nodes[e.b]),distance=dist(p,q);if((!best||distance<best.d)&&(!connect||connector(p,q)))best={...q,e,d:distance}}}if(best&&best.d<Math.max(1,radius*cellSize-100))break}
  return best;
 }
 function obstacleClear(a,b){return !parkedObstacles.some(c=>dist(c,project(c,a,b))<27)}
 function refreshObstacles(cars,clock){if(clock<obstaclesAt+1&&clock>=obstaclesAt)return;obstaclesAt=clock;parkedObstacles=(cars||[]).filter(c=>finite(c)&&!c.ai&&Math.abs(c.speed||0)<8);const stamp=parkedObstacles.map(c=>Math.round(c.x/4)+':'+Math.round(c.y/4)).join('|');if(stamp===obstacleStamp)return;obstacleStamp=stamp;blockedEdges.clear();for(const c of parkedObstacles){const cx=Math.floor(c.x/cellSize),cy=Math.floor(c.y/cellSize);for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(const e of edgeCells.get(x+':'+y)||[])if(dist(c,project(c,nodes[e.a],nodes[e.b]))<27)blockedEdges.add(e.id)}trees.clear()}
 function heapPush(heap,value){heap.push(value);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=value[0])break;heap[i]=heap[p];i=p}heap[i]=value}
 function heapPop(heap){const first=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let n=i*2+1;if(n+1<heap.length&&heap[n+1][0]<heap[n][0])n++;if(heap[n][0]>=tail[0])break;heap[i]=heap[n];i=n}heap[i]=tail}return first}
 function tree(start){if(trees.has(start)){treeHits++;const old=trees.get(start);trees.delete(start);trees.set(start,old);return old}treeBuilds++;const costs=new Float64Array(nodes.length).fill(Infinity),previous=new Int32Array(nodes.length).fill(-1),via=new Int32Array(nodes.length).fill(-1),heap=[];costs[start]=0;heapPush(heap,[0,start]);while(heap.length){const[cost,id]=heapPop(heap);if(cost!==costs[id])continue;for(const eid of nodes[id].edges){if(blockedEdges.has(eid))continue;const e=edges[eid],other=e.a===id?e.b:e.a,next=cost+e.length+(e.crossing?16:0);if(next<costs[other]){costs[other]=next;previous[other]=id;via[other]=eid;heapPush(heap,[next,other])}}}const result={costs,previous,via};trees.set(start,result);if(trees.size>routeCacheLimit)trees.delete(trees.keys().next().value);return result}
 function sameSideCurb(from,to){for(const center of roadXs)if((from.x-center)*(to.x-center)<-.01)return false;for(const center of roadYs)if((from.y-center)*(to.y-center)<-.01)return false;return true}
 function pavementError(p){let error=Infinity;for(const x of roadXs)error=Math.min(error,Math.abs(Math.abs(p.x-x)-offset));for(const y of roadYs)error=Math.min(error,Math.abs(Math.abs(p.y-y)-offset));return error}
 function route(from,to){
  if(!finite(from)||!finite(to)||solid(from.x,from.y,9)||solid(to.x,to.y,9))return[];
  const a=nearest(from),b=nearest(to);if(!a||!b){if(!a){const curb=nearest(from,{sidewalkOnly:true,connect:false});if(curb&&curb.d>.01&&curb.d<=offset&&sameSideCurb(from,curb)&&clearLine(from,curb,9)){const tail=route(curb,to);if(tail.length)return[point(from),...tail]}}routeFailures++;return[]}
  if(a.e.id===b.e.id&&connector(a,b)&&obstacleClear(a,b)){const out=[point(from),{...point(a),crossing:a.e.crossing},{...point(b),crossing:a.e.crossing},point(to)];return out.filter((p,i)=>!i||dist(p,out[i-1])>.1)}
  let best=null;for(const start of[a.e.a,a.e.b]){if(!obstacleClear(a,nodes[start]))continue;const t=tree(start);for(const end of[b.e.a,b.e.b]){if(!obstacleClear(b,nodes[end]))continue;const cost=dist(a,nodes[start])+t.costs[end]+dist(b,nodes[end]);if(Number.isFinite(cost)&&(!best||cost<best.cost))best={start,end,t,cost}}}if(!best){routeFailures++;return[]}
  const ids=[];for(let id=best.end;id>=0;id=best.t.previous[id])ids.push(id);ids.reverse();const out=[point(from),{...point(a),crossing:a.e.crossing}];for(let k=0;k<ids.length;k++){const incoming=k?edges[best.t.via[ids[k]]]:a.e;out.push({...point(nodes[ids[k]]),crossing:incoming.crossing})}out.push({...point(b),crossing:b.e.crossing},point(to));return out.filter((p,i)=>!i||dist(p,out[i-1])>.1);
 }
 function setDestination(n,to){if(protectedNpc(n)||!finite(to))return false;const sameGoal=finite(n.goal)&&dist(n.goal,to)<3;n.goal=point(to);n.waypoints=route(n,to);n._ambientRouteFailures=n.waypoints.length?0:(n._ambientRouteFailures||0)+1;n.waypoint=0;n.stuckTime=0;n._ambientCrossing=false;n._ambientWaitingCrossing=false;if(!sameGoal){n._ambientAnchor={x:n.x,y:n.y};n._ambientAnchorTime=undefined;n._ambientNoProgress=0}return n.waypoints.length>0}
 function safePoint(p){const q=nearest(p,{sidewalkOnly:true,connect:false});if(!q)return null;const a=nodes[q.e.a],b=nodes[q.e.b],length=dist(a,b)||1,candidates=[point(q),...[-58,58,-94,94].map(delta=>({x:clamp(q.x+(b.x-a.x)/length*delta,Math.min(a.x,b.x),Math.max(a.x,b.x)),y:clamp(q.y+(b.y-a.y)/length*delta,Math.min(a.y,b.y),Math.max(a.y,b.y))})),a,b];return candidates.find(v=>!solid(v.x,v.y,10)&&!forbidden(v))?point(candidates.find(v=>!solid(v.x,v.y,10)&&!forbidden(v))):null}
 function reset(){trees.clear();treeBuilds=0;treeHits=0;parkedObstacles=[];blockedEdges.clear();obstaclesAt=-Infinity;obstacleStamp='';routeFailures=0;recoveries=0;rebalanced=0;maxPopulation=0;nextPopulation=0}
 function bootstrap(npcs,context={}){reset();if(!Array.isArray(npcs))return;const placed=[],focus=context.focus;
  for(const n of npcs){if(protectedNpc(n)){placed.push(n);continue}let p=safePoint(n);if(!p)continue;for(let trial=0;trial<20&&placed.some(o=>dist(o,p)<23);trial++){const edge=edges[((Number(n.id)||0)*977+trial*613)%edges.length];if(!edge||edge.crossing)continue;const a=nodes[edge.a],b=nodes[edge.b],candidate={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(!forbidden(candidate)&&!solid(candidate.x,candidate.y,10))p=candidate}n.x=p.x;n.y=p.y;n.home=safePoint(n.home)||point(p);n.homeX=n.home.x;n.homeY=n.home.y;n.work=safePoint(n.work)||point(p);n.leisure=safePoint(n.leisure)||point(p);n._ambientAnchorTime=Number(context.clock)||0;for(const key of['_ambientTrips','_ambientDistance','_ambientCrossings','_ambientRecoveries'])n[key]=0;setDestination(n,n.phase==='home'?n.home:n.phase==='work'?n.work:n.leisure);placed.push(n)}
  // The old initializer clustered 44 people around every start. Spread only
  // excess initial ambient citizens before the first playable frame.
  if(finite(focus)){const type=options.classify?.(focus.x,focus.y,districtFor(focus.x,focus.y)?.id),district=districtFor(focus.x,focus.y)?.id||'core',target=type==='industrial'||district==='east'?7:type==='residential'||district==='north'?10:district==='core'?22:14;let local=0;for(const n of npcs){if(protectedNpc(n)||dist(n,focus)>=720)continue;if(++local<=target)continue;for(let trial=0;trial<40;trial++){const e=edges[((Number(n.id)||0)*2377+trial*661)%edges.length];if(e.crossing)continue;const a=nodes[e.a],b=nodes[e.b],candidate={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(dist(candidate,focus)<850||forbidden(candidate)||npcs.some(o=>o!==n&&dist(o,candidate)<25))continue;n.x=candidate.x;n.y=candidate.y;n.home=point(candidate);n.homeX=n.x;n.homeY=n.y;setDestination(n,n.phase==='home'?n.home:n.phase==='work'?n.work:n.leisure);break}}}
  maxPopulation=npcs.length;
 }
 function destination(n,spread=850){const center=n.phase==='work'?n.work:n.phase==='home'?n.home:n.leisure,origin=finite(center)?center:n,seed=((Number(n.id)||0)*1103515245+Math.floor(n._ambientTrips||0)*12345+Math.floor(n._ambientRecoveries||0)*7649+Math.floor(n._ambientRouteFailures||0)*8191)>>>0;let best=null;
  for(let i=0;i<16;i++){const e=edges[(seed+i*7919)%Math.max(1,edges.length)];if(!e||e.crossing)continue;const a=nodes[e.a],b=nodes[e.b],t=.2+((seed+i*31)%60)/100,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},distance=dist(origin,p);if(distance>spread||dist(n,p)<90||forbidden(p)||!obstacleClear(p,p))continue;if(!best||distance<best.d)best={...p,d:distance}}
  if(best)return point(best);const local=nearest(n,{sidewalkOnly:true,connect:false});if(local){const e=local.e,a=nodes[e.a],b=nodes[e.b];return point(dist(n,a)>dist(n,b)?a:b)}return finite(center)?point(center):point(n);
 }
 function vehicleThreat(n,target,cars){const a=point(n),b=target,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;for(const c of cars||[]){const speed=Math.abs(c.speed||0);if(speed<8||!finite(c)||dist(c,n)>260)continue;const fx=Math.sin(c.angle||0)*(c.speed<0?-1:1),fy=-Math.cos(c.angle||0)*(c.speed<0?-1:1),ahead=speed*2.8+32,end={x:c.x+fx*ahead,y:c.y+fy*ahead};const q=project(c,a,b),r=project(q,c,end);if(dist(q,r)<25&&(q.x-c.x)*fx+(q.y-c.y)*fy>-18)return true}return false}
 function move(n,dx,dy){if(options.moveCircle)return !!options.moveCircle(n,dx,dy,9);let blocked=false;const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4));for(let i=0;i<steps;i++){if(!solid(n.x+dx/steps,n.y,9))n.x+=dx/steps;else blocked=true;if(!solid(n.x,n.y+dy/steps,9))n.y+=dy/steps;else blocked=true}return blocked}
 function step(n,dt,context={}){
  if(protectedNpc(n))return false;dt=clamp(Number(dt)||0,0,.1);const clock=Number(context.clock)||0;refreshObstacles(context.cars,clock);maxPopulation=Math.max(maxPopulation,Number(context.population)||0);n._ambientDistance=Number(n._ambientDistance)||0;n._ambientTrips=Number(n._ambientTrips)||0;n._ambientCrossings=Number(n._ambientCrossings)||0;
  if(n.panic>0&&finite(context.focus)&&clock>=(n._ambientPanicRouteAt||0)){n._ambientPanicRouteAt=clock+1;const away={x:clamp(n.x+(n.x-context.focus.x)*3,60,MW-60),y:clamp(n.y+(n.y-context.focus.y)*3,60,MH-60)},goal=safePoint(away);if(goal)setDestination(n,goal)}
  if(!Array.isArray(n.waypoints))n.waypoints=[];if(!Number.isFinite(n.waypoint))n.waypoint=0;
  while(n.waypoint<n.waypoints.length&&dist(n,n.waypoints[n.waypoint])<1){if(n.waypoints[n.waypoint].crossing)n._ambientCrossings++;n.waypoint++}
  if(n.waypoint>=n.waypoints.length){n._ambientCrossing=false;n._ambientWaitingCrossing=false;if(n._ambientHadRoute){n._ambientTrips++;n._ambientHadRoute=false;n.dwell=2+(Number(n.id)||0)%7}n.dwell=(Number(n.dwell)||0)-dt;if(n.dwell<=0){n.dwell=2+(Number(n.id)||0)%7;setDestination(n,destination(n));}return true}
  if(!obstacleClear(n,n.waypoints[n.waypoint])){n._ambientRecoveries=(n._ambientRecoveries||0)+1;recoveries++;const goal=n.goal;setDestination(n,goal);if(!n.waypoints.length){n.dwell=.5;return true}while(n.waypoint<n.waypoints.length&&dist(n,n.waypoints[n.waypoint])<1)n.waypoint++;if(n.waypoint>=n.waypoints.length)return true}n._ambientHadRoute=true;const target=n.waypoints[n.waypoint],distance=dist(n,target);if(!distance)return true;
  if(target.crossing){if(!n._ambientCrossing&&vehicleThreat(n,target,context.cars)){n._ambientWaitingCrossing=true;n.stuckTime=0;return true}n._ambientWaitingCrossing=false;n._ambientCrossing=true}else{n._ambientCrossing=false;n._ambientWaitingCrossing=false}
  let vx=(target.x-n.x)/distance,vy=(target.y-n.y)/distance,scale=clamp(Number(context.speedMultiplier)||1,.2,2),speed=clamp(Number(n.speed)||36,20,60)*scale*(n.panic>0?1.7:1),wait=false;
  // Passing corrections stay small; do not steer citizens off the graph into
  // walls or apply reciprocal repulsion that cancels both walkers' velocity.
  for(const other of context.peers||[]){if(other===n||protectedNpc(other)||!finite(other))continue;const dx=other.x-n.x,dy=other.y-n.y,forward=dx*vx+dy*vy,side=dx*-vy+dy*vx;if(forward<=0||forward>25||Math.abs(side)>13)continue;if(forward<13&&(Number(other.id)||0)<(Number(n.id)||0)){wait=true;break}const sign=(Number(n.id)||0)<(Number(other.id)||0)?1:-1,q={x:n.x-vy*sign*5,y:n.y+vx*sign*5};if(!n._ambientCrossing&&!solid(q.x,q.y,9)){vx=(target.x-q.x)/Math.max(1,dist(q,target))-vy*sign*.35;vy=(target.y-q.y)/Math.max(1,dist(q,target))+vx*sign*.35;const mag=Math.hypot(vx,vy)||1;vx/=mag;vy/=mag}}
  const before=point(n),amount=Math.min(distance,speed*dt);let blocked=false;
  // Peer passing must stay on the original pavement/crosswalk band. The former
  // constant lateral bias could drift a walker into an asphalt lane, where its
  // next schedule connector failed forever. A displaced citizen may walk back
  // toward the same-side curb; no position is snapped or teleported.
  const proposed={x:n.x+vx*amount,y:n.y+vy*amount},currentError=pavementError(n),nextError=pavementError(proposed);
  if(nextError>7&&nextError>currentError+.001){vx=(target.x-n.x)/distance;vy=(target.y-n.y)/distance}
  if(!wait)blocked=move(n,vx*amount,vy*amount);const moved=dist(before,n);n._ambientDistance+=moved;n.step=(Number(n.step)||0)+(moved>0?dt*7:0);n.face=Math.abs(vx)>Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');n.angle=Math.atan2(vy,vx);
  n.stuckTime=moved<.12?(Number(n.stuckTime)||0)+dt:Math.max(0,(Number(n.stuckTime)||0)-dt*.8);n._ambientNoProgress=moved<.12?(Number(n._ambientNoProgress)||0)+dt:Math.max(0,(Number(n._ambientNoProgress)||0)-dt*.8);
  if(!n._ambientAnchor||!Number.isFinite(n._ambientAnchorTime)||dist(n,n._ambientAnchor)>22){n._ambientAnchor=point(n);n._ambientAnchorTime=clock}
  const stalled=clock-n._ambientAnchorTime>6;
  if((n.stuckTime>2.2||n._ambientNoProgress>2.2||stalled)&&clock>=(n._ambientRetryAt||0)){n._ambientRetryAt=clock+2;n._ambientRecoveries=(n._ambientRecoveries||0)+1;recoveries++;const goal=destination(n,600);setDestination(n,goal);n._ambientAnchorTime=clock}
  if(blocked&&n.stuckTime>.4&&n.waypoint>0){const previous=n.waypoints[n.waypoint-1];if(connector(n,previous)&&dist(n,previous)>12){n.waypoints=[point(n),point(previous),...n.waypoints.slice(n.waypoint)];n.waypoint=1}}
  return true;
 }
 function maintain(npcs,context={}){
  if(!Array.isArray(npcs))return;const clock=Number(context.clock)||0;refreshObstacles(context.cars,clock);maxPopulation=Math.max(maxPopulation,npcs.length);if(clock<nextPopulation)return;nextPopulation=clock+5;
  // Existing citizens are reused off camera, rather than an unbounded spawner.
  for(let i=npcs.length-1;i>=0&&npcs.length>cap;i--)if(!protectedNpc(npcs[i])&&!visible(npcs[i],context)){npcs.splice(i,1)}
  const focus=context.focus;if(!finite(focus)||!nodes.length)return;const district=districtFor(focus.x,focus.y)?.id||'core',type=options.classify?.(focus.x,focus.y,district),target=type==='industrial'||district==='east'?7:type==='residential'||district==='north'?10:district==='core'?22:14,local=npcs.filter(n=>!protectedNpc(n)&&dist(n,focus)<720).length;
  if(local>=target)return;let count=0;for(const n of npcs){if(count>=Math.min(3,target-local))break;if(protectedNpc(n)||visible(n,context)||dist(n,focus)<1900||n.panic>0||clock<(n._ambientRelocatedAt||-100)+30)continue;
   const e=edges[((Number(n.id)||0)*1171+Math.floor(clock/5)*79)%edges.length];if(!e||e.crossing)continue;const a=nodes[e.a],b=nodes[e.b],p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(dist(p,focus)<580||dist(p,focus)>1100||visible(p,context)||forbidden(p)||npcs.some(o=>o!==n&&dist(o,p)<28))continue;
   n.x=p.x;n.y=p.y;n._ambientRelocatedAt=clock;n._ambientAnchorTime=clock;setDestination(n,destination(n,650));rebalanced++;count++;
  }
 }
 function diagnostics(npcs=[]){return{nodes:nodes.length,edges:edges.length,crosswalks:edges.filter(e=>e.crossing).length,routeCache:trees.size,routeCacheLimit,treeBuilds,treeHits,blockedEdges:blockedEdges.size,cap,maxPopulation,population:npcs.length,routeFailures,recoveries,rebalanced,moved:npcs.filter(n=>(n._ambientDistance||0)>30).length,trips:npcs.reduce((sum,n)=>sum+(n._ambientTrips||0),0),crossings:npcs.reduce((sum,n)=>sum+(n._ambientCrossings||0),0),entities:npcs.map(n=>({id:n.id,x:n.x,y:n.y,goal:n.goal,waypoint:n.waypoint,waypoints:n.waypoints?.length||0,moved:n._ambientDistance||0,trips:n._ambientTrips||0,crossings:n._ambientCrossings||0,recoveries:n._ambientRecoveries||0,crossing:!!n._ambientCrossing,waitingCrossing:!!n._ambientWaitingCrossing,protected:!!protectedNpc(n)}))}}
 return{route,setDestination,safePoint,destination,step,maintain,bootstrap,reset,diagnostics,protectedNpc,nodes,edges,onCrosswalk,onRoad,cap};
}
global.GlowportPedestrians=Object.freeze({create});if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportPedestrians;
})(typeof window!=='undefined'?window:globalThis);
