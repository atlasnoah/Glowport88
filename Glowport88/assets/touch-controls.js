/* Touch input for the existing city. It owns gesture state; the host owns gameplay. */
window.GlowportTouch=(()=>{
'use strict';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function mount(api){
 const root=api.root;
 if(!root)throw new TypeError('GlowportTouch requires a control root');
 root.setAttribute('aria-label','Touch game controls');
 root.innerHTML=`
  <div id="movePad" class="touch-pad" role="group" aria-label="Movement joystick">
   <span class="touch-pad-label">MOVE</span><span class="touch-stick" aria-hidden="true"></span>
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
  <div id="aimPad" class="touch-pad" role="group" aria-label="Aim and fire joystick">
   <span class="touch-pad-label">AIM + FIRE</span><span class="touch-stick" aria-hidden="true"></span>
  </div>
  <div id="touchHelp">Left stick moves. Right stick aims and fires. Tap INTERACT for doors, people and cars.</div>`;
 const element=id=>root.querySelector('#'+id),movePad=element('movePad'),aimPad=element('aimPad');
 const buttons={interact:element('touchE'),weapon:element('touchWeapon'),reload:element('touchReload'),crouch:element('touchCrouch'),shift:element('touchSprint'),space:element('touchBrake'),fire:element('touchFire'),fullscreen:element('touchFullscreen')};
 const cleanup=[],held=new Map();
 const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);cleanup.push(()=>target.removeEventListener(type,fn,options))};
 const media=window.matchMedia?window.matchMedia('(pointer: coarse)'):null;
 let seenTouch=false,enabled=!!(media?.matches||navigator.maxTouchPoints>0),available=false,previousMode=null,destroyed=false;
 let movePointer=null,aimPointer=null,aimVector={x:0,y:0},aimFire=false;
 function state(){return api.state()||{}}
 function hasHold(name){for(const value of held.values())if(value.name===name)return true;return false}
 function pushFire(){const firing=available&&(aimFire||hasHold('fire'));api.aim(aimVector.x,aimVector.y,firing);api.control('fire',firing)}
 function center(pad){pad.classList.remove('is-active');pad.querySelector('.touch-stick').style.transform='translate(-50%,-50%)'}
 function releaseCapture(node,id){if(id===null)return;try{if(node.hasPointerCapture(id))node.releasePointerCapture(id)}catch{}}
 function reset(){
  const moveId=movePointer,aimId=aimPointer,owners=[...held.entries()];
  movePointer=null;aimPointer=null;aimVector={x:0,y:0};aimFire=false;held.clear();
  center(movePad);center(aimPad);for(const button of Object.values(buttons))button.classList.remove('is-held');
  api.move(0,0);api.aim(0,0,false);for(const name of ['shift','space','fire'])api.control(name,false);
  releaseCapture(movePad,moveId);releaseCapture(aimPad,aimId);for(const [id,owner] of owners)releaseCapture(owner.node,id);
 }
 function modeKey(s){return [!!s.playing,!!s.blocked,!!s.inCar,!!s.inside].join(':')}
 function update(){
  if(destroyed)return;
  const s=state(),mode=modeKey(s),nextAvailable=enabled&&!!s.playing&&!s.blocked&&!document.hidden;
  // A dormant touch controller must never clear desktop keyboard movement.
  // Losing an active touch mode still releases gestures, even if touch support turns off.
  if((enabled&&mode!==previousMode)||(available&&!nextAvailable))reset();
  previousMode=mode;available=nextAvailable;
  document.body.classList.toggle('touch-mode',enabled);
  root.classList.toggle('hidden',!enabled||!s.playing);root.classList.toggle('touch-driving',!!s.inCar);root.classList.toggle('touch-blocked',!nextAvailable);
  root.setAttribute('aria-hidden',String(!enabled||!s.playing));
  const canAttack=nextAvailable&&!s.inCar&&!s.inside;
  movePad.setAttribute('aria-disabled',String(!nextAvailable));aimPad.setAttribute('aria-disabled',String(!canAttack));
  movePad.querySelector('.touch-pad-label').textContent=s.inCar?'DRIVE / STEER':'MOVE';
  aimPad.querySelector('.touch-pad-label').textContent=s.inCar?'USE BRAKE':s.inside?'AIM OUTSIDE':'AIM + FIRE';
  for(const button of Object.values(buttons))button.disabled=!nextAvailable;
  buttons.fire.disabled=!canAttack;buttons.weapon.disabled=!nextAvailable||!!s.inCar;buttons.crouch.disabled=!nextAvailable||!!s.inCar;buttons.space.disabled=!nextAvailable||!s.inCar;
  buttons.interact.textContent=s.inCar?'EXIT':'INTERACT';buttons.shift.textContent=s.inCar?'TURBO':'SPRINT';
  buttons.shift.setAttribute('aria-label',s.inCar?'Hold for vehicle boost':'Hold to sprint');
  buttons.crouch.textContent=s.sneaking?'STAND':'CROUCH';buttons.crouch.classList.toggle('is-on',!!s.sneaking);buttons.crouch.setAttribute('aria-pressed',String(!!s.sneaking));
  const fullscreenAllowed=typeof api.canFullscreen==='function'?api.canFullscreen():!!document.fullscreenEnabled;
  buttons.fullscreen.hidden=!fullscreenAllowed;buttons.fullscreen.textContent=document.fullscreenElement?'SHRINK':'EXPAND';
  element('touchHelp').textContent=s.inCar?'Left stick: up accelerates, down reverses, left/right steer. Hold BRAKE before EXIT.':'Left stick moves. Right stick aims and fires. Tap INTERACT for doors, people and cars.';
 }
 function enableForTouch(event){if(event.pointerType!=='touch')return;if(!enabled){seenTouch=true;enabled=true;update()}else seenTouch=true}
 listen(document,'pointerdown',enableForTouch,true);
 if(media){const change=()=>{enabled=seenTouch||media.matches||navigator.maxTouchPoints>0;update()};if(media.addEventListener)listen(media,'change',change);else if(media.addListener){media.addListener(change);cleanup.push(()=>media.removeListener(change))}}
 function canUsePad(kind){const s=state();return available&&!s.blocked&&(kind==='move'||(!s.inCar&&!s.inside))}
 function vector(event,pad){const box=pad.getBoundingClientRect(),radius=Math.max(20,Math.min(box.width,box.height)*.34);let x=(event.clientX-box.left-box.width/2)/radius,y=(event.clientY-box.top-box.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length}pad.querySelector('.touch-stick').style.transform=`translate(-50%,-50%) translate(${x*radius}px,${y*radius}px)`;return {x:clamp(x,-1,1),y:clamp(y,-1,1),length:Math.min(1,length)}}
 function sendVector(event,pad,kind){const v=vector(event,pad);if(kind==='move'){const scale=v.length<.17?0:1;api.move(v.x*scale,v.y*scale)}else{aimVector=v.length<.17?{x:0,y:0}:{x:v.x,y:v.y};aimFire=v.length>.27;pushFire()}}
 function bindPad(pad,kind){
  listen(pad,'pointerdown',event=>{enableForTouch(event);if(event.pointerType==='mouse'&&event.button!==0)return;if(!canUsePad(kind))return;if(kind==='move'?movePointer!==null:aimPointer!==null)return;event.preventDefault();event.stopPropagation();if(kind==='move')movePointer=event.pointerId;else aimPointer=event.pointerId;pad.classList.add('is-active');try{pad.setPointerCapture(event.pointerId)}catch{}sendVector(event,pad,kind)});
  listen(pad,'pointermove',event=>{const owner=kind==='move'?movePointer:aimPointer;if(owner!==event.pointerId)return;event.preventDefault();if(!canUsePad(kind)){reset();return}sendVector(event,pad,kind)});
  const finish=event=>{const owner=kind==='move'?movePointer:aimPointer;if(owner!==event.pointerId)return;event.preventDefault();if(kind==='move'){movePointer=null;api.move(0,0)}else{aimPointer=null;aimVector={x:0,y:0};aimFire=false;pushFire()}center(pad);releaseCapture(pad,event.pointerId)};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(pad,type,finish);
  for(const type of ['pointerup','pointercancel'])listen(window,type,finish);
 }
 bindPad(movePad,'move');bindPad(aimPad,'aim');
 function bindHold(name,node){
  listen(node,'pointerdown',event=>{enableForTouch(event);if(node.disabled||!available||event.pointerType==='mouse'&&event.button!==0)return;event.preventDefault();event.stopPropagation();held.set(event.pointerId,{name,node});node.classList.add('is-held');try{node.setPointerCapture(event.pointerId)}catch{}if(name==='fire')pushFire();else api.control(name,true)});
  const finish=event=>{const owner=held.get(event.pointerId);if(owner?.node!==node)return;event.preventDefault();held.delete(event.pointerId);node.classList.toggle('is-held',hasHold(name));if(name==='fire')pushFire();else api.control(name,hasHold(name));releaseCapture(node,event.pointerId)};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(node,type,finish);
  for(const type of ['pointerup','pointercancel'])listen(window,type,finish);
  // Avoid the synthetic click selecting text or activating another action after a hold.
  listen(node,'click',event=>event.preventDefault());
 }
 for(const name of ['shift','space','fire'])bindHold(name,buttons[name]);
 for(const name of ['interact','weapon','reload','crouch','fullscreen']){
  const node=buttons[name];let lastPointerAction=-Infinity;
  const act=()=>{if(node.disabled||!available)return;api.action(name);update()};
  listen(node,'pointerdown',event=>{enableForTouch(event);if(event.pointerType==='mouse'&&event.button!==0)return;if(node.disabled||!available)return;event.preventDefault();event.stopPropagation();lastPointerAction=performance.now();act()});
  listen(node,'click',event=>{event.preventDefault();if(performance.now()-lastPointerAction>500)act()});
 }
 listen(root,'contextmenu',event=>event.preventDefault());listen(root,'selectstart',event=>event.preventDefault());
 listen(window,'blur',reset);listen(window,'pagehide',reset);listen(window,'resize',()=>{reset();update()});listen(window,'orientationchange',()=>{reset();update()});
 listen(document,'visibilitychange',()=>{if(document.hidden)reset();update()});
 update();
 return {reset,update,get enabled(){return enabled},diagnostics:()=>({enabled,available,movePointer,aimPointer,aimFire,held:[...held.values()].map(v=>v.name)}),destroy(){reset();destroyed=true;for(const remove of cleanup)remove();document.body.classList.remove('touch-mode')}};
}
return {mount};
})();
