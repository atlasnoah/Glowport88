/* Original Glowport '88 neighborhood architecture. All surfaces are integer pixel art. */
(function (global) {
  'use strict';

  const CACHE_LIMIT = 128;
  const CACHE_BYTES = 8 * 1024 * 1024;
  const cache = new Map();
  let cacheBytes = 0, hits = 0, misses = 0;
  const architectures = Object.freeze([
    {id:'cottage',name:'Single-story cottage',roofType:'cross-gable',features:['front-gable','side-chimney','paired-windows']},
    {id:'family',name:'Two-story family house',roofType:'hip',features:['two-floors','upper-shutters','central-entry']},
    {id:'ranch',name:'Low ranch house',roofType:'long-hip',features:['low-profile','picture-window','long-front-stoop']},
    {id:'split',name:'Split-level house',roofType:'stepped-gable',features:['offset-levels','raised-wing','recessed-entry']},
    {id:'duplex',name:'Twin-gable duplex',roofType:'twin-gable',features:['two-roofs','two-entrances','shared-wall']},
    {id:'townhouse',name:'Three townhouses',roofType:'stepped-parapet',features:['three-units','two-floors','individual-stoops']},
    {id:'row',name:'Attached row homes',roofType:'sawtooth-parapet',features:['four-units','staggered-cornices','repeated-bays']},
    {id:'bungalow',name:'Craftsman bungalow',roofType:'hip-and-porch-gable',features:['wide-eaves','front-porch','stone-piers']},
    {id:'estate',name:'Upscale garden house',roofType:'three-hip',features:['central-pavilion','two-wings','balustrade']},
    {id:'weathered',name:'Weathered saltbox house',roofType:'saltbox',features:['unequal-roof-slopes','lean-to','patched-clapboards']},
    {id:'starter',name:'Compact starter home',roofType:'narrow-gable',features:['narrow-footprint','side-stoop','garden-window']},
    {id:'porch',name:'Wraparound porch house',roofType:'gable-and-veranda',features:['wraparound-veranda','porch-columns','roof-dormer']},
    {id:'attached',name:'House with attached garage',roofType:'offset-hip',features:['low-garage-wing','sectional-door','covered-entry']},
    {id:'detached',name:'House and detached garage',roofType:'separate-gables',features:['separate-garage','open-side-drive','small-main-house']},
    {id:'corner',name:'Corner-lot L house',roofType:'L-cross-gable',features:['L-shaped-plan','side-entry','corner-window']}
  ].map(a => Object.freeze({...a,features:Object.freeze(a.features)})));
  const palettes = {
    west:[['#b4a18c','#827268','#736b75','#494758','#d8b9a0'],['#9ba29a','#717b78','#75676b','#494451','#d1b5a0'],['#bd9a83','#87695e','#6e6370','#434052','#d8c4a1']],
    core:[['#9e9fba','#74788e','#576779','#354758','#d0c0b8'],['#a5b6b6','#738b90','#68758a','#414e67','#d9c8b6'],['#b29da8','#806e83','#687b89','#3d5365','#d3b6a3']],
    north:[['#c3b294','#92866f','#58747a','#354e5c','#ebd1a7'],['#a7b29d','#768474','#687587','#424d65','#d9c5a5'],['#c4b6a7','#958979','#637572','#3b5355','#ead1ac']],
    south:[['#bba087','#8c776a','#89746e','#584a51','#d8c6a4'],['#a8afa1','#75887e','#6b7f80','#40565e','#dfc6a3'],['#bea792','#8d796c','#8e7478','#574955','#ddc5a2']],
    east:[['#a1aaa5','#73847e','#637d83','#3b535e','#d3c0a1'],['#ada598','#7e7b75','#79716c','#4c4b53','#d6c3a1'],['#97a7aa','#677c85','#657a85','#3b4d61','#cdbca5']]
  };
  const R = Math.round;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function rect(c,x,y,w,h,color) {
    x=R(x);y=R(y);w=R(w);h=R(h);
    if(w<=0||h<=0)return;
    c.fillStyle=color;c.fillRect(x,y,w,h);
  }
  function poly(c,points,color) {
    c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(R(p[0]),R(p[1])):c.moveTo(R(p[0]),R(p[1])));c.closePath();c.fill();
  }
  function line(c,x1,y1,x2,y2,color,width) {
    c.strokeStyle=color;c.lineWidth=width||1;c.beginPath();c.moveTo(R(x1)+.5,R(y1)+.5);c.lineTo(R(x2)+.5,R(y2)+.5);c.stroke();
  }
  function hash(n) { n=Math.imul(n ^ (n>>>16),0x45d9f3b);n=Math.imul(n ^ (n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0; }
  function seedOf(b) { return hash((R(b.x||0)*37)^(R(b.y||0)*149)^((b.variant||0)*997)); }
  function variantOf(b,max) {return((R(b.variant||0)%(max||15))+(max||15))%(max||15);}
  function entranceFor(b) {
    const kind=b.kind||b.zone||'house',v=variantOf(b);
    const centers=[.505,.505,.81,.425,.36,.5,.54,.505,.5,.61,.67,.505,.45,.48,.45];
    const home=kind==='house'||kind==='residential',x=Number(b.x)||0,y=Number(b.y)||0,w=Number(b.w)||0,h=Number(b.h)||0;
    return{x:R(x+w*(home?centers[v]:.5)),y:R(y+h*(home&&v===2?.94:home&&v===10?.95:1))};
  }
  function districtOf(b) {
    const d=String(b.district||'south').toLowerCase();
    return /core|downtown|neon/.test(d)?'core':/north|wealth|heights/.test(d)?'north':/west|sunset/.test(d)?'west':/east|industrial|dock/.test(d)?'east':'south';
  }
  function palette(b) {
    const family=palettes[districtOf(b)],index=Number.isFinite(b.palette)?Math.abs(R(b.palette))%family.length:variantOf(b)%family.length;
    const p=family[index],custom=/^#[0-9a-f]{6}$/i.test(b.palette||'')?b.palette:null;
    const shade=custom?'#'+[1,3,5].map(i=>Math.round(parseInt(custom.slice(i,i+2),16)*.74).toString(16).padStart(2,'0')).join(''):p[1];
    return{wall:custom||p[0],shade,roof:/^#[0-9a-f]{6}$/i.test(b.roof||'')?b.roof:p[2],roofDark:p[3],trim:p[4],outline:'#28333c',glass:'#3f6577',glassLight:'#8ea8a8',lamp:'#e9c18b',wood:'#837667'};
  }
  function groundShadow(c,x,y,w,h) {
    const lighting=global.GlowportArt&&global.GlowportArt.lighting,settings=lighting&&lighting.shadows;
    c.save();c.globalAlpha=clamp(settings&&Number.isFinite(settings.buildingOpacity)?settings.buildingOpacity:.38,0,1);
    poly(c,[[x+3,y+4],[x+w+5,y+4],[x+w+7,y+h+5],[x+5,y+h+6]],settings&&settings.buildingColor||'#25383b');
    c.restore();
    rect(c,x+1,y+h,w+3,3,'#34433f');
  }
  function clapboard(c,x,y,w,h,p,weathered) {
    rect(c,x,y,w,h,p.wall);
    for(let yy=R(y)+4;yy<y+h-1;yy+=5){rect(c,x,yy,w,1,p.shade);rect(c,x+2,yy-1,w-4,1,weathered?'#b5a38a':p.wall);}
    rect(c,x,y,2,h,p.trim);rect(c,x+w-2,y,2,h,p.shade);
    rect(c,x,y+h-3,w,3,p.shade);
    if(weathered)for(let i=0;i<7;i++){const px=x+3+hash(i+67)%Math.max(1,R(w-9)),py=y+3+hash(i+34)%Math.max(1,R(h-5));rect(c,px,py,4+(i%3),1,'#726f67');}
  }
  function brick(c,x,y,w,h,p) {
    rect(c,x,y,w,h,p.wall);
    for(let yy=R(y)+3,row=0;yy<y+h-2;yy+=5,row++){
      rect(c,x,yy,w,1,p.shade);
      for(let xx=R(x)+((row%2)*5);xx<x+w-2;xx+=10)rect(c,xx,yy-3,1,3,p.shade);
    }
    rect(c,x,y+h-3,w,3,p.outline);
  }
  function windowPane(c,x,y,w,h,p,options) {
    const o=options||{};x=R(x);y=R(y);w=Math.max(5,R(w));h=Math.max(6,R(h));
    if(o.shutters){rect(c,x-3,y,2,h,p.shade);rect(c,x+w+1,y,2,h,p.shade);for(let yy=y+2;yy<y+h;yy+=3){rect(c,x-3,yy,2,1,p.trim);rect(c,x+w+1,yy,2,1,p.trim);}}
    rect(c,x-1,y-1,w+2,h+2,p.outline);rect(c,x,y,w,h,p.trim);
    rect(c,x+1,y+1,w-2,h-2,o.lit?p.lamp:p.glass);
    rect(c,x+2,y+2,w-4,2,o.lit?'#f1d8a4':p.glassLight);
    rect(c,x+R(w/2),y+1,1,h-2,p.trim);
    if(h>10)rect(c,x+1,y+R(h*.56),w-2,1,p.trim);
    rect(c,x-1,y+h,w+2,2,p.shade);
    if(o.box){rect(c,x-1,y+h+2,w+2,3,'#635f51');for(let i=0;i<w;i+=4){rect(c,x+i,y+h,3,2,'#52796b');rect(c,x+i+1,y+h-1,1,1,i%8?'#c58b9c':'#d4b681');}}
  }
  function door(c,x,y,w,h,p,o) {
    o=o||{};x=R(x);y=R(y);w=R(w);h=R(h);
    rect(c,x-2,y-2,w+4,h+3,p.trim);rect(c,x-1,y-1,w+2,h+1,p.outline);rect(c,x,y,w,h,o.color||'#685d61');
    if(o.glass!==false){rect(c,x+2,y+2,w-4,Math.max(4,R(h*.38)),p.glass);rect(c,x+3,y+3,Math.max(1,w-6),1,p.glassLight);}
    rect(c,x+2,y+R(h*.65),w-4,Math.max(2,R(h*.22)),p.shade);
    rect(c,x+w-3,y+R(h*.58),1,2,'#d9b788');rect(c,x-2,y+h,w+4,2,p.shade);
    if(o.stoop!==false){rect(c,x-4,y+h+2,w+8,3,'#9a9a8c');rect(c,x-5,y+h+5,w+10,2,'#647570');}
  }
  function roof(c,x,y,w,h,p,type) {
    x=R(x);y=R(y);w=R(w);h=R(h);
    const inset=clamp(R(w*.13),4,12),ridge=R(y+h*.32);
    let pts;
    if(type==='gable')pts=[[x,y+h],[x+R(w*.5),y],[x+w,y+h]];
    else if(type==='saltbox')pts=[[x,y+h],[x+R(w*.28),y],[x+w-2,y+h-4],[x+w,y+h]];
    else if(type==='flat')pts=[[x,y+2],[x+w,y+2],[x+w,y+h],[x,y+h]];
    else pts=[[x,y+h],[x+inset,y],[x+w-inset,y],[x+w,y+h]];
    poly(c,pts,p.roofDark);
    c.save();c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.clip();
    rect(c,x+2,y+2,w-4,h-3,p.roof);
    for(let yy=y+5,row=0;yy<y+h;yy+=5,row++){
      rect(c,x,yy,w,1,p.roofDark);
      for(let xx=x+(row%2?6:0);xx<x+w;xx+=12){rect(c,xx,yy-3,1,3,p.roofDark);rect(c,xx+2,yy-3,5,1,p.roof);}
    }
    if(type!=='gable'&&type!=='saltbox'&&type!=='flat'){
      line(c,x+inset,y+2,x+R(w*.5)-4,ridge,p.roofDark);line(c,x+w-inset,y+2,x+R(w*.5)+4,ridge,p.roofDark);
      rect(c,x+R(w*.32),ridge,R(w*.36),2,p.roofDark);rect(c,x+R(w*.32),ridge-1,R(w*.36),1,p.trim);
    } else if(type==='gable')line(c,x+R(w*.5),y+2,x+R(w*.5),y+h-2,p.roofDark,2);
    c.restore();
    rect(c,x,y+h-2,w,3,p.outline);rect(c,x+1,y+h-2,w-2,1,p.trim);
    if(type==='flat'){rect(c,x+3,y+4,w-6,2,p.trim);rect(c,x+4,y+6,w-8,2,p.roofDark);}
  }
  function chimney(c,x,y,p,tall) {
    const h=tall?15:11;rect(c,x+1,y+2,7,h,p.outline);rect(c,x,y,6,h,p.shade);rect(c,x-1,y,8,2,p.trim);
    for(let yy=y+4;yy<y+h;yy+=4){rect(c,x,yy,6,1,p.roofDark);rect(c,x+3,yy-2,1,2,p.roofDark);}
  }
  function porch(c,x,y,w,h,p,posts) {
    rect(c,x-1,y-1,w+2,h+3,p.outline);rect(c,x,y,w,h,p.wood);
    for(let yy=y+3;yy<y+h;yy+=4)rect(c,x,yy,w,1,p.shade);
    rect(c,x-1,y+h-2,w+2,2,p.trim);
    const count=posts||3;
    for(let i=0;i<count;i++){const xx=R(x+i*(w-3)/Math.max(1,count-1));rect(c,xx,y-6,3,h+5,p.shade);rect(c,xx,y-6,1,h+4,p.trim);rect(c,xx-1,y+h-4,5,4,p.shade);}
    rect(c,x-2,y-9,w+4,4,p.roofDark);rect(c,x-2,y-9,w+4,1,p.trim);
    rect(c,x+R(w*.38),y+h,w*.24,3,p.shade);rect(c,x+R(w*.35),y+h+3,w*.3,2,p.trim);
  }
  function garage(c,x,y,w,h,p,detached) {
    groundShadow(c,x,y,w,h);clapboard(c,x+2,y+h*.45,w-4,h*.55,p);roof(c,x-1,y,w+2,h*.49,p,detached?'gable':'hip');
    const gx=R(x+6),gy=R(y+h*.57),gw=R(w-12),gh=R(h*.43-3);
    rect(c,gx-1,gy-1,gw+2,gh+2,p.outline);rect(c,gx,gy,gw,gh,p.trim);
    for(let yy=gy+4;yy<gy+gh;yy+=4)rect(c,gx,yy,gw,1,p.shade);
    for(let xx=gx+3;xx<gx+gw-2;xx+=7){rect(c,xx,gy+2,4,3,p.glass);rect(c,xx,gy+2,3,1,p.glassLight);}
    rect(c,gx+R(gw*.5)-2,gy+gh-4,4,1,p.roofDark);
  }
  function body(c,x,y,w,h,p,material) {
    groundShadow(c,x,y,w,h);
    (material==='brick'?brick:clapboard)(c,x,y,w,h,p,material==='weathered');
  }
  function house(c,b) {
    const p=palette(b),w=R(b.w),h=R(b.h),v=variantOf(b),X=n=>R(w*n),Y=n=>R(h*n);
    const win=(x,y,ww,hh,o)=>windowPane(c,X(x),Y(y),X(ww),Y(hh),p,{lit:hash(v*17+R(x*37)+R(y*71))%6===0,...o});
    const entry=(x,y,ww,hh,o)=>door(c,X(x),Y(y),X(ww),Y(hh),p,o);
    if(v===0){
      body(c,3,Y(.5),w-6,Y(.5),p);roof(c,0,2,w,Y(.56),p,'hip');roof(c,X(.27),0,X(.45),Y(.6),p,'gable');
      win(.08,.68,.18,.2,{shutters:true});win(.73,.68,.18,.2,{shutters:true});entry(.45,.7,.11,.3);chimney(c,X(.15),Y(.1),p);
    } else if(v===1){
      body(c,5,Y(.35),w-10,Y(.65),p,'brick');roof(c,1,1,w-2,Y(.39),p,'hip');
      for(const x of [.14,.43,.72])win(x,.43,.13,.17,{shutters:true});win(.13,.73,.19,.16);win(.69,.73,.19,.16);entry(.45,.72,.11,.28);rect(c,X(.39),Y(.68),X(.23),3,p.trim);chimney(c,X(.75),0,p,true);
    } else if(v===2){
      body(c,2,Y(.63),w-4,Y(.31),p);roof(c,-1,Y(.2),w+2,Y(.48),p,'hip');
      win(.08,.73,.31,.14);win(.48,.73,.14,.14);entry(.76,.7,.1,.24,{stoop:false});rect(c,X(.67),Y(.94),X(.3),4,p.trim);rect(c,X(.64),Y(.98),X(.36),3,p.shade);chimney(c,X(.19),Y(.28),p);
    } else if(v===3){
      body(c,1,Y(.53),X(.56),Y(.46),p,'brick');body(c,X(.53),Y(.28),X(.45),Y(.63),p);
      roof(c,-1,Y(.22),X(.6),Y(.35),p,'gable');roof(c,X(.5),0,X(.5),Y(.34),p,'hip');
      win(.08,.67,.23,.17);win(.63,.41,.2,.17,{shutters:true});win(.63,.7,.2,.13);entry(.37,.74,.11,.25);
      for(let i=0;i<3;i++)rect(c,X(.35)-i,Y(.98)+i*2,X(.16)+i*2,2,p.trim);
    } else if(v===4){
      body(c,2,Y(.51),w-4,Y(.49),p);roof(c,-1,0,X(.51),Y(.56),p,'gable');roof(c,X(.49),0,X(.52),Y(.56),p,'gable');
      rect(c,X(.49),Y(.56),2,Y(.44),p.shade);win(.06,.67,.17,.17,{box:true});win(.76,.67,.17,.17,{box:true});entry(.31,.7,.1,.3);entry(.58,.7,.1,.3);
      rect(c,X(.23),Y(.95),2,7,p.trim);rect(c,X(.76),Y(.95),2,7,p.trim);
    } else if(v===5){
      for(let i=0;i<3;i++){const x=X(i/3),ww=X(1/3)-1,yy=Y(.08+(i%2)*.07);const pp={...p,wall:i===1?p.trim:p.wall};
        body(c,x+1,yy+Y(.25),ww-2,h-yy-Y(.25),pp,'brick');roof(c,x,yy,ww,Y(.29),pp,'flat');
        rect(c,x,yy-3,ww,5,p.outline);rect(c,x+2,yy-3,ww-4,2,p.trim);windowPane(c,x+5,Y(.48),ww-10,Y(.17),p);door(c,x+R(ww*.33),Y(.76),Math.max(7,R(ww*.3)),Y(.24),p);}
    } else if(v===6){
      for(let i=0;i<4;i++){const x=X(i*.25),ww=X(.25)-1,yy=Y(.12+(i%2)*.08);body(c,x,yy+Y(.2),ww,h-yy-Y(.2),p,'brick');roof(c,x-1,yy,ww+2,Y(.23),p,'flat');
        rect(c,x-1,yy-4,ww+2,4,p.shade);rect(c,x+3,yy-7,ww-6,4,p.trim);windowPane(c,x+5,Y(.48),ww-10,Y(.15),p);door(c,x+3,Y(.79),Math.max(6,ww-13),Y(.21),p,{stoop:false});rect(c,x+1,h,ww-2,3,p.trim);}
    } else if(v===7){
      body(c,6,Y(.43),w-12,Y(.53),p);roof(c,-2,0,w+4,Y(.56),p,'hip');
      win(.13,.59,.16,.17,{shutters:true});win(.71,.59,.16,.17,{shutters:true});entry(.45,.61,.11,.34,{stoop:false});
      porch(c,X(.28),Y(.83),X(.44),Y(.15),p,2);roof(c,X(.24),Y(.34),X(.52),Y(.39),p,'gable');rect(c,X(.48),Y(.47),X(.06),Y(.09),p.glass);
      rect(c,X(.25),Y(.88),5,Y(.13),p.trim);rect(c,X(.71),Y(.88),5,Y(.13),p.trim);
    } else if(v===8){
      body(c,1,Y(.55),X(.3),Y(.4),p,'brick');body(c,X(.69),Y(.55),X(.3),Y(.4),p,'brick');body(c,X(.25),Y(.28),X(.5),Y(.72),p);
      roof(c,-1,Y(.21),X(.34),Y(.38),p,'hip');roof(c,X(.67),Y(.21),X(.34),Y(.38),p,'hip');roof(c,X(.21),0,X(.58),Y(.35),p,'hip');
      win(.08,.69,.14,.16);win(.78,.69,.14,.16);for(const x of [.33,.56])win(x,.43,.12,.17,{shutters:true});entry(.445,.72,.11,.28);
      rect(c,X(.3),Y(.66),X(.4),2,p.trim);for(let x=X(.3);x<X(.7);x+=5)rect(c,x,Y(.66),2,5,p.trim);rect(c,X(.29),Y(.72),X(.42),2,p.shade);chimney(c,X(.74),Y(.19),p,true);
    } else if(v===9){
      body(c,X(.12),Y(.46),X(.86),Y(.54),p,'weathered');body(c,1,Y(.67),X(.29),Y(.31),p,'weathered');roof(c,X(.08),0,X(.92),Y(.53),p,'saltbox');roof(c,-1,Y(.42),X(.34),Y(.28),p,'hip');
      win(.34,.65,.16,.18,{shutters:true});win(.71,.65,.15,.18);entry(.56,.73,.1,.27);chimney(c,X(.37),Y(.08),p,true);rect(c,X(.76),Y(.63),3,Y(.23),'#7c6f61');rect(c,X(.72),Y(.75),X(.13),2,p.shade);
      rect(c,X(.15),Y(.81),X(.07),Y(.1),p.glass);rect(c,X(.18),Y(.8),1,Y(.12),p.trim);
    } else if(v===10){
      body(c,X(.18),Y(.5),X(.64),Y(.45),p);roof(c,X(.13),Y(.09),X(.74),Y(.46),p,'gable');win(.27,.66,.19,.17,{box:true});entry(.62,.65,.1,.3);rect(c,X(.57),Y(.95),X(.22),4,p.trim);rect(c,X(.56),Y(.99),X(.24),2,p.shade);chimney(c,X(.23),Y(.2),p);
    } else if(v===11){
      body(c,5,Y(.39),w-10,Y(.56),p);roof(c,1,0,w-2,Y(.45),p,'hip');win(.14,.55,.17,.17);win(.7,.55,.17,.17);entry(.45,.61,.11,.34,{stoop:false});
      porch(c,0,Y(.86),w,Y(.13),p,5);rect(c,0,Y(.63),X(.1),Y(.32),p.wood);rect(c,0,Y(.63),3,Y(.36),p.trim);
      roof(c,X(.39),Y(.11),X(.23),Y(.26),p,'gable');windowPane(c,X(.46),Y(.24),X(.09),Y(.09),p);rect(c,X(.43),Y(.4),X(.15),2,p.trim);
    } else if(v===12){
      body(c,2,Y(.41),X(.58),Y(.59),p);roof(c,-1,0,X(.64),Y(.47),p,'hip');garage(c,X(.6),Y(.38),X(.4),Y(.62),p,false);
      win(.1,.57,.17,.18,{shutters:true});entry(.4,.7,.1,.3);rect(c,X(.33),Y(.67),X(.24),4,p.trim);rect(c,X(.35),Y(.68),2,Y(.31),p.shade);
    } else if(v===13){
      body(c,2,Y(.46),X(.6),Y(.54),p);roof(c,-1,Y(.07),X(.65),Y(.45),p,'gable');win(.09,.65,.17,.18,{box:true});entry(.43,.7,.1,.3);chimney(c,X(.16),Y(.17),p);
      garage(c,X(.7),Y(.2),X(.3),Y(.38),p,true);rect(c,X(.72),Y(.59),X(.27),Y(.41),'#6b7975');for(let yy=Y(.61);yy<h;yy+=10)rect(c,X(.73),yy,X(.25),1,'#778580');
    } else {
      body(c,2,Y(.37),X(.58),Y(.63),p);body(c,X(.54),Y(.63),X(.44),Y(.37),p);roof(c,-1,0,X(.64),Y(.44),p,'gable');roof(c,X(.5),Y(.32),X(.5),Y(.35),p,'hip');
      win(.12,.56,.16,.19,{shutters:true});win(.12,.83,.16,.1);win(.64,.74,.21,.14,{box:true});entry(.4,.72,.1,.28);rect(c,X(.93),Y(.7),3,Y(.19),p.glass);rect(c,X(.96),Y(.7),2,Y(.19),p.trim);
      porch(c,X(.34),Y(.91),X(.23),Y(.08),p,2);
    }
    // A house number and porch fixture give homes human scale without shop signs.
    const nx=clamp(X(v===10?.74:v===13?.56:.59),4,w-8),ny=Y(.88);
    rect(c,nx,ny,5,3,p.trim);rect(c,nx+1,ny+1,1,1,p.shade);rect(c,nx+3,ny+1,1,1,p.shade);
  }

  function apartment(c,b) {
    const p=palette(b),w=R(b.w),h=R(b.h),v=variantOf(b,5),top=R(h*.28),floors=v===2?3:2;
    if(v===3){
      body(c,0,top,R(w*.37),h-top,p,'brick');body(c,R(w*.63),top,R(w*.37),h-top,p,'brick');body(c,R(w*.35),top,R(w*.3),R(h*.35),p,'brick');
      roof(c,-1,0,R(w*.39),top+3,p,'flat');roof(c,R(w*.61),0,R(w*.4),top+3,p,'flat');roof(c,R(w*.35),R(h*.04),R(w*.3),top,p,'flat');
      for(let side=0;side<2;side++)for(let row=0;row<2;row++)windowPane(c,R(w*(side?.72:.08)),R(h*(.43+row*.27)),R(w*.17),R(h*.13),p);
      rect(c,R(w*.4),R(h*.65),R(w*.2),R(h*.35),'#626e65');rect(c,R(w*.43),R(h*.7),R(w*.14),3,'#879482');shrub(c,R(w*.47),R(h*.8),5);
    } else {
      body(c,3,top,w-6,h-top,p,v===1?'clapboard':'brick');roof(c,0,0,w,top+3,p,v===4?'hip':'flat');
      if(v===2){rect(c,7,4,R(w*.31),R(top*.65),p.roofDark);rect(c,9,6,R(w*.31)-4,4,p.trim);}
      const cols=clamp(Math.floor(w/23),3,7),ww=R(w/(cols+1)*.54),hh=R((h-top)/(floors+1)*.56);
      for(let row=0;row<floors;row++)for(let col=0;col<cols;col++){
        const wx=R((col+.7)*w/cols),wy=R(top+8+row*(h-top-19)/floors);
        windowPane(c,wx,wy,ww,hh,p,{shutters:v===1,lit:(row+col)%5===0});
        if(v===1||v===4){rect(c,wx-3,wy+hh+3,ww+6,2,p.trim);for(let xx=wx-3;xx<wx+ww+4;xx+=4)rect(c,xx,wy+hh-2,1,5,p.outline);}
      }
      const dw=clamp(R(w*.12),9,18);door(c,R(w/2-dw/2),h-18,dw,18,p,{glass:true});
      if(v===0||v===2){rect(c,w-10,top+5,4,h-top-8,p.roofDark);for(let yy=top+7;yy<h-5;yy+=5)rect(c,w-13,yy,10,1,p.outline);}
      if(v===4){rect(c,0,h-2,w,3,p.trim);rect(c,0,top+2,w,2,p.trim);}
    }
  }
  function rooftopPlant(c,x,y,w,h,p) {
    rect(c,x,y,w,h,p.outline);rect(c,x+1,y+1,w-2,h-2,p.shade);rect(c,x+2,y+2,w-4,2,p.trim);
    for(let xx=x+3;xx<x+w-2;xx+=3)rect(c,xx,y+5,1,h-7,p.roofDark);
  }
  function sign(c,x,y,w,h,label,color,neon) {
    rect(c,x-2,y-2,w+4,h+4,'#253544');rect(c,x,y,w,h,neon?'#29313e':'#d0c2a2');
    if(neon){rect(c,x,y,w,1,color);rect(c,x,y+h-1,w,1,color);rect(c,x,y,1,h,color);rect(c,x+w-1,y,1,h,color);}
    c.fillStyle=neon?color:'#3d5359';c.font='bold 6px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(label,R(x+w/2),R(y+h/2)+1,Math.max(1,R(w-4)));
  }
  function commercial(c,b) {
    const p=palette(b),w=R(b.w),h=R(b.h),v=variantOf(b,7),core=districtOf(b)==='core',accent=core?['#ec8fbe','#79c8c0','#b6a0df'][v%3]:'#b9bca5';
    if(v===5){
      // A service station has an open forecourt and low canopy, not another shop block.
      body(c,2,2,R(w*.6),R(h*.49),p,'brick');roof(c,0,0,R(w*.65),R(h*.2),p,'flat');windowPane(c,8,R(h*.25),R(w*.31),R(h*.15),p);door(c,R(w*.46),R(h*.24),10,R(h*.26),p,{stoop:false});
      for(const xx of [.22,.76]){rect(c,R(w*xx),R(h*.57),3,R(h*.39),p.trim);rect(c,R(w*xx)-3,R(h*.84),9,11,'#b7a99c');rect(c,R(w*xx)-2,R(h*.85),7,5,p.outline);rect(c,R(w*xx)+4,R(h*.88),2,6,p.roofDark);}
      rect(c,0,R(h*.52),w,9,p.outline);rect(c,1,R(h*.52),w-2,3,accent);rect(c,2,R(h*.57),w-4,3,p.trim);sign(c,R(w*.65),R(h*.13),R(w*.32),11,'FUEL',accent,false);return;
    }
    const roofH=R(h*(v===4?.34:.43));body(c,2,roofH-2,w-4,h-roofH+2,p,v===2?'clapboard':'brick');roof(c,-1,0,w+2,roofH+2,p,v===2?'hip':'flat');
    rooftopPlant(c,R(w*.13),R(h*.1),R(w*.2),R(h*.18),p);if(w>100)rooftopPlant(c,R(w*.61),R(h*.12),R(w*.18),R(h*.13),p);
    const awningY=R(h*.61),shopY=R(h*.73),shopH=R(h*.23),shopW=R(w*.24);
    windowPane(c,6,shopY,shopW,shopH,p,{lit:core});windowPane(c,w-shopW-6,shopY,shopW,shopH,p,{lit:core});door(c,R(w*.46),shopY,R(w*.1),h-shopY,p,{stoop:false});
    if(v===1||v===2||v===6){
      rect(c,0,awningY,w,7,p.outline);for(let xx=2,i=0;xx<w-2;xx+=7,i++)rect(c,xx,awningY+1,Math.min(7,w-xx-2),5,i%2?p.trim:accent);rect(c,0,awningY+6,w,2,p.shade);
    }
    const words=['MARKET','CAFE','CORNER STORE','RECORDS','OFFICES','SERVICE','LAUNDRY'];
    sign(c,R(w*.2),R(h*.47),R(w*.6),10,words[v],accent,core);
    if(v===3){rect(c,w-5,roofH,7,R(h*.43),p.outline);rect(c,w-3,roofH+2,3,R(h*.39),accent);}
    if(v===4){for(let col=0;col<3;col++)windowPane(c,R(w*(.12+col*.28)),R(h*.4),R(w*.14),R(h*.15),p);sign(c,R(w*.31),R(h*.64),R(w*.38),8,'OFFICES',accent,false);}
    rect(c,2,h-2,w-4,3,p.trim);
  }
  function industrial(c,b) {
    const p=palette(b),w=R(b.w),h=R(b.h),v=variantOf(b,5),front=R(h*.64);
    body(c,2,front,w-4,h-front,p);roof(c,0,0,w,front+3,p,'flat');
    if(v===1){
      for(let i=0;i<3;i++){const xx=R(i*w/3),ww=R(w/3);poly(c,[[xx,front],[xx,12],[xx+ww-3,0],[xx+ww-3,front]],p.roof);rect(c,xx+3,12,ww-7,3,p.glassLight);line(c,xx+ww-3,0,xx+ww-3,front,p.roofDark,2);}
    } else if(v===3){
      for(let i=0;i<3;i++){const xx=R(w*(.12+i*.27));rect(c,xx,8,R(w*.19),front-17,p.roofDark);rect(c,xx+2,9,R(w*.19)-4,3,p.trim);rect(c,xx+2,12,R(w*.19)-4,front-24,p.shade);}
    } else {
      for(let yy=8;yy<front-4;yy+=7)rect(c,4,yy,w-8,1,p.roofDark);
      rooftopPlant(c,R(w*.15),8,R(w*.28),R(h*.25),p);rooftopPlant(c,R(w*.6),R(h*.22),R(w*.2),R(h*.2),p);
    }
    const bays=v===2?3:2,bw=R((w-20)/bays*.75),bh=R(h*.25);
    for(let i=0;i<bays;i++){const xx=R(8+i*(w-12)/bays);rect(c,xx-1,front+5,bw+2,bh+2,p.outline);rect(c,xx,front+6,bw,bh,p.shade);for(let yy=front+9;yy<front+bh+5;yy+=4)rect(c,xx,yy,bw,1,p.trim);rect(c,xx-2,h-3,bw+4,5,p.outline);for(let q=0;q<bw;q+=7)rect(c,xx+q,h-2,3,2,'#b3a573');}
    if(v===4){rect(c,w-10,9,8,front-3,'#545d61');rect(c,w-12,7,12,3,p.trim);}
    sign(c,R(w*.32),front-8,R(w*.38),7,v===2?'CITY WORKS':v===4?'POWER':'WAREHOUSE','#aeb9ad',false);
  }
  function civic(c,b) {
    const p=palette(b),w=R(b.w),h=R(b.h),v=variantOf(b,5);
    if(v===1){
      body(c,2,R(h*.46),w-4,R(h*.54),p,'brick');roof(c,0,R(h*.13),w,R(h*.37),p,'hip');
      for(let i=0;i<4;i++)windowPane(c,R(w*(.08+i*.23)),R(h*.65),R(w*.13),R(h*.19),p);
      body(c,R(w*.39),R(h*.28),R(w*.22),R(h*.72),p,'brick');roof(c,R(w*.35),0,R(w*.3),R(h*.33),p,'gable');door(c,R(w*.46),R(h*.75),R(w*.1),R(h*.25),p);sign(c,R(w*.32),R(h*.51),R(w*.36),8,'SCHOOL','#b4c7b4',false);
    } else if(v===2){
      body(c,3,R(h*.37),w-6,R(h*.63),p,'brick');roof(c,0,0,w,R(h*.42),p,'hip');
      for(const x of [.1,.7])windowPane(c,R(w*x),R(h*.55),R(w*.2),R(h*.22),p);door(c,R(w*.44),R(h*.65),R(w*.13),R(h*.35),p);
      for(const x of [.35,.62]){rect(c,R(w*x),R(h*.54),4,R(h*.46),p.trim);rect(c,R(w*x)-2,R(h*.53),8,3,p.shade);}roof(c,R(w*.29),R(h*.26),R(w*.41),R(h*.29),p,'gable');sign(c,R(w*.34),R(h*.38),R(w*.32),7,'LIBRARY','#c5c4ae',false);
    } else {
      body(c,3,R(h*.4),w-6,R(h*.6),p,'brick');roof(c,0,0,w,R(h*.44),p,'flat');
      for(let i=0;i<3;i++)windowPane(c,R(w*(.08+i*.3)),R(h*.58),R(w*.19),R(h*.19),p);door(c,R(w*.45),R(h*.75),R(w*.1),R(h*.25),p);
      sign(c,R(w*.19),R(h*.42),R(w*.62),9,['COMMUNITY','SCHOOL','LIBRARY','CLINIC','FIRE / RESCUE'][v],'#b9c3b2',false);
      if(v===3){rect(c,R(w*.79),8,9,3,'#c6a0a3');rect(c,R(w*.82),5,3,9,'#c6a0a3');}
      if(v===4){garage(c,R(w*.65),R(h*.31),R(w*.34),R(h*.69),p,false);rect(c,3,R(h*.36),R(w*.58),3,'#a46c63');}
    }
  }
  function special(c,b) {
    // Neighborhood pavilions/service buildings. Story landmarks use the approved atlas.
    const p=palette(b),w=R(b.w),h=R(b.h),v=variantOf(b,3);
    if(v===0){
      rect(c,5,R(h*.61),w-10,R(h*.36),p.wood);for(let x=8;x<w-6;x+=Math.max(12,R(w*.22)))rect(c,x,R(h*.31),3,R(h*.65),p.trim);roof(c,0,0,w,R(h*.52),p,'hip');rect(c,4,h-3,w-8,4,p.trim);for(let x=10;x<w-8;x+=5)rect(c,x,R(h*.81),2,R(h*.15),p.trim);rect(c,R(w*.4),R(h*.81),R(w*.2),R(h*.2),p.wood);
    }else if(v===1){body(c,4,R(h*.46),w-8,R(h*.54),p,'brick');roof(c,0,0,w,R(h*.51),p,'gable');windowPane(c,10,R(h*.62),R(w*.23),R(h*.2),p);door(c,R(w*.6),R(h*.64),R(w*.15),R(h*.36),p);sign(c,R(w*.22),R(h*.44),R(w*.56),8,'PARK OFFICE','#b0c2a0',false);}
    else {body(c,2,R(h*.5),w-4,R(h*.5),p);roof(c,0,0,w,R(h*.55),p,'hip');door(c,R(w*.24),R(h*.67),R(w*.15),R(h*.33),p);door(c,R(w*.63),R(h*.67),R(w*.15),R(h*.33),p);sign(c,R(w*.2),R(h*.48),R(w*.6),8,'RESTROOMS','#b2beb0',false);}
  }

  function renderBuilding(c,b) {
    const kind=b.kind||b.zone||'house';
    if(kind==='house'||kind==='residential')house(c,b);
    else if(kind==='apartment'||kind==='mixed-use')apartment(c,b);
    else if(kind==='commercial')commercial(c,b);
    else if(kind==='industrial'||kind==='municipal')industrial(c,b);
    else if(kind==='civic')civic(c,b);
    else special(c,b);
  }
  function clearCache() {
    for(const item of cache.values()){item.canvas.width=0;item.canvas.height=0;}
    cache.clear();cacheBytes=0;hits=0;misses=0;
  }
  function cacheKey(b) {
    const shadow=global.GlowportArt&&global.GlowportArt.lighting&&global.GlowportArt.lighting.shadows;
    return[b.kind||b.zone||'house',variantOf(b),R(b.w),R(b.h),districtOf(b),Number.isFinite(b.palette)?b.palette:0,b.roof||'',shadow&&shadow.buildingOpacity,shadow&&shadow.buildingColor].join(':');
  }
  function drawBuilding(c,b) {
    if(!c||!b||b.landmark||b.kind==='landmark'||!(b.w>0)||!(b.h>0))return;
    const x=R(b.x||0),y=R(b.y||0),w=R(b.w),h=R(b.h);
    if(!global.document||!global.document.createElement||w>400||h>400){c.save();c.translate(x,y);renderBuilding(c,{...b,x:0,y:0,w,h});c.restore();return;}
    // Home proportions vary by parcel while their fifteen structural stamps can
    // be shared. Integer nearest-neighbor blits keep edges crisp and avoid
    // rebuilding the same roof/window geometry at every property size.
    const home=['house','residential'].includes(b.kind||b.zone),rw=home?112:w,rh=home?96:h;
    const key=cacheKey({...b,w:rw,h:rh});let item=cache.get(key);
    if(item){hits++;cache.delete(key);cache.set(key,item);}
    else {
      misses++;const canvas=global.document.createElement('canvas'),pad=8;canvas.width=rw+pad*2;canvas.height=rh+pad*2+4;
      const cc=canvas.getContext('2d');if(!cc)return;cc.imageSmoothingEnabled=false;cc.translate(pad,pad);renderBuilding(cc,{...b,x:0,y:0,w:rw,h:rh});
      item={canvas,pad,bytes:canvas.width*canvas.height*4};
      while(cache.size&&(cache.size>=CACHE_LIMIT||cacheBytes+item.bytes>CACHE_BYTES)){const first=cache.keys().next().value,old=cache.get(first);cache.delete(first);cacheBytes-=old.bytes;old.canvas.width=0;old.canvas.height=0;}
      cache.set(key,item);cacheBytes+=item.bytes;
    }
    c.imageSmoothingEnabled=false;const sx=w/rw,sy=h/rh;
    c.drawImage(item.canvas,0,0,item.canvas.width,item.canvas.height,R(x-item.pad*sx),R(y-item.pad*sy),R(item.canvas.width*sx),R(item.canvas.height*sy));
  }
  function shrub(c,x,y,size,flower) {
    x=R(x);y=R(y);size=R(size||5);
    rect(c,x-size,y+2,size*2+2,size,'#344d45');rect(c,x-size+1,y-size+3,size*2-1,size+4,'#486f58');rect(c,x-size+3,y-size,size*2-5,size+4,'#648865');rect(c,x-size+2,y,size,2,'#6e946a');
    if(flower){rect(c,x-2,y-1,2,2,flower);rect(c,x+2,y+1,2,2,flower);}
  }
  function tree(c,x,y,size) {
    size=R(size||11);x=R(x);y=R(y);rect(c,x-3,y,7,size+9,'#3d4b40');rect(c,x-1,y,3,size+7,'#897760');
    rect(c,x-size+2,y-size+4,size*2-3,size+8,'#2d5147');rect(c,x-size+4,y-size,size*2-7,size*2-2,'#3f6851');rect(c,x-size+7,y-size-3,size*2-13,size*2,'#547c58');
    rect(c,x-size+5,y-size+3,size-3,4,'#658762');rect(c,x+2,y+2,size-5,3,'#497650');rect(c,x-size+3,y+5,5,3,'#547c58');
  }
  function nearPath(x,y,points,radius) {
    if(!Array.isArray(points))return false;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
      const t=den?clamp(((x-a.x)*dx+(y-a.y)*dy)/den,0,1):0;
      if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<radius)return true;
    }
    return false;
  }
  function pixelPath(c,points,width,color) {
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite))continue;
      const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3));
      for(let n=0;n<=steps;n++){const t=n/steps;rect(c,a.x+(b.x-a.x)*t-width/2,a.y+(b.y-a.y)*t-width/2,width,width,color);}
    }
  }
  function fence(c,x,y,w,h,type,gapX,gapW,approach,driveway,drivewayWidth) {
    const col=type==='chain'?'#788e86':'#8e8a72',dark=type==='chain'?'#49675f':'#666c5d';
    const opening=(px,py)=>nearPath(px,py,approach,11)||nearPath(px,py,driveway,(drivewayWidth||40)/2+4);
    for(let xx=R(x);xx<x+w;xx+=7){if(opening(xx+3,y+2))continue;rect(c,xx,y,1,5,col);rect(c,xx,y+3,Math.min(7,x+w-xx),1,dark);}
    for(let yy=R(y);yy<y+h-4;yy+=8){
      if(!opening(x,yy+3)){rect(c,x,yy,1,6,col);rect(c,x+1,yy+3,1,4,dark);}
      if(!opening(x+w,yy+3)){rect(c,x+w-1,yy,1,6,col);rect(c,x+w-2,yy+3,1,4,dark);}
    }
    for(let xx=R(x);xx<x+w;xx+=7){if((xx>gapX-4&&xx<gapX+gapW+4)||opening(xx+3,y+h-3))continue;rect(c,xx,y+h-5,1,5,col);rect(c,xx,y+h-3,Math.min(7,x+w-xx),1,dark);}
  }
  function drawLot(c,b) {
    if(!c||!b||!b.lot)return;
    const l=b.lot,x=R(l.x),y=R(l.y),w=R(l.w),h=R(l.h);if(!(w>0&&h>0))return;
    const v=variantOf(b),seed=seedOf(b),kind=b.kind||b.zone,home=kind==='house'||kind==='residential';
    if(!home){
      const concrete=kind==='industrial'?'#667473':'#7b8780';rect(c,x,y,w,h,concrete);
      for(let yy=y+13;yy<y+h;yy+=23)rect(c,x+2,yy,w-4,1,'#6e7d77');
      if(kind==='civic'||kind==='apartment'){rect(c,x,y,6,h,'#4a6954');rect(c,x+w-6,y,6,h,'#4a6954');for(let yy=y+10;yy<y+h-8;yy+=22){shrub(c,x+3,yy,4);shrub(c,x+w-4,yy,4);}}
      if(Array.isArray(l.approach)){const path=[entranceFor(b),...l.approach];pixelPath(c,path,8,'#8e9983');pixelPath(c,path,6,'#bab29a');}
      return;
    }
    const greens=['#58775c','#587960','#607c60','#657b60','#52745c'];rect(c,x,y,w,h,greens[v%greens.length]);
    // Sparse grouped grass pixels, never noise across the roof or the street.
    for(let i=0;i<Math.min(28,Math.floor(w*h/550));i++){const px=x+3+hash(seed+i*17)%Math.max(1,w-7),py=y+3+hash(seed+i*31)%Math.max(1,h-7);rect(c,px,py,3,1,i%2?'#6e8865':'#4d7057');rect(c,px+1,py-1,1,1,'#6e8865');}
    const entrance=entranceFor(b),streetY=l.access&&Number.isFinite(l.access.y)?R(l.access.y):y+h,doorX=entrance.x,front=entrance.y,walkW=7;
    let driveX=Number.isFinite(l.drivewayX)?R(l.drivewayX):R(x+w-22),driveW=R(l.drivewayW||14);
    const driveway=Array.isArray(l.driveway)&&l.driveway.length>1&&l.driveway.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))?l.driveway:null;
    if(driveway){
      // Geometry comes from the same collision-checked parcel access as traffic.
      // Raster steps keep curved and side-yard entrances aligned to native pixels.
      driveW=clamp(driveW,40,56);pixelPath(c,driveway,driveW,'#8a9081');pixelPath(c,driveway,driveW-4,'#a4a492');
    }else if(!Array.isArray(l.approach)){
      // Standalone art specimens retain a short property pad. Production parcels
      // only paint a driveway when the layout supplies a real street connection.
      driveX=clamp(driveX,x+3,x+w-driveW-3);const driveTop=Math.max(y+4,R(b.y+b.h*.43)),driveBottom=Math.min(y+h,Math.max(front+6,streetY));
      rect(c,driveX,driveTop,driveW,Math.max(0,driveBottom-driveTop),'#8a9081');rect(c,driveX+2,driveTop,driveW-4,Math.max(0,driveBottom-driveTop),'#a4a492');
      for(let yy=driveTop+15;yy<driveBottom;yy+=18)rect(c,driveX+1,yy,driveW-2,1,'#818d7c');
    }
    const walkX=clamp(doorX-3,x+3,x+w-walkW-3),walkBottom=Math.min(y+h,Math.max(front+8,streetY));
    rect(c,walkX,front,walkW,walkBottom-front,'#bab29a');for(let yy=front+8;yy<walkBottom;yy+=10)rect(c,walkX,yy,walkW,1,'#8e9983');
    const approach=Array.isArray(l.approach)?[entrance,...l.approach]:null;
    if(approach){pixelPath(c,approach,8,'#8e9983');pixelPath(c,approach,6,'#bab29a');}
    if(v===14){rect(c,R(b.x+b.w),R(b.y+b.h*.88),Math.max(0,x+w-R(b.x+b.w)),6,'#b4ad96');}
    if(l.patio||v===8||v===11){const pw=Math.min(R(w*.31),28),ph=Math.max(8,Math.min(14,R(b.y-y-3)));rect(c,x+8,y+5,pw,ph,'#9f9d85');for(let xx=x+12;xx<x+pw+8;xx+=6)rect(c,xx,y+5,1,ph,'#818d76');}
    if(l.fence&&l.fence!=='none')fence(c,x+1,y+1,w-2,h-2,l.fence,walkX-2,walkW+4,approach,driveway,driveW);
    const by=Math.min(y+h-8,front+8),leftFree=Math.max(3,R(b.x-x));
    if(leftFree>11){shrub(c,x+6,y+R(h*.33),5);if(v%3!==1)tree(c,x+8,y+R(h*.6),v===8?12:9);}
    if(l.flowers!==false){for(let i=0;i<3;i++){const fx=R(b.x+7+i*7);if(Math.abs(fx-doorX)>9&&fx<driveX-5)shrub(c,fx,by,3,['#c792ad','#c9ad75','#b7a6c9'][v%3]);}}
    if(v%4===2){rect(c,x+5,y+8,13,11,'#7a7f68');roof(c,x+3,y+2,17,8,palette(b),'gable');}
    if(l.mailbox!==false){const mx=clamp(walkX-7,x+5,x+w-6),my=y+h-8;rect(c,mx,my-2,2,9,'#766e5e');rect(c,mx-2,my-5,7,4,'#667c78');rect(c,mx-2,my-5,6,1,'#9bb0a0');rect(c,mx+4,my-6,1,3,'#b57b77');}
    if(l.garage&&v!==13){
      const g=l.garage,inside=g.x>=b.x&&g.y>=b.y&&g.x+g.w<=b.x+b.w&&g.y+g.h<=b.y+b.h;
      const collision=Array.isArray(b.solidRects)&&b.solidRects.some(s=>s.x===g.x&&s.y===g.y&&s.w===g.w&&s.h===g.h);
      if(inside||collision)garage(c,R(g.x),R(g.y),R(g.w),R(g.h),palette(b),true);
    }
    // Small bins remain on the property edge; the navigation layer owns collision.
    if(v%3===0){rect(c,x+w-7,y+8,5,7,'#465f58');rect(c,x+w-8,y+7,7,2,'#7b8b77');}
  }
  function bench(c,x,y,vertical) {
    if(vertical){rect(c,x,y,6,18,'#354b43');rect(c,x,y,2,18,'#a39370');rect(c,x+3,y,2,18,'#8e8266');rect(c,x-1,y+3,8,2,'#425a4b');rect(c,x-1,y+13,8,2,'#425a4b');}
    else {rect(c,x,y,20,7,'#354b43');rect(c,x,y,20,2,'#a39370');rect(c,x,y+3,20,2,'#8e8266');rect(c,x+3,y-1,2,9,'#425a4b');rect(c,x+15,y-1,2,9,'#425a4b');}
  }
  function court(c,x,y,w,h) {
    rect(c,x-2,y-2,w+4,h+4,'#587668');rect(c,x,y,w,h,'#977f6e');rect(c,x+3,y+3,w-6,h-6,'#647f76');
    rect(c,x+3,y+3,w-6,1,'#b9b7a2');rect(c,x+3,y+h-4,w-6,1,'#b9b7a2');rect(c,x+3,y+3,1,h-6,'#b9b7a2');rect(c,x+w-4,y+3,1,h-6,'#b9b7a2');rect(c,x+R(w/2),y+3,1,h-6,'#b9b7a2');
    const cy=R(y+h/2);for(const side of [0,1]){const xx=side?x+w-12:x+3;rect(c,xx,cy-9,9,1,'#b9b7a2');rect(c,xx,cy+9,9,1,'#b9b7a2');rect(c,side?xx:xx+8,cy-9,1,18,'#b9b7a2');rect(c,side?x+w-3:x+2,cy-5,2,10,'#d1c4a8');rect(c,side?x+w-5:x+4,cy-2,2,4,'#b6846e');}
    // Pixel octagon at centre keeps the court crisp at native resolution.
    const cx=R(x+w/2);poly(c,[[cx-5,cy-8],[cx+5,cy-8],[cx+8,cy-4],[cx+8,cy+4],[cx+5,cy+8],[cx-5,cy+8],[cx-8,cy+4],[cx-8,cy-4]],'#b9b7a2');poly(c,[[cx-4,cy-7],[cx+4,cy-7],[cx+7,cy-3],[cx+7,cy+3],[cx+4,cy+7],[cx-4,cy+7],[cx-7,cy+3],[cx-7,cy-3]],'#647f76');rect(c,cx,cy-7,1,14,'#b9b7a2');
  }
  function playground(c,x,y,w,h) {
    rect(c,x,y,w,h,'#ad9c76');for(let i=0;i<12;i++)rect(c,x+hash(i*7+13)%Math.max(1,w-2),y+hash(i*11+31)%Math.max(1,h-2),2,1,'#938c6d');
    const ax=x+8,ay=y+6;line(c,ax,ay,ax-5,ay+20,'#788d84',2);line(c,ax,ay,ax+5,ay+20,'#788d84',2);line(c,ax+24,ay,ax+19,ay+20,'#788d84',2);line(c,ax+24,ay,ax+29,ay+20,'#788d84',2);rect(c,ax-1,ay,27,2,'#b29d78');
    for(const sx of [ax+7,ax+17]){rect(c,sx,ay+2,1,13,'#56726a');rect(c,sx+5,ay+2,1,13,'#56726a');rect(c,sx-1,ay+15,8,2,'#ad7d75');}
    if(w>65){const sx=x+w-23,sy=y+8;rect(c,sx,sy,15,4,'#b98879');rect(c,sx+2,sy+4,2,20,'#7e8a76');rect(c,sx+11,sy+4,2,20,'#7e8a76');poly(c,[[sx+4,sy+3],[sx+12,sy+3],[sx+20,sy+23],[sx+12,sy+23]],'#8aa5a0');rect(c,sx+12,sy+22,9,2,'#a9b7a2');for(let yy=sy+8;yy<sy+24;yy+=4)rect(c,sx-4,yy,7,1,'#a4a78b');rect(c,sx-4,sy+3,1,21,'#788a79');}
  }
  function pond(c,x,y,w,h) {
    const pts=[[x+8,y],[x+w-12,y],[x+w,y+8],[x+w-3,y+h-8],[x+w-12,y+h],[x+7,y+h-2],[x,y+h-12],[x+1,y+8]];
    poly(c,pts,'#82977d');poly(c,pts.map(q=>[q[0]+(q[0]<x+w/2?3:-3),q[1]+(q[1]<y+h/2?3:-3)]),'#426c76');
    for(let i=0;i<5;i++)rect(c,x+9+hash(i+2)%Math.max(1,w-20),y+8+hash(i+20)%Math.max(1,h-16),4+i%3,1,'#739996');
    shrub(c,x+4,y+h-6,4);shrub(c,x+w-5,y+7,4);rect(c,x+R(w*.7),y+R(h*.5),4,2,'#91a487');rect(c,x+R(w*.7)+1,y+R(h*.5)-1,2,1,'#c8b09a');
  }
  function drawSpace(c,s) {
    if(!c||!s)return;
    const kind=s.kind||s.type||'park',radiusOnly=kind==='turnaround'&&s.r>0&&!(s.w>0),w=R(radiusOnly?s.r*2:s.w),h=R(radiusOnly?s.r*2:s.h);
    if(!(w>0)||!(h>0))return;
    const x=R(radiusOnly?(Number.isFinite(s.cx)?s.cx:s.x)-s.r:s.x),y=R(radiusOnly?(Number.isFinite(s.cy)?s.cy:s.y)-s.r:s.y),v=variantOf(s,5);
    if(kind==='turnaround'){
      const cx=x+R(w/2),cy=y+R(h/2),radius=R(s.r||Math.min(w,h)/2);
      // Stepped scan lines preserve a round curb without antialiased edges.
      for(let yy=-radius;yy<=radius;yy++){const half=Math.floor(Math.sqrt(Math.max(0,radius*radius-yy*yy)));rect(c,cx-half,cy+yy,half*2+1,1,'#939f95');}
      const inner=Math.max(1,radius-4);for(let yy=-inner;yy<=inner;yy++){const half=Math.floor(Math.sqrt(Math.max(0,inner*inner-yy*yy)));rect(c,cx-half,cy+yy,half*2+1,1,'#53666b');}
      for(let i=0;i<8;i++){const angle=i*Math.PI/4,xx=R(cx+Math.cos(angle)*(inner-7)),yy=R(cy+Math.sin(angle)*(inner-7));rect(c,xx-1,yy-1,i%2?2:4,i%2?4:2,'#b4b49b');}
      return;
    }
    if(kind==='parking'){
      rect(c,x,y,w,h,'#536568');rect(c,x,y,w,3,'#91a093');rect(c,x,y+h-3,w,3,'#91a093');
      const stall=17;for(let xx=x+8;xx<x+w-12;xx+=stall){rect(c,xx,y+7,1,20,'#b5b79e');rect(c,xx,y+h-27,1,20,'#b5b79e');rect(c,xx+3,y+8,8,2,'#a2ad98');rect(c,xx+3,y+h-10,8,2,'#a2ad98');}
      rect(c,x+3,y+R(h/2),w-6,1,'#6e807c');shrub(c,x+5,y+5,4);shrub(c,x+w-6,y+h-7,4);return;
    }
    if(kind==='plaza'){
      rect(c,x,y,w,h,'#90998b');for(let yy=y+9;yy<y+h;yy+=10)rect(c,x,yy,w,1,'#7a8a7f');for(let xx=x+9;xx<x+w;xx+=10)rect(c,xx,y,1,h,'#7a8a7f');
      const fx=x+R(w*.5),fy=y+R(h*.45);rect(c,fx-16,fy-13,32,26,'#b3b29c');rect(c,fx-13,fy-10,26,20,'#526e70');rect(c,fx-10,fy-7,20,14,'#689193');rect(c,fx-3,fy-4,6,8,'#c2bda0');rect(c,fx-1,fy-9,2,6,'#9fb7aa');
      for(const a of [[x+7,y+9],[x+w-12,y+9],[x+7,y+h-12],[x+w-12,y+h-12]]){rect(c,a[0]-4,a[1]-4,10,10,'#b1ad95');shrub(c,a[0],a[1],5);}
      bench(c,x+13,y+h-16,false);bench(c,x+w-35,y+9,false);return;
    }
    rect(c,x,y,w,h,v===4?'#627d5e':'#577a5d');
    const cx=x+R(w*.5),cy=y+R(h*.5);rect(c,x,cy-5,w,10,'#b0ab8c');rect(c,cx-5,y,10,h,'#b0ab8c');
    for(let i=0;i<Math.min(30,Math.floor(w*h/800));i++){const gx=x+4+hash(i+41)%Math.max(1,w-8),gy=y+4+hash(i+81)%Math.max(1,h-8);if(Math.abs(gx-cx)>7&&Math.abs(gy-cy)>7)rect(c,gx,gy,3,1,'#6c8966');}
    if(kind==='community'||v===1){
      if(w>110&&h>90)court(c,x+11,y+12,R(w*.6)-12,R(h*.64)-12);
      if(w>160)playground(c,x+R(w*.7),y+12,R(w*.25),Math.min(45,R(h*.34)));
      bench(c,x+12,y+h-19,false);bench(c,x+w-29,y+h-32,true);
    } else if(v===2){playground(c,x+13,y+13,Math.max(50,R(w*.64)),Math.max(30,R(h*.34)));bench(c,x+12,y+h-18,false);}
    else if(v===3){pond(c,x+10,y+9,R(w*.35),R(h*.35));bench(c,cx+12,cy+11,false);}
    else if(v===4){
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){const bx=x+10+col*R(w*.25),by=y+10+row*R(h*.22);if(Math.abs(bx-cx)<12)continue;rect(c,bx,by,R(w*.17),R(h*.11),'#786d55');for(let k=0;k<4;k++)shrub(c,bx+3+k*4,by+2,2,k%2?'#a3a06b':null);}
      sign(c,x+R(w*.32),y+h-13,R(w*.36),7,'COMMUNITY GARDEN','#a7b590',false);
    } else {pond(c,x+11,y+10,R(w*.3),R(h*.3));bench(c,cx+13,cy+11,false);bench(c,x+12,y+h-19,false);}
    const places=[[x+9,y+12],[x+w-12,y+15],[x+12,y+h-23],[x+w-14,y+h-26]];
    for(let i=0;i<places.length;i++){if((v===2||kind==='community')&&i===0)continue;tree(c,places[i][0],places[i][1],9+i%2*2);}
    rect(c,x+w-11,cy+10,5,7,'#4c6357');rect(c,x+w-12,cy+9,7,2,'#9a9f84');
  }
  function lightsFor(b) {
    if(!b||b.landmark||b.kind!=='commercial'||districtOf(b)!=='core')return[];
    const v=variantOf(b,7);return[{x:R(b.x+b.w*.5),y:R(b.y+b.h*.61),radius:clamp(R(b.w*.48),40,60),color:['#ec8fbe','#79c8c0','#b6a0df'][v%3],alpha:.65}];
  }
  function drawDetail(c,d,helpers) {
    if(!c||!d||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
    const x=R(d.x),y=R(d.y),kind=String(d.kind||d.type||'').replace(/[-_\s]/g,'').toLowerCase();
    if(kind==='powerpole'||kind==='telephonepole'){
      if(d.to&&Number.isFinite(d.to.x)&&Number.isFinite(d.to.y)){
        const tx=R(d.to.x),ty=R(d.to.y),mx=R((x+tx)/2),my=R((y+ty)/2+6);
        for(const offset of [-3,3]){line(c,x+offset,y-22,mx+offset,my-22,'#3f4d4e');line(c,mx+offset,my-22,tx+offset,ty-22,'#3f4d4e');}
      }
      rect(c,x,y-25,3,29,'#716d5c');rect(c,x,y-25,1,28,'#a19473');rect(c,x-6,y-22,15,2,'#7e7a64');
      for(const xx of [x-4,x+6]){rect(c,xx,y-25,2,4,'#a7aea0');rect(c,xx,y-25,2,1,'#d0c5a8');}
      rect(c,x-1,y+3,5,2,'#3c5347');
    } else if(kind==='mailbox'){
      rect(c,x,y-1,2,10,'#766e5e');rect(c,x-3,y-5,9,5,'#667c78');rect(c,x-3,y-5,8,1,'#9bb0a0');rect(c,x+5,y-6,1,4,'#b57b77');
    } else if(kind==='bench')bench(c,x,y,!!d.vertical);
    else if(kind==='hedge'){
      const width=R(d.w||20);for(let xx=x+3;xx<x+width;xx+=6)shrub(c,xx,y,R(d.h||5));
    } else if(kind==='planter'){
      rect(c,x-5,y-2,12,8,'#a99b80');rect(c,x-4,y+1,10,6,'#7a7d65');shrub(c,x+1,y-2,5,d.flower||'#c39aa6');
    } else if(kind==='hydrant'){
      rect(c,x-2,y-7,5,9,'#b98b69');rect(c,x-3,y-6,7,2,'#d0a17b');rect(c,x-5,y-3,3,3,'#a17b63');rect(c,x+3,y-3,3,3,'#a17b63');rect(c,x-2,y+2,5,2,'#6b7562');
    } else if(kind==='trashbin'||kind==='bin'){
      rect(c,x-3,y-6,7,10,'#4d6759');rect(c,x-4,y-7,9,2,'#8d9a7e');rect(c,x-1,y-3,1,5,'#6d836c');rect(c,x+3,y+3,2,2,'#354d44');
    } else if(kind==='busstop'){
      rect(c,x,y-22,2,25,'#647b76');rect(c,x-4,y-24,10,8,'#91b2ae');rect(c,x-2,y-22,6,4,'#385e68');rect(c,x-1,y-21,4,1,'#cfceb0');
      bench(c,x+8,y-3,false);rect(c,x+6,y-21,26,3,'#4c6870');rect(c,x+7,y-18,1,16,'#879c8b');rect(c,x+30,y-18,1,16,'#879c8b');
    } else if(kind==='bicycle'||kind==='bike'){
      for(const xx of [x-5,x+7]){rect(c,xx-3,y,7,1,'#384b4f');rect(c,xx-3,y+5,7,1,'#384b4f');rect(c,xx-4,y+1,1,4,'#384b4f');rect(c,xx+4,y+1,1,4,'#384b4f');}
      line(c,x-5,y+3,x-1,y-4,'#b18f76');line(c,x-1,y-4,x+3,y+3,'#b18f76');line(c,x-5,y+3,x+3,y+3,'#b18f76');line(c,x-1,y-4,x+7,y+3,'#b18f76');rect(c,x-3,y-6,5,2,'#46575b');rect(c,x+6,y-6,1,8,'#91a293');rect(c,x+5,y-7,5,1,'#91a293');
    } else if(kind==='phonebooth'){
      rect(c,x-6,y-25,14,27,'#415e68');rect(c,x-7,y-27,16,4,'#9b8b81');rect(c,x-4,y-21,10,15,'#70969a');rect(c,x-3,y-20,4,13,'#91b1ac');rect(c,x+2,y-21,1,15,'#415e68');rect(c,x-4,y-6,10,5,'#8d9f95');rect(c,x-6,y+2,14,2,'#677c72');rect(c,x-1,y-18,5,7,'#4a6267');rect(c,x,y-17,3,2,'#b9c3ae');rect(c,x+1,y-13,2,1,'#879c8c');rect(c,x-5,y-26,12,1,'#c2b6a0');
    } else if(kind==='noticeboard'){
      rect(c,x-8,y-18,18,14,'#706d58');rect(c,x-6,y-16,14,10,'#ae9d73');rect(c,x-7,y-4,2,10,'#6a6a55');rect(c,x+7,y-4,2,10,'#6a6a55');rect(c,x-4,y-14,5,6,'#c3bba0');rect(c,x+2,y-13,4,5,'#b1c3b2');rect(c,x-3,y-12,3,1,'#847c63');rect(c,x+3,y-11,2,1,'#7d9587');
    } else if(kind==='roadsign'||kind==='streetname'||kind==='streetsign'){
      rect(c,x,y-22,2,27,'#788d83');rect(c,x-11,y-24,24,6,'#426b68');rect(c,x-10,y-23,22,1,'#95afa0');rect(c,x-6,y-21,14,1,'#b4c2a6');
      if(d.label){c.font='bold 5px monospace';c.fillStyle='#d3d4ba';c.textAlign='center';c.fillText(String(d.label).slice(0,12),x+1,y-19,21);c.textAlign='left';}
    } else if(kind==='parkingmeter'){
      rect(c,x,y-12,2,17,'#758a7d');rect(c,x-2,y-18,6,9,'#94a794');rect(c,x-1,y-17,4,5,'#405d62');rect(c,x,y-16,2,1,'#b1c5b0');rect(c,x-1,y-10,4,1,'#526f68');
    } else if(kind==='dumpster'){
      rect(c,x-9,y-8,19,11,'#405e55');rect(c,x-10,y-10,21,3,'#718670');rect(c,x-8,y-9,17,1,'#9ba388');rect(c,x-7,y-5,1,6,'#5f7964');rect(c,x+7,y-5,1,6,'#5f7964');rect(c,x-6,y+3,3,2,'#344a43');rect(c,x+5,y+3,3,2,'#344a43');
    } else if(kind==='barrier'){
      rect(c,x-12,y-7,25,7,'#aa9570');for(let xx=x-11;xx<x+10;xx+=7){rect(c,xx,y-6,4,2,'#d0bc8b');rect(c,xx+2,y-4,4,3,'#7f7462');}rect(c,x-9,y,3,6,'#637467');rect(c,x+7,y,3,6,'#637467');
    } else if(kind==='parkedcar'&&helpers&&typeof helpers.vehicle==='function'){
      helpers.vehicle(c,x,y,{...d,kind:d.vehicleKind||'car',angle:Number.isFinite(d.angle)?d.angle:Math.PI/2,color:d.color||'blue'});
    }
  }
  global.GlowportEnvironment=Object.freeze({architectures,entranceFor,drawBuilding,drawLot,drawSpace,drawFeature:drawSpace,drawDetail,lightsFor,clearCache,diagnostics:()=>({size:cache.size,limit:CACHE_LIMIT,bytes:cacheBytes,byteLimit:CACHE_BYTES,hits,misses})});
})(typeof window!=='undefined'?window:globalThis);
