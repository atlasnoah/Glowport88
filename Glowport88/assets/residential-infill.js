/* Controlled facade-only additions to the recovered Glowport city.
 * Selection never creates lots, changes footprints, or consumes the city's RNG. */
(function(global){
'use strict';
const variantnames=Object.freeze(['Illustrated bungalow','Illustrated duplex','Victorian urban house','Mid-century house with garage']);
const neighborhoods=Object.freeze([
 Object.freeze({district:'west',x:1500,y:2800}),
 Object.freeze({district:'north',x:4400,y:1100}),
 Object.freeze({district:'south',x:3450,y:4000}),
 Object.freeze({district:'east',x:6500,y:1500})
]);
function apply(buildings,options={}){
 const {landmarks=[],roadXs=[],roadYs=[]}=options,limit=Number.isFinite(Number(options.limit))?Math.max(0,Math.min(16,Math.floor(Number(options.limit)))):4;
 const empty=()=>({count:0,limit,sites:[],blocks:[],variantnames:[...variantnames]});
 if(!Array.isArray(buildings))return empty();
 // The annotation belongs to this controlled pass. Reapplying a smaller stage
 // must restore the other facades rather than accumulating replacements.
 for(const b of buildings)if(Object.prototype.hasOwnProperty.call(b,'residentialVariant'))delete b.residentialVariant;
 if(!limit||roadXs.length<2||roadYs.length<2)return empty();
 const groups=new Map();
 function between(values,n){for(let i=0;i<values.length-1;i++)if(n>values[i]&&n<values[i+1])return i;return -1}
 buildings.forEach((b,index)=>{
  if(b.landmark||b.kind==='landmark'||b.district==='core'||!neighborhoods.some(n=>n.district===b.district))return;
  const cx=b.x+b.w/2,cy=b.y+b.h/2,ix=between(roadXs,cx),iy=between(roadYs,cy);
  if(ix<0||iy<0||landmarks.some(l=>Math.hypot(cx-l.x,cy-l.y)<320||Math.hypot(b.doorX-l.x,b.doorY-l.y)<320))return;
  const key=b.district+':'+ix+':'+iy;
  if(!groups.has(key))groups.set(key,{key,district:b.district,ix,iy,x:roadXs[ix],y:roadYs[iy],w:roadXs[ix+1]-roadXs[ix],h:roadYs[iy+1]-roadYs[iy],candidates:[]});
  groups.get(key).candidates.push({b,index,cx,cy});
 });
 const selected=[];
 for(const target of neighborhoods){
  const candidates=[...groups.values()].filter(group=>group.district===target.district&&group.candidates.length>=4);
  candidates.sort((a,b)=>Math.hypot(a.x+a.w/2-target.x,a.y+a.h/2-target.y)-Math.hypot(b.x+b.w/2-target.x,b.y+b.h/2-target.y)||a.iy-b.iy||a.ix-b.ix);
  if(!candidates.length)continue;
  const block=candidates[0];block.candidates.sort((a,b)=>Number(b.b.kind==='homes')-Number(a.b.kind==='homes')||Math.hypot(a.cx-target.x,a.cy-target.y)-Math.hypot(b.cx-target.x,b.cy-target.y)||a.index-b.index);
  selected.push(block);
 }
 const result=empty();
 // Stage B selects one facade in each of four existing blocks. Later rounds
 // refine only those same blocks, retaining the initial four selections.
 for(let round=0;round<4;round++)for(let neighborhood=0;neighborhood<selected.length;neighborhood++){
  if(result.sites.length>=limit)break;
  const block=selected[neighborhood],candidate=block.candidates[round],b=candidate.b,variant=(neighborhood+round)%variantnames.length;
  b.residentialVariant=variant;
  result.sites.push({id:'residential-'+candidate.index,index:candidate.index,x:b.x,y:b.y,w:b.w,h:b.h,doorX:b.doorX,doorY:b.doorY,variant,district:b.district,block:block.key,blockcenter:{x:block.x+block.w/2,y:block.y+block.h/2}});
 }
 result.blocks=selected.filter(block=>result.sites.some(site=>site.block===block.key)).map(block=>({id:block.key,district:block.district,ix:block.ix,iy:block.iy,x:block.x,y:block.y,w:block.w,h:block.h,cx:block.x+block.w/2,cy:block.y+block.h/2,count:result.sites.filter(site=>site.block===block.key).length}));
 result.count=result.sites.length;
 return result;
}
global.GlowportResidential=Object.freeze({apply,variantnames});
if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportResidential;
})(typeof window!=='undefined'?window:globalThis);
