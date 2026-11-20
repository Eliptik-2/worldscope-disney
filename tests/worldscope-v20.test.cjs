const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('worldscope-v20.js','utf8');
const items=[
 {id:2,name:'Space Mountain',park:'Magic Kingdom',category:'Rides',lat:28.41915,lon:-81.57725},
 {id:3,name:'Seven Dwarfs Mine Train',park:'Magic Kingdom',category:'Rides',lat:28.42063,lon:-81.58005},
 {id:8,name:'Peter Pan’s Flight',park:'Magic Kingdom',category:'Rides',lat:28.42015,lon:-81.582},
 {id:199,name:'Unmapped experience',park:'Magic Kingdom',category:'Experience',lat:null,lon:null}
];
let layers={},sources={},listeners={},clickID=null,markerInstances=0;
const map={
 isStyleLoaded:()=>true,getLayer:id=>layers[id],getSource:id=>sources[id],
 addSource:(id,opts)=>{sources[id]={...opts,setData(data){this.data=data}}},
 addLayer:l=>{layers[l.id]=l},
 removeLayer:id=>{delete layers[id]},
 on:(name,...args)=>{(listeners[name]??=[]).push(args);if(name==='click'&&args[0]==='worldscope-v20-pins')clickID=args[0]},
 getCanvas:()=>({style:{}}),triggerRepaint(){},flyTo(){},easeTo(){}
};
const maplibregl={MercatorCoordinate:{fromLngLat:()=>({x:.35,y:.65,z:0,meterInMercatorCoordinateUnits:()=>1e-7})}};
const document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}};
let selected=null;
const window={initMap(){},addEventListener(){},maplibregl,WorldscopeV19:{redraw(){}}};
const validCoords=e=>Number.isFinite(e.lat)&&Number.isFinite(e.lon);
vm.runInNewContext(source,{window,document,map,maplibregl,items,validCoords,COORD:{'Magic Kingdom':[-81.5812,28.4187]},findEntry:id=>{selected=id},console,setTimeout,clearTimeout},{filename:'worldscope-v20.js'});
window.initMap();
assert.equal(sources['worldscope-v20-places'].data.features.length,4);
assert.equal(layers['worldscope-v20-pins'].type,'circle');
assert.equal(layers['worldscope-v20-labels'].type,'symbol');
assert.equal(clickID,'worldscope-v20-pins');
assert.equal(window.WorldscopeV20.state.renderedPlaces,3);
assert.equal(window.WorldscopeV20.catalog.length,7);
assert.equal(window.WorldscopeV20.catalog[0].name,'Spaceship Earth');
assert.equal(window.WorldscopeV20.state.modelActive,false);
assert.equal(markerInstances,0,'no HTML maplibre.Marker elements');
listeners.click.find(args=>args[0]==='worldscope-v20-pins')[1]({features:[{properties:{id:'8'}}]});
assert.equal(selected,'8','native pins continue to open attraction');
layers={};sources={};
listeners['style.load'].forEach(args=>args[0]());
assert.equal(sources['worldscope-v20-places'].data.features.length,4,'style reload reinstalls GPU pins');
assert.equal(layers['worldscope-v20-pins'].type,'circle');
window.WorldscopeV20.toggleModels(true); // No THREE loaded: safe fallback
assert.equal(window.WorldscopeV20.state.modelActive,true);
assert.equal(window.WorldscopeV20.state.modelLayerLoaded,false);
window.WorldscopeV20.toggleModels(false);
console.log('PASS v2.0: GPU pin layers, clicks, style reload, 7 landmarks and 3D-unavailable fallback');
