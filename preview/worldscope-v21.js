/* Worldscope v2.1 — tested WebGL landmark meshes; no Three.js dependency.
   Original illustrative geometry, not photorealistic Disney ride models. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const sites=[
{id:'earth',name:'Spaceship Earth',park:'EPCOT',lon:-81.5494,lat:28.37529,type:'sphere'},
{id:'castle',name:'Cinderella Castle',park:'Magic Kingdom',lon:-81.58120,lat:28.41950,type:'castle'},
{id:'space',name:'Space Mountain',park:'Magic Kingdom',lon:-81.57725,lat:28.41915,type:'mountain'},
{id:'tron',name:'TRON Lightcycle / Run',park:'Magic Kingdom',lon:-81.577985,lat:28.419625,type:'canopy'},
{id:'tower',name:'Tower of Terror',park:'Hollywood Studios',lon:-81.55994,lat:28.36002,type:'tower'},
{id:'tree',name:'Tree of Life',park:'Animal Kingdom',lon:-81.5904,lat:28.3574,type:'tree'},
{id:'pandora',name:'Pandora rockscape',park:'Animal Kingdom',lon:-81.59283,lat:28.35486,type:'rocks'}];
const color={silver:[.78,.86,.92],facet:[.91,.95,1],ivory:[.95,.88,.72],roof:[.47,.67,.85],tan:[.75,.57,.40],green:[.36,.62,.43],dark:[.28,.40,.46],ice:[.54,.90,.97]};
function build(type){
 // IMPORTANT: every landmark owns its geometry; do not accumulate previous models!
 const verts=[],indices=[];const norm=(x,y,z)=>{const d=Math.hypot(x,y,z)||1;return[x/d,y/d,z/d]};
 const add=(x,y,z,n,c)=>{const id=verts.length/9;verts.push(x,y,z,...n,...c);return id};
 const tri=(a,b,c)=>indices.push(a,b,c);
 const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d)};
 function cube(x,y,z,w,d,h,c){
  const x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z+h;
  const p=[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  for(const [f,n] of [[[0,3,2,1],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,1,5,4],[0,-1,0]],[[1,2,6,5],[1,0,0]],[[2,3,7,6],[0,1,0]],[[3,0,4,7],[-1,0,0]]]){const t=f.map(i=>add(...p[i],n,c));quad(...t)}
 }
 function cone(x,y,z,r0,r1,h,c,parts=20){
  for(let k=0;k<parts;k++){const a=k*2*Math.PI/parts,b=(k+1)*2*Math.PI/parts,n=norm(Math.cos((a+b)/2),Math.sin((a+b)/2),(r0-r1)/h);
   const t=[add(x+r0*Math.cos(a),y+r0*Math.sin(a),z,n,c),add(x+r0*Math.cos(b),y+r0*Math.sin(b),z,n,c),add(x+r1*Math.cos(b),y+r1*Math.sin(b),z+h,n,c),add(x+r1*Math.cos(a),y+r1*Math.sin(a),z+h,n,c)];quad(...t)}
 }
 function ball(x,y,z,r,c,stacks=15,parts=22,sx=1,sy=1,sz=1){
  for(let i=0;i<stacks;i++)for(let j=0;j<parts;j++){
   const a=i*Math.PI/stacks,b=(i+1)*Math.PI/stacks,p=j*2*Math.PI/parts,q=(j+1)*2*Math.PI/parts;
   function v(t,f){const n=[Math.sin(t)*Math.cos(f),Math.sin(t)*Math.sin(f),Math.cos(t)];return add(x+r*n[0]*sx,y+r*n[1]*sy,z+r*n[2]*sz,n,c)}
   quad(v(a,p),v(b,p),v(b,q),v(a,q))
  }
 }
 function geosphere(x,y,z,r){
  const t=(1+Math.sqrt(5))/2;const raw=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(a=>norm(...a));
  const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  let triangles=faces.map(f=>f.map(i=>raw[i]));
  for(let depth=0;depth<3;depth++){const next=[];for(const [a,b,c] of triangles){const ab=norm(a[0]+b[0],a[1]+b[1],a[2]+b[2]),bc=norm(b[0]+c[0],b[1]+c[1],b[2]+c[2]),ca=norm(c[0]+a[0],c[1]+a[1],c[2]+a[2]);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca])}triangles=next}
  for(const face of triangles){const ids=face.map((n,i)=>add(x+r*n[0],y+r*n[1],z+r*n[2],n,i===0?color.silver:color.facet));tri(...ids)}
 }
 switch(type){
  case 'sphere':
   geosphere(0,0,29,25);cone(0,0,0,22,22,2,color.ivory);
   for(let k=0;k<6;k++){const a=k*Math.PI/3;cone(14*Math.cos(a),14*Math.sin(a),2,1.5,1.1,11,color.silver)}break;
  case 'castle':
   cube(0,0,0,30,19,19,color.ivory);
   for(const [x,y,h,r] of [[-13,-10,34,4],[13,-10,39,4],[-13,10,31,4],[13,10,35,4],[0,0,55,5]]){cone(x,y,0,r,r,h,color.ivory);cone(x,y,h,r*1.4,.3,12,color.roof)}
   cube(0,-10.5,0,5,1.5,10,color.dark);break;
  case 'mountain':
   cone(0,0,0,40,40,5,color.silver,48);cone(0,0,5,40,4,34,color.ivory,48);
   for(let k=0;k<12;k++){const a=k*Math.PI/6;cone(24*Math.cos(a),24*Math.sin(a),5,4,0,25,color.silver,10)}break;
  case 'canopy':
   ball(0,0,18,23,color.ivory,20,40,2.2,1.25,.37);
   for(const x of [-28,28])for(const y of [-14,14])cone(x,y,0,1.5,1,15,color.ice);break;
  case 'tower':
   cube(0,0,0,35,24,40,color.tan);cube(0,0,40,26,20,21,color.silver);cube(0,0,61,29,22,5,color.roof);
   for(const x of [-12,-4,4,12])for(const h of [12,22,31])cube(x,-12.3,h,3,1,6,color.dark);break;
  case 'tree':
   cone(0,0,0,9,5,32,color.tan);
   for(const [x,y,z,r] of [[0,0,42,17],[-12,4,39,13],[11,2,42,13],[-5,-13,38,13],[8,13,35,12]])ball(x,y,z,r,color.green,14,20,1,1,.7);break;
  case 'rocks':
   for(const [x,y,z,r] of [[-21,0,24,15],[13,7,29,17],[0,-13,40,14],[25,-13,20,11]]){ball(x,y,z,r,color.tan,14,22,1,1,.67);ball(x,y,z+r*.3,r*.7,color.green,12,20,1,1,.35)}break;
 }
 if(verts.length/9>65535)throw Error('Landmark mesh too large for mobile GPU');
 return{vertices:new Float32Array(verts),indices:new Uint16Array(indices)};
}
function multiply(A,B){const out=new Float64Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)out[j*4+i]+=Number(A[k*4+i])*Number(B[j*4+k]);return out}
function modelMatrix(site){const m=maplibregl.MercatorCoordinate.fromLngLat([site.lon,site.lat],0),s=m.meterInMercatorCoordinateUnits();return new Float64Array([s,0,0,0,0,-s,0,0,0,0,s,0,m.x,m.y,m.z,1])}
const VS='attribute vec3 a_pos;attribute vec3 a_normal;attribute vec3 a_color;uniform mat4 u_projection;varying vec3 v_color;varying vec3 v_normal;void main(){gl_Position=u_projection*vec4(a_pos,1.0);v_color=a_color;v_normal=a_normal;}';
const FS='precision mediump float;varying vec3 v_color;varying vec3 v_normal;void main(){vec3 sun=normalize(vec3(-.3,.55,.9));float l=max(dot(normalize(v_normal),sun),0.0);gl_FragColor=vec4(v_color*(.57+.43*l),1.0);}';
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||'Shader failed');return shader}
function sceneLayer(){
 return{id:'worldscope-v21-mesh',type:'custom',renderingMode:'3d',
 onAdd(_map,gl){this.map=_map;const vert=compile(gl,gl.VERTEX_SHADER,VS),frag=compile(gl,gl.FRAGMENT_SHADER,FS);
  this.program=gl.createProgram();gl.attachShader(this.program,vert);gl.attachShader(this.program,frag);gl.linkProgram(this.program);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program)||'WebGL program failed');
  gl.deleteShader(vert);gl.deleteShader(frag);
  this.pos=gl.getAttribLocation(this.program,'a_pos');this.normal=gl.getAttribLocation(this.program,'a_normal');this.color=gl.getAttribLocation(this.program,'a_color');this.projection=gl.getUniformLocation(this.program,'u_projection');
  this.models=sites.map(site=>{const mesh=build(site.type),vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
   return{site,vertexBuffer,indexBuffer,matrix:modelMatrix(site),count:mesh.indices.length}});
 },
 render(gl,args){const vp=Array.isArray(args)||ArrayBuffer.isView(args)?args:args?.defaultProjectionData?.mainMatrix;
  if(!vp||vp.length!==16){this.lastError='Missing valid MapLibre projection matrix';return}
  if(!this.program||this.map?.getZoom?.()<15.5)return;
  gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);
  for(const mesh of this.models){
   gl.uniformMatrix4fv(this.projection,false,new Float32Array(multiply(vp,mesh.matrix)));
   gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);
   for(const [loc,offset] of [[this.pos,0],[this.normal,12],[this.color,24]])if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,offset)}
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  this.renderedFrames=(this.renderedFrames||0)+1;
 },
 onRemove(_map,gl){for(const mesh of this.models||[]){gl.deleteBuffer(mesh.vertexBuffer);gl.deleteBuffer(mesh.indexBuffer)}if(this.program)gl.deleteProgram(this.program);this.program=null}
 }
}
let enabled=false,layer=null,bound=null,pins=0,lastError='';
function gpuPins(){
 if(typeof map==='undefined'||!map||!map.isStyleLoaded?.())return false;
 const list=typeof items!=='undefined'?items:[];
 const features=list.filter(x=>typeof validCoords==='function'&&validCoords(x)).map(e=>({type:'Feature',properties:{id:String(e.id),name:e.name,park:e.park,category:e.category},geometry:{type:'Point',coordinates:[e.lon,e.lat]}}));
 pins=features.length;
 const source='worldscope-v21-points',data={type:'FeatureCollection',features};
 try{
  if(map.getSource(source)){map.getSource(source).setData(data);return true}
  map.addSource(source,{type:'geojson',data});
  map.addLayer({id:'worldscope-v21-dots',type:'circle',source,minzoom:13.8,paint:{'circle-color':'#f9d99f','circle-radius':['interpolate',['linear'],['zoom'],14,3.5,19,5.5],'circle-stroke-width':1.7,'circle-stroke-color':'#123547'}});
  map.addLayer({id:'worldscope-v21-labels',type:'symbol',source,minzoom:16.7,layout:{'text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],16.7,10,19,11.5],'text-offset':[0,1.1],'text-anchor':'top','text-allow-overlap':false,'text-max-width':13},paint:{'text-color':'#fff5dc','text-halo-color':'#0c2537','text-halo-width':2.2}});
  map.on('click','worldscope-v21-dots',event=>{const id=event.features?.[0]?.properties?.id;if(id&&typeof findEntry==='function')findEntry(id)});
  map.on('mouseenter','worldscope-v21-dots',()=>map.getCanvas().style.cursor='pointer');
  map.on('mouseleave','worldscope-v21-dots',()=>map.getCanvas().style.cursor='');
 }catch(error){lastError=error.message;console.warn('GPU pins not available',error);return false}
 return true;
}
function status(message){const el=$('worldscope-v21-status');if(el)el.textContent=message}
function activate(){if(!enabled||typeof map==='undefined'||!map||!map.isStyleLoaded?.())return false;
 if(map.getLayer('worldscope-v21-mesh'))return true;
 try{layer=sceneLayer();map.addLayer(layer);status('Seven 3D landmark studies · more detailed rides still in production');return true}
 catch(error){enabled=false;lastError=String(error.message||error);status('3D not supported here — ordinary map still works');console.warn('3D scene error',error);return false}}
function toggle(on){enabled=!!on;const btn=$('worldscope-v21-toggle');
 if(btn){btn.textContent=enabled?'✦ 3D ON':'✧ 3D OFF';btn.setAttribute('aria-pressed',String(enabled))}
 if(!enabled){if(typeof map!=='undefined'&&map?.getLayer('worldscope-v21-mesh'))try{map.removeLayer('worldscope-v21-mesh')}catch{};status('Lightweight aerial view · landmark models hidden')}
 else{activate();if(typeof map!=='undefined'&&map)try{map.easeTo({pitch:57,bearing:-18,duration:600})}catch{}}
}
function focus(id){const s=sites.find(site=>site.id===id);if(!s)return;
 if(typeof go==='function')go('map');
 if(!enabled)toggle(true);
 if(typeof map!=='undefined'&&map)map.flyTo({center:[s.lon,s.lat],zoom:18.25,pitch:57,bearing:-20,duration:850});
}
function controls(){const area=document.querySelector('#map .mapwrap');if(!area||$('worldscope-v21-tools'))return;
 const div=document.createElement('div');div.id='worldscope-v21-tools';div.className='worldscope-v21-tools';
 const btn=document.createElement('button');btn.id='worldscope-v21-toggle';btn.type='button';btn.textContent='✧ 3D OFF';btn.setAttribute('aria-pressed','false');btn.addEventListener('click',()=>toggle(!enabled));
 const select=document.createElement('select');select.id='worldscope-v21-select';select.setAttribute('aria-label','Fly to a Disney 3D landmark');
 select.add(new Option('Explore landmark…',''));sites.forEach(s=>select.add(new Option(s.park+' · '+s.name,s.id)));
 select.addEventListener('change',()=>{if(select.value)focus(select.value)});
 const info=document.createElement('small');info.id='worldscope-v21-status';info.textContent='Tap 3D to see interactive landmark studies';
 div.append(btn,select,info);area.append(div);
}
function attach(){if(typeof map==='undefined'||!map||map===bound)return;bound=map;
 map.on('load',()=>{gpuPins();activate()});map.on('style.load',()=>{gpuPins();activate()});
 if(map.isStyleLoaded?.()){gpuPins();activate()}}
const previous=window.initMap;
if(typeof previous==='function')window.initMap=function(){previous();attach()};
function ready(){controls();attach()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('worldscope-ready',ready);
window.WorldscopeV21={sites,build,sceneLayer,toggle,focus,get state(){return{enabled,pins,frames:layer?.renderedFrames||0,lastError}}};
})();