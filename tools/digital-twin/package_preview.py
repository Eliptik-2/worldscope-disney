from pathlib import Path
import json, shutil, sys
root=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1]); output=Path(sys.argv[2])
regions=('magic-kingdom','epcot','hollywood-studios','animal-kingdom','disney-springs','boardwalk')
manifest=json.loads((source/'viewer/scenes/manifest.json').read_text())
assert manifest['version']==1 and manifest['fixture'] is False
selected=[r for r in manifest['regions'] if r['id'] in regions]
assert len(selected)==len(regions) and {r['id'] for r in selected}==set(regions)
output.mkdir(parents=True,exist_ok=True)
for p in root.iterdir():
 if p.is_file() and p.suffix in ('.html','.js','.css','.json','.webmanifest'): shutil.copy2(p,output/p.name)
target=output/'architecture'; scenes=target/'scenes'; scenes.mkdir(parents=True,exist_ok=True)
shutil.copy2(source/'viewer/index.html',target/'index.html')
for r in selected:
 assert r['file']==r['id']+'.json' and r['count']>0
 src=source/'viewer/scenes'/r['file']; d=json.loads(src.read_text())
 assert d['fixture'] is False and len(d['features'])==r['count']
 shutil.copy2(src,scenes/r['file'])
manifest['regions']=selected
(scenes/'manifest.json').write_text(json.dumps(manifest,indent=2))
shutil.copy2(root/'docs/DIGITAL_TWIN.md',target/'SOURCE_AND_LIMITATIONS.md')
shutil.copytree(source/'raw',target/'source-data',dirs_exist_ok=True)
shutil.copytree(source/'processed',target/'processed-data',dirs_exist_ok=True)
print('Packaged six checked architectural study scenes with source data; wider resort rectangle excluded.')
