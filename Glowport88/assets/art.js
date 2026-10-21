/* Midnight Signal: original atlas renderer. Gameplay never depends on artwork state. */
window.GlowportArt=(()=>{
'use strict';
const atlas=window.GLOWPORT_ATLAS,images={},patterns=new WeakMap(),lightGrid=new Map();
const base=new URL('.',document.currentScript.src);
const ready=Promise.all(['city-atlas','characters','vehicles','buildings-illustrated','portraits'].map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve()};im.onerror=()=>reject(Error('Could not load '+name+'.png'));im.src=new URL(name+'.png',base).href})));
const palettes={
 west:{roof:'roof-rust',wall:'brick-warm',edge:'#a18a92',accent:'#ef99b1',label:'SUNSET'},
 core:{roof:'roof',wall:'brick-blue',edge:'#7a8da7',accent:'#71e4df',label:'DOWNTOWN'},
 north:{roof:'roof-teal',wall:'brick',edge:'#819e9e',accent:'#e3ba8e',label:'CRESCENT'},
 south:{roof:'roof-rust',wall:'brick-warm',edge:'#aa8d93',accent:'#e49b96',label:'PALM SOUTH'},
 east:{roof:'roof-teal',wall:'metal',edge:'#7e91a0',accent:'#d8b573',label:'EASTSIDE'}
};
const neon=['#75e9e1','#f38fc5','#a6a1f0','#edbc8c'];
const hash=(x,y=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function sprite(c,name,x,y,w,h){const a=atlas[name];if(!a)throw Error('Missing atlas sprite '+name);c.drawImage(images['city-atlas'],...a,Math.round(x),Math.round(y),w||a[2],h||a[3])}
function pattern(c,name){let map=patterns.get(c);if(!map){map=new Map();patterns.set(c,map)}if(!map.has(name)){const a=atlas[name],tile=document.createElement('canvas');tile.width=a[2];tile.height=a[3];tile.getContext('2d').drawImage(images['city-atlas'],...a,0,0,a[2],a[3]);map.set(name,c.createPattern(tile,'repeat'))}return map.get(name)}
function material(c,name,x,y,w,h){c.fillStyle=pattern(c,name);c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function line(c,points,col,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke()}
function polygon(c,pts,col){c.fillStyle=col;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill()}
function light(x,y,r,color,power=1,kind='neon'){const key=`${Math.floor(x/256)},${Math.floor(y/256)}`;if(!lightGrid.has(key))lightGrid.set(key,[]);lightGrid.get(key).push({x,y,r,color,power,kind,seed:hash(x,y)%100})}
function label(c,text,x,y,w,color,size=8){c.font=`bold ${size}px monospace`;c.textAlign='center';c.fillStyle=color;c.fillText(text,x+w/2,y,w-5);c.textAlign='left'}
function modularBuilding(c,b){const {x,y,w,h}=b,s=hash(x,y),p=palettes[b.district],col=b.landmark?p.accent:neon[s%4];
 const face=Math.min(48,Math.max(31,h*.37)),fy=Math.round(y+h-face),roofH=fy-y;
 // Footprint stays unchanged. Facade, parapet, cast shadow, and overhanging canopy establish depth.
 polygon(c,[[x+7,y+7],[x+w+12,y+9],[x+w+15,y+h+14],[x+9,y+h+14]],'#101528');
 material(c,p.wall,x,fy,w,face);rect(c,x,fy,3,face,'#22263c');rect(c,x+w-4,fy,4,face,'#20273e');rect(c,x+4,fy+2,w-8,2,'#767489');
 material(c,p.roof,x+2,y+3,w-4,roofH);rect(c,x,y,w,4,p.edge);rect(c,x,y+4,4,roofH,'#62647c');rect(c,x+w-5,y+3,5,roofH,'#252c44');rect(c,x+5,fy-5,w-10,5,'#1c243a');rect(c,x+4,y+6,w-10,2,'#7d7d92');rect(c,x+9,y+10,w-20,1,'#252e46');
 // Roof seams, raised skylight, electrical conduits and fan housings.
 for(let rx=x+15;rx<x+w-12;rx+=24)line(c,[[rx,y+11],[rx,fy-12]],'#2b3048');
 if(roofH>25){sprite(c,'ac',x+10,y+13);if(w>90)sprite(c,'ac',x+w-44,y+12);line(c,[[x+33,y+35],[x+33,fy-12],[x+w-10,fy-12],[x+w-10,fy+7]],'#172235',3);line(c,[[x+33,y+35],[x+33,fy-12],[x+w-10,fy-12]],'#7a8191');}
 if(roofH>62&&w>72){rect(c,x+w/2-18,y+43,35,22,'#19273c');sprite(c,'window',x+w/2-14,y+43,28,18);line(c,[[x+w/2-19,y+64],[x+w/2+18,y+64]],'#8193a3',2)}
 // Terrace railings and laundry distinguish residential roofs.
 if(b.district==='north'||b.kind==='homes'){for(let rx=x+7;rx<x+w-7;rx+=7)rect(c,rx,y+5,1,11,'#33384d');line(c,[[x+6,y+6],[x+w-8,y+6]],'#a4a1a6');if(w>85&&roofH>38){line(c,[[x+13,fy-25],[x+w-16,fy-25]],'#aba3a1');for(let i=0;i<4;i++)rect(c,x+20+i*12,fy-24,8,10,['#b4879c','#748c9a','#b5a083','#5c687c'][i]);sprite(c,'planter',x+w-37,fy-48,25,27)}}
 // Storefront: lit glass, interior shelving, doors, striped awning, inset sign.
 const doorX=b.doorX-11,wy=fy+11;
 for(let wx=x+8;wx+21<x+w-7;wx+=27){if(Math.abs(wx-doorX)<21)continue;sprite(c,s%3===0?'window-warm':'window',wx,wy,22,Math.min(24,face-13));}
 rect(c,x+4,fy-1,w-8,12,'#151e34');rect(c,x+6,fy,w-12,1,col);label(c,b.name,x+5,fy+9,w-10,col,Math.min(9,w/10));
 const awnY=fy+12;
 if(s%3!==1||b.landmark){polygon(c,[[x+6,awnY],[x+w-6,awnY],[x+w-1,awnY+8],[x+1,awnY+8]],'#36415a');for(let ax=x+7;ax<x+w-7;ax+=10)polygon(c,[[ax,awnY],[ax+5,awnY],[ax+8,awnY+8],[ax+2,awnY+8]],s%2?'#a97491':'#528d94');rect(c,x+2,awnY+8,w-4,3,'#17263d');rect(c,x+2,awnY+8,w-4,1,col)}
 sprite(c,'door',doorX,b.doorY-30,22,32);rect(c,doorX-3,b.doorY+2,28,3,'#707b8e');rect(c,doorX,b.doorY+2,22,1,col);
 if(w>95){sprite(c,'vending',x+5,y+h-26,17,26);sprite(c,'planter',x+w-28,y+h-22,23,25)}
 // Projecting blade sign has a mounting bracket, face lettering, and a matching local light.
 if(w>68){const sx=s%2?x+w-9:x-5;rect(c,sx,fy-9,7,2,'#8b8195');rect(c,sx+3,fy-6,10,30,'#121c33');rect(c,sx+4,fy-5,8,27,col);rect(c,sx+5,fy-4,6,25,'#30334f');for(let k=0;k<3;k++)label(c,(b.landmark?'OPEN':'88+')[k],sx+4,fy+3+k*7,8,col,6);light(sx+8,fy+20,39,col,.55)}
 if(s%4===0&&w>80){rect(c,x+w-22,y+11,13,roofH-17,'#2a3045');for(let r=y+15;r<fy-10;r+=7)line(c,[[x+w-21,r],[x+w-10,r+3]],'#7b7b8e');line(c,[[x+w-23,y+12],[x+w-23,fy-6]],'#9b8996')}
 light(b.doorX,b.doorY-8,63,col,b.landmark?1.1:.6);
}
const buildingCells=[[0,0,512,530],[512,0,512,530],[1024,0,512,530],[0,530,512,494],[512,530,512,494],[1024,530,512,494]];
function building(c,b){
 const seed=hash(b.x,b.y),byKey={hotel:0,motel:0,armory:1,radio:2,diner:3,records:3,club:4,arcade:4,warehouse:5,observatory:2,pier:5,clinic:0};
 const choices={west:[0,2,3],core:[0,1,4],north:[0,2,0],south:[3,0,3],east:[5,1,5]};
 const index=b.landmark?byKey[b.landmark.key]??0:choices[b.district][seed%3];
 // A true sprite sheet is the primary architecture source. Footprints and thresholds are unchanged.
 const dx=b.x-3,dy=b.y-3,dw=b.w+6,dh=b.h+20;
 c.drawImage(images['buildings-illustrated','portraits'],...buildingCells[index],dx,dy,dw,dh);
 const col=b.landmark?palettes[b.district].accent:neon[seed%4];
 // Small address plates give each reused architectural shell its in-world identity.
 const plateY=b.y+b.h-17;
 if(b.landmark){rect(c,b.x+5,plateY,b.w-10,10,'#131d30ed');label(c,b.name,b.x+5,plateY+8,b.w-10,col,7)}
 if(seed%4===0&&b.w>95)sprite(c,'ac',b.x+b.w-35,b.y+9,22,18);
 rect(c,b.doorX-9,b.doorY+3,18,1,col);
 light(b.doorX,b.doorY-8,75,col,b.landmark?1.4:.85);
 if(index===4)light(b.x+b.w*.75,b.y+b.h*.55,50,'#e589cb',.8);
 if(index===0||index===3)light(b.x+b.w*.25,b.y+b.h*.6,38,'#efb786',.55);
}
function bakeTerrain(c,world){const {MW,MH,lands,roadXs,roadYs,STREET,buildings,trees,debris,streetlights}=world;lightGrid.clear();c.imageSmoothingEnabled=false;
 material(c,'concrete',0,0,MW,MH);
 // Blocks get small courtyards, paved service lanes, and useful negative space.
 for(let p of debris){if(p.type==='park'){material(c,'grass',p.x,p.y,p.w,p.h);material(c,'pavement',p.x,p.y+p.h*.47,p.w,13);material(c,'pavement',p.x+p.w*.48,p.y,13,p.h);rect(c,p.x+p.w*.65,p.y+18,33,26,'#26364b');rect(c,p.x+p.w*.65+3,p.y+21,27,20,'#598a92');sprite(c,'bench',p.x+12,p.y+18);sprite(c,'planter',p.x+14,p.y+p.h-36)}else if(p.type==='plaza'){material(c,'pavement',p.x,p.y,p.w,p.h);for(let k=0;k<3;k++)sprite(c,'bench',p.x+18+k*48,p.y+17)}else{material(c,'asphalt',p.x,p.y,p.w,p.h);for(let k=16;k<p.w-12;k+=26)rect(c,p.x+k,p.y+5,1,p.h-10,'#69717d')}}
 for(let x of roadXs){material(c,'pavement',x-STREET/2-22,0,STREET+44,MH);material(c,'asphalt',x-STREET/2,0,STREET,MH);rect(c,x-STREET/2-2,0,2,MH,'#7d8390');rect(c,x+STREET/2,0,2,MH,'#1d253a');for(let y=0;y<MH;y+=30)rect(c,x,y,1,13,'#aea18a');for(let y=240;y<MH;y+=340){sprite(c,'drain',x-STREET/2+2,y,9,20);rect(c,x-STREET/2+13,y+34,21,1,'#1c2438')}}
 for(let y of roadYs){material(c,'pavement',0,y-STREET/2-22,MW,STREET+44);material(c,'asphalt',0,y-STREET/2,MW,STREET);rect(c,0,y-STREET/2-2,MW,2,'#7d8390');rect(c,0,y+STREET/2,MW,2,'#1d253a');for(let x=0;x<MW;x+=30)rect(c,x,y,13,1,'#aea18a');for(let x=240;x<MW;x+=360)sprite(c,'drain',x,y+STREET/2-12)}
 for(let x of roadXs)for(let y of roadYs){material(c,'asphalt',x-STREET/2,y-STREET/2,STREET,STREET);for(let k=-24;k<=24;k+=8){rect(c,x-45,y+k,9,4,'#a4a4a2');rect(c,x+36,y+k,9,4,'#a4a4a2');rect(c,x+k,y-45,4,9,'#a4a4a2');rect(c,x+k,y+36,4,9,'#a4a4a2')}for(let dx of [-1,1])for(let dy of [-1,1]){rect(c,x+dx*43-3,y+dy*43-3,7,7,'#9b968c');rect(c,x+dx*43-2,y+dy*43-2,4,1,'#5c6274')}}
 // Deterministic surface wear, leaves, and puddle contours; none use gameplay randomness.
 for(let i=0;i<12000;i++){const s=hash(i,88),x=s%MW,y=hash(i,194)%MH;const near=roadXs.some(rx=>Math.abs(rx-x)<33)||roadYs.some(ry=>Math.abs(ry-y)<33);if(near){rect(c,x,y,2+s%5,1,['#3b4356','#1e263b','#424959'][s%3]);if(s%27===0)line(c,[[x,y],[x+12,y+1],[x+18,y+3]],'#4b5668')}else if(s%5===0)rect(c,x,y,2,1,s%2?'#896174':'#808080')}
 for(const b of buildings)building(c,b);
 for(const tr of trees){sprite(c,'tree',tr.x-20,tr.y-30,40,40);}
 for(const l of streetlights){sprite(c,'lamp',l.x-7,l.y-25,14,24);light(l.x,l.y-15,48,'#a1ded7',.5,'lamp')}
 for(let x of roadXs)for(let y of roadYs){if(hash(x,y)%3===0){sprite(c,'dumpster',x+57,y+66);sprite(c,'vending',x-74,y-86,18,27)}if(hash(x,y)%4===0)sprite(c,'bench',x+65,y-65)}
}
function character(c,x,y,e,hero,clock,moving=false){const face={down:0,left:1,right:2,up:3}[e.face]??0;const variant=hero?0:e.shirt==='#5372ae'?6:e.shirt==='#a7586f'?7:1+((e.id??hash(x,y))%11);let frame=moving?1+Math.floor((e.walk||e.step||clock*7)*1.4)%4:0;if(hero&&e.weapon>0){if(e.reload>0)frame=7;else if(e.cool>.12)frame=6;else frame=moving?frame:5}
 c.save();c.globalAlpha=.4;c.fillStyle='#080f25';c.beginPath();c.ellipse(x+2,y+9,9,3,0,0,Math.PI*2);c.fill();c.restore();c.drawImage(images.characters,frame*32,(variant*4+face)*40,32,40,Math.round(x-16),Math.round(y-25),32,40);
 if(hero){rect(c,x-3,y+12,6,1,'#8eecdd');if(e.reload>0){rect(c,x-10,y-28,20,2,'#26324c');rect(c,x-10,y-28,20*Math.max(0,1-e.reload/1.2),2,'#f3d49c')}}
}
function vehicle(c,x,y,v){let dir=((Math.round((v.angle||0)/(Math.PI/8))%16)+16)%16;let index=v.kind==='police'?7:hash((v.color||'pink').split('').reduce((a,k)=>a+k.charCodeAt(0),0))%7;c.save();c.globalAlpha=.5;c.fillStyle='#091020';c.beginPath();c.ellipse(x+3,y+10,17,11,0,0,Math.PI*2);c.fill();c.restore();c.drawImage(images.vehicles,dir*64,index*64,64,64,Math.round(x-32),Math.round(y-32),64,64)}
const glowCache=new Map();
function glow(c,x,y,r,col,power){let im=glowCache.get(col);if(!im){im=document.createElement('canvas');im.width=im.height=128;let q=im.getContext('2d'),g=q.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,col);g.addColorStop(.25,col+'a0');g.addColorStop(1,col+'00');q.fillStyle=g;q.fillRect(0,0,128,128);glowCache.set(col,im)}c.globalAlpha=power;c.drawImage(im,Math.round(x-r),Math.round(y-r),r*2,r*2);c.globalAlpha=1}
function atmosphere(c,{clock,hour,weather,camera,W,H,cars,police}){
 const night=hour<5?.32:hour<8?.32*(8-hour)/3:hour>17?Math.min(.32,(hour-17)/4*.32):0;
 rect(c,0,0,W,H,`rgba(9,13,34,${.07+night})`);
 c.save();c.globalCompositeOperation='screen';
 for(let gx=Math.floor((camera.x-120)/256);gx<=Math.floor((camera.x+W+120)/256);gx++)for(let gy=Math.floor((camera.y-120)/256);gy<=Math.floor((camera.y+H+120)/256);gy++)for(let l of lightGrid.get(`${gx},${gy}`)||[]){const x=l.x-camera.x,y=l.y-camera.y;if(x<-l.r||x>W+l.r||y<-l.r||y>H+l.r)continue;const flicker=1-Math.max(0,Math.sin(clock*1.8+l.seed)-.96)*4;const power=(.23+night*.9)*l.power*flicker;glow(c,x,y,l.r,l.color,power);glow(c,x,y,8,l.color,.3*l.power);
 if(weather==='RAIN'){c.globalAlpha=.12*l.power;for(let i=0;i<9;i++){const yy=y+12+i*4,ww=(18-i)*1.5;rect(c,x-ww/2+Math.sin(clock*3+i+l.seed)*3,yy,ww,1,l.color)}c.globalAlpha=1}}
 if(night>.04||weather==='RAIN')for(let v of [...cars,...police]){const x=v.x-camera.x,y=v.y-camera.y;if(x<-90||x>W+90||y<-90||y>H+90)continue;const angle=v.angle||0;c.save();c.translate(x,y);c.rotate(angle);const grad=c.createLinearGradient(0,-18,0,-91);grad.addColorStop(0,'#c4dfe844');grad.addColorStop(1,'#a7d8ff00');polygon(c,[[-8,-18],[-27,-88],[27,-88],[8,-18]],grad);glow(c,-7,-20,12,'#f9ddae',.2);glow(c,7,-20,12,'#f9ddae',.2);glow(c,-7,20,12,'#ef698a',.2);glow(c,7,20,12,'#ef698a',.2);if(v.kind==='police'){glow(c,0,0,43,Math.sin(clock*12)>0?'#f1689c':'#7294f5',.6)}c.restore()}
 c.restore();
 if(weather==='RAIN'){c.strokeStyle='#a8bed64d';c.lineWidth=1;c.beginPath();for(let k=0;k<100;k++){const x=((k*91+clock*102)%(W+90))-40,y=((k*137+clock*382)%(H+60))-30;c.moveTo(x,y);c.lineTo(x-3,y+10)}c.stroke();for(let k=0;k<20;k++){const x=hash(k,8)%W,y=hash(k,9)%H,phase=(clock*1.5+k*.13)%1;c.strokeStyle=`rgba(147,195,213,${(1-phase)*.2})`;c.beginPath();c.ellipse(x,y,phase*7,phase*2,0,0,Math.PI*2);c.stroke()}}
 if(weather==='MIST'){const fog=c.createLinearGradient(0,0,W,H);fog.addColorStop(0,'#8b9eb124');fog.addColorStop(.5,'#52647a05');fog.addColorStop(1,'#a0b6bf33');rect(c,0,0,W,H,fog)}
 const vignette=c.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.6);vignette.addColorStop(0,'#10132900');vignette.addColorStop(1,'#060a1d88');rect(c,0,0,W,H,vignette);
}
function interior(c,key,name,W,H){const club=key==='club',hotel=['hotel','motel'].includes(key),gun=key==='armory',arcade=key==='arcade',clinic=key==='clinic',industrial=['warehouse','radio','observatory'].includes(key);const accent=club?'#be93ea':gun?'#89dfd6':hotel?'#eba8b6':clinic?'#9cc9ca':'#e7c18e';
 rect(c,0,0,W,H,'#101528');material(c,industrial?'concrete':hotel?'wood':'tile',46,66,W-92,H-100);material(c,industrial?'metal':'brick-blue',30,25,W-60,47);rect(c,30,25,W-60,3,'#7d7b92');rect(c,30,66,W-60,7,'#171d34');rect(c,30,72,16,H-98,'#262b43');rect(c,W-46,72,16,H-98,'#262b43');rect(c,30,H-30,W-60,6,'#090f22');rect(c,55,H-33,W-110,2,accent);
 for(let x=78;x<W-80;x+=115){sprite(c,hotel?'window-warm':'window',x,34,40,28);glow(c,x+20,70,53,accent,.13)}
 label(c,name,230,52,340,accent,16);
 // Keep furniture in the original collision footprints and leave the central mission approach clear.
 if(hotel){sprite(c,'sofa',90,112,136,68);sprite(c,'planter',72,158,38,40);sprite(c,'terminal',278,251,56,44);sprite(c,'table',492,264,92,40);sprite(c,'bed',548,114,104,70);label(c,'RECEPTION / VIOLET',470,96,230,accent,9);material(c,'tile',340,80,110,291);rect(c,346,84,98,280,'#73546844');for(let y=90;y<360;y+=20)rect(c,349,y,92,1,'#b5837840')}
 else if(gun){material(c,'metal',88,104,142,80);for(let i=0;i<6;i++){rect(c,96+i*20,124,14,3,'#bdc1bb');rect(c,101+i*20,126,3,8,'#3a4558')}material(c,'wood',484,266,124,24);sprite(c,'terminal',548,103,55,46);for(let x=275;x<355;x+=25){rect(c,x,251,20,44,'#59576a');rect(c,x+3,254,14,1,'#c5ae8b')}label(c,'LICENSED / NO REFUNDS',460,91,230,accent,10)}
 else if(arcade){for(let i=0;i<5;i++)sprite(c,'arcade',90+i*27,110,26,66);for(let i=0;i<5;i++)sprite(c,'arcade',490+i*25,102,25,56);sprite(c,'sofa',274,251,76,44);sprite(c,'table',490,265,110,30);label(c,'INSERT COIN / LOSE TIME',480,90,230,accent,10)}
 else if(clinic){sprite(c,'bed',90,110,130,70);sprite(c,'bed',490,105,122,58);sprite(c,'terminal',276,252,65,40);rect(c,561,267,27,23,'#c6d9c9');rect(c,571,270,6,17,'#b76b86');rect(c,565,276,18,5,'#b76b86');label(c,'WALK IN / WALK OUT',470,92,230,accent,10)}
 else if(club){sprite(c,'sofa',90,110,136,70);sprite(c,'table',274,252,74,42);material(c,'metal',485,267,122,25);sprite(c,'terminal',548,103,56,45);rect(c,298,188,168,58,'#343046');for(let x=300;x<460;x+=20)for(let y=190;y<245;y+=18)rect(c,x,y,17,15,((x+y)/2)%3?'#8766a65a':'#62bcb55a');label(c,'THE LAST GOOD NIGHT',470,90,230,accent,10)}
 else if(industrial){for(let x=94;x<225;x+=40){material(c,'wood',x,112,34,65);rect(c,x+2,118,30,2,'#8d7984')}sprite(c,'terminal',276,253,67,40);sprite(c,'terminal',530,105,65,45);material(c,'metal',490,267,110,25);label(c,'STAFF ONLY / MERIDIAN',470,92,230,accent,10)}
 else{sprite(c,'table',92,120,70,54);sprite(c,'table',165,120,62,54);sprite(c,'sofa',275,252,76,40);sprite(c,'table',492,265,108,34);sprite(c,'vending',548,101,36,55);label(c,'LOCAL BUSINESS / OPEN LATE',470,90,230,accent,10)}
 rect(c,370,H-51,60,23,'#262f49');rect(c,370,H-51,60,1,accent);label(c,'EXIT [E]',370,H-35,60,accent,10);
}
function portrait(canvas,speaker,expression=0){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,64,80);const name=speaker.toUpperCase(),index=name.includes('VEE')?0:name==='YOU'?1:name.includes('JAX')?2:name.includes('ROXY')?3:name.includes('SOL')?4:5;c.drawImage(images.portraits,index*64,expression*80,64,80,0,0,64,80)}
return {portrait,ready,bakeTerrain,character,vehicle,atmosphere,interior,sprite,glow,palettes};
})();
