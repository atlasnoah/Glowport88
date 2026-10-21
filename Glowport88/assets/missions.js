/* Evidence objectives and checkpoint deliveries. State is plain JSON for old-save migration. */
window.GlowportMissions=(()=>{
'use strict';
const cases={
 radio:[
 {x:211,y:223,label:'MIXING DESK',title:'Inspect the damaged mixing desk',who:'DJ SOL',text:'Someone pulled the broadcast cartridge mid-song. A scorched service tag reads: ARCHIVE POWER / EAST WALL.'},
 {x:651,y:195,label:'POWER',title:'Restore power at the east service panel',who:'YOU',text:'A relay clicks. The archive terminal wakes up. Apparently the entire conspiracy runs on one very tired fuse.'},
 {x:403,y:149,label:'TAPE',title:'Recover the encrypted broadcast tape',who:'VEE',text:'The archive is open. Grab that tape before Meridian rewrites the playlist.'}],
 warehouse:[
 {x:211,y:223,label:'MANIFEST',title:'Inspect the altered cargo manifest',who:'YOU',text:'The same crate was checked in twice under two different companies. One invoice is still wet.'},
 {x:651,y:195,label:'SEAL',title:'Match the customs seal by the loading desk',who:'VEE',text:'That seal is counterfeit. The real serial number unlocks the shipping ledger.'},
 {x:403,y:149,label:'LEDGER',title:'Collect the original shipping ledger',who:'YOU',text:'A ledger, a mayoral signature, and the worst handwriting in organized crime.'}],
 observatory:[
 {x:211,y:223,label:'FREQUENCY',title:'Read the receiver frequency log',who:'DJ SOL',text:'Meridian has been listening on every public band. Their maintenance frequency is the one they forgot to lock.'},
 {x:651,y:195,label:'ANTENNA',title:'Retune the east antenna control',who:'YOU',text:'The receiver locks onto a clean carrier. For once, static is the sound of progress.'},
 {x:403,y:149,label:'TRANSMITTER',title:'Take the untraceable transmitter',who:'VEE',text:'One transmitter. Five districts. A whole city that deserves to hear this.'}],
 records:[
 {x:211,y:223,label:'SLEEVE',title:'Search Jax’s annotated record sleeves',who:'JAX',text:'I filed the backup under a fake band. Meridian never understood jazz, so it seemed safe.'},
 {x:651,y:195,label:'CATALOGUE',title:'Decode the catalogue number at the terminal',who:'YOU',text:'Side B, track eight. The catalogue number opens a locker behind the counter.'},
 {x:403,y:149,label:'BACKUP',title:'Retrieve Jax’s hidden backup drive',who:'JAX',text:'Copies of every payment. I should have spoken sooner. Make sure this one gets heard.'}]
};
function progress(world,index){world.investigations??={};const saved=world.investigations[index];if(!saved||!Number.isInteger(saved.step)||saved.step<0||saved.step>3)world.investigations[index]={step:0};return world.investigations[index]}
function current(st,world){if(st?.task!=='loot')return null;const steps=cases[st.where];if(!steps)return null;const p=progress(world,world.story);return {steps,step:p.step,node:steps[Math.min(p.step,steps.length-1)],complete:p.step>=steps.length-1}}
function inspect(st,world,player){const c=current(st,world);if(!c||player.inside!==st.where)return null;const node=c.node;if(Math.hypot(player.ix-node.x,player.iy-node.y)>54)return null;if(c.complete)return {final:true,node};progress(world,world.story).step++;return {node,next:c.steps[c.step+1]}}
function route(st,world,landmark,roadsX,roadsY){if(st?.task!=='drive')return null;if(!world.delivery||world.delivery.chapter!==world.story){const ix=roadsX.reduce((best,x,i)=>Math.abs(x-landmark.x)<Math.abs(roadsX[best]-landmark.x)?i:best,0),iy=roadsY.reduce((best,y,i)=>Math.abs(y-landmark.y)<Math.abs(roadsY[best]-landmark.y)?i:best,0);const dx=ix>2?-1:1,dy=iy>2?-1:1;world.delivery={chapter:world.story,checkpoint:0,remaining:210,active:false,failures:0,points:[{x:roadsX[ix+dx*2],y:roadsY[iy+dy]},{x:roadsX[ix+dx],y:roadsY[iy]},{x:landmark.x,y:landmark.y}]}}return world.delivery}
function updateDelivery(delivery,player,dt){if(!delivery||delivery.checkpoint>=delivery.points.length)return null;if(player.inCar)delivery.active=true;if(!delivery.active)return null;delivery.remaining-=dt;if(delivery.remaining<=0){delivery.checkpoint=0;delivery.remaining=210;delivery.active=false;delivery.failures++;return 'DELIVERY WINDOW MISSED · ROUTE RESET · TRY AGAIN'}if(!player.inCar)return null;const p=delivery.points[delivery.checkpoint];if(p&&Math.hypot(player.inCar.x-p.x,player.inCar.y-p.y)<67){delivery.checkpoint++;return delivery.checkpoint===delivery.points.length?'ROUTE COMPLETE · STOP AT THE DESTINATION AND PRESS E':`CHECKPOINT ${delivery.checkpoint}/${delivery.points.length} · KEEP MOVING`}return null}
return {current,inspect,route,updateDelivery};
})();
