const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('worldscope-v19.js','utf8');
const sources={},events={};
let redraws=0,styleChanges=0,buildToggles=0;
const layers={
 'base-land':{id:'base-land',type:'fill'},
 'roads':{id:'roads',type:'line'},
 'labels':{id:'labels',type:'symbol'},
 'worldscope-v18-link-halo':{id:'worldscope-v18-link-halo',type:'line',source:'worldscope-v18-link'},
 'worldscope-v18-link-line':{id:'worldscope-v18-link-line',type:'line',source:'worldscope-v18-link'}
};
sources['worldscope-v18-link']={type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:[[-81.5561,28.3674],[-81.57876,28.41574]]}}};
const map={
 isStyleLoaded:()=>true,
 getStyle:()=>({layers:Object.values(layers),sources:{openmaptiles:{type:'vector'}}}),
 getSource:id=>sources[id],addSource:(id,opts)=>{sources[id]=opts},
 getLayer:id=>layers[id],addLayer:(l,before)=>{layers[l.id]={...l,beforeId:before||null}},
 setLayoutProperty:(id,k,value)=>{assert.ok(layers[id]);layers[id].layout={...layers[id].layout,[k]:value}},
 moveLayer(){},resize(){},easeTo(){},
 setStyle(){styleChanges++},
 on:(event,fn)=>(events[event]??=[]).push(fn),
 once:(event,fn)=>(events[event]??=[]).push(fn)
};
const handlers={};
const buttonRow={replaceChildren(){},append(){}};
const document={
 readyState:'loading',addEventListener:(event,fn)=>{handlers[event]=fn},
 getElementById:id=>id==='mapModes'?buttonRow:null,
 querySelector:()=>null,querySelectorAll:()=>[],
 createElement:()=>({dataset:{},addEventListener(){},setAttribute(){},append(){}})
};
const window={
 initMap(){},
 worldscopeToggleBuildings(){buildToggles++},
 enableBuildings(){},
 planRoute:async()=>{},
 addEventListener(){},
 WorldscopeJourney:{redraw(){redraws++}}
};
const fakeConsole={warn(){},debug(){}};
vm.runInNewContext(script,{window,document,map,MutationObserver:class{observe(){}},console:fakeConsole,setTimeout},{filename:'worldscope-v19.js'});
if(handlers.DOMContentLoaded)handlers.DOMContentLoaded();
assert.equal(buildToggles,1,'default scenic view disables the blocky 3D models');
const modes=[
 ['hd','visible','none'],
 ['color','none','none'],
 ['satellite','none','visible'],
 ['hd','visible','none']
];
for(const [name,hd,usgs]of modes){
 window.WorldscopeV19.changeMode(name);
 assert.equal(layers['worldscope-v19-hd'].layout.visibility,hd);
 assert.equal(layers['worldscope-v19-usgs'].layout.visibility,usgs);
 assert.ok(layers['worldscope-v18-link-line'],'bus link route must remain');
 assert.ok(sources['worldscope-v18-link'],'bus geometry must remain');
}
assert.equal(styleChanges,0,'no setStyle calls during basemap toggles');
assert.ok(redraws>=4,'route overlay redrawn after map mode changes');
assert.equal(layers['worldscope-v19-hd'].beforeId,'labels','raster sits below vector labels');
console.log('PASS v1.9: no style replacement; route persists in all modes; aerial under labels; 3D optional');
