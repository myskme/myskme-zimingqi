import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {extname,join,resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const SHOT_DIR=tmpdir();
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
const server=createServer(async(req,res)=>{
  try{const path=decodeURIComponent(new URL(req.url,'http://local/').pathname),file=resolve(ROOT,path==='/'?'index.html':path.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');const body=await readFile(file);res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});res.end(body)}
  catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));

const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const reports=[],pageErrors=[],requestFailures=[];
try{
  for(const viewport of [{name:'phone',width:390,height:844},{name:'desktop',width:1280,height:800}]){
    const context=await browser.newContext({viewport});const page=await context.newPage();
    const target=viewport.name==='phone'
      ?{spId:'xuan_sp',baseId:'xuan',title:'盛装诱导者',name:'璇',baseRar:'SR'}
      :{spId:'xi_sp',baseId:'xi',title:'月糖快刃',name:'晰',baseRar:'SSR'};
    page.on('pageerror',error=>pageErrors.push(`${viewport.name}: ${error.message}`));
    page.on('requestfailed',request=>requestFailures.push(`${viewport.name}: ${request.url()} ${request.failure()?.errorText||''}`));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
    const assetDims=await page.evaluate(()=>Promise.all(SP_VARIANTS.map(u=>new Promise(resolve=>{
      const im=new Image();im.onload=()=>resolve({id:u.id,w:im.naturalWidth,h:im.naturalHeight});im.onerror=()=>resolve({id:u.id,w:0,h:0});im.src=cardURL(u.id)}))));
    await page.evaluate(({spId})=>{
      localStorage.clear();
      S=newState(['SP验收者'],3,0,false);S.solo=true;S.act=3;S.round=7;S.phase='draft';S.draftQueue=[0];S.draftIdx=0;
      const p=S.players[0];p.coins=30;p.tier=5;p.spPity=11;p.army=[mkInst('guard')];
      S.offers=[{type:'unit',id:spId},{type:'unit',id:'zi'},{type:'unit',id:'xin'}];S.offersSold=[false,false,false];
      setAct(3);setPhase('征募');renderDraft();go('draft');hud();save();
    },target);
    await page.waitForSelector('#scr-draft.on .offer.sp-unit');
    await page.waitForFunction(()=>{const im=document.querySelector('.offer.sp-unit .rec-art');return im&&im.complete&&im.naturalWidth>0});
    await page.locator('.offer.sp-unit').scrollIntoViewIfNeeded();await page.waitForTimeout(550);
    const offer=await page.evaluate(()=>{const card=document.querySelector('.offer.sp-unit'),frame=card.querySelector('.rec-frame'),im=card.querySelector('.rec-art'),cr=card.getBoundingClientRect(),fr=frame.getBoundingClientRect(),ir=im.getBoundingClientRect();return {
      title:card.querySelector('.sp-epithet')?.textContent,law:card.querySelector('.sp-law')?.textContent,rarity:card.querySelector('.rt-SP')?.textContent,
      image:{naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight,fit:getComputedStyle(im).objectFit,insideFrame:ir.left>=fr.left-1&&ir.right<=fr.right+1&&ir.top>=fr.top-1&&ir.bottom<=fr.bottom+1},
      card:{left:cr.left,right:cr.right,width:cr.width},docWidth:document.documentElement.scrollWidth,innerWidth
    }});
    await page.screenshot({path:join(SHOT_DIR,`zimingqi-sp-offer-${viewport.name}.png`),fullPage:true});
    await page.locator('.offer.sp-unit .cost-btn').click();
    await page.waitForSelector('.sp-awaken-veil');
    await page.waitForFunction(()=>{const im=document.querySelector('.sp-awaken-art img');return im&&im.complete&&im.naturalWidth>0});
    await page.waitForTimeout(1350); // 等 1 秒肖像入场动画完全收束后再测边界，避免把受 overflow 裁切的开场放大误判为越框
    const reveal=await page.evaluate(()=>{const veil=document.querySelector('.sp-awaken-veil'),panel=veil.querySelector('.sp-awaken'),art=veil.querySelector('.sp-awaken-art'),im=art.querySelector('img'),pr=panel.getBoundingClientRect(),ar=art.getBoundingClientRect(),ir=im.getBoundingClientRect();return {
      title:veil.querySelector('.sp-awaken-title').textContent,name:veil.querySelector('.sp-awaken-name').textContent,rule:veil.querySelector('.sp-awaken-rule').textContent,
      image:{naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight,insideArt:ir.left>=ar.left-1&&ir.right<=ar.right+1&&ir.top>=ar.top-1&&ir.bottom<=ar.bottom+1},
      panel:{left:pr.left,right:pr.right,top:pr.top,bottom:pr.bottom,insideViewport:pr.left>=0&&pr.right<=innerWidth&&pr.top>=0&&pr.bottom<=innerHeight},
      docWidth:document.documentElement.scrollWidth,innerWidth
    }});
    await page.screenshot({path:join(SHOT_DIR,`zimingqi-sp-reveal-${viewport.name}.png`)});
    await page.locator('.sp-awaken-veil').click();
    await page.evaluate(({spId})=>{showUnitDetail(spId,S.players[0].army.find(a=>a.id===spId))},target);
    const detail=await page.evaluate(()=>document.querySelector('#modal-box').innerText);
    await page.evaluate(({baseId})=>{closeModal();buyUnit(1,UMAP[baseId],UMAP[baseId].cost)},target);
    const state=await page.evaluate(({spId,baseId})=>({army:S.players[0].army.map(a=>({id:a.id,star:a.star,affix:!!a.af})),spCount:playerSP(S.players[0])?1:0,baseBlocked:!S.players[0].army.some(a=>a.id===baseId),saved:JSON.parse(localStorage.getItem('dyyw1')||'null')?.players?.[0]?.army?.some(a=>a.id===spId)}),target);
    reports.push({viewport:viewport.name,target,assetDims,offer,reveal,detailHasBase:detail.includes('现世本体')&&detail.includes(`${target.name} · ${target.baseRar}`),state});
    await context.close();
  }
}finally{await browser.close();server.close()}

const good=!pageErrors.length&&!requestFailures.length&&reports.every(r=>r.assetDims.length===4&&r.assetDims.every(x=>x.w===540&&x.h===756)
  &&r.offer.title===r.target.title&&r.offer.law.includes('一局一位')&&r.offer.rarity.includes('SP')
  &&r.offer.image.naturalWidth===540&&r.offer.image.naturalHeight===756&&r.offer.image.fit==='contain'&&r.offer.image.insideFrame&&r.offer.docWidth===r.offer.innerWidth
  &&r.reveal.title===r.target.title&&r.reveal.name===r.target.name&&r.reveal.rule.includes('普通形态互斥')&&r.reveal.image.insideArt&&r.reveal.panel.insideViewport&&r.reveal.docWidth===r.reveal.innerWidth
  &&r.detailHasBase&&r.state.spCount===1&&r.state.baseBlocked&&r.state.saved&&r.state.army.some(a=>a.id===r.target.spId&&a.star===1&&!a.affix));
console.log(JSON.stringify({reports,pageErrors,requestFailures,screenshots:['phone','desktop'].flatMap(name=>[join(SHOT_DIR,`zimingqi-sp-offer-${name}.png`),join(SHOT_DIR,`zimingqi-sp-reveal-${name}.png`)])},null,2));
console.log(good?'自鸣棋 SP 卡面与降临双视口验收通过':'自鸣棋 SP 卡面与降临双视口验收失败');
if(!good)process.exitCode=1;
