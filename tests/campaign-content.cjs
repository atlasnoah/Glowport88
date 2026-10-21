'use strict';
// Structural coverage only: this never completes a game objective or establishes play time.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const assets=path.join(root,'Glowport88','assets');
const hashes={
 'buildings-illustrated.png':'4e0aaad31c743d1bd779f2f194557dbba922316959f9232eee983cd732cc438e',
 'characters.png':'0e3ea49095f5d519601cbd587862454eadbe4fbcba7f75c1c167fe33d5dabd8b',
 'city-atlas.png':'964bbaf24f1d374e5992ee60756c45223a27b9e1e720c0dafefaaa4a0ac7dd4f',
 'furniture-illustrated.png':'00ca5377c351f078ad3d4d39ac8c3687b1d9734c5b8e85671124d33bb6960b49',
 'neighborhoods-illustrated.png':'de124d9ae06e1e88faffc733ca8215aa5f7c0790346699ae09ae517576d23166',
 'portraits.png':'4506507edf4b0be8e70901065f3aa51ffa66ec28d05cc367cf0d35e4cd39935e',
 'vehicles.png':'1c6e15cf1c96ba2de9d181a4acfbd3687de4cc517099f1f1e4593183dc58c3ef'
};
for(const [file,hash] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(assets,file))).digest('hex'),hash,`Approved art changed: ${file}`);
const html=fs.readFileSync(path.join(root,'Glowport88','Glowport88_ArtRehaul_v11.html'),'utf8');
for(const pattern of [/\bW\s*=\s*800\b/,/\bH\s*=\s*450\b/,/\bMW\s*=\s*7200\b/,/\bMH\s*=\s*5040\b/,/length:\s*20\s*}[^;]*160\s*\+\s*i\s*\*\s*360/,/length:\s*15\s*}[^;]*160\s*\+\s*i\s*\*\s*340/])assert(pattern.test(html),`Camera/grid contract changed: ${pattern}`);
if(process.argv.includes('--art-only')){console.log('PASS approved pixel-art SHA256 hashes and unchanged camera/grid constants');process.exit(0)}
const scope={window:{},console};vm.createContext(scope);
for(const file of ['campaign.js','side-content.js','mission-engine.js'])vm.runInContext(fs.readFileSync(path.join(assets,file),'utf8'),scope,{filename:file});
const campaign=scope.window.GlowportCampaign,side=scope.window.GlowportSideContent;
assert(campaign&&side,'Content globals missing');
assert.equal(campaign.missions.length,40,'Main campaign must have forty entries');
assert.equal(side.missions.length,20,'Side catalogue must have twenty entries');
assert.equal(side.events.length,20,'Encounter catalogue must have twenty entries');
const all=[...campaign.missions,...side.missions,...side.events];
const ids=new Map();for(const def of all){assert(typeof def.id==='string'&&def.id.trim(), 'Definition has no stable ID');assert(!ids.has(def.id),`Duplicate ID ${def.id}`);ids.set(def.id,def)}
const places=new Set(['hotel','armory','radio','arcade','warehouse','observatory','club','clinic','diner','records','motel','pier']);
const types=new Set(['legacy','go','talk','interact','acquire_vehicle','drive_route','investigate','combat','escape','stealth','escort','heist','collect','deliver','race','choice','defend','chase']);
const locationTypes=new Set(['go','talk','interact','drive_route','investigate','combat','stealth','escort','heist','collect','deliver','race','defend','chase']);
const substantial=new Set(['drive_route','investigate','combat','escape','stealth','escort','heist','deliver','race','defend','chase']);
function finiteTree(v,label,seen=new Set()){
 if(typeof v==='number')assert(Number.isFinite(v),`Nonfinite number at ${label}`);
 if(v&&typeof v==='object'&&!seen.has(v)){seen.add(v);for(const [key,value] of Object.entries(v))finiteTree(value,`${label}.${key}`,seen)}
}
function text(v,label){assert(typeof v==='string'&&v.trim(),`${label} needs text`)}
function validate(def){
 text(def.title,`${def.id} title`);assert(['main','side','event'].includes(def.kind),`${def.id} kind`);finiteTree(def,def.id);
 assert(Array.isArray(def.stages)&&def.stages.length,`${def.id} has no objectives`);
 for(const req of def.requires||[])assert(ids.has(req),`${def.id} requires unknown ${req}`);
 assert(def.reward&&Number.isFinite(def.reward.cash)&&Number.isFinite(def.reward.reputation),`${def.id} reward needs finite cash/reputation`);
 const stageIds=new Map();def.stages.forEach((stage,i)=>{text(stage.id,`${def.id} stage ${i} ID`);assert(!stageIds.has(stage.id),`${def.id} duplicate stage ${stage.id}`);stageIds.set(stage.id,i)});
 def.stages.forEach((stage,i)=>{
  assert(types.has(stage.type),`${def.id}/${stage.id} unsupported type ${stage.type}`);text(stage.label,`${def.id}/${stage.id} objective`);
  if(stage.where!==undefined)assert(places.has(stage.where),`${def.id}/${stage.id} unknown place ${stage.where}`);
  if(locationTypes.has(stage.type))assert(places.has(stage.where),`${def.id}/${stage.id} needs a real destination`);
  if(stage.nextStage!==undefined&&stage.nextStage!=='complete'){const target=typeof stage.nextStage==='number'?stage.nextStage:stageIds.get(stage.nextStage);assert(Number.isInteger(target)&&target>i&&target<def.stages.length,`${def.id}/${stage.id} invalid stage branch`)}
  if(stage.timeLimit!==undefined)assert(stage.timeLimit>0,`${def.id}/${stage.id} invalid time limit`);
  if(stage.fromWhere!==undefined)assert(places.has(stage.fromWhere),`${def.id}/${stage.id} unknown origin`);
  if(stage.type==='legacy')assert(Number.isInteger(stage.chapter)&&stage.chapter>=1&&stage.chapter<=6,`${def.id} legacy bridge out of range`);
  if(stage.type==='investigate'){
   assert(Array.isArray(stage.clues)&&stage.clues.length>=2,`${def.id} investigation needs multiple clues`);
   const positions=new Set();for(const clue of stage.clues){text(clue.label,`${def.id} clue label`);text(clue.text,`${def.id} clue text`);assert(Number.isFinite(clue.x)&&Number.isFinite(clue.y),`${def.id} clue position`);if(stage.inside!==false)assert(clue.x>=0&&clue.x<=800&&clue.y>=0&&clue.y<=450,`${def.id} clue outside interior`);positions.add(`${clue.x},${clue.y}`)}assert(positions.size>=2,`${def.id} clues overlap entirely`)
  }
  if(stage.type==='choice'){
   assert(Array.isArray(stage.choices)&&stage.choices.length>=2,`${def.id} choice has fewer than two outcomes`);
   for(const option of stage.choices){text(option.label,`${def.id} option label`);if(option.nextStage!==undefined&&option.nextStage!=='complete'){const next=typeof option.nextStage==='number'?option.nextStage:stageIds.get(option.nextStage);assert(Number.isInteger(next)&&next>=0&&next<def.stages.length,`${def.id} unknown branch ${option.nextStage}`);assert(next>i,`${def.id} branch loops or moves backward`)}if(option.reward)assert(Number.isFinite(option.reward.cash||0)&&Number.isFinite(option.reward.reputation||0),`${def.id} option reward invalid`)}
  }
  if(['drive_route','race'].includes(stage.type)&&stage.checkpoints!==undefined)assert(Number.isInteger(stage.checkpoints)&&stage.checkpoints>=1,`${def.id} invalid route checkpoints`);
  if(['combat','defend'].includes(stage.type)&&stage.count!==undefined)assert(Number.isInteger(stage.count)&&stage.count>0,`${def.id} combat has no opponents`);
 });
}
all.forEach(validate);
const registered=new scope.window.GlowportMissionEngine(all);assert.equal(registered.definitions.size,80,'All authored definitions must register in the real engine');
const visiting=new Set(),visited=new Set();function visit(id){assert(!visiting.has(id),`Prerequisite cycle at ${id}`);if(visited.has(id))return;visiting.add(id);for(const req of ids.get(id).requires||[])visit(req);visiting.delete(id);visited.add(id)}all.forEach(d=>visit(d.id));
for(let act=1;act<=5;act++)assert.equal(campaign.missions.filter(d=>d.act===act).length,8,`Act ${act} needs eight missions`);
campaign.missions.forEach((def,i)=>{assert.equal(def.id,`m${String(i+1).padStart(2,'0')}`);assert.equal(def.kind,'main');if(i)assert((def.requires||[]).includes(campaign.missions[i-1].id),`${def.id} lacks previous main prerequisite`);if(i<6){assert.equal(def.stages.length,1);assert.equal(def.stages[0].type,'legacy');assert.equal(def.stages[0].chapter,i+1)}else{assert(def.stages.length>=3,`${def.id} is too short to be a substantial mission`);assert(def.stages.some(s=>substantial.has(s.type)),`${def.id} has only marker/dialogue objectives`)}});
assert(Array.isArray(campaign.legacyMap)&&campaign.legacyMap.length===21,'Legacy map must cover all 21 old chapter indexes');campaign.legacyMap.forEach((i,n)=>{assert(Number.isInteger(i)&&i>=0&&i<40,`Legacy map ${n} invalid`);if(n<6)assert.equal(i,n);if(n)assert(i>=campaign.legacyMap[n-1],'Legacy map regresses')});
const finales=campaign.missions.at(-1).stages.filter(s=>s.type==='choice').flatMap(s=>s.choices||[]).filter(c=>c.ending);
assert(new Set(finales.map(c=>c.ending)).size>=2,'Finale needs at least two explicit endings');
assert(campaign.missions.filter(d=>d.stages.some(s=>s.type==='heist')).length>=4,'Campaign needs several actual heist objective sequences');
const contacts=new Map();for(const def of side.missions){assert.equal(def.kind,'side');text(def.contact,`${def.id} contact`);assert(Number.isInteger(def.actUnlock)&&def.actUnlock>=1&&def.actUnlock<=5,`${def.id} act unlock invalid`);assert(def.stages.length>=3&&def.stages.some(s=>substantial.has(s.type)),`${def.id} needs substantial optional gameplay`);if(!contacts.has(def.contact))contacts.set(def.contact,[]);contacts.get(def.contact).push(def)}
assert.equal(contacts.size,5,'Five recurring side-story contacts required');for(const [contact,defs] of contacts){assert.equal(defs.length,4,`${contact} needs four missions`);for(let i=1;i<defs.length;i++)assert((defs[i].requires||[]).includes(defs[i-1].id),`${contact} story chain is disconnected`)}
const categories=new Set();for(const event of side.events){assert.equal(event.kind,'event');text(event.category,`${event.id} category`);assert(!categories.has(event.category),`Repeated event category ${event.category}`);categories.add(event.category);assert(Array.isArray(event.districts)&&event.districts.length,`${event.id} no districts`);assert(event.districts.every(d=>['west','core','north','south','east'].includes(d)),`${event.id} invalid district`);assert(event.cooldown>0&&event.rarity>0,`${event.id} needs rarity/cooldown`);assert(Number.isInteger(event.minAct)&&event.minAct>=1&&event.minAct<=5,`${event.id} minAct`);assert(event.stages.length<=3,`${event.id} exceeds intended short event sequence`)}
console.log(`PASS content structure: ${campaign.missions.length} main / ${contacts.size} side contacts / ${side.missions.length} side / ${categories.size} encounter types; prerequisite graphs, branches, rewards, locations, and approved art preserved`);
console.log('NOTE: Catalogue validation does not prove mission playability or campaign duration. Run real browser objectives.');
