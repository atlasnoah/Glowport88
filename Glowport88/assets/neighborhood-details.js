/* Small, deterministic architectural selections inside the recovered city.
 * This module annotates existing facades only: it creates no world geometry,
 * consumes no game RNG, adds no lights and changes no interactive entrances. */
(function(global){
'use strict';
const hash=(x,y=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0};
const profiles=Object.freeze({
 residential:Object.freeze({pedestrians:.65,traffic:.7}),
 older:Object.freeze({pedestrians:.8,traffic:.8}),
 mixed:Object.freeze({pedestrians:1,traffic:1}),
 commercial:Object.freeze({pedestrians:1.3,traffic:1.15}),
 industrial:Object.freeze({pedestrians:.45,traffic:.9})
});
const plans=Object.freeze([
 {district:'west',kind:'residential',x:1500,y:2800,blocks:2},
 {district:'north',kind:'residential',x:4400,y:1100,blocks:2},
 {district:'south',kind:'residential',x:3450,y:4000,blocks:2},
 {district:'east',kind:'residential',x:6500,y:1500,blocks:2},
 {district:'east',kind:'industrial',x:6200,y:3150,blocks:3},
 {district:'west',kind:'mixed',x:2000,y:3200,blocks:1},
 {district:'south',kind:'mixed',x:4500,y:3850,blocks:1},
 {district:'north',kind:'mixed',x:2900,y:1250,blocks:1},
 {district:'west',kind:'older',x:850,y:2350,blocks:1},
 {district:'east',kind:'older',x:5600,y:1850,blocks:1},
 {district:'core',kind:'commercial',x:3200,y:1900,blocks:1},
 {district:'core',kind:'commercial',x:4500,y:2500,blocks:1}
]);
const names=Object.freeze({
 residential:['PALM COURT','SUNSET FLATS','CRESCENT HOMES','BAYVIEW COURT'],
 industrial:['EASTSIDE AUTO','FREIGHT & STORAGE','BAY MACHINERY','DOCK REPAIRS'],
 mixed:['CORNER MARKET','UPSTAIRS FLATS','NIGHT NOODLES','RADIO REPAIR'],
 older:['CEDAR ROOMS','OLD PALM FLATS','88 CORNER STORE','EASTSIDE ROOMS'],
 commercial:['NIGHT OFFICE','VIOLET DINING','NEON SAVINGS','MIDNIGHT HOTEL']
});
function between(values,n){for(let i=0;i<values.length-1;i++)if(n>values[i]&&n<values[i+1])return i;return -1}
function apply(buildings,options={}){
 const {roadXs=[],roadYs=[],landmarks=[]}=options,sites=[],blocks=[],props=[],counts={},groups=new Map();
 // Only this pass's metadata is removed. Existing residentialVariant and every
 // historical building property remain owned by their original systems.
 if(Array.isArray(buildings))for(const b of buildings)delete b.neighborhoodDetail;
 if(Array.isArray(buildings)&&roadXs.length>1&&roadYs.length>1)buildings.forEach((b,index)=>{
  if(b.landmark||b.kind==='landmark'||Number.isInteger(b.residentialVariant))return;
  const cx=b.x+b.w/2,cy=b.y+b.h/2,ix=between(roadXs,cx),iy=between(roadYs,cy);
  if(ix<0||iy<0||b.w<58||b.h<56||landmarks.some(l=>Math.hypot(cx-l.x,cy-l.y)<360||Math.hypot(b.doorX-l.x,b.doorY-l.y)<360))return;
  const key=b.district+':'+ix+':'+iy;
  if(!groups.has(key))groups.set(key,{id:key,district:b.district,ix,iy,x:roadXs[ix],y:roadYs[iy],w:roadXs[ix+1]-roadXs[ix],h:roadYs[iy+1]-roadYs[iy],cx:(roadXs[ix]+roadXs[ix+1])/2,cy:(roadYs[iy]+roadYs[iy+1])/2,candidates:[]});
  groups.get(key).candidates.push({b,index});
 });
 const used=new Set(),limit=Math.max(0,Math.min(72,Number.isFinite(options.limit)?Math.floor(options.limit):72));
 for(const plan of plans){
  const choices=[...groups.values()].filter(g=>g.district===plan.district&&!used.has(g.id)&&g.candidates.length>=4);
  choices.sort((a,b)=>Math.hypot(a.cx-plan.x,a.cy-plan.y)-Math.hypot(b.cx-plan.x,b.cy-plan.y)||a.iy-b.iy||a.ix-b.ix);
  for(const source of choices.slice(0,plan.blocks)){
   if(sites.length>=limit)break;
   used.add(source.id);const block={id:source.id,district:source.district,ix:source.ix,iy:source.iy,x:source.x,y:source.y,w:source.w,h:source.h,cx:source.cx,cy:source.cy,kind:plan.kind,count:0};blocks.push(block);
   // Four compact existing facades make the purpose of a block legible without
   // changing its parcel dimensions, density or street connections.
   source.candidates.sort((a,b)=>a.b.y-b.b.y||a.b.x-b.b.x||a.index-b.index);
   for(const [style,{b,index}]of source.candidates.slice(0,4).entries()){
    if(sites.length>=limit)break;
    const seed=hash(b.x,b.y),kind=plan.kind;let sheet='neighborhoods-illustrated',cell=0,design;
    if(kind==='residential'){
     if(style===3){cell=0;design='Low-rise apartments'}
     else{sheet='residential-illustrated';cell=(style+source.ix+source.iy)%4;design=['Porch bungalow','Urban duplex','Victorian townhouse','Mid-century garage house'][cell]}
    }else if(kind==='industrial'){sheet=style===1||style===2?'buildings-illustrated':'neighborhoods-illustrated';cell=5;design=['Auto workshop','Freight depot','Storage warehouse','Utility workshop'][style]}
    else if(kind==='mixed'){cell=[0,1,2,4][style];design=['Apartments above shops','Corner grocer','Neighborhood restaurant','Small repair business'][style]}
    else if(kind==='older'){cell=[0,0,4,0][style];design=['Older apartments','Weathered flats','Older corner store','Working-class apartments'][style]}
    else{cell=[1,2,3,4][style];design=['Office storefront','Late-night restaurant','Neon lounge','Local bank office'][style]}
    const detail={kind,sheet,cell,style,design,displayName:names[kind][style],block:source.id,props:[]};
    const add=(type,x,y,w,h)=>{
     const prop={id:'neighborhood-'+index+'-'+type,type,x:Math.round(x),y:Math.round(y),w,h,building:index,kind};
     // Decorations stay inside the pre-existing impassable footprint. They can
     // never create a new invisible obstacle or obstruct a sidewalk/door.
     if(prop.x<b.x||prop.y<b.y||prop.x+w>b.x+b.w||prop.y+h>b.y+b.h)return;
     if(Math.abs(prop.x+w/2-b.doorX)<24&&prop.y+h>b.y+b.h-25)return;
     detail.props.push(prop);props.push(prop);
    };
    if(kind==='industrial'){
     add(style%2?'crates':'dumpster',b.x+4,b.y+b.h-18,15,14);add('ac',b.x+b.w-24,b.y+9,17,13);
    }else if(kind==='older'){
     add(style%2?'dumpster':'planter',b.x+4,b.y+b.h-17,12,13);add('weathering',b.x+b.w-26,b.y+b.h-24,17,13);
    }else if(kind==='residential'){
     add(style===3?'planter':'mailbox',b.x+4,b.y+b.h-15,10,12);add(style===3?'ac':'fence',b.x+b.w-27,b.y+(style===3?8:b.h-7),20,style===3?15:5);
    }else{
     add(style%2?'vending':'bench',b.x+4,b.y+b.h-17,16,14);add(style%2?'ac':'planter',b.x+b.w-24,b.y+8,16,14);
    }
    b.neighborhoodDetail=detail;block.count++;counts[kind]=(counts[kind]||0)+1;
    sites.push({id:'neighborhood-'+index,index,x:b.x,y:b.y,w:b.w,h:b.h,doorX:b.doorX,doorY:b.doorY,renderBounds:{x:b.x-3,y:b.y-3,w:b.w+6,h:b.h+20},district:b.district,block:source.id,kind,sheet,cell,style,design,props:detail.props.map(p=>({...p}))});
   }
  }
 }
 // The sixteen previously approved homes also keep their quieter street
 // character; they need no visual annotation or replacement in this update.
 const originalHomes=new Map();
 if(Array.isArray(buildings))for(const b of buildings)if(Number.isInteger(b.residentialVariant)){
  const ix=between(roadXs,b.x+b.w/2),iy=between(roadYs,b.y+b.h/2);if(ix<0||iy<0)continue;
  const id=b.district+':'+ix+':'+iy;originalHomes.set(id,{id,district:b.district,kind:'residential',x:roadXs[ix],y:roadYs[iy],w:roadXs[ix+1]-roadXs[ix],h:roadYs[iy+1]-roadYs[iy],cx:(roadXs[ix]+roadXs[ix+1])/2,cy:(roadYs[iy]+roadYs[iy+1])/2});
 }
 const activityBlocks=[...blocks,...originalHomes.values()];
 function classify(x,y,district){
  // A road takes its activity character from the closest selected block; the
  // classifier never changes the game's actual district boundaries.
  const nearby=activityBlocks.filter(b=>x>=b.x-55&&x<=b.x+b.w+55&&y>=b.y-55&&y<=b.y+b.h+55).sort((a,b)=>Math.hypot(x-a.cx,y-a.cy)-Math.hypot(x-b.cx,y-b.cy)||a.id.localeCompare(b.id));
  if(nearby.length)return nearby[0].kind;
  return district==='core'?'commercial':district==='east'?'industrial':district==='north'?'residential':'mixed';
 }
 return{count:sites.length,limit,sites,blocks,props,counts,profiles,classify,activityBlocks};
}
global.GlowportNeighborhoods=Object.freeze({apply,profiles});
if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportNeighborhoods;
})(typeof window!=='undefined'?window:globalThis);
