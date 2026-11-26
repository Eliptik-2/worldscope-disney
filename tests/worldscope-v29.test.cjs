const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={addEventListener(){}},document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}};
const ctx=vm.createContext({window,document,console});
for(const p of ['worldscope-v23-models.js','worldscope-v25-rides.js'])vm.runInContext(fs.readFileSync(p,'utf8'),ctx);
const land=window.WorldscopeV22,rides=window.WorldscopeRideAtlas25,castle=land.build('castle');
assert.ok(castle.triangles>10000,'castle detailed geometry');
for(const name of ['Cinderella Castle','Space Mountain','TRON Lightcycle / Run','Spaceship Earth','Tower of Terror','Haunted Mansion','Expedition Everest','Big Thunder Mountain Railroad','Seven Dwarfs Mine Train','Guardians of the Galaxy: Cosmic Rewind','Pirates of the Caribbean','Millennium Falcon: Smugglers Run','Mickey & Minnie’s Runaway Railway','Slinky Dog Dash','Frozen Ever After','Avatar Flight of Passage']){
 const m=rides.buildRide(rides.modelType(name,'Rides'),name);
 assert.ok(m.detail==='landmark'||m.detail==='named',name);
 assert.ok(m.vertices.length/9<65536&&m.vertices.every(Number.isFinite),name);
 assert.ok(m.indices.every(i=>i<m.vertices.length/9),name);
 const fitted=rides.fitGallery(m);assert.ok(fitted.vertices.every(Number.isFinite));
 console.log(name,m.indices.length/3,'triangles',m.detail);
}
