/* Worldscope v2.3 — neutral atlas/colored 3D, precise-location workflow,
   collapsible mobile Directions and camera-navigation concept. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const PREVIEW=location.pathname.includes('/preview/');
 const PIN_KEY=(PREVIEW?'worldscope-preview-':'worldscope-')+'manual-position-v23';
 let manual={},placing=null,mapAttached=null,cameraStream=null,arOpen=false;
 try{manual=JSON.parse(localStorage.getItem(PIN_KEY)||'{}')||{}}catch{manual={}}
 function entries(){return typeof items!=='undefined'&&Array.isArray(items)?items:[]}
 function selected(){const id=$('worldscope-destination')?.value;return entries().find(e=>String(e.id)===String(id))||null}
 function validPt(lon,lat){return Number.isFinite(lon)&&Number.isFinite(lat)&&lon>-81.625&&lon<-81.49&&lat>28.33&&lat<28.45}
 function applyManualLocations(){
  let count=0;
  for(const e of entries()){
   const p=manual[String(e.id)];
   if(p&&validPt(p.lon,p.lat)&&p.park===e.park){e.lon=p.lon;e.lat=p.lat;e.locationConfidence='user-placed; unverified';count++}
  }
  const status=$('ws23-lookup-status');if(status)status.textContent=count?'Restored '+count+' personal map pin'+(count===1?'':'s')+' on this device. Entrances not verified.':'Select any unmapped location, then use Place marker.';
  if(window.WorldscopeV22?.refreshPins)window.WorldscopeV22.refreshPins();
 }
 function setMapView(colored3d){
  window.WorldscopeCleanView27?.resetLandmarks();
  window.WorldscopeRideAtlas25?.toggle(false);
  if(typeof map!=='undefined'&&map&&window.WorldscopeV19?.changeMode)window.WorldscopeV19.changeMode('color');
  // Geographic map mode never automatically displays concept meshes.
  if(window.WorldscopeV22?.toggle)window.WorldscopeV22.toggle(false);
  if(typeof map!=='undefined'&&map?.easeTo)try{map.easeTo({pitch:colored3d?52:0,bearing:0,duration:350})}catch{}
  document.body.classList.toggle('ws23-three-d',!!colored3d);
  window.WorldscopeArchitecture26?.sync();
  const b=$('ws23-map3d'),a=$('ws23-map2d');
  if(a)a.setAttribute('aria-pressed',String(!colored3d));
  if(b)b.setAttribute('aria-pressed',String(!!colored3d));
  const text=$('ws23-map-desc');if(text)text.textContent=colored3d?'Mapped building outlines • heights vary':'Flat geographic atlas';
 }
 function initView(){
  const wrap=document.querySelector('#map .mapwrap');if(!wrap||$('ws23-map-style'))return;
  const box=document.createElement('div');box.id='ws23-map-style';box.className='ws23-map-style';
  const mapBtn=document.createElement('button');mapBtn.type='button';mapBtn.id='ws23-map2d';mapBtn.textContent='◈ Atlas';mapBtn.addEventListener('click',()=>setMapView(false));
  const threeBtn=document.createElement('button');threeBtn.type='button';threeBtn.id='ws23-map3d';threeBtn.textContent='3D layout';threeBtn.addEventListener('click',()=>setMapView(true));
  const desc=document.createElement('small');desc.id='ws23-map-desc';desc.textContent='Neutral illustrated atlas · no satellite tiles';
  box.append(mapBtn,threeBtn,desc);wrap.append(box);
  // Preserve the original 3D picker (landmark fly-to), but remove duplicate toggle to reduce screen clutter.
  const legacy=$('worldscope-v21-toggle');if(legacy)legacy.style.display='none';
  document.body.classList.add('ws23-atlas');
  // Other scripts initially use HD aerial. Apply without replacing the map style.
  if(typeof map!=='undefined'&&map&&window.WorldscopeV19?.changeMode)window.WorldscopeV19.changeMode('color');
  setMapView(false);
 }
 function addCloseDirections(){
  const panel=$('routepanel');if(!panel||$('ws23-directions-close'))return;
  const b=document.createElement('button');b.id='ws23-directions-close';b.type='button';b.textContent='✕ Hide directions';
  b.setAttribute('aria-label','Collapse directions to see the full map');b.addEventListener('click',()=>{
   if(window.WorldscopeExplore)window.WorldscopeExplore.toggleRight(false);
  });panel.prepend(b);
 }
 function status(message){const s=$('ws23-lookup-status');if(s)s.textContent=message}
 function beginPlace(){
  const e=selected();if(!e){status('Choose a destination first.');return}
  placing=e;
  if(window.WorldscopeExplore?.enter && !document.body.classList.contains('worldscope-immersive'))window.WorldscopeExplore.enter();
  if(window.WorldscopeExplore?.toggleRight)window.WorldscopeExplore.toggleRight(false);
  status('Tap the actual guest-accessible location of '+e.name+' on the map. This is your estimate, not Disney-verified navigation.');
  if(typeof map!=='undefined'&&map){map.getCanvas().style.cursor='crosshair'}
 }
 function onMapClick(evt){
  if(!placing)return;
  const x=evt.lngLat?.lng,y=evt.lngLat?.lat;
  if(!validPt(x,y)){status('That point is outside Walt Disney World. Try again.');return}
  const e=placing;placing=null;
  try{if(map?.getCanvas)map.getCanvas().style.cursor=''}catch{}
  manual[String(e.id)]={lon:x,lat:y,park:e.park,setAt:new Date().toISOString()};
  try{localStorage.setItem(PIN_KEY,JSON.stringify(manual))}catch{}
  e.lon=x;e.lat=y;e.locationConfidence='user-placed; unverified';
  if(typeof setRouteDestination==='function')setRouteDestination(e,x,y,'user map selection');
  if(window.WorldscopeV22?.refreshPins)window.WorldscopeV22.refreshPins();
  if(window.WorldscopeExplore?.toggleRight)window.WorldscopeExplore.toggleRight(true);
  status('Personal marker saved for '+e.name+'. Entrance and walking approach are NOT verified.');
 }
 function attachMap(){
  if(typeof map==='undefined'||!map||map===mapAttached)return;
  mapAttached=map;map.on('click',onMapClick);
 }
 const init=window.initMap;if(typeof init==='function')window.initMap=function(){init();attachMap();if(window.WorldscopeV19?.changeMode)window.WorldscopeV19.changeMode('color')};
 function addPinUi(){
  const panel=$('routepanel');if(!panel||$('ws23-place-marker'))return;
  const group=document.createElement('section');group.id='ws23-places';group.className='ws23-places';
  const title=document.createElement('strong');title.textContent='📍 Missing a location?';
  const expl=document.createElement('p');expl.textContent='Some shops and dining spots are not mapped yet. Place your own temporary marker at a guest walkway; other family members cannot see it until shared data is enabled.';
  const btn=document.createElement('button');btn.type='button';btn.id='ws23-place-marker';btn.textContent='⌖ Place destination marker on map';btn.addEventListener('click',beginPlace);
  const reset=document.createElement('button');reset.type='button';reset.id='ws23-clear-marker';reset.textContent='Clear this marker';reset.addEventListener('click',()=>{
   const e=selected();if(!e)return;delete manual[String(e.id)];try{localStorage.setItem(PIN_KEY,JSON.stringify(manual))}catch{}
   status('Removed your marker for '+e.name+'. Reload to restore the directory location.');
  });
  const p=document.createElement('p');p.id='ws23-lookup-status';p.setAttribute('role','status');p.textContent='Choose a destination first.';
  group.append(title,expl,btn,reset,p);panel.append(group);
 }
 function stopCamera(){
  if(cameraStream){for(const track of cameraStream.getTracks())track.stop();cameraStream=null}
  const v=$('ws23-camera');if(v){v.pause();v.srcObject=null}
  const overlay=$('ws23-ar');if(overlay)overlay.hidden=true;
  arOpen=false;
 }
 async function openCamera(){
  const overlay=$('ws23-ar'),video=$('ws23-camera'),msg=$('ws23-ar-status');if(!overlay||!video)return;
  overlay.hidden=false;arOpen=true;msg.textContent='Requesting camera permission…';
  if(window.WorldscopeExplore?.toggleRight)window.WorldscopeExplore.toggleRight(false);
  if(!navigator.mediaDevices?.getUserMedia){msg.textContent='Camera not available. HTTPS and a supported browser are required.';return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
   if(!arOpen){stream.getTracks().forEach(t=>t.stop());return}
   cameraStream=stream;video.srcObject=stream;await video.play();
   msg.textContent='CONCEPT ONLY: Guide line is screen-fixed, NOT aligned with an actual Disney walkway. Do not follow it for navigation.';
  }catch(e){msg.textContent='Camera permission denied or unavailable. The regular map still works.'}
 }
 function addCameraUi(){
  if($('ws23-ar'))return;
  const panel=$('routepanel');if(!panel)return;
  const btn=document.createElement('button');btn.id='ws23-ar-open';btn.type='button';btn.textContent='◉ Camera guide prototype';btn.addEventListener('click',openCamera);panel.append(btn);
  const overlay=document.createElement('div');overlay.id='ws23-ar';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Experimental camera guidance');
  const video=document.createElement('video');video.id='ws23-camera';video.autoplay=true;video.muted=true;video.playsInline=true;
  const top=document.createElement('div');top.className='ws23-ar-top';top.textContent='WORLD SCOPE · AR CONCEPT · NOT NAVIGATION';
  const center=document.createElement('div');center.className='ws23-ar-guide';center.textContent='◇';center.setAttribute('aria-hidden','true');
  const msg=document.createElement('p');msg.id='ws23-ar-status';msg.textContent='Camera preview only. This guide cannot detect obstacles, location or valid walking paths.';
  const close=document.createElement('button');close.type='button';close.textContent='✕ Return to map';close.addEventListener('click',stopCamera);
  overlay.append(video,top,center,msg,close);document.body.append(overlay);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera()});
  window.addEventListener('pagehide',stopCamera);
 }
 function ready(){initView();addCloseDirections();addPinUi();addCameraUi();attachMap();applyManualLocations()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 window.addEventListener('worldscope-ready',()=>{ready()});
 window.WorldscopeV23={setMapView,openCamera,stopCamera,beginPlace,applyManualLocations,get state(){return{placing:!!placing,cameraActive:!!cameraStream,manualCount:Object.keys(manual).length}}};
})();