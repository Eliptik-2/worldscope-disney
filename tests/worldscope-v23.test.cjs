const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('worldscope-v23-models.js','utf8');
const window={addEventListener(){}};
const document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}};
vm.runInNewContext(source,{window,document,console},{filename:'worldscope-v23-models.js'});
const app=window.WorldscopeV22;
assert.ok(app,'Worldscope model API must exist');
assert.equal(app.catalog.length,9,'seven core landmarks plus two Main Street streetscapes');
const ids=new Set();
for(const site of app.catalog){
 assert.ok(!ids.has(site.id),'unique landmark IDs');
 ids.add(site.id);
 const geometry=app.build(site.type);
 assert.ok(geometry.vertices.length>0 && geometry.indices.length>0,site.id+' has geometry');
 assert.equal(geometry.vertices.length%9,0);
 assert.equal(geometry.indices.length%3,0);
 const vertexCount=geometry.vertices.length/9;
 assert.ok(vertexCount<65536,site.id+' fits UNSIGNED_SHORT indexing');
 let max=-1;for(const index of geometry.indices){max=Math.max(max,index);}
 assert.ok(max<vertexCount,site.id+' triangle indices are valid');
 for(const num of geometry.vertices)assert.ok(Number.isFinite(num),site.id+' has no NaNs');
}
assert.ok(app.catalog.some(x=>x.type==='streetwest'));
assert.ok(app.catalog.some(x=>x.type==='streeteast'));
assert.equal(typeof app.refreshPins,'function','mapped locations can refresh after personal pinning');
const data=JSON.parse(fs.readFileSync('data.json','utf8'));
const chefs=data.find(x=>x.park==='EPCOT'&&x.name==='Chefs de France');
assert.ok(chefs&&chefs.lat>28.36&&chefs.lon< -81.55,'Chefs de France reference coordinate present');
const mapped=data.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));
assert.ok(mapped.length>=32,'at least 32 mapped venue references');
console.log('PASS v2.3: 9 independent indexed meshes; 32+ venue points; personal pin refresh');
