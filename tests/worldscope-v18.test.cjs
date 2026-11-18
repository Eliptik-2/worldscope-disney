const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('worldscope-v18.js','utf8');
function environment(fetcher){
 let sources={},layers={},handlers={},markers=0;
 const map={
  isStyleLoaded:()=>true,
  on:(event,fn)=>(handlers[event]??=[]).push(fn),
  getSource:id=>sources[id],addSource:(id,settings)=>{sources[id]={...settings,setData(data){this.data=data}}},
  getLayer:id=>layers[id],addLayer:layer=>{layers[layer.id]=layer},
  removeLayer:id=>{delete layers[id]},removeSource:id=>{delete sources[id]},
  fitBounds(){},flyTo(){}
 };
 class Marker{
  constructor(){this.active=false}
  setLngLat(){return this}setPopup(){return this}
  addTo(){this.active=true;markers++;return this}
  remove(){if(this.active)markers--;this.active=false}
 }
 class Popup{setDOMContent(){return this}}
 class AbortController{constructor(){this.signal={addEventListener(){},removeEventListener(){}}}abort(){}}
 const document={
  readyState:'loading',addEventListener(){},getElementById(){return null},
  createElement(){return {setAttribute(){},addEventListener(){},append(){},style:{}}}
 };
 const window={showTransitPlan(){},clearRoute(){},initMap(){},renderRouteLine(){},showTransferNeeded(){},planRoute(){},maplibregl:{Marker,Popup}};
 const context={window,document,map,maplibregl:{Marker,Popup},fetch:fetcher,AbortController,
  setTimeout:fn=>{fn();return 1},clearTimeout(){},console,COORD:{'Magic Kingdom':[-81.5812,28.4187]},
  decodePolyline6:shape=>shape==='road'?[[-81.5561,28.3674],[-81.565,28.39],[-81.57876,28.41574]]:[[-81.57876,28.41574],[-81.5802,28.417],[-81.5807,28.4205]]};
 vm.createContext(context);vm.runInContext(source,context,{filename:'worldscope-v18.js'});
 return{map,window,handlers,get sources(){return sources},get layers(){return layers},get markers(){return markers},clearStyle(){sources={};layers={}},emit:evt=>handlers[evt]?.forEach(fn=>fn())};
}
const wait=async()=>{for(let n=0;n<10;n++)await Promise.resolve()};
const dest={name:'Seven Dwarfs Mine Train',park:'Magic Kingdom',lon:-81.5807,lat:28.4205};
const start={name:'BoardWalk',park:'BoardWalk',lon:-81.5561,lat:28.3674};
const bus={mode:'bus',park:'Magic Kingdom'};
(async()=>{
 const offline=environment(async()=>{throw Error('offline')});
 offline.window.showTransitPlan(start,dest,bus);await wait();
 assert.equal(offline.window.WorldscopeJourney.snapshot.kind,'bus');
 assert.equal(offline.window.WorldscopeJourney.snapshot.stops,3);
 assert.equal(offline.markers,3);
 assert.deepEqual([...offline.window.WorldscopeJourney.snapshot.lines],['link']);
 assert.ok(offline.sources['worldscope-v18-link']);
 offline.clearStyle();offline.emit('style.load');
 assert.ok(offline.sources['worldscope-v18-link'],'route overlay returns after base map style switch');
 offline.window.WorldscopeJourney.reset();
 assert.equal(offline.markers,0);
 assert.deepEqual(Object.keys(offline.sources),[]);
 const online=environment(async url=>{
  const auto=url.includes('costing%22%3A%22auto');
  return{ok:true,json:async()=>({trip:{summary:{length:auto?8.5:0.9},legs:[{shape:auto?'road':'walk'}]}})};
 });
 online.window.showTransitPlan(start,dest,bus);await wait();
 assert.deepEqual([...online.window.WorldscopeJourney.snapshot.lines].sort(),['bus','walk']);
 assert.ok(online.sources['worldscope-v18-bus']);
 assert.ok(online.sources['worldscope-v18-walk']);
 online.clearStyle();online.emit('style.load');
 assert.ok(online.sources['worldscope-v18-walk']);
 assert.ok(online.sources['worldscope-v18-bus']);
 console.log('PASS v1.8 route overlays: offline stops, online two legs, style reload and cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
