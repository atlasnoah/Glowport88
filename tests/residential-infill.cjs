'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),GlowportResidential=require('../Glowport88/assets/residential-infill.js'),GlowportRestoredCity=require('../Glowport88/assets/restored-city.js');
const html=fs.readFileSync(path.join(root,'Glowport88/Glowport88_ArtRehaul_v11.html'),'utf8'),begin=html.indexOf('const W=800'),end=html.indexOf('const terrain=GlowportTerrain.create',begin),ctx={console,GlowportResidential,GlowportRestoredCity};
assert(begin>=0&&end>begin);vm.runInNewContext(html.slice(begin,end)+'\nglobalThis.city=cityLayout;',ctx);const city=ctx.city,buildings=city.buildings,options={landmarks:city.landmarks,roadXs:city.roadXs,roadYs:city.roadYs};
GlowportResidential.apply(buildings,{...options,limit:0});
const originals=buildings.slice(),originalKeys=buildings.map(b=>Object.keys(b)),landmarkRefs=buildings.map(b=>b.landmark),legacy=()=>JSON.stringify(buildings.map(b=>Object.fromEntries(Object.entries(b).filter(([key])=>key!=='residentialVariant'&&key!=='landmark')))),before=legacy(),roads=JSON.stringify(city.roads),environment=JSON.stringify({trees:city.trees,debris:city.debris,lamps:city.streetlights}),passed=[];
function check(name,fn){fn();passed.push(name);console.log('PASS controlled residential infill:',name)}
let initial,refined;
check('Stage B changes exactly four facades in four established city blocks',()=>{
 initial=GlowportResidential.apply(buildings,{...options,limit:4});assert.equal(initial.count,4);assert.equal(initial.sites.length,4);assert.equal(initial.blocks.length,4);assert(initial.blocks.every(b=>b.count===1));assert.equal(new Set(initial.sites.map(s=>s.district)).size,4);assert.equal(new Set(initial.sites.map(s=>s.variant)).size,4);assert.equal(buildings.filter(b=>b.residentialVariant!==undefined).length,4);
 for(const block of initial.blocks){assert.equal(block.w,360);assert.equal(block.h,340);assert(city.roadXs.includes(block.x)&&city.roadYs.includes(block.y));assert.equal(block.cx,block.x+block.w/2);assert.equal(block.cy,block.y+block.h/2)}
});
check('Stage C refines only those same four blocks and preserves the initial facades',()=>{
 refined=GlowportResidential.apply(buildings,{...options,limit:16});assert.equal(refined.count,16);assert.equal(refined.blocks.length,4);assert(refined.blocks.every(b=>b.count===4));assert.deepEqual(refined.sites.slice(0,4),initial.sites);assert.equal(new Set(refined.sites.map(s=>s.id)).size,16);assert.equal(buildings.filter(b=>b.residentialVariant!==undefined).length,16);
 for(const block of refined.blocks){const sites=refined.sites.filter(s=>s.block===block.id);assert.equal(new Set(sites.map(s=>s.variant)).size,4);assert(sites.every(s=>s.x>block.x&&s.y>block.y&&s.x+s.w<block.x+block.w&&s.y+s.h<block.y+block.h))}
});
check('all 808 original buildings, properties, footprints and roads remain unchanged',()=>{
 assert.equal(buildings.length,808);assert.equal(legacy(),before);assert.equal(JSON.stringify(city.roads),roads);assert.equal(JSON.stringify({trees:city.trees,debris:city.debris,lamps:city.streetlights}),environment);buildings.forEach((b,i)=>{assert.equal(b,originals[i]);assert.equal(b.landmark,landmarkRefs[i]);assert.deepEqual(Object.keys(b).sort(),[...originalKeys[i],...(b.residentialVariant!==undefined?['residentialVariant']:[])].sort())});
});
check('downtown and all landmark buildings are excluded and their approaches remain protected',()=>{
 for(const site of refined.sites){const b=buildings[site.index];assert(!b.landmark&&b.kind!=='landmark'&&b.district!=='core');assert.equal(b.residentialVariant,site.variant);assert.equal(b.x,site.x);assert.equal(b.y,site.y);assert.equal(b.w,site.w);assert.equal(b.h,site.h);for(const l of city.landmarks){assert(Math.hypot(b.x+b.w/2-l.x,b.y+b.h/2-l.y)>=320);assert(Math.hypot(b.doorX-l.x,b.doorY-l.y)>=320)}}assert(buildings.filter(b=>b.district==='core'||b.landmark).every(b=>b.residentialVariant===undefined));
});
check('selection is deterministic, bounded and does not consume random numbers',()=>{
 const serialized=JSON.stringify(refined),random=Math.random;Math.random=()=>{throw Error('Residential facade selection must not consume game RNG')};try{assert.equal(JSON.stringify(GlowportResidential.apply(buildings,{...options,limit:16})),serialized);assert.equal(GlowportResidential.apply(buildings,{...options,limit:99}).count,16);assert.equal(GlowportResidential.apply(buildings,{...options,limit:1}).count,1);assert.equal(GlowportResidential.apply(buildings,{...options,limit:-10}).count,0);assert.equal(GlowportResidential.apply(buildings,options).count,4)}finally{Math.random=random}
});
check('reducing a stage restores unselected facades rather than accumulating houses',()=>{
 GlowportResidential.apply(buildings,{...options,limit:16});const four=GlowportResidential.apply(buildings,{...options,limit:4});assert.deepEqual(four.sites,initial.sites);assert.equal(buildings.filter(b=>b.residentialVariant!==undefined).length,4);const zero=GlowportResidential.apply(buildings,{...options,limit:0});assert.equal(zero.count,0);assert.equal(zero.blocks.length,0);assert(buildings.every(b=>b.residentialVariant===undefined));assert.equal(legacy(),before);
});
check('all selected original facade entrances retain walking and vehicle access',()=>{
 refined=GlowportResidential.apply(buildings,{...options,limit:16});const hotel=city.landmarks.find(l=>l.key==='hotel');for(const site of refined.sites){const door={x:site.doorX,y:site.doorY};assert(!city.collision.solid(door.x,door.y,9));for(const vehicle of[false,true]){const ps=city.navigation.route(door,hotel,{vehicle});assert(ps?.length>=2);for(let i=1;i<ps.length;i++)assert(city.collision.clearLine(ps[i-1],ps[i],vehicle?19:9))}}
});
const result={time:new Date().toISOString(),passed,buildingCount:buildings.length,affectedBuildingFraction:16/buildings.length,affectedBlocks:4,totalOriginalBlocks:(city.roadXs.length-1)*(city.roadYs.length-1),initial,refined,scope:'Actual restored 808-building host generation, metadata-only four-facade initial pass and sixteen-facade refinement, exact legacy-property/road/terrain retention and selected entrance collision routes.'};fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/residential-infill-results.json'),JSON.stringify(result,null,2)+'\n');console.log(`${passed.length} controlled residential infill checks passed`);
