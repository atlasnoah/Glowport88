/* Glowline 88 phone. Uses the established pixel-game UI and never modifies artwork. */
window.GlowportPhone=(()=>{
'use strict';
let panel=null,model={},callbacks={},tab='messages',previousFocus=null;
const tabs=[['messages','TEXTS'],['jobs','JOBS'],['contacts','CONTACTS'],['properties','PROPERTIES'],['stats','STATUS']];
const array=value=>Array.isArray(value)?value:[];
const money=value=>'$'+Math.max(0,Number.isFinite(Number(value))?Math.floor(Number(value)):0).toLocaleString();
const text=(tag,value,cls)=>{const node=document.createElement(tag);node.textContent=value==null?'':String(value);if(cls)node.className=cls;return node};
const button=(label,handler,cls='tiny')=>{const node=text('button',label,cls);node.type='button';node.onclick=handler;return node};
function style(){if(document.getElementById('glowportPhoneStyle'))return;const node=document.createElement('style');node.id='glowportPhoneStyle';node.textContent=`
#phonePanel{z-index:60;padding:18px;background:#070e20d9}#phonePanel .phone-shell{width:min(730px,96vw);max-height:88vh;padding:18px;display:flex;flex-direction:column;overflow:hidden;border-color:#6b929d}#phonePanel .phone-header{display:flex;align-items:start;justify-content:space-between;gap:15px}#phonePanel .phone-brand{font-size:18px;letter-spacing:.16em;color:#9dded6;margin:0 0 8px}#phonePanel .phone-current{color:#b8cbd2;font-size:11px;line-height:1.6;margin:0}#phonePanel .phone-summary{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #52647b66;border-bottom:1px solid #52647b66;padding:10px 0;margin:13px 0;color:#e6c492;font-size:11px}#phonePanel .phone-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}#phonePanel .phone-tabs button{font-size:9px;letter-spacing:.06em;padding:8px 10px}#phonePanel .phone-tabs button[aria-selected=true]{background:#355363;border-color:#9cc9c5;color:#e4eee6}#phonePanel #phoneContent{overflow:auto;min-height:180px;max-height:56vh;padding-right:5px;overscroll-behavior:contain}#phonePanel .phone-card{border:1px solid #4b5c7266;background:#1b2a3f;padding:12px;margin-bottom:9px;border-radius:2px}#phonePanel .phone-card h3{font-size:12px;color:#c4e4db;margin:0 0 7px;letter-spacing:.04em}#phonePanel .phone-card p{font-size:11px;line-height:1.7;color:#c1ccd6;margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere}#phonePanel .phone-card .phone-meta{font-size:9px;color:#a8b1bd}#phonePanel .phone-card .phone-warning{color:#e5b6c2}#phonePanel .phone-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}#phonePanel .phone-actions button{font-size:10px;padding:8px 10px}#phonePanel .phone-unread{border-left:3px solid #e5a3c5}#phonePanel .phone-empty{font-size:12px;color:#9eb2c1;line-height:1.8;padding:18px 6px}#phonePanel #phoneStatus{min-height:21px;font-size:10px;color:#edc48d;margin:10px 0 0;line-height:1.6}#phonePanel .phone-stat{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #46597155;padding:9px 0;font-size:11px;color:#becbd3}#phonePanel .phone-stat b{color:#edca9c;font-weight:400;text-align:right}#phonePanel .phone-vehicle{border-top:1px solid #55677b55;margin-top:10px;padding-top:8px}#phonePanel .phone-vehicle p{font-size:10px}@media(max-width:600px){#phonePanel{padding:8px}#phonePanel .phone-shell{padding:12px;max-height:94vh}#phonePanel .phone-brand{font-size:15px}#phonePanel .phone-tabs{gap:4px}#phonePanel .phone-tabs button{font-size:8px;padding:8px}#phonePanel #phoneContent{max-height:60vh}#phonePanel .phone-card{padding:10px}#phonePanel .phone-summary{font-size:10px}}`;document.head.append(node)}
function status(message){if(panel)panel.querySelector('#phoneStatus').textContent=message||''}
function updateModel(){if(typeof callbacks.model==='function'){const fresh=callbacks.model();if(fresh&&typeof fresh==='object')model=fresh}}
async function act(name,args=[],success='Updated.'){
 const handler=callbacks[name];if(typeof handler!=='function'){status('This service is not available.');return}
 const current=panel;status('Connecting…');
 try{const result=await handler(...args);if(!panel||panel!==current)return;
  const ok=result!==false&&result?.ok!==false;
  if(ok&&['accept','contact','travelProperty','retrieveVehicle'].includes(name)&&!result?.keepOpen){close();return}
  updateModel();render();status(typeof result==='string'?result:result?.message||result?.reason||(ok?success:'That option is not available right now.'));
 }catch(error){if(panel===current)status(error?.message||'The connection failed. Try again.')}
}
function card(title,description,meta){const node=document.createElement('article');node.className='phone-card';if(title)node.append(text('h3',title));if(meta)node.append(text('p',meta,'phone-meta'));if(description)node.append(text('p',description));return node}
function actions(card){const row=document.createElement('div');row.className='phone-actions';card.append(row);return row}
function empty(container,message){container.append(text('p',message,'phone-empty'))}
function messages(container){const entries=array(model.messages).slice().reverse();if(!entries.length){empty(container,'No texts yet. Contacts will send updates as the city changes.');return}
 for(const message of entries){const node=card(message.from||'Unknown contact',message.text||'',message.read?'READ':'NEW MESSAGE');if(!message.read){node.classList.add('phone-unread');if(typeof callbacks.markRead==='function')actions(node).append(button('MARK READ',()=>act('markRead',[message.id],'Message read.')))}container.append(node)}}
function jobs(container){const entries=array(model.jobs);if(!entries.length){empty(container,'No available jobs right now. Follow the current story lead or meet people around the city.');return}
 for(const job of entries){const node=card(job.title||'Job',job.description||'',(job.kind||'job').toUpperCase());if(job.locked)node.append(text('p',job.reason||'Not available yet.','phone-meta phone-warning'));
  const row=actions(node),accept=button(job.locked?'LOCKED':'ACCEPT JOB',()=>act('accept',[job.id],'Job accepted.'));accept.dataset.jobId=String(job.id);accept.disabled=!!job.locked||typeof callbacks.accept!=='function';if(job.locked)accept.title=job.reason||'Not available yet.';row.append(accept);container.append(node)}}
function contacts(container){const entries=array(model.contacts);if(!entries.length){empty(container,'Your contacts list is empty. Vee will be in touch.');return}
 for(const contact of entries){const node=card(contact.name||'Contact',contact.status||'No new message.');if(typeof callbacks.contact==='function'){const call=button(contact.locked?'UNAVAILABLE':'CALL',()=>act('contact',[contact.id],'Contact called.'));call.dataset.contactId=String(contact.id);call.disabled=!!contact.locked;actions(node).append(call)}container.append(node)}}
function properties(container){const entries=array(model.properties);if(!entries.length){empty(container,'No property listings are available.');return}
 for(const property of entries){const level=Math.max(0,Math.floor(Number(property.level)||0));const node=card(property.name||'Property',property.description||'',property.owned?'OWNED · LEVEL '+level:money(property.cost));
  if(Number(property.income)>0)node.append(text('p',money(property.income)+' per '+(Number(property.incomePeriod)||120)+' seconds of active city time.','phone-meta'));
  const row=actions(node);
  if(!property.owned&&typeof callbacks.purchase==='function'){const buy=button('BUY · '+money(property.cost),()=>act('purchase',[property.id],'Property purchased.'));buy.dataset.propertyId=String(property.id);buy.disabled=property.locked||Number(model.cash)<Number(property.cost);row.append(buy);if(buy.disabled)node.append(text('p',property.reason||'Not enough cash.','phone-meta phone-warning'))}
  if(property.owned){
   if(typeof callbacks.service==='function'){row.append(button('RECOVER HERE',()=>act('service',[property.id,'rest'],'Recovered.')));if(property.capacity){row.append(button('REPAIR · $120',()=>act('service',[property.id,'repair'],'Vehicle repaired.')));row.append(button('TUNE ENGINE · $450',()=>act('service',[property.id,'tune'],'Engine tuned.')))}}
   if(typeof callbacks.travelProperty==='function')row.append(button('SET WAYPOINT',()=>act('travelProperty',[property.id],'Property waypoint set.')));
   const max=Number(property.maxLevel)||3;
   if(level<max&&typeof callbacks.upgrade==='function'){const upgrade=button('UPGRADE · '+money(property.upgradeCost),()=>act('upgrade',[property.id],'Property upgraded.'));upgrade.dataset.upgradeId=String(property.id);upgrade.disabled=Number(model.cash)<Number(property.upgradeCost);row.append(upgrade)}
   else if(level>=max)node.append(text('p','Fully upgraded.','phone-meta'));
   const cars=array(property.storedVehicles),capacity=Math.max(0,Number(property.capacity)||0);
   if(capacity){node.append(text('p','Vehicle bays: '+cars.length+'/'+capacity,'phone-meta'));if(typeof callbacks.storeVehicle==='function'){const store=button('STORE CURRENT VEHICLE',()=>act('storeVehicle',[property.id],'Vehicle stored.'));store.disabled=cars.length>=capacity;row.append(store)}
    for(const car of cars){const vehicle=document.createElement('div');vehicle.className='phone-vehicle';vehicle.append(text('p',(car.model||'Stored vehicle')+' · condition '+Math.round(Number.isFinite(Number(car.health))?Number(car.health):100)+'%'));if(typeof callbacks.retrieveVehicle==='function')actions(vehicle).append(button('RETRIEVE',()=>act('retrieveVehicle',[property.id,car.id],'Vehicle retrieved.')));node.append(vehicle)}}
  }
  container.append(node)}}
function readable(value){if(value==null)return '—';if(typeof value==='number')return Number.isFinite(value)?Math.round(value*100)/100:'—';if(typeof value==='boolean')return value?'Yes':'No';if(Array.isArray(value))return value.join(', ')||'None';if(typeof value==='object')return Object.entries(value).map(([key,v])=>key+': '+readable(v)).join(' · ')||'None';return String(value)}
function stats(container){const entries=Object.entries(model.stats||{});if(!entries.length){empty(container,'Complete jobs, practice driving, and use your weapons to build experience.');return}
 for(const [key,value] of entries){const row=document.createElement('div');row.className='phone-stat';row.append(text('span',key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ')));row.append(text('b',readable(value)));container.append(row)}}
function render(){if(!panel)return;
 panel.querySelector('#phoneMission').textContent=[model.chapter?String(model.chapter):'',model.title||'FREE ROAM'].filter(Boolean).join(' · ');
 panel.querySelector('#phoneCash').textContent=money(model.cash);panel.querySelector('#phoneReputation').textContent='REPUTATION '+Math.round(Number(model.reputation)||0);
 for(const [id] of tabs)panel.querySelector('#phoneTab-'+id).setAttribute('aria-selected',String(tab===id));
 const content=panel.querySelector('#phoneContent');content.replaceChildren();({messages,jobs,contacts,properties,stats}[tab]||messages)(content);
}
function down(event){if(!panel)return;event.stopImmediatePropagation();
 if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();close();return}
 if(event.key==='Tab'){const list=[...panel.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(node=>node.getClientRects().length);if(!list.length){event.preventDefault();return}const first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}return}
 const selected=tabs.findIndex(([id])=>document.activeElement?.id==='phoneTab-'+id);
 if(selected>=0&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();tab=tabs[(selected+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length][0];render();panel.querySelector('#phoneTab-'+tab).focus();return}
 if(['w','a','s','d','f','r','e','q','1','2','3','4','5','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)&&document.activeElement?.tagName!=='BUTTON')event.preventDefault();
}
function up(event){if(panel)event.stopImmediatePropagation()}
function close(notify=true){if(!panel)return false;const callback=callbacks.close,focus=previousFocus;panel.remove();panel=null;window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);if(focus?.isConnected&&typeof focus.focus==='function')focus.focus();if(notify&&typeof callback==='function')callback();return true}
function open(nextModel={},nextCallbacks={}){if(panel)close(false);style();model=nextModel&&typeof nextModel==='object'?nextModel:{};callbacks=nextCallbacks||{};previousFocus=document.activeElement;tab='messages';panel=document.createElement('div');panel.id='phonePanel';panel.className='window';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','phoneTitle');
 panel.innerHTML='<section class="modal phone-shell"><div class="phone-header"><div><h2 class="phone-brand" id="phoneTitle">GLOWLINE / 88</h2><p class="phone-current" id="phoneMission"></p></div><button class="close" id="phoneClose" type="button" aria-label="Close phone">CLOSE [P]</button></div><div class="phone-summary"><span id="phoneCash"></span><span id="phoneReputation"></span></div><nav class="phone-tabs" id="phoneTabs" role="tablist" aria-label="Phone sections"></nav><div id="phoneContent" role="tabpanel"></div><p id="phoneStatus" role="status" aria-live="polite"></p></section>';
 const nav=panel.querySelector('#phoneTabs');for(const [id,label] of tabs){const node=button(label,()=>{tab=id;render()});node.id='phoneTab-'+id;node.setAttribute('role','tab');node.setAttribute('aria-controls','phoneContent');nav.append(node)}
 panel.querySelector('#phoneClose').onclick=()=>close();panel.addEventListener('click',event=>{event.stopPropagation();if(event.target===panel)close()});document.body.append(panel);window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);render();panel.querySelector('#phoneClose').focus();return true;
}
function refresh(nextModel){if(nextModel&&typeof nextModel==='object')model=nextModel;else updateModel();render();return !!panel}
return {open,close,refresh,get active(){return !!panel}};
})();
