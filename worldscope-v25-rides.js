/* Worldscope v2.5 — lightweight original 3D ride-model collection.
   Every ride gets a inspectable concept mesh; georeferenced map placement ONLY when
   the directory contains valid coordinates. Not an official or exact model. */
(function(){
'use strict';
const ID='worldscope-v25-rides', S='worldscope-v25-ride-studio';
const el=id=>document.getElementById(id);
const C={stone:[.71,.72,.75],cream:[.93,.85,.70],roof:[.37,.55,.77],navy:[.13,.23,.35],gold:[.99,.76,.34],red:[.78,.36,.35],green:[.33,.64,.46],teal:[.28,.81,.81],purple:[.67,.48,.78],water:[.26,.56,.80],earth:[.60,.44,.34],white:[.93,.95,.96]};
const existingNames=new Set(['TRON Lightcycle / Run','Space Mountain','Spaceship Earth','Tower of Terror']);
let catalog=[],mapRef=null,enabled=false,layer=null,viewer=null,modelCount=0,drawCount=0;
const valid=e=>Number.isFinite(e?.lon)&&Number.isFinite(e?.lat)&&e.lon>-81.625&&e.lon<-81.49&&e.lat>28.33&&e.lat<28.45;
function modelType(name,category){
 const n=name.toLowerCase();
 if(category==='Shops'){
  if(/emporium|jewel|bakery|clothier|hollywood|keystone|mickey|celebrity|crystal arts/.test(n))return 'victorian';
  if(/mitsukoshi|japan|tea caddy|fjording|kringle|house of good fortune/.test(n))return 'pagoda';
  if(/market|souk|al-magr|bazaar|spice|trading|plaza|pirate|ronto/.test(n))return 'bazaar';
  if(/creation|world of disney|droid|star traders|gateway|xandar|tomorrowland/.test(n))return 'modern';
  return 'storefront';
 }
 if(/railroad|wildlife express|runaway railway/.test(n))return 'rail';
 if(/seven dwarfs|big thunder|slinky dog|barnstormer|expedition everest|rock ’n’ roller/.test(n))return 'coaster';
 if(/guardians|space|test track|peoplemover|buzz lightyear|imagination/.test(n))return 'future';
 if(/star wars|millennium falcon|avatar flight/.test(n))return 'ship';
 if(/pirates|kali river|na’vi|gran fiesta|living with the land|journey of water/.test(n))return 'water';
 if(/dumbo|tea party|magic carpets|alien swirling/.test(n))return 'spinner';
 if(/safaris|jungle cruise|dinoland|dinosaur/.test(n))return 'wild';
 if(/frozen|remy|small world|peter pan|haunted mansion|under the sea|winnie the pooh|toy story|soarin|nemo/.test(n))return 'story';
 return 'pavilion';
}
function getItems(){return (typeof items!=='undefined'&&Array.isArray(items)?items:[]).filter(e=>e.category==='Rides'||e.category==='Shops')}
function refreshCatalog(){
 const old=el('ws25-ride-choice')?.value;
 catalog=[{id:'ws29-castle',name:'Cinderella Castle',park:'Magic Kingdom',lat:28.4195,lon:-81.5812,type:'castle',category:'Landmarks',mapped:true,duplicate:true},...getItems().map(e=>({id:String(e.id),name:e.name,park:e.park,lat:e.lat,lon:e.lon,type:modelType(e.name,e.category),category:e.category,mapped:valid(e),duplicate:existingNames.has(e.name)}))];
 const select=el('ws25-ride-choice');
 if(select){select.replaceChildren();for(const r of catalog){const o=document.createElement('option');o.value=r.id;o.textContent=r.name+(r.mapped?' · Map placed':' · Preview only');select.append(o)}if(catalog.some(x=>x.id===old))select.value=old;}
 const count=el('ws25-model-count');if(count)count.textContent=`${catalog.filter(x=>x.category==="Rides").length} rides + ${catalog.filter(x=>x.category==="Shops").length} shops · ${catalog.filter(x=>x.mapped).length} located`;
 updatePicked();return catalog;
}
function palette(seed){const h=Array.from(String(seed)).reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),7);
 const arr=[C.roof,C.teal,C.red,C.purple,C.gold,C.green];return {a:arr[h%arr.length],b:arr[Math.floor(h/7)%arr.length],h};}
function buildRide(type,seed){
 const name=String(seed).toLowerCase();
 const landmark=/cinderella castle/.test(name)?'castle':/spaceship earth/.test(name)?'sphere':/space mountain/.test(name)?'space':/tron lightcycle/.test(name)?'tron':/tower of terror/.test(name)?'tower':/tree of life/.test(name)?'tree':null;
 if(landmark&&window.WorldscopeV22?.build){const m=window.WorldscopeV22.build(landmark);return {...m,type,seed,detail:'landmark'};}
 const vertices=[],indices=[];const pal=palette(seed);
 const add=(x,y,z,n,c)=>{const id=vertices.length/9;vertices.push(x,y,z,...n,...c);return id};
 const quad=(a,b,c,d)=>{indices.push(a,b,c,a,c,d)};
 const norm=(x,y,z)=>{const l=Math.hypot(x,y,z)||1;return [x/l,y/l,z/l]};
 function box(cx,cy,z,w,d,h,col){const x=cx-w/2,y=cy-d/2;
  const v=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
  for(const [f,n] of [[[0,3,2,1],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,1,5,4],[0,-1,0]],[[1,2,6,5],[1,0,0]],[[2,3,7,6],[0,1,0]],[[3,0,4,7],[-1,0,0]]])quad(...f.map(i=>add(...v[i],n,col)));
 }
 function cone(cx,cy,z,r0,r1,h,col,steps=16){for(let i=0;i<steps;i++){
  const a=i*Math.PI*2/steps,b=(i+1)*Math.PI*2/steps,n=norm(Math.cos((a+b)/2),Math.sin((a+b)/2),(r0-r1)/(h||1));
  quad(add(cx+r0*Math.cos(a),cy+r0*Math.sin(a),z,n,col),add(cx+r0*Math.cos(b),cy+r0*Math.sin(b),z,n,col),add(cx+r1*Math.cos(b),cy+r1*Math.sin(b),z+h,n,col),add(cx+r1*Math.cos(a),cy+r1*Math.sin(a),z+h,n,col));
 }}
 function sphere(cx,cy,cz,r,col,stacks=11,steps=18,sx=1,sy=1,sz=1){for(let i=0;i<stacks;i++)for(let j=0;j<steps;j++){
  const a=i*Math.PI/stacks,b=(i+1)*Math.PI/stacks,c=j*Math.PI*2/steps,d=(j+1)*Math.PI*2/steps;
  function p(t,p){const n=[Math.sin(t)*Math.cos(p),Math.sin(t)*Math.sin(p),Math.cos(t)];return add(cx+n[0]*r*sx,cy+n[1]*r*sy,cz+n[2]*r*sz,n,col)}
  quad(p(a,c),p(b,c),p(b,d),p(a,d));}}
 function rod(x,y,z,X,Y,Z,r,col,steps=7){const dx=X-x,dy=Y-y,dz=Z-z,LL=Math.hypot(dx,dy,dz)||1;
  let nx=-dy/LL,ny=dx/LL,nz=0;let l=Math.hypot(nx,ny,nz);if(l<.1){nx=1;ny=0;nz=0}else{nx/=l;ny/=l};
  const bx=(dy/LL)*nz-(dz/LL)*ny,by=(dz/LL)*nx-(dx/LL)*nz,bz=(dx/LL)*ny-(dy/LL)*nx;
  for(let i=0;i<steps;i++){const a=i*2*Math.PI/steps,b=(i+1)*2*Math.PI/steps;
   const p=(X,Y,Z,t)=>{const vx=Math.cos(t)*nx+Math.sin(t)*bx,vy=Math.cos(t)*ny+Math.sin(t)*by,vz=Math.cos(t)*nz+Math.sin(t)*bz;return add(X+vx*r,Y+vy*r,Z+vz*r,[vx,vy,vz],col)};
   quad(p(x,y,z,a),p(x,y,z,b),p(X,Y,Z,b),p(X,Y,Z,a));}}
 function roof(cx,cy,z,w,d,height,shade){box(cx,cy,z,w,d,.45,shade);gable(cx,cy,z+.45,w,d,height,shade)}
 function foliage(x,y,z,r){sphere(x,y,z,r,C.green,9,13,1,1,.78);cone(x,y,z-r*1.1,1.6,1.1,r*1.1,C.earth)}
 // Named attractions use distinct reference-inspired silhouettes and facade details.
 const brick=[.63,.42,.32],ivory=[.95,.87,.72],glass=[.10,.19,.28],rust=[.71,.36,.20],snow=[.94,.96,.98],steel=[.53,.60,.65];
 function bands(x,y,z,w,d,h,co){for(let k=0;k<h;k+=2.1)box(x,y,z+k,w+.13,d+.13,.12,co)}
 function facade(x,y,z,w,h,n=7,co=ivory){for(let i=0;i<n;i++){const X=x-w/2+(i+.5)*w/n;for(let k=2;k<h-2;k+=4){box(X,y,z+k,Math.min(2,w/n*.65),.22,2.6,glass);box(X,y-.19,z+k+2.5,Math.min(2.4,w/n*.8),.38,.24,co);box(X,y-.22,z+k+1.2,.10,.26,2.4,co)}}}
 function gable(x,y,z,w,d,h,c){const p=[[-w/2,-d/2,0],[w/2,-d/2,0],[w/2,d/2,0],[-w/2,d/2,0],[0,-d/2,h],[0,d/2,h]].map(q=>[q[0]+x,q[1]+y,q[2]+z]);for(const ids of [[0,4,5,3],[1,2,5,4],[0,1,4,4],[3,5,2,2]]){const a=p[ids[0]],b=p[ids[1]],d0=p[ids[2]],n=norm((b[1]-a[1])*(d0[2]-a[2])-(b[2]-a[2])*(d0[1]-a[1]),(b[2]-a[2])*(d0[0]-a[0])-(b[0]-a[0])*(d0[2]-a[2]),(b[0]-a[0])*(d0[1]-a[1])-(b[1]-a[1])*(d0[0]-a[0]));quad(...ids.map(i=>add(...p[i],n,c)))}}
 function rock(x,y,z,r,h,co,seed=0){const sides=19,levels=8;const at=(j,i)=>{const a=i*2*Math.PI/sides, t=j/levels, rr=r*(1-.83*t)*(.86+.14*Math.sin(i*2.9+j*.8+seed)+.07*Math.cos(i*4.7+j));return [x+rr*Math.cos(a)+t*r*.19,y+rr*Math.sin(a),z+h*t+(j===0?0:Math.sin(i*2.3+j)*r*.08)]};for(let j=0;j<levels;j++)for(let i=0;i<sides;i++){const pts=[at(j,i),at(j,(i+1)%sides),at(j+1,(i+1)%sides),at(j+1,i)];const c=co.map(v=>Math.min(1,v*(.8+.17*Math.sin(i*2.7+j)+.15)));quad(...pts.map(p=>add(...p,norm(p[0]-x,p[1]-y,.4),c)))}}
 function track(fn,c=C.red,n=84){let prev;for(let i=0;i<=n;i++){const p=fn(i/n);if(prev){for(const y of [-.72,.72])rod(prev[0],prev[1]+y,prev[2],p[0],p[1]+y,p[2],.19,c,8);if(i%3===0)rod(p[0],p[1]-.85,p[2],p[0],p[1]+.85,p[2],.17,steel,6)}if(i%7===0){rod(p[0],p[1],1,...p,.28,steel,8)}prev=p}}
 let bespoke=true;
 if(/haunted mansion/.test(name)){
  box(0,0,0,38,26,16,brick);bands(0,0,0,38,26,16,C.stone);box(0,0,16,36,24,2,ivory);gable(0,0,18,38,27,8,C.navy);facade(0,-13.2,0,34,16,7);
  box(-11,-3,16,12,13,13,brick);gable(-11,-3,29,13,14,7,C.navy);facade(-11,-9.6,16,11,13,3);
  box(11,5,16,10,12,9,brick);gable(11,5,25,11,13,6,C.navy);
  for(const x of [-17,-10,10,17]){box(x,8,19,2.8,3,9,brick);box(x,8,28,3.5,3.6,.65,ivory)}
  box(0,-15,0,9,5,9,ivory);box(0,-18,0,5,.3,7,glass);gable(0,-15,9,10,5,5,C.navy);
 }else if(/expedition everest|big thunder|seven dwarfs/.test(name)){
  const ever=/everest/.test(name),mine=/seven dwarfs/.test(name),c=ever?[.49,.49,.47]:mine?[.52,.48,.34]:rust;
  box(0,0,0,55,41,1.2,C.earth);for(let i=0;i<10;i++){const a=i*2.4,r=7+(i%3)*3,h=(ever?20:12)+(i%4)*4;rock(Math.cos(a)*17,Math.sin(a)*12,1,r,h,c,i);if(ever)rock(Math.cos(a)*17+1,Math.sin(a)*12,h*.70,r*.55,h*.36,snow,i)}
  track(t=>[26*Math.cos(t*2*Math.PI),17*Math.sin(t*2*Math.PI),5+(ever?13:8)*Math.pow(Math.sin(t*Math.PI),2)+3*Math.sin(t*6*Math.PI)**2],mine?C.earth:C.red,112);
  box(-16,-16,1,13,8,6,brick);gable(-16,-16,7,14,9,4,C.navy);
 }else if(/slinky dog|barnstormer/.test(name)){
  box(0,0,0,54,36,1,C.green);
  track(t=>[27*Math.cos(2*Math.PI*t),15*Math.sin(4*Math.PI*t),5+10*Math.sin(3*Math.PI*t)**2],C.red,128);
  for(let i=0;i<6;i++){const x=-16+i*5;box(x,0,6,4,3,2,C.gold);for(const y of [-1.5,1.5])sphere(x,y,6,.8,C.navy,7,10)}
  sphere(-19,0,9,3,C.earth,16,24,1.2,.75,1);box(17,-10,1,13,9,8,C.cream);gable(17,-10,9,14,10,4,C.roof);
 }else if(/guardians of the galaxy/.test(name)){
  box(0,7,0,59,39,21,[.32,.38,.46]);box(0,-13,0,32,20,14,steel);box(0,-13,14,35,22,1.2,C.white);for(let i=0;i<12;i++){box(-27+i*5, -12,0,.5,.5,21,C.navy);box(-27+i*5,26,0,.5,.5,21,C.navy)}
  for(const side of [-1,1]){box(side*10,-20,4,8,4,9,glass);rod(side*16,-24,1,side*10,-8,15,.75,C.teal,12);box(side*14,-16,12,4,17,1,C.white)}box(0,-24,1,10,.7,8,glass);
 }else if(/pirates of the caribbean/.test(name)){
  box(0,2,0,44,30,12,ivory);bands(0,2,0,44,30,12,brick);for(const x of [-18,-9,0,9,18]){box(x,-13.4,1,4,.3,6,glass);for(let i=0;i<14;i++){const a=i*Math.PI/14,b=(i+1)*Math.PI/14;rod(x+2*Math.cos(a),-13.7,7+2*Math.sin(a),x+2*Math.cos(b),-13.7,7+2*Math.sin(b),.19,brick,6)}box(x,-13,12,3,3,2,ivory)}
  for(const x of [-17,17]){box(x,6,12,9,10,10,ivory);gable(x,6,22,10,11,5,rust)}box(0,-17,0,12,7,7,brick);
 }else if(/millennium falcon|rise of the resistance/.test(name)){
  box(0,0,0,47,35,7,steel);for(let i=0;i<8;i++)rock(-24+i*7,15,3,6,11+(i%4)*4,[.48,.45,.41],i);
  if(/falcon/.test(name)){sphere(0,-4,10,15,steel,22,48,1,1,.20);for(const x of [-6,6])box(x,-17,9,6,14,3,steel);rod(12,-3,11,21,-9,11,2.5,steel,18);box(20,-10,10,7,5,3,glass);for(let i=0;i<16;i++){const a=i*Math.PI/8;rod(5*Math.cos(a),-4+5*Math.sin(a),13,13*Math.cos(a),-4+13*Math.sin(a),11.8,.20,C.navy,6)}}
  else {box(0,-8,7,27,18,13,steel);facade(0,-17.1,7,26,13,5);for(const x of [-11,11])rod(x,-20,2,x,-8,21,.6,C.navy)}
 }else if(/runaway railway/.test(name)){
  box(0,2,0,37,26,14,[.87,.65,.45]);box(0,-4,14,27,17,6,ivory);gable(0,-4,20,28,18,8,C.green);
  for(const x of [-15,15]){box(x,-5,0,8,15,19,brick);gable(x,-5,19,9,16,7,C.green);facade(x,-12.7,0,7,18,2)}
  facade(0,-9.2,0,22,14,5);box(0,-14,0,9,5,7,glass);box(0,-15,8,18,4,1.5,C.gold);
 }else if(/small world|peter pan|frozen|remy/.test(name)){
  const frozen=/frozen/.test(name),remy=/remy/.test(name),small=/small world/.test(name),co=small?C.white:frozen?ivory:remy?[.83,.72,.63]:[.82,.64,.43];box(0,0,0,42,27,12,co);
  for(let i=0;i<7;i++){const x=-18+i*6,h=10+(i%3)*5;box(x,-9,0,5.5,9,h,co);facade(x,-13.7,0,5,h,2);if(small){cone(x,-9,h,3.2,.2,6,i%2?C.gold:C.white,12)}else{gable(x,-9,h,6.1,10,6,frozen?C.navy:remy?steel:C.red)}}
  if(small){box(0,-10,12,9,3,12,C.white);sphere(0,-12,20,3,C.gold,12,24,1,.2,1);rod(0,-12.7,20,0,-12.7,22,.13,C.navy)}
 }else if(/avatar flight|na.vi river/.test(name)){
  box(0,0,0,46,32,2,C.green);for(let i=0;i<7;i++){const a=i*2.4;rock(17*Math.cos(a),11*Math.sin(a),2,8+(i%3),15+(i%4)*4,[.38,.41,.35],i);foliage(16*Math.cos(a),12*Math.sin(a),10+(i%4)*3,4)}
  for(let i=0;i<5;i++){const x=-18+i*8;rock(x,4,24+(i%2)*4,5,8,[.42,.40,.34],i);rod(x,4,24,x+2,2,9,.3,C.green,7)}
 }else bespoke=false;
 if(bespoke){if(vertices.length/9>=65535)throw Error('Detailed ride vertex limit');return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices),type,seed,detail:'named'};}
 const v=(pal.h%5)*.5, a=pal.a,b=pal.b;
 switch(type){
  case 'coaster':{
   box(0,0,0,40,30,5,C.stone);box(-14,-6,5,12,13,9,C.earth);roof(-14,-6,14,13,14,8,C.roof);
   for(let i=0;i<=22;i++){
    const t=i/22,x=-23+t*46,y=Math.sin(t*2.3*Math.PI)*12,z=8+16*Math.sin(t*2*Math.PI)**2+4*Math.cos(t*5*Math.PI)**2;
    if(i){const p=(i-1)/22,px=-23+p*46,py=Math.sin(p*2.3*Math.PI)*12,pz=8+16*Math.sin(p*2*Math.PI)**2+4*Math.cos(p*5*Math.PI)**2;
     rod(px,py-1.2,pz,x,y-1.2,z,.44,C.gold);rod(px,py+1.2,pz,x,y+1.2,z,.44,C.teal);}
    if(i%3===0)rod(x,y,z,x,y,3,.4,C.stone);
   }for(let i=0;i<4;i++)cone(-10+i*7,9,5,5.5,0,9+(i*3)%11,C.earth,9);
   break;
  }
  case 'future':{
   box(0,0,0,42,34,7,C.navy);box(0,0,7,31,26,14,C.stone);
   sphere(0,0,24,17,a,15,28,1.1,.9,.56);
   for(let i=0;i<12;i++){const t=i/12*2*Math.PI;rod(Math.cos(t)*22,Math.sin(t)*22,7,Math.cos(t)*13,Math.sin(t)*13,27,.65,C.teal)}
   cone(0,0,26,6,0,16,C.white,20);break;
  }
  case 'water':{
   box(0,0,0,48,36,2,C.green);box(0,0,2,39,27,1,C.water);
   for(let i=0;i<17;i++){const t=i/16,x=-22+44*t,y=8*Math.sin(t*3*Math.PI);
    if(i>0){const p=(i-1)/16;rod(-22+44*p,8*Math.sin(p*3*Math.PI),3,x,y,3,3.7,C.teal,7)}}
   box(-17,-11,2,13,11,15,C.earth);roof(-17,-11,17,13,11,7,a);
   for(const [x,y] of [[18,9],[13,-12],[-4,-14]])foliage(x,y,16,8);
   break;
  }
  case 'spinner':{
   cone(0,0,0,29,29,3,C.stone);cone(0,0,3,6,3,15,C.gold);sphere(0,0,20,8,a,11,18,1,1,.4);
   for(let i=0;i<9;i++){const t=i*2*Math.PI/9,x=Math.cos(t)*21,y=Math.sin(t)*21;
    rod(0,0,18,x,y,8,.5,C.teal);sphere(x,y,7,4,i%2?a:b,10,12,1.3,.9,.65);}
   break;
  }
  case 'rail':{
   box(0,0,0,52,20,4,C.earth);
   for(const y of [-8,8])for(let i=0;i<15;i++)box(-24+i*3.3,y,3,2,1,1.3,C.stone);
   for(const y of [-8,8])rod(-27,y,5,27,y,5,.65,C.white);
   box(-8,0,5,20,13,12,a);box(11,0,5,14,13,11,C.red);
   for(const x of [-15,-9,-3,6,15])for(const y of [-7,7])sphere(x,y,7,3,C.navy,9,12,1,.45,1);
   cone(1,0,17,3.8,2.6,7,C.gold);break;
  }
  case 'ship':{
   box(0,0,0,43,32,9,C.stone);box(0,0,9,23,23,8,C.navy);
   for(const sign of [-1,1]){box(sign*19,0,12,18,9,4,a);rod(sign*27,0,14,sign*8,0,23,1,C.teal);}
   sphere(0,0,24,12,b,12,16,1.4,1,.38);cone(0,0,30,2,.3,11,C.white);
   break;
  }
  case 'wild':{
   box(0,0,0,44,31,2,C.green);
   for(const [x,y,r] of [[-14,11,10],[12,-10,8],[-15,-9,6],[18,9,9]])foliage(x,y,15,r);
   box(0,0,2,18,12,7,C.earth);roof(0,0,9,19,13,8,a);
   for(let i=0;i<8;i++){const x=-18+i*5;box(x,-15,0,3,2,4,C.stone)}break;
  }
  case 'victorian':{
   // Layered Victorian-era Main Street shop facade, illustrative rather than surveyed.
   box(0,0,0,35,21,11,C.cream);box(0,2,11,34,18,13,C.cream);
   box(0,0,24,36,23,2,a);roof(0,0,26,36,24,8,b);
   for(const x of [-13,-7,-1,5,11]){
    box(x,-11,2,4,1,7,C.navy);box(x,-11,13,4,1,7,C.navy);
    box(x,-11.7,9,5,2,1,C.gold);box(x,-12,20,5,2,1,C.gold);
    rod(x-2.6,-12,22,x+2.6,-12,22,.25,C.white);
   }
   box(0,-13,1,9,1,10,C.red);box(0,-12.4,11,33,3,2,a);
   for(const x of [-14,-6,2,10])box(x,-13.2,30,2,1,2,C.gold);
   break;
  }
  case 'pagoda':{
   box(0,0,0,37,28,9,C.earth);box(0,0,9,31,24,12,C.cream);
   for(let i=0;i<3;i++){
    const w=40-i*8,d=31-i*6,z=9+i*9;
    box(0,0,z,w,d,2,C.red);
    cone(0,0,z+2,Math.max(w,d)*.57,Math.max(w,d)*.37,6,C.roof,4);
   }
   for(const x of [-13,-6,1,8,15])for(const z of [2,11])box(x,-14.7,z,3,1,6,C.navy);
   cone(0,0,41,3,0,7,C.gold,12);break;
  }
  case 'bazaar':{
   box(0,0,0,42,29,11,C.earth);box(-12,2,11,16,21,8,C.cream);box(9,2,11,20,21,11,C.cream);
   for(let i=0;i<7;i++){const x=-18+i*6;box(x,-15,0,4,1,9,C.navy);box(x,-17,10,5,3,2,i%2?a:b)}
   cone(-11,1,20,9,0,10,C.gold,16);cone(10,1,22,9,0,13,C.red,16);
   for(const x of [-23,23])cone(x,8,0,3,2,19,C.stone,12);
   break;
  }
  case 'modern':{
   box(0,0,0,44,31,9,C.stone);box(0,0,9,37,25,14,C.white);
   box(0,-14,2,35,2,14,C.navy);box(0,0,24,44,34,4,a);
   for(let x=-17;x<=17;x+=7)box(x,-16,1,1,2,21,C.teal);
   for(let i=0;i<7;i++)rod(-22+i*7,-16,28,-18+i*6,-12,31,.45,C.gold);
   break;
  }
  case 'storefront':{
   box(0,0,0,38,26,11,C.earth);box(0,0,11,33,25,12,C.cream);
   roof(0,0,23,37,29,11,a);
   for(let i=-2;i<=2;i++){box(i*6,-13.5,3,4,1,7,C.navy);box(i*6,-14,10,5,2,1,b)}
   box(0,-15.2,12,24,2,3,C.gold);for(const x of [-14,14])cone(x,-8,0,2,1,21,C.stone);
   break;
  }
  case 'story':{
   box(0,0,0,46,30,6,C.stone);
   box(-11,0,6,20,27,15,C.cream);box(11,0,6,20,27,12,C.cream);
   roof(-11,0,21,22,28,12,a);roof(11,0,18,22,28,11,b);
   for(const x of [-17,-11,-5,5,11,17])for(const z of [9,15])box(x,-15.6,z,2.5,.8,4,C.navy);
   cone(-20,9,7,4,3,23,b);cone(-20,9,30,5,.2,9,C.gold);break;
  }
  default:{
   box(0,0,0,41,31,7,C.stone);
   box(0,0,7,28,23,18,C.cream);roof(0,0,25,29,24,10,a);
   for(let i=0;i<7;i++)box(-17+i*5.4,-16,7,3,.6,9,C.navy);
   cone(0,0,25,6,2,9,b);break;
  }
 }
 if(vertices.length/9>=65535)throw Error('Ride mesh exceeds the mobile 16-bit vertex limit');
 return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices),type,seed};
}
const VERTEX='attribute vec3 a_position;attribute vec3 a_normal;attribute vec3 a_color;uniform mat4 u_matrix;varying vec3 v_color;varying vec3 v_normal;void main(){gl_Position=u_matrix*vec4(a_position,1.0);v_color=a_color;v_normal=a_normal;}';
const FRAGMENT='precision mediump float;varying vec3 v_color;varying vec3 v_normal;void main(){vec3 light=normalize(vec3(.35,-.25,.88));float lum=.43+.57*max(dot(normalize(v_normal),light),0.0);gl_FragColor=vec4(v_color*lum,1.0);}';
function shader(gl,type,src){const v=gl.createShader(type);gl.shaderSource(v,src);gl.compileShader(v);if(!gl.getShaderParameter(v,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(v));return v}
function renderProgram(gl){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VERTEX),f=shader(gl,gl.FRAGMENT_SHADER,FRAGMENT);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.deleteShader(v);gl.deleteShader(f);return {program:p,pos:gl.getAttribLocation(p,'a_position'),norm:gl.getAttribLocation(p,'a_normal'),col:gl.getAttribLocation(p,'a_color'),matrix:gl.getUniformLocation(p,'u_matrix')}}
function storeMesh(gl,mesh){const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);return {vb,ib,indices:mesh.indices.length}}
function paintMesh(gl,p,matrix,model){gl.useProgram(p.program);gl.uniformMatrix4fv(p.matrix,false,new Float32Array(matrix));gl.bindBuffer(gl.ARRAY_BUFFER,model.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.ib);for(const [loc,off] of [[p.pos,0],[p.norm,12],[p.col,24]])if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,off)}gl.drawElements(gl.TRIANGLES,model.indices,gl.UNSIGNED_SHORT,0)}
function cleanMesh(gl,m){gl.deleteBuffer(m.vb);gl.deleteBuffer(m.ib)}
function mul(A,B){const o=new Float64Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)o[j*4+i]+=Number(A[k*4+i])*Number(B[j*4+k]);return o}
function modelAt(item){const m=maplibregl.MercatorCoordinate.fromLngLat([item.lon,item.lat],0),s=m.meterInMercatorCoordinateUnits();return new Float64Array([s,0,0,0,0,-s,0,0,0,0,s,0,m.x,m.y,m.z,1])}
function createRideLayer(){return{id:ID,type:'custom',renderingMode:'3d',onAdd(map,gl){
 this.map=map;this.p=renderProgram(gl);this.models=[];
 for(const ride of catalog.filter(x=>x.mapped&&!x.duplicate)){
  const mesh=buildRide(ride.type,ride.id+':'+ride.name);this.models.push({item:ride,m:modelAt(ride),gpu:storeMesh(gl,mesh)});
 }
 this.renderedFrames=0;
},render(gl,data){if(!this.p||this.map?.getZoom?.()<15.2)return;const vp=Array.isArray(data)||ArrayBuffer.isView(data)?data:data?.defaultProjectionData?.mainMatrix;if(!vp||vp.length!==16)return;
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);
 for(const m of this.models){paintMesh(gl,this.p,mul(vp,m.m),m.gpu)}
 gl.disable(gl.POLYGON_OFFSET_FILL);this.renderedFrames++;drawCount+=this.models.length;
},onRemove(map,gl){for(const r of this.models||[])cleanMesh(gl,r.gpu);if(this.p?.program)gl.deleteProgram(this.p.program);this.p=null;this.models=[];}}}
function removeMapModels(){if(mapRef?.getLayer?.(ID))try{mapRef.removeLayer(ID)}catch(e){console.warn('Ride layer removal',e)}layer=null}
function addMapModels(){if(!enabled||!catalog.length||typeof map==='undefined'||!map?.isStyleLoaded?.())return false;
 if(map.getLayer(ID))return true;
 try{layer=createRideLayer();map.addLayer(layer);modelCount=catalog.filter(x=>x.mapped&&!x.duplicate).length;return true}catch(e){console.warn('Ride model renderer failed',e);return false}
}
function toggle(on){enabled=!!on;if(enabled){attach();addMapModels()}else removeMapModels();purgeGrayExtrusions()}
function purgeGrayExtrusions(){if(typeof map==='undefined'||!map||!map.isStyleLoaded?.())return 0;let removed=0;for(const l of (map.getStyle?.()?.layers||[]).slice()){if(l.type!=='fill-extrusion'||l.id==='worldscope-v26-architecture')continue;try{if(map.getLayer?.(l.id)){map.removeLayer(l.id);removed++}}catch(e){try{map.setLayoutProperty(l.id,'visibility','none')}catch{}}}return removed}
function attach(){if(typeof map==='undefined'||!map||map===mapRef)return;mapRef=map;
 map.on('load',()=>{purgeGrayExtrusions();if(enabled)addMapModels()});map.on('style.load',()=>{purgeGrayExtrusions();if(enabled)addMapModels()});
 map.on('styledata',purgeGrayExtrusions);map.on('idle',purgeGrayExtrusions);
 if(map.isStyleLoaded?.()){purgeGrayExtrusions();if(enabled)addMapModels()}
}
function selected(){return catalog.find(x=>x.id===el('ws25-ride-choice')?.value)||catalog[0]}
function updatePicked(){const r=selected(),status=el('ws25-ride-status');if(!status)return;
 status.textContent=!r?'No directory entries loaded yet.':r.mapped?`${r.park} · Positioned on the map (feature point, not verified entrance).`:`${r.park} · 3D concept preview only. A map location still needs verification.`;
 if(viewer&&r)viewer.setRide(r);
 const fly=el('ws25-ride-fly');if(fly)fly.disabled=!r?.mapped;
}
function lookAt(matrixRot,aspect=1.18){const t=matrixRot;const c=Math.cos(t),s=Math.sin(t);
 // Perspective from a fixed camera above a slowly rotating turntable.
 const rot=new Float64Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);
 const tilt=new Float64Array([1,0,0,0,0,.78,.62,0,0,-.62,.78,0,0,0,0,1]);
 const move=new Float64Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-105,1]);
 const f=1.95,n=.1,far=500;
 const proj=new Float64Array([f/aspect,0,0,0,0,f,0,0,0,0,-(far+n)/(far-n),-1,0,0,-2*far*n/(far-n),0]);
 return mul(proj,mul(move,mul(tilt,rot)));
}
function drawSoftwarePreview(ctx,canvas,mesh,angle){
 const w=canvas.width,h=canvas.height,scale=Math.min(w/90,h/86);
 ctx.fillStyle='#0c2136';ctx.fillRect(0,0,w,h);
 const c=Math.cos(angle),s=Math.sin(angle),v=mesh.vertices,faces=[];
 const project=id=>{
  const n=id*9,x=v[n],y=v[n+1],z=v[n+2];
  const rx=x*c-y*s,ry=x*s+y*c;
  return {x:w/2+rx*scale,y:h*.50+ry*.32*scale-z*.86*scale,depth:ry*.9+z*.2,r:v[n+6],g:v[n+7],b:v[n+8]};
 };
 for(let i=0;i<mesh.indices.length;i+=3){const a=project(mesh.indices[i]),b=project(mesh.indices[i+1]),c=project(mesh.indices[i+2]);
  const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  if(Math.abs(area)<.06)continue;
  const lit=.61+.36*(Math.sin((a.depth+b.depth+c.depth)/50)+1)/2;
  faces.push({a,b,c,depth:(a.depth+b.depth+c.depth)/3,color:`rgb(${Math.min(255,Math.max(0,Math.round(a.r*255*lit)))},${Math.min(255,Math.max(0,Math.round(a.g*255*lit)))},${Math.min(255,Math.max(0,Math.round(a.b*255*lit)))})`});
 }
 faces.sort((a,b)=>b.depth-a.depth);
 for(const f of faces){ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(f.a.x,f.a.y);ctx.lineTo(f.b.x,f.b.y);ctx.lineTo(f.c.x,f.c.y);ctx.closePath();ctx.fill()}
}
function fitGallery(mesh){const v=new Float32Array(mesh.vertices);const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<v.length;i+=9)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],v[i+j]);hi[j]=Math.max(hi[j],v[i+j])}const s=62/Math.max(1,...hi.map((x,j)=>x-lo[j]));for(let i=0;i<v.length;i+=9){v[i]=(v[i]-(lo[0]+hi[0])/2)*s;v[i+1]=(v[i+1]-(lo[1]+hi[1])/2)*s;v[i+2]=(v[i+2]-(lo[2]+hi[2])/2)*s}return {...mesh,vertices:v}}
function createViewer(canvas){let gl=null,ctx=null,p=null,gpu=null,mesh=null,raf=0,angle=0,active=false,stamp=0;
 try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL not supported');p=renderProgram(gl)}
 catch(e){gl=null;ctx=canvas.getContext('2d',{alpha:false});if(!ctx){console.warn('3D viewer disabled',e)}else canvas.setAttribute('aria-label','Rotating software-projected 3D concept; WebGL unavailable')}
 const resize=()=>{const w=Math.max(1,Math.floor(canvas.clientWidth*(Math.min(2,window.devicePixelRatio||1)))),h=Math.max(1,Math.floor(canvas.clientHeight*(Math.min(2,window.devicePixelRatio||1))));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}if(gl)gl.viewport(0,0,w,h)};
 const draw=now=>{if(!active)return;resize();if(gl&&p&&gpu){gl.clearColor(.05,.13,.22,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);paintMesh(gl,p,lookAt(angle,canvas.width/canvas.height),gpu);angle+=.006;}
  else if(ctx&&mesh&&(!stamp||now-stamp>=55)){drawSoftwarePreview(ctx,canvas,mesh,angle);angle+=.028;stamp=now}
  raf=requestAnimationFrame(draw)};
 return {setRide(r){if(!r)return;mesh=fitGallery(buildRide(r.type,r.id+':'+r.name));if(gl&&p){if(gpu)cleanMesh(gl,gpu);gpu=storeMesh(gl,mesh)}angle=.3;stamp=0;if(ctx){resize();drawSoftwarePreview(ctx,canvas,mesh,angle)}},start(){active=true;raf=requestAnimationFrame(draw)},stop(){active=false;cancelAnimationFrame(raf)},dispose(){active=false;cancelAnimationFrame(raf);if(gl&&gpu)cleanMesh(gl,gpu);if(gl&&p)gl.deleteProgram(p.program)},get kind(){return gl?'WebGL':ctx?'software':'unavailable'}};
}
function openStudio(){const container=el(S);if(!container)return;container.hidden=false;
 if(!viewer){const canvas=el('ws25-ride-canvas');viewer=createViewer(canvas);const ride=selected();if(ride)viewer.setRide(ride)}viewer.start();}
function closeStudio(){if(el(S))el(S).hidden=true;viewer?.stop()}
function drawControls(){if(el('ws25-open'))return;const wrap=document.querySelector('#map .mapwrap');if(!wrap)return;
 const open=document.createElement('button');open.type='button';open.id='ws25-open';open.textContent='🏬 3D buildings';open.addEventListener('click',openStudio);wrap.append(open);
 const aside=document.createElement('aside');aside.id=S;aside.hidden=true;aside.setAttribute('role','dialog');aside.setAttribute('aria-label','Experimental 3D ride and shop architecture gallery');
 const title=document.createElement('div');title.className='ws25-title';const h=document.createElement('strong');h.textContent='Ride & Shop Architecture Studio';const x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','Close ride gallery');x.addEventListener('click',closeStudio);title.append(h,x);
 const note=document.createElement('p');note.textContent='Original 3D concept studies, not exact building replicas or navigational entrances. Select a ride or shop to inspect.';
 const count=document.createElement('small');count.id='ws25-model-count';count.textContent='Loading directory…';
 const select=document.createElement('select');select.id='ws25-ride-choice';select.setAttribute('aria-label','Choose a ride or shop to preview');select.addEventListener('change',updatePicked);
 const canvas=document.createElement('canvas');canvas.id='ws25-ride-canvas';canvas.width=350;canvas.height=270;canvas.setAttribute('aria-label','Rotating WebGL model preview');
 const status=document.createElement('p');status.id='ws25-ride-status';const fly=document.createElement('button');fly.type='button';fly.id='ws25-ride-fly';fly.textContent='Show mapped location';fly.addEventListener('click',()=>{const r=selected();if(!r?.mapped)return;closeStudio();if(window.WorldscopeV23?.setMapView)window.WorldscopeV23.setMapView(true);toggle(false);if(typeof map!=='undefined'&&map)map.flyTo({center:[r.lon,r.lat],zoom:18.4,pitch:59,bearing:-18,duration:800})});
 aside.append(title,note,count,select,canvas,status,fly);wrap.append(aside);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!aside.hidden)closeStudio()});
 refreshCatalog();
}
function ready(){drawControls();refreshCatalog();attach();}
function onModeChange(){toggle(false)}
const oldInit=window.initMap;if(typeof oldInit==='function')window.initMap=function(){const x=oldInit();attach();return x};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('worldscope-ready',()=>{ready();if(enabled){removeMapModels();addMapModels()}});
document.addEventListener('click',event=>{if(event.target?.closest?.('#ws23-map2d,#ws23-map3d'))queueMicrotask(onModeChange)});
window.WorldscopeRideAtlas25={buildRide,fitGallery,modelType,refreshCatalog,toggle,createRideLayer,openStudio,closeStudio,get catalog(){return catalog.slice()},purgeGrayExtrusions,get state(){return{total:catalog.length,mapped:catalog.filter(x=>x.mapped).length,additionalMapModels:modelCount,drawCalls:drawCount,active:enabled,viewer:viewer?.kind||null}}};
})();