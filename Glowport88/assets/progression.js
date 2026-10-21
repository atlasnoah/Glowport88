/* Persistent progression and property economy. Wallet changes remain with the game adapter. */
window.GlowportProgression=(()=>{
'use strict';
const VERSION=1,INCOME_PERIOD=120,MAX_FRAME_INCOME_SECONDS=5;
const DEFINITIONS=Object.freeze([
 {id:'violet-room',name:'Violet Hotel backroom',where:'hotel',kind:'safehouse',cost:1800,income:0,upgradeCost:900,maxLevel:3,capacity:0,description:'A discreet room and a place to recover between jobs.'},
 {id:'palm-garage',name:'Palm Motor Court garage',where:'motel',kind:'garage',cost:3200,income:0,upgradeCost:1600,maxLevel:3,capacity:2,description:'Secure parking behind the motor court. Upgrades add storage.'},
 {id:'record-business',name:'Record Exchange partnership',where:'records',kind:'business',cost:8500,income:95,upgradeCost:4200,maxLevel:3,capacity:0,description:'Fund the shop and collect a share of its legitimate sales.'},
 {id:'dockside-lockup',name:'Dockside freight lockup',where:'warehouse',kind:'business',cost:14000,income:180,upgradeCost:6500,maxLevel:3,capacity:3,description:'A small logistics operation with secure vehicle bays.'},
 {id:'bayfront-boathouse',name:'Bayfront dispatch office',where:'pier',kind:'business',cost:10000,income:130,upgradeCost:5000,maxLevel:3,capacity:2,description:'An independent delivery office with a citywide customer list.'},
 {id:'marina-dispatch',name:'Marina courier desk',where:'clinic',kind:'business',cost:6500,income:65,upgradeCost:3000,maxLevel:3,capacity:0,description:'Keep medicine moving and earn an honest dispatch fee.'}
]);
const byId=new Map(DEFINITIONS.map(p=>[p.id,p]));
const safeKey=value=>typeof value==='string'&&value.length>0&&value.length<=80&&!['__proto__','prototype','constructor'].includes(value);
const number=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,number(v)));
const clone=value=>JSON.parse(JSON.stringify(value));
const blank=()=>({version:VERSION,skills:{driving:0,shooting:0},reputation:0,inventory:{},properties:{},vehicles:{},inbox:[],flags:{},lastIncomeClock:null,incomeElapsed:0,vehicleSequence:0,messageSequence:0,totalIncome:0});
function cleanVehicle(vehicle,id){
 if(!vehicle||typeof vehicle!=='object')return null;
 const health=clamp(vehicle.health??100,1,100),color=typeof vehicle.color==='string'&&/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(vehicle.color)?vehicle.color:'#6ea9b1';
 return {id:String(id).slice(0,80),color,health,style:Math.floor(clamp(vehicle.style??0,0,5)),model:typeof vehicle.model==='string'?vehicle.model.slice(0,40):'City sedan',personal:true,angle:number(vehicle.angle),tuning:Math.floor(clamp(vehicle.tuning||0,0,2))};
}
class Progression{
 constructor(saved){this.state=blank();if(saved)this.import(saved)}
 static get properties(){return clone(DEFINITIONS)}
 static get incomePeriod(){return INCOME_PERIOD}
 get properties(){return Progression.properties}
 definition(id){const p=byId.get(id);return p?clone(p):null}
 isOwned(id){return !!this.state.properties[id]?.owned}
 capacity(id){const def=byId.get(id),owned=this.state.properties[id];return def&&owned?.owned&&def.capacity>0?def.capacity+owned.level-1:0}
 getProperties(cash=0){return DEFINITIONS.map(def=>{const owned=this.state.properties[def.id],level=owned?.owned?owned.level:0;return {...clone(def),owned:!!owned?.owned,level,income:def.income*level,incomePeriod:INCOME_PERIOD,upgradeCost:level?def.upgradeCost*level:def.upgradeCost,canAfford:number(cash)>=def.cost,capacity:this.capacity(def.id),storedVehicles:this.listVehicles(def.id)}})}
 purchaseProperty(id,cash){
  const def=byId.get(id);if(!def)return {ok:false,cost:0,reason:'Unknown property.'};
  if(this.isOwned(id))return {ok:false,cost:0,reason:'You already own this property.'};
  if(number(cash)<def.cost)return {ok:false,cost:0,reason:'Not enough cash.'};
  this.state.properties[id]={owned:true,level:1,incomeElapsed:0};this.state.vehicles[id]??=[];
  return {ok:true,cost:def.cost,property:this.definition(id),reason:'Property purchased.'};
 }
 upgradeProperty(id,cash){
  const def=byId.get(id),owned=this.state.properties[id];if(!def||!owned?.owned)return {ok:false,cost:0,reason:'Buy the property first.'};
  if(owned.level>=def.maxLevel)return {ok:false,cost:0,reason:'This property is fully upgraded.'};
  const cost=def.upgradeCost*owned.level;if(number(cash)<cost)return {ok:false,cost:0,reason:'Not enough cash.'};
  owned.level++;return {ok:true,cost,level:owned.level,reason:'Property upgraded.'};
 }
 accrueIncome(clock){
  if(!Number.isFinite(clock)||clock<0)return 0;
  if(this.state.lastIncomeClock===null){this.state.lastIncomeClock=clock;return 0}
  const difference=clock-this.state.lastIncomeClock;this.state.lastIncomeClock=clock;
  if(difference<=0)return 0;
  // Only a small simulation step may accrue. Loading a save or resting until morning cannot print money.
  const elapsed=Math.min(MAX_FRAME_INCOME_SECONDS,difference);let cash=0,largestRemainder=0;
  for(const def of DEFINITIONS){const owned=this.state.properties[def.id];if(!owned?.owned||def.income<=0)continue;
   owned.incomeElapsed=(owned.incomeElapsed||0)+elapsed;const periods=Math.floor(owned.incomeElapsed/INCOME_PERIOD);
   if(periods){owned.incomeElapsed-=periods*INCOME_PERIOD;cash+=periods*def.income*owned.level}
   largestRemainder=Math.max(largestRemainder,owned.incomeElapsed);
  }
  this.state.incomeElapsed=largestRemainder;this.state.totalIncome+=cash;return cash;
 }
 addSkill(metric,amount){if(!['driving','shooting'].includes(metric)||!Number.isFinite(amount)||amount<=0)return false;this.state.skills[metric]=clamp(this.state.skills[metric]+amount,0,100);return this.state.skills[metric]}
 addReputation(amount){if(!Number.isFinite(amount))return this.state.reputation;this.state.reputation=clamp(this.state.reputation+amount,-100,100);return this.state.reputation}
 addItem(id,amount=1){if(!safeKey(id)||!Number.isFinite(amount)||amount<=0)return false;const quantity=Math.floor(amount);if(!quantity)return false;this.state.inventory[id]=Math.min(9999,this.count(id)+quantity);return this.state.inventory[id]}
 removeItem(id,amount=1){if(!safeKey(id)||!Number.isFinite(amount)||amount<=0)return false;const quantity=Math.floor(amount);if(!quantity||this.count(id)<quantity)return false;this.state.inventory[id]-=quantity;if(!this.state.inventory[id])delete this.state.inventory[id];return true}
 count(id){return safeKey(id)?this.state.inventory[id]||0:0}
 setFlag(id,value=true){if(!safeKey(id)||!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value))return false;this.state.flags[id]=typeof value==='string'?value.slice(0,200):value;return true}
 addMessage(message,from,text){
  if(typeof message==='string')message={id:message,from,text};
  if(!message||typeof message!=='object'||typeof message.text!=='string')return false;
  const id=safeKey(message.id)?message.id:'message-'+(++this.state.messageSequence);if(this.state.inbox.some(m=>m.id===id))return false;
  this.state.inbox.push({id,from:typeof message.from==='string'?message.from.slice(0,80):'Unknown contact',text:message.text.slice(0,4000),read:!!message.read,clock:Math.max(0,number(message.clock)),sequence:++this.state.messageSequence});
  if(this.state.inbox.length>100)this.state.inbox.splice(0,this.state.inbox.length-100);return true;
 }
 markRead(id){const message=this.state.inbox.find(m=>m.id===id);if(!message)return false;message.read=true;return true}
 unreadCount(){return this.state.inbox.filter(m=>!m.read).length}
 storeVehicle(propertyId,vehicle){
  const capacity=this.capacity(propertyId);if(!capacity)return {ok:false,reason:'This owned property has no vehicle storage.'};
  const list=this.state.vehicles[propertyId]??=[];if(list.length>=capacity)return {ok:false,reason:'All vehicle bays are full.'};
  let id=safeKey(vehicle?.id)?vehicle.id:'owned-car-'+(++this.state.vehicleSequence);
  if(Object.values(this.state.vehicles).some(cars=>cars.some(v=>v.id===id)))return {ok:false,reason:'That vehicle is already stored.'};
  const stored=cleanVehicle(vehicle,id);if(!stored)return {ok:false,reason:'No usable vehicle to store.'};list.push(stored);return {ok:true,id,vehicle:clone(stored),reason:'Vehicle stored.'};
 }
 listVehicles(propertyId){return clone(this.state.vehicles[propertyId]||[])}
 retrieveVehicle(propertyId,vehicleId){
  if(!this.capacity(propertyId))return {ok:false,reason:'No owned garage here.'};const list=this.state.vehicles[propertyId]||[],index=vehicleId?list.findIndex(v=>v.id===vehicleId):0;
  if(index<0||!list[index])return {ok:false,reason:'No stored vehicle selected.'};const [vehicle]=list.splice(index,1);return {ok:true,vehicle:clone(vehicle),reason:'Vehicle retrieved.'};
 }
 export(){return clone(this.state)}
 import(saved){
  this.state=blank();if(!saved||typeof saved!=='object'||Array.isArray(saved))return false;
  this.state.skills={driving:clamp(saved.skills?.driving,0,100),shooting:clamp(saved.skills?.shooting,0,100)};this.state.reputation=clamp(saved.reputation,-100,100);
  for(const [id,quantity] of Object.entries(saved.inventory||{}))if(safeKey(id)&&number(quantity)>0)this.state.inventory[id]=Math.floor(clamp(quantity,0,9999));
  for(const def of DEFINITIONS){const p=saved.properties?.[def.id];if(p?.owned)this.state.properties[def.id]={owned:true,level:Math.floor(clamp(p.level||1,1,def.maxLevel)),incomeElapsed:clamp(p.incomeElapsed??saved.incomeElapsed,0,INCOME_PERIOD-.0001)}}
  this.state.vehicleSequence=Math.floor(clamp(saved.vehicleSequence,0,1e9));
  const usedVehicleIds=new Set();for(const def of DEFINITIONS){if(!this.isOwned(def.id))continue;const list=Array.isArray(saved.vehicles?.[def.id])?saved.vehicles[def.id]:[],used=new Set();this.state.vehicles[def.id]=list.slice(0,this.capacity(def.id)).flatMap((v,i)=>{const id=safeKey(v?.id)?v.id:'restored-'+def.id+'-'+i;if(used.has(id)||usedVehicleIds.has(id))return [];used.add(id);usedVehicleIds.add(id);const clean=cleanVehicle(v,id);return clean?[clean]:[]})}
  const messages=Array.isArray(saved.inbox)?saved.inbox.slice(-100):[];for(const message of messages)this.addMessage(message);this.state.messageSequence=Math.max(this.state.messageSequence,Math.floor(clamp(saved.messageSequence,0,1e9)));
  for(const [id,value] of Object.entries(saved.flags||{}))this.setFlag(id,value);
  this.state.lastIncomeClock=Number.isFinite(saved.lastIncomeClock)&&saved.lastIncomeClock>=0?saved.lastIncomeClock:null;this.state.incomeElapsed=clamp(saved.incomeElapsed,0,INCOME_PERIOD-.0001);this.state.totalIncome=clamp(saved.totalIncome,0,1e9);return true;
 }
}
return Progression;
})();
