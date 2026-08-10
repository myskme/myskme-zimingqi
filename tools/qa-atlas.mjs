import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,resolve} from 'node:path';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');

const ROOT=resolve(process.argv[2]||'.');
const POSTER=resolve(ROOT,'assets/codex-atlas-20260810/zimingqi-atlas-2400.png');
const POSTER_WEB=resolve(ROOT,'assets/codex-atlas-20260810/zimingqi-atlas-1200.jpg');
const POSTER_PREVIEW=resolve(ROOT,'assets/codex-atlas-20260810/zimingqi-atlas-preview-600.jpg');
const DATA=resolve(ROOT,'assets/codex-atlas-20260810/atlas-data.json');
const MANIFEST=resolve(ROOT,'assets/codex-atlas-20260810/manifest.json');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{const pathname=decodeURIComponent(new URL(req.url,'http://local/').pathname),file=resolve(ROOT,pathname==='/'?'index.html':pathname.replace(/^\/+/,''));if(!file.startsWith(ROOT))throw new Error('bad path');const body=await readFile(file);res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});res.end(body)}
  catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));

const png=await readFile(POSTER);const posterInfo=await stat(POSTER);
const posterSize={width:png.readUInt32BE(16),height:png.readUInt32BE(20),bytes:posterInfo.size};
function jpegSize(buffer){for(let i=2;i<buffer.length-9;){if(buffer[i]!==0xff){i++;continue}const marker=buffer[i+1];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:buffer.readUInt16BE(i+5),width:buffer.readUInt16BE(i+7)};const length=buffer.readUInt16BE(i+2);if(!length)break;i+=2+length}throw new Error('JPEG size not found')}
const webBody=await readFile(POSTER_WEB),previewBody=await readFile(POSTER_PREVIEW);
const webInfo=await stat(POSTER_WEB),previewInfo=await stat(POSTER_PREVIEW);
const webSize={...jpegSize(webBody),bytes:webInfo.size},previewSize={...jpegSize(previewBody),bytes:previewInfo.size};
const dataset=JSON.parse(await readFile(DATA,'utf8')),manifest=JSON.parse(await readFile(MANIFEST,'utf8'));
const dataCounts={elements:dataset.elements.length,units:dataset.elements.reduce((n,x)=>n+x.units.length,0),bonds:dataset.playBonds.length,combos:dataset.combos.length};
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const errors=[],reports=[];
try{
  for(const viewport of [{name:'phone',width:390,height:844},{name:'desktop',width:1280,height:800}]){
    const context=await browser.newContext({viewport});const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`${viewport.name}: ${String(error)}`));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>showAtlas());await page.waitForSelector('.atlas-app');
    await page.waitForFunction(()=>window.__ATLAS_IMG_ACTIVE===0&&![...document.querySelectorAll('.atlas-pane.on img[data-atlas-src]')].some(img=>{const element=img.closest('.atlas-element');return !element||getComputedStyle(element).display!=='none'}));
    const base=await page.evaluate(()=>({
      tabs:document.querySelectorAll('.atlas-tab').length,elements:document.querySelectorAll('.atlas-element').length,
      visibleElements:[...document.querySelectorAll('.atlas-element')].filter(el=>getComputedStyle(el).display!=='none').length,
      units:document.querySelectorAll('.atlas-unit').length,bonds:document.querySelectorAll('.atlas-bond').length,combos:document.querySelectorAll('.atlas-combo').length,
      scrollWidth:document.documentElement.scrollWidth,innerWidth,modal:[document.querySelector('#modal-box').clientWidth,document.querySelector('#modal-box').clientHeight],
      imageNetwork:{peak:window.__ATLAS_IMG_PEAK,started:window.__ATLAS_IMG_STARTED,deferred:document.querySelectorAll('.atlas-app img[data-atlas-src]').length}
    }));
    await page.screenshot({path:`/private/tmp/zimingqi-atlas-${viewport.name}.png`,fullPage:false});
    await page.fill('#atlas-search','梓');await page.waitForTimeout(80);
    const search=await page.evaluate(()=>({inspector:document.querySelector('#atlas-inspector').innerText,active:document.querySelector('.atlas-element.is-active')?.dataset.elem,matches:document.querySelectorAll('.atlas-unit.is-match').length}));
    await page.click('.atlas-tab[data-tab="bonds"]');const bondVisible=await page.locator('.atlas-pane[data-pane="bonds"]').isVisible();
    await page.waitForFunction(()=>window.__ATLAS_IMG_ACTIVE===0&&!document.querySelector('.atlas-pane.on img[data-atlas-src]'));
    await page.click('.atlas-tab[data-tab="combos"]');const comboVisible=await page.locator('.atlas-pane[data-pane="combos"]').isVisible();
    await page.waitForFunction(()=>window.__ATLAS_IMG_ACTIVE===0&&!document.querySelector('.atlas-pane.on img[data-atlas-src]'));
    await page.screenshot({path:`/private/tmp/zimingqi-atlas-${viewport.name}-combos.png`,fullPage:false});
    const finalNetwork=await page.evaluate(()=>({peak:window.__ATLAS_IMG_PEAK,started:window.__ATLAS_IMG_STARTED,deferred:document.querySelectorAll('.atlas-app img[data-atlas-src]').length}));
    reports.push({viewport:viewport.name,base,search,bondVisible,comboVisible,finalNetwork});await context.close();
  }
}finally{await browser.close();server.close()}

const good=posterSize.width===2400&&posterSize.height===3000&&posterSize.bytes>500000&&webSize.width===1200&&webSize.height===1500&&webSize.bytes>100000&&previewSize.width===600&&previewSize.height===750&&previewSize.bytes>50000&&
  dataCounts.elements===4&&dataCounts.units===43&&dataCounts.bonds===6&&dataCounts.combos===8&&manifest.files&&Object.keys(manifest.files).length===6&&!errors.length&&reports.every(r=>
  r.base.tabs===3&&r.base.elements===4&&r.base.units>=40&&r.base.bonds===6&&r.base.combos===8&&r.base.scrollWidth===r.base.innerWidth&&
  r.base.imageNetwork.peak<=4&&r.finalNetwork.peak<=4&&(r.viewport!=='phone'||(r.base.imageNetwork.started<20&&r.base.imageNetwork.deferred>40))&&
  r.base.modal[0]<=r.base.innerWidth&&r.search.inspector.includes('梓')&&r.search.active==='earth'&&r.search.matches>=1&&r.bondVisible&&r.comboVisible&&
  (r.viewport==='phone'?r.base.visibleElements===1:r.base.visibleElements===4));
console.log(JSON.stringify({posterSize,webSize,previewSize,dataCounts,reports,pageErrors:errors,screenshots:['/private/tmp/zimingqi-atlas-phone.png','/private/tmp/zimingqi-atlas-phone-combos.png','/private/tmp/zimingqi-atlas-desktop.png','/private/tmp/zimingqi-atlas-desktop-combos.png']},null,2));
console.log(good?'自鸣棋四象星图 / 高清海报 / 双视口验收 ✅':'自鸣棋四象星图 / 高清海报 / 双视口验收 ❌');
if(!good)process.exitCode=1;
