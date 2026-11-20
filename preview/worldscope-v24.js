/* Worldscope v2.4 — clean 3D layers, accessible full-map controls and shorter
   experimental pedestrian routing. User-facing routes remain advisory. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
let currentMap=null,watching=false,routeRevision=0,walkController=null,extrusionPasses=0;
let navigationMode='atlas',lastRoute=null;
const routeSource='ws24-waypoints',routeLayer='ws24-waypoint-dots';
const parkedMap=()=>typeof map!=='undefined'&&map;
const isReady=()=>!!(parkedMap()&&map.isStyleLoaded?.());
const samePoint=(a,b)=>Math.hypot(Number(a?.lon)-Number(b?.lon),Number(a?.lat)-Number(b?.lat))<0.00001;
function hideGrayBuildings(){
 if(!isReady())return 0;
 const layers=map.getStyle()?.layers||[];
 let hidden=0;
 for(const lyr of layers){
  if(lyr.type!=='fill-extrusion')continue;
  try{
   if(map.getLayoutProperty?.(lyr.id,'visibility')!=='none'){
    map.setLayoutProperty(lyr.id,'visibility','none');hidden++;
   }
  }catch(e){console.warn('Worldscope cannot hide base building',lyr.id,e)}
 }
 extrusionPasses+=hidden;
 return hidden;
}
function keepRoutesOnTop(){
 if(!isReady())return;
 for(const id of [
  'worldscope-route-glow','worldscope-route-line',
  'worldscope-v18-link-halo','worldscope-v18-link-line',
  'worldscope-v18-bus-halo','worldscope-v18-bus-line',
  'worldscope-v18-walk-halo','worldscope-v18-walk-line',routeLayer
 ]){
  try{if(map.getLayer(id))map.moveLayer(id)}catch{}
 }
 window.WorldscopeJourney?.redraw?.();
}
function ensureHandlers(){
 if(!parkedMap()||currentMap===map)return;
 currentMap=map;
 const refresh=()=>{hideGrayBuildings();keepRoutesOnTop()};
 map.on('load',refresh);
 map.on('style.load',refresh);
 // Needed because older components asynchronously insert generic 3D extrusions.
 map.on('idle',()=>hideGrayBuildings());
 if(isReady())refresh();
}
// Older scripts add gray fill-extrusion buildings. Do not let them compete
// with the separate original Worldscope landmark scene in either map mode.
window.enableBuildings=()=>{hideGrayBuildings();return false};
window.loadBuildings=()=>{hideGrayBuildings();return false};
const originalInit=window.initMap;
if(typeof originalInit==='function')window.initMap=function(){const result=originalInit();ensureHandlers();return result};
function cleanAfterMode(){
 navigationMode=document.body.classList.contains('ws23-three-d')?'color3d':'atlas';
 if(isReady()){hideGrayBuildings();keepRoutesOnTop()}
}
function improveModeControls(){
 const mapwrap=document.querySelector('#map .mapwrap');if(!mapwrap)return;
 // The old full-screen button was hidden beneath the newer Atlas/3D toolbar.
 const open=$('exploreFullscreenButton');if(open){open.textContent='⛶ Expand map';open.setAttribute('aria-label','Enter full-screen Worldscope map')}
 // Keep Fly-to-Landmark usable but collapsed so it does not cover buildings.
 const old=$('worldscope-v21-tools');
 if(old&&!$('ws24-landmarks')){
  const chooser=old.querySelector('select');
  const details=document.createElement('details');details.id='ws24-landmarks';details.className='ws24-landmark-details';
  const title=document.createElement('summary');title.textContent='🏰 Landmarks';title.setAttribute('aria-label','Show landmark fly-to selector');
  details.append(title);
  if(chooser){details.append(chooser);chooser.setAttribute('aria-label','Fly to a 3D landmark')}
  const help=document.createElement('small');help.textContent='Pick a location to inspect the 3D scene.';details.append(help);
  mapwrap.append(details);
  old.classList.add('ws24-legacy-hidden');
 }
 const scene=$('worldscope-scene');if(scene)scene.setAttribute('aria-hidden','true');
 const newMapControls=$('ws23-map-style');if(newMapControls)newMapControls.setAttribute('aria-label','Atlas and Color 3D modes');
 if(!watching){
  watching=true;
  // Mode toggles from v2.3 set the colorful scene synchronously. Reassert
  // the no-generic-buildings rule after their event callbacks run.
  for(const id of ['ws23-map2d','ws23-map3d']){
   $(id)?.addEventListener('click',()=>queueMicrotask(cleanAfterMode));
  }
 }
 const status=$('ws24-path-status');if(status)status.textContent='Compare mapped pedestrian paths; Disney walkway shortcuts are not fully verified.';
}
function distanceMeters(a,b){
 const p=Math.PI/180,dl=(b.lat-a.lat)*p,doLon=(b.lon-a.lon)*p;
 const h=Math.sin(dl/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(doLon/2)**2;
 return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));
}
function pathLength(coords){let n=0;for(let i=1;i<coords.length;i++)n+=distanceMeters({lon:coords[i-1][0],lat:coords[i-1][1]},{lon:coords[i][0],lat:coords[i][1]});return n}
function reportRoute(text,level='info'){
 const el=$('ws24-path-status');if(el){el.textContent=text;el.dataset.level=level}
}
function removePriorRouteGraphics(){
 if(parkedMap()){
  for(const layer of ['worldscope-route-line','worldscope-route-glow'])try{if(map.getLayer(layer))map.removeLayer(layer)}catch{}
  try{if(map.getSource('worldscope-route'))map.removeSource('worldscope-route')}catch{}
 }
 if(typeof routeGeo!=='undefined')routeGeo=null;
 window.WorldscopeJourney?.reset?.();
}
function endpoints(start,dest){
 if(!isReady())return;
 const points=[start,dest].filter(p=>Number.isFinite(p?.lon)&&Number.isFinite(p?.lat));
 if(points.length!==2)return;
 const fc={type:'FeatureCollection',features:points.map((p,i)=>({type:'Feature',properties:{label:i?'Destination':'Start'},geometry:{type:'Point',coordinates:[p.lon,p.lat]}}))};
 try{
  if(map.getSource(routeSource))map.getSource(routeSource).setData(fc);
  else{
   map.addSource(routeSource,{type:'geojson',data:fc});
   map.addLayer({id:routeLayer,type:'circle',source:routeSource,
    paint:{'circle-radius':8,'circle-color':['case',['==',['get','label'],'Start'],'#6ff0cb','#ffd389'],
     'circle-stroke-color':'#12233a','circle-stroke-width':3}});
  }
 }catch(e){console.warn('Map could not mark route endpoints',e)}
}
function validRoute(json,start,dest){
 const trip=json?.trip;if(!trip?.legs?.length)return null;
 const coords=trip.legs.flatMap((leg,i)=>{const c=decodePolyline6(leg.shape);return i?c.slice(1):c});
 if(coords.length<2||coords.length>25000)return null;
 if(coords.some(c=>!Array.isArray(c)||!c.every(Number.isFinite)||!withinResort(c[0],c[1])))return null;
 const direct=distanceMeters(start,dest),meters=pathLength(coords);
 if(meters<direct*.68||meters>Math.max(700,direct*2.7)||meters>15000)return null;
 if(distanceMeters(start,{lon:coords[0][0],lat:coords[0][1]})>190)return null;
 const end=coords[coords.length-1];
 if(distanceMeters(dest,{lon:end[0],lat:end[1]})>190)return null;
 const reportedMinutes=Math.ceil(Number(trip.summary?.time)/60);
 const minutes=Number.isFinite(reportedMinutes)&&reportedMinutes>0?reportedMinutes:Math.max(1,Math.ceil(meters/75));
 return {coords,meters,minutes,direct,steps:trip.legs.flatMap(l=>l.maneuvers||[]).slice(0,40)};
}
async function fetchWalk(start,dest,shortest,signal){
 const req={locations:[{lat:start.lat,lon:start.lon},{lat:dest.lat,lon:dest.lon}],costing:'pedestrian',units:'kilometers',language:'en-US'};
 if(shortest)req.costing_options={pedestrian:{shortest:true}};
 const url='https://valhalla1.openstreetmap.de/route?json='+encodeURIComponent(JSON.stringify(req));
 const response=await fetch(url,{signal});
 if(!response.ok)throw Error('Walking service HTTP '+response.status);
 return validRoute(await response.json(),start,dest);
}
async function tryShortestParkRoute(){
 const dest=typeof routeDestination!=='undefined'?routeDestination:null;
 if(!dest||!Number.isFinite(dest.lat)||!Number.isFinite(dest.lon))return false;
 let start;
 try{start=await getRouteOrigin()}catch{return false}
 if(!start||!Number.isFinite(start.lat)||!Number.isFinite(start.lon))return false;
 const a=typeof classifyPark==='function'?classifyPark(start):start.park;
 const b=typeof classifyPark==='function'?classifyPark(dest):dest.park;
 if(!a||a!==b||a==='BoardWalk')return false;
 const direct=distanceMeters(start,dest);
 if(direct<25||direct>5000)return false;
 const rev=++routeRevision;
 walkController?.abort();walkController=new AbortController();
 const timeout=setTimeout(()=>walkController?.abort(),11500);
 reportRoute('Comparing standard walking and shorter-distance park paths…');
 try{
  const signal=walkController.signal;
  const candidates=await Promise.allSettled([fetchWalk(start,dest,false,signal),fetchWalk(start,dest,true,signal)]);
  if(rev!==routeRevision)return true;
  const options=candidates.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value).sort((x,y)=>x.meters-y.meters);
  const winner=options[0];
  endpoints(start,dest);
  if(!winner){
   removePriorRouteGraphics();
   if(typeof routeMessage==='function')routeMessage('No verified park walking path from the public routing graph. Start and destination are marked; use the official Disney app for walking navigation.',true);
   reportRoute('No reliable walking line found. No route through buildings was invented.','warning');
   if($('routesummary'))$('routesummary').textContent='No validated walking route';
   if($('routesteps'))$('routesteps').replaceChildren();
   return true;
  }
  // Replace old route geometry without invalidating this in-flight request.
  removePriorRouteGraphics();
  endpoints(start,dest);
  if(typeof routeGeo!=='undefined')routeGeo=winner.coords;
  if(typeof renderRouteLine==='function')renderRouteLine(winner.coords);
  if($('routesummary'))$('routesummary').textContent=`${winner.minutes} min estimated walk · ${(winner.meters/1609.344).toFixed(2)} miles · experimental`;
  if($('routesteps')){
   const list=$('routesteps');list.replaceChildren();
   for(const m of winner.steps){const li=document.createElement('li');li.textContent=m.instruction||'Continue along the mapped walkway';list.append(li)}
   if(!winner.steps.length){const li=document.createElement('li');li.textContent='Follow the displayed pedestrian route. Exact entrances and closures are not verified.';list.append(li)}
  }
  const others=options.length===2?Math.round(options[1].meters-winner.meters):0;
  const quality=winner.meters>Math.max(direct*1.65,600)?'Possible detour: route is substantially longer than direct distance. ':'Mapped park paths are incomplete. ';
  reportRoute((others>35?`Shortest-distance option saves about ${Math.round(others)} m compared with the standard option. `:'')+quality+'Verify the route in My Disney Experience.','warning');
  if(typeof routeMessage==='function')routeMessage('Shortest available mapped pedestrian path displayed. The route is not verified as the quickest Disney guest walkway; avoid closed paths and follow park signs.');
  keepRoutesOnTop();
  lastRoute={start,dest,meters:winner.meters,minutes:winner.minutes,alternatives:options.length};
  return true;
 }catch(err){if(rev!==routeRevision)return true;reportRoute('Walking provider unavailable: no shortcut has been invented.','warning');return false}
 finally{clearTimeout(timeout);if(rev===routeRevision)walkController=null}
}
const previousPlan=window.planRoute;
if(typeof previousPlan==='function')window.planRoute=async function(){
 const dest=typeof routeDestination!=='undefined'?routeDestination:null;
 const origin=typeof getPreviewOrigin==='function'?getPreviewOrigin():null;
 const isKnown=dest&&Number.isFinite(dest.lat)&&Number.isFinite(dest.lon);
 if(isKnown){
  const did=await tryShortestParkRoute();if(did)return;
 }
 // Resort transfers, unavailable positions, and point selection errors retain
 // v2.3 behavior; no fictitious walking line is inserted.
 return previousPlan();
};
const formerClear=window.clearRoute;
if(typeof formerClear==='function')window.clearRoute=function(full){
 routeRevision++;walkController?.abort();walkController=null;lastRoute=null;
 if(parkedMap()){try{if(map.getLayer(routeLayer))map.removeLayer(routeLayer);if(map.getSource(routeSource))map.removeSource(routeSource)}catch{}}
 reportRoute('');return formerClear(full);
};
function addHelp(){
 const panel=$('routepanel');if(!panel||$('ws24-path-status'))return;
 const div=document.createElement('div');div.id='ws24-path-status';div.className='ws24-path-status';div.setAttribute('role','status');
 const summary=$('routesummary');if(summary)summary.after(div);else panel.append(div);
}
function ready(){ensureHandlers();improveModeControls();addHelp();hideGrayBuildings()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('worldscope-ready',ready);
window.WorldscopeV24={hideGrayBuildings,keepRoutesOnTop,tryShortestParkRoute,distanceMeters,validRoute,
 get status(){return{navigationMode,extrusionPasses,lastRoute,hasFullscreenButton:!!$('exploreFullscreenButton')}}};
})();
