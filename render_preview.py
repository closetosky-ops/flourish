from bs4 import BeautifulSoup
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, mimetypes, re
root=Path('/mnt/data/flourish-v9-work')
def make(p):
 soup=BeautifulSoup((root/p).read_text(),'html.parser')
 for link in soup.find_all('link'):
  if link.get('rel')==['stylesheet']:
   css=(root/link['href']).read_text()
   def rep(m):
    f=root/'assets/sans.woff2'; return "url(data:font/woff2;base64,"+base64.b64encode(f.read_bytes()).decode()+")"
   css=css.replace("url('assets/sans.woff2')", "url(data:font/woff2;base64,"+base64.b64encode((root/'assets/sans.woff2').read_bytes()).decode()+")")
   tag=soup.new_tag('style');tag.string=css;link.replace_with(tag)
 for img in soup.find_all('img'):
  src=img.get('src','')
  if src.startswith('assets/'):
   f=root/src
   if f.exists():img['src']='data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
 for script in soup.find_all('script'):
  src=script.get('src');
  if src:
   script.attrs.pop('src');script.attrs.pop('defer',None);script.string=(root/src).read_text()
 for a in soup.find_all('link'):
  if a.get('rel')==['icon']: a.decompose()
 return str(soup)
def embed_dynamic_images(page):
 import json
 mapping={}
 for f in (root/'assets').glob('*.webp'):
  mapping['assets/'+f.name]='data:image/webp;base64,'+base64.b64encode(f.read_bytes()).decode()
 page.evaluate('''(mapping)=>{document.querySelectorAll('img').forEach(el=>{const src=el.getAttribute('src');if(mapping[src]){el.removeAttribute('loading');el.src=mapping[src]}})}''',mapping)
 page.wait_for_timeout(200)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-proxy-server'])
 errs=[]
 page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(make('index.html'),wait_until='load');page.wait_for_timeout(400)
 embed_dynamic_images(page)
 page.wait_for_timeout(250)
 print('featured',page.locator('#featured-products .product-card').count(),'svg d',str(page.locator('#honey-body').get_attribute('d'))[:100]);page.screenshot(path='/mnt/data/flourish-desktop.png',full_page=True)
 page2=b.new_page(viewport={'width':1440,'height':900});page2.on('pageerror',lambda e:errs.append(str(e)));page2.set_content(make('shop.html'));page2.wait_for_timeout(300)
 embed_dynamic_images(page2)
 page2.screenshot(path='/mnt/data/flourish-shop.png',full_page=True)
 print('products',page2.locator('#shop-products .product-card').count())
 page2.locator('.mini-add').first.click();print('bag',page2.locator('.bag-count').inner_text());page2.locator('[data-open-cart]').click();print('cart visible',page2.locator('#cart-panel').evaluate('(el)=>el.open'))
 page3=b.new_page(viewport={'width':1440,'height':900});page3.on('pageerror',lambda e:errs.append(str(e)));page3.set_content(make('admin.html'));page3.wait_for_timeout(200);embed_dynamic_images(page3);print('admin',page3.locator('.admin-listing').count());page3.screenshot(path='/mnt/data/flourish-admin.png',full_page=True)
 m=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True);m.on('pageerror',lambda e:errs.append(str(e)));m.set_content(make('index.html'));m.wait_for_timeout(300)
 embed_dynamic_images(m)
 print('mobile body scrollWidth',m.locator('body').evaluate('el=>el.scrollWidth'));m.screenshot(path='/mnt/data/flourish-mobile.png',full_page=True)
 print('errors',errs[:25]);b.close()
