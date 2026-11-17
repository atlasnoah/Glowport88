/* Transient tire marks and vehicle lights. Presentation never changes handling,
 * collision data, saved cars, city geometry, or the approved vehicle sprites. */
(function(global){
'use strict';
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function create(options={}){
 const limit=clamp(Math.floor(finite(options.maxMarks,80)),0,160),ttl=clamp(finite(options.ttl,6),1,12);
 let marks=[],states=new WeakMap(),emitted=0;
 function wheels(car){const angle=finite(car.angle),side={x:Math.cos(angle)*6,y:Math.sin(angle)*6},rear={x:car.x-Math.sin(angle)*10,y:car.y+Math.cos(angle)*10};return[{x:rear.x-side.x,y:rear.y-side.y},{x:rear.x+side.x,y:rear.y+side.y}]}
 function update(car,delta,context={}){
  if(context.paused)return;
  const dt=clamp(finite(delta),0,.1);if(!dt)return;
  for(const mark of marks)mark.life-=dt;marks=marks.filter(mark=>mark.life>0);
  if(!car||context.inside||!Number.isFinite(car.x)||!Number.isFinite(car.y))return;
  const speed=finite(car.speed),absolute=Math.abs(speed),clock=finite(context.clock),throttle=clamp(finite(context.throttle),-1,1),steering=clamp(finite(context.steering),-1,1);
  const braking=!!context.braking||speed*throttle<-20,reverse=speed<-4;
  const previous=states.get(car),current={x:car.x,y:car.y,angle:finite(car.angle),braking,reverse,skidding:false,wheels:wheels(car),markClock:previous?.markClock??-.1,markWheels:previous?.markWheels||previous?.wheels};
  const turn=previous?Math.abs(Math.atan2(Math.sin(current.angle-previous.angle),Math.cos(current.angle-previous.angle)))/dt:0;
  const skidding=absolute>90&&(braking||(Math.abs(steering)>.55&&turn>.6&&absolute>125));current.skidding=skidding;
  const moved=previous?Math.hypot(car.x-previous.x,car.y-previous.y):0,continuous=moved>1&&moved<Math.max(14,absolute*dt*2+8);
  if(skidding&&previous&&continuous&&clock-current.markClock>=.06&&limit){
   for(let i=0;i<2;i++)marks.push({a:(previous.markWheels||previous.wheels)[i],b:current.wheels[i],life:ttl});
   if(marks.length>limit)marks.splice(0,marks.length-limit);current.markClock=clock;current.markWheels=current.wheels;emitted+=2;
  }
  if(!skidding||!continuous)current.markWheels=current.wheels;states.set(car,current);
 }
 function drawGround(c,screenPoint){
  c.save();c.lineWidth=2;c.lineCap='butt';c.strokeStyle='#151a28';
  for(const mark of marks){const[a,b]=[screenPoint(mark.a.x,mark.a.y),screenPoint(mark.b.x,mark.b.y)];if((a[0]<-8&&b[0]<-8)||(a[0]>808&&b[0]>808)||(a[1]<-8&&b[1]<-8)||(a[1]>458&&b[1]>458))continue;c.globalAlpha=.32*clamp(mark.life/ttl,0,1);c.beginPath();c.moveTo(Math.round(a[0]),Math.round(a[1]));c.lineTo(Math.round(b[0]),Math.round(b[1]));c.stroke()}
  c.restore();
 }
 function drawVehicle(c,x,y,car){
  const state=states.get(car),braking=!!state?.braking,reverse=state?.reverse??finite(car?.speed)<-4;if(!braking&&!reverse)return;
  c.save();c.translate(Math.round(x),Math.round(y));c.rotate(finite(car?.angle));
  if(braking){c.fillStyle='#ff7296';c.fillRect(-8,12,3,2);c.fillRect(5,12,3,2);c.fillStyle='#ffb5bb';c.fillRect(-7,12,1,1);c.fillRect(6,12,1,1)}
  if(reverse){c.fillStyle='#e6e8dc';c.fillRect(-5,12,2,2);c.fillRect(3,12,2,2)}
  c.restore();
 }
 function reset(){marks=[];states=new WeakMap();emitted=0}
 function diagnostics(car){const state=car?states.get(car):null;return{marks:marks.length,markLimit:limit,markLifetime:ttl,emitted,state:state?{braking:state.braking,reverse:state.reverse,skidding:state.skidding}:null}}
 return{update,drawGround,drawVehicle,reset,diagnostics};
}
global.GlowportDrivingFeedback=Object.freeze({create});if(typeof module!=='undefined'&&module.exports)module.exports=global.GlowportDrivingFeedback;
})(typeof window!=='undefined'?window:globalThis);
