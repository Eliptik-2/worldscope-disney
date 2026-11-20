/* Worldscope v2.2 — Direct WebGL landmark atlas + GPU map labels.
 * Independent of Three.js. Experimental sculpted models, not official Disney replicas.
 */
(function(){
'use strict';
const PREFIX='ws21';
const nameOf=id=>document.getElementById(id);
const landmarkCatalog=[
 {id:'earth',name:'Spaceship Earth',park:'EPCOT',lon:-81.5494,lat:28.37529,type:'sphere'},
 {id:'castle',name:'Cinderella Castle',park:'Magic Kingdom',lon:-81.58120,lat:28.41950,type:'castle'},
 {id:'space',name:'Space Mountain',park:'Magic Kingdom',lon:-81.57725,lat:28.41915,type:'space'},
 {id:'tron',name:'TRON Lightcycle / Run',park:'Magic Kingdom',lon:-81.577985,lat:28.419625,type:'tron'},
 {id:'tower',name:'Tower of Terror',park:'Hollywood Studios',lon:-81.55994,lat:28.36002,type:'tower'},
 {id:'tree',name:'Tree of Life',park:'Animal Kingdom',lon:-81.59040,lat:28.35740,type:'tree'},
 {id:'pandora',name:'Pandora',park:'Animal Kingdom',lon:-81.59283,lat:28.35486,type:'pandora'}
];
const C={silver:[.78,.86,.91],facet:[.93,.96,1],cream:[.96,.88,.71],roof:[.47,.68,.85],tan:[.77,.57,.41],green:[.36,.62,.43],dark:[.29,.42,.42],ice:[.49,.89,.97],pearl:[.91,.91,.84]};
const V=(x,y,z)=>[x,y,z];
function builder(){
 let vertices=[],indices=[],edges=[];
 const normal=(x,y,z)=>{const d=Math.hypot(x,y,z)||1;return [x/d,y/d,z/d]};
 function point(x,y,z,n,col){const i=vertices.length/9;vertices.push(x,y,z,...n,...col);return i}
 function triangle(a,b,c){indices.push(a,b,c)}
 function quad(a,b,c,d){triangle(a,b,c);triangle(a,c,d)}
 function box(x,y,z,w,d,h,col){
  const lo=[x-w/2,y-d/2,z],hi=[x+w/2,y+d/2,z+h];
  const p=[[lo[0],lo[1],lo[2]],[hi[0],lo[1],lo[2]],[hi[0],hi[1],lo[2]],[lo[0],hi[1],lo[2]],
  [lo[0],lo[1],hi[2]],[hi[0],lo[1],hi[2]],[hi[0],hi[1],hi[2]],[lo[0],hi[1],hi[2]]];
  for(const [face,n] of [ [[0,3,2,1],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,1,5,4],[0,-1,0]],[[1,2,6,5],[1,0,0]],[[2,3,7,6],[0,1,0]],[[3,0,4,7],[-1,0,0]] ]){
   const idx=face.map(i=>point(...p[i],n,col));quad(...idx)
  }
 }
 function cone(x,y,z,rBottom,rTop,h,color,steps=20){
  for(let i=0;i<steps;i++){
   const a=2*Math.PI*i/steps,b=2*Math.PI*(i+1)/steps;
   const sn=normal(Math.cos((a+b)/2),Math.sin((a+b)/2),(rBottom-rTop)/h);
   const i0=point(x+rBottom*Math.cos(a),y+rBottom*Math.sin(a),z,sn,color);
   const i1=point(x+rBottom*Math.cos(b),y+rBottom*Math.sin(b),z,sn,color);
   const i2=point(x+rTop*Math.cos(b),y+rTop*Math.sin(b),z+h,sn,color);
   const i3=point(x+rTop*Math.cos(a),y+rTop*Math.sin(a),z+h,sn,color);
   quad(i0,i1,i2,i3)
  }
 }
 function sphere(x,y,z,r,col,stacks=16,segs=24,scale=[1,1,1]){
  for(let lat=0;lat<stacks;lat++)for(let lon=0;lon<segs;lon++){
   const a=lat*Math.PI/stacks,b=(lat+1)*Math.PI/stacks,c=lon*2*Math.PI/segs,d=(lon+1)*2*Math.PI/segs;
   function sp(theta,phi){const n=[Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),Math.cos(theta)];return point(x+r*n[0]*scale[0],y+r*n[1]*scale[1],z+r*n[2]*scale[2],normal(...n),col)}
   quad(sp(a,c),sp(b,c),sp(b,d),sp(a,d))
  }
 }
 function geosphere(x,y,z,r){
  const t=(1+Math.sqrt(5))/2;
  const raw=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>normal(...v));
  let faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  let cur=faces.map(f=>f.map(i=>raw[i]));
  for(let depth=0;depth<3;depth++){
   let next=[];
   for(const [a,b,c] of cur){const ab=normal(a[0]+b[0],a[1]+b[1],a[2]+b[2]),bc=normal(b[0]+c[0],b[1]+c[1],b[2]+c[2]),ca=normal(c[0]+a[0],c[1]+a[1],c[2]+a[2]);
    next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca])
   }
   cur=next;
  }
  for(const [a,b,c] of cur){
   const ids=[a,b,c].map((n,i)=>point(x+r*n[0],y+r*n[1],z+r*n[2],n,i===0?C.silver:C.facet));
   triangle(...ids)
  }
 }
 function make(type){
  vertices=[];indices=[];
  const cube=box,add=point,norm=normal;
  const ball=(x,y,z,r,c,stacks=15,parts=22,sx=1,sy=1,sz=1)=>sphere(x,y,z,r,c,stacks,parts,[sx,sy,sz]);
  const color={...C,gold:[.93,.72,.36],ivory:C.cream};
 // Fine ribs, buttresses, suspended vines and decorative spires share a cheap tubular primitive.
 function rod(x0,y0,z0,x1,y1,z1,r,c,steps=8){
  const dx=x1-x0,dy=y1-y0,dz=z1-z0,L=Math.hypot(dx,dy,dz)||1;
  const ax=dx/L,ay=dy/L,az=dz/L;
  let bx=-ay,by=ax,bz=0;const bl=Math.hypot(bx,by,bz);
  if(bl<.001){bx=1;by=0;bz=0}else{bx/=bl;by/=bl}
  const cx=ay*bz-az*by,cy=az*bx-ax*bz,cz=ax*by-ay*bx;
  for(let i=0;i<steps;i++){
   const a=2*Math.PI*i/steps,b=2*Math.PI*(i+1)/steps;
   function v(X,Y,Z,t){const nx=Math.cos(t)*bx+Math.sin(t)*cx,ny=Math.cos(t)*by+Math.sin(t)*cy,nz=Math.cos(t)*bz+Math.sin(t)*cz;return add(X+r*nx,Y+r*ny,Z+r*nz,[nx,ny,nz],c)}
   quad(v(x0,y0,z0,a),v(x0,y0,z0,b),v(x1,y1,z1,b),v(x1,y1,z1,a));
  }
 }
 function ring(x,y,z,r,c,n=32,width=.4){
  for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;rod(x+r*Math.cos(a),y+r*Math.sin(a),z,x+r*Math.cos(b),y+r*Math.sin(b),z,width,c,5)}
 }
 // A multifaceted rock has uneven rock faces and a pointed underside, never a spherical blob.
 function crag(x,y,z,rad,h,seed,c){
  const n=11,rings=[{z:-h*.65,r:.07},{z:-h*.30,r:.48},{z:0,r:1},{z:h*.35,r:.88},{z:h*.7,r:.42},{z:h*.83,r:.10}];
  const rows=rings.map((level,k)=>Array.from({length:n},(_,i)=>{const a=(i/n)*Math.PI*2;
   const irregular=.82+.14*Math.sin((i+1)*7.1+seed)+.13*Math.cos(i*13.3+seed*3+k*.3);
   return [x+Math.cos(a)*rad*level.r*irregular,y+Math.sin(a)*rad*level.r*irregular,z+level.z+Math.sin(i*2.13+seed+k)*rad*.04]}));
  for(let k=0;k<rows.length-1;k++)for(let i=0;i<n;i++){
   const p=rows[k][i],q=rows[k][(i+1)%n],r=rows[k+1][(i+1)%n],t=rows[k+1][i];
   const nrm=norm((p[0]+q[0]+r[0]+t[0])/4-x,(p[1]+q[1]+r[1]+t[1])/4-y,.4);
   const ids=[p,q,r,t].map(v=>add(...v,nrm,(i+k)%4===0?color.tan:c));quad(...ids);
  }
 }
 function spire(x,y,z,h,r){
  cone(x,y,z,r,r*.82,h*.56,color.ivory,20);
  ring(x,y,z+h*.54,r*.92,color.tan,18,.32);
  cone(x,y,z+h*.55,r*1.25,.02,h*.43,color.roof,24);
  rod(x,y,z+h*.98,x,y,z+h+3,.24,color.gold,6);
 }
 function windowArch(x,y,z,wide=2,high=4){
  cube(x,y,z,wide,.65,high,color.dark);
  cube(x,y,z+high*.8,wide*.95,.8,.48,color.gold);
 }
 switch(({space:'mountain',tron:'canopy',pandora:'rocks'})[type]||type){
  case 'sphere':{
   geosphere(0,0,28.7,25.15);
   cone(0,0,0,25,25,1.3,color.ivory,48);
   ring(0,0,28.7,25.19,color.silver,60,.23);
   for(let k=0;k<6;k++){
    const a=k*Math.PI/3;
    cone(16*Math.cos(a),16*Math.sin(a),1.5,1.45,1.1,13,color.silver,12);
    rod(17*Math.cos(a),17*Math.sin(a),12,19*Math.cos(a),19*Math.sin(a),19,.65,color.dark,8);
   }
   break;
  }
  case 'castle':{
   // Original interpretation: nested masonry wings, stair-step buttresses,
   // 16 blue-roofed turrets and layered fairytale spires. Not a survey model.
   cube(0,0,0,37,22,15,color.ivory);
   cube(-10,5,13,18,18,11,color.ivory);
   cube(11,5,13,18,17,12,color.ivory);
   cube(0,8,17,18,14,18,color.ivory);
   for(let x of [-18,-10,-2,6,14,19]){cube(x,-11.6,15,2.1,2.2,2.1,color.ivory);}
   for(let x of [-13,-7,7,13])for(let z of [5,12])windowArch(x,-11.45,z,1.8,3.5);
   cube(0,-12,0,6,2.5,13,color.dark);
   for(const [x,y,z,h,r] of [
    [-18,-10,0,31,3.4],[18,-10,0,35,3.7],[-18,10,0,33,3.3],[18,10,0,37,3.8],
    [-12,0,13,23,2.8],[12,0,13,26,3],[-9,11,16,29,3.2],[9,11,16,32,3.1],
    [0,4,25,29,4.3],[-5,-4,18,19,2.4],[5,-4,18,21,2.5],
    [-24,3,0,20,2.2],[24,3,0,22,2.3],[-24,-8,0,17,2],[24,-8,0,18,2]
   ])spire(x,y,z,h,r);
   for(let x of [-15,0,15]){
    rod(x,-13,15,x,-13,19,.32,color.gold,6);
   }
   break;
  }
  case 'mountain':{
   // White conical roof, twelve exterior ribs and a central spire.
   cone(0,0,0,41,41,5,color.silver,64);
   cone(0,0,4.5,39,7,38,color.ivory,64);
   ring(0,0,5.8,39,color.silver,72,.85);
   for(let k=0;k<16;k++){
    const a=k*2*Math.PI/16;
    const X=r=>r*Math.cos(a),Y=r=>r*Math.sin(a);
    rod(X(39),Y(39),6,X(30),Y(30),23,.8,color.silver,8);
    rod(X(30),Y(30),23,X(15),Y(15),36,.65,color.silver,8);
    rod(X(15),Y(15),36,X(2.5),Y(2.5),43,.55,color.roof,7);
   }
   cone(0,0,42,4.7,.4,10,color.ivory,24);
   rod(0,0,52,0,0,56,.42,color.gold,7);
   break;
  }
  case 'canopy':{
   // Thin sweeping wave/grid roof, rather than a floating sphere.
   cube(0,0,0,66,27,4,color.dark);
   const nx=44,ny=18;
   function roof(X,Y){const v=Math.max(0,1-(Y/28)**2);return 15+8*v+6*Math.sin((X+48)/96*Math.PI*1.45)*v+3*Math.cos(X/32)*v}
   for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
    const x0=-49+i*98/nx,x1=-49+(i+1)*98/nx,y0=-27+j*54/ny,y1=-27+(j+1)*54/ny;
    const p=[[x0,y0,roof(x0,y0)],[x1,y0,roof(x1,y0)],[x1,y1,roof(x1,y1)],[x0,y1,roof(x0,y1)]];
    const nrm=norm(0,0,1),a=p.map(v=>add(...v,nrm,(i+j)%4===0?color.ice:color.ivory));quad(...a);
   }
   for(let j=0;j<=8;j++){
    const y=-27+j*54/8;
    for(let i=0;i<20;i++){
     const x0=-49+i*98/20,x1=-49+(i+1)*98/20;
     rod(x0,y,roof(x0,y)+.3,x1,y,roof(x1,y)+.3,.38,color.ice,6)
    }
   }
   for(const x of [-42,-14,15,42])for(const y of [-21,21])rod(x,y,2,x,y,roof(x,y),1.2,color.silver,10);
   cube(-11,-8,4,26,12,10,color.dark);
   break;
  }
  case 'tower':{
   cube(0,0,0,34,24,38,color.tan);
   cube(0,0,38,28,21,21,color.ivory);
   cube(0,0,59,30,23,6,color.roof);
   for(let x of [-11,-3,5,13])for(let z of [10,19,30,46])windowArch(x,-12.3,z,2.4,5);
   for(let k=0;k<5;k++)spire(-12+k*6,8,61,8,1.4);
   cube(-18,0,0,9,20,25,color.tan);cube(18,0,0,9,20,27,color.tan);
   break;
  }
  case 'tree':{
   // Tapered trunk, radial woody branches and multiple clumps of fine foliage.
   cone(0,0,0,10,4,33,color.tan,28);
   for(let i=0;i<11;i++){
    const a=i*2*Math.PI/11,z=22+(i%3)*4;
    rod(0,0,z,17*Math.cos(a),17*Math.sin(a),z+13,.95,color.tan,9);
    rod(17*Math.cos(a),17*Math.sin(a),z+13,26*Math.cos(a),26*Math.sin(a),z+17,.5,color.tan,7);
    for(let j=0;j<3;j++){
     const d=13+j*6,aa=a+j*.15;
     ball(d*Math.cos(aa),d*Math.sin(aa),z+15+(j%2)*3,6.8,color.green,9,13,1.15,1,.65);
    }
   }
   ball(0,0,44,13,color.green,14,19,1,1,.68);
   break;
  }
  case 'rocks':{
   // Pointed floating cliffs, tiny foliage patches and long connecting vines.
   const centers=[[-23,0,29,16,28],[15,8,33,19,31],[0,-25,40,15,37],[27,-14,23,12,22]];
   for(let i=0;i<centers.length;i++){
    const [x,y,z,r,h]=centers[i];crag(x,y,z,r,h,i+.9,color.dark);
    for(let j=0;j<5;j++){
     const a=j*2*Math.PI/5+i*.4;
     ball(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z+h*.37,r*.29,color.green,9,12,1.3,1,.40);
    }
   }
   for(const [i,j] of [[0,1],[1,2],[0,3],[2,3]]){
    const a=centers[i],b=centers[j];
    for(let k=0;k<9;k++){
     const t=k/9,u=(k+1)/9;
     const p=v=>[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v,Math.min(a[2],b[2])+14-6*Math.sin(Math.PI*v)];
     const P=p(t),Q=p(u);rod(...P,...Q,.38,color.green,6);
    }
   }
   for(const c of centers)for(let i=0;i<3;i++){
    const x=c[0]+i*4-4,y=c[1]+i*3-3;
    rod(x,y,c[2],x+3,y+2,c[2]-20-(i%2)*7,.35,color.green,5);
   }
   break;
  }
 }
  if(vertices.length/9>65535)throw Error('Mobile mesh index capacity exceeded');
  return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices),triangles:indices.length/3};
 }
 return make;
}
const build=builder();
function mult(A,B){
 const out=new Float64Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)out[j*4+i]+=Number(A[k*4+i])*Number(B[j*4+k]);return out;
}
function modelAt(location){
 const m=maplibregl.MercatorCoordinate.fromLngLat([location.lon,location.lat],0);
 const s=m.meterInMercatorCoordinateUnits();
 return new Float64Array([s,0,0,0,0,-s,0,0,0,0,s,0,m.x,m.y,m.z,1]);
}
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||'Shader compilation failed');return shader}
const VERTEX=`attribute vec3 a_position;attribute vec3 a_normal;attribute vec3 a_color;
 uniform mat4 u_projection;varying vec3 v_color;varying vec3 v_normal;
 void main(){gl_Position=u_projection*vec4(a_position,1.0);v_color=a_color;v_normal=a_normal;}`;
const FRAGMENT=`precision mediump float;varying vec3 v_color;varying vec3 v_normal;
 void main(){vec3 light=normalize(vec3(-0.3,0.55,0.9));float diffuse=max(dot(normalize(v_normal),light),0.0);gl_FragColor=vec4(v_color*(0.57+0.43*diffuse),1.0);}`;
function createLayer(){
 return {id:'worldscope-v21-mesh',type:'custom',renderingMode:'3d',onAdd(map,gl){
  this.map=map;const shader1=compile(gl,gl.VERTEX_SHADER,VERTEX),shader2=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  this.program=gl.createProgram();gl.attachShader(this.program,shader1);gl.attachShader(this.program,shader2);gl.linkProgram(this.program);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program)||'GL link failed');
  gl.deleteShader(shader1);gl.deleteShader(shader2);
  this.pos=gl.getAttribLocation(this.program,'a_position');this.nrm=gl.getAttribLocation(this.program,'a_normal');this.col=gl.getAttribLocation(this.program,'a_color');this.proj=gl.getUniformLocation(this.program,'u_projection');
  this.models=[];
  for(const landmark of landmarkCatalog){const mesh=build(landmark.type);
   const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
   const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
   this.models.push({vb,ib,model:modelAt(landmark),count:mesh.indices.length,landmark});
  }
 },render(gl,args){
  const vp=Array.isArray(args)||ArrayBuffer.isView(args)?args:args?.defaultProjectionData?.mainMatrix;
  if(!vp||vp.length!==16){this.lastError='MapLibre did not supply a 4x4 projection matrix';return}
  if(!this.program)return;
  gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);
  if(typeof this.map?.getZoom==='function'&&this.map.getZoom()<15.5)return;
  for(const item of this.models){
   const matrix=mult(vp,item.model);
   gl.uniformMatrix4fv(this.proj,false,new Float32Array(matrix));
   gl.bindBuffer(gl.ARRAY_BUFFER,item.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,item.ib);
   const stride=9*4;
   for(const [loc,offset] of [[this.pos,0],[this.nrm,12],[this.col,24]])if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,stride,offset)}
   gl.drawElements(gl.TRIANGLES,item.count,gl.UNSIGNED_SHORT,0);
  }
  this.renderedFrames=(this.renderedFrames||0)+1;
 },onRemove(map,gl){
  for(const item of this.models||[]){gl.deleteBuffer(item.vb);gl.deleteBuffer(item.ib)}
  if(this.program)gl.deleteProgram(this.program);this.program=null;
 }};
}
let active=false,modelLayer=null,bound=null,count=0,error=null;
function nativePins(){
 if(typeof map==='undefined'||!map||!map.isStyleLoaded?.())return false;
 const list=typeof items!=='undefined'?items:[];
 const mapped=list.filter(x=>typeof validCoords==='function'&&validCoords(x));
 count=mapped.length;
 const source='worldscope-v21-places';
 const features=mapped.map(e=>({type:'Feature',properties:{id:String(e.id),name:e.name,park:e.park,category:e.category},geometry:{type:'Point',coordinates:[e.lon,e.lat]}}));
 const geo={type:'FeatureCollection',features};
 try{
  if(map.getSource(source)){map.getSource(source).setData(geo);return true}
  map.addSource(source,{type:'geojson',data:geo});
  map.addLayer({id:'worldscope-v21-dots',type:'circle',source,minzoom:13.8,
   paint:{'circle-color':'#ffd99f','circle-radius':['interpolate',['linear'],['zoom'],14,3.5,19,5.5],
   'circle-stroke-width':1.7,'circle-stroke-color':'#123547'}});
  map.addLayer({id:'worldscope-v21-labels',type:'symbol',source,minzoom:16.7,
   layout:{'text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],16.7,10,19,11.5],
   'text-offset':[0,1.1],'text-anchor':'top','text-allow-overlap':false,'text-max-width':13},
   paint:{'text-color':'#fff5dc','text-halo-color':'#0c2537','text-halo-width':2.2}});
  map.on('click','worldscope-v21-dots',event=>{const id=event.features?.[0]?.properties?.id;if(id&&typeof findEntry==='function')findEntry(id)});
  map.on('mouseenter','worldscope-v21-dots',()=>{map.getCanvas().style.cursor='pointer'});
  map.on('mouseleave','worldscope-v21-dots',()=>{map.getCanvas().style.cursor=''})
 }catch(e){error=e.message;console.warn('Map attraction pins unavailable',e);return false}
 return true;
}
function showStatus(message){const el=nameOf('worldscope-v21-status');if(el)el.textContent=message}
function ensure3D(){
 if(!active||typeof map==='undefined'||!map||!map.isStyleLoaded?.())return false;
 if(map.getLayer('worldscope-v21-mesh'))return true;
 try{
  modelLayer=createLayer();map.addLayer(modelLayer);
  showStatus('Seven sculpted landmarks · full ride-by-ride 3D modeling is in progress');
  return true;
 }catch(e){error=String(e.message||e);active=false;showStatus('3D unavailable on this device; map remains usable.');console.warn(e);return false}
}
function toggle(on){
 active=!!on;
 const btn=nameOf('worldscope-v21-toggle');if(btn){btn.textContent=active?'✦ 3D: ON':'✧ 3D: OFF';btn.setAttribute('aria-pressed',String(active))}
 if(!active){if(typeof map!=='undefined'&&map?.getLayer('worldscope-v21-mesh'))try{map.removeLayer('worldscope-v21-mesh')}catch{};showStatus('Aerial navigation mode · smaller labels and quick map movement')}
 else{ensure3D();if(typeof map!=='undefined'&&map){try{map.easeTo({pitch:57,bearing:-18,duration:600})}catch{}}}
}
function fly(id){const l=landmarkCatalog.find(v=>v.id===id);if(!l)return;
 if(typeof go==='function')go('map');if(!active)toggle(true);
 if(typeof map!=='undefined'&&map)map.flyTo({center:[l.lon,l.lat],zoom:18.2,pitch:57,bearing:-20,duration:850});
}
function tools(){const area=document.querySelector('#map .mapwrap');if(!area||nameOf('worldscope-v21-tools'))return;
 const bar=document.createElement('div');bar.id='worldscope-v21-tools';bar.className='worldscope-v21-tools';
 const btn=document.createElement('button');btn.id='worldscope-v21-toggle';btn.type='button';btn.textContent='✧ 3D: OFF';btn.setAttribute('aria-pressed','false');btn.addEventListener('click',()=>toggle(!active));
 const sel=document.createElement('select');sel.id='worldscope-v21-landmark';sel.setAttribute('aria-label','Explore a 3D Disney landmark');sel.add(new Option('Fly to landmark…',''));
 landmarkCatalog.forEach(l=>sel.add(new Option(l.park+' · '+l.name,l.id)));
 sel.addEventListener('change',()=>{if(sel.value)fly(sel.value)});
 const info=document.createElement('small');info.id='worldscope-v21-status';info.textContent='Real 3D meshes · select a landmark to inspect it';bar.append(btn,sel,info);area.append(bar)
}
function attach(){if(typeof map==='undefined'||!map||map===bound)return;bound=map;
 map.on('load',()=>{nativePins();ensure3D()});map.on('style.load',()=>{nativePins();ensure3D()});
 if(map.isStyleLoaded?.()){nativePins();ensure3D()}
}
const formerInit=window.initMap;
if(typeof formerInit==='function')window.initMap=function(){formerInit();attach()};
function ready(){tools();attach()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
window.addEventListener('worldscope-ready',ready);
window.WorldscopeV21={catalog:landmarkCatalog,toggle,fly,createLayer,build,get status(){return{enabled:active,markers:count,lastError:error,rendererFrames:modelLayer?.renderedFrames||0}}};
window.WorldscopeV22=window.WorldscopeV21;
})();
