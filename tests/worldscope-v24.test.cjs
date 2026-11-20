const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('worldscope-v24.js','utf8');
const a={lat:28.37552,lon:-81.54695,park:'EPCOT'},b={lat:28.36889,lon:-81.55255,park:'EPCOT'};
const layers={gray:{id:'gray',type:'fill-extrusion',layout:{visibility:'visible'}},walk:{id:'walk',type:'line'}};
const sources={};
const map={
 isStyleLoaded(){return true},getStyle(){return {layers:Object.values(layers)}},
 getLayer(id){return layers[id]},getSource(id){return sources[id]},
 getLayoutProperty(id,k){return layers[id]?.layout?.[k]||'visible'},
 setLayoutProperty(id,k,v){layers[id].layout={...layers[id].layout,[k]:v}},
 moveLayer(){},on(){},addSource(id,d){sources[id]={...d,setData(data){this.data=data}}},
 addLayer(layer){layers[layer.id]=layer},removeLayer(id){delete layers[id]},removeSource(id){delete sources[id]}
};
const window={planRoute:async()=>{},clearRoute(){},addEventListener(){},WorldscopeJourney:{redraw(){},reset(){}}};
const document={readyState:'loading',getElementById(){return null},addEventListener(){},querySelector(){return null}};
const decodePolyline6=shape=>shape==='valid'
 ?[[-81.54695,28.37552],[-81.5485,28.3746],[-81.5512,28.3709],[-81.55255,28.36889]]
 :shape==='outside'?[[0,0],[1,1]]
 :[[-81.54695,28.37552],[-81.56,28.38],[-81.55255,28.36889]];
vm.runInNewContext(source,{window,document,map,decodePolyline6,
 withinResort:(lon,lat)=>lon>-81.625&&lon<-81.49&&lat>28.33&&lat<28.45,
 console:{warn(){}},fetch(){},AbortController,queueMicrotask,setTimeout,clearTimeout},
 {filename:'worldscope-v24.js'});
assert.equal(window.WorldscopeV24.hideGrayBuildings(),1);
assert.equal(layers.gray.layout.visibility,'none');
layers.gray.layout.visibility='visible';
assert.equal(window.WorldscopeV24.hideGrayBuildings(),1);
assert.equal(layers.gray.layout.visibility,'none');
const valid=window.WorldscopeV24.validRoute(
 {trip:{legs:[{shape:'valid'}],summary:{time:700}}},a,b);
assert.ok(valid);assert.equal(valid.coords.length,4);
assert.ok(valid.meters>800&&valid.meters<2000);
assert.equal(window.WorldscopeV24.validRoute(
 {trip:{legs:[{shape:'outside'}],summary:{time:100}}},a,b),null);
assert.equal(window.WorldscopeV24.validRoute(
 {trip:{legs:[{shape:'long'}],summary:{time:100}}},a,b),null);
assert.equal(window.WorldscopeV24.distanceMeters(a,a),0);
assert.ok(window.WorldscopeV24.distanceMeters(a,b)>700);
assert.equal(typeof window.planRoute,'function');
console.log('PASS v2.4: no generic gray buildings, valid route and impossible path rejection');
