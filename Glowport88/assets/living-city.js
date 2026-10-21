/* Bounded city reactions and original, persistent cassette discoveries. */
window.GlowportLivingCity=(()=>{
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),finite=(n,f=0)=>Number.isFinite(Number(n))?Number(n):f;
const ARCHIVE=Object.freeze([
 ['hotel','The Violet Guestbook','Violet kept a room open for every tenant displaced by Meridian. No receipt ever named the person who paid.'],
 ['armory','A Sensible Policy','Before selling equipment, Jax repaired radios. He still calls every gun a listening problem with a bad solution.'],
 ['club','Last Dance on Cassette','The club’s first sound system belonged to three neighborhoods. Meridian only bought the paperwork.'],
 ['records','Side B of the City','Jax pressed neighborhood meeting minutes between two terrible disco singles. The bootleg is now the most honest record in the shop.'],
 ['warehouse','Dockside Overtime','The missing cargo included eviction files. Somebody paid dockworkers overtime to forget the company names.'],
 ['radio','The Hour They Stole','Sol’s first pirate broadcast was a weather report for people the city refused to warn. He never stopped.'],
 ['arcade','Roxy’s High Score','Roxy rewired the cabinet to keep neighborhood messages when the phone company cut the block off. The game still works.'],
 ['motel','A Room for Tonight','The motel’s oldest ledger lists stranded drivers, witnesses, and one very embarrassed mayor. The manager remembers all three.'],
 ['diner','Eddie’s Emergency Pie','Eddie’s emergency pie fund has bailed out more neighbors than it has baked pies. He maintains that this is accounting.'],
 ['clinic','After the Sirens','Mara’s clinic used to be a bait shop. The sign changed the week the city closed the night emergency desk.'],
 ['observatory','Listening to the Bay','Static recorded this hill before the towers went up. Under the rain is the sound of an entire block singing.'],
 ['pier','No One Owns the Tide','The harbor dispatch ledger closes with twelve names and one instruction: get everybody home.']
].map(([where,title,text],index)=>Object.freeze({id:'city-tape-'+String(index+1).padStart(2,'0'),where,title,text})));
const byId=new Map(ARCHIVE.map(t=>[t.id,t]));
class LivingCity{
 constructor(api={}){this.api=api;this.collected=new Set();this.sites=[];this.states=new Map();this.reset()}
 static get archive(){return ARCHIVE.map(t=>({...t}))}
 progression(){return typeof this.api.progression==='function'?this.api.progression():this.api.progression}
 player(){return typeof this.api.player==='function'?this.api.player():this.api.player}
 reset(saved=null){this.collected=new Set();this.states.clear();const flags=this.progression()?.state?.flags||{};for(const id of Array.isArray(saved?.collected)?saved.collected:[])if(byId.has(id))this.collected.add(id);for(const tape of ARCHIVE)if(flags['collected_'+tape.id])this.collected.add(tape.id);this.place();return true}
 place(){const locations=typeof this.api.locations==='function'?this.api.locations():this.api.locations||[];this.sites=[];for(const tape of ARCHIVE){const loc=locations.find(l=>l.key===tape.where);if(!loc||!Number.isFinite(loc.x)||!Number.isFinite(loc.y))continue;
   const offsets=[[64,35],[-64,35],[0,85],[92,20],[-92,20],[48,75],[-48,75],[0,120],[120,30],[-120,30]];
   for(const [dx,dy] of offsets){const point={x:loc.x+dx,y:loc.y+dy};if(this.api.solid?.(point.x,point.y,12))continue;let reachable=true;for(let n=0;n<=12;n++){const t=n/12;if(this.api.solid?.(loc.x+dx*t,loc.y+dy*t,10)){reachable=false;break}}if(reachable){this.sites.push({...tape,...point});break}}
  }return this.sites.length}
 collect(id){const tape=this.sites.find(t=>t.id===id),player=this.player();if(!tape||!player||!Number.isFinite(player.x)||!Number.isFinite(player.y)||player.inside||player.inCar||distance(player,tape)>44)return {ok:false,reason:'Get closer to the cassette on foot.'};if(this.collected.has(id)||this.progression()?.state?.flags?.['collected_'+id])return {ok:false,reason:'This cassette is already in your archive.'};
  this.collected.add(id);const progression=this.progression();progression?.setFlag('collected_'+id,true);progression?.addItem(id,1);progression?.addReputation(1);player.money=Math.max(0,finite(player.money))+75;
  progression?.addMessage({id:'archive-'+id,from:'HARBOR ARCHIVE',text:tape.title+' — '+tape.text});if(this.collected.size===ARCHIVE.length){progression?.setFlag('cityArchivist',true);player.money+=300;progression?.addMessage({id:'archive-complete',from:'DJ SOL',text:'All twelve tapes are safe. Glowport’s neighborhood archive belongs to the people who made it. Archive honorarium: $300.'})}
  this.api.announce?.('CASSETTE '+this.collected.size+'/'+ARCHIVE.length+' · '+tape.title+' · +$75',4);window.GlowportAudio?.cue('collect');this.api.save?.();return {ok:true,id,count:this.collected.size,reward:75+(this.collected.size===ARCHIVE.length?300:0),text:tape.text};
 }
 interactions(){const player=this.player();if(!player||player.inside||player.inCar)return [];return this.sites.filter(t=>!this.collected.has(t.id)&&distance(player,t)<=44).map(t=>({id:'cassette:'+t.id,label:'COLLECT '+t.title.toUpperCase(),priority:45,distance:distance(player,t),run:()=>this.collect(t.id)}))}
 draw(c,screenPoint,clock=0){if(this.player()?.inside)return;for(const tape of this.sites){if(this.collected.has(tape.id))continue;const [x,y]=screenPoint(tape.x,tape.y);if(x<-24||x>824||y<-24||y>474)continue;c.save();c.fillStyle='#10182b';c.fillRect(x-9,y-5,18,11);c.fillStyle='#e2b17c';c.fillRect(x-8,y-4,16,8);c.fillStyle='#674366';c.fillRect(x-6,y-3,12,3);c.fillStyle='#f5d69b';c.fillRect(x-4,y-2,2,2);c.fillRect(x+2,y-2,2,2);c.fillStyle='#203946';c.fillRect(x-4,y+2,8,2);if(Math.floor(clock*2)%2===0){c.fillStyle='#9ae7d9';c.fillRect(x+11,y-7,1,5);c.fillRect(x+9,y-5,5,1)}c.restore()}}
 updateNPC(n,dt,context={}){const elapsed=clamp(finite(dt),0,.1),clock=finite(context.clock),hadPanic=finite(n._cityPanic)>0;let speedMultiplier=1;
  const threat=context.danger||((finite(context.wanted)>1&&context.focus&&distance(n,context.focus)<150)?context.focus:null);
  if(threat&&distance(n,threat)<170){n.panic=Math.max(finite(n.panic),2);n._cityReturnUntil=clock+5;n._cityFearX=threat.x;n._cityFearY=threat.y}
  if(finite(n.panic)>0){n.state='FLEEING';n._cityPanic=n.panic;speedMultiplier=1}
  else if(hadPanic||finite(n._cityReturnUntil)>clock){n.state='RETURNING_TO_ROUTINE';n._cityPanic=0;if(!n._cityRerouted){const destination=n.phase==='work'?n.work:n.phase==='home'?n.home:n.leisure;if(destination)context.reroute?.(n,destination);n._cityRerouted=true}speedMultiplier=.9}
  else{n._cityRerouted=false;const moving=finite(n.waypoint)<(n.waypoints?.length||0);n.state=moving?'WALKING':n.phase==='work'?'WORKING':n.phase==='leisure'?'SOCIALIZING':'IDLE';
   if(context.weather==='RAIN'&&moving){speedMultiplier=1.14;if(clock-finite(n._cityShelterAt,-100)>20&&n.home&&n.work){n._cityShelterAt=clock;context.reroute?.(n,n.phase==='home'?n.home:n.work)}}
   const hazard=Array.isArray(context.hazards)?context.hazards.find(h=>distance(n,h)<75):null;
   if(hazard){n.state='INVESTIGATING';speedMultiplier=.35;if(finite(n.sayTime)<=0){n.say='Give them room. Somebody call the clinic.';n.sayTime=2.5}}
  }
  if(finite(n.stuckTime)>1.5&&clock-finite(n._cityRecoveryAt,-100)>3){n._cityRecoveryAt=clock;const target=n.phase==='work'?n.work:n.phase==='home'?n.home:n.leisure;if(target){context.reroute?.(n,target);n.stuckTime=0}}
  // Existing host collision and parked-car avoidance remain authoritative.
  if(Number.isInteger(n.id)&&n.id>=0&&n.id<256)this.states.set(n.id,n.state);
  return {state:n.state,speedMultiplier,elapsed};
 }
 trafficLimit(car,context={}){let cap=Math.max(0,finite(car.targetSpeed,90));if(context.weather==='RAIN')cap*=.78;else if(context.weather==='FOG')cap*=.65;
  for(const hazard of Array.isArray(context.hazards)?context.hazards:[])if(distance(car,hazard)<90)return 0;
  for(const cop of Array.isArray(context.cops)?context.cops:[])if(finite(context.wanted)>0&&distance(car,cop)<125)cap=Math.min(cap,Math.max(15,finite(car.targetSpeed,90)*.48));
  for(const person of Array.isArray(context.pedestrians)?context.pedestrians:[]){const dx=person.x-car.x,dy=person.y-car.y,forward=dx*Math.sin(car.angle||0)-dy*Math.cos(car.angle||0),side=Math.abs(dx*Math.cos(car.angle||0)+dy*Math.sin(car.angle||0));if(forward>0&&forward<55&&side<19)cap=Math.min(cap,Math.max(0,(forward-24)*1.5))}
  return cap;
 }
 export(){return {version:1,collected:[...this.collected].sort()}}
 diagnostics(){const states={};for(const state of this.states.values())states[state]=(states[state]||0)+1;return {collected:[...this.collected].sort(),total:ARCHIVE.length,placed:this.sites.length,states,sites:this.sites.map(t=>({id:t.id,where:t.where,x:t.x,y:t.y,collected:this.collected.has(t.id)}))}}
}
return LivingCity;
})();
