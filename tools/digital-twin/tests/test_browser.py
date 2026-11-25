from pathlib import Path
import json, sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
scene_file=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'synthetic-scene.json'
scene=json.loads(scene_file.read_text())
expected=len(scene['features'])
assert expected>0
sizes=[(1280,720),(390,844),(320,640)] if scene.get('fixture') else [(1280,720),(390,844)]
with sync_playwright() as p:
 browser=p.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').exists() else {}),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--use-gl=angle'])
 for w,h in sizes:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((root/'viewer/index.html').read_text());page.wait_for_function('!!window.WorldscopeTwin?.state.renderer')
  page.locator('#file').set_input_files(str(scene_file));page.wait_for_function('count=>WorldscopeTwin.state.featureCount===count',arg=expected);assert page.evaluate('WorldscopeTwin.state.fixture')==bool(scene.get('fixture'))
  page.locator('#flat').click();assert page.evaluate('WorldscopeTwin.state.mode')=='atlas';page.locator('#three').click();assert page.evaluate('WorldscopeTwin.state.mode')=='3d';before=page.evaluate('WorldscopeTwin.state.angle');page.locator('#turn').click();assert page.evaluate('WorldscopeTwin.state.angle')!=before
  before=page.evaluate('WorldscopeTwin.state.scale');page.locator('#plus').click();assert page.evaluate('WorldscopeTwin.state.scale')>before;page.locator('#reset').click();page.mouse.move(w*.55,h*.44);page.mouse.down();page.mouse.move(w*.65,h*.50,steps=5);page.mouse.up();assert not errors,errors
  # The WebGL framebuffer must contain multiple colors, not a blank page.
  colors=page.evaluate('''()=>{const c=document.querySelector('#map'),g=WorldscopeTwin.state.webgl?c.getContext('webgl'):null;let a;if(g){a=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,a)}else{a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;}const s=new Set();for(let i=0;i<a.length;i+=64)s.add(a[i]+','+a[i+1]+','+a[i+2]);return s.size}''');assert colors>=(4 if scene.get('fixture') else 2),colors
  page.locator('#reset').click();page.screenshot(path=str(root/f'{"fixture" if scene.get("fixture") else "source"}-render-{w}.png'));print(f'PASS {w}x{h} {page.evaluate("WorldscopeTwin.state.renderer")}: {colors} colors, scene import, atlas/3D, rotate, zoom, drag; zero JS errors')
  page.close()
 browser.close()
