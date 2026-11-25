const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../worldscope-v26-architecture.js'),'utf8');
const states={color:false},handlers={},layers={line:{id:'line',type:'line'},gray:{id:'gray',type:'fill-extrusion'}};
const map={isStyleLoaded:()=>true,getStyle:()=>({sources:{openmaptiles:{type:'vector'}},layers:Object.values(layers)}),
 getLayer:id=>layers[id],getLayoutProperty:(id,p)=>layers[id]?.layout?.[p],
 addLayer:(x)=>{layers[x.id]=x},removeLayer:id=>delete layers[id],
 setLayoutProperty:(id,p,v)=>{layers[id].layout??={};layers[id].layout[p]=v},
 on:(ev,fn)=>{(handlers[ev]??=[]).push(fn)},getSource:()=>null};
const doc={readyState:'loading',body:{classList:{contains:(name)=>name==='ws23-three-d'&&states.color}},
 addEventListener(){},querySelector:()=>null,getElementById:()=>null};
const win={initMap:()=>{},addEventListener(){}};
vm.runInNewContext(src,{window:win,document:doc,map,console,queueMicrotask:fn=>fn()},{filename:'worldscope-v26-architecture.js'});
const api=win.WorldscopeArchitecture26;
win.initMap();
assert.ok(layers['worldscope-v26-architecture'],'new building layer registered');
assert.equal(layers['worldscope-v26-architecture'].type,'fill-extrusion');
assert.equal(layers['worldscope-v26-architecture'].source,'openmaptiles');
assert.equal(layers['worldscope-v26-architecture'].layout.visibility,'none','Atlas starts flat');
states.color=true;api.sync();
assert.equal(layers['worldscope-v26-architecture'].layout.visibility,'visible','Color 3D enables footprints');
states.color=false;api.sync();
assert.equal(layers['worldscope-v26-architecture'].layout.visibility,'none','Atlas hides footprints without destroying layer');
states.color=true;api.sync();
assert.equal(layers['worldscope-v26-architecture'].layout.visibility,'visible','3D reenable works');
assert.ok(layers.line,'route line retained');
assert.ok(api.state.layerPresent,'API reports registered geometry');
const old=layers['worldscope-v26-architecture'];
handlers['style.load']?.forEach(fn=>fn());
assert.equal(layers['worldscope-v26-architecture'],old,'style callback does not duplicate 3D layer');
console.log('PASS: OSM vector footprints, flat Atlas, colored 3D toggles, layer persistence, route retention');
