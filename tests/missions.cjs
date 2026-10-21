'use strict';
const assert=require('node:assert/strict');global.window={};require('../Glowport88/assets/missions.js');const m=window.GlowportMissions;
let world={story:6},st={task:'loot',where:'radio'},player={inside:'radio',ix:403,iy:149};
assert.equal(m.current(st,world).step,0);assert.equal(m.inspect(st,world,player),null,'Final evidence cannot bypass clues');
for(let i=0;i<2;i++){const node=m.current(st,world).node;player.ix=node.x;player.iy=node.y;assert(m.inspect(st,world,player).next)}
assert(m.current(st,world).complete);assert.equal(m.inspect(st,world,{inside:'warehouse',ix:403,iy:149}),null);
assert(m.inspect(st,world,{inside:'radio',ix:403,iy:149}).final);
world={story:8};st={task:'drive'};const xs=Array.from({length:20},(_,i)=>160+i*360),ys=Array.from({length:15},(_,i)=>160+i*340);
for(const [x,y] of [[10,10],[7200,5040],[3500,2500]]){const d=m.route(st,{story:8},{x,y},xs,ys);assert(d.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))}
const d=m.route(st,world,{x:3500,y:2500},xs,ys);m.updateDelivery(d,{inCar:null},100);assert.equal(d.remaining,210,'Timer waits for a car');
assert.equal(m.updateDelivery(d,{inCar:{...d.points[0]}},1),'CHECKPOINT 1/3 · KEEP MOVING');
m.updateDelivery(d,{inCar:null},10);assert.equal(d.remaining,199,'Active deadline continues on foot');
assert.match(m.updateDelivery(d,{inCar:null},200),/RESET/);assert.equal(d.checkpoint,0);assert.equal(d.failures,1);
for(let i=0;i<3;i++)m.updateDelivery(d,{inCar:{...d.points[i]}},1);assert.equal(d.checkpoint,3);const remaining=d.remaining;m.updateDelivery(d,{inCar:{}},900);assert.equal(d.remaining,remaining,'Delivered package cannot expire');
assert.equal(m.route(st,world,{x:0,y:0},xs,ys),d,'Route state is retained');
console.log('PASS investigation sequence, room isolation, route bounds, deadline, failure/retry, completion, state retention');
