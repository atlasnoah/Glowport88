'use strict';
// Presentation is powerless to change damage. Tactical motion uses the same
// swept-body collision geometry as the existing city rather than teleporting.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create,weaponStyles}=require('../Glowport88/assets/combat-feedback.js');
const {create:createCity}=require('../Glowport88/assets/restored-city.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts'),passed=[];
function check(name,run){run();passed.push(name);console.log('PASS combat feel:',name)}
function canvas(){const calls=[];return{calls,save(){calls.push(['save'])},restore(){calls.push(['restore'])},beginPath(){calls.push(['begin'])},moveTo(...args){calls.push(['move',...args])},lineTo(...args){calls.push(['line',...args])},stroke(){calls.push(['stroke'])},fillRect(...args){calls.push(['rect',...args])},fillText(...args){calls.push(['text',...args])}}}
const box={x:180,y:100,w:80,h:100};
function fixture(){
 const city=createCity({MW:800,MH:600,buildings:[box],roads:[],segments:[]}),solid=city.collision.solid,clear=city.collision.clearLine;
 const route=(from,to,r=10)=>{
  const points=[from,to,{x:box.x-15,y:box.y-15},{x:box.x+box.w+15,y:box.y-15},{x:box.x-15,y:box.y+box.h+15},{x:box.x+box.w+15,y:box.y+box.h+15}],costs=points.map(()=>Infinity),previous=points.map(()=>-1),todo=new Set(points.map((_,i)=>i));costs[0]=0;
  while(todo.size){let id=-1;for(const i of todo)if(id<0||costs[i]<costs[id])id=i;if(!Number.isFinite(costs[id]))break;todo.delete(id);if(id===1)break;for(const other of todo)if(clear(points[id],points[other],r)){const next=costs[id]+Math.hypot(points[id].x-points[other].x,points[id].y-points[other].y);if(next<costs[other]){costs[other]=next;previous[other]=id}}}
  if(!Number.isFinite(costs[1]))return null;const result=[];for(let id=1;id>=0;id=previous[id])result.push({...points[id]});return result.reverse();
 };
 const cues=[],feedback=create({solid,clearLine:clear,route,queryBuildings:()=>[box],cue:name=>cues.push(name)});
 return{city,feedback,cues,solid,clear};
}

check('weapon feedback is distinctive without changing any weapon or victim state',()=>{
 const {feedback,cues}=fixture(),target={x:120,y:120,hp:26,stun:.15,kind:'enemy',money:10},before=JSON.stringify(target);
 assert(feedback.shot({x:80,y:120,angle:Math.PI/2,weapon:'pistol',clock:1}));assert(feedback.hit({target,damage:26,weapon:'pistol',clock:1}));assert.equal(JSON.stringify(target),before,'Presentation may not apply damage, stun, money or rewards');
 const d=feedback.diagnostics([target]);assert.equal(d.shots,1);assert.equal(d.hits,1);assert.equal(d.actors[0].maxHp,52);assert.deepEqual(cues,['hit']);assert.equal(feedback.hit({target,damage:0}),false);assert.equal(feedback.hit({target,damage:20,confirmed:false}),false);assert.equal(feedback.shot({x:NaN,y:0}),false);
 assert.notDeepEqual(weaponStyles.pistol,weaponStyles.shotgun);assert.notDeepEqual(weaponStyles.smg,weaponStyles.shotgun);const c=canvas();for(const weapon of['pistol','shotgun','smg'])assert(feedback.drawBullet(c,100,100,{team:'player',weapon,vx:640,vy:0}));assert.equal(feedback.drawBullet(c,100,100,{team:'enemy',weapon:'pistol',vx:400,vy:0}),false);
});
check('confirmed health bars use actual maximum health and corpse pellets cannot duplicate a down',()=>{
 const {feedback,cues}=fixture(),enemy={x:120,y:120,hp:52,kind:'enemy'},c=canvas();feedback.drawActor(c,100,100,enemy,{showHealth:true,clock:1});assert(c.calls.some(row=>row[0]==='rect'&&row[3]===22&&row[4]===3));enemy.hp=26;feedback.hit({target:enemy,damage:26,weapon:'pistol',clock:1});const half=canvas();feedback.drawActor(half,100,100,enemy,{showHealth:true,clock:1});assert(half.calls.some(row=>row[0]==='rect'&&row[3]===11&&row[4]===3));
 const shared=canvas();feedback.draw(shared,(x,y)=>[x,y],{inside:false});feedback.drawActor(shared,enemy.x,enemy.y,enemy,{showHealth:true,clock:1});const label=shared.calls.find(row=>row[0]==='text'&&row[1]==='26'),bar=shared.calls.find(row=>row[0]==='rect'&&row[3]===24&&row[4]===5);assert(label&&bar&&label[3]<bar[2]-5,'Damage label must remain visibly above the health bar');
 enemy.hp=-1;feedback.hit({target:enemy,damage:27,weapon:'shotgun',clock:1.2});assert.equal(feedback.hit({target:enemy,damage:17,weapon:'shotgun',clock:1.2}),false);assert.equal(feedback.diagnostics().downs,1);assert.deepEqual(cues,['hit','down']);
 const flashed=canvas(),expired=canvas();feedback.drawActor(flashed,100,100,enemy,{clock:1.21});feedback.drawActor(expired,100,100,enemy,{clock:1.4});assert(flashed.calls.some(row=>row[0]==='stroke'));assert(!expired.calls.some(row=>row[0]==='stroke'),'Flash expires even on an actor without movement updates');
});
check('effects, muzzle flashes and hit cues remain bounded and pause on simulation time',()=>{
 const {feedback,cues}=fixture();for(let i=0;i<1500;i++){feedback.shot({x:100,y:100,angle:.2,weapon:'smg',clock:10});feedback.hit({target:{x:100,y:100,hp:10},damage:1,weapon:'shotgun',clock:10})}
 let d=feedback.diagnostics();assert(d.particles<=96&&d.flashes<=24);assert(d.maxParticles<=96&&d.maxFlashes<=24);assert.equal(cues.length,1);const before=d.particles;feedback.update(0);assert.equal(feedback.diagnostics().particles,before);for(let i=0;i<20;i++)feedback.update(.1);d=feedback.diagnostics();assert.equal(d.particles,0);assert.equal(d.flashes,0);feedback.reset();assert.equal(feedback.diagnostics().hits,0);assert.equal(feedback.diagnostics().maxParticles,0);
});
check('scripted, passive, escort and protected actors cannot acquire combat movement',()=>{
 const {feedback}=fixture();for(const fields of [{passive:true},{role:'protected'},{role:'escort'},{storyActor:true},{scripted:true},{persistent:true},{_missionActor:true},{kind:'police'}]){const e={x:165,y:130,hp:52,kind:'enemy',...fields},before=JSON.stringify(e),result=feedback.steerEnemy(e,.1,{clock:1,target:{x:300,y:230},allies:[e]});assert.equal(result.handled,false);assert.equal(JSON.stringify(e),before)}
});
let coverEvidence;
check('attacking enemies use safe existing-building cover, then peek and re-engage',()=>{
 const {feedback,solid}=fixture(),enemy={x:165,y:130,hp:52,kind:'enemy',shootTimer:2.5},target={x:300,y:230,hp:120,role:'protected'},targetBefore=JSON.stringify(target),modes=new Set();let falseRun=0,maxFalse=0,maxStep=0,visibleFire=0;
 for(let i=0;i<240;i++){const before={x:enemy.x,y:enemy.y},result=feedback.steerEnemy(enemy,.05,{clock:i*.05,target,allies:[enemy]});modes.add(result.state);maxStep=Math.max(maxStep,Math.hypot(enemy.x-before.x,enemy.y-before.y));assert(!solid(enemy.x,enemy.y,10));falseRun=result.canFire?0:falseRun+.05;maxFalse=Math.max(maxFalse,falseRun);if(result.canFire&&fixture().clear(enemy,target,2))visibleFire++}
 const d=feedback.diagnostics([enemy]);assert(d.coverSelections>=1);assert(d.coverPeeks>=1);assert(modes.has('covered')&&modes.has('peeking'));assert(maxFalse<=.9,'Cover cannot withhold combat indefinitely');assert(maxStep<=3.3001,'All movement must be normal speed, never relocation');assert(visibleFire>25);assert(Math.hypot(enemy.x-target.x,enemy.y-target.y)<160);assert.equal(JSON.stringify(target),targetBefore,'Protected defend target must not be altered');coverEvidence={...d,modes:[...modes],maxStep,maxWithheldFireSeconds:maxFalse,visibleFireUpdates:visibleFire};
});
check('blocked sight selects a collision-checked route instead of remaining behind a wall',()=>{
 const {feedback,solid,clear}=fixture(),enemy={x:110,y:150,hp:52,kind:'enemy'},target={x:350,y:150};let visible=false;
 for(let i=0;i<400;i++){feedback.steerEnemy(enemy,.05,{clock:i*.05,target,allies:[enemy]});assert(!solid(enemy.x,enemy.y,10));if(clear(enemy,target,2))visible=true}assert(visible);assert(Math.hypot(enemy.x-target.x,enemy.y-target.y)<155);
 // A legal9px player-body corner must not make the10px enemy path invalid.
 const corner={x:173,y:93},e={x:110,y:80,hp:52,kind:'enemy'};assert(!solid(corner.x,corner.y,9));for(let i=0;i<150;i++){feedback.steerEnemy(e,.05,{clock:30+i*.05,target:corner,allies:[e]});assert(!solid(e.x,e.y,10))}
});
check('rendering saves and restores state, stays out of interiors and does not draw sprite replacements',()=>{
 const {feedback}=fixture();feedback.shot({x:100,y:100,weapon:'shotgun',angle:0});feedback.hit({target:{x:100,y:60,hp:26},damage:26,weapon:'pistol'});const c=canvas(),inside=canvas();feedback.draw(c,(x,y)=>[x,y],{inside:false});feedback.draw(inside,(x,y)=>[x,y],{inside:true});assert(c.calls.some(row=>row[0]==='stroke'));assert(c.calls.some(row=>row[0]==='text'&&row[1]==='26'));assert.equal(c.calls.filter(row=>row[0]==='save').length,c.calls.filter(row=>row[0]==='restore').length);assert.equal(inside.calls.length,0);
});
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'combat-feel-results.json'),JSON.stringify({time:new Date().toISOString(),passed,coverEvidence,scope:'Pure production combat-feedback module with original swept-circle collision adapter. Visuals cannot apply damage/rewards; boundedcover/peek routes are simulated with fullbodyclearance. Actual projectile/input host coverage is separate.'},null,2)+'\n');console.log(passed.length+' combat-feel model checks passed');
