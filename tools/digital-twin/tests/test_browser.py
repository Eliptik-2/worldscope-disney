from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--use-gl=angle'])
 for w,h in [(1280,720),(390,844),(320,640)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((root/'viewer/index.html').read_text());page.wait_for_function('!!window.WorldscopeTwin?.state.renderer')
  page.locator('#file').set_input_files(str(root/'synthetic-scene.json'));page.wait_for_function('WorldscopeTwin.state.featureCount===5');assert page.evaluate('WorldscopeTwin.state.fixture') is True
  page.locator('#flat').click();assert page.evaluate('WorldscopeTwin.state.mode')=='atlas';page.locator('#three').click();assert page.evaluate('WorldscopeTwin.state.mode')=='3d';before=page.evaluate('WorldscopeTwin.state.angle');page.locator('#turn').click();assert page.evaluate('WorldscopeTwin.state.angle')!=before
  before=page.evaluate('WorldscopeTwin.state.scale');page.locator('#plus').click();assert page.evaluate('WorldscopeTwin.state.scale')>before;page.locator('#reset').click();page.mouse.move(w*.55,h*.44);page.mouse.down();page.mouse.move(w*.65,h*.50,steps=5);page.mouse.up();assert not errors,errors
  # The WebGL framebuffer must contain multiple colors, not a blank page.
  colors=page.evaluate('''()=>{const c=document.querySelector('#map'),g=WorldscopeTwin.state.webgl?c.getContext('webgl'):null;let a;if(g){a=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,a)}else{a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;}const s=new Set();for(let i=0;i<a.length;i+=64)s.add(a[i]+','+a[i+1]+','+a[i+2]);return s.size}''');assert colors>=4,colors
  page.locator('#reset').click();page.screenshot(path=str(root/f'fixture-render-{w}.png'));print(f'PASS {w}x{h} {page.evaluate("WorldscopeTwin.state.renderer")}: {colors} colors, fixture import, atlas/3D, rotate, zoom, drag; zero JS errors')
  page.close()
 browser.close()
