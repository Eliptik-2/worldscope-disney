// Worldscope digital twin: normalize actual Overture building and part geometry.
// Never invent a height, footprint, entrance, asset, or building association.
// ODbL provenance must be retained with all derived building data.
export const STUDY_BOUNDS=[-81.66,28.30,-81.50,28.45];
export const positive=x=>typeof x==="number"&&Number.isFinite(x)&&x>0;
const nonnegative=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
const str=x=>typeof x==="string"&&x.trim()?x.trim():null;
const hex=x=>typeof x==="string"&&/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(x)?x:null;
const point=x=>Array.isArray(x)&&x.length>=2&&Number.isFinite(x[0])&&Number.isFinite(x[1])&&Math.abs(x[0])<=180&&Math.abs(x[1])<=90;
function ringOK(r){return Array.isArray(r)&&r.length>=4&&r.every(point)&&r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1]&&Math.abs(r.slice(0,-1).reduce((sum,p,i)=>sum+p[0]*r[i+1][1]-r[i+1][0]*p[1],0))>1e-15}
function polygons(g){if(g?.type==="Polygon")return [g.coordinates];if(g?.type==="MultiPolygon")return g.coordinates;return []}
function geometryOK(g){const p=polygons(g);return Array.isArray(p)&&p.length>0&&p.every(x=>Array.isArray(x)&&x.length>0&&x.every(ringOK))}
function bounds(g){let b=[Infinity,Infinity,-Infinity,-Infinity];for(const p of polygons(g))for(const r of p)for(const c of r){b[0]=Math.min(b[0],c[0]);b[1]=Math.min(b[1],c[1]);b[2]=Math.max(b[2],c[0]);b[3]=Math.max(b[3],c[1])}return b}
const overlaps=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
function insideRing(p,r){let yes=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
function contains(p,g){return polygons(g).some(poly=>insideRing(p,poly[0])&&!poly.slice(1).some(r=>insideRing(p,r)))}
function normalize(f,kind,seen){
 const p=f?.properties||{},id=str(p.id)||str(f?.id);
 if(!id||seen.has(id)||!geometryOK(f.geometry)||!overlaps(bounds(f.geometry),STUDY_BOUNDS))return null;
 seen.add(id);if(p.is_underground===true)return null;
 const height=positive(p.height)?p.height:null,base=nonnegative(p.min_height)?p.min_height:null;
 const parent=kind==="building_part"?str(p.building_id):null;
 return {type:"Feature",id,geometry:f.geometry,properties:{
  id,kind,parent_id:parent,name:str(p.names?.primary),height_m:height,min_height_m:base,
  height_status:height!==null?"source_reported":"unknown",
  floors:positive(p.num_floors)?p.num_floors:null,min_floor:nonnegative(p.min_floor)?p.min_floor:null,
  roof_shape:str(p.roof_shape),roof_height_m:nonnegative(p.roof_height)?p.roof_height:null,
  roof_direction_deg:nonnegative(p.roof_direction)&&p.roof_direction<360?p.roof_direction:null,
  roof_orientation:str(p.roof_orientation),facade_color:hex(p.facade_color),roof_color:hex(p.roof_color),
  facade_material:str(p.facade_material),roof_material:str(p.roof_material),
  source_version:p.version??null,sources:Array.isArray(p.sources)?p.sources:[],
  license:"ODbL-1.0",geometry_status:"source_footprint_or_roofprint",has_parts:p.has_parts===true,
  // Null base and height stay unknown; renderer may explicitly show a labelled estimate, never a verified measurement.
 }};
}
export function prepare(buildings,parts,directory){
 if(buildings?.type!=="FeatureCollection"||parts?.type!=="FeatureCollection"||!Array.isArray(buildings.features)||!Array.isArray(parts.features)||!Array.isArray(directory))throw Error("Invalid source collection");
 const seen=new Set(),b=buildings.features.map(x=>normalize(x,"building",seen)).filter(Boolean),p=parts.features.map(x=>normalize(x,"building_part",seen)).filter(Boolean);
 if(!b.length)throw Error("No valid buildings in the study area; no output permitted.");
 const parents=new Set(b.map(f=>f.id));
 const matches=directory.filter(x=>["Rides","Shops","Food","Alcohol"].includes(x.category)).map(e=>{
  const hasPoint=Number.isFinite(e.lon)&&Number.isFinite(e.lat);
  const hits=hasPoint?b.filter(f=>contains([e.lon,e.lat],f.geometry)).map(f=>f.id):[];
  return {entry_id:e.id,name:e.name,park:e.park,category:e.category,
   status:!hasPoint?"coordinate_needed":hits.length===1?"one_candidate_needs_review":hits.length>1?"ambiguous_needs_review":"no_containing_footprint",
   candidate_building_ids:hits,verified_guest_entrance:false,architectural_asset:null};
 });
 const fc={type:"FeatureCollection",features:[...b,...p]};
 const report={study_bounds:STUDY_BOUNDS,warning:"Study rectangle is not a verified Disney property boundary. Outside-resort features may occur; clip before rendering.",
  data_license:"ODbL-1.0",source:"Overture Maps Buildings",
  counts:{buildings:b.length,parts:p.length,orphan_parts:p.filter(f=>!parents.has(f.properties.parent_id)).length,
  buildings_with_source_height:b.filter(f=>f.properties.height_m!==null).length,
  buildings_with_roof_shape:b.filter(f=>f.properties.roof_shape!==null).length,
  excluded_buildings:buildings.features.length-b.length,excluded_parts:parts.features.length-p.length,
  directory_entries:matches.length,coordinate_needed:matches.filter(x=>x.status==="coordinate_needed").length,
  candidate_needs_review:matches.filter(x=>x.status==="one_candidate_needs_review").length},
  matches};
 return {features:fc,report};
}
