/* Contextual encounter direction, bounded street scenes, and physical race rivals.
 * Uses the approved art and host collision queries; no independent reward wallet. */
window.GlowportEncounters=(()=>{
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const safeKey=k=>typeof k==='string'&&k.length>0&&k.length<100&&!['__proto__','prototype','constructor'].includes(k);
const hash=s=>[...String(s)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,88);
class Encounters{
 constructor(api){this.api=api;this.state={version:1,memory:{},history:[]};this.scene=null;this.raceKey=null;this.graph=null}
 location(where){return this.api.locations().find(l=>l.key===where)||null}
 random(){return Math.max(0,Math.min(.999999,finite(this.api.random?.(),.5)))}
 solid(x,y,r=10){return !Number.isFinite(x)||!Number.isFinite(y)||!!this.api.solid?.(x,y,r)}
 safePoint(x,y,r=10){for(const radius of [0,22,44,70,105])for(let i=0;i<(radius?12:1);i++){const angle=i*Math.PI/6,p={x:x+Math.cos(angle)*radius,y:y+Math.sin(angle)*radius};if(!this.solid(p.x,p.y,r)&&!(this.api.cars?.()||[]).some(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)&&distance(c,p)<r+21))return p}return null}
 point(def){const where=def.stages[0]?.fromWhere||def.stages[0]?.where||def.where,loc=this.location(where);if(!loc)return null;const p=this.safePoint(loc.x,loc.y+10);return p?{...p,where}:null}
 choose(definitions,context={}){const focus=context.focus||this.api.player(),environment=context.environment||this.api.environment?.()||{},clock=finite(context.clock),hour=finite(environment.hour,20),weather=environment.weather||'CLEAR',reputation=finite(context.reputation),times=context.eventTimes||{};
  let eligible=definitions.filter(def=>{if(context.forceId)return def.id===context.forceId;const p=this.point(def);if(!p||def.minAct>(context.act||1)||def.districts?.length&&!def.districts.includes(context.district)||distance(focus,p)>950||clock-finite(times[def.id],-1e9)<(def.cooldown||100))return false;
   if(def.hours){const[a,b]=def.hours;if(a<=b?hour<a||hour>=b:hour<a&&hour>=b)return false}
   if(def.weather?.length&&!def.weather.includes(weather))return false;if(reputation<finite(def.minReputation,-100)||reputation>finite(def.maxReputation,100))return false;
   if(def.requiresFlags&&Object.entries(def.requiresFlags).some(([key,value])=>context.flags?.[key]!==value))return false;return true});
  eligible=eligible.filter(def=>this.point(def));if(!eligible.length)return null;
  const recent=new Set(this.state.history.slice(-2));if(!context.forceId&&eligible.some(d=>!recent.has(d.id)))eligible=eligible.filter(d=>!recent.has(d.id));
  const weighted=eligible.map(def=>({def,weight:(def.rarity||1)*(def.weatherWeights?.[weather]||1)*(reputation>=15?(def.reputationWeights?.helpful||1):1)}));let roll=this.random()*weighted.reduce((n,d)=>n+d.weight,0),selected=weighted[0].def;
  for(const row of weighted){roll-=row.weight;if(roll<=0){selected=row.def;break}}this.state.history.push(selected.id);if(this.state.history.length>12)this.state.history.shift();return selected;
 }
 cleanupCars(field,keep=null){const cars=this.api.cars?.()||[],player=this.api.player();for(let i=cars.length-1;i>=0;i--){const c=cars[i];if(!c[field]||c[field]===keep)continue;if(c===player.inCar||c.wasDriven){delete c[field];delete c.racing;continue}cars.splice(i,1)}}
 expireOffer(){if(this.scene&&!this.scene.active){this.scene=null;this.cleanupCars('_encounterScene')}}
 clear(){this.scene=null;this.raceKey=null;this.cleanupCars('_encounterScene');this.cleanupCars('_encounterRace')}
 createScene(def,origin,key){this.cleanupCars('_encounterScene',key);const count=['accident','robbery','dispute'].includes(def.scene)?3:2,actors=[];
  for(let i=0;i<count;i++){const p=this.safePoint(origin.x+(i%2?26:-23),origin.y+13+(i>1?27:0));if(p)actors.push({...p,id:200+hash(def.id+':'+i)%100,face:i%2?'left':'right',shirt:i%2?'#b48aeb':'#4c9b94',name:((def.stages[0]?.speaker)||'NEIGHBOR')+(i?' · WITNESS':''),state:i?'SOCIALIZING':'WAITING',hp:100,step:0})}
  let vehicle=null;if(['breakdown','accident','theft'].includes(def.scene)){const road=this.api.road?.(origin.x+75,origin.y)||origin,p=this.safePoint(road.x,road.y,20);if(p){vehicle={...p,id:'scene-'+hash(key),color:def.scene==='accident'?'#ec804e':'#9b89da',angle:Math.PI/2,speed:0,ai:false,parked:true,health:def.scene==='theft'?75:0,disabled:def.scene!=='theft',_encounterScene:key};(this.api.cars?.()||[]).push(vehicle)}}
  return {key,id:def.id,where:origin.where,x:origin.x,y:origin.y,type:def.scene||'street',actors,vehicle,active:false};
 }
 update(context={}){const def=context.definition,active=context.active?.status==='active'&&def?.kind==='event',offer=context.offer;let sceneDef=active?def:null,origin=null,key=null;
  if(active){origin=this.point(def);key='active:'+context.active.run+':'+def.id}else if(offer){sceneDef=context.catalogue?.find(d=>d.id===offer.id)||null;origin={x:offer.x,y:offer.y,where:offer.where};key='offer:'+offer.id}
  if(!sceneDef||!origin||this.solid(origin.x,origin.y,9)){this.scene=null;this.cleanupCars('_encounterScene')}else{
   if(this.scene?.key!==key)this.scene=this.createScene(sceneDef,origin,key);this.scene.active=!!active;this.scene.restored=this.scene.type==='blackout'&&context.stage?.type==='talk';const p=context.focus||this.api.player(),danger=(this.api.world().wanted||0)>1||finite(this.api.world().clock)-finite(this.api.player().lastShot,-100)<.5;
   for(const actor of this.scene.actors){actor.step+=finite(context.dt)*5;if(danger&&distance(actor,p)<200){actor.state='FLEEING';const dx=actor.x-p.x,dy=actor.y-p.y,length=Math.hypot(dx,dy)||1,nx=actor.x+dx/length*75*finite(context.dt),ny=actor.y+dy/length*75*finite(context.dt);if(!this.solid(nx,ny,9)){actor.x=nx;actor.y=ny}}else actor.state=actor.state==='FLEEING'?'RETURNING_TO_ROUTINE':'SOCIALIZING'}
  }
  if(context.stage?.type==='race'&&context.active?.status==='active')this.updateRace(context);else{this.raceKey=null;this.cleanupCars('_encounterRace')}
 }
 clearLine(a,b,r=19){const n=Math.max(1,Math.ceil(distance(a,b)/45));for(let i=0;i<=n;i++)if(this.solid(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true}
 roadGraph(){if(this.graph)return this.graph;const xs=this.api.roadsX||[],ys=this.api.roadsY||[],nodes=[],byGrid=new Map();for(let ix=0;ix<Math.min(xs.length,30);ix++)for(let iy=0;iy<Math.min(ys.length,25);iy++){const p={x:xs[ix],y:ys[iy],ix,iy,edges:[]};if(!this.solid(p.x,p.y,19)){byGrid.set(ix+','+iy,nodes.length);nodes.push(p)}}
  for(const n of nodes)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const index=byGrid.get((n.ix+dx)+','+(n.iy+dy));if(index!==undefined&&this.clearLine(n,nodes[index]))n.edges.push(index)}this.graph=nodes;return nodes;
 }
 roadPath(from,to){const a=this.api.road?.(from.x,from.y)||from,b=this.api.road?.(to.x,to.y)||to;if((Math.abs(a.x-b.x)<10||Math.abs(a.y-b.y)<10)&&this.clearLine(a,b))return [{x:a.x,y:a.y},{x:b.x,y:b.y}];const nodes=this.roadGraph();if(!nodes.length)return null;
  const nearest=p=>nodes.map((n,i)=>({i,d:distance(n,p)})).sort((a,b)=>a.d-b.d).find(row=>this.clearLine(p,nodes[row.i]))?.i,start=nearest(a),end=nearest(b);if(start===undefined||end===undefined)return null;
  const costs=new Map([[start,0]]),previous=new Map(),open=new Set([start]);let found=false;while(open.size){let at=[...open].reduce((best,i)=>(costs.get(i)<costs.get(best)?i:best));open.delete(at);if(at===end){found=true;break}for(const next of nodes[at].edges){const cost=costs.get(at)+distance(nodes[at],nodes[next]);if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);previous.set(next,at);open.add(next)}}}
  if(!found)return null;const path=[{x:b.x,y:b.y}];for(let at=end;;at=previous.get(at)){path.unshift({x:nodes[at].x,y:nodes[at].y});if(at===start)break}path.unshift({x:a.x,y:a.y});return path;
 }
 updateRace(context){const data=context.data||context.active.data,route=context.route;if(!data||!route?.length)return;const key=context.active.run+':'+context.active.id+':'+context.active.stage,player=context.player||this.api.player(),cars=this.api.cars?.()||[];
  if(this.raceKey!==key){this.cleanupCars('_encounterRace',key);this.raceKey=key}if(!player.inCar)return;
  if(!Array.isArray(data.rivalFinishTimes))data.rivalFinishTimes=[];
  if(Array.isArray(data.rivals)&&data.rivals.some(r=>!r||!Array.isArray(r.path)||r.path.length>300||r.path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))||!Number.isFinite(r.x)||!Number.isFinite(r.y)||!Number.isInteger(r.pathIndex)||r.pathIndex<0||r.pathIndex>r.path.length)){this.cleanupCars('_encounterRace');delete data.rivals}
  if(!Array.isArray(data.rivals)){const start=context.focus||player.inCar;let path=[],at=start;for(const checkpoint of route){const section=this.roadPath(at,checkpoint);if(!section){data.raceUnavailable='No safe rival route';return}path.push(...section);at=section.at(-1)}data.rivals=[0,1].map(i=>({id:'rival-'+context.active.run+'-'+i,x:path[0].x,y:path[0].y,angle:0,speed:0,health:100,color:i?'#44cbbf':'#f5bc65',ai:false,parked:false,personal:false,racing:true,path:copy(path),pathIndex:1,raceTime:0,finished:false,_encounterRace:key,pace:i?122:136}));data.rivalFinishTimes=[]}
  for(let index=0;index<Math.min(2,data.rivals.length);index++){let rival=data.rivals[index];if(!rival||!Array.isArray(rival.path)||rival.path.length>300||!Number.isFinite(rival.x)||!Number.isFinite(rival.y))continue;let car=cars.find(c=>c.id===rival.id);if(!car){car=rival;cars.push(car)}else if(car!==rival){Object.assign(car,rival);rival=data.rivals[index]=car}
   if(rival.finished||car===player.inCar)continue;rival.raceTime=finite(rival.raceTime)+finite(context.dt);let budget=finite(context.dt)*(rival.pace||125);
   while(budget>0&&rival.pathIndex<rival.path.length){const target=rival.path[rival.pathIndex],length=distance(rival,target);if(length<=budget){rival.x=target.x;rival.y=target.y;budget-=length;rival.pathIndex++}else{const dx=(target.x-rival.x)/length,dy=(target.y-rival.y)/length,nx=rival.x+dx*budget,ny=rival.y+dy*budget;if(this.solid(nx,ny,18)){rival.speed=0;break}rival.x=nx;rival.y=ny;rival.angle=Math.atan2(dx,-dy);rival.speed=rival.pace;budget=0}}
   if(rival.pathIndex>=rival.path.length){rival.finished=true;rival.speed=0;rival.parked=true;data.rivalFinishTimes.push({id:rival.id,time:finite(context.elapsed,rival.raceTime)});data.racePosition=1+data.rivals.filter(r=>r.finished).length}
  }
 }
 record(def,record,flags={}){if(def?.kind!=='event')return;const key=def.memoryKey||def.category||def.id,prior=this.state.memory[key]||{},decisions={};for(const stage of def.stages||[])for(const option of stage.choices||[])if(option.flag&&Object.hasOwn(flags,option.flag))decisions[option.flag]=flags[option.flag];this.state.memory[key]={id:def.id,title:def.title,runs:Math.min(999,finite(prior.runs)+1),clock:finite(this.api.world().clock),choices:decisions,run:finite(record?.run),reward:copy(record?.reward||{cash:0,reputation:0})};if(Object.keys(this.state.memory).length>80)delete this.state.memory[Object.keys(this.state.memory)[0]]}
 hazards(){return this.scene?.type==='accident'&&this.scene.vehicle?[{x:this.scene.vehicle.x,y:this.scene.vehicle.y,kind:'accident'}]:[]}
 blackout(){return this.scene?.type==='blackout'&&this.scene.active&&!this.scene.restored?{x:this.scene.x,y:this.scene.y,radius:210}:null}
 draw(c,inside=false){if(inside||!this.scene)return;const scene=this.scene,blackout=this.blackout();if(blackout){const p=this.api.screenPoint(blackout.x,blackout.y);c.save();c.fillStyle='rgba(3,7,20,.58)';c.fillRect(p[0]-210,p[1]-210,420,420);c.restore()}
  for(const actor of scene.actors){const[x,y]=this.api.screenPoint(actor.x,actor.y);if(x<-35||x>835||y<-50||y>500)continue;this.api.person?.(c,x,y,actor);if(actor.state==='FLEEING'){c.fillStyle='#edcb8e';c.font='bold 10px monospace';c.fillText('!',x-2,y-25)}}
  if(scene.vehicle&&scene.vehicle.health<10){const[x,y]=this.api.screenPoint(scene.vehicle.x,scene.vehicle.y);c.fillStyle='#c9d5dc77';for(let i=0;i<3;i++)c.fillRect(x+Math.sin(finite(this.api.world().clock)+i)*5,y-20-i*7,3,4)}
 }
 export(){return copy(this.state)}
 import(saved){this.clear();this.state={version:1,memory:{},history:[]};if(!saved||typeof saved!=='object')return false;this.state.history=Array.isArray(saved.history)?saved.history.filter(safeKey).slice(-12):[];for(const[key,value]of Object.entries(saved.memory||{}).slice(-80)){if(!safeKey(key)||!value||typeof value!=='object'||!safeKey(value.id))continue;const choices={};for(const[k,v]of Object.entries(value.choices||{}).slice(0,20))if(safeKey(k)&&['string','number','boolean'].includes(typeof v))choices[k]=typeof v==='string'?v.slice(0,100):v;this.state.memory[key]={id:value.id,title:typeof value.title==='string'?value.title.slice(0,150):value.id,runs:Math.min(999,Math.max(0,finite(value.runs))),clock:Math.max(0,finite(value.clock)),choices,run:Math.max(0,finite(value.run)),reward:{cash:finite(value.reward?.cash),reputation:finite(value.reward?.reputation)}}}return true}
 diagnostics(){return {scene:this.scene?{id:this.scene.id,type:this.scene.type,actors:this.scene.actors.map(a=>({x:a.x,y:a.y,state:a.state})),blackout:!!this.blackout()}:null,raceCars:(this.api.cars?.()||[]).filter(c=>c._encounterRace).length,memory:Object.keys(this.state.memory).length}}
}
return Encounters;
})();
