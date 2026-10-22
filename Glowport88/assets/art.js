/* Midnight Signal: original atlas renderer. Gameplay never depends on artwork state. */
window.GlowportArt=(()=>{
'use strict';
const atlas=window.GLOWPORT_ATLAS,images={},patterns=new WeakMap(),worldLighting=new WeakMap();
let activeLighting={grid:new Map(),sources:[],builds:0};
// Keep weather, ambient shade and individual emitters independently adjustable.
// A clear daytime frame deliberately has no colour grade or full-screen veil.
const lighting={ambient:{day:0,night:.24,color:'#09101a'},shadows:{buildingOpacity:.38,buildingColor:'#25383b',nightVignette:.035},streetlight:{radius:27,intensity:.34,color:'#ffe3ac'},neon:{radiusScale:.48,maxRadius:36,intensity:.42,coreRadius:3,coreIntensity:.46},vehicle:{beamLength:49,beamWidth:14,intensity:.16,lampRadius:7,policeRadius:20},weather:{rainOpacity:.22,mistOpacity:.12,reflectionIntensity:.07}};
const base=new URL('.',document.currentScript.src);
const ready=Promise.all(['city-atlas','characters','vehicles','buildings-illustrated','neighborhoods-illustrated','portraits','furniture-illustrated'].map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve()};im.onerror=()=>reject(Error('Could not load '+name+'.png'));im.src=new URL(name+'.png',base).href})));
const palettes={
 west:{roof:'roof-rust',wall:'brick-warm',edge:'#a18a92',accent:'#ef99b1',label:'SUNSET'},
 core:{roof:'roof',wall:'brick-blue',edge:'#7a8da7',accent:'#71e4df',label:'DOWNTOWN'},
 north:{roof:'roof-teal',wall:'brick',edge:'#819e9e',accent:'#e3ba8e',label:'CRESCENT'},
 south:{roof:'roof-rust',wall:'brick-warm',edge:'#aa8d93',accent:'#e49b96',label:'PALM SOUTH'},
 east:{roof:'roof-teal',wall:'metal',edge:'#7e91a0',accent:'#d8b573',label:'EASTSIDE'}
};
const neon=['#75e9e1','#f38fc5','#a6a1f0','#edbc8c'];
const hash=(x,y=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function sprite(c,name,x,y,w,h){if(furnitureCells[name]){const a=atlas[name];furniture(c,name,x,y,w||a?.[2]||32,h||a?.[3]||32);return}const a=atlas[name];if(!a)throw Error('Missing atlas sprite '+name);c.drawImage(images['city-atlas'],...a,Math.round(x),Math.round(y),w||a[2],h||a[3])}
const furnitureCells={sofa:[10,60,414,274],table:[438,35,315,300],bed:[789,14,307,350],arcade:[1145,24,384,327],counter:[13,373,427,269],gunrack:[455,376,310,270],mixer:[778,386,412,254],crates:[1208,367,317,281],terminal:[19,650,382,359],records:[440,698,382,278],locker:[940,650,198,360],planter:[1199,667,310,337]};
function furniture(c,name,x,y,w,h){const a=furnitureCells[name];c.drawImage(images['furniture-illustrated'],...a,Math.round(x),Math.round(y),w,h)}
function roomSolids(key){return [[88,108,230,185],[270,250,350,298],[486,260,616,304],key==='motel'?[520,100,646,176]:[486,100,646,170]]}
function pattern(c,name){let map=patterns.get(c);if(!map){map=new Map();patterns.set(c,map)}if(!map.has(name)){const a=atlas[name],tile=document.createElement('canvas');tile.width=a[2];tile.height=a[3];tile.getContext('2d').drawImage(images['city-atlas'],...a,0,0,a[2],a[3]);map.set(name,c.createPattern(tile,'repeat'))}return map.get(name)}
function material(c,name,x,y,w,h){c.fillStyle=pattern(c,name);c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function line(c,points,col,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke()}
function polygon(c,pts,col){c.fillStyle=col;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill()}
function addLight(index,x,y,r,color,power=1,kind='neon'){
 const source={x,y,r,color,power,kind,seed:hash(x,y)%100},key=`${Math.floor(x/256)},${Math.floor(y/256)}`;
 if(!index.grid.has(key))index.grid.set(key,[]);index.grid.get(key).push(source);index.sources.push(source);
}
function rebuildLighting(world){
 const previous=worldLighting.get(world),index={grid:new Map(),sources:[],builds:(previous?.builds||0)+1,buildings:world.buildings,streetlights:world.streetlights,buildingCount:world.buildings?.length||0,lampCount:world.streetlights?.length||0,environment:window.GlowportEnvironment};
 for(const b of world.buildings||[]){
  if(!b.landmark&&window.GlowportEnvironment){for(const source of window.GlowportEnvironment.lightsFor?.(b)||[])addLight(index,source.x,source.y,source.radius||source.r||28,source.color,source.alpha??source.power??.65);continue}
  // Original landmark artwork and entrances remain untouched; its lamps are local.
  const seed=hash(b.x,b.y),col=b.landmark?(palettes[b.district]||palettes.core).accent:neon[seed%4];
  addLight(index,b.doorX,b.doorY-8,b.landmark?62:38,col,b.landmark?1:.55);
  if(b.landmark?.key==='club')addLight(index,b.x+b.w*.75,b.y+b.h*.55,44,'#e589cb',.6);
 }
 for(const l of world.streetlights||[])addLight(index,l.x,l.y-15,lighting.streetlight.radius,l.color||lighting.streetlight.color,l.power??1,'lamp');
 worldLighting.set(world,index);activeLighting=index;return getLightingDiagnostics(world);
}
function selectLighting(world){
 if(!world)return activeLighting;
 let index=worldLighting.get(world);
 if(!index||index.buildings!==world.buildings||index.streetlights!==world.streetlights||index.buildingCount!==(world.buildings?.length||0)||index.lampCount!==(world.streetlights?.length||0)||index.environment!==window.GlowportEnvironment){rebuildLighting(world);index=worldLighting.get(world)}
 activeLighting=index;return index;
}
function getLightingDiagnostics(world){const index=world?worldLighting.get(world):activeLighting;return {sources:index?.sources.length||0,streetlights:index?.sources.filter(l=>l.kind==='lamp').length||0,neon:index?.sources.filter(l=>l.kind==='neon').length||0,cells:index?.grid.size||0,builds:index?.builds||0};}

function label(c,text,x,y,w,color,size=8){c.font=`bold ${size}px monospace`;c.textAlign='center';c.fillStyle=color;c.fillText(text,x+w/2,y,w-5);c.textAlign='left'}
function modularBuilding(c,b){const {x,y,w,h}=b,s=hash(x,y),p=palettes[b.district],col=b.landmark?p.accent:neon[s%4];
 const face=Math.min(48,Math.max(31,h*.37)),fy=Math.round(y+h-face),roofH=fy-y;
 // Footprint stays unchanged. Facade, parapet, cast shadow, and overhanging canopy establish depth.
 polygon(c,[[x+7,y+7],[x+w+12,y+9],[x+w+15,y+h+14],[x+9,y+h+14]],'#101528');
 material(c,p.wall,x,fy,w,face);rect(c,x,fy,3,face,'#22263c');rect(c,x+w-4,fy,4,face,'#20273e');rect(c,x+4,fy+2,w-8,2,'#767489');
 material(c,p.roof,x+2,y+3,w-4,roofH);rect(c,x,y,w,4,p.edge);rect(c,x,y+4,4,roofH,'#62647c');rect(c,x+w-5,y+3,5,roofH,'#252c44');rect(c,x+5,fy-5,w-10,5,'#1c243a');rect(c,x+4,y+6,w-10,2,'#7d7d92');rect(c,x+9,y+10,w-20,1,'#252e46');
 // Roof seams, raised skylight, electrical conduits and fan housings.
 for(let rx=x+15;rx<x+w-12;rx+=24)line(c,[[rx,y+11],[rx,fy-12]],'#2b3048');
 if(roofH>25){sprite(c,'ac',x+10,y+13);if(w>90)sprite(c,'ac',x+w-44,y+12);line(c,[[x+33,y+35],[x+33,fy-12],[x+w-10,fy-12],[x+w-10,fy+7]],'#172235',3);line(c,[[x+33,y+35],[x+33,fy-12],[x+w-10,fy-12]],'#7a8191');}
 if(roofH>62&&w>72){rect(c,x+w/2-18,y+43,35,22,'#19273c');sprite(c,'window',x+w/2-14,y+43,28,18);line(c,[[x+w/2-19,y+64],[x+w/2+18,y+64]],'#8193a3',2)}
 // Terrace railings and laundry distinguish residential roofs.
 if(b.district==='north'||b.kind==='homes'){for(let rx=x+7;rx<x+w-7;rx+=7)rect(c,rx,y+5,1,11,'#33384d');line(c,[[x+6,y+6],[x+w-8,y+6]],'#a4a1a6');if(w>85&&roofH>38){line(c,[[x+13,fy-25],[x+w-16,fy-25]],'#aba3a1');for(let i=0;i<4;i++)rect(c,x+20+i*12,fy-24,8,10,['#b4879c','#748c9a','#b5a083','#5c687c'][i]);sprite(c,'planter',x+w-37,fy-48,25,27)}}
 // Storefront: lit glass, interior shelving, doors, striped awning, inset sign.
 const doorX=b.doorX-11,wy=fy+11;
 for(let wx=x+8;wx+21<x+w-7;wx+=27){if(Math.abs(wx-doorX)<21)continue;sprite(c,s%3===0?'window-warm':'window',wx,wy,22,Math.min(24,face-13));}
 rect(c,x+4,fy-1,w-8,12,'#151e34');rect(c,x+6,fy,w-12,1,col);label(c,b.name,x+5,fy+9,w-10,col,Math.min(9,w/10));
 const awnY=fy+12;
 if(s%3!==1||b.landmark){polygon(c,[[x+6,awnY],[x+w-6,awnY],[x+w-1,awnY+8],[x+1,awnY+8]],'#36415a');for(let ax=x+7;ax<x+w-7;ax+=10)polygon(c,[[ax,awnY],[ax+5,awnY],[ax+8,awnY+8],[ax+2,awnY+8]],s%2?'#a97491':'#528d94');rect(c,x+2,awnY+8,w-4,3,'#17263d');rect(c,x+2,awnY+8,w-4,1,col)}
 sprite(c,'door',doorX,b.doorY-30,22,32);rect(c,doorX-3,b.doorY+2,28,3,'#707b8e');rect(c,doorX,b.doorY+2,22,1,col);
 if(w>95){sprite(c,'vending',x+5,y+h-26,17,26);sprite(c,'planter',x+w-28,y+h-22,23,25)}
 // Projecting blade sign has a mounting bracket, face lettering, and a matching local light.
 if(w>68){const sx=s%2?x+w-9:x-5;rect(c,sx,fy-9,7,2,'#8b8195');rect(c,sx+3,fy-6,10,30,'#121c33');rect(c,sx+4,fy-5,8,27,col);rect(c,sx+5,fy-4,6,25,'#30334f');for(let k=0;k<3;k++)label(c,(b.landmark?'OPEN':'88+')[k],sx+4,fy+3+k*7,8,col,6)}
 if(s%4===0&&w>80){rect(c,x+w-22,y+11,13,roofH-17,'#2a3045');for(let r=y+15;r<fy-10;r+=7)line(c,[[x+w-21,r],[x+w-10,r+3]],'#7b7b8e');line(c,[[x+w-23,y+12],[x+w-23,fy-6]],'#9b8996')}

}
const buildingCells=[[0,0,512,530],[512,0,512,530],[1024,0,512,530],[0,530,512,494],[512,530,512,494],[1024,530,512,494]];
const neighborhoodCells=[[36,58,467,424],[530,92,469,387],[1029,60,473,419],[25,534,484,407],[535,547,472,392],[1029,534,485,400]];
function building(c,b){
 const seed=hash(b.x,b.y),landmark=b.landmark?.key;
 const choices={west:[0,2,4],core:[1,3,4],north:[0,0,4],south:[2,0,1],east:[5,5,1]};
 let index=choices[b.district][seed%3],sheet='neighborhoods-illustrated',cells=neighborhoodCells;
 if(landmark){const special={hotel:0,armory:1,radio:2,warehouse:5};if(special[landmark]!==undefined){index=special[landmark];sheet='buildings-illustrated';cells=buildingCells}else index={motel:0,diner:2,records:4,club:3,arcade:4,observatory:5,pier:5,clinic:0}[landmark]??0}
 // Full illustrated architectural sprites are anchored at the original collision footprint and door.
 const dx=b.x-3,dy=b.y-3,dw=b.w+6,dh=b.h+20;
 c.drawImage(images[sheet],...cells[index],dx,dy,dw,dh);
 const col=landmark?palettes[b.district].accent:neon[seed%4];
 // An in-world business plaque labels the unlettered neighborhood shells.
 const plateY=Math.round(dy+dh*.6),plateW=Math.min(b.w-14,112);
 if(sheet==='neighborhoods-illustrated'||landmark){rect(c,b.doorX-plateW/2,plateY,plateW,9,'#131d30ed');label(c,b.name,b.doorX-plateW/2,plateY+7,plateW,col,7)}
 rect(c,b.doorX-9,b.doorY+3,18,1,col);

}
// Terrain tiles receive the complete world. Clip the work to their translated
// canvas without changing the world or rebuilding the independent lighting index.
function terrainView(c,world){const t=c.getTransform();return {x:-t.e,y:-t.f,w:c.canvas.width,h:c.canvas.height}}
function inView(view,x,y,w=0,h=0,pad=48){return x+w+pad>=view.x&&x-pad<=view.x+view.w&&y+h+pad>=view.y&&y-pad<=view.y+view.h}
function roadBounds(road){if(road.bounds)return road.bounds;const pts=road.points||[],xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}}
// Native Canvas strokers tessellate a clipped diagonal differently on each
// backing surface. Rasterize road capsules on the world pixel grid instead:
// integer scanline spans give both crisp curbs and identical tile boundaries.
function pixelRoadSegment(c,a,b,r,view){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
 if(!len||Math.min(a.x,b.x)-r>view.x+view.w||Math.max(a.x,b.x)+r<view.x||Math.min(a.y,b.y)-r>view.y+view.h||Math.max(a.y,b.y)+r<view.y)return;
 // Axis-aligned avenue middles are a single opaque fill; only their short
 // round ends need scanlines. This keeps cold tile work proportional to bends.
 if(Math.abs(dx)<.000001||Math.abs(dy)<.000001){
  const vertical=Math.abs(dx)<.000001,x0=vertical?a.x-r:Math.min(a.x,b.x),x1=vertical?a.x+r:Math.max(a.x,b.x),y0=vertical?Math.min(a.y,b.y):a.y-r,y1=vertical?Math.max(a.y,b.y):a.y+r;
  const left=Math.max(Math.ceil(x0-.5),Math.floor(view.x)),right=Math.min(Math.floor(x1-.5),Math.ceil(view.x+view.w)-1),top=Math.max(Math.ceil(y0-.5),Math.floor(view.y)),bottom=Math.min(Math.floor(y1-.5),Math.ceil(view.y+view.h)-1);
  if(right>=left&&bottom>=top)c.fillRect(left,top,right-left+1,bottom-top+1);
  for(const p of [a,b])for(let y=Math.max(Math.floor(p.y-r),Math.floor(view.y));y<Math.min(Math.ceil(p.y+r),Math.ceil(view.y+view.h));y++){
   const yy=y+.5-p.y;if(Math.abs(yy)>=r)continue;const xx=Math.sqrt(r*r-yy*yy),lo=Math.max(Math.ceil(p.x-xx-.5),Math.floor(view.x)),hi=Math.min(Math.floor(p.x+xx-.5),Math.ceil(view.x+view.w)-1);if(hi>=lo)c.fillRect(lo,y,hi-lo+1,1);
  }
  return;
 }
 const nx=-dy/len*r,ny=dx/len*r,polygon=[[a.x+nx,a.y+ny],[b.x+nx,b.y+ny],[b.x-nx,b.y-ny],[a.x-nx,a.y-ny]];
 const top=Math.max(Math.floor(Math.min(a.y,b.y)-r),Math.floor(view.y)),bottom=Math.min(Math.ceil(Math.max(a.y,b.y)+r),Math.ceil(view.y+view.h));
 for(let y=top;y<bottom;y++){
  const cy=y+.5;let lo=Infinity,hi=-Infinity;
  for(let i=0;i<4;i++){const p=polygon[i],q=polygon[(i+1)%4];if((p[1]<=cy&&q[1]>cy)||(q[1]<=cy&&p[1]>cy)){const x=p[0]+(cy-p[1])/(q[1]-p[1])*(q[0]-p[0]);lo=Math.min(lo,x);hi=Math.max(hi,x)}}
  for(const p of [a,b]){const yy=cy-p.y;if(Math.abs(yy)<r){const xx=Math.sqrt(r*r-yy*yy);lo=Math.min(lo,p.x-xx);hi=Math.max(hi,p.x+xx)}}
  const left=Math.max(Math.ceil(lo-.5),Math.floor(view.x)),right=Math.min(Math.floor(hi-.5),Math.ceil(view.x+view.w)-1);
  if(right>=left)c.fillRect(left,y,right-left+1,1);
 }
}
function pixelRoadPolygon(c,points,style,view){
 c.fillStyle=style;const top=Math.max(Math.floor(Math.min(...points.map(p=>p.y))),Math.floor(view.y)),bottom=Math.min(Math.ceil(Math.max(...points.map(p=>p.y))),Math.ceil(view.y+view.h));
 for(let y=top;y<bottom;y++){const cy=y+.5;let lo=Infinity,hi=-Infinity;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];if((p.y<=cy&&q.y>cy)||(q.y<=cy&&p.y>cy)){const x=p.x+(cy-p.y)/(q.y-p.y)*(q.x-p.x);lo=Math.min(lo,x);hi=Math.max(hi,x)}}const left=Math.max(Math.ceil(lo-.5),Math.floor(view.x)),right=Math.min(Math.floor(hi-.5),Math.ceil(view.x+view.w)-1);if(right>=left)c.fillRect(left,y,right-left+1,1)}
}
function pixelRoad(c,road,width,style,view){
 c.fillStyle=style;const points=road.points||[],path=new Path2D(),spans={fillRect:(x,y,w,h)=>path.rect(x,y,w,h)};
 for(let i=1;i<points.length;i++)pixelRoadSegment(spans,points[i-1],points[i],width/2,view);
 if(road.loop&&points.length>1)pixelRoadSegment(spans,points.at(-1),points[0],width/2,view);
 c.fill(path);
}
function roadDashes(c,road,view){
 c.fillStyle='#b6a275';let along=0;const pts=road.points||[],path=new Path2D(),spans={fillRect:(x,y,w,h)=>path.rect(x,y,w,h)};
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)continue;
  for(let t=0;t<len;){const phase=(along+t)%30,step=Math.min(len-t,(phase<12?12:30)-phase);if(phase<12){const p={x:a.x+dx*t/len,y:a.y+dy*t/len},q={x:a.x+dx*(t+step)/len,y:a.y+dy*(t+step)/len};pixelRoadSegment(spans,p,q,.65,view)}t+=Math.max(.00001,step)}along+=len;
 }
 c.fill(path);
}
function drawRoads(c,world,view){
 const roads=world.queryRoads?world.queryRoads(view.x-100,view.y-100,view.w+200,view.h+200):(world.roads||[]).filter(r=>{const b=roadBounds(r);return inView(view,b.x,b.y,b.w,b.h,(r.w||54)/2+28)});
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const road of roads.filter(r=>r.type==='walkway')){pixelRoad(c,road,(road.w||14)+4,'#9a9d8d',view);pixelRoad(c,road,road.w||14,'#c3c1ac',view)}
 const streets=roads.filter(r=>r.type!=='walkway');
 // Complete each layer before the next: shared junctions never acquire a curb
 // across their centre, and the same connected polylines drive the traffic.
 for(const road of streets)pixelRoad(c,road,(road.w||54)+26,'#87918d',view)
 for(const road of streets)pixelRoad(c,road,(road.w||54)+22,pattern(c,'pavement'),view)
 for(const road of streets)pixelRoad(c,road,(road.w||54)+4,'#b3afa0',view)
 for(const road of streets)pixelRoad(c,road,road.w||54,pattern(c,'asphalt'),view)
 c.lineCap='butt';
 for(const road of streets){if((road.w||54)<49||['alley','service','residential','lane','cul-de-sac','walkway'].includes(road.type))continue;roadDashes(c,road,view)}
 c.setLineDash([]);
 // Crossing locations are actual graph junctions, rather than every old grid pair.
 for(const node of world.intersections||[]){if(!inView(view,node.x,node.y,0,0,90))continue;const arms=[];
  for(const road of streets){if(road.vehicle===false)continue;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy,t=((node.x-a.x)*dx+(node.y-a.y)*dy)/(len2||1);if(t<-.001||t>1.001||Math.hypot(node.x-a.x-t*dx,node.y-a.y-t*dy)>2)continue;for(const p of [a,b]){if(Math.hypot(p.x-node.x,p.y-node.y)<3)continue;const angle=Math.atan2(p.y-node.y,p.x-node.x);if(!arms.some(arm=>Math.cos(arm.angle-angle)>.98))arms.push({angle,w:road.w||54})}}}
  for(const arm of arms){const cos=Math.cos(arm.angle),sin=Math.sin(arm.angle),toWorld=(x,y)=>({x:node.x+x*cos-y*sin,y:node.y+x*sin+y*cos});for(let k=-arm.w*.32;k<=arm.w*.32;k+=7){const x=Math.round(arm.w/2+4),y=Math.round(k);pixelRoadPolygon(c,[toWorld(x,y),toWorld(x+7,y),toWorld(x+7,y+3),toWorld(x,y+3)],'#b7b5a5',view)}}
 }
 c.restore();
}
function bakeTerrain(c,world){const {MW,MH,roadXs=[],roadYs=[],STREET=66,buildings=[],trees=[],debris=[],streetlights=[]}=world,view=terrainView(c,world),environment=window.GlowportEnvironment;selectLighting(world);c.imageSmoothingEnabled=false;
 material(c,'concrete',0,0,MW,MH);if(world.roads?.length)districtGround(c,world,view);
 // Regional ground stays crisp, with lawns and community spaces beneath roads.
 for(const space of world.spaces||debris){if(!inView(view,space.x,space.y,space.w,space.h))continue;if(environment?.drawSpace){environment.drawSpace(c,space);continue}const p=space;if(p.type==='park'){material(c,'grass',p.x,p.y,p.w,p.h);material(c,'pavement',p.x,p.y+p.h*.47,p.w,13);material(c,'pavement',p.x+p.w*.48,p.y,13,p.h);rect(c,p.x+p.w*.65,p.y+18,33,26,'#26364b');rect(c,p.x+p.w*.65+3,p.y+21,27,20,'#598a92');sprite(c,'bench',p.x+12,p.y+18);sprite(c,'planter',p.x+14,p.y+p.h-36)}else if(p.type==='plaza'){material(c,'pavement',p.x,p.y,p.w,p.h);for(let k=0;k<3;k++)sprite(c,'bench',p.x+18+k*48,p.y+17)}else{material(c,'asphalt',p.x,p.y,p.w,p.h);for(let k=16;k<p.w-12;k+=26)rect(c,p.x+k,p.y+5,1,p.h-10,'#69717d')}}
 const visibleBuildings=world.queryBuildings?world.queryBuildings(view.x-100,view.y-100,view.w+200,view.h+200):buildings.filter(b=>inView(view,b.lot?.x??b.x,b.lot?.y??b.y,b.lot?.w??b.w,b.lot?.h??b.h,80));
 if(environment?.drawLot)for(const b of visibleBuildings)if(!b.landmark)environment.drawLot(c,b);
 if(world.roads?.length){drawRoads(c,world,view)}else{
 // Legacy fixture worlds remain supported; production draws its actual road graph.
 for(let x of roadXs){if(!inView(view,x-STREET/2-22,0,STREET+44,MH))continue;material(c,'pavement',x-STREET/2-22,0,STREET+44,MH);material(c,'asphalt',x-STREET/2,0,STREET,MH);rect(c,x-STREET/2-2,0,2,MH,'#7d8390');rect(c,x+STREET/2,0,2,MH,'#1d253a');for(let y=0;y<MH;y+=30)rect(c,x,y,1,13,'#aea18a');for(let y=240;y<MH;y+=340){sprite(c,'drain',x-STREET/2+2,y,9,20);rect(c,x-STREET/2+13,y+34,21,1,'#1c2438')}}
 for(let y of roadYs){if(!inView(view,0,y-STREET/2-22,MW,STREET+44))continue;material(c,'pavement',0,y-STREET/2-22,MW,STREET+44);material(c,'asphalt',0,y-STREET/2,MW,STREET);rect(c,0,y-STREET/2-2,MW,2,'#7d8390');rect(c,0,y+STREET/2,MW,2,'#1d253a');for(let x=0;x<MW;x+=30)rect(c,x,y,13,1,'#aea18a');for(let x=240;x<MW;x+=360)sprite(c,'drain',x,y+STREET/2-12)}
 for(let x of roadXs)for(let y of roadYs){if(!inView(view,x,y,0,0,100))continue;material(c,'asphalt',x-STREET/2,y-STREET/2,STREET,STREET);for(let k=-24;k<=24;k+=8){rect(c,x-45,y+k,9,4,'#a4a4a2');rect(c,x+36,y+k,9,4,'#a4a4a2');rect(c,x+k,y-45,4,9,'#a4a4a2');rect(c,x+k,y+36,4,9,'#a4a4a2')}for(let dx of [-1,1])for(let dy of [-1,1]){rect(c,x+dx*43-3,y+dy*43-3,7,7,'#9b968c');rect(c,x+dx*43-2,y+dy*43-2,4,1,'#5c6274')}}
 }
 // Stable world-coordinate wear is culled before expensive road distance queries.
 for(let i=0;i<12000;i++){const s=hash(i,88),x=s%MW,y=hash(i,194)%MH;if(!inView(view,x,y,20,4,0))continue;const near=world.roads?.length?(world.isRoad?world.isRoad(x,y):roadNear(world.roads,x,y)):roadXs.some(rx=>Math.abs(rx-x)<33)||roadYs.some(ry=>Math.abs(ry-y)<33);if(near){rect(c,x,y,2+s%5,1,['#3b4356','#1e263b','#424959'][s%3]);if(s%27===0)pixelRoad(c,{points:[{x:x+.5,y:y+.5},{x:x+12.5,y:y+1.5},{x:x+18.5,y:y+3.5}]},1.3,'#4b5668',view)}else if(s%5===0)rect(c,x,y,2,1,s%2?'#896174':'#808080')}
 for(const b of visibleBuildings){if(!b.landmark&&environment?.drawBuilding)environment.drawBuilding(c,b);else building(c,b)}
 for(const tr of trees){if(inView(view,tr.x,tr.y,0,0,45))sprite(c,tr.kind==='palm'?'palm':'tree',tr.x-20,tr.y-30,40,40)}
 if(environment?.drawDetail)for(const detail of world.details||[]){const x=Math.min(detail.x,detail.to?.x??detail.x),y=Math.min(detail.y,detail.to?.y??detail.y),w=Math.abs((detail.to?.x??detail.x)-detail.x)+(detail.w||0),h=Math.abs((detail.to?.y??detail.y)-detail.y)+(detail.h||0);if(inView(view,x,y,w,h,50))environment.drawDetail(c,detail,{vehicle})}
 for(const l of streetlights){if(inView(view,l.x,l.y,0,0,30))sprite(c,'lamp',l.x-7,l.y-25,14,24)}
 if(!world.roads?.length)for(let x of roadXs)for(let y of roadYs){if(!inView(view,x,y,0,0,120))continue;if(hash(x,y)%3===0){sprite(c,'dumpster',x+57,y+66);sprite(c,'vending',x-74,y-86,18,27)}if(hash(x,y)%4===0)sprite(c,'bench',x+65,y-65)}
}
// Opaque regional ground removes the old expanse of blue paving between
// suburban properties. Texture is sparse, deterministic and anchored to the world.
function districtGround(c,world,view){
 for(const land of world.lands||[]){if(land.id==='core'||!Number.isFinite(land.x0))continue;const x0=land.x0,y0=land.y0,w=land.x1-x0,h=land.y1-y0;if(!inView(view,x0,y0,w,h,0))continue;
  const industrial=land.id==='east',color=land.ground||({west:'#526d60',north:'#456a5b',south:'#5f765c',east:'#5b675f'}[land.id]||'#57705c');rect(c,x0,y0,w,h,color);
  for(let gy=Math.floor(Math.max(y0,view.y-24)/32);gy<=Math.floor(Math.min(land.y1,view.y+view.h+24)/32);gy++)for(let gx=Math.floor(Math.max(x0,view.x-24)/32);gx<=Math.floor(Math.min(land.x1,view.x+view.w+24)/32);gx++){
   const seed=hash(gx,gy),x=gx*32+seed%23,y=gy*32+hash(gy,gx)%23;if(x<x0||x>land.x1-6||y<y0||y>land.y1-4)continue;
   if(industrial){if(seed%3===0){rect(c,x,y,3,1,'#718074');rect(c,x+4,y+2,1,1,'#4d615a')}}else{rect(c,x,y,3,1,seed%2?'#668369':'#496954');if(seed%3===0){rect(c,x+1,y-2,1,2,'#6f8d6d');rect(c,x+6,y+4,2,1,'#779273')}}
  }
 }
 // A narrow sandy coastal margin remains distinct from Palm South's lawns.
 const coast=(world.lands||[]).find(d=>d.id==='south');if(coast){const y=Math.max(coast.y0,world.MH-150);if(inView(view,coast.x0,y,coast.x1-coast.x0,coast.y1-y,0)){rect(c,coast.x0,y,coast.x1-coast.x0,coast.y1-y,'#a09a78');for(let gx=Math.floor(Math.max(coast.x0,view.x)/44);gx<Math.ceil(Math.min(coast.x1,view.x+view.w)/44);gx++){const x=gx*44+hash(gx,7)%29;for(let yy=y+13;yy<coast.y1;yy+=31)rect(c,x+(yy%7),yy,3,1,'#b3ac86')}}}
}
function roadNear(roads,x,y){for(const road of roads){const b=roadBounds(road),r=(road.w||54)/2;if(x<b.x-r||x>b.x+b.w+r||y<b.y-r||y>b.y+b.h+r)continue;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<=r)return true}}return false}

function character(c,x,y,e,hero,clock,moving=false){const face={down:0,left:1,right:2,up:3}[e.face]??0;const variant=hero?0:e.shirt==='#5372ae'?6:e.shirt==='#a7586f'?7:1+((e.id??hash(x,y))%11);let frame=moving?1+Math.floor((e.walk||e.step||clock*7)*1.4)%4:0;if(hero&&e.weapon>0){if(e.reload>0)frame=7;else if(e.cool>.12)frame=6;else frame=moving?frame:5}
 c.save();c.globalAlpha=.4;c.fillStyle='#080f25';c.beginPath();c.ellipse(x+2,y+9,9,3,0,0,Math.PI*2);c.fill();c.restore();c.drawImage(images.characters,frame*32,(variant*4+face)*40,32,40,Math.round(x-16),Math.round(y-25),32,40);
 if(hero&&e.weapon>1&&clock-(e.lastShot??-100)<.09){const a=e.angle||0,fx=x+Math.sin(a)*17,fy=y-Math.cos(a)*17;polygon(c,[[fx-4,fy],[fx,fy-5],[fx+4,fy],[fx,fy+5]],'#ffde99');rect(c,fx-1,fy-1,3,3,'#fff0c0')}
 if(hero){rect(c,x-3,y+12,6,1,'#8eecdd');if(e.reload>0){rect(c,x-10,y-28,20,2,'#26324c');rect(c,x-10,y-28,20*Math.max(0,1-e.reload/1.2),2,'#f3d49c')}}
}
function vehicle(c,x,y,v){let dir=((Math.round((v.angle||0)/(Math.PI/8))%16)+16)%16;let index=v.kind==='police'?7:hash((v.color||'pink').split('').reduce((a,k)=>a+k.charCodeAt(0),0))%7;c.save();c.globalAlpha=.5;c.fillStyle='#091020';c.beginPath();c.ellipse(x+3,y+10,17,11,0,0,Math.PI*2);c.fill();c.restore();c.drawImage(images.vehicles,dir*64,index*64,64,64,Math.round(x-32),Math.round(y-32),64,64)}
const glowCache=new Map();
function glow(c,x,y,r,col,power){let im=glowCache.get(col);if(!im){im=document.createElement('canvas');im.width=im.height=128;let q=im.getContext('2d'),g=q.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,col);g.addColorStop(.25,col+'a0');g.addColorStop(1,col+'00');q.fillStyle=g;q.fillRect(0,0,128,128);glowCache.set(col,im)}c.globalAlpha=power;c.drawImage(im,Math.round(x-r),Math.round(y-r),r*2,r*2);c.globalAlpha=1}
function atmosphere(c,{clock=0,hour=12,weather='CLEAR',camera={x:0,y:0},W,H,cars=[],police=[],world}){
 const night=hour<5?1:hour<8?(8-hour)/3:hour>17?Math.min(1,(hour-17)/4):0,index=selectLighting(world);
 c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';
 const shade=lighting.ambient.day+(lighting.ambient.night-lighting.ambient.day)*night;
 if(shade>0){c.globalAlpha=shade;rect(c,0,0,W,H,lighting.ambient.color);c.globalAlpha=1}
 // Emitters have short falloffs and activate at dusk. Daytime keeps the exact
 // terrain pixels; nearby lamps do not combine into a city-wide screen bloom.
 if(night>0){c.save();c.globalCompositeOperation='screen';
 for(let gx=Math.floor((camera.x-64)/256);gx<=Math.floor((camera.x+W+64)/256);gx++)for(let gy=Math.floor((camera.y-64)/256);gy<=Math.floor((camera.y+H+64)/256);gy++)for(const l of index.grid.get(`${gx},${gy}`)||[]){
  const lamp=l.kind==='lamp',r=lamp?lighting.streetlight.radius:Math.min(lighting.neon.maxRadius,l.r*lighting.neon.radiusScale),x=l.x-camera.x,y=l.y-camera.y;if(x<-r||x>W+r||y<-r||y>H+r)continue;
  const flicker=lamp?1:1-Math.max(0,Math.sin(clock*1.8+l.seed)-.98)*2,power=night*l.power*(lamp?lighting.streetlight.intensity:lighting.neon.intensity)*flicker;
  glow(c,x,y,r,l.color,power);glow(c,x,y,lighting.neon.coreRadius,l.color,night*l.power*lighting.neon.coreIntensity);
  if(weather==='RAIN'){c.globalAlpha=night*lighting.weather.reflectionIntensity*l.power;for(let i=0;i<5;i++){const yy=y+7+i*3,ww=12-i*1.7;rect(c,x-ww/2+Math.sin(clock*3+i+l.seed)*2,yy,ww,1,l.color)}c.globalAlpha=1}
 }
 c.restore()}
 if(night>.04||weather==='RAIN')for(const v of [...cars,...police]){const x=v.x-camera.x,y=v.y-camera.y;if(x<-70||x>W+70||y<-70||y>H+70)continue;c.save();c.translate(x,y);c.rotate(v.angle||0);c.globalCompositeOperation='screen';c.globalAlpha=lighting.vehicle.intensity*(night||.35);const grad=c.createLinearGradient(0,-18,0,-lighting.vehicle.beamLength);grad.addColorStop(0,'#f8e6b7');grad.addColorStop(1,'#f8e6b700');polygon(c,[[-6,-18],[-lighting.vehicle.beamWidth,-lighting.vehicle.beamLength],[lighting.vehicle.beamWidth,-lighting.vehicle.beamLength],[6,-18]],grad);c.globalAlpha=1;for(const dx of [-7,7]){glow(c,dx,-20,lighting.vehicle.lampRadius,'#f9ddae',.2*night);glow(c,dx,20,lighting.vehicle.lampRadius,'#ef698a',.17*night)}if(v.kind==='police'&&night>0)glow(c,0,0,lighting.vehicle.policeRadius,Math.sin(clock*12)>0?'#f1689c':'#7294f5',.32*night);c.restore()}
 if(weather==='RAIN'){c.strokeStyle=`rgba(168,190,214,${lighting.weather.rainOpacity})`;c.lineWidth=1;c.beginPath();for(let k=0;k<100;k++){const x=((k*91+clock*102)%(W+90))-40,y=((k*137+clock*382)%(H+60))-30;c.moveTo(x,y);c.lineTo(x-3,y+10)}c.stroke();for(let k=0;k<20;k++){const x=hash(k,8)%W,y=hash(k,9)%H,phase=(clock*1.5+k*.13)%1;c.strokeStyle=`rgba(147,195,213,${(1-phase)*.16})`;c.beginPath();c.ellipse(x,y,phase*7,phase*2,0,0,Math.PI*2);c.stroke()}}
 // Only explicitly selected MIST creates fog; rain never selects a fog filter.
 if(weather==='MIST'){c.globalAlpha=lighting.weather.mistOpacity;const fog=c.createLinearGradient(0,0,W,H);fog.addColorStop(0,'#aebcbe');fog.addColorStop(.5,'#8eaaa428');fog.addColorStop(1,'#a0b6bf');rect(c,0,0,W,H,fog);c.globalAlpha=1}
 if(night>0&&lighting.shadows.nightVignette>0){const vignette=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.7);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,`rgba(0,0,0,${lighting.shadows.nightVignette*night})`);rect(c,0,0,W,H,vignette)}
 c.restore();
}

function interior(c,key,name,W,H){const club=key==='club',hotel=['hotel','motel'].includes(key),gun=key==='armory',arcade=key==='arcade',clinic=key==='clinic',industrial=['warehouse','radio','observatory'].includes(key);const accent=club?'#be93ea':gun?'#89dfd6':hotel?'#eba8b6':clinic?'#9cc9ca':'#e7c18e';
 rect(c,0,0,W,H,'#101528');material(c,industrial?'concrete':hotel?'wood':'tile',46,66,W-92,H-100);material(c,industrial?'metal':'brick-blue',30,25,W-60,47);rect(c,30,25,W-60,3,'#7d7b92');rect(c,30,66,W-60,7,'#171d34');rect(c,30,72,16,H-98,'#262b43');rect(c,W-46,72,16,H-98,'#262b43');rect(c,30,H-30,W-60,6,'#090f22');rect(c,55,H-33,W-110,2,accent);
 for(let x=78;x<W-80;x+=115){sprite(c,hotel?'window-warm':'window',x,34,40,28);glow(c,x+20,70,53,accent,.13)}
 rect(c,284,29,232,28,'#17243be8');rect(c,284,29,232,1,accent);label(c,name,230,50,340,accent,16);
 // Keep furniture in the original collision footprints and leave the central mission approach clear.
 if(hotel){sprite(c,'sofa',90,112,136,68);sprite(c,'planter',72,158,38,40);sprite(c,'terminal',278,251,56,44);sprite(c,'table',492,264,92,40);furniture(c,key==='motel'?'bed':'counter',key==='motel'?520:490,105,key==='motel'?122:150,65);label(c,'RECEPTION / VIOLET',470,96,230,accent,9);material(c,'tile',340,80,110,291);rect(c,346,84,98,280,'#73546844');for(let y=90;y<360;y+=20)rect(c,349,y,92,1,'#b5837840')}
 else if(gun){furniture(c,'gunrack',88,104,142,80);material(c,'wood',484,266,124,24);sprite(c,'terminal',548,103,55,46);for(let x=275;x<355;x+=25){rect(c,x,251,20,44,'#59576a');rect(c,x+3,254,14,1,'#c5ae8b')}label(c,'LICENSED / NO REFUNDS',460,91,230,accent,10)}
 else if(arcade){furniture(c,'arcade',90,110,136,72);furniture(c,'arcade',490,102,125,60);sprite(c,'sofa',274,251,76,44);sprite(c,'table',490,265,110,30);label(c,'INSERT COIN / LOSE TIME',480,90,230,accent,10)}
 else if(clinic){sprite(c,'bed',90,110,130,70);sprite(c,'bed',490,105,122,58);sprite(c,'terminal',276,252,65,40);rect(c,561,267,27,23,'#c6d9c9');rect(c,571,270,6,17,'#b76b86');rect(c,565,276,18,5,'#b76b86');label(c,'WALK IN / WALK OUT',470,92,230,accent,10)}
 else if(club){sprite(c,'sofa',90,110,136,70);sprite(c,'table',274,252,74,42);material(c,'metal',485,267,122,25);furniture(c,'mixer',490,103,124,56);rect(c,298,188,168,58,'#343046');for(let x=300;x<460;x+=20)for(let y=190;y<245;y+=18)rect(c,x,y,17,15,((x+y)/2)%3?'#8766a65a':'#62bcb55a');label(c,'THE LAST GOOD NIGHT',470,90,230,accent,10)}
 else if(industrial){furniture(c,'crates',94,110,130,72);sprite(c,'terminal',276,253,67,40);sprite(c,'terminal',530,105,65,45);material(c,'metal',490,267,110,25);label(c,'STAFF ONLY / MERIDIAN',470,92,230,accent,10)}
 else{sprite(c,'table',92,120,70,54);sprite(c,'table',165,120,62,54);sprite(c,'sofa',275,252,76,40);sprite(c,'table',492,265,108,34);sprite(c,'vending',548,101,36,55);label(c,'LOCAL BUSINESS / OPEN LATE',470,90,230,accent,10)}
 rect(c,370,H-51,60,23,'#262f49');rect(c,370,H-51,60,1,accent);label(c,'EXIT [E]',370,H-35,60,accent,10);
}
function portrait(canvas,speaker,expression=0){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,64,80);const name=speaker.toUpperCase(),index=name.includes('VEE')?0:name==='YOU'?1:name.includes('JAX')?2:name.includes('ROXY')?3:name.includes('SOL')?4:5;c.drawImage(images.portraits,index*64,expression*80,64,80,0,0,64,80)}
return {furniture,roomSolids,portrait,ready,bakeTerrain,character,vehicle,atmosphere,interior,sprite,glow,palettes,lighting,rebuildLighting,getLightingDiagnostics};
})();
