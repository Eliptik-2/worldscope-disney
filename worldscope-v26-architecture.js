/* Worldscope v2.6 — real OSM building footprints in a restrained storybook palette.
 * Footprints/heights come from OpenStreetMap where available. They are NOT
 * precise replicas, guest entrances, or verified shop/ride building outlines.
 */
(function(){
'use strict';
const ID='worldscope-v26-architecture',SOURCE='worldscope-v26-osm';
let observed=null,mode=false,showFootprints=true,sourceReady=false,lastError='';
const activeMap=()=>typeof map!=='undefined'&&map&&map.isStyleLoaded?.()?map:null;
const color='#dbc9a7';
function sourceFor(m){
 const s=m.getStyle()?.sources||{};
 for(const id of ['openmaptiles','openfreemap','composite'])if(s[id]?.type==='vector')return id;
 for(const id of Object.keys(s))if(s[id]?.type==='vector')return id;
 return null;
}
function isColorMode(){return document.body.classList.contains('ws23-three-d')}
function setStatus(message){
 const target=document.getElementById('ws26-coverage');
 if(target)target.textContent=message;
}
function update(){
 const m=activeMap();if(!m)return false;
 mode=isColorMode()&&showFootprints;
 try{
  if(m.getLayer(ID)){
   const v=mode?'visible':'none';
   if(m.getLayoutProperty(ID,'visibility')!==v)m.setLayoutProperty(ID,'visibility',v);
   if(mode)setStatus('Mapped footprints with tile-provided heights (may be estimates); missing heights remain flat. Not architectural replicas.');
   else setStatus('Atlas: building roofs hidden • switch to Color 3D for the building layout');
   return true;
  }
  const source=sourceFor(m);
  let vector=source;
  if(!vector){
   vector=SOURCE;
   if(!m.getSource(SOURCE))m.addSource(SOURCE,{type:'vector',url:'https://tiles.openfreemap.org/planet'});
  }
  const order=m.getStyle()?.layers||[];
  const before=['worldscope-v21-mesh','worldscope-v25-rides','worldscope-route-glow','worldscope-route-line']
   .find(id=>!!m.getLayer(id))||order.find(x=>x.type==='symbol')?.id;
  m.addLayer({
   id:ID,type:'fill-extrusion',source:vector,'source-layer':'building',minzoom:14.3,
   layout:{visibility:mode?'visible':'none'},
   paint:{
    'fill-extrusion-color':['case',
      ['>=',['coalesce',['to-number',['get','render_height']],0],18],'#a9c9d4',
      ['>=',['coalesce',['to-number',['get','render_height']],0],10],'#e5b98b',color],
    'fill-extrusion-height':['max',0,['to-number',['get','render_height'],0]],
    'fill-extrusion-base':['min',['max',0,['to-number',['get','render_height'],0]],['max',0,['to-number',['get','render_min_height'],0]]],
    'fill-extrusion-opacity':0.94
   }
  },before);
  sourceReady=true;
  setStatus(mode?'3D layout: mapped footprints; unknown heights remain flat.':'Atlas: 3D building layout ready when Color 3D is enabled.');
  return true;
 }catch(e){lastError=String(e?.message||e);setStatus('Building footprints unavailable. Ride and shop concept models remain usable.');return false}
}
function cleanupLegacy(){
 const m=activeMap();if(!m)return;
 for(const id of ['worldscope-v17-buildings','worldscope-3d']){
  if(m.getLayer(id))try{m.removeLayer(id)}catch{try{m.setLayoutProperty(id,'visibility','none')}catch{}}
 }
}
function bind(){
 const m=activeMap()||(typeof map!=='undefined'?map:null);
 if(!m||m===observed)return;
 observed=m;
 for(const evt of ['load','style.load'])m.on(evt,()=>{cleanupLegacy();update()});
 if(m.isStyleLoaded?.()){cleanupLegacy();update()}
}
function arrange(){
 const wrap=document.querySelector('#map .mapwrap');
 if(!wrap)return;
 if(!document.getElementById('ws26-footprint-toggle')){
  const b=document.createElement('button');b.id='ws26-footprint-toggle';b.type='button';b.textContent='▧ Building layouts: ON';
  b.setAttribute('aria-pressed','true');b.setAttribute('aria-label','Show or hide OpenStreetMap 3D building footprint extrusions');
  b.addEventListener('click',()=>{showFootprints=!showFootprints;b.textContent=showFootprints?'▧ Building layouts: ON':'▤ Building layouts: OFF';b.setAttribute('aria-pressed',String(showFootprints));update()});wrap.append(b)
 }
 if(!document.getElementById('ws26-coverage')){
  const t=document.createElement('small');
  t.id='ws26-coverage';t.className='ws26-coverage';
  t.textContent='Building layout: awaiting map';
  t.setAttribute('role','status');wrap.append(t);
 }
 bind();update();
}
const oldInit=window.initMap;
if(typeof oldInit==='function')window.initMap=function(){const r=oldInit();bind();return r};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arrange,{once:true});else arrange();
window.addEventListener('worldscope-ready',arrange);
document.addEventListener('click',e=>{if(e.target?.closest?.('#ws23-map2d,#ws23-map3d'))queueMicrotask(()=>{cleanupLegacy();update()})});
window.WorldscopeArchitecture26={sync:update,bind,toggleFootprints(on){showFootprints=!!on;const b=document.getElementById('ws26-footprint-toggle');if(b){b.textContent=showFootprints?'▧ Building layouts: ON':'▤ Building layouts: OFF';b.setAttribute('aria-pressed',String(showFootprints))}return update()},get state(){return{colorMode:mode,showFootprints,layerPresent:!!activeMap()?.getLayer(ID),sourceReady,lastError}}};
})();