/* Worldscope v1.7: destination picker, independent 3D, HD aerial, local family-notes prototype.
   No third-party keys or private data are embedded in this file. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const parks=['Magic Kingdom','EPCOT','Hollywood Studios','Animal Kingdom','Disney Springs','BoardWalk'];
const userKey=location.pathname.includes('/preview/')?'worldscope-preview-user':'worldscope-user';
const notesKey=location.pathname.includes('/preview/')?'worldscope-preview-notes':'worldscope-notes';
const getArray=(name)=>{try{const v=JSON.parse(localStorage.getItem(name));return Array.isArray(v)?v:[]}catch{return []}};
const safeWrite=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
function element(tag,attrs={},value){
 const el=document.createElement(tag);
 for(const [key,val] of Object.entries(attrs)){if(key==='className')el.className=val;else if(key==='type')el.type=val;else el.setAttribute(key,val)}
 if(value!==undefined)el.textContent=value;
 return el;
}
// ---------------- Directory destination picker ----------------
let routeQuery='',routePark='';
function populateDestinations(){
 const sel=$('worldscope-destination');if(!sel)return;
 const previous=sel.value;
 sel.replaceChildren(new Option('Choose where you want to go…',''));
 const entries=(typeof items!=='undefined'?items:[]).filter(e=>e&&e.name&&(!routePark||e.park===routePark)&&(!routeQuery||(`${e.name} ${e.park} ${e.category}`).toLowerCase().includes(routeQuery)));
 parks.forEach(park=>{
  const matches=entries.filter(e=>e.park===park).sort((a,b)=>a.name.localeCompare(b.name));
  if(!matches.length)return;
  const group=document.createElement('optgroup');group.label=park;
  matches.forEach(e=>{const opt=new Option(e.name+(typeof validCoords==='function'&&validCoords(e)?'':' · needs map lookup'),String(e.id));group.append(opt)});
  sel.append(group);
 });
 if([...sel.options].some(e=>e.value===previous))sel.value=previous;
 const count=$('worldscope-destination-count');if(count)count.textContent=entries.length+' destinations · Unmapped places require a location lookup';
}
function pickDestination(id){
 if(!id){return}
 const entry=(typeof items!=='undefined'?items:[]).find(e=>String(e.id)===String(id));
 if(!entry)return;
 const select=$('worldscope-destination');if(select&&[...select.options].some(o=>o.value===String(id)))select.value=String(id);
 if(typeof findEntry==='function')findEntry(String(id));
 if(window.WorldscopeExplore && document.body.classList.contains('worldscope-immersive'))window.WorldscopeExplore.toggleRight(true);
 const status=$('worldscope-destination-count');if(status)status.textContent=entry.name+' selected · '+(typeof validCoords==='function'&&validCoords(entry)?'mapped feature, entrance unverified':'looking up individual position');
}
window.worldscopePickDestination=pickDestination;
window.worldscopeRefreshDestinations=populateDestinations;
function addPicker(){
 const target=$('routedestination');if(!target||$('worldscope-destination'))return;
 const parent=target.parentElement;
 const park=element('select',{id:'worldscope-destination-park',className:'input','aria-label':'Filter destinations by park'});
 park.add(new Option('All six destinations',''));
 parks.forEach(p=>park.add(new Option(p,p)));
 const search=element('input',{id:'worldscope-destination-search',type:'search',className:'input',placeholder:'Search all destinations…','aria-label':'Search destinations'});
 const sel=element('select',{id:'worldscope-destination',className:'input','aria-label':'Choose where to go'});
 const count=element('span',{id:'worldscope-destination-count',className:'small'},'Loading destinations…');
 const wrap=element('div',{className:'worldscope-dest-picker'});
 wrap.append(park,search,sel,count);
 parent.insertBefore(wrap,target);
 target.textContent='Or choose any destination above.';
 park.addEventListener('change',()=>{routePark=park.value;populateDestinations()});
 search.addEventListener('input',()=>{routeQuery=search.value.trim().toLowerCase();populateDestinations()});
 sel.addEventListener('change',()=>pickDestination(sel.value));
 populateDestinations();
}
const oldOriginOptions=window.initRouteOriginOptions;
if(typeof oldOriginOptions==='function')window.initRouteOriginOptions=function(){oldOriginOptions();populateDestinations()};
const oldSetDestination=window.setRouteDestination;
if(typeof oldSetDestination==='function')window.setRouteDestination=function(e,lon,lat,source){
 oldSetDestination(e,lon,lat,source);
 const sel=$('worldscope-destination');if(sel){
  const id=String(e?.id??(typeof activeEntry!=='undefined'?activeEntry?.id:''));
  if([...sel.options].some(o=>o.value===id))sel.value=id;
 }
};
// ---------------- Map modes and genuinely independent 3D switch ----------------
const OPENFREE='https://tiles.openfreemap.org/planet';
const esri='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const usgs='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}';
const esriCredit='Imagery © Esri, Vantor, Earthstar Geographics and the GIS User Community';
let buildingsEnabled=true;
let mapHooked=null;
let mapStyleError=false;
function aerialStyle(mode){
 const high=mode==='hd';
 return {version:8,name:high?'Esri World Imagery':'USGS Aerial',sources:{
  aerial:{type:'raster',tiles:[high?esri:usgs],tileSize:256,maxzoom:high?20:16,attribution:high?esriCredit:'Aerial imagery © USGS / The National Map'}
 },layers:[{id:'worldscope-aerial-background',type:'raster',source:'aerial',paint:{'raster-opacity':1}}]};
}
function update3dUI(){
 const b=$('buildingtoggle');if(b){
  b.textContent=buildingsEnabled?'▧ 3D buildings: ON':'▤ 3D buildings: OFF';
  b.setAttribute('aria-pressed',String(buildingsEnabled));
 }
 const pitch=$('pitchtoggle');if(pitch)pitch.textContent=buildingsEnabled?'◆ 3D ON':'▤ 2D';
 const credit=$('mapmodecredit');
 if(credit)credit.textContent=mapMode==='hd'?esriCredit+' · date varies':mapMode==='satellite'?'Aerial imagery © USGS · resolution limited':'© OpenStreetMap contributors · OpenFreeMap';
 document.querySelectorAll('.map-modes [data-mode]').forEach(b=>{
  const active=b.dataset.mode===mapMode;
  b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));
 });
}
function ensure3dBuildings(){
 if(!map||!map.isStyleLoaded?.())return false;
 try{
  const existing=map.getLayer('worldscope-v17-buildings');
  if(!buildingsEnabled){if(existing)map.setLayoutProperty('worldscope-v17-buildings','visibility','none');return true}
  if(existing){map.setLayoutProperty('worldscope-v17-buildings','visibility','visible');return true}
  const style=map.getStyle();
  const styleSrc=style.sources?.openmaptiles?'openmaptiles':style.sources?.openfreemap?'openfreemap':null;
  let vectorSource=styleSrc;
  if(!vectorSource){
   vectorSource='worldscope-v17-vector';
   if(!map.getSource(vectorSource))map.addSource(vectorSource,{type:'vector',url:OPENFREE});
  }
  const firstSymbol=style.layers.find(l=>l.type==='symbol')?.id;
  const layer={id:'worldscope-v17-buildings',type:'fill-extrusion',source:vectorSource,'source-layer':'building',minzoom:14,
   paint:{'fill-extrusion-color':mapMode==='color'||mapMode==='color3d'?'#9eb5c7':'#a7c2d2',
    'fill-extrusion-height':['coalesce',['get','render_height'],9],
    'fill-extrusion-base':['coalesce',['get','render_min_height'],0],
    'fill-extrusion-opacity':mapMode==='color'||mapMode==='color3d'?.82:.66}};
  if(firstSymbol)map.addLayer(layer,firstSymbol);else map.addLayer(layer);
  // Some base maps already contain generic extrusion layers; avoid double-rendering those.
  style.layers.filter(l=>l.type==='fill-extrusion'&&l.id!==layer.id).forEach(l=>{
   try{map.setLayoutProperty(l.id,'visibility','none')}catch{}
  });
  return true;
 }catch(error){console.warn('3D buildings may be unavailable in this map source',error);return false}
}
window.enableBuildings=ensure3dBuildings;
function attachMapHooks(){
 if(!map||map===mapHooked)return;
 mapHooked=map;
 map.on('style.load',()=>{setTimeout(()=>{ensure3dBuildings();update3dUI()},0)});
 map.on('load',()=>{ensure3dBuildings();update3dUI()});
}
const originalInitMap=window.initMap;
if(typeof originalInitMap==='function')window.initMap=function(){
 originalInitMap();attachMapHooks();
 if(map && !map.__worldscopeV17Tilt){map.__worldscopeV17Tilt=true;try{map.jumpTo({pitch:53,bearing:-18})}catch{}}
};
window.setMapMode=function(mode){
 if(!['color','satellite','hd','color3d'].includes(mode))return;
 const prev=mapMode;mapMode=mode;
 if(typeof showLandmarks!=='undefined')showLandmarks=false;
 if(typeof show3dBuildings!=='undefined')show3dBuildings=buildingsEnabled;
 if(typeof pitch3d!=='undefined')pitch3d=buildingsEnabled;
 update3dUI();
 if(!map){initMap();return}
 if(prev!==mode){
  const style=mode==='satellite'||mode==='hd'?aerialStyle(mode):'https://tiles.openfreemap.org/styles/bright';
  try{map.setStyle(style);mapStyleError=false;mapStatus(mode==='hd'?'Higher-resolution aerial imagery; image date varies by location.':'Map appearance updated. Building models are geographic footprints.')}
  catch(err){mapStyleError=true;console.warn('Map style failed',err);mapStatus('Map imagery unavailable. Try Color or USGS satellite.')}
 }
 try{map.easeTo({pitch:buildingsEnabled?53:0,bearing:buildingsEnabled?-18:0,duration:350})}catch{}
 if(map.isStyleLoaded?.())ensure3dBuildings();
};
window.worldscopeToggleBuildings=function(){
 buildingsEnabled=!buildingsEnabled;
 if(typeof show3dBuildings!=='undefined')show3dBuildings=buildingsEnabled;
 if(typeof pitch3d!=='undefined')pitch3d=buildingsEnabled;
 if(map){ensure3dBuildings();try{map.easeTo({pitch:buildingsEnabled?53:0,bearing:buildingsEnabled?-18:0,duration:400})}catch{}}
 update3dUI();
};
window.changePitch=window.worldscopeToggleBuildings;
window.loadBuildings=window.worldscopeToggleBuildings;
function addModes(){
 const box=$('mapModes');if(!box)return;
 box.replaceChildren();
 [['color','🎨 Color'],['satellite','🛰 USGS'],['hd','📷 HD Aerial']].forEach(([mode,label])=>{
  const b=element('button',{type:'button','data-mode':mode},label);
  b.addEventListener('click',()=>window.setMapMode(mode));
  box.append(b);
 });
 // The 3D toggle is separate from the source of base-map imagery.
 if(typeof mapMode!=='undefined')mapMode='color';
 update3dUI();
}
// ---------------- Family notes: local preview only; future cloud database ----------------
let currentUser='';
let notes=getArray(notesKey).filter(n=>n&&typeof n.text==='string'&&typeof n.author==='string').slice(0,250);
function storedUser(){try{return String(localStorage.getItem(userKey)||'').trim().slice(0,32)}catch{return ''}}
currentUser=storedUser();
function saveUser(name){
 const value=String(name||'').trim().replace(/[<>]/g,'').slice(0,32);
 if(value.length<2||value.length>32){$('worldscope-user-error').textContent='Enter at least two characters.';return false}
 currentUser=value;
 try{localStorage.setItem(userKey,value)}catch{}
 const label=$('worldscope-current-user');if(label)label.textContent=value;
 const modal=$('worldscope-name-dialog');if(modal?.open)modal.close();
 return true;
}
function noteCard(n){
 const card=element('article',{className:'worldscope-note-card'});
 const head=element('div',{className:'worldscope-note-head'});
 head.append(element('strong',{},n.author),element('span',{},new Date(n.createdAt).toLocaleString()));
 card.append(head);
 if(n.place)card.append(element('small',{className:'worldscope-note-place'},n.place));
 card.append(element('p',{},n.text));
 return card;
}
function renderNotes(){
 const list=$('worldscope-notes-list');if(!list)return;
 list.replaceChildren();
 if(!notes.length)list.append(element('p',{className:'small'},'No notes yet. Add the first tip for your family.'));
 notes.slice().reverse().forEach(n=>list.append(noteCard(n)));
 const label=$('worldscope-current-user');if(label)label.textContent=currentUser||'Choose a name';
}
function addNote(){
 const raw=$('worldscope-note-text').value.trim(),place=$('worldscope-note-place').value;
 if(!currentUser){openNameDialog();return}
 if(!raw||raw.length>1200){$('worldscope-note-status').textContent='Write a note of 1–1200 characters.';return}
 const note={id:'n-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),author:currentUser,text:raw,place,createdAt:new Date().toISOString()};
 notes.push(note);notes=notes.slice(-250);
 if(!safeWrite(notesKey,notes)){$('worldscope-note-status').textContent='Could not save locally; check private browsing settings.';return}
 $('worldscope-note-text').value='';$('worldscope-note-status').textContent='Saved on this device. Shared cloud notes are not connected yet.';
 renderNotes();
}
function openNameDialog(){
 const dlg=$('worldscope-name-dialog');if(!dlg)return;
 $('worldscope-name-input').value=currentUser;
 $('worldscope-user-error').textContent='';
 if(typeof dlg.showModal==='function'&&!dlg.open)dlg.showModal();
}
function exportNotes(){
 const blob=new Blob([JSON.stringify({worldscope:'local-notes-v1',notes},null,2)],{type:'application/json'});
 const a=element('a');a.href=URL.createObjectURL(blob);a.download='worldscope-notes-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function addNotesUI(){
 const sidebar=document.querySelector('.sidebar'),main=document.querySelector('.main');
 if(!sidebar||!main||$('notes'))return;
 const nav=element('button',{className:'navbtn','data-view':'notes'});
 nav.innerHTML='<span>✎</span> Family notes';
 const savedNav=sidebar.querySelector('[data-view="saved"]');savedNav?.after(nav);
 const section=element('section',{id:'notes',className:'hidden'});
 section.innerHTML=`<div class="worldscope-notes-wrap"><h2>✧ Family field notes</h2><p class="small">This is a local prototype: notes and usernames stay on each device. <b>They are NOT shared between phones yet.</b> Before publishing to the family site we need a private cloud database and member sign-in.</p><div class="worldscope-note-identity">Writing as <b id="worldscope-current-user">Choose a name</b> <button class="tiny" id="worldscope-name-edit">Change name</button></div><label for="worldscope-note-place" class="small">Where is this tip about?</label><select class="input" id="worldscope-note-place"><option value="">General trip note</option></select><label for="worldscope-note-text" class="small">Leave a tip, memory, or recommendation</label><textarea id="worldscope-note-text" class="input" maxlength="1200" rows="4" placeholder="The hidden detail we spotted at…"></textarea><button class="btn" id="worldscope-note-post">Save note on this device</button><span id="worldscope-note-status" class="small" role="status"></span><div class="sectionhead"><h2>Notes</h2><button class="tiny" id="worldscope-notes-backup">Export backup</button></div><div id="worldscope-notes-list"></div></div>`;
 main.append(section);
 const dialog=element('dialog',{id:'worldscope-name-dialog','aria-label':'Choose a Worldscope display name'});
 dialog.innerHTML=`<form method="dialog" class="worldscope-name-form"><h2>✦ Welcome to Worldscope</h2><p>Choose a display name for your trip notes. Names are not verified identities.</p><label for="worldscope-name-input">Your name</label><input id="worldscope-name-input" class="input" maxlength="32" autocomplete="nickname" placeholder="e.g. Connor" required><span id="worldscope-user-error" class="small" role="status"></span><div class="toolbar"><button class="btn" id="worldscope-name-save" type="button">Save my name</button><button class="tiny" id="worldscope-name-skip" type="button">Maybe later</button></div><small>Preview only: other family members cannot see these notes until cloud sync is enabled.</small></form>`;
 document.body.append(dialog);
 nav.addEventListener('click',()=>{
  if(window.WorldscopeExplore)window.WorldscopeExplore.exit();
  document.querySelectorAll('main>section').forEach(x=>x.classList.toggle('hidden',x.id!=='notes'));
  document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('active',x.dataset.view==='notes'));
  $('title').textContent='Family field notes.';$('subtitle').textContent='Save tips and discoveries during your trip.';
  renderNotes();window.scrollTo({top:0,behavior:'instant'});
 });
 $('worldscope-name-edit').addEventListener('click',openNameDialog);
 $('worldscope-name-save').addEventListener('click',()=>saveUser($('worldscope-name-input').value));
 $('worldscope-name-skip').addEventListener('click',()=>dialog.close());
 $('worldscope-note-post').addEventListener('click',addNote);
 $('worldscope-notes-backup').addEventListener('click',exportNotes);
 populateNotePlaces();renderNotes();
 if(!currentUser)setTimeout(openNameDialog,700);
}
function populateNotePlaces(){
 const sel=$('worldscope-note-place');if(!sel)return;
 const list=(typeof items!=='undefined'?items:[]).filter(e=>e&&e.name);
 const limited=list.slice().sort((a,b)=>a.park.localeCompare(b.park)||a.name.localeCompare(b.name));
 sel.replaceChildren(new Option('General trip note',''));
 limited.forEach(e=>sel.add(new Option(e.park+' · '+e.name,e.park+' · '+e.name)));
}
function ready(){addPicker();addModes();addNotesUI();populateDestinations();populateNotePlaces();if(typeof items!=='undefined'&&items.length&&window.WorldscopeExplore?.renderSearch)window.WorldscopeExplore.renderSearch()}
document.addEventListener('DOMContentLoaded',ready,{once:true});
window.addEventListener('worldscope-ready',ready);
if(document.readyState!=='loading')ready();
window.WorldscopeV17={refresh:ready,chooseDestination:pickDestination};
})();