import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.js':'text/javascript'};
const server = createServer(async (req,res)=>{
  try {
    const raw=decodeURIComponent(req.url.split('?')[0]);
    const file=raw==='/'?'index.html':raw.replace(/^\/+/, '');
    if(file.includes('..'))throw new Error('bad path');
    res.writeHead(200,{'content-type':MIME[extname(file)]||'application/octet-stream'});
    res.end(await readFile(ROOT+file));
  } catch {res.writeHead(404);res.end('404');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const ids=['ziyu','ke','chen','ming','jun','jie'];
const results=[];

try {
  for(const cfg of [
    {name:'desktop',viewport:{width:1280,height:720}},
    {name:'mobile',viewport:{width:390,height:844}},
  ]){
    const page=await browser.newPage({viewport:cfg.viewport});
    const errors=[];const assetStatus={};
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('response',r=>{if(r.url().includes('characters-six-20260810-v2/'))assetStatus[r.url().split('/').pop().split('?')[0]]=r.status()});
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.click('#btn-roster');
    await page.waitForSelector('.codex-grid');
    await page.waitForTimeout(300);
    const roster=await page.evaluate(ids=>({
      unitCount:UNITS.length,
      present:ids.map(id=>({id,name:UMAP[id]&&UMAP[id].n,art:ART[id],zodiac:ZODIAC[id]})),
      scrollWidth:document.documentElement.scrollWidth,
      viewport:innerWidth,
      text:document.body.innerText,
    }),ids);
    await page.evaluate(()=>closeModal());
    await page.evaluate(()=>showUnitDetail('ziyu'));
    await page.waitForSelector('.udetail-card img');
    const detail=await page.evaluate(()=>{
      const img=document.querySelector('.udetail-card img'),box=document.querySelector('#modal-box');
      return {text:box.innerText,natural:[img.naturalWidth,img.naturalHeight],scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
    });
    await page.screenshot({path:`/private/tmp/zimingqi-six-${cfg.name}.png`,fullPage:true});
    const missingNames=['子鱼','克','宸','铭','钧','杰'].filter(name=>!roster.text.includes(name));
    const badAssets=ids.filter(id=>assetStatus[`unit-${id}.webp`]!==200);
    const ok=roster.unitCount===43&&roster.present.every(x=>x.name&&x.art&&x.zodiac)&&!missingNames.length&&!badAssets.length&&
      roster.scrollWidth===roster.viewport&&detail.scrollWidth===detail.viewport&&detail.text.includes('净潮')&&detail.text.includes('每回合治疗')&&
      detail.natural[0]===512&&detail.natural[1]===768&&!errors.length;
    results.push({viewport:cfg.name,ok,missingNames,badAssets,errors,unitCount:roster.unitCount,detailNatural:detail.natural,scrollWidth:detail.scrollWidth});
    await page.close();
  }
} finally {await browser.close();server.close();}

console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.ok))process.exit(1);
