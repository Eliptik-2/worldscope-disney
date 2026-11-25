import json, sys, threading
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(sys.argv[1]).resolve()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--use-gl=angle'])
  page=browser.new_page(viewport={'width':390,'height':844})
  page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
  page.goto(url+'/index.html',wait_until='domcontentloaded')
  page.wait_for_function("window.WorldscopeTwin28?.state==='ready'")
  # The actual map options are created even when external map tiles are blocked.
  page.wait_for_selector('#ws28-twin',state='attached')
  page.evaluate("""()=>{const el=document.getElementById('mappark');const o=document.createElement('option');o.value='EPCOT';el.append(o);el.value='EPCOT';el.dispatchEvent(new Event('change'));}""")
  link=page.locator('#ws28-twin')
  assert link.get_attribute('href')=='architecture/index.html?region=epcot'
  assert link.get_attribute('target')=='_blank'
  second=browser.new_page(viewport={'width':390,'height':844})
  second.goto(url+'/'+link.get_attribute('href'),wait_until='domcontentloaded')
  second.wait_for_function("window.WorldscopeTwin?.state.source==='EPCOT' && WorldscopeTwin.state.featureCount>0")
  assert second.evaluate('WorldscopeTwin.state.fixture') is False
  assert second.locator('#region option').count()==6
  second.locator('#flat').click(); assert second.evaluate('WorldscopeTwin.state.mode')=='atlas'
  second.locator('#three').click(); assert second.evaluate('WorldscopeTwin.state.mode')=='3d'
  # Simulate a missing dataset; the old map must not offer a dead link.
  missing=browser.new_page()
  missing.route('**/architecture/scenes/manifest.json',lambda r:r.fulfill(status=404,body='missing'))
  missing.route('**/*',lambda r:r.continue_() if r.request.url.startswith(url) else r.abort())
  missing.goto(url+'/index.html',wait_until='domcontentloaded')
  missing.wait_for_function("window.WorldscopeTwin28?.state==='unavailable'")
  assert missing.locator('#ws28-twin').is_hidden()
  browser.close()
  print('PASS: packaged Worldscope integration, EPCOT deep link, 6 regions, mode switch, unavailable-data guard')
finally: server.shutdown()
