/* Patrol driving and fair roadblock placement on the existing road graph.
 * World geometry, awareness, player handling and artwork remain caller-owned. */
(function(global){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=(n,f=0)=>Number.isFinite(n)?n:f,valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),point=p=>({x:p.x,y:p.y}),angle=(a,b)=>Math.atan2(b.x-a.x,-(b.y-a.y)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function create(options={}){
 const nav=typeof options.navigation==='function'?options.navigation():options.navigation;
 const roadXs=options.roadXs||[],roadYs=options.roadYs||[],states=new Map();
 const totals={updates:0,distance:0,replans:0,turns:0,dismounts:0,blocked:0,roadblocks:0,invalidSteps:0};
 const solid=(p,r=19)=>!valid(p)||!!options.solid?.(p.x,p.y,r);
 const isRoad=p=>valid(p)&&(options.isRoad?options.isRoad(p.x,p.y,19):nav?.isRoad?.(p.x,p.y,19))===true;
 const safe=p=>!solid(p)&&isRoad(p);
 function visible(p,c={},pad=90){const camera=c.camera;if(valid(camera))return p.x>=camera.x-pad&&p.x<=camera.x+finite(c.width,800)+pad&&p.y>=camera.y-pad&&p.y<=camera.y+finite(c.height,450)+pad;return options.inView?options.inView(p,pad):true}
 function clear(a,b,r=19){if(options.clearLine&&!options.clearLine(a,b,r))return false;const steps=Math.max(1,Math.ceil(dist(a,b)/3));for(let i=0;i<=steps;i++)if(!safe({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps}))return false;return true}
 function obstacles(context,cop){return [...(context.cars||[]),...(context.officers||[])].filter(o=>o!==cop&&o!==context.playerCar&&valid(o)&&!o.foot&&(o.health===undefined||o.health>0)&&Math.abs(finite(o.driveSpeed,finite(o.speed)))<3&&!o.ai)}
 function segmentBlocked(a,b,list,pad=25){const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy||1;return list.some(o=>{const t=clamp(((o.x-a.x)*dx+(o.y-a.y)*dy)/length2,0,1);return Math.hypot(o.x-a.x-dx*t,o.y-a.y-dy*t)<pad})}
 function centerRoute(from,to,context,cop){
  if(!nav?.nearest||!nav?.route)return null;
  const start=nav.nearest(from.x,from.y,{vehicle:true}),end=nav.nearest(to.x,to.y,{vehicle:true});if(!start||!end)return null;
  const parked=obstacles(context,cop),nodes=nav.nodes,edges=nav.edges;
  if(!parked.length||!Array.isArray(nodes)||!Array.isArray(edges))return nav.route(from,to,{vehicle:true});
  if(start.edge?.id===end.edge?.id&&!segmentBlocked(start,end,parked))return[point(start),point(end)];
  const costs=new Float64Array(nodes.length).fill(Infinity),previous=new Int32Array(nodes.length).fill(-1),seen=new Uint8Array(nodes.length),blocked=edges.map(e=>segmentBlocked(nodes[e.a],nodes[e.b],parked));
  for(const id of[start.edge?.a,start.edge?.b])if(Number.isInteger(id)&&!segmentBlocked(start,nodes[id],parked)){costs[id]=dist(start,nodes[id]);}
  for(let turn=0;turn<nodes.length;turn++){
   let id=-1;for(let i=0;i<nodes.length;i++)if(!seen[i]&&Number.isFinite(costs[i])&&(id<0||costs[i]<costs[id]))id=i;if(id<0)break;seen[id]=1;
   for(const eid of nodes[id].edges){const e=edges[eid];if(e.vehicle===false||blocked[eid])continue;const next=e.a===id?e.b:e.a,value=costs[id]+e.length;if(value<costs[next]){costs[next]=value;previous[next]=id}}
  }
  let last=-1,best=Infinity;for(const id of[end.edge?.a,end.edge?.b])if(Number.isInteger(id)&&Number.isFinite(costs[id])&&!segmentBlocked(nodes[id],end,parked)){const score=costs[id]+dist(nodes[id],end);if(score<best){best=score;last=id}}
  if(last<0)return null;
  const ids=[];for(let id=last;id>=0;id=previous[id])ids.push(id);ids.reverse();return[point(start),...ids.map(id=>point(nodes[id])),point(end)];
 }
 function simplify(points){const clean=[];for(const p of points||[])if(valid(p)&&(!clean.length||dist(p,clean.at(-1))>.2))clean.push(point(p));for(let i=1;i<clean.length-1;){const a=clean[i-1],b=clean[i],c=clean[i+1],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),dot=(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y);if(Math.abs(cross)<.01&&dot>=0)clean.splice(i,1);else i++}return clean}
 function laneRoute(cop,centers,context,state){
  const path=simplify(centers);if(path.length<2)return null;
  const lines=path.slice(1).map((b,i)=>{const a=path[i],len=dist(a,b),dx=(b.x-a.x)/len,dy=(b.y-a.y)/len;return{a:{x:a.x-dy*12,y:a.y+dx*12},b:{x:b.x-dy*12,y:b.y+dx*12},dx,dy,len}});
  const out=[point(cop)],first=lines[0],old={x:Math.sin(finite(cop.angle)),y:-Math.cos(finite(cop.angle))};
  const add=(p,turn=false,recovery=false)=>{if(!out.length||dist(out.at(-1),p)>.01)out.push({...point(p),turn,recovery})};
  if(state.moved>10&&old.x*first.dx+old.y*first.dy<-.7){
   const center={x:cop.x+old.y*12,y:cop.y-old.x*12};
   for(let i=1;i<=24;i++){const t=i/24*Math.PI,p={x:center.x-old.y*12*Math.cos(t)+old.x*12*Math.sin(t),y:center.y+old.x*12*Math.cos(t)+old.y*12*Math.sin(t)};if(!safe(p)||(context.cars||[]).some(o=>o!==context.playerCar&&dist(o,p)<34))return null;add(p,true,true)}
  }
  const lead=Math.min(36,first.len*.35);add({x:first.a.x+first.dx*lead,y:first.a.y+first.dy*lead});
  for(let i=0;i<lines.length;i++){
   const incoming=lines[i],next=lines[i+1];if(!next){add(incoming.b);break}
   const den=incoming.dx*next.dy-incoming.dy*next.dx;if(Math.abs(den)<.1){add(incoming.b);add(next.a);continue}
   const delta={x:next.a.x-incoming.b.x,y:next.a.y-incoming.b.y},t=(delta.x*next.dy-delta.y*next.dx)/den,c={x:incoming.b.x+incoming.dx*t,y:incoming.b.y+incoming.dy*t},r=Math.min(8,incoming.len*.22,next.len*.22),enter={x:c.x-incoming.dx*r,y:c.y-incoming.dy*r},exit={x:c.x+next.dx*r,y:c.y+next.dy*r};
   add(enter,true);for(let k=1;k<=16;k++){const v=k/16,u=1-v;add({x:u*u*enter.x+2*u*v*c.x+v*v*exit.x,y:u*u*enter.y+2*u*v*c.y+v*v*exit.y},true)}
  }
  for(let i=1;i<out.length;i++)if(!clear(out[i-1],out[i]))return null;
  return out;
 }
 function plan(cop,state,target,context){totals.replans++;const route=centerRoute(cop,target,context,cop),points=route&&laneRoute(cop,route,context,state);state.planAt=finite(context.clock);state.goal=point(target);if(!points){state.failures++;state.retryAt=state.planAt+.7;return false}state.points=points;state.index=1;state.failures=0;state.retryAt=state.planAt+.75;state.routeLength=points.slice(1).reduce((sum,p,i)=>sum+dist(points[i],p),0);cop._patrolState='pursuit';return true}
 function remaining(cop,state){let length=0,a=cop;for(let i=state.index;i<state.points.length;i++){length+=dist(a,state.points[i]);a=state.points[i]}return length}
 function footExit(cop,state,context){
  if(!context.force&&(context.playerInCar||state.speed>22||dist(cop,context.target)>185))return false;
  state.exitWait+=finite(context.dt);if(state.exitWait<.35)return false;
  cop._patrolParked={x:cop.x,y:cop.y,angle:cop.angle,kind:'police',color:'#c2c9cc'};
  const side={x:Math.cos(cop.angle)*25,y:Math.sin(cop.angle)*25},candidates=[{x:cop.x+side.x,y:cop.y+side.y},{x:cop.x-side.x,y:cop.y-side.y},point(cop)];
  const exit=candidates.find(p=>!solid(p,8)&&!(context.cars||[]).some(car=>valid(car)&&dist(car,p)<27)&&!(context.pedestrians||[]).some(n=>valid(n)&&dist(n,p)<16));if(!exit)return false;
  // The officer steps out; the parked patrol remains available to the renderer.
  cop.x=exit.x;cop.y=exit.y;cop.state='foot';cop.foot=true;cop.driveSpeed=0;cop.reload=Math.max(1,finite(cop.reload));cop._patrolState='on-foot';delete cop.route;delete cop.routeGoal;delete cop.repathAt;totals.dismounts++;return true;
 }
 function update(cop,delta,context={}){
  if(!cop||cop.foot||cop.state==='foot'||cop.hp<=0)return{handled:false};const dt=clamp(finite(delta),0,.1),clock=finite(context.clock);if(!dt||!valid(context.target))return{handled:true,moved:0};totals.updates++;
  for(const[actor,s]of states)if(clock-s.updatedAt>12)states.delete(actor);
  let state=states.get(cop);if(!state){state={points:[],index:1,speed:clamp(finite(cop.driveSpeed),0,150),planAt:-99,retryAt:-99,goal:null,blocked:0,moved:0,turns:0,failures:0,exitWait:0,updatedAt:clock};states.set(cop,state)}state.updatedAt=clock;
  if(cop.health!==undefined&&cop.health<=0){state.speed=0;cop.driveSpeed=0;const dismounted=footExit(cop,state,{...context,dt,force:true});return{handled:true,moved:0,dismounted,speed:0,blocked:state.blocked,road:safe(cop),target:point(context.target)}}
  const target=context.target,needs=!state.points.length||!state.goal||dist(state.goal,target)>85||state.blocked>2;
  if(needs&&clock>=state.retryAt){const prior=state.points;state.points=[];if(!plan(cop,state,target,context)&&prior.length){state.points=prior;state.index=Math.min(state.index,prior.length)}}
  while(state.index<state.points.length&&dist(cop,state.points[state.index])<.1)state.index++;
  let cruise=clamp(finite(cop.speed,120)+12,104,144),desired=cruise,hard=Infinity;const left=remaining(cop,state),endpointGap=context.playerInCar&&context.mode==='pursuit'?52:10;
  desired=Math.min(desired,Math.sqrt(2*180*Math.max(0,left-endpointGap)));
  let ahead=0,a=cop;for(let i=state.index;i<state.points.length&&ahead<75;i++){ahead+=dist(a,state.points[i]);if(ahead<75&&state.points[i].turn){desired=Math.min(desired,54);break}a=state.points[i]}
  if(!context.playerInCar&&dist(cop,target)<175)desired=Math.min(desired,Math.sqrt(2*180*Math.max(0,dist(cop,target)-90)));
  const goal=state.points[state.index],heading=goal&&dist(cop,goal)>.01?{x:(goal.x-cop.x)/dist(cop,goal),y:(goal.y-cop.y)/dist(cop,goal)}:{x:Math.sin(cop.angle||0),y:-Math.cos(cop.angle||0)};
  for(const car of[...(context.cars||[]),...(context.officers||[])]){if(car===cop||!valid(car)||car.foot||state.points[state.index]?.recovery)continue;const dx=car.x-cop.x,dy=car.y-cop.y,forward=dx*heading.x+dy*heading.y,side=Math.abs(dx*-heading.y+dy*heading.x);if(forward>0&&forward<140&&side<21){const gap=Math.max(0,forward-52);hard=Math.min(hard,gap);desired=Math.min(desired,Math.sqrt(2*190*gap))}}
  for(const n of context.pedestrians||[]){if(!valid(n))continue;const dx=n.x-cop.x,dy=n.y-cop.y,forward=dx*heading.x+dy*heading.y,side=Math.abs(dx*-heading.y+dy*heading.x);if(forward>0&&forward<90&&side<20){const gap=Math.max(0,forward-29);hard=Math.min(hard,gap);desired=Math.min(desired,Math.sqrt(2*190*gap))}}
  state.speed=clamp(state.speed+clamp(desired-state.speed,-210*dt,96*dt),0,144);let travel=Math.min(state.speed*dt,hard),moved=0;const start=point(cop);let lastAngle=cop.angle;
  while(travel>.0001&&state.index<state.points.length){const next=state.points[state.index],distance=dist(cop,next);if(distance<.001){state.index++;continue}const step=Math.min(3,travel,distance),nx=cop.x+(next.x-cop.x)/distance*step,ny=cop.y+(next.y-cop.y)/distance*step,p={x:nx,y:ny};
   let clearMove=safe(p);for(const car of[...(context.cars||[]),...(context.officers||[])])if(car!==cop&&valid(car)&&!car.foot&&dist(car,p)<23.5&&dist(car,p)<dist(car,cop)-.01)clearMove=false;for(const n of context.pedestrians||[])if(valid(n)&&dist(n,p)<27&&dist(n,p)<dist(n,cop)-.01)clearMove=false;
   if(!clearMove){if(!safe(p))totals.invalidSteps++;state.speed=0;break}lastAngle=angle(cop,p);cop.x=nx;cop.y=ny;travel-=step;moved+=step;if(distance<=step+.001){if(next.turn&&(!state.points[state.index-1]?.turn)){state.turns++;totals.turns++}state.index++}
  }
  if(moved){cop.angle=finite(cop.angle)+wrap(lastAngle-finite(cop.angle))*Math.min(1,dt*10);state.moved+=moved;totals.distance+=moved;state.blocked=Math.max(0,state.blocked-dt*2)}else if(left>endpointGap+5){state.blocked+=dt;if(state.blocked>2){totals.blocked++;cop._patrolState='rerouting'}}else{state.blocked=0;cop._patrolState=context.mode==='search'?'searching':'holding'}
  if(!moved&&state.speed>0)state.speed=0;cop.driveSpeed=state.speed;
  const dismounted=footExit(cop,state,{...context,dt});if(!dismounted&&dist(cop,target)>185)state.exitWait=0;
  return{handled:true,moved,dismounted,speed:state.speed,blocked:state.blocked,road:safe(cop),target:point(target)};
 }
 function suggestRoadblock(context={}){
  const pursuit=context.visible===true&&context.mode==='pursuit',reference=pursuit?context.focus:context.lastKnown;if(!valid(reference)||!valid(context.camera)||!nav?.nearest)return null;
  const heading=pursuit&&Number.isFinite(reference.angle)?reference.angle:Math.floor(finite(context.clock)/20)%4*Math.PI/2,dx=Math.sin(heading),dy=-Math.cos(heading),protectedPoints=[...(options.landmarks||[]),...(context.landmarks||[]),...(context.protectedPoints||[])].filter(valid),occupied=[...(context.cars||[]),...(context.officers||[])].filter(valid);
  const candidates=[];for(const distance of[560,740,920,1120])for(const side of[0,-180,180]){const desired={x:reference.x+dx*distance+dy*side,y:reference.y+dy*distance-dx*side},near=nav.nearest(desired.x,desired.y,{vehicle:true});if(!near)continue;const p=point(near);if(!safe(p)||visible(p,context,95)||dist(p,reference)<370||protectedPoints.some(q=>dist(p,q)<150)||occupied.some(q=>dist(p,q)<100))continue;
   const atIntersection=roadXs.some(x=>Math.abs(x-p.x)<85)&&roadYs.some(y=>Math.abs(y-p.y)<85);if(atIntersection)continue;
   const seg=near.segment||near.edge?.segment,ax=seg?seg.b.x-seg.a.x:dx,ay=seg?seg.b.y-seg.a.y:dy,orientation=Math.abs(ax)>Math.abs(ay)?0:Math.PI/2;
   candidates.push({...p,angle:orientation,score:dist(p,desired)+distance*.1+Math.abs(side)*.15,source:pursuit?'observed-route':'last-known-cordon'});
  }
  candidates.sort((a,b)=>a.score-b.score||a.x-b.x||a.y-b.y);const best=candidates[0];if(!best)return null;totals.roadblocks++;const{x,y,angle:direction,source}=best;return{x,y,angle:direction,source};
 }
 function diagnostics(){return{...totals,tracked:states.size,maximumPatrolSpeed:144,officers:[...states].map(([cop,s])=>({x:cop.x,y:cop.y,foot:!!cop.foot,speed:s.speed,moved:s.moved,turns:s.turns,blocked:s.blocked,failures:s.failures,state:cop._patrolState,routePoints:s.points.length,index:s.index}))}}
 function reset(){states.clear();for(const key of Object.keys(totals))totals[key]=0}
 return{update,suggestRoadblock,diagnostics,reset};
}
global.GlowportPursuit=Object.freeze({create});if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportPursuit;
})(typeof window!=='undefined'?window:globalThis);
