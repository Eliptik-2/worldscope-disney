/* Worldscope v1.9 — map style persistence + cinematic map UI.
   Stable vector basemap. Raster imagery is added as a layer; map.setStyle() is
   never used for the Color / HD / USGS toggle, so active routes survive. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const USGS='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}';
let attachedMap=null,sceneMode='hd',lastMode='hd',created=false;
const ids={hd:'worldscope-v19-hd',satellite:'worldscope-v19-usgs'};
const attr={hd:'Aerial imagery © Esri, Maxar and imagery contributors; capture dates vary',satellite:'Aerial imagery © USGS / The National Map'};
const modes=[['hd','✦ Aerial + Labels'],['color','◈ Color Atlas'],['satellite','◉ USGS']];
function allStyleLayers(){try{return map?.getStyle()?.layers||[]}catch{return []}}
function firstSymbol(){return allStyleLayers().find(l=>l.type==='symbol')?.id}
function mapReady(){return typeof map!=='undefined'&&map&&map.isStyleLoaded?.()}
function ensureRaster(){
 if(!mapReady())return false;
 try{
  for(const mode of ['hd','satellite']){
   const id=ids[mode];
   if(!map.getSource(id))map.addSource(id,{type:'raster',tiles:[mode==='hd'?ESRI:USGS],tileSize:256,maxzoom:mode==='hd'?19:16,attribution:attr[mode]});
   if(!map.getLayer(id)){
    const conf={id,type:'raster',source:id,paint:{'raster-opacity':1,'raster-fade-duration':160},layout:{visibility:'none'}};
    const before=firstSymbol();
    if(before)map.addLayer(conf,before);else map.addLayer(conf);
   }
  }
  // Keep building extrusions above aerial imagery, but below text/POI labels.
  const label=firstSymbol();
  for(const id of ['worldscope-v17-buildings','worldscope-3d']){
   if(label&&map.getLayer(id)&&map.moveLayer)try{map.moveLayer(id,label)}catch(e){console.debug('3D order',e)}
  }
  return true;
 }catch(e){console.warn('Worldscope aerial overlay setup failed',e);return false}
}
function reassertRoute(){
 if(!mapReady())return;
 // These are independent user-added layers. Move above imagery and labels.
 for(const kind of ['link','bus','walk']){
  for(const suffix of ['halo','line']){
   const id='worldscope-v18-'+kind+'-'+suffix;
   if(map.getLayer(id)&&map.moveLayer)try{map.moveLayer(id)}catch(e){console.debug('Overlay order',e)}
  }
 }
 if(window.WorldscopeJourney?.redraw)window.WorldscopeJourney.redraw();
}
function applyLayers(){
 if(!mapReady())return false;
 if(!ensureRaster())return false;
 ['hd','satellite'].forEach(mode=>{
  const id=ids[mode];
  try{if(map.getLayer(id))map.setLayoutProperty(id,'visibility',sceneMode===mode?'visible':'none')}catch(e){console.warn('Imagery mode update',e)}
 });
 if(window.enableBuildings)try{window.enableBuildings()}catch(e){}
 const label=firstSymbol();
 if(label&&map.moveLayer){
  for(const id of ['worldscope-v17-buildings','worldscope-3d'])if(map.getLayer(id))try{map.moveLayer(id,label)}catch{}
 }
 reassertRoute();
 return true;
}
function syncButtons(){
 document.querySelectorAll('#mapModes [data-mode]').forEach(b=>{
  const selected=b.dataset.mode===sceneMode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
 });
 const credit=byId('mapmodecredit');
 if(credit)credit.textContent=sceneMode==='color'?'© OpenStreetMap · OpenFreeMap':(attr[sceneMode]+' · Images are not live');
 const label=byId('worldscope-scene-title');
 if(label)label.textContent=sceneMode==='color'?'The Storybook Atlas':sceneMode==='hd'?'The Aerial Explorer':'The Classic Aerial';
 const subtitle=byId('worldscope-scene-subtitle');
 if(subtitle)subtitle.textContent=sceneMode==='color'?'Paths and park landmarks':sceneMode==='hd'?'Imagery with readable map labels':'USGS reference imagery';
}
function changeMode(mode){
 if(mode==='color3d'){mode='color';}
 if(!['hd','color','satellite'].includes(mode))return;
 lastMode=sceneMode;sceneMode=mode;
 if(typeof mapMode!=='undefined')mapMode=mode;
 syncButtons();
 if(typeof map==='undefined'||!map){if(typeof initMap==='function')initMap();return}
 if(mapReady())applyLayers();
 else map.once?.('idle',applyLayers);
 // Critical: do not call map.setStyle. Aerial imagery sits under the route overlays.
 try{map.resize()}catch{}
}
function attachMap(){
 if(typeof map==='undefined'||!map)return;
 if(attachedMap===map){if(mapReady())applyLayers();return}
 attachedMap=map;
 for(const event of ['load','style.load','idle']){
  map.on(event,()=>{
   if(mapReady()){
    // No style replacement is necessary, but recover overlays if some other code alters it.
    const isNew=!map.getLayer(ids.hd)||!map.getLayer(ids.satellite);
    if(isNew)applyLayers();
    else if(event==='load'||event==='style.load')reassertRoute();
   }
  });
 }
 if(mapReady())applyLayers();
}
const oldInit=window.initMap;
if(typeof oldInit==='function')window.initMap=function(){oldInit();attachMap()};
window.setMapMode=changeMode;
const oldToggle=window.worldscopeToggleBuildings;
if(typeof oldToggle==='function')window.worldscopeToggleBuildings=function(){
 oldToggle();if(mapReady())applyLayers();
};
window.changePitch=window.worldscopeToggleBuildings;
window.loadBuildings=window.worldscopeToggleBuildings;
function makeModePicker(){
 const row=byId('mapModes');if(!row)return;
 row.replaceChildren();
 for(const [name,label] of modes){
  const btn=document.createElement('button');btn.type='button';btn.dataset.mode=name;btn.textContent=label;
  btn.addEventListener('click',()=>changeMode(name));
  row.append(btn);
 }
 syncButtons();
}
function addSceneUi(){
 const wrap=document.querySelector('#map .mapwrap');if(!wrap)return;
 if(!byId('worldscope-scene')){
  const scene=document.createElement('aside');
  scene.className='worldscope-scene';scene.id='worldscope-scene';
  const brow=document.createElement('div');brow.className='worldscope-scene-brow';brow.textContent='✦ WORLD SCOPE · PARK ATLAS';
  const heading=document.createElement('strong');heading.id='worldscope-scene-title';heading.textContent='The Aerial Explorer';
  const desc=document.createElement('small');desc.id='worldscope-scene-subtitle';desc.textContent='Imagery with readable map labels';
  scene.append(brow,heading,desc);wrap.append(scene);
 }
 if(!byId('worldscope-route-legend')){
  const legend=document.createElement('div');legend.className='worldscope-route-legend';legend.id='worldscope-route-legend';
  const walk=document.createElement('span');walk.textContent='● Walk';
  const bus=document.createElement('span');bus.textContent='● Bus / transfer';
  const icon=document.createElement('span');icon.textContent='✧ Stops numbered on the map';
  legend.append(walk,bus,icon);wrap.append(legend);
 }
 syncButtons();
}
function addRoutingHelp(){
 const box=byId('routepanel');if(!box||byId('worldscope-routing-help'))return;
 const help=document.createElement('section');help.id='worldscope-routing-help';help.className='worldscope-routing-help';
 const head=document.createElement('strong');head.textContent='⚑ About walking paths';
 const line=document.createElement('p');
 line.textContent='If a walking line is missing, Worldscope found no trustworthy guest path. Pins show the start and destination; do not follow a straight-line shortcut through buildings.';
 const official=document.createElement('a');official.href='https://disneyworld.disney.go.com/guest-services/my-disney-experience/mobile-apps/';
 official.target='_blank';official.rel='noopener noreferrer';official.textContent='Open Disney’s official navigation';
 help.append(head,line,official);
 const status=byId('journey-map-status');if(status)status.after(help);else box.append(help);
}
function highlightRouteFailure(){
 const feedback=byId('routefeedback');if(!feedback)return;
 const failure=/No reliable walking route|unavailable|not available|no verified/i.test(feedback.textContent);
 const help=byId('worldscope-routing-help');
 if(help)help.classList.toggle('needs-review',failure);
}
const originalPlan=window.planRoute;
if(typeof originalPlan==='function')window.planRoute=async function(){
 try{return await originalPlan()}finally{
   highlightRouteFailure();
   if(mapReady())reassertRoute();
 }
};
function decoratePins(){
 document.querySelectorAll('#mapcanvas .geo-dot').forEach((el,i)=>{
  if(el.dataset.worldscopeStyled)return;
  el.dataset.worldscopeStyled='true';
  el.setAttribute('data-index',String(i+1));
 });
}
function ready(){
 makeModePicker();addSceneUi();addRoutingHelp();
 if(typeof mapMode!=='undefined')mapMode=sceneMode;
 if(typeof map!=='undefined'&&map){attachMap();if(mapReady())applyLayers()}
 if(!created){
  created=true;
  const observer=new MutationObserver(()=>decoratePins());
  const target=byId('mapcanvas');if(target)observer.observe(target,{subtree:true,childList:true});
 }
 decoratePins();highlightRouteFailure();
}
document.addEventListener('DOMContentLoaded',ready,{once:true});
window.addEventListener('worldscope-ready',ready);
if(document.readyState!=='loading')ready();
window.WorldscopeV19={changeMode,redraw:reassertRoute,get scene(){return sceneMode},get imageryReady(){return mapReady()&&!!map.getLayer(ids.hd)}};
})();