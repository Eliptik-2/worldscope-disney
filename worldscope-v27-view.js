/* Clean map view: keep geography and illustrative models separate. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
let landmarkMode=false,previousFootprints=true;
function resetLandmarks(){
 if(!landmarkMode)return;
 landmarkMode=false;
 window.WorldscopeV22?.toggle(false);
 window.WorldscopeArchitecture26?.toggleFootprints(previousFootprints);
 const select=$('worldscope-v21-landmark');if(select)select.value='';
}
function arrange(){
 const wrap=document.querySelector('#map .mapwrap');if(!wrap)return;
 let menu=$('ws27-options');
 if(!menu){
  menu=document.createElement('details');menu.id='ws27-options';
  const summary=document.createElement('summary');summary.textContent='Map options';
  menu.append(summary);wrap.append(menu);
 }
 for(const id of ['ws26-footprint-toggle','ws25-open','ws24-landmarks','ws26-coverage']){
  const child=$(id);if(child&&child.parentElement!==menu)menu.append(child);
 }
 const studio=$('ws25-open');if(studio)studio.textContent='Ride & shop concept gallery';
 const landmark=$('ws24-landmarks');if(landmark){
  const label=landmark.querySelector('summary');if(label)label.textContent='Illustrative landmarks';
 }
 const chooser=$('worldscope-v21-landmark');
 if(chooser&&!chooser.dataset.ws27Bound){
  chooser.dataset.ws27Bound='true';
  chooser.addEventListener('change',()=>{
   if(!chooser.value)return;
   if(!landmarkMode)previousFootprints=window.WorldscopeArchitecture26?.state.showFootprints!==false;
   landmarkMode=true;
   window.WorldscopeArchitecture26?.toggleFootprints(false);
   const description=$('ws23-map-desc');if(description)description.textContent='Illustrative landmark view • return to Atlas or 3D layout to exit';
   menu.open=false;
  });
 }
}
function onView(){
 resetLandmarks();
 window.WorldscopeRideAtlas25?.toggle(false);
 window.WorldscopeArchitecture26?.sync();
 const menu=$('ws27-options');if(menu)menu.open=false;
}
document.addEventListener('click',e=>{
 if(e.target?.closest?.('#ws23-map2d,#ws23-map3d'))queueMicrotask(onView);
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arrange,{once:true});else arrange();
window.addEventListener('worldscope-ready',arrange);
window.WorldscopeCleanView27={arrange,resetLandmarks,get state(){return{landmarkMode}}};
})();