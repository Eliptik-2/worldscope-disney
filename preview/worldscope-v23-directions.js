/* Worldscope v2.3 — every directory category can be selected as a destination.
   Exact walking guidance is only offered for mapped places with plausible route geometry. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const CATEGORIES=[['all','All places'],['Rides','Rides'],['Food','Food / dining'],['Shops','Shops'],['Alcohol','Bars / drinks'],['Shows','Shows'],['other','Experiences / other']];
const known=new Set(CATEGORIES.map(x=>x[0]).filter(x=>!['all','other'].includes(x)));
let activeType='all',activeEntry=null,lastNotice='';
const entries=()=>typeof items!=='undefined'&&Array.isArray(items)?items:[];
const hasCoord=e=>!!e&&Number.isFinite(e.lat)&&Number.isFinite(e.lon);
const label=e=>e.park+' · '+e.name;
const matchesType=e=>activeType==='all'||(activeType==='other'?!known.has(e.category):e.category===activeType);
function getPicked(){const id=$('worldscope-destination')?.value;const selected=id?entries().find(e=>String(e.id)===String(id)):null;return selected||null}
function createOption(text,value){const o=document.createElement('option');o.value=value;o.textContent=text;return o}
function addTypeFilter(){
 const parent=$('worldscope-destination')?.closest('.worldscope-dest-picker');if(!parent||$('worldscope-v22-category'))return;
 const select=document.createElement('select');select.className='input';select.id='worldscope-v22-category';select.setAttribute('aria-label','Choose destination type');
 CATEGORIES.forEach(([value,text])=>select.append(createOption(text,value)));
 const heading=document.createElement('label');heading.htmlFor=select.id;heading.className='worldscope-v22-label';heading.textContent='DESTINATION TYPE';
 parent.insertBefore(heading,parent.firstChild);parent.insertBefore(select,heading.nextSibling);
 select.addEventListener('change',()=>{activeType=select.value;updateFilter()});
 // v1.7 updates the dropdown whenever the park or query changes. Refine that result afterward.
 for(const id of ['worldscope-destination-search','worldscope-destination-park']){
  const el=$(id);if(el)el.addEventListener(id.endsWith('search')?'input':'change',()=>queueMicrotask(updateFilter));
 }
 $('worldscope-destination')?.addEventListener('change',()=>queueMicrotask(()=>showStatus(getPicked())));
 updateFilter();
}
function updateFilter(){
 const target=$('worldscope-destination');if(!target)return;
 const old=target.value;
 if(typeof window.worldscopeRefreshDestinations==='function')window.worldscopeRefreshDestinations();
 let shown=0;
 for(const option of [...target.querySelectorAll('option')]){
  if(!option.value)continue;
  const e=entries().find(x=>String(x.id)===String(option.value));
  if(e&&!matchesType(e))option.remove();else if(e)shown++;
 }
 for(const group of target.querySelectorAll('optgroup'))if(!group.querySelector('option'))group.remove();
 if([...target.options].some(x=>x.value===old))target.value=old;
 const count=$('worldscope-v22-count');if(count)count.textContent=shown+' matching locations · exact routes require mapped points';
}
function officialUrl(){return 'https://disneyworld.disney.go.com/guest-services/my-disney-experience/mobile-apps/'}
function googleUrl(e){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([e.name,e.park,'Walt Disney World Florida'].join(' '))}
function link(text,url){const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='tiny';return a}
function showStatus(e){
 const box=$('worldscope-v22-route-status');if(!box)return;
 box.replaceChildren();if(!e)return;
 activeEntry=e;
 const title=document.createElement('strong');title.textContent=e.name+' · '+e.park;box.append(title);
 const desc=document.createElement('p');desc.textContent=hasCoord(e)
  ?'Mapped feature selected. Worldscope will attempt pedestrian directions, but the guest entrance and park path are not independently verified.'
  :'Precise coordinates are not yet verified for this location. Worldscope will try a map lookup, but cannot safely draw a walking path until it finds a specific place.';
 box.append(desc);
 const actions=document.createElement('div');actions.className='worldscope-v22-linkrow';
 actions.append(link('Disney app directions',officialUrl()),link('Locate on map',googleUrl(e)));
 box.append(actions);
 if(!hasCoord(e)&&typeof routeMessage==='function')routeMessage('Selected '+e.name+'. Map lookup needed before Worldscope can calculate a route. Use Disney navigation for reliable directions.',true);
 lastNotice=e.name;
}
function initialize(){
 const panel=$('routepanel');if(!panel||$('worldscope-v22-route-status'))return;
 const target=$('routefeedback');
 const box=document.createElement('aside');box.id='worldscope-v22-route-status';box.className='worldscope-v22-route-status';
 const count=document.createElement('div');count.id='worldscope-v22-count';count.className='small';
 if(target){target.before(count);target.before(box)}else{panel.append(count,box)}
 addTypeFilter();showStatus(getPicked());
}
const originalDirections=window.directionsFor;
if(typeof originalDirections==='function')window.directionsFor=function(id){
 const e=entries().find(x=>String(x.id)===String(id));
 const result=originalDirections(id);if(e)showStatus(e);return result;
};
const originalFind=window.findEntry;
if(typeof originalFind==='function')window.findEntry=function(id){
 const e=entries().find(x=>String(x.id)===String(id));
 const result=originalFind(id);if(e)showStatus(e);return result;
};
const originalPlan=window.planRoute;
if(typeof originalPlan==='function')window.planRoute=async function(){
 const selected=getPicked();
 if(selected&&(!routeDestination||routeDestination.name!==selected.name)&&!hasCoord(selected)){
  showStatus(selected);
  if(typeof routeMessage==='function')routeMessage('No verified location for '+selected.name+'. Open Disney directions or wait for a precise map lookup. No straight-line walking route will be drawn.',true);
  return;
 }
 const outcome=await originalPlan();
 if(selected)showStatus(selected);
 return outcome;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
window.addEventListener('worldscope-ready',()=>{initialize();updateFilter()});
window.WorldscopeDirections22={CATEGORIES,refresh:()=>{initialize();updateFilter()},chooseCategory:value=>{activeType=value;if($('worldscope-v22-category'))$('worldscope-v22-category').value=value;updateFilter()},get state(){return{activeType,selected:lastNotice,entries:entries().length}}};
})();