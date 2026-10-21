'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..','Glowport88');const html=fs.readFileSync(path.join(root,'Glowport88_ArtRehaul_v11.html'),'utf8');
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())if(m[1].trim())new vm.Script(m[1],{filename:'inline-'+i});
for(const file of fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,'assets',file),'utf8'),{filename:file});
for(const m of html.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g))if(!fs.existsSync(path.join(root,m[1])))throw Error('Missing '+m[1]);
console.log('PASS JavaScript syntax and HTML asset references');
