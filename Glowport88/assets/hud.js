/* Presentation only: mirrors the existing HUD text without reading or changing game state. */
(()=>{
 'use strict';
 const byId=id=>document.getElementById(id),hud=byId('hud'),surface=document.querySelector('.play-surface');
 if(!hud||!surface)return;
 const text=(id,value)=>{const node=byId(id);if(node.textContent!==value)node.textContent=value};
 let pending=false;
 function measure(){
  const detached=getComputedStyle(hud).getPropertyValue('--hud-detached').trim()==='1',visible=!hud.classList.contains('hidden');
  const value=detached&&visible?Math.ceil(byId('hud-mission').getBoundingClientRect().height)+8:0,px=value+'px';
  if(surface.style.getPropertyValue('--hud-strip-height')!==px)surface.style.setProperty('--hud-strip-height',px);
 }
 function refresh(){
  pending=false;
  const value=byId('weapon').textContent.trim(),match=value.match(/^(.*?)\s+(\d+)\/(\d+)$/),name=match?match[1]:value;
  const kind=/SMG/.test(name)?'smg':/SHOTGUN/.test(name)?'shotgun':/PISTOL/.test(name)?'pistol':/BAT/.test(name)?'bat':'fists';
  byId('hud-weapon').dataset.weapon=kind;text('hud-weapon-name',name);byId('hud-ammo').hidden=!match;byId('hud-melee').hidden=!!match;
  if(match){text('hud-magazine',match[2]);text('hud-reserve',match[3])}else text('hud-melee',kind==='fists'?'UNARMED':'MELEE');
  const icon='#hud-icon-'+kind;if(byId('hud-weapon-symbol').getAttribute('href')!==icon)byId('hud-weapon-symbol').setAttribute('href',icon);
  const health=byId('health').textContent.match(/([\d.]+)\s*\/\s*([\d.]+)/);
  if(health){byId('hud-health-track').setAttribute('aria-valuenow',health[1]);byId('hud-health-track').setAttribute('aria-valuemax',health[2]);byId('hud-health').classList.toggle('is-critical',Number(health[1])<=Number(health[2])*.25)}
  const speed=byId('speed').textContent.trim(),driving=speed.match(/^(\d+)\s+(MPH)$/);
  byId('hud-speed').dataset.mode=driving?'driving':'foot';text('hud-speed-value',driving?driving[1]:speed);text('hud-speed-unit',driving?driving[2]:'');
  measure();
 }
 const schedule=()=>{if(!pending){pending=true;queueMicrotask(refresh)}};
 const observer=new MutationObserver(schedule);
 for(const id of ['weapon','health','speed','chapter','objective'])observer.observe(byId(id),{childList:true,characterData:true,subtree:true});
 observer.observe(hud,{attributes:true,attributeFilter:['class']});observer.observe(byId('missionRetryBtn'),{attributes:true,attributeFilter:['class']});
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(byId('hud-mission'));
 window.addEventListener('resize',measure,{passive:true});
 hud.dataset.presentation='ready';refresh();
})();
