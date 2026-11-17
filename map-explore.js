/* Worldscope v1.5 – Full-viewport map panels and place search; uses existing map instance */
(function(){
 'use strict';
 const body=document.body;
 const $id=id=>document.getElementById(id);
 const state={immersive:false,left:false,right:false};
 let searchTimer=0;
 function resize(){if(typeof map!=='undefined' && map?.resize)try{map.resize()}catch(e){console.warn(e)}}
 function update(){
   body.classList.toggle('worldscope-immersive',state.immersive);
   body.classList.toggle('worldscope-left-open',state.immersive&&state.left);
   body.classList.toggle('worldscope-right-open',state.immersive&&state.right);
   $id('exploreMenuButton').setAttribute('aria-expanded',String(state.immersive&&state.left));
   $id('exploreDirectionsButton').setAttribute('aria-expanded',String(state.immersive&&state.right));
   resize();setTimeout(resize,250);
 }
 function enter(){ if(typeof go==='function')go('map');state.immersive=true;state.left=false;state.right=false;renderSearch();update(); }
 function exit(){state.immersive=false;state.left=false;state.right=false;update()}
 function toggleLeft(force){if(!state.immersive)enter();state.left=typeof force==='boolean'?force:!state.left;if(state.left)state.right=false;update()}
 function toggleRight(force){if(!state.immersive)enter();state.right=typeof force==='boolean'?force:!state.right;if(state.right)state.left=false;update()}
 function renderSearch(){
   const q=($id('exploreFind').value||'').trim().toLowerCase();
   const park=$id('explorePark').value;
   const source=(typeof items!=='undefined'?items:[]).filter(x=>(!park||x.park===park) && (!q||(`${x.name} ${x.detail||''} ${x.park} ${x.category}`).toLowerCase().includes(q)));
   const top=source.slice(0,60),el=$id('exploreResults');el.replaceChildren();
   const count=document.createElement('div');count.className='small';count.textContent=source.length+' places'+(source.length>60?' · showing first 60':'');el.append(count);
   top.forEach(x=>{
     const b=document.createElement('button');b.type='button';b.className='explore-result';
     b.textContent=x.name;
     const detail=document.createElement('small');detail.textContent=x.park+' · '+x.category+(Number.isFinite(Number(x.lat))&&x.lat!==null?' · mapped':' · lookup');b.append(detail);
     b.addEventListener('click',()=>{
       if(typeof findEntry==='function')findEntry(String(typeof key==='function'?key(x):x.id));
       state.left=false;state.right=true;update();
     });el.append(b);
   });
 }
 const parkSelect=$id('explorePark');const opt=document.createElement('option');opt.value='';opt.textContent='All destinations';parkSelect.append(opt);
 ['Magic Kingdom','EPCOT','Hollywood Studios','Animal Kingdom','Disney Springs','BoardWalk'].forEach(park=>{const o=document.createElement('option');o.value=park;o.textContent=park;parkSelect.append(o)});
 $id('exploreFind').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderSearch,85)});
 parkSelect.addEventListener('change',()=>{renderSearch();if(parkSelect.value && typeof flyPark==='function')flyPark(parkSelect.value)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.immersive)exit()});
 const previousGo=window.go;if(typeof previousGo==='function'){window.go=function(section){if(state.immersive&&section!=='map')exit();return previousGo(section)}}
 window.WorldscopeExplore={enter,exit,toggleLeft,toggleRight,renderSearch};
})();