"""Build streamed park-area meshes from normalized Overture GeoJSON, no invented heights.
Source fields: tools/digital-twin/prepare-buildings.mjs. Geometry is massing, not a survey.
"""
import argparse, base64, json, math, pathlib, struct
from shapely import constrained_delaunay_triangles, make_valid
from shapely.geometry import shape, Polygon, MultiPolygon, LineString, box
from shapely.ops import transform, split, unary_union

REGIONS = {
 'magic-kingdom': ('Magic Kingdom', [-81.592,28.412,-81.573,28.427]),
 'epcot': ('EPCOT', [-81.558,28.365,-81.542,28.381]),
 'hollywood-studios': ('Hollywood Studios', [-81.569,28.350,-81.552,28.365]),
 'animal-kingdom': ('Animal Kingdom', [-81.602,28.346,-81.581,28.365]),
 'disney-springs': ('Disney Springs', [-81.534,28.366,-81.512,28.379]),
 'boardwalk': ('BoardWalk / Crescent Lake', [-81.561,28.359,-81.546,28.373]),
 'resort-study': ('Walt Disney World study area', [-81.66,28.30,-81.50,28.45]),
}
def polygons(g):
 if isinstance(g,Polygon): return [g] if g.area>0 else []
 if hasattr(g,'geoms'): return [p for child in g.geoms for p in polygons(child)]
 return []
def number(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)
def color(v,default):
 if isinstance(v,str) and v.startswith('#'):
  try:
   s=v[1:]; s=''.join(x*2 for x in s) if len(s)==3 else s
   if len(s)==6: return tuple(int(s[i:i+2],16)/255 for i in (0,2,4))
  except ValueError: pass
 return default
def shade(c,v): return tuple(max(0,min(1,x*v)) for x in c)
def transform_region(b):
 lon=(b[0]+b[2])/2;lat=(b[1]+b[3])/2;dx=111319.49*math.cos(math.radians(lat));dy=111319.49
 return (lon,lat),lambda x,y,z=None:((x-lon)*dx,(y-lat)*dy)
def roof_profile(poly,p,base,h):
 """Only model a gable where source specifies shape, roof height and ridge orientation."""
 rh=p.get('roof_height_m'); direction=p.get('roof_direction_deg'); ori=p.get('roof_orientation')
 if p.get('roof_shape') not in ('gabled','gable') or not number(rh) or not 0<rh<h-base or poly.interiors: return None
 rect=poly.minimum_rotated_rectangle
 if not rect.area or poly.area/rect.area<.93:return None
 if number(direction) and 0<=direction<360:
  ux,uy=math.sin(math.radians(direction)),math.cos(math.radians(direction))
 elif ori in ('along','across'):
  rr=list(rect.exterior.coords);e=[(rr[i+1][0]-rr[i][0],rr[i+1][1]-rr[i][1]) for i in range(4)];ux,uy=max(e,key=lambda t:math.hypot(*t));ln=math.hypot(ux,uy);ux/=ln;uy/=ln
  if ori=='across':ux,uy=-uy,ux
 else:return None
 nx,ny=-uy,ux;vals=[nx*x+ny*y for x,y in poly.exterior.coords];mid=(min(vals)+max(vals))/2;half=(max(vals)-min(vals))/2
 if half<.1:return None
 c=poly.centroid;shift=mid-(nx*c.x+ny*c.y);cx,cy=c.x+nx*shift,c.y+ny*shift
 span=max(poly.bounds[2]-poly.bounds[0],poly.bounds[3]-poly.bounds[1])*4+10
 cutter=LineString([(cx-ux*span,cy-uy*span),(cx+ux*span,cy+uy*span)])
 pieces=polygons(split(poly,cutter))
 if len(pieces)!=2:return None
 return pieces,lambda x,y:h-rh*min(1,abs(nx*x+ny*y-mid)/half)
def feature_mesh(poly,p):
 # A supplied height is a source-reported top elevation relative to ground, not a surveyed measurement.
 h=p.get('height_m');b=p.get('min_height_m');known=number(h) and h>0 and (not number(b) or 0<=b<h)
 base=b if known and number(b) else 0.;h=h if known else 0.03
 roof=roof_profile(poly,p,base,h) if known else None
 roofc=color(p.get('roof_color'),(.72,.69,.60)) if known else (.35,.49,.55)
 wallc=color(p.get('facade_color'),(.83,.75,.61));rows=[]
 def tri(a,b,c,col):
  for x,y,z in [a,b,c]:rows.extend((x,y,z,*col))
 roofpieces,zfun=roof if roof else ([poly],lambda x,y:h)
 for piece in roofpieces:
  for t in polygons(constrained_delaunay_triangles(piece)):
   pts=list(t.exterior.coords)[:3]
   tri(*[(x,y,zfun(x,y)) for x,y in pts],roofc)
 if known:
  # Split wall edges at a ridge intersection so gable end walls reach the roof profile.
  for ring in [poly.exterior,*poly.interiors]:
   for a,b in zip(list(ring.coords),list(ring.coords)[1:]):
    seg=LineString([a,b]);points=[a,b]
    if roof:
     shared=roofpieces[0].boundary.intersection(roofpieces[1].boundary);cross=seg.intersection(shared)
     if cross.geom_type=='Point' and cross.distance(shape({'type':'Point','coordinates':a}))>1e-6 and cross.distance(shape({'type':'Point','coordinates':b}))>1e-6:points=[a,(cross.x,cross.y),b]
    for a1,b1 in zip(points,points[1:]):
     dx,dy=b1[0]-a1[0],b1[1]-a1[1];ln=math.hypot(dx,dy) or 1;col=shade(wallc,.67+.30*abs((dy*.65-dx*.76)/ln))
     v0=(*a1,base);v1=(*b1,base);v2=(*b1,zfun(*b1));v3=(*a1,zfun(*a1));tri(v0,v1,v2,col);tri(v0,v2,v3,col)
 return rows,('source-gable' if roof else 'height-massing' if known else 'footprint-only')
def make_region(features,bounds,*,fixture=False):
 origin,project=transform_region(bounds);extent=box(*bounds);selected=[]
 for f in features:
  try:
   geom=make_valid(shape(f['geometry']));p=f['properties'];
   if geom.is_empty or not geom.intersects(extent):continue
   # retain complete source polygons that intersect the approximate study window
   geom=transform(project,geom)
   if polygons(geom):selected.append((f,geom))
  except Exception:continue
 byparent={}
 for f,g in selected:
  if f['properties'].get('kind')=='building_part':byparent.setdefault(f['properties'].get('parent_id'),[]).append((f,g))
 parentids={f['id'] for f,g in selected if f['properties'].get('kind')=='building'};useparts=set()
 for f,g in selected:
  if f['properties'].get('kind')!='building':continue
  parts=byparent.get(f['id'],[])
  if parts and all(number(x['properties'].get('height_m')) and x['properties']['height_m']>0 for x,_ in parts):
   if unary_union([q for _,q in parts]).intersection(g).area/max(g.area,1) >= .95:useparts.add(f['id'])
 vertices=[];objects=[];counts={'source-gable':0,'height-massing':0,'footprint-only':0}
 for f,g in selected:
  p=f['properties'];kind=p.get('kind');parent=p.get('parent_id')
  if kind=='building' and f['id'] in useparts:continue
  if kind=='building_part' and parent in parentids and parent not in useparts:continue
  start=len(vertices)//6;modes=[]
  for poly in polygons(g):
   mesh,mode=feature_mesh(poly,p);vertices.extend(mesh);modes.append(mode)
  if not modes:continue
  mode='source-gable' if 'source-gable' in modes else 'height-massing' if 'height-massing' in modes else 'footprint-only';counts[mode]+=1
  center=g.representative_point();objects.append({'id':f['id'],'name':p.get('name'),'center':[center.x,center.y,p.get('height_m') if number(p.get('height_m')) and mode!='footprint-only' else 0], 'height':p.get('height_m') if mode!='footprint-only' else None,'mode':mode,'roof':p.get('roof_shape'),'source':p.get('sources',[]),'start':start,'count':len(vertices)//6-start})
 # Little endian float32 vertex buffer, interleaved position (m) and RGB; triangle list.
 binary=struct.pack('<%df'%len(vertices),*vertices)
 return {'version':1,'fixture':fixture,'origin':origin,'bounds':bounds,'counts':counts,'features':objects,'vertices':base64.b64encode(binary).decode(),'vertexCount':len(vertices)//6,'warning':'Approximate study window; not a verified resort boundary. Source heights and roofprints may be inaccurate. Not a navigation map.'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('geojson');ap.add_argument('out');args=ap.parse_args();features=json.loads(pathlib.Path(args.geojson).read_text())['features'];out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True);manifest={'version':1,'source':'Overture Maps • ODbL-1.0','fixture':False,'regions':[]}
 for key,(name,bounds) in REGIONS.items():
  scene=make_region(features,bounds)
  if not scene['features']:continue
  path=key+'.json';(out/path).write_text(json.dumps(scene,separators=(',',':')));manifest['regions'].append({'id':key,'name':name,'file':path,'count':len(scene['features']),'counts':scene['counts']})
 if not manifest['regions']:raise SystemExit('No valid scene regions; refusing to publish empty dataset')
 (out/'manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(manifest,indent=2))
if __name__=='__main__':main()
