/* v2.8: architectural study viewer; available only in validated, packaged builds. */
(function(){
'use strict';
const parks={'Magic Kingdom':'magic-kingdom','EPCOT':'epcot','Hollywood Studios':'hollywood-studios','Animal Kingdom':'animal-kingdom','Disney Springs':'disney-springs','BoardWalk':'boardwalk','BoardWalk / Crescent Lake':'boardwalk'};
const required=Object.values(parks).filter((x,i,a)=>a.indexOf(x)===i);
function validManifest(m){return m?.version===1&&m.fixture===false&&Array.isArray(m.regions)&&required.every(id=>m.regions.some(r=>r.id===id&&r.file===id+'.json'&&Number.isInteger(r.count)&&r.count>0))}
let state='checking', manifest=null;
function arrange(){
 const menu=document.getElementById('ws27-options');if(!menu)return;
 let a=document.getElementById('ws28-twin');if(!a){a=document.createElement('a');a.id='ws28-twin';a.target='_blank';a.rel='noopener';a.textContent='Architectural 3D study ↗';a.style.cssText='display:block;padding:10px;margin:5px 0;border:1px solid #8ba4b5;border-radius:8px;color:inherit;text-decoration:none';a.hidden=true;menu.append(a)}
 a.style.display=state==='ready'?'block':'none';a.hidden=state!=='ready';
 if(state==='ready'){const selected=document.getElementById('mappark')?.value;const region=parks[selected]||'magic-kingdom';a.href='architecture/index.html?region='+encodeURIComponent(region);a.title='Open source-based building geometry in a separate tab; navigation stays here';}
}
async function initialize(){
 try{const response=await fetch('architecture/scenes/manifest.json',{cache:'no-cache'});if(!response.ok)throw Error('Not packaged');const m=await response.json();if(!validManifest(m))throw Error('Invalid dataset');manifest=m;state='ready'}catch(e){state='unavailable'}arrange();
}
function start(){arrange();initialize();document.getElementById('mappark')?.addEventListener('change',arrange)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('worldscope-ready',arrange);
window.WorldscopeTwin28={validManifest,get state(){return state},arrange};
})();