/*
 * Glowport mission state machine. No rendering, money, actor, or input side effects live here.
 * The game adapter evaluates actual objectives and consumes events to change the world.
 * Save export includes unconsumed events: a save between completion and reward delivery cannot
 * silently lose the reward. Consumed events are never reconstructed from completed records.
 */
window.GlowportMissionEngine=(()=>{
'use strict';
const VERSION=1,MAX_HISTORY=160,BLOCKED=new Set(['__proto__','prototype','constructor']);
const EVENT_TYPES=new Set(['mission-start','stage-start','stage-complete','mission-complete','mission-failed','mission-retry','choice','mission-suspended','mission-resumed','mission-abandoned']);
const finite=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
const integer=(n,fallback=0)=>Math.max(0,Math.floor(finite(n,fallback)));
const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value)&&!BLOCKED.has(value);
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
// Bound depth/size and discard functions, non-finite values, and prototype keys at save boundaries.
function json(value,depth=0){
 if(depth>16)return null;
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='string')return value.slice(0,16000);
 if(typeof value==='number')return Number.isFinite(value)?value:0;
 if(Array.isArray(value))return value.slice(0,1000).map(v=>json(v,depth+1));
 if(plain(value)){const out={};for(const key of Object.keys(value).slice(0,1000))if(!BLOCKED.has(key))out[key]=json(value[key],depth+1);return out}
 return null;
}
function reward(value){return {cash:Math.max(-1e9,Math.min(1e9,finite(value?.cash))),reputation:Math.max(-1e6,Math.min(1e6,finite(value?.reputation)))}}
function fresh(){return {version:VERSION,active:null,completed:{},flags:{},relationships:{},history:[],ending:null,runSerial:0,eventSerial:0}}
class MissionEngine{
 constructor(definitions=[],options={}){
  this.definitions=new Map();this.catalogue=this.definitions;this.evaluate=typeof options.evaluate==='function'?options.evaluate:null;
  this.state=fresh();this._events=[];
  for(const definition of definitions)this.register(definition);
 }
 register(input){
  if(!plain(input)||!identifier(input.id)||!Array.isArray(input.stages)||input.stages.length===0||input.stages.length>100)throw new TypeError('Mission requires a safe id and 1–100 stages');
  const definition=json(input);definition.title=typeof input.title==='string'?input.title:input.id;definition.kind=['main','side','event'].includes(input.kind)?input.kind:'main';
  definition.requires=Array.isArray(input.requires)?input.requires.filter(identifier):[];definition.reward=reward(input.reward);
  const ids=new Set();
  definition.stages=definition.stages.map((stage,index)=>{
   if(!plain(stage)||typeof stage.type!=='string'||stage.type.length>80)throw new TypeError('Mission '+input.id+' has an invalid stage');
   stage.id=identifier(stage.id)?stage.id:'stage-'+(index+1);if(ids.has(stage.id))throw new TypeError('Duplicate stage id in '+input.id);ids.add(stage.id);
   stage.label=typeof stage.label==='string'?stage.label:stage.type;
   if(stage.timeLimit!==undefined&&(!Number.isFinite(stage.timeLimit)||stage.timeLimit<=0))throw new TypeError('Stage deadline must be positive');
   if(stage.type==='choice'&&(!Array.isArray(stage.choices)||stage.choices.length===0))throw new TypeError('Choice stage needs choices');
   return stage;
  });
  if(this.state.active?.id===definition.id&&this.state.active.status==='active')throw new Error('Cannot replace an active mission definition');
  this.definitions.set(definition.id,definition);return definition;
 }
 addDefinition(definition){return this.register(definition)}
 currentDefinition(){return this.state.active?this.definitions.get(this.state.active.id)||null:null}
 currentStage(){const definition=this.currentDefinition(),active=this.state.active;return definition&&active?definition.stages[active.stage]||null:null}
 available(kind=null){return [...this.definitions.values()].filter(d=>(!kind||d.kind===kind)&&this.canStart(d.id))}
 canStart(id){const d=this.definitions.get(id);if(!d)return false;if(this.state.active&&this.state.active.status!=='complete')return false;if(own(this.state.completed,id)&&!d.repeatable)return false;return d.requires.every(required=>!!this.state.completed[required])}
 start(id){
  if(!this.canStart(id))return false;
  const definition=this.definitions.get(id);const run=++this.state.runSerial;
  this.state.active={id,stage:0,status:'active',elapsed:0,stageElapsed:0,checkpoint:0,data:{},progress:0,reason:null,run,attempt:0,failures:0,claimed:{},choices:{},ending:null};
  this._history('started',id);this._emit('mission-start');this._enter(0);return true;
 }
 tick(dt,snapshot={}){
  const active=this.state.active;if(!active||active.status!=='active')return false;
  const seconds=Math.max(0,finite(dt));active.elapsed+=seconds;active.stageElapsed+=seconds;
  const stage=this.currentStage();if(!stage)return this.fail('Objective no longer exists');
  // Meet the deadline at the exact boundary; objective evaluation cannot complete expired work.
  if(stage.timeLimit&&active.stageElapsed>=stage.timeLimit)return this.fail(stage.failureText||'Objective time limit expired');
  return this._evaluate(snapshot);
 }
 interact(snapshot={}){return this._evaluate({...snapshot,interact:true})}
 _evaluate(snapshot){
  const active=this.state.active,stage=this.currentStage();if(!active||active.status!=='active'||!stage||!this.evaluate)return false;
  const result=this.evaluate(stage,active,snapshot)||{};
  if(result.progress!==undefined)active.progress=json(result.progress);
  if(result.failed)return this.fail(result.reason||'Objective failed');
  // Choices only resolve through choose(), never a generic proximity/tick evaluator.
  if(result.complete&&stage.type!=='choice')return this.completeStage(result);
  return false;
 }
 completeStage(outcome={}){
  if(!this.state.active||this.state.active.status!=='active'||this.currentStage()?.type==='choice')return false;
  return this._advance(outcome);
 }
 _target(next,fallback){
  if(next===undefined||next===null)return fallback;
  if(next==='complete')return 'complete';
  const definition=this.currentDefinition();const index=typeof next==='string'?definition.stages.findIndex(s=>s.id===next):next;
  return Number.isInteger(index)&&index>this.state.active.stage&&index<=definition.stages.length?(index===definition.stages.length?'complete':index):null;
 }
 _claim(key,value){const active=this.state.active;if(own(active.claimed,key))return {reward:{cash:0,reputation:0},rewardClaimed:true};active.claimed[key]=true;return {reward:reward(value),rewardClaimed:false}}
 _advance(outcome={}){
  const active=this.state.active,stage=this.currentStage(),definition=this.currentDefinition();if(!active||active.status!=='active'||!stage)return false;
  const next=this._target(outcome.nextStage??stage.nextStage,active.stage+1);if(next===null)return false;
  const completedStage=active.stage,stageReward=this._claim('stage:'+completedStage,stage.reward);
  this._emit('stage-complete',{outcome:json(outcome),...stageReward});
  if(next==='complete'||next>=definition.stages.length)return this._finish(outcome);
  this._enter(next);return true;
 }
 _enter(index,extra={}){
  const active=this.state.active,definition=this.currentDefinition();if(!active||!definition)return false;
  active.stage=index;active.status='active';active.stageElapsed=0;active.data={};active.progress=0;active.reason=null;
  if(definition.stages[index]?.checkpoint)active.checkpoint=index;
  this._emit('stage-start',extra);return true;
 }
 choose(index){
  const active=this.state.active,stage=this.currentStage();if(!active||active.status!=='active'||stage?.type!=='choice'||!Number.isInteger(index)||index<0||index>=stage.choices.length)return false;
  const option=stage.choices[index];if(!plain(option))return false;
  const target=this._target(option.nextStage??stage.nextStage,active.stage+1);if(target===null)return false;
  const choiceReward=this._claim('choice:'+active.stage,option.reward);
  if(option.flag&&identifier(option.flag))this.state.flags[option.flag]=option.value===undefined?true:json(option.value);
  if(plain(option.flags))for(const [key,value] of Object.entries(option.flags))if(identifier(key))this.state.flags[key]=json(value);
  if(!choiceReward.rewardClaimed&&plain(option.relationships))for(const [key,value] of Object.entries(option.relationships))if(identifier(key))this.state.relationships[key]=Math.max(-100,Math.min(100,finite(this.state.relationships[key])+finite(value)));
  if(typeof option.ending==='string'&&option.ending.length<=128){this.state.ending=option.ending;active.ending=option.ending;}
  active.choices[stage.id]=index;
  this._emit('choice',{choice:index,option:json(option),...choiceReward});
  return this._advance({choice:index,nextStage:target,ending:option.ending});
 }
 _finish(outcome={}){
  const active=this.state.active,definition=this.currentDefinition();if(!active||active.status!=='active'||!definition)return false;
  if(!definition.repeatable&&own(this.state.completed,active.id))return false;
  active.status='complete';active.reason=null;
  if(typeof outcome.ending==='string'){this.state.ending=outcome.ending;active.ending=outcome.ending;}else if(typeof definition.ending==='string'){this.state.ending=definition.ending;active.ending=definition.ending;}
  const prior=this.state.completed[active.id];
  const record={id:active.id,title:definition.title,kind:definition.kind,act:definition.act||null,run:active.run,runs:integer(prior?.runs)+1,elapsed:active.elapsed,failures:active.failures,choices:json(active.choices),ending:active.ending||null,reward:reward(definition.reward)};
  this.state.completed[active.id]=record;this._history('completed',active.id,{run:active.run,ending:this.state.ending});
  this._emit('mission-complete',{record:json(record),reward:reward(definition.reward)});return true;
 }
 fail(reason='Mission failed'){
  const active=this.state.active;if(!active||active.status!=='active')return false;
  active.status='failed';active.reason=String(reason).slice(0,1000);active.failures++;this._history('failed',active.id,{stage:active.stage,reason:active.reason});this._emit('mission-failed',{reason:active.reason});return true;
 }
 retry(){
  const active=this.state.active;if(!active||active.status!=='failed')return false;
  const from=active.stage;active.attempt++;this._history('retried',active.id,{stage:active.checkpoint});this._emit('mission-retry',{fromStage:from,toStage:active.checkpoint});
  return this._enter(active.checkpoint,{retry:true,fromStage:from});
 }
 restart(fromBeginning=false){
  const active=this.state.active;if(!active||active.status==='complete')return false;
  const from=active.stage,index=fromBeginning?0:active.checkpoint;
  active.attempt++;active.failures++;if(fromBeginning)active.checkpoint=0;
  // Keep the run and its receipt ledger: replaying a checkpoint cannot print rewards.
  this._events=this._events.filter(e=>!(e.mission===active.id&&e.run===active.run&&['mission-start','stage-start','mission-failed'].includes(e.type)));
  this._history('restarted',active.id,{stage:index});this._emit('mission-retry',{fromStage:from,toStage:index,manual:true});
  return this._enter(index,{retry:true,restart:true,fromStage:from});
 }
 suspend(){
  const active=this.state.active;if(!active||active.status==='complete')return null;
  const saved=json(active);this._emit('mission-suspended');
  // A world adapter must not spawn an objective after it has already been suspended.
  this._events=this._events.filter(e=>!(e.mission===active.id&&e.run===active.run&&['mission-start','stage-start','mission-failed'].includes(e.type)));
  this.state.active=null;return saved;
 }
 resume(saved){
  if(this.state.active&&this.state.active.status!=='complete')return false;
  const active=this._active(saved);if(!active||active.status==='complete')return false;
  const completed=this.state.completed[active.id];if(completed&&finite(completed.run)>=active.run)return false;
  this.state.active=active;this.state.runSerial=Math.max(this.state.runSerial,active.run);this._emit('mission-resumed');
  if(active.status==='active')this._emit('stage-start',{resume:true});else this._emit('mission-failed',{resume:true,reason:active.reason});return true;
 }
 abandon(){
  if(!this.state.active||this.state.active.status==='complete')return false;
  const active=this.state.active;this._emit('mission-abandoned');this._history('abandoned',active.id);this._events=this._events.filter(e=>!(e.mission===active.id&&e.run===active.run&&['mission-start','stage-start'].includes(e.type)));this.state.active=null;return true;
 }
 _history(type,mission,extra={}){this.state.history.push({type,mission,...json(extra)});if(this.state.history.length>MAX_HISTORY)this.state.history.splice(0,this.state.history.length-MAX_HISTORY)}
 _emit(type,extra={}){
  const active=this.state.active;if(!active)return;
  this._events.push({id:'mission-event-'+(++this.state.eventSerial),type,mission:active.id,stage:active.stage,run:active.run,attempt:active.attempt,...json(extra)});
 }
 _decorate(event){return {...json(event),definition:this.definitions.get(event.mission)||null,objective:this.definitions.get(event.mission)?.stages[event.stage]||null}}
 consumeEvents(){const events=this._events.map(e=>this._decorate(e));this._events=[];return events}
 getHUD(){
  const active=this.state.active,definition=this.currentDefinition(),stage=this.currentStage();if(!active||!definition)return null;
  return {id:active.id,mission:active.id,title:definition.title,kind:definition.kind,act:definition.act||null,status:active.status,stage:active.stage,stageCount:definition.stages.length,objective:stage?.label||definition.title,type:stage?.type||null,where:stage?.where||null,progress:json(active.progress),elapsed:active.elapsed,stageElapsed:active.stageElapsed,timeRemaining:stage?.timeLimit?Math.max(0,stage.timeLimit-active.stageElapsed):null,checkpoint:active.checkpoint,canRetry:active.status==='failed',reason:active.reason,failures:active.failures,choices:stage?.type==='choice'?json(stage.choices):null};
 }
 export(){return {...json(this.state),pendingEvents:json(this._events)}}
 _active(value){
  if(!plain(value)||!this.definitions.has(value.id))return null;
  const d=this.definitions.get(value.id),invalidStage=!Number.isInteger(value.stage)||value.stage<0||value.stage>=d.stages.length;
  // A known mission with a damaged objective remains recoverable, rather than disappearing.
  const stage=invalidStage?Math.min(d.stages.length-1,integer(value.checkpoint)):value.stage;
  const status=invalidStage?'failed':['active','failed','complete'].includes(value.status)?value.status:'active';
  const active={id:value.id,stage,status,elapsed:Math.max(0,finite(value.elapsed)),stageElapsed:Math.max(0,finite(value.stageElapsed)),checkpoint:Math.min(stage,integer(value.checkpoint)),data:plain(value.data)?json(value.data):{},progress:value.progress===undefined?0:json(value.progress),reason:typeof value.reason==='string'?value.reason.slice(0,1000):null,run:Math.max(1,integer(value.run,1)),attempt:integer(value.attempt),failures:integer(value.failures),claimed:{},choices:{},ending:typeof value.ending==='string'?value.ending.slice(0,128):null};
  if(invalidStage){active.data={};active.reason='Saved objective is invalid. Retry the checkpoint to recover this mission.';}
  if(plain(value.claimed))for(const [key,claimed] of Object.entries(value.claimed))if(/^(stage|choice):\d+$/.test(key)&&claimed===true)active.claimed[key]=true;
  if(plain(value.choices))for(const [key,choice] of Object.entries(value.choices))if(identifier(key)&&Number.isInteger(choice)&&choice>=0)active.choices[key]=choice;
  return active;
 }
 import(input){
  let saved=input;if(typeof saved==='string'){try{saved=JSON.parse(saved)}catch{return false}}
  if(!plain(saved)||finite(saved.version,VERSION)>VERSION)return false;
  const state=fresh();state.runSerial=integer(saved.runSerial);state.eventSerial=integer(saved.eventSerial);
  if(plain(saved.completed))for(const [id,record] of Object.entries(saved.completed)){
   const definition=this.definitions.get(id);if(!definition||!record)continue;
   state.completed[id]={id,title:definition.title,kind:definition.kind,act:definition.act||null,run:integer(record.run),runs:Math.max(1,integer(record.runs,1)),elapsed:Math.max(0,finite(record.elapsed)),failures:integer(record.failures),choices:plain(record.choices)?json(record.choices):{},ending:typeof record.ending==='string'?record.ending:null,reward:reward(record.reward)};
   state.runSerial=Math.max(state.runSerial,state.completed[id].run);
  }
  for(const name of ['flags','relationships'])if(plain(saved[name]))for(const [key,value] of Object.entries(saved[name]))if(identifier(key))state[name][key]=name==='relationships'?Math.max(-100,Math.min(100,finite(value))):json(value);
  state.ending=typeof saved.ending==='string'?saved.ending.slice(0,128):null;
  state.history=Array.isArray(saved.history)?saved.history.filter(h=>plain(h)&&this.definitions.has(h.mission)).slice(-MAX_HISTORY).map(h=>json(h)):[];
  state.active=this._active(saved.active);if(state.active){state.runSerial=Math.max(state.runSerial,state.active.run);if(state.completed[state.active.id]&&!this.definitions.get(state.active.id).repeatable&&state.active.status!=='complete')state.active=null}
  this.state=state;this._events=[];
  const seenEvents=new Set();
  if(Array.isArray(saved.pendingEvents))for(const raw of saved.pendingEvents.slice(-200)){
   if(!plain(raw)||!EVENT_TYPES.has(raw.type)||!this.definitions.has(raw.mission))continue;
   const d=this.definitions.get(raw.mission),stage=raw.stage;if(!Number.isInteger(stage)||stage<0||stage>=d.stages.length)continue;
   const run=Math.max(1,integer(raw.run,1));if(raw.type==='mission-complete'){const last=state.completed[raw.mission];if(!last||(!d.repeatable&&last.run!==run)||(d.repeatable&&last.run<run))continue;}
   const event=json(raw);delete event.definition;delete event.objective;event.stage=stage;event.run=run;
   if(typeof event.id!=='string')event.id='mission-event-'+(++state.eventSerial);else{const serial=event.id.match(/^mission-event-(\d+)$/);if(serial)state.eventSerial=Math.max(state.eventSerial,Number(serial[1]));}
   if(seenEvents.has(event.id))continue;seenEvents.add(event.id);this._events.push(event);
  }
  return true;
 }
}
return MissionEngine;
})();
