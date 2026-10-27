/* Navigation/collision adapter for the authentic pre-rebuild Glowport grid.
 * It indexes the recovered world; it never replaces or generates its parcels. */
(function(global){
'use strict';
const EPS=1e-7,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),point=p=>({x:p.x,y:p.y});
function bounds(a,b,pad=0){return{x:Math.min(a.x,b.x)-pad,y:Math.min(a.y,b.y)-pad,w:Math.abs(b.x-a.x)+pad*2,h:Math.abs(b.y-a.y)+pad*2}}
function project(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),x=a.x+dx*t,y=a.y+dy*t;return{x,y,t,d:Math.hypot(x-p.x,y-p.y)}}
function intersects(a,b,pad=0){return a.x<=b.x+b.w+pad&&a.x+a.w>=b.x-pad&&a.y<=b.y+b.h+pad&&a.y+a.h>=b.y-pad}
function lineRect(a,b,box,r=0){let lo=0,hi=1;const dx=b.x-a.x,dy=b.y-a.y;for(const[p,q]of[[-dx,a.x-box.x+r],[dx,box.x+box.w+r-a.x],[-dy,a.y-box.y+r],[dy,box.y+box.h+r-a.y]]){if(Math.abs(p)<EPS){if(q<0)return false}else{const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false}}return true}
function spatial(size){const cells=new Map();return{add(value,b=value){for(let x=Math.floor(b.x/size);x<=Math.floor((b.x+b.w)/size);x++)for(let y=Math.floor(b.y/size);y<=Math.floor((b.y+b.h)/size);y++){const key=x+':'+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(value)}},query(b){const found=new Set();for(let x=Math.floor(b.x/size);x<=Math.floor((b.x+b.w)/size);x++)for(let y=Math.floor(b.y/size);y<=Math.floor((b.y+b.h)/size);y++)for(const value of cells.get(x+':'+y)||[])found.add(value);return[...found]}}}
function create(options={}){
 const {MW=7200,MH=5040,STREET=66,lands=[],roadXs=[],roadYs=[],buildings=[],landmarks=[],trees=[],debris=[],streetlights=[],districtRings={}}=options;
 const roads=options.roads||[],segments=options.segments||roads.flatMap(road=>road.points.slice(1).map((b,i)=>({a:road.points[i],b,w:road.w||STREET,path:road,road}))),buildingIndex=spatial(220),edgeIndex=spatial(280),roadIndex=spatial(280);
 for(const b of buildings)buildingIndex.add(b);
 for(const r of roads){const xs=r.points.map(p=>p.x),ys=r.points.map(p=>p.y),pad=(r.w||STREET)/2;roadIndex.add(r,{x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2})}
 function solid(x,y,r=0){if(!Number.isFinite(x)||!Number.isFinite(y)||x-r<=20||y-r<=20||x+r>=MW-20||y+r>=MH-20)return true;return buildingIndex.query({x:x-r,y:y-r,w:r*2,h:r*2}).some(b=>{const dx=Math.max(b.x-x,0,x-b.x-b.w),dy=Math.max(b.y-y,0,y-b.y-b.h);return r>0?dx*dx+dy*dy<r*r:x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h})}
 function clearLine(a,b,r=9){return !!a&&!!b&&[a.x,a.y,b.x,b.y].every(Number.isFinite)&&!solid(a.x,a.y,r)&&!solid(b.x,b.y,r)&&!buildingIndex.query(bounds(a,b,r)).some(v=>lineRect(a,b,v,r))}
 // Split the recovered road centre lines only for topology. The original
 // render geometry and each caller-owned road/rectangle stay untouched.
 const nodes=[],edges=[],byPoint=new Map(),edgePairs=new Set(),splits=segments.map(()=>[0,1]);
 function addSplit(i,t){if(t>=-EPS&&t<=1+EPS)splits[i].push(clamp(t,0,1))}
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  const a=segments[i],b=segments[j];if(!intersects(bounds(a.a,a.b),bounds(b.a,b.b)))continue;
  const rx=a.b.x-a.a.x,ry=a.b.y-a.a.y,sx=b.b.x-b.a.x,sy=b.b.y-b.a.y,qx=b.a.x-a.a.x,qy=b.a.y-a.a.y,den=rx*sy-ry*sx;
  if(Math.abs(den)>EPS){const t=(qx*sy-qy*sx)/den,u=(qx*ry-qy*rx)/den;if(t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS){addSplit(i,t);addSplit(j,u)}}
  else if(Math.abs(qx*ry-qy*rx)<EPS){for(const p of[b.a,b.b]){const hit=project(p,a.a,a.b);if(hit.d<EPS)addSplit(i,hit.t)}for(const p of[a.a,a.b]){const hit=project(p,b.a,b.b);if(hit.d<EPS)addSplit(j,hit.t)}}
 }
 function node(p){const key=p.x.toFixed(4)+':'+p.y.toFixed(4);if(!byPoint.has(key)){byPoint.set(key,nodes.length);nodes.push({id:nodes.length,x:p.x,y:p.y,edges:[]})}return byPoint.get(key)}
 for(let i=0;i<segments.length;i++){
  const s=segments[i],ts=[...new Set(splits[i].map(t=>Math.round(t*1e9)/1e9))].sort((a,b)=>a-b);
  for(let k=1;k<ts.length;k++){const at=t=>({x:s.a.x+(s.b.x-s.a.x)*t,y:s.a.y+(s.b.y-s.a.y)*t}),a=node(at(ts[k-1])),b=node(at(ts[k]));if(a===b)continue;const key=Math.min(a,b)+':'+Math.max(a,b);if(edgePairs.has(key))continue;edgePairs.add(key);const e={id:edges.length,a,b,length:distance(nodes[a],nodes[b]),w:s.w||STREET,vehicle:s.path?.vehicle!==false,road:s.path||s.road,segment:s};edges.push(e);nodes[a].edges.push(e.id);nodes[b].edges.push(e.id);edgeIndex.add(e,bounds(nodes[a],nodes[b],e.w/2))}
 }
 const eligible=(e,opts,radius)=>!opts.vehicle||(e.vehicle&&e.w>=radius*2+2);
 function candidates(x,y,opts={},range=180){const p={x,y},radius=opts.radius??(opts.vehicle?19:9),result=[];for(const e of edgeIndex.query({x:x-range,y:y-range,w:range*2,h:range*2})){if(!eligible(e,opts,radius))continue;const hit=project(p,nodes[e.a],nodes[e.b]);if(hit.d<=range&&!solid(hit.x,hit.y,radius))result.push({...hit,w:e.w,width:e.w,road:e.road,segment:e.segment,edge:e})}return result.sort((a,b)=>a.d-b.d)}
 function nearest(x,y,opts={}){if(typeof x==='object'){opts=y||{};y=x.y;x=x.x}if(!Number.isFinite(x)||!Number.isFinite(y))return null;for(const range of[120,360,1080,Math.max(MW,MH)]){const result=candidates(x,y,opts,range);if(result.length&&result[0].d<range)return result[0]}return null}
 function isRoad(x,y,r=0){if(typeof x==='object'){r=y||0;y=x.y;x=x.x}if(!Number.isFinite(x)||!Number.isFinite(y))return false;for(const road of roadIndex.query({x,y,w:0,h:0})){if(road.vehicle===false||(road.w||STREET)/2<r)continue;for(let i=1;i<road.points.length;i++)if(project({x,y},road.points[i-1],road.points[i]).d<=(road.w||STREET)/2-r+EPS)return true}return false}
 function nearestSafe(x,y,r=9,opts={}){if(typeof r==='object'){opts=r;r=opts.vehicle?19:9}if(!solid(x,y,r)&&(!opts.vehicle||isRoad(x,y,r)))return{x,y};const p=nearest(x,y,{...opts,radius:r});return p?point(p):null}
 // A foot connector preserves the requested endpoint. Ordinary landmark doors
 // see their original southern sidewalk directly; corner vertices handle the
 // occasional courtyard endpoint without routing through a building.
 function footConnector(p,radius){
  if(solid(p.x,p.y,radius))return null;
  const closest=nearest(p.x,p.y,{radius});if(closest&&clearLine(p,closest,radius))return{near:closest,points:[point(p),point(closest)]};
  const visible=candidates(p.x,p.y,{radius},780).filter(hit=>clearLine(p,hit,radius));if(visible.length)return{near:visible[0],points:[point(p),point(visible[0])]};
  const boxes=buildingIndex.query({x:p.x-420,y:p.y-420,w:840,h:840}),vertices=[point(p)],pad=radius+1;
  for(const b of boxes)for(const q of[{x:b.x-pad,y:b.y-pad},{x:b.x+b.w+pad,y:b.y-pad},{x:b.x-pad,y:b.y+b.h+pad},{x:b.x+b.w+pad,y:b.y+b.h+pad}])if(!solid(q.x,q.y,radius))vertices.push(q);
  const costs=new Float64Array(vertices.length);costs.fill(Infinity);costs[0]=0;const previous=new Int32Array(vertices.length);previous.fill(-1);const seen=new Uint8Array(vertices.length);
  for(let turn=0;turn<vertices.length;turn++){let id=-1;for(let i=0;i<vertices.length;i++)if(!seen[i]&&(id<0||costs[i]<costs[id]))id=i;if(id<0||!Number.isFinite(costs[id]))break;seen[id]=1;const at=vertices[id];if(id){const near=candidates(at.x,at.y,{radius},380).find(hit=>clearLine(at,hit,radius));if(near){const ps=[];for(let n=id;n>=0;n=previous[n])ps.push(point(vertices[n]));ps.reverse();ps.push(point(near));return{near,points:ps}}}for(let i=1;i<vertices.length;i++){if(seen[i])continue;const cost=costs[id]+distance(at,vertices[i]);if(cost<costs[i]&&clearLine(at,vertices[i],radius)){costs[i]=cost;previous[i]=id}}}
  return null;
 }
 const cache=new Map(),edgeClearance=new Map();
 function clearEdges(radius){if(!edgeClearance.has(radius))edgeClearance.set(radius,edges.map(e=>clearLine(nodes[e.a],nodes[e.b],radius)));return edgeClearance.get(radius)}
 function treeFrom(origin,opts,radius){
  const key=(opts.vehicle?'v':'p')+':'+radius+':'+origin;
  if(cache.has(key)){const result=cache.get(key);cache.delete(key);cache.set(key,result);return result}
  const costs=new Float64Array(nodes.length);costs.fill(Infinity);costs[origin]=0;
  const previous=new Int32Array(nodes.length);previous.fill(-1);const heap=[{id:origin,cost:0}],clear=clearEdges(radius);
  function push(value){let i=heap.length;heap.push(value);while(i){const parent=(i-1)>>1;if(heap[parent].cost<=value.cost)break;heap[i]=heap[parent];i=parent}heap[i]=value}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].cost<heap[child].cost)child++;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child}heap[i]=last}return first}
  while(heap.length){const next=pop();if(next.cost>costs[next.id]+EPS)continue;for(const edgeId of nodes[next.id].edges){const e=edges[edgeId];if(!eligible(e,opts,radius)||!clear[edgeId])continue;const id=e.a===next.id?e.b:e.a,cost=next.cost+e.length;if(cost<costs[id]){costs[id]=cost;previous[id]=next.id;push({id,cost})}}}
  const result={costs,previous};cache.set(key,result);if(cache.size>96)cache.delete(cache.keys().next().value);return result;
 }

 function route(from,to,opts={}){if(!from||!to||![from.x,from.y,to.x,to.y].every(Number.isFinite))return null;const radius=opts.radius??(opts.vehicle?19:9),startLink=opts.vehicle?null:footConnector(from,radius),endLink=opts.vehicle?null:footConnector(to,radius),start=opts.vehicle?nearest(from.x,from.y,{...opts,radius}):startLink?.near,end=opts.vehicle?nearest(to.x,to.y,{...opts,radius}):endLink?.near;if(!start||!end)return null;const finish=path=>[...(startLink?.points||[]),...path.map(point),...(endLink?.points.slice().reverse()||[])].filter((p,i,ps)=>!i||distance(p,ps[i-1])>.01);if(start.edge.id===end.edge.id&&clearLine(start,end,radius))return finish([start,end]);let best=null;for(const a of[start.edge.a,start.edge.b]){if(!clearLine(start,nodes[a],radius))continue;const tree=treeFrom(a,opts,radius);for(const b of[end.edge.a,end.edge.b]){if(!clearLine(end,nodes[b],radius))continue;const cost=distance(start,nodes[a])+tree.costs[b]+distance(nodes[b],end);if(Number.isFinite(cost)&&(!best||cost<best.cost))best={cost,tree,b}}}if(!best)return null;const ids=[];for(let n=best.b;n>=0;n=best.tree.previous[n])ids.push(n);ids.reverse();return finish([start,...ids.map(n=>nodes[n]),end])}
 const intersections=nodes.filter(n=>n.edges.length>=3).map(n=>({x:n.x,y:n.y,degree:n.edges.length}));
 const access=landmarks.map(l=>({key:l.key,door:{x:l.x,y:l.y},road:nearest(l.x,l.y,{vehicle:true}),building:l.building}));
 const navigation={nodes,edges,intersections,nearest,route,routePath:route,path:route,isRoad,access,districtRoutes:districtRings};
 function components(vehicle){const seen=new Set();let count=0;for(const n of nodes){if(seen.has(n.id)||!n.edges.some(id=>!vehicle||edges[id].vehicle))continue;count++;const queue=[n.id];seen.add(n.id);for(let at=0;at<queue.length;at++)for(const id of nodes[queue[at]].edges){const e=edges[id];if(vehicle&&!e.vehicle)continue;const next=e.a===queue[at]?e.b:e.a;if(!seen.has(next)){seen.add(next);queue.push(next)}}}return count}
 function diagnostics(){const buildingsByKind={},byDistrict={},variants=new Set();for(const b of buildings){buildingsByKind[b.kind]=(buildingsByKind[b.kind]||0)+1;const d=byDistrict[b.district]||(byDistrict[b.district]={total:0});d.total++;d[b.kind]=(d[b.kind]||0)+1;if(b.residentialVariant!==undefined)variants.add(b.residentialVariant)}return{baseline:'c9b4af6',mapVersion:3,buildings:buildings.length,buildingsByKind,byDistrict,roads:roads.length,roadSegments:segments.length,roadCols:roadXs.length,roadRows:roadYs.length,streetWidth:STREET,houseVariants:[...variants].sort(),residentialAdditions:buildings.filter(b=>b.residentialVariant!==undefined).length,curvedRoads:0,culdesacs:0,navNodes:nodes.length,navEdges:edges.length,components:components(false),vehicleComponents:components(true),landmarkConnectivity:access.map(a=>({key:a.key,doorClear:!solid(a.door.x,a.door.y,9),foot:!!route(access[0]?.door,a.door),vehicle:!!route(access[0]?.door,a.door,{vehicle:true})}))}}
 return{MW,MH,roads,segments,buildings,landmarks,lands,roadXs,roadYs,STREET,trees,debris,streetlights,details:[],spaces:debris,lots:[],neighborhoods:[],districtRoutes:districtRings,intersections,access,navigation,collision:{solid,clearLine,nearestSafe},diagnostics,queryBuildings:(x,y,w,h)=>buildingIndex.query({x,y,w,h}),queryRoads:(x,y,w,h)=>roadIndex.query({x,y,w,h})};
}
global.GlowportRestoredCity={create};if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportRestoredCity;
})(typeof window!=='undefined'?window:globalThis);
