import importlib.util,json,pathlib,base64,struct,unittest
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('build_scene',root/'build_scene.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
def rect(x,y,w,h):return [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]
def f(id,rings,**props):return {'type':'Feature','id':id,'geometry':{'type':'Polygon','coordinates':rings},'properties':{'kind':'building','name':'Synthetic '+id,**props}}
origin=(-81.55,28.375);x,y=origin
features=[f('gable',[rect(x,y,.0003,.00016)],height_m=18,roof_shape='gabled',roof_height_m=5,roof_direction_deg=90,roof_color='#b87052'), f('courtyard',[rect(x+.00045,y,.00024,.00024),rect(x+.00050,y+.00005,.00012,.00012)],height_m=12), f('unknown',[rect(x,y+.00032,.00015,.00019)]),f('flat',[rect(x+.00026,y+.00035,.00029,.00012)],height_m=9,roof_shape='hipped'),f('invalid-height',[rect(x-.0002,y+.00022,.00015,.00012)],height_m=4,min_height_m=8),f('far-away',[rect(-80,27,.0002,.0002)],height_m=10)]
bounds=[x-.0005,y-.0003,x+.0009,y+.0008]
class TestScene(unittest.TestCase):
 def test_scene(self):
  s=b.make_region(features,bounds,fixture=True);self.assertEqual(len(s['features']),5);self.assertEqual(s['counts'],{'source-gable':1,'height-massing':2,'footprint-only':2});self.assertTrue(s['fixture']);self.assertEqual(len(base64.b64decode(s['vertices'])),s['vertexCount']*24);self.assertTrue(all(o['height'] is None for o in s['features'] if o['mode']=='footprint-only'));self.assertEqual(s['vertexCount']%3,0);v=struct.unpack('<%df'%(s['vertexCount']*6),base64.b64decode(s['vertices']));self.assertAlmostEqual(max(v[2::6]),18);self.assertGreater(s['vertexCount'],100)
 def test_parts(self):
  a=f('parent',[rect(x,y,.0004,.0002)],height_m=11);p=f('partA',[rect(x,y,.0002,.0002)],kind='building_part',parent_id='parent',height_m=10);q=f('partB',[rect(x+.0002,y,.0002,.0002)],kind='building_part',parent_id='parent',height_m=15);s=b.make_region([a,p,q],bounds);self.assertEqual({v['id'] for v in s['features']},{'partA','partB'});s=b.make_region([a,p],bounds);self.assertEqual([v['id'] for v in s['features']],['parent'])
if __name__=='__main__':
 s=b.make_region(features,bounds,fixture=True);(root/'synthetic-scene.json').write_text(json.dumps(s,separators=(',',':')));unittest.main()
