import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://local/').pathname);
    const file=resolve(ROOT,path==='/'?'index.html':path.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});res.end(body);
  }catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));

const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const errors=[];const reports=[];
try{
  for(const viewport of [{name:'phone',width:390,height:844},{name:'desktop',width:1280,height:800}]){
    const context=await browser.newContext({viewport});const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`${viewport.name}: ${String(error)}`));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      localStorage.clear();
      S=newState(['策略测试'],3,0,false);S.solo=true;S.act=1;S.round=1;S.phase='draft';S.draftQueue=[0];S.draftIdx=0;
      S.offers=[{type:'unit',id:'guard'},{type:'unit',id:'flint'},{type:'unit',id:'toll'}];S.offersSold=[false,false,false];
      const p=S.players[0];p.coins=30;p.army=['zeng','hao','jin'].map(id=>mkInst(id));p.reserve=[mkInst('flint')];
      setAct(1);setPhase('征募');renderDraft();go('draft');hud();save();
    });
    await page.waitForSelector('#scr-draft.on');
    const before=await page.evaluate(()=>({army:S.players[0].army.map(a=>a.id),reserve:S.players[0].reserve.map(a=>a.id),proof:document.querySelector('#bond-proof').innerText,scrollWidth:document.documentElement.scrollWidth,innerWidth}));
    await page.locator('#bench-units .bunit').filter({hasText:'增'}).locator('.zone-toggle').click();
    const benched=await page.evaluate(()=>({army:S.players[0].army.map(a=>a.id),reserve:S.players[0].reserve.map(a=>a.id),proof:document.querySelector('#bond-proof').innerText}));
    await page.locator('#reserve-units .bunit').filter({hasText:'增'}).locator('.zone-toggle').click();
    const restored=await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('dyyw1')||'null');return {army:S.players[0].army.map(a=>a.id),reserve:S.players[0].reserve.map(a=>a.id),proof:document.querySelector('#bond-proof').innerText,savedReserve:saved&&saved.players[0].reserve.map(a=>a.id),offers:[...document.querySelectorAll('#offers>.offer')].map(el=>({text:el.innerText.slice(0,30),rect:{x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height},visibility:getComputedStyle(el).visibility,opacity:getComputedStyle(el).opacity})),scrollWidth:document.documentElement.scrollWidth,innerWidth}});
    await page.locator('#bench').scrollIntoViewIfNeeded();await page.waitForTimeout(250);
    await page.screenshot({path:`/private/tmp/zimingqi-strategy-${viewport.name}-bench.png`});
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(250);
    await page.screenshot({path:`/private/tmp/zimingqi-strategy-${viewport.name}.png`,fullPage:false});
    reports.push({viewport:viewport.name,before,benched,restored});
    await context.close();
  }
}finally{await browser.close();server.close()}

const good=reports.every(r=>r.before.army.includes('zeng')&&r.before.reserve.includes('flint')&&r.before.proof.includes('嘲讽')&&
  !r.benched.army.includes('zeng')&&r.benched.reserve.includes('zeng')&&!r.benched.proof.includes('嘲讽')&&
  r.restored.army.includes('zeng')&&!r.restored.reserve.includes('zeng')&&Array.isArray(r.restored.savedReserve)&&r.restored.savedReserve.includes('flint')&&
  r.restored.offers.length===3&&r.restored.offers.every(o=>o.visibility==='visible'&&o.opacity==='1')&&
  r.restored.scrollWidth===r.restored.innerWidth)&&!errors.length;
console.log(JSON.stringify({reports,pageErrors:errors,screenshots:['/private/tmp/zimingqi-strategy-phone.png','/private/tmp/zimingqi-strategy-phone-bench.png','/private/tmp/zimingqi-strategy-desktop.png','/private/tmp/zimingqi-strategy-desktop-bench.png']},null,2));
console.log(good?'自鸣棋备战席/羁绊/存档/双视口验收 ✅':'自鸣棋备战席/羁绊/存档/双视口验收 ❌');
if(!good)process.exitCode=1;
