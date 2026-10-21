/* Captured touch gestures are independent input sources. The host owns gameplay. */
window.GlowportTouch=(()=>{
'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const MOVE_DEAD=.17,AIM_DEAD=.12,FIRE_ON=.32,FIRE_OFF=.20;
function mount(api){
 const root=api.root;if(!root)throw new TypeError('GlowportTouch requires a control root');
 root.setAttribute('aria-label','Touch game controls');
 root.innerHTML=`
  <div id="movePad" class="touch-pad" role="group" aria-label="Movement joystick">
   <span class="touch-origin" aria-hidden="true"></span><span class="touch-state" aria-hidden="true"></span><span class="touch-pad-label">MOVE</span><span class="touch-stick" aria-hidden="true"></span>
  </div>
  <div class="touch-bank">
   <button id="touchE" type="button" aria-label="Interact with people, doors or vehicles">INTERACT</button>
   <button id="touchWeapon" type="button" aria-label="Switch owned weapon">WEAPON</button>
   <button id="touchReload" type="button" aria-label="Reload weapon">RELOAD</button>
   <button id="touchCrouch" type="button" aria-label="Toggle crouching" aria-pressed="false">CROUCH</button>
   <button id="touchSprint" type="button" aria-label="Hold to sprint">SPRINT</button>
   <button id="touchBrake" type="button" aria-label="Hold to brake the vehicle">BRAKE</button>
   <button id="touchFire" type="button" aria-label="Hold to attack">FIRE</button>
   <button id="touchFullscreen" type="button" aria-label="Expand game to fullscreen">EXPAND</button>
  </div>
  <div id="aimPad" class="touch-pad" role="group" aria-label="Drag to aim and fire">
   <span class="touch-origin" aria-hidden="true"></span><span class="touch-state" aria-hidden="true"></span><span class="touch-pad-label">DRAG TO AIM + FIRE</span><span class="touch-stick" aria-hidden="true"></span>
  </div>
  <div id="touchHelp">Left stick moves. Drag the right stick to aim and fire. Tap INTERACT for doors, people and cars.</div>`;
 const element=id=>root.querySelector('#'+id),movePad=element('movePad'),aimPad=element('aimPad');
 const buttons={interact:element('touchE'),weapon:element('touchWeapon'),reload:element('touchReload'),crouch:element('touchCrouch'),shift:element('touchSprint'),space:element('touchBrake'),fire:element('touchFire'),fullscreen:element('touchFullscreen')};
 const cleanup=[],owners=new Map(),media=window.matchMedia?.('(pointer: coarse)');
 const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);cleanup.push(()=>target.removeEventListener(type,fn,options))};
 const toggle=(node,name,on)=>{if(node.classList.contains(name)!==!!on)node.classList.toggle(name,!!on)};
 const text=(node,value)=>{if(node.textContent!==value)node.textContent=value};
 let seenTouch=false,enabled=!!(media?.matches||navigator.maxTouchPoints>0),available=false,previousMode=null,presentation=null,destroyed=false;
 let movePointer=null,aimPointer=null,aimVector={x:0,y:0},stickyFireAim=null,aimFire=false;
 function state(){return api.state()||{}}
 function held(name){return [...owners.values()].some(owner=>owner.kind==='hold'&&owner.name===name)}
 function radius(node){const b=node.getBoundingClientRect();return {box:b,r:Math.max(20,Math.min(b.width,b.height)*.34)}}
 function inside(node,event){const b=node.getBoundingClientRect();return event.clientX>=b.left&&event.clientX<=b.right&&event.clientY>=b.top&&event.clientY<=b.bottom}
 function permitted(){const s=state();return !destroyed&&enabled&&available&&!!s.playing&&!s.blocked&&!document.hidden}
 function canAttack(){const s=state();return permitted()&&!s.inCar&&!s.inside}
 function markPad(node,x=0,y=0){node.querySelector('.touch-stick').style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`}
 function origin(node,x,y){const b=node.getBoundingClientRect(),dot=node.querySelector('.touch-origin');dot.style.left=clamp(x-b.left,0,b.width)+'px';dot.style.top=clamp(y-b.top,0,b.height)+'px'}
 function idle(node){toggle(node,'is-active',false);toggle(node,'is-aiming',false);toggle(node,'is-firing',false);markPad(node);text(node.querySelector('.touch-state'),'')}
 function release(owner,id){try{if(owner.node.hasPointerCapture(id))owner.node.releasePointerCapture(id)}catch{}}
 function pushFire(){
  const hold=held('fire'),firing=canAttack()&&(aimFire||hold),aiming=!!(aimVector.x||aimVector.y);
  if(aiming&&(aimFire||hold))stickyFireAim={...aimVector};
  const direction=aiming?aimVector:hold&&stickyFireAim?stickyFireAim:{x:0,y:0};
  api.aim(direction.x,direction.y,firing);api.control('fire',firing);
  toggle(aimPad,'is-aiming',aiming);toggle(aimPad,'is-firing',firing);
  text(aimPad.querySelector('.touch-state'),firing?'FIRING':aiming?'AIMING':aimPointer!==null?'DRAG':'');
  if(!firing)stickyFireAim=null;
 }
 function reset(){
  const old=[...owners];owners.clear();movePointer=null;aimPointer=null;aimVector={x:0,y:0};stickyFireAim=null;aimFire=false;
  idle(movePad);idle(aimPad);toggle(root,'touch-moving',false);
  for(const node of Object.values(buttons))toggle(node,'is-held',false);
  api.move(0,0);api.aim(0,0,false);for(const name of ['shift','space','fire'])api.control(name,false);
  for(const [id,owner] of old)release(owner,id);
 }
 function update(){
  if(destroyed)return;
  const s=state(),mode=[!!s.playing,!!s.blocked,!!s.inCar,!!s.inside].join(':'),next=enabled&&!!s.playing&&!s.blocked&&!document.hidden;
  if((enabled&&mode!==previousMode)||(available&&!next))reset();
  previousMode=mode;available=next;
  const fullscreen=typeof api.canFullscreen==='function'?api.canFullscreen():!!document.fullscreenEnabled;
  const key=[enabled,mode,next,!!s.sneaking,fullscreen,!!document.fullscreenElement].join(':');
  if(key===presentation)return;presentation=key;
  toggle(document.body,'touch-mode',enabled);toggle(root,'hidden',!enabled||!s.playing);toggle(root,'touch-driving',!!s.inCar);toggle(root,'touch-blocked',!next);
  root.setAttribute('aria-hidden',String(!enabled||!s.playing));
  const attack=next&&!s.inCar&&!s.inside;
  movePad.setAttribute('aria-disabled',String(!next));aimPad.setAttribute('aria-disabled',String(!attack));
  text(movePad.querySelector('.touch-pad-label'),s.inCar?'DRIVE / STEER':'MOVE');
  text(aimPad.querySelector('.touch-pad-label'),s.inCar?'BRAKE TO STOP':s.inside?'AIM OUTSIDE':'DRAG TO AIM + FIRE');
  for(const node of Object.values(buttons))node.disabled=!next;
  buttons.fire.disabled=!attack;buttons.weapon.disabled=!next||!!s.inCar;buttons.crouch.disabled=!next||!!s.inCar;buttons.space.disabled=!next||!s.inCar;
  text(buttons.interact,s.inCar?'EXIT':'INTERACT');text(buttons.shift,s.inCar?'TURBO':'SPRINT');
  buttons.shift.setAttribute('aria-label',s.inCar?'Hold for vehicle boost':'Hold to sprint');
  text(buttons.crouch,s.sneaking?'STAND':'CROUCH');toggle(buttons.crouch,'is-on',!!s.sneaking);buttons.crouch.setAttribute('aria-pressed',String(!!s.sneaking));
  buttons.fullscreen.hidden=!fullscreen;text(buttons.fullscreen,document.fullscreenElement?'SHRINK':'EXPAND');
  text(element('touchHelp'),s.inCar?'Left stick: up accelerates, down reverses, left/right steer. Hold BRAKE before EXIT.':'Left stick moves. Drag the right stick to aim and fire. Tap INTERACT for doors, people and cars.');
 }
 function enableForTouch(event){if(destroyed||event.pointerType!=='touch')return;seenTouch=true;if(!enabled){enabled=true;update()}}
 listen(document,'pointerdown',enableForTouch,true);
 if(media){const change=()=>{enabled=seenTouch||media.matches||navigator.maxTouchPoints>0;update()};if(media.addEventListener)listen(media,'change',change);else if(media.addListener){media.addListener(change);cleanup.push(()=>media.removeListener(change))}}
 function claim(event,node,kind,name=null){
  enableForTouch(event);update();if(!permitted()||owners.has(event.pointerId)||event.pointerType==='mouse'&&event.button!==0)return null;
  if(kind==='aim'&&!canAttack()||kind==='move'&&movePointer!==null||kind==='aim'&&aimPointer!==null||node.disabled||node.hidden)return null;
  event.preventDefault();event.stopPropagation();
  const owner={node,kind,name,originX:event.clientX,originY:event.clientY};owners.set(event.pointerId,owner);
  try{node.setPointerCapture(event.pointerId)}catch{/* Owned window listeners remain the fallback. */}
  return owner;
 }
 function vector(event,owner){
  const {box,r}=radius(owner.node),cx=box.left+box.width/2,cy=box.top+box.height/2;
  const x=(event.clientX-(owner.kind==='aim'?owner.originX:cx))/r,y=(event.clientY-(owner.kind==='aim'?owner.originY:cy))/r,length=Math.hypot(x,y);
  const visualX=(event.clientX-cx)/r,visualY=(event.clientY-cy)/r,visualLength=Math.max(1,Math.hypot(visualX,visualY));markPad(owner.node,visualX/visualLength*r,visualY/visualLength*r);
  return {x,y,length};
 }
 function sendVector(event,owner){
  const v=vector(event,owner);
  if(owner.kind==='move'){
   const amount=v.length<=MOVE_DEAD?0:Math.pow((Math.min(1,v.length)-MOVE_DEAD)/(1-MOVE_DEAD),1.15);
   let x=v.length?v.x/v.length*amount:0,y=v.length?v.y/v.length*amount:0;
   if(state().inCar){const axis=n=>Math.sign(n)*Math.max(0,(Math.abs(n)-.12)/.88);x=axis(x);y=axis(y)}
   api.move(x,y);toggle(root,'touch-moving',!!(x||y));text(movePad.querySelector('.touch-state'),x||y?state().inCar?'DRIVING':amount>.8?'MOVE':'PRECISE':'');
  }else{
   aimVector=v.length>AIM_DEAD?{x:v.x/v.length,y:v.y/v.length}:{x:0,y:0};
   aimFire=aimFire?v.length>FIRE_OFF:v.length>=FIRE_ON;pushFire();
  }
 }
 for(const [node,kind] of [[movePad,'move'],[aimPad,'aim']])listen(node,'pointerdown',event=>{
  const owner=claim(event,node,kind);if(!owner)return;
  if(kind==='move')movePointer=event.pointerId;else aimPointer=event.pointerId;
  toggle(node,'is-active',true);origin(node,kind==='aim'?event.clientX:node.getBoundingClientRect().left+node.getBoundingClientRect().width/2,kind==='aim'?event.clientY:node.getBoundingClientRect().top+node.getBoundingClientRect().height/2);
  sendVector(event,owner);
 });
 for(const name of ['shift','space','fire'])listen(buttons[name],'pointerdown',event=>{
  const owner=claim(event,buttons[name],'hold',name);if(!owner)return;toggle(owner.node,'is-held',true);
  if(name==='fire')pushFire();else api.control(name,true);
 });
 for(const name of ['interact','weapon','reload','crouch','fullscreen']){
  const node=buttons[name];
  listen(node,'pointerdown',event=>{const owner=claim(event,node,'action',name);if(owner)toggle(node,'is-held',true)});
  // Native pointer clicks are handled by their captured release. Keyboard and
  // assistive activation uses detail=0, without a duplicate time-based fallback.
  listen(node,'click',event=>{event.preventDefault();if(event.detail===0&&!event.pointerType&&permitted()&&!node.disabled&&!node.hidden){api.action(name);update()}});
 }
 function finish(event,canceled){
  const owner=owners.get(event.pointerId);if(!owner)return;
  event.preventDefault();owners.delete(event.pointerId);
  if(owner.kind==='move'){movePointer=null;api.move(0,0);toggle(root,'touch-moving',false);idle(movePad)}
  else if(owner.kind==='aim'){aimPointer=null;aimVector={x:0,y:0};aimFire=false;idle(aimPad);pushFire()}
  else if(owner.kind==='hold'){
   toggle(owner.node,'is-held',held(owner.name));if(owner.name==='fire')pushFire();else api.control(owner.name,held(owner.name));
  }else{
   toggle(owner.node,'is-held',false);
   if(!canceled&&permitted()&&!owner.node.disabled&&!owner.node.hidden&&inside(owner.node,event)){release(owner,event.pointerId);api.action(owner.name);update();return}
  }
  release(owner,event.pointerId);
 }
 listen(window,'pointermove',event=>{
  const owner=owners.get(event.pointerId);if(!owner)return;
  if(!permitted()||owner.kind==='aim'&&!canAttack()){reset();return}
  event.preventDefault();if(owner.kind==='move'||owner.kind==='aim')sendVector(event,owner);
  else if(owner.kind==='action')toggle(owner.node,'is-held',inside(owner.node,event));
 });
 listen(window,'pointerup',event=>finish(event,false));listen(window,'pointercancel',event=>finish(event,true));
 listen(root,'lostpointercapture',event=>finish(event,true));
 for(const node of [buttons.shift,buttons.space,buttons.fire])listen(node,'click',event=>event.preventDefault());
 listen(root,'contextmenu',event=>event.preventDefault());listen(root,'selectstart',event=>event.preventDefault());
 // Ignore incidental browser-toolbar height changes during a drag; orientation
 // and a changed viewport width invalidate the gesture's coordinate system.
 let viewWidth=window.innerWidth;
 listen(window,'blur',reset);listen(window,'pagehide',reset);
 listen(window,'resize',()=>{if(window.innerWidth!==viewWidth){viewWidth=window.innerWidth;reset()}update()});
 listen(window,'orientationchange',()=>{reset();update()});listen(document,'fullscreenchange',()=>{reset();update()});
 listen(document,'visibilitychange',()=>{if(document.hidden)reset();update()});
 update();
 return {reset,update,get enabled(){return enabled},diagnostics:()=>({enabled,available,movePointer,aimPointer,aimFire,held:[...owners.values()].filter(v=>v.kind==='hold').map(v=>v.name),owners:owners.size}),destroy(){if(destroyed)return;reset();destroyed=true;for(const remove of cleanup)remove();document.body.classList.remove('touch-mode')}};
}
return {mount};
})();
