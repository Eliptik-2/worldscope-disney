/* Worldscope v2.0 experimental 3D atlas.
  Canvas-native MapLibre labels replace floating HTML markers. Photorealistic ride
  models require separately sourced, licensed and optimized glTF assets. */
(function(){
'use strict';
const NS='worldscope-v20';
const $=id=>document.getElementById(id);
const pinSource=NS+'-places';
const pinLayer=NS+'-pins';
const labelLayer=NS+'-labels';
const parkLayer=NS+'-parks';
const modelLayer=NS+'-models';
let boundMap=null,threeLayer=null,modelActive=false,renderError=false,renderedPlaces=0,threePromise=null;
function loadThreeOnDemand(){
 if(window.THREE)return Promise.resolve(window.THREE);
 if(threePromise)return threePromise;
 threePromise=new Promise((resolve,reject)=>{
  if(!document.createElement||!document.head?.appendChild){reject(Error('3D script loader not available'));return}
  const script=document.createElement('script');script.src='https://unpkg.com/three@0.148.0/build/three.min.js';script.async=true;
  script.onload=()=>window.THREE?resolve(window.THREE):reject(Error('3D library loaded without renderer'));
  script.onerror=()=>reject(Error('3D library could not be downloaded'));
  document.head.appendChild(script);
 });
 return threePromise;
}
const catalog=[
 {id:'earth',name:'Spaceship Earth',park:'EPCOT',lon:-81.5494,lat:28.37529,kind:'sphere'},
 {id:'castle',name:'Cinderella Castle',park:'Magic Kingdom',lon:-81.5812,lat:28.4195,kind:'castle'},
 {id:'space',name:'Space Mountain',park:'Magic Kingdom',lon:-81.57725,lat:28.41915,kind:'mountain'},
 {id:'tron',name:'TRON Lightcycle / Run',park:'Magic Kingdom',lon:-81.577985,lat:28.419625,kind:'canopy'},
 {id:'tower',name:'Tower of Terror',park:'Hollywood Studios',lon:-81.55994,lat:28.36002,kind:'tower'},
 {id:'tree',name:'Tree of Life',park:'Animal Kingdom',lon:-81.5904,lat:28.3574,kind:'tree'},
 {id:'pandora',name:'Pandora rockscape',park:'Animal Kingdom',lon:-81.59283,lat:28.35486,kind:'rocks'}
];
function sourceData(){
 const list=typeof items!=='undefined'?items:[];
 const coords=list.filter(e=>typeof validCoords==='function'&&validCoords(e)).map(e=>({
  type:'Feature',id:String(e.id),properties:{id:String(e.id),name:e.name,park:e.park,category:e.category,kind:'attraction'},
  geometry:{type:'Point',coordinates:[e.lon,e.lat]}
 }));
 const parks=typeof COORD!=='undefined'?Object.entries(COORD).map(([name,pt])=>({
  type:'Feature',properties:{name,kind:'park'},geometry:{type:'Point',coordinates:pt}
 })):[];
 return {type:'FeatureCollection',features:coords.concat(parks)};
}
function nativePins(){
 if(typeof map==='undefined'||!map||!map.isStyleLoaded?.())return;
 const geo=sourceData();renderedPlaces=geo.features.filter(f=>f.properties.kind==='attraction').length;
 try{
  const existing=map.getSource(pinSource);
  if(existing){existing.setData(geo);return}
  map.addSource(pinSource,{type:'geojson',data:geo});
  map.addLayer({id:NS+'-glow',type:'circle',source:pinSource,filter:['==',['get','kind'],'attraction'],minzoom:14,
   paint:{'circle-radius':['interpolate',['linear'],['zoom'],14,6,18,10],
    'circle-color':'#f8d397','circle-opacity':0.22,'circle-blur':0.9}});
  map.addLayer({id:pinLayer,type:'circle',source:pinSource,filter:['==',['get','kind'],'attraction'],minzoom:14,
   paint:{'circle-radius':['interpolate',['linear'],['zoom'],14,3.8,18,6.8],
    'circle-color':'#f5dcaa','circle-stroke-color':'#163d54','circle-stroke-width':2.3,
    'circle-opacity':0.99}});
  // Text is rendered in the same WebGL transform as the aerial imagery, not DOM.
  map.addLayer({id:labelLayer,type:'symbol',source:pinSource,filter:['==',['get','kind'],'attraction'],minzoom:16.4,
   layout:{'text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],16.4,10,19,13],
    'text-offset':[0,1.45],'text-anchor':'top','text-allow-overlap':false,'text-optional':true,'text-max-width':14},
   paint:{'text-color':'#fff8e8','text-halo-color':'#0d2a42','text-halo-width':2.2,'text-halo-blur':0.8}});
  map.addLayer({id:parkLayer,type:'symbol',source:pinSource,filter:['==',['get','kind'],'park'],maxzoom:15.8,
   layout:{'text-field':['get','name'],'text-size':14,'text-font':['Open Sans Bold','Arial Unicode MS Bold'],
    'text-anchor':'top','text-offset':[0,1],'text-allow-overlap':false},
   paint:{'text-color':'#fff4d2','text-halo-color':'#183349','text-halo-width':2.3}});
  map.on('click',pinLayer,e=>{
   const id=e.features?.[0]?.properties?.id;if(id!=null&&typeof findEntry==='function')findEntry(String(id));
  });
  map.on('mouseenter',pinLayer,()=>{map.getCanvas().style.cursor='pointer'});
  map.on('mouseleave',pinLayer,()=>{map.getCanvas().style.cursor=''});
  if(window.WorldscopeV19?.redraw)window.WorldscopeV19.redraw();
 }catch(error){console.warn('GPU location labels unavailable',error)}
}
const status=s=>{const el=$('worldscope-v20-model-status');if(el)el.textContent=s};
function material(T,color,roughness=0.56,metalness=0.08){
 return new T.MeshStandardMaterial({color,roughness,metalness,side:T.DoubleSide});
}
function mesh(T,parent,shape,mat,xyz,scale,rotation){
 const obj=new T.Mesh(shape,mat);
 if(xyz)obj.position.set(...xyz);if(scale)obj.scale.set(...scale);
 if(rotation)obj.rotation.set(...rotation);
 parent.add(obj);return obj;
}
function sph(T,parent,m,x,y,z,r,segments=32){return mesh(T,parent,new T.SphereGeometry(r,segments,Math.floor(segments*.72)),m,[x,y,z])}
function cy(T,parent,m,x,y,z,r1,r2,height){return mesh(T,parent,new T.CylinderGeometry(r1,r2,height,20),m,[x,y,z])}
function buildShape(T,cfg){
 const group=new T.Group();
 const ivory=material(T,0xd8e5f1,0.42,0.16),silver=material(T,0xcedce6,.31,.46),
  pale=material(T,0xe8e1da,.54,.10),blue=material(T,0x63dce8,.32,.30),stone=material(T,0x9d9284,.85,0),
  tan=material(T,0xcab496,.77,0),roof=material(T,0x6e88bb,.45,.16),green=material(T,0x577c5a,.86,0),
  dark=material(T,0x5f695f,.86,0);
 const kinds={
 earth(){
  // 165-ft-ish sphere diameter with raised support, approximate landmark geometry.
  sph(T,group,silver,0,29.7,0,25.15,72);
  const facet=new T.IcosahedronGeometry(25.2,3);
  const wire=new T.LineSegments(new T.EdgesGeometry(facet,1),new T.LineBasicMaterial({color:0xf5faff,transparent:true,opacity:.35}));
  wire.position.set(0,29.7,0);group.add(wire);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3;
   cy(T,group,stone,Math.cos(a)*15,6,Math.sin(a)*15,1.2,1.35,12);
  }
  cy(T,group,pale,0,1.6,0,26.8,26.8,3.2);
 },
 castle(){
  cy(T,group,pale,0,8,0,12,13,16);
  mesh(T,group,new T.BoxGeometry(28,16,18),pale,[0,11,0]);
  for(const [x,z,h,r] of [[-15,-8,33,4],[15,-8,38,4],[-14,8,27,3.5],[14,8,31,3.5],[0,0,53,5]]){
   cy(T,group,pale,x,h/2,z,r,r+1,h);
   cy(T,group,roof,x,h+3,z,0.25,r+1,7);
  }
 },
 mountain(){
  cy(T,group,ivory,0,8,0,37,37,16);
  for(let i=0;i<12;i++){
   const angle=2*Math.PI*i/12;const x=Math.cos(angle)*15,z=Math.sin(angle)*15;
   cy(T,group,ivory,x,25,z,0.4,12,30);
   // Tension cables approximate the recognizable radial roof ribs.
   const pts=[new T.Vector3(x,40,z),new T.Vector3(Math.cos(angle)*35,13,Math.sin(angle)*35)];
   group.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xa0bacd})));
  }
 },
 canopy(){
  const canopy=sph(T,group,ivory,0,18,0,24,56);canopy.scale.set(2.5,0.27,1.2);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/8;
   const p=new T.EllipseCurve(0,0,56,29,angle,Math.PI+angle,false,0);
   const pts=p.getPoints(80).map(v=>new T.Vector3(v.x,15+Math.cos(v.x/70*Math.PI)*8,v.y));
   group.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x94e5ec,transparent:true,opacity:.82})));
  }
  for(const x of [-35,35])cy(T,group,ivory,x,7,0,1.8,1.8,14);
 },
 tower(){
  mesh(T,group,new T.BoxGeometry(38,36,24),tan,[0,18,0]);
  mesh(T,group,new T.BoxGeometry(26,21,20),stone,[0,47,0]);
  mesh(T,group,new T.BoxGeometry(39,4,25),pale,[0,37,0]);
  mesh(T,group,new T.BoxGeometry(29,5,23),roof,[0,59,0]);
  for(let x of [-13,-5,5,13])for(let y of [12,22,32])mesh(T,group,new T.BoxGeometry(3.2,6,1),material(T,0x344c59,.48,.2),[x,y,12.2]);
 },
 tree(){
  cy(T,group,stone,0,15,0,5.5,9,30);
  for(const [x,y,z,r] of [[0,40,0,16],[-11,36,5,13],[13,37,0,12],[-5,33,-11,10],[9,32,11,11]]){
   const clump=sph(T,group,green,x,y,z,r,32);clump.scale.y=.76;
  }
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cy(T,group,dark,Math.cos(a)*7,8,Math.sin(a)*7,1.5,2,14)}
 },
 rocks(){
  for(const [x,y,z,s] of [[-14,23,0,14],[15,29,5,17],[0,39,-15,13],[-29,19,-13,10]]){
   const p=sph(T,group,stone,x,y,z,s,32);p.scale.set(1,.65,.75);
   const top=sph(T,group,green,x,y+s*.32,z,s*.63,24);top.scale.set(1,.25,.9);
  }
 }
 };
 kinds[cfg.kind]?.();
 return group;
}
function createThreeLayer(){
 const T=window.THREE;
 if(!T){status('Detailed 3D cannot load on this connection. Aerial map remains available.');return null}
 const layer={id:modelLayer,type:'custom',renderingMode:'3d',
  onAdd(_map,gl){
   this.scene=new T.Scene();this.camera=new T.Camera();this.map=_map;this.geometries=[];
   const sun=new T.DirectionalLight(0xfff1d2,2.2);sun.position.set(120,220,180);this.scene.add(sun);
   this.scene.add(new T.AmbientLight(0xbad6ed,2.0));
   for(const item of catalog){
    const anchor=maplibregl.MercatorCoordinate.fromLngLat([item.lon,item.lat],0);
    const ratio=anchor.meterInMercatorCoordinateUnits();
    const root=buildShape(T,item);
    root.matrixAutoUpdate=false;
    const mx=new T.Matrix4().makeTranslation(anchor.x,anchor.y,anchor.z)
      .multiply(new T.Matrix4().makeScale(ratio,-ratio,ratio))
      .multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    root.matrix.copy(mx);
    this.scene.add(root);
   }
   this.renderer=new T.WebGLRenderer({canvas:_map.getCanvas(),context:gl,antialias:true,alpha:true});
   this.renderer.autoClear=false;
  },
  render(gl,matrix){
   if(!this.renderer||!modelActive)return;
   try{
    const proj=Array.isArray(matrix)||ArrayBuffer.isView(matrix)?matrix:matrix?.defaultProjectionData?.mainMatrix;
    if(!proj)return;
    this.camera.projectionMatrix.fromArray(proj);
    this.renderer.resetState();
    this.renderer.render(this.scene,this.camera);
    this.renderer.resetState();
   }catch(e){if(!renderError){renderError=true;console.warn('3D scene render unavailable',e);status('3D preview is unavailable on this device. Use aerial view.')}}
  },
  onRemove(){try{
   this.scene?.traverse(obj=>{
    if(obj.geometry)obj.geometry.dispose();
    if(obj.material){(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(mat=>mat.dispose())}
   });
   this.renderer?.dispose();
  }catch{}}
 };
 return layer;
}
function ensureModelLayer(){
 if(!modelActive||typeof map==='undefined'||!map||!map.isStyleLoaded?.())return;
 if(map.getLayer(modelLayer))return;
 if(!window.maplibregl?.MercatorCoordinate){status('3D coordinate system unavailable');return}
 const layer=createThreeLayer();if(!layer)return;
 try{map.addLayer(layer);threeLayer=layer;status('7 landmark studies visible · geometry is illustrative, not exact ride facades')}
 catch(e){status('3D renderer could not start');console.warn('3D landmark layer failed',e)}
}
function toggleModels(on){
 modelActive=!!on;
 const b=$('worldscope-v20-model-toggle');
 if(b){b.textContent=modelActive?'✦ 3D Landmarks: ON':'✧ 3D Landmarks: OFF';b.setAttribute('aria-pressed',String(modelActive))}
 if(typeof map!=='undefined'&&map){
  if(!modelActive&&map.getLayer(modelLayer)){try{map.removeLayer(modelLayer)}catch(e){console.warn(e)}}
  if(modelActive){
   if(window.THREE)ensureModelLayer();
   else {status('Loading optional 3D landmarks…');void loadThreeOnDemand().then(()=>{if(modelActive){if(map?.isStyleLoaded?.())ensureModelLayer();else map?.once?.('idle',()=>{if(modelActive)ensureModelLayer()})}}).catch(error=>{if(modelActive){modelActive=false;if(b){b.textContent='✧ 3D Landmarks: OFF';b.setAttribute('aria-pressed','false')}status('3D download unavailable. Aerial navigation still works.')}console.warn(error)})}
   try{map.easeTo({pitch:60,bearing:-20,duration:600})}catch{}
  }
  map.triggerRepaint?.();
 }
 if(!modelActive)status('3D landmarks off · faster aerial navigation');
}
function focusLandmark(id){
 const item=catalog.find(x=>x.id===id);if(!item)return;
 if(typeof go==='function')go('map');
 if(!modelActive)toggleModels(true);
 if(typeof map!=='undefined'&&map){
  map.flyTo({center:[item.lon,item.lat],zoom:18.25,pitch:65,bearing:-24,duration:950});
 }
}
function createControls(){
 const area=document.querySelector('#map .mapwrap');if(!area||$('worldscope-v20-tools'))return;
 const box=document.createElement('div');box.id='worldscope-v20-tools';box.className='worldscope-v20-tools';
 const button=document.createElement('button');button.id='worldscope-v20-model-toggle';button.type='button';
 button.textContent='✧ 3D Landmarks: OFF';button.setAttribute('aria-pressed','false');
 button.addEventListener('click',()=>toggleModels(!modelActive));
 const sel=document.createElement('select');sel.id='worldscope-v20-landmark-select';
 sel.setAttribute('aria-label','Fly to a 3D landmark');
 sel.add(new Option('Explore a 3D landmark…',''));
 catalog.forEach(x=>sel.add(new Option(x.park+' · '+x.name,x.id)));
 sel.addEventListener('change',()=>{if(sel.value)focusLandmark(sel.value)});
 const note=document.createElement('small');note.id='worldscope-v20-model-status';
 note.textContent='3D is optional. Detailed models of all rides are not yet available.';
 box.append(button,sel,note);area.append(box);
}
function attach(){
 if(typeof map==='undefined'||!map||boundMap===map)return;
 boundMap=map;
 map.on('load',()=>{nativePins();ensureModelLayer()});
 map.on('style.load',()=>{nativePins();if(modelActive)ensureModelLayer()});
 if(map.isStyleLoaded?.()){nativePins();ensureModelLayer()}
}
const formerInit=window.initMap;
if(typeof formerInit==='function')window.initMap=function(){formerInit();attach()};
function ready(){createControls();if(typeof map!=='undefined'&&map)attach();if(typeof map!=='undefined'&&map&&map.isStyleLoaded?.())nativePins()}
document.addEventListener('DOMContentLoaded',ready,{once:true});
window.addEventListener('worldscope-ready',ready);
if(document.readyState!=='loading')ready();
window.WorldscopeV20={catalog,refreshPins:nativePins,focusLandmark,toggleModels,get state(){return{modelActive,renderedPlaces,modelLayerLoaded:!!(typeof map!=='undefined'&&map?.getLayer?.(modelLayer))}}};
})();