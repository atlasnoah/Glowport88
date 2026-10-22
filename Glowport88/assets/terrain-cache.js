/* Bounded city terrain surfaces for mobile browsers. Rendering and collision share the rebuilt world coordinates;
 * offscreen backing stores remain bounded independently of city detail. */
window.GlowportTerrain=(()=>{
'use strict';
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
function create({world,bake,tileSize=1024,maxTiles=6}={}){
 if(!world||!Number.isFinite(world.MW)||!Number.isFinite(world.MH)||world.MW<=0||world.MH<=0||typeof bake!=='function')throw new TypeError('Terrain cache needs a world and its renderer.');
 const size=Math.max(64,Math.min(1024,Math.floor(finite(tileSize,1024))));
 const limit=Math.max(1,Math.min(12,Math.floor(finite(maxTiles,6))));
 const tiles=new Map();
 const stats={draws:0,hits:0,bakes:0,evictions:0,residentBytes:0,peakResidentBytes:0,totalBakeMs:0,maxBakeMs:0,lastBakeMs:0};
 const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
 function release(tile){stats.residentBytes-=tile.width*tile.height*4;tile.canvas.width=0;tile.canvas.height=0;}
 function get(column,row){
  const key=column+','+row;
  if(tiles.has(key)){const tile=tiles.get(key);tiles.delete(key);tiles.set(key,tile);stats.hits++;return tile;}
  // Evict before allocating, so even temporary live surfaces respect the budget.
  while(tiles.size>=limit){const oldest=tiles.keys().next().value;release(tiles.get(oldest));tiles.delete(oldest);stats.evictions++;}
  const x=column*size,y=row*size,width=Math.min(size,world.MW-x),height=Math.min(size,world.MH-y);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context){canvas.width=0;canvas.height=0;throw new Error('The browser could not allocate a city terrain tile.');}
  context.imageSmoothingEnabled=false;
  context.setTransform(1,0,0,1,-x,-y);
  const started=now();
  try{
   // Keep the complete world object: its stable lighting index also includes
   // sources outside this particular clipped surface.
   bake(context,world);
  }catch(error){canvas.width=0;canvas.height=0;throw error;}
  context.setTransform(1,0,0,1,0,0);
  const elapsed=now()-started;
  stats.bakes++;stats.lastBakeMs=elapsed;stats.totalBakeMs+=elapsed;stats.maxBakeMs=Math.max(stats.maxBakeMs,elapsed);
  const tile={canvas,x,y,width,height};tiles.set(key,tile);
  stats.residentBytes+=width*height*4;stats.peakResidentBytes=Math.max(stats.peakResidentBytes,stats.residentBytes);
  return tile;
 }
 function draw(context,cameraX,cameraY,viewWidth,viewHeight){
  if(!context||typeof context.drawImage!=='function')throw new TypeError('Terrain draw needs a 2D destination context.');
  const cx=Math.round(finite(cameraX,0)),cy=Math.round(finite(cameraY,0));
  const width=Math.max(0,Math.floor(finite(viewWidth,0))),height=Math.max(0,Math.floor(finite(viewHeight,0)));
  const left=Math.max(0,cx),top=Math.max(0,cy),right=Math.min(world.MW,cx+width),bottom=Math.min(world.MH,cy+height);
  if(right<=left||bottom<=top)return;
  stats.draws++;context.imageSmoothingEnabled=false;
  for(let row=Math.floor(top/size);row<=Math.floor((bottom-1)/size);row++)for(let column=Math.floor(left/size);column<=Math.floor((right-1)/size);column++){
   const tile=get(column,row),x=Math.max(left,tile.x),y=Math.max(top,tile.y),w=Math.min(right,tile.x+tile.width)-x,h=Math.min(bottom,tile.y+tile.height)-y;
   // Integer source/destination rectangles avoid fractional filtering at seams.
   context.drawImage(tile.canvas,x-tile.x,y-tile.y,w,h,x-cx,y-cy,w,h);
  }
 }
 function clear(){for(const tile of tiles.values())release(tile);tiles.clear();stats.residentBytes=0;}
 function diagnostics(){return {...stats,tileSize:size,maxTiles:limit,cachedTiles:tiles.size,maxSurfacePixels:size*size,estimatedResidentMiB:stats.residentBytes/1048576,tiles:[...tiles].map(([key,tile])=>({key,x:tile.x,y:tile.y,width:tile.width,height:tile.height}))};}
 return {draw,clear,diagnostics};
}
return {create};
})();
