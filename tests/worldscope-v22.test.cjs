const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('worldscope-v22.js','utf8');
const directions=fs.readFileSync('worldscope-v22-directions.js','utf8');
new Function(source);new Function(directions);
const doc={readyState:'loading',addEventListener(){}};
const win={addEventListener(){}};
vm.runInNewContext(source,{window:win,document:doc,console},{filename:'worldscope-v22.js'});
assert.equal(win.WorldscopeV22,win.WorldscopeV21);
const types=['sphere','castle','space','tron','tower','tree','pandora'];
for(const type of types){
 const m=win.WorldscopeV22.build(type),v=m.vertices,ix=m.indices;
 assert.equal(v.length%9,0,type+' vertex stride');
 assert.equal(ix.length%3,0,type+' triangle indices');
 assert.ok(ix.length>1200,type+' must have detail');
 assert.ok(v.length/9<=65535,type+' mobile index capacity');
 assert.ok([...v].every(Number.isFinite),type+' has invalid coordinate');
 assert.ok([...ix].every(i=>i<v.length/9),type+' references missing vertex');
 console.log(type+' mesh: '+v.length/9+' vertices, '+ix.length/3+' triangles');
}
const castle=win.WorldscopeV22.build('castle');
const sphere=win.WorldscopeV22.build('sphere');
assert.ok(castle.indices.length>sphere.indices.length,'castle more detailed than sphere');
for(const name of ["['Food','Food / dining']","['Shops','Shops']","['Alcohol','Bars / drinks']"])assert.ok(directions.includes(name));
assert.ok(directions.includes('No verified location'));
console.log('PASS v2.2: seven self-contained models and category-aware directions fallback');