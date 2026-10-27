/* Versioned local saves keep a recoverable copy before migrations and new stories. */
window.GlowportSave=(()=>{
'use strict';
const VERSION=6,valid=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Number.isInteger(Number(value.story))&&Number(value.story)>=0&&Number(value.story)<=100;
// Probe only the finite schema transitions this build knows. Old migration
// bytes remain useful after a later map restoration; they are never rewritten.
const recoverySuffixes=['previous'];
for(let from=VERSION-1;from>=1;from--)for(let to=VERSION;to>from;to--)recoverySuffixes.push('v'+from+'-to-v'+to);
recoverySuffixes.push('migration');
function backup(storage,key,reason='previous'){const raw=storage.getItem(key);if(raw===null)return false;storage.setItem(key+'.backup.'+reason,raw);return true}
function read(storage,key){const raw=storage.getItem(key);if(raw===null)return {state:null};try{const state=JSON.parse(raw);if(!valid(state))throw Error('Invalid save structure');if(Number(state.version)>VERSION)return {state:null,blocked:true,reason:'This save belongs to a newer game version. It has been preserved.'};return {state,needsMigration:Number(state.version||1)<VERSION}}catch(error){try{storage.setItem(key+'.backup.corrupt',raw)}catch{}for(const suffix of recoverySuffixes){try{const state=JSON.parse(storage.getItem(key+'.backup.'+suffix)||'null');if(valid(state)&&Number(state.version||1)<=VERSION)return {state,recovered:true}}catch{}}return {state:null,corrupt:true,reason:'Unreadable save preserved as a backup. Start a New Story to replace it.'}}}
function write(storage,key,state){if(!valid(state))throw Error('Refusing invalid game state');const encoded=JSON.stringify({...state,version:VERSION}),raw=storage.getItem(key);if(raw!==null){let old=null;try{old=JSON.parse(raw)}catch{}if(valid(old)){if(Number(old.version)>VERSION)throw Error('Preserving save from a newer game version');if(Number(old.version||1)<VERSION){if(!storage.getItem(key+'.backup.migration'))storage.setItem(key+'.backup.migration',raw);const revision=Math.max(1,Math.min(VERSION-1,Math.floor(Number(old.version)||1))),migrationKey=key+'.backup.v'+revision+'-to-v'+VERSION;if(!storage.getItem(migrationKey))storage.setItem(migrationKey,raw);}storage.setItem(key+'.backup.previous',raw)}else if(!storage.getItem(key+'.backup.corrupt'))storage.setItem(key+'.backup.corrupt',raw)}storage.setItem(key,encoded);return true}
return {VERSION,valid,read,write,backup};
})();
