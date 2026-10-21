/* Original procedural radio and effects. Nothing starts until a user gesture. */
window.GlowportAudio=(()=>{
'use strict';
const KEY='glowport88-audio-v1',LIMIT=24;
const stations=Object.freeze([
 {id:'neon',name:'NEON FM',description:'Original neon synth loops',wave:'sawtooth',beat:.23,notes:[57,60,64,67,64,60,55,60]},
 {id:'midnight',name:'MIDNIGHT PULSE',description:'Original late-night electronic',wave:'triangle',beat:.19,notes:[45,52,57,52,48,55,60,55]},
 {id:'static',name:'STATIC 88',description:'Original underground chip rock',wave:'square',beat:.21,notes:[52,52,55,59,50,50,53,57]},
 {id:'harbor',name:'HARBOR RADIO',description:'Original harbor bells and quiet intervals',wave:'sine',beat:.38,notes:[62,69,74,0,65,72,77,0]}
]);
const defaults={muted:false,music:.2,effects:.45,station:'neon'};
const cues=new Set(['footstep','door','mission','complete','objective','collect','dialogue','interact','weapon','shot','reload','skid','impact','arcade','error']);
const finite=(v,f)=>Number.isFinite(Number(v))?Number(v):f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function clean(input){return {muted:!!input?.muted,music:clamp(finite(input?.music,defaults.music),0,1),effects:clamp(finite(input?.effects,defaults.effects),0,1),station:stations.some(s=>s.id===input?.station)?input.station:defaults.station}}
let settings={...defaults};try{settings=clean(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{}
let context=null,musicBus=null,effectsBus=null,noise=null,unlocked=false,paused=true,failed=false,panel=null,previousFocus=null,closeCallback=null,resetControls=null;
let nextBeat=0,beatIndex=0,footClock=0,ambienceClock=0,sirenClock=0,engine=null,maxVoices=0,lastCue='',cueTimes=new Map();
const voices=new Set();
function store(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}}
function gain(){if(!context)return;const now=context.currentTime;try{musicBus.gain.setTargetAtTime(settings.muted?0:settings.music*.12,now,.025);effectsBus.gain.setTargetAtTime(settings.muted?0:settings.effects*.22,now,.025)}catch{}}
function forget(voice){if(!voices.delete(voice))return;for(const node of voice.nodes)try{node.disconnect()}catch{}}
function stop(voice){if(!voice)return;for(const node of voice.sources)try{node.stop()}catch{}forget(voice)}
function stopAll(){for(const voice of [...voices])stop(voice);engine=null;nextBeat=0;footClock=0;ambienceClock=0;sirenClock=0}
function room(){if(!context||context.state!=='running'||settings.muted||paused)return false;while(voices.size>=LIMIT)stop(voices.values().next().value);return true}
function tone(frequency,duration=.12,volume=.2,wave='sine',bus=effectsBus,delay=0,endFrequency=null){
 if(!room()||frequency<=0)return null;
 try{const at=context.currentTime+Math.max(0,delay),osc=context.createOscillator(),env=context.createGain(),voice={sources:[osc],nodes:[osc,env]};
  osc.type=wave;osc.frequency.setValueAtTime(frequency,at);if(endFrequency)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),at+duration);
  env.gain.setValueAtTime(.0001,at);env.gain.linearRampToValueAtTime(volume,at+.008);env.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(env);env.connect(bus);osc.onended=()=>forget(voice);voices.add(voice);maxVoices=Math.max(maxVoices,voices.size);osc.start(at);osc.stop(at+duration+.02);return voice;
 }catch{failed=true;return null}
}
function hiss(duration=.09,volume=.1,frequency=1800){
 if(!room())return null;
 try{const source=context.createBufferSource(),filter=context.createBiquadFilter(),env=context.createGain(),voice={sources:[source],nodes:[source,filter,env]},at=context.currentTime;
  source.buffer=noise;filter.type='highpass';filter.frequency.value=frequency;env.gain.setValueAtTime(volume,at);env.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(env);env.connect(effectsBus);source.onended=()=>forget(voice);voices.add(voice);maxVoices=Math.max(maxVoices,voices.size);source.start(at);source.stop(at+duration+.02);return voice;
 }catch{failed=true;return null}
}
async function unlock(){
 try{if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;context=new Audio();musicBus=context.createGain();effectsBus=context.createGain();musicBus.connect(context.destination);effectsBus.connect(context.destination);
   noise=context.createBuffer(1,Math.ceil(context.sampleRate*.7),context.sampleRate);const data=noise.getChannelData(0);let seed=88021;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1}}
  await context.resume();unlocked=context.state==='running';failed=false;paused=false;gain();return unlocked;
 }catch{failed=true;return false}
}
function cue(name){if(!cues.has(name)||!room())return false;const now=context.currentTime,previous=cueTimes.get(name)??-100;if(now-previous<.045)return false;cueTimes.set(name,now);lastCue=name;
 switch(name){
  case 'footstep':tone(96,.055,.12,'triangle',effectsBus,0,44);break;
  case 'door':tone(150,.15,.18,'triangle',effectsBus,0,65);hiss(.06,.08,900);break;
  case 'mission':case 'complete':tone(523,.18,.25,'triangle');tone(659,.18,.22,'triangle',effectsBus,.12);tone(784,.3,.2,'triangle',effectsBus,.24);break;
  case 'objective':case 'collect':tone(659,.12,.2,'sine');tone(988,.17,.14,'sine',effectsBus,.09);break;
  case 'dialogue':case 'interact':tone(380,.055,.12,'square');break;
  case 'weapon':case 'shot':hiss(.065,.22,750);tone(92,.06,.18,'triangle',effectsBus,0,35);break;
  case 'reload':hiss(.075,.14,1300);tone(180,.035,.12,'square',effectsBus,.09);break;
  case 'skid':hiss(.14,.16,2600);break;
  case 'impact':hiss(.12,.2,420);tone(64,.16,.2,'triangle',effectsBus,0,28);break;
  case 'arcade':tone(880,.07,.15,'square');tone(1175,.1,.13,'square',effectsBus,.06);break;
  case 'error':tone(140,.13,.17,'square',effectsBus,0,95);break;
  default:return false;
 }return true;
}
function engineOff(){if(engine)stop(engine);engine=null}
function update(dt,state={}){
 if(!context||!unlocked)return;const nextPaused=!!state.paused;
 if(nextPaused){if(!paused)stopAll();paused=true;return}paused=false;if(context.state!=='running'||settings.muted){engineOff();return}
 const elapsed=clamp(finite(dt,0),0,.1),now=context.currentTime,station=stations.find(s=>s.id===settings.station)||stations[0];
 if(settings.music>0&&now>=nextBeat){if(now-nextBeat>1)nextBeat=now;const note=station.notes[beatIndex%station.notes.length];if(note){tone(440*2**((note-69)/12),station.beat*.8,.22,station.wave,musicBus);if(beatIndex%4===0)tone(440*2**((note-81)/12),station.beat*1.5,.27,'sine',musicBus)}beatIndex=(beatIndex+1)%64;nextBeat=now+station.beat}
 if(state.inCar&&settings.effects>0){if(!engine&&room()){try{const osc=context.createOscillator(),env=context.createGain();osc.type='triangle';osc.frequency.value=45;env.gain.value=.045;osc.connect(env);env.connect(effectsBus);engine={sources:[osc],nodes:[osc,env],osc,env};voices.add(engine);maxVoices=Math.max(maxVoices,voices.size);osc.onended=()=>{if(engine?.osc===osc)engine=null};osc.start()}catch{engine=null}}
  if(engine){engine.osc.frequency.setTargetAtTime(42+Math.min(320,Math.abs(finite(state.speed,0)))*.48,now,.12);engine.env.gain.setTargetAtTime(.035+Math.min(250,Math.abs(finite(state.speed,0)))*.0003,now,.1)}
 }else engineOff();
 footClock-=elapsed;if(state.walking&&!state.inCar&&footClock<=0){cue('footstep');footClock=state.running ? .23 : .36}
 ambienceClock-=elapsed;if(!state.inside&&ambienceClock<=0){if(state.weather==='RAIN')hiss(.35,.045,700);else if(state.weather==='FOG')hiss(.18,.018,100);else if(beatIndex%8===0)tone(92,.38,.015,'sine');ambienceClock=state.weather==='RAIN'?.3:2}
 sirenClock-=elapsed;if(!state.inside&&finite(state.wanted,0)>.5&&sirenClock<=0){tone(610,.4,.055,'sine',effectsBus,0,970);tone(970,.4,.05,'sine',effectsBus,.4,610);sirenClock=.82}
 if(state.braking&&Math.abs(finite(state.speed,0))>95&&footClock<=0){cue('skid');footClock=.24}
}
function suspend(){paused=true;stopAll();if(context?.state==='running')context.suspend().catch(()=>{})}
function apply(next){settings=clean({...settings,...next});gain();store();if(settings.muted)stopAll();nextBeat=0;return {...settings}}
function down(event){if(!panel)return;event.stopImmediatePropagation();if(event.key==='Escape'){event.preventDefault();close();return}if(event.key==='Tab'){const focus=[...panel.querySelectorAll('button,input,select')].filter(n=>!n.disabled),first=focus[0],last=focus.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}}
function up(event){if(panel)event.stopImmediatePropagation()}
function close(){if(!panel)return false;const node=panel,callback=closeCallback,focus=previousFocus;panel=null;closeCallback=null;node.remove();window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);resetControls?.();resetControls=null;if(focus?.isConnected)focus.focus();callback?.();return true}
function open(options={}){if(panel)return false;unlock();resetControls=options.resetControls||null;resetControls?.();closeCallback=options.close||null;previousFocus=document.activeElement;
 panel=document.createElement('div');panel.className='window';panel.id='audioPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','audioTitle');panel.style.zIndex='60';
 panel.innerHTML='<section class="modal" style="max-width:520px;max-height:90dvh;overflow:auto"><div class="modalhead"><h2 id="audioTitle">GLOWLINE / RADIO</h2><button class="close" id="audioClose" type="button">CLOSE</button></div><p class="modalnote">Original synthesized stations and city sounds. Your volume settings stay on this browser.</p><label style="display:block;margin:20px 0"><input id="audioMute" type="checkbox"> MUTE ALL SOUND</label><label style="display:block;margin:20px 0">MUSIC <input id="audioMusic" type="range" min="0" max="100" step="1" style="display:block;width:100%;min-height:44px"></label><label style="display:block;margin:20px 0">EFFECTS <input id="audioEffects" type="range" min="0" max="100" step="1" style="display:block;width:100%;min-height:44px"></label><label style="display:block;margin:20px 0">STATION <select id="audioStation" style="display:block;width:100%;min-height:44px;background:#16263a;color:#e5f6f1;border:1px solid #5e929f;padding:10px;font:inherit"></select></label><p id="audioDescription" class="modalnote"></p><button class="tiny" type="button" id="audioTest" style="min-height:44px">TEST SOUND</button><p id="audioStatus" class="modalnote" role="status"></p></section>';
 const mute=panel.querySelector('#audioMute'),music=panel.querySelector('#audioMusic'),effects=panel.querySelector('#audioEffects'),select=panel.querySelector('#audioStation');
 mute.checked=settings.muted;music.value=Math.round(settings.music*100);effects.value=Math.round(settings.effects*100);for(const station of stations){const option=document.createElement('option');option.value=station.id;option.textContent=station.name;select.append(option)}select.value=settings.station;
 function describe(){panel.querySelector('#audioDescription').textContent=stations.find(s=>s.id===settings.station).description}describe();
 mute.onchange=()=>apply({muted:mute.checked});music.oninput=()=>apply({music:Number(music.value)/100});effects.oninput=()=>apply({effects:Number(effects.value)/100});select.onchange=()=>{apply({station:select.value});beatIndex=0;describe()};
 panel.querySelector('#audioClose').onclick=close;panel.querySelector('#audioTest').onclick=async()=>{const ok=await unlock();if(!panel)return;panel.querySelector('#audioStatus').textContent=ok?(settings.muted?'Unmute to hear the test.':'Original sound preview.'): 'Audio is unavailable here. The game remains playable.';cue('collect')};panel.addEventListener('click',event=>{event.stopPropagation();if(event.target===panel)close()});document.body.append(panel);window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);panel.querySelector('#audioClose').focus();return true;
}
return {stations,unlock,cue,update,suspend,open,close,configure:apply,export:()=>({...settings}),import:input=>apply(input),get active(){return !!panel},diagnostics:()=>({available:!!(window.AudioContext||window.webkitAudioContext),unlocked,failed,state:context?.state||'locked',voices:voices.size,maxVoices,voiceLimit:LIMIT,lastCue,settings:{...settings}})};
})();
