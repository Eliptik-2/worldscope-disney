import assert from "node:assert/strict";
import {prepare} from "./prepare-buildings.mjs";
const box=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d],[a,b]];
const outer=box(-81.59,28.41,-81.58,28.42),hole=box(-81.586,28.414,-81.584,28.416);
const f=(id,geometry,properties={})=>({type:"Feature",id,geometry,properties});
const fc=features=>({type:"FeatureCollection",features});
const polygon={type:"Polygon",coordinates:[outer,hole]};
const source={height:14,min_height:0,roof_shape:"gabled",roof_height:4,sources:[{dataset:"test fixture"}]};
const result=prepare(fc([f("A",polygon,source),f("B",{type:"Polygon",coordinates:[box(-81.56,28.36,-81.55,28.37)]},{height:null}),f("A",polygon),f("bad",{type:"Polygon",coordinates:[[[0,0],[1,1]]]})]),fc([f("P",polygon,{building_id:"A",height:3,min_height:5})]),[
 {id:1,name:"A",category:"Rides",lon:-81.589,lat:28.412},
 {id:2,name:"Courtyard",category:"Shops",lon:-81.585,lat:28.415},
 {id:3,name:"No pin",category:"Food",lon:null,lat:null}]);
assert.equal(result.report.counts.buildings,2);
assert.equal(result.report.counts.parts,1);
assert.equal(result.report.counts.orphan_parts,0);
assert.equal(result.report.counts.buildings_with_source_height,1);
assert.equal(result.features.features[1].properties.height_m,null);
assert.equal(result.features.features[2].properties.min_height_m,5);
assert.equal(result.report.matches[0].status,"one_candidate_needs_review");
assert.equal(result.report.matches[1].status,"no_containing_footprint");
assert.equal(result.report.matches[2].status,"coordinate_needed");
assert.ok(result.report.matches.every(x=>x.verified_guest_entrance===false));
assert.throws(()=>prepare(fc([]),fc([]),[]),/No valid buildings/);
console.log("PASS: provenance, polygons with holes, building parts, unknown heights, duplicate IDs, invalid geometry, candidate matching, empty input.");
