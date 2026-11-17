/* A compact readout of the existing police awareness model. No pursuit state is
 * changed here, and escape notifications follow confirmed escape receipts. */
(function(global){
'use strict';
const root=document.getElementById('hud-pursuit');
let previousMode='clear',previousEscapes=null,escapeUntil=0,searchDuration=0;
function reset(){previousMode='clear';previousEscapes=null;escapeUntil=0;searchDuration=0;if(root)root.hidden=true}
function update(state={}){
 if(!root)return;
 const mode=state.mode||'clear',clock=Number(state.clock)||0,wanted=Number(state.wanted)||0,escapes=Number(state.escapes)||0,remaining=Math.max(0,Number(state.searchRemaining)||0);
 if(previousEscapes!==null&&escapes>previousEscapes)escapeUntil=clock+4;
 previousEscapes=escapes;
 if(mode==='search'){if(previousMode!=='search')searchDuration=remaining;searchDuration=Math.max(searchDuration,remaining,1)}else searchDuration=0;
 const escaped=!wanted&&clock<escapeUntil;
 root.hidden=!wanted&&!escaped;
 const display=escaped?'escaped':mode==='pursuit'?'spotted':mode==='reported'?'reported':'searching';
 root.dataset.mode=display;
 const label=escaped?'ESCAPED':display==='spotted'?'SPOTTED':display==='reported'?'REPORT RECEIVED':'SEARCHING · '+Math.ceil(remaining)+'s';
 const text=document.getElementById('hud-pursuit-label');if(text.textContent!==label)text.textContent=label;
 const progress=escaped?1:mode==='search'?Math.max(0,Math.min(1,1-remaining/searchDuration)):0;
 const track=document.getElementById('hud-pursuit-track');track.setAttribute('aria-valuenow',String(Math.round(progress*100)));document.getElementById('hud-pursuit-fill').style.width=(progress*100)+'%';
 root.setAttribute('aria-label',label);previousMode=mode;
}
global.GlowportPursuitHud={reset,update};
})(window);
