from bs4 import BeautifulSoup
from pathlib import Path
from playwright.sync_api import sync_playwright
import sys
sys.path.insert(0,'/mnt/data/flourish-v9-work')
import ast
namespace={}
src=Path('/mnt/data/flourish-v9-work/render_preview.py').read_text()
tree=ast.parse(src)
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='make')
exec(compile(ast.Module(body=[fn],type_ignores=[]),'<make>','exec'),globals(),namespace)
make=namespace['make']
root=Path('/mnt/data/flourish-v9-work')
import base64
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1240,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate('''() => {const data={};Object.defineProperty(window, 'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(data,k)?data[k]:null,setItem:(k,v)=>{data[k]=v},removeItem:k=>delete data[k]}})}''')
 page.set_content(make('admin.html'));page.wait_for_timeout(120)
 assert page.locator('.admin-listing').count()==8
 page.locator('input[name="name"]').fill('Autumn Harvest Honey')
 page.locator('textarea[name="description"]').fill('Rich golden seasonal honey.')
 page.locator('input[name="price"]').fill('23.50')
 page.locator('input[name="stock"]').fill('7')
 page.locator('input[name="featured"]').check()
 page.locator('#save-product').click();assert page.locator('.admin-listing').count()==9
 page.locator('[data-edit]').first.click()
 assert page.locator('#admin-form-heading').inner_text()=='Edit product'
 page.locator('input[name="stock"]').fill('4')
 page.locator('#save-product').click()
 page.set_content(make('shop.html'));page.wait_for_timeout(150)
 assert page.locator('#shop-products .product-card').count()==9
 assert page.get_by_text('Autumn Harvest Honey',exact=True).count()>0
 page.locator('.mini-add').first.click();assert page.locator('[data-cart-count]').first.inner_text()=='1'
 page.locator('[data-open-cart]').click();assert page.locator('#cart-panel').evaluate('(e)=>e.open') is True
 page.locator('[data-qty="1"]').first.click();assert page.locator('[data-cart-count]').first.inner_text()=='2'
 print('PASS: create/edit product, same-browser shop persistence, add-to-bag, quantity, cart modal')
 print('JS errors',errors)
 b.close()
