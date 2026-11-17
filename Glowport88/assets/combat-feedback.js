/* Combat presentation and bounded tactical movement on the existing city.
 * Damage, ammunition, rewards, firing cadence and approved sprites stay owned
 * by the host. No visual effect can score a hit or advance an objective. */
(function(global){
'use strict';
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const WEAPONS=Object.freeze({
 pistol:Object.freeze({life:.065,length:8,width:1,sparks:4,color:'#ffe2a6'}),
 shotgun:Object.freeze({life:.085,length:11,width:3,sparks:6,color:'#ffd9a0'}),
 smg:Object.freeze({life:.045,length:6,width:1,sparks:3,color:'#f8e8a3'}),
 fists:Object.freeze({life:.08,length:0,width:1,sparks:3,color:'#e7e6dd'}),
 bat:Object.freeze({life:.09,length:0,width:2,sparks:5,color:'#f4c48c'})
});

function create(options={}){
 const CAP=96,FLASH_CAP=24;
 const particles=[],flashes=[];
 let actors=new WeakMap(),clock=0,lastHitCue=-Infinity;
 const counters={shots:0,hits:0,downs:0,coverSelections:0,coverPeeks:0,repositions:0,abandonedPlans:0,maxParticles:0,maxFlashes:0};
 const protectedActor=e=>!e||e.passive||e.role==='protected'||e.role==='escort'||e.storyActor||e.scripted||e.persistent||e._missionActor;
 const solid=(x,y,r=10)=>options.solid?.(x,y,r)===true;
 const clear=(a,b,r=2)=>point(a)&&point(b)&&(options.clearLine?options.clearLine(a,b,r)===true:!solid(a.x,a.y,r)&&!solid(b.x,b.y,r));
 function actor(e){let s=actors.get(e);if(!s){s={maxHp:Math.max(1,finite(e.hp,64),finite(e.maxHp)),flashUntil:0,damage:0,nextPlan:0,plan:null,route:null,routeIndex:0,routeAt:0,routeTarget:null,stuck:0,mode:'advancing',engaged:0};actors.set(e,s)}return s}
 function push(list,value,limit){if(list.length>=limit)list.shift();list.push(value)}
 function shot(event={}){
  const weapon=WEAPONS[event.weapon]?event.weapon:'pistol',style=WEAPONS[weapon];
  if(!point(event))return false;
  clock=finite(event.clock,clock);counters.shots++;
  if(style.length)push(flashes,{x:event.x,y:event.y,angle:finite(event.angle),weapon,life:style.life,max:style.life},FLASH_CAP);
  counters.maxFlashes=Math.max(counters.maxFlashes,flashes.length);
  return true;
 }
 function hit(event={}){
  const target=event.target;if(!point(target)||event.confirmed===false)return false;
  const weapon=WEAPONS[event.weapon]?event.weapon:'pistol',style=WEAPONS[weapon],amount=Math.max(0,finite(event.damage));
  if(amount<=0)return false;
  clock=finite(event.clock,clock);const s=actor(target);
  if(s.downed&&target.hp<=0)return false;
  s.maxHp=Math.max(s.maxHp,finite(target.hp)+amount,finite(target.maxHp));
  s.flashUntil=clock+.11;s.damage=amount;counters.hits++;
  const killed=event.killed===true||finite(target.hp)>-1000&&Number.isFinite(target.hp)&&target.hp<=0;
  if(killed){s.downed=true;counters.downs++}
  // This cue is a confirmed hit, not a sound emitted merely by pressing Fire.
  if(clock-lastHitCue>=.055){options.cue?.(killed?'down':'hit');lastHitCue=clock}
  for(let i=0;i<style.sparks;i++){
   const angle=(i/style.sparks)*Math.PI*2+finite(event.angle),speed=18+(i%3)*8;
   push(particles,{kind:'spark',x:target.x,y:target.y-7,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-8,life:.17,max:.17,color:style.color},CAP);
  }
  push(particles,{kind:'confirm',x:target.x,y:target.y-7,vx:0,vy:0,life:killed?.24:.15,max:killed?.24:.15,killed,color:killed?'#ff91be':'#fff0c8'},CAP);
  // Damage text appears once per confirmed impact. Shotgun pellets close in
  // time merge into a readable total rather than stacking five labels.
  const label=[...particles].reverse().find(p=>p.kind==='damage'&&p.target===target&&p.life>.25);
  if(label){label.amount+=amount;label.life=.48;label.max=.48}
  else push(particles,{kind:'damage',target,x:target.x,y:target.y-39,vx:0,vy:-13,life:.48,max:.48,amount,color:killed?'#ffb3d2':'#f7edcf'},CAP);
  counters.maxParticles=Math.max(counters.maxParticles,particles.length);return true;
 }
 function update(delta){
  const dt=clamp(finite(delta),0,.1);clock+=dt;
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
  for(const f of flashes)f.life-=dt;
  for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
  for(let i=flashes.length-1;i>=0;i--)if(flashes[i].life<=0)flashes.splice(i,1);
 }
 function draw(c,screenPoint,context={}){
  if(context.inside)return;
  const W=finite(context.W,800),H=finite(context.H,450);
  c.save();c.imageSmoothingEnabled=false;
  for(const f of flashes){const [x,y]=screenPoint(f.x,f.y),style=WEAPONS[f.weapon];if(x<-25||x>W+25||y<-25||y>H+25)continue;
   const dx=Math.sin(f.angle),dy=-Math.cos(f.angle),length=style.length,side=style.width;
   c.globalAlpha=clamp(f.life/f.max,0,1);c.strokeStyle=style.color;c.lineWidth=1;c.beginPath();
   c.moveTo(Math.round(x+dx*15-dy*side),Math.round(y+dy*15+dx*side));c.lineTo(Math.round(x+dx*(15+length)),Math.round(y+dy*(15+length)));c.lineTo(Math.round(x+dx*15+dy*side),Math.round(y+dy*15-dx*side));c.stroke();
  }
  for(const p of particles){const [x,y]=screenPoint(p.x,p.y);if(x<-35||x>W+35||y<-40||y>H+40)continue;c.globalAlpha=clamp(p.life/Math.min(.15,p.max),0,1);c.fillStyle=p.color;
   if(p.kind==='spark')c.fillRect(Math.round(x),Math.round(y),2,1);
   else if(p.kind==='damage'){c.font='bold 8px monospace';c.textAlign='center';c.fillText(String(Math.ceil(p.amount)),Math.round(x),Math.round(y))}
   else{const r=p.killed?7:5;c.strokeStyle=p.color;c.lineWidth=1;c.beginPath();for(const [sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){c.moveTo(Math.round(x+sx*r),Math.round(y+sy*r));c.lineTo(Math.round(x+sx*(r-3)),Math.round(y+sy*(r-3)))}c.stroke()}
  }c.restore();
 }
 function drawActor(c,x,y,e,context={}){
  if(!e||!Number.isFinite(e.hp))return;const s=actor(e),showHealth=context.showHealth===true;
  c.save();
  if(showHealth&&e.hp>0){const width=22,ratio=clamp(e.hp/s.maxHp,0,1);c.fillStyle='#11182edb';c.fillRect(Math.round(x-width/2-1),Math.round(y-31),width+2,5);c.fillStyle=ratio<.3?'#ff9b9e':'#ee789f';c.fillRect(Math.round(x-width/2),Math.round(y-30),Math.max(1,Math.round(width*ratio)),3)}
  const flash=s.flashUntil-finite(context.clock,clock);
  if(flash>0){c.globalAlpha=clamp(flash/.11,0,1);c.strokeStyle='#fff1cd';c.lineWidth=1;c.beginPath();for(const sx of[-1,1]){c.moveTo(Math.round(x+sx*11),Math.round(y-20));c.lineTo(Math.round(x+sx*14),Math.round(y-20));c.lineTo(Math.round(x+sx*14),Math.round(y-15));c.moveTo(Math.round(x+sx*11),Math.round(y+6));c.lineTo(Math.round(x+sx*14),Math.round(y+6));c.lineTo(Math.round(x+sx*14),Math.round(y+1))}c.stroke()}
  c.restore();
 }
 function drawBullet(c,x,y,b){
  if(b?.team!=='player'||!WEAPONS[b.weapon]||!point({x:b.vx,y:b.vy}))return false;
  const style=WEAPONS[b.weapon],length=Math.hypot(b.vx,b.vy)||1,trail=b.weapon==='shotgun'?4:b.weapon==='smg'?8:6;
  c.save();c.strokeStyle=style.color;c.lineWidth=1;c.beginPath();c.moveTo(Math.round(x-b.vx/length*trail),Math.round(y-b.vy/length*trail));c.lineTo(Math.round(x),Math.round(y));c.stroke();c.fillStyle='#fff0c5';c.fillRect(Math.round(x),Math.round(y),2,1);c.restore();return true;
 }
 function path(from,to){
  if(!point(from)||!point(to))return null;
  if(solid(to.x,to.y,10)){
   // The player uses a 9px body and can legitimately stand at a corner that
   // the enemy's 10px body cannot occupy. Approach a safe neighboring point.
   const nearby=[[12,0],[-12,0],[0,12],[0,-12],[16,16],[-16,16],[16,-16],[-16,-16]].map(([x,y])=>({x:to.x+x,y:to.y+y})).filter(p=>!solid(p.x,p.y,10));
   nearby.sort((a,b)=>distance(from,a)-distance(from,b));if(!nearby.length)return null;to=nearby[0];
  }
  if(clear(from,to,10))return[{x:from.x,y:from.y},{x:to.x,y:to.y}];
  let result;try{result=options.route?.(from,to,10)}catch{return null}
  if(!Array.isArray(result)||result.length<2||result.length>160)return null;
  for(let i=0;i<result.length;i++)if(!point(result[i])||solid(result[i].x,result[i].y,10)||i&&!clear(result[i-1],result[i],10))return null;
  return result.map(p=>({x:p.x,y:p.y}));
 }
 function planCover(e,s,target,time,allies){
  let boxes;try{boxes=options.queryBuildings?.(e.x-170,e.y-170,340,340)||[]}catch{boxes=[]}
  const candidates=[];
  for(const b of boxes.slice(0,12)){
   if(![b.x,b.y,b.w,b.h].every(Number.isFinite))continue;
   for(const sx of[-1,1])for(const sy of[-1,1]){
    const corner={x:sx<0?b.x-15:b.x+b.w+15,y:sy<0?b.y-15:b.y+b.h+15};
    const anchors=[{x:corner.x,y:sy<0?b.y+Math.min(30,b.h*.4):b.y+b.h-Math.min(30,b.h*.4)},{x:sx<0?b.x+Math.min(30,b.w*.4):b.x+b.w-Math.min(30,b.w*.4),y:corner.y}];
    if(solid(corner.x,corner.y,10)||!clear(corner,target,2))continue;
    for(const anchor of anchors){const travel=distance(e,anchor),range=distance(anchor,target);if(travel<12||travel>140||range<90||range>420||solid(anchor.x,anchor.y,10)||clear(anchor,target,2)||!clear(anchor,corner,10))continue;
     if(allies.some(o=>o!==e&&o.hp>0&&(distance(o,anchor)<28||distance(o,corner)<25)))continue;
     candidates.push({anchor,peek:corner,score:travel+distance(anchor,corner)*.3+Math.abs(range-195)*.2});
    }
   }
  }
  candidates.sort((a,b)=>a.score-b.score);
  for(const candidate of candidates.slice(0,4)){const route=path(e,candidate.anchor);if(!route)continue;const length=route.slice(1).reduce((sum,p,i)=>sum+distance(route[i],p),0);if(length>175)continue;
   s.plan={...candidate,route,index:0,mode:'taking-cover',until:time+3.3,holdUntil:0,peekUntil:0,target:{x:target.x,y:target.y}};s.stuck=0;counters.coverSelections++;return true;
  }return false;
 }
 function follow(e,s,route,index,dt,speed=66){
  while(index<route.length&&distance(e,route[index])<3)index++;
  const goal=route[index];if(!goal)return{index,done:true,moved:0};
  const d=distance(e,goal),step=Math.min(d,speed*dt),dx=(goal.x-e.x)/(d||1),dy=(goal.y-e.y)/(d||1),before={x:e.x,y:e.y};
  if(options.move)options.move(e,dx*step,dy*step,10);else{const nx=e.x+dx*step,ny=e.y+dy*step;if(!solid(nx,ny,10)){e.x=nx;e.y=ny}}
  const moved=distance(e,before);s.stuck=moved<.08?s.stuck+dt:Math.max(0,s.stuck-dt*2);e.angle=Math.atan2(dx,-dy);e.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
  return{index,done:distance(e,goal)<3&&index===route.length-1,moved};
 }
 function steerEnemy(e,delta,context={}){
  if(protectedActor(e)||e.kind!=='enemy'||e.hp<=0||!point(context.target))return{handled:false,canFire:true,state:'scripted'};
  const dt=clamp(finite(delta),0,.1),time=finite(context.clock,clock),target=context.target,s=actor(e),range=distance(e,target),allies=Array.isArray(context.allies)?context.allies:[];
  if(range<75){s.plan=null;s.mode='engaging';return{handled:true,canFire:true,state:s.mode}}
  if(s.plan&&(time>s.plan.until||distance(s.plan.target,target)>125||s.stuck>.7)){
   s.plan=null;s.nextPlan=time+2.4;counters.abandonedPlans++;
  }
  if(!s.plan&&time>=s.nextPlan&&range<420){s.nextPlan=time+3.7+(finite(e.x)%3)*.1;planCover(e,s,target,time,allies)}
  const plan=s.plan;
  if(plan){
   if(plan.mode==='taking-cover'){
    const motion=follow(e,s,plan.route,plan.index,dt);plan.index=motion.index;
    if(motion.done){plan.mode='covered';plan.holdUntil=time+.55+(Math.abs(finite(e.x))%5)*.055;plan.until=time+2.2}
    s.mode=plan.mode;return{handled:true,canFire:true,state:s.mode};
   }
   if(plan.mode==='covered'){
    if(time>=plan.holdUntil){plan.mode='peeking';plan.route=[{x:e.x,y:e.y},plan.peek];plan.index=0;counters.coverPeeks++}
    s.mode=plan.mode;return{handled:true,canFire:false,state:s.mode};
   }
   const motion=follow(e,s,plan.route,plan.index,dt);plan.index=motion.index;
   if(motion.done){if(!plan.peekUntil)plan.peekUntil=time+.85;if(time>=plan.peekUntil){s.plan=null;s.nextPlan=time+3.6;s.route=null;s.routeAt=0;counters.repositions++}}
   s.mode='peeking';return{handled:true,canFire:true,state:s.mode};
  }
  // When a wall cuts sight, follow a swept-body checked route to re-engage.
  // No permanently hidden sniper or unkillable cover state is introduced.
  if(range>125&&range<600){
   if(!s.route||time>=s.routeAt||!s.routeTarget||distance(s.routeTarget,target)>55){s.route=path(e,target);s.routeIndex=0;s.routeAt=time+1.5;s.routeTarget={x:target.x,y:target.y};s.stuck=0}
   if(s.route){const motion=follow(e,s,s.route,s.routeIndex,dt);s.routeIndex=motion.index;if(motion.done)s.route=null}
   s.mode=clear(e,target,2)?'advancing':'flanking';
  }else s.mode='engaging';
  return{handled:true,canFire:true,state:s.mode};
 }
 function reset(){particles.length=0;flashes.length=0;actors=new WeakMap();clock=0;lastHitCue=-Infinity;for(const key of Object.keys(counters))counters[key]=0}
 function diagnostics(list=[]){return{particleLimit:CAP,flashLimit:FLASH_CAP,particles:particles.length,flashes:flashes.length,...counters,actors:list.filter(e=>e&&typeof e==='object').map(e=>{const s=actors.get(e);return{id:e.id??null,x:e.x,y:e.y,hp:e.hp,protected:!!protectedActor(e),mode:s?.mode||null,maxHp:s?.maxHp??null,cover:!!s?.plan,stuck:s?.stuck||0}})}}
 return{shot,hit,update,draw,drawActor,drawBullet,steerEnemy,reset,diagnostics,protectedActor};
}
global.GlowportCombat=Object.freeze({create,weaponStyles:WEAPONS});
if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportCombat;
})(typeof window!=='undefined'?window:globalThis);
