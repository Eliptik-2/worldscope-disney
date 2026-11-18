/* Worldscope v1.8 — visible multi-leg journeys. Preview navigation, not official Disney routing. */
(function(){
'use strict';
const $$=id=>document.getElementById(id);
const BOARDWALK={name:'BoardWalk resort bus stop area',lon:-81.5561,lat:28.3674,verified:false,description:'Approximate resort front entrance area. Follow signs for the actual bus stop.'};
const PARK_STOPS={
 'Magic Kingdom':{name:'Magic Kingdom Bus Station',lon:-81.57876,lat:28.41574,verified:true,description:'OSM station center; exact Disney bus bay may vary.'}
};
const endpoint=name=>({name,lon:null,lat:null});
let trip={kind:'none',points:[],lines:[],message:'',key:0};
let pins=[],hookedMap=null,revision=0;
const busColor='#64c6ff',walkColor='#ffda7c';
const inWorld=(lon,lat)=>Number.isFinite(lon)&&Number.isFinite(lat)&&lon>-81.625&&lon< -81.493&&lat>28.332&&lat<28.443;
function geoDistance(a,b){
 const rad=Math.PI/180,lat=(b.lat-a.lat)*rad,lon=(b.lon-a.lon)*rad;
 const h=Math.sin(lat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(lon/2)**2;
 return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));
}
function clearLayers(){
 if(typeof map==='undefined'||!map)return;
 ['bus','walk','link'].forEach(type=>{
  const id='worldscope-v18-'+type;
  try{if(map.getLayer(id+'-line'))map.removeLayer(id+'-line')}catch{}
  try{if(map.getLayer(id+'-halo'))map.removeLayer(id+'-halo')}catch{}
  try{if(map.getSource(id))map.removeSource(id)}catch{}
 });
}
function clearPins(){pins.forEach(p=>{try{p.remove()}catch{}});pins=[]}
function resetJourney(){
 revision++;clearPins();clearLayers();trip={kind:'none',points:[],lines:[],message:'',key:revision};
 const box=$$('journey-map-status');if(box)box.textContent='';
}
function point(name,coord,description,icon,confidence){
 return{name,lon:coord?.lon,lat:coord?.lat,description:description||'',icon:icon||'📍',confidence:confidence||'approx'};
}
function drawPins(){
 clearPins();
 if(typeof map==='undefined'||!map||!window.maplibregl)return;
 trip.points.forEach((p,i)=>{
  if(!inWorld(p.lon,p.lat))return;
  const el=document.createElement('button');el.type='button';el.className='worldscope-journey-pin';
  el.textContent=String(i+1);
  el.title=p.name+' — '+p.description;
  el.setAttribute('aria-label','Stop '+(i+1)+': '+p.name+'. '+p.description);
  el.style.background=p.icon==='🚌'?busColor:p.icon==='🚶'?walkColor:'#d4b2f6';
  const popupNode=document.createElement('div');
  const heading=document.createElement('strong');heading.textContent=p.icon+' '+p.name;
  const detail=document.createElement('p');detail.textContent=p.description;
  popupNode.append(heading,detail);
  const marker=new maplibregl.Marker({element:el}).setLngLat([p.lon,p.lat])
   .setPopup(new maplibregl.Popup({offset:18}).setDOMContent(popupNode)).addTo(map);
  pins.push(marker);
 });
}
function drawLine(line){
 if(typeof map==='undefined'||!map||!map.isStyleLoaded?.()||line.coords?.length<2)return;
 if(line.coords.some(c=>!Array.isArray(c)||!inWorld(c[0],c[1])))return;
 const id='worldscope-v18-'+line.type;
 const feature={type:'Feature',properties:{confidence:line.confidence},geometry:{type:'LineString',coordinates:line.coords}};
 try{
  if(map.getSource(id))map.getSource(id).setData(feature);
  else map.addSource(id,{type:'geojson',data:feature});
  if(!map.getLayer(id+'-halo'))map.addLayer({id:id+'-halo',type:'line',source:id,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#13233a','line-opacity':0.77,'line-width':10}});
  if(!map.getLayer(id+'-line'))map.addLayer({id:id+'-line',type:'line',source:id,layout:{'line-cap':'round','line-join':'round'},paint:{
   'line-color':line.type==='walk'?walkColor:busColor,
   'line-width':5,'line-opacity':0.98,
   ...(line.type==='link'?{'line-dasharray':[2,3]}:{})
  }});
 }catch(e){console.warn('Worldscope journey map overlay unavailable',e)}
}
function redraw(){if(typeof map==='undefined'||!map)return;trip.lines.forEach(drawLine);drawPins()}
function addLine(type,coords,confidence){
 trip.lines=trip.lines.filter(x=>x.type!==type);
 trip.lines.push({type,coords,confidence});drawLine(trip.lines[trip.lines.length-1]);
}
function mapBounds(){
 if(typeof map==='undefined'||!map||!trip.points.length)return;
 const pts=trip.points.filter(p=>inWorld(p.lon,p.lat));
 if(!pts.length)return;
 let minLon=Math.min(...pts.map(p=>p.lon)),maxLon=Math.max(...pts.map(p=>p.lon));
 let minLat=Math.min(...pts.map(p=>p.lat)),maxLat=Math.max(...pts.map(p=>p.lat));
 if(minLon===maxLon){minLon-=.0009;maxLon+=.0009}
 if(minLat===maxLat){minLat-=.0009;maxLat+=.0009}
 try{map.fitBounds([[minLon,minLat],[maxLon,maxLat]],{padding:65,maxZoom:17.6,duration:650,pitch:0})}catch(e){console.warn(e)}
}
function itineraryCard(){
 const box=$$('journey-map-status');if(!box)return;
 box.replaceChildren();
 if(trip.kind==='none')return;
 const title=document.createElement('strong');title.textContent='🗺 Journey map · '+trip.points.length+' marked stops';
 box.append(title);
 const chips=document.createElement('div');chips.className='journey-stop-chips';
 trip.points.forEach((p,i)=>{
  const b=document.createElement('button');b.type='button';b.textContent=(i+1)+'. '+p.icon+' '+p.name;
  b.addEventListener('click',()=>{
   if(inWorld(p.lon,p.lat)&&typeof map!=='undefined'&&map)map.flyTo({center:[p.lon,p.lat],zoom:17,pitch:0});
  });chips.append(b);
 });box.append(chips);
 const legend=document.createElement('p');legend.className='journey-legend';
 const hasBus=trip.lines.some(x=>x.type==='bus'),hasWalk=trip.lines.some(x=>x.type==='walk'),hasLink=trip.lines.some(x=>x.type==='link');
 legend.textContent=(hasBus?'🔵 Blue: approximate road path, NOT confirmed Disney bus route. ':'')+(hasWalk?'🟡 Gold: pedestrian routing data; guest entrances unverified. ':'')+(hasLink?'🔷 Dotted blue: schematic transfer only, not a street route. ':'')+(trip.message||'');
 box.append(legend);
 const focus=document.createElement('button');focus.type='button';focus.className='btn secondary';focus.textContent='⌖ Show the whole journey on map';focus.addEventListener('click',focusJourney);box.append(focus);
}
function focusJourney(){
 if(window.WorldscopeExplore&&document.body.classList.contains('worldscope-immersive'))window.WorldscopeExplore.toggleRight(false);
 if(typeof go==='function')go('map');
 setTimeout(mapBounds,90);
}
function ensureHooks(){
 if(typeof map==='undefined'||!map||hookedMap===map)return;
 hookedMap=map;
 map.on('style.load',()=>{setTimeout(()=>{trip.lines.forEach(drawLine);if(trip.points.length&&!pins.length)drawPins()},0)});
 map.on('load',()=>{trip.lines.forEach(drawLine);if(trip.points.length&&!pins.length)drawPins()});
 map.on('idle',()=>{if(trip.lines.length&&trip.lines.some(l=>!map.getLayer('worldscope-v18-'+l.type+'-line')))trip.lines.forEach(drawLine)});
}
const originalInit=window.initMap;
if(typeof originalInit==='function')window.initMap=function(){originalInit();ensureHooks()};
function silentStatus(note){
 trip.message=note;itineraryCard();
 const feedback=$$('routefeedback');
 if(feedback?.textContent.includes('Transportation plan shown'))feedback.textContent+=' Open the journey map below for visible stops.';
}
function schematicCurve(a,b){
 const cx=(a.lon+b.lon)/2,cy=(a.lat+b.lat)/2;
 const dx=b.lon-a.lon,dy=b.lat-a.lat;
 const len=Math.sqrt(dx*dx+dy*dy)||1;
 const offset=Math.min(len*.13,.004);
 const mx=cx-dy/len*offset,my=cy+dx/len*offset;
 const out=[];for(let i=0;i<=32;i++){let t=i/32;out.push([(1-t)*(1-t)*a.lon+2*(1-t)*t*mx+t*t*b.lon,(1-t)*(1-t)*a.lat+2*(1-t)*t*my+t*t*b.lat])}
 return out;
}
async function valhallaGeometry(a,b,costing,signal){
 if(!inWorld(a.lon,a.lat)||!inWorld(b.lon,b.lat))throw Error('Missing valid endpoint');
 const request={locations:[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}],costing,units:'kilometers',language:'en-US'};
 const timer=new AbortController();
 const abort=()=>timer.abort();signal?.addEventListener('abort',abort,{once:true});
 const timeout=setTimeout(()=>timer.abort(),9500);
 try{
  const url='https://valhalla1.openstreetmap.de/route?json='+encodeURIComponent(JSON.stringify(request));
  const response=await fetch(url,{signal:timer.signal});
  if(!response.ok)throw Error('Routing HTTP '+response.status);
  const json=await response.json();
  const shape=json?.trip?.legs?.[0]?.shape;
  const km=Number(json?.trip?.summary?.length);
  if(!shape||!Number.isFinite(km)||km<=0)throw Error('No route');
  if(typeof decodePolyline6!=='function')throw Error('Geometry decoder unavailable');
  const coords=decodePolyline6(shape);
  if(coords.length<2||coords.some(c=>!inWorld(c[0],c[1])))throw Error('Route leaves resort map');
  const direct=geoDistance(a,b);
  const maxRatio=costing==='pedestrian'?3.6:4.5;
  if(km*1000>Math.max(direct*maxRatio,costing==='pedestrian'?450:800)||km>25)throw Error('Implausible route');
  return coords;
 }finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort)}
}
async function renderTransfer(start,dest,plan){
 resetJourney();
 const generation=revision;
 if(typeof initMap==='function')initMap();
 ensureHooks();
 const from={lon:start.lon,lat:start.lat};
 const end={lon:dest.lon,lat:dest.lat};
 if(plan.mode!=='bus'){
  trip.kind='transfer';
  trip.points=[point('BoardWalk',from,'Starting area, not a confirmed doorway.','🏨'),
   point(dest.name,end,'Attraction feature position, not the queue entrance.','🎯')];
  trip.message='Only mapped points are shown until a reliable guest walkway can be confirmed.';
  drawPins();itineraryCard();mapBounds();
  try{
   const walk=await valhallaGeometry(from,end,'pedestrian');
   if(generation!==revision)return;
   addLine('walk',walk,'experimental');
   trip.message='Guest paths, admission gates and queue entrances must be checked in My Disney Experience.';
   itineraryCard();
  }catch(e){if(generation===revision)trip.message='No reliable pedestrian map route returned. Pins only; check Disney directions.';itineraryCard()}
  return;
 }
 const alight=PARK_STOPS[dest.park];
 if(!alight){
  trip.kind='transfer';trip.points=[
   point('BoardWalk resort bus stop',BOARDWALK,BOARDWALK.description,'🚌'),
   point(dest.park+' transportation area',typeof COORD==='object'?{lon:COORD[dest.park]?.[0],lat:COORD[dest.park]?.[1]}:null,'Approximate park center; correct bus unloading bay not yet mapped.','🚌'),
   point(dest.name,end,'Attraction reference point; guest entrance unverified.','🎯')];
  trip.message='Transit stop locations at this park are not individually verified yet; schematic only.';
  drawPins();itineraryCard();mapBounds();return;
 }
 trip.kind='bus';
 trip.points=[point('BoardWalk bus stop',BOARDWALK,BOARDWALK.description,'🚌'),
  point(alight.name,alight,alight.description,'🚌','station-centroid'),
  point(dest.name,end,'Mapped attraction location, not a verified ride entrance.','🎯')];
 trip.message='Checking route geometry. Bus bay number and departure time are not live.';
 drawPins();itineraryCard();mapBounds();
 // Always provide a visible transfer CONNECTION, visually distinct from verified navigation.
 addLine('link',schematicCurve(BOARDWALK,alight),'schematic');
 itineraryCard();
 const requests=[
  valhallaGeometry(BOARDWALK,alight,'auto').then(coords=>{
   if(generation!==revision)return;
   trip.lines=trip.lines.filter(x=>x.type!=='link');clearLayers();
   addLine('bus',coords,'approximate-road');
   trip.lines.filter(x=>x.type!=='bus').forEach(drawLine);
   trip.message='Blue road shape is an approximate drivable corridor; Disney buses can use a different road or stop.';
   itineraryCard();
  }).catch(e=>{if(generation===revision){trip.message='Dotted blue is a schematic connection; public road routing unavailable. No actual bus path is claimed.';itineraryCard()}}),
  valhallaGeometry(alight,end,'pedestrian').then(coords=>{
   if(generation!==revision)return;
   addLine('walk',coords,'experimental');
   trip.message='Gold walking line follows public pedestrian map data, not verified Disney queue access.';
   itineraryCard();
  }).catch(e=>{if(generation===revision){trip.message='Walking segment unavailable. Bus stops and attraction are marked; use Disney for the final park walk.';itineraryCard()}})
 ];
 await Promise.allSettled(requests);
}
const originalTransit=window.showTransitPlan;
if(typeof originalTransit==='function')window.showTransitPlan=function(start,dest,plan){
 originalTransit(start,dest,plan);
 void renderTransfer(start,dest,plan).catch(e=>console.warn('Map transfer preview unavailable',e));
};
const originalRouteLine=window.renderRouteLine;
if(typeof originalRouteLine==='function')window.renderRouteLine=function(coords){
 originalRouteLine(coords);
 if(trip.kind==='bus')return; // bus+walk are separate layers
 if(!Array.isArray(coords)||coords.length<2)return;
 resetJourney();
 trip.kind='walk';
 trip.points=[point('Starting point',{lon:coords[0][0],lat:coords[0][1]},'Snapped to the pedestrian routing graph.','🚶'),
  point('Destination',{lon:coords[coords.length-1][0],lat:coords[coords.length-1][1]},'Snapped to public pedestrian routing graph; guest queue entrance unverified.','🎯')];
 trip.message='The yellow walking route is experimental and must be verified at the park.';
 // Original line is already rendered; retain geometry and return it on style change.
 trip.lines=[{type:'walk',coords,confidence:'experimental'}];
 drawPins();drawLine(trip.lines[0]);itineraryCard();
};
const originalClear=window.clearRoute;
if(typeof originalClear==='function')window.clearRoute=function(full){resetJourney();return originalClear(full)};
const originalTransferNeeded=window.showTransferNeeded;
if(typeof originalTransferNeeded==='function')window.showTransferNeeded=function(start,dest){
 resetJourney();originalTransferNeeded(start,dest);
 trip.kind='transfer';
 trip.points=[point(start.name||'Starting area',start,'This is not a verified bus or walkway point.','🚶'),
  point(dest.name||'Destination',dest,'Consult Disney for transport transfers.','🎯')];
 trip.message='No verified transfer mapped; these pins are for orientation only.';
 drawPins();itineraryCard();mapBounds();
};
const originalPlanRoute=window.planRoute;
if(typeof originalPlanRoute==='function')window.planRoute=async function(){
 if(trip.kind!=='none')resetJourney();
 const answer=await originalPlanRoute();
 // If the provider refused to draw a route, still show the start/destination markers.
 if(trip.kind==='none'&&typeof routeDestination!=='undefined'&&routeDestination){
  let start=null;try{start=await getRouteOrigin()}catch{}
  if(start&&inWorld(start.lon,start.lat)){
   trip.kind='no-route';
   trip.points=[point(start.name||'Start',start,'Reference start location, not an actual walkway.','🚶'),
    point(routeDestination.name,routeDestination,'No valid pedestrian route was found; not a queue entrance.','🎯')];
   trip.message='There is no confirmed route line; visible numbered pins show endpoints only.';
   drawPins();itineraryCard();mapBounds();
  }
 }
 return answer;
};
function attachUI(){
 const panel=$$('routepanel');
 if(!panel||$$('journey-map-status'))return;
 const wrap=document.createElement('section');wrap.id='journey-map-status';wrap.className='journey-map-status';
 const routes=$$('routesteps');if(routes)routes.after(wrap);else panel.append(wrap);
 // Keep a stable focus button available in both normal and fullscreen panels.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachUI,{once:true});else attachUI();
window.WorldscopeJourney={get snapshot(){return{kind:trip.kind,stops:trip.points.length,lines:trip.lines.map(l=>l.type),message:trip.message}},focus:focusJourney,redraw,reset:resetJourney,geoDistance};
})();