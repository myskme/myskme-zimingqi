import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const server=createServer(async(req,res)=>{
  try{const path=new URL(req.url,'http://local/').pathname,file=resolve(ROOT,path==='/'?'index.html':path.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');const body=await readFile(file);res.writeHead(200);res.end(body)}
  catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const reports=[],pageErrors=[];
try{
  for(const cfg of [{name:'phone',width:390,height:844},{name:'desktop',width:1280,height:800}]){
    const page=await browser.newPage({viewport:{width:cfg.width,height:cfg.height}});
    page.on('pageerror',e=>pageErrors.push(`${cfg.name}: ${e.message}`));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      S=newState(['验收者'],3,0,false);S.solo=true;S.round=6;S.phase='pick';S.life=3;S.lifeMax=3;S.difficulty=1;
      S.players[0].relics=['teapot','ruler','tassel'];S.players[0].army=['guard','lin','scout'].map((id,i)=>({id,uid:880+i,star:1,gAtk:0,gHp:0}));
      rng=mulberry32(20820);window.__forgeDone=false;soloRound=()=>{window.__forgeDone=true};
      applyPath('vault');
    });
    await page.waitForSelector('#strat-veil.artifact-forge');
    await page.waitForFunction(()=>[...document.querySelectorAll('.artifact-card img')].every(im=>im.complete&&im.naturalWidth>0));
    await page.waitForTimeout(650); // 等大幕淡入完成，截图反映玩家实际看到的稳定状态
    const before=await page.evaluate(()=>{const veil=document.querySelector('#strat-veil'),row=document.querySelector('.artifact-row'),tag=veil.querySelector('.tag'),cards=[...document.querySelectorAll('.artifact-card')];return {
      innerWidth,docWidth:document.documentElement.scrollWidth,veilWidth:veil.scrollWidth,rowWidth:row.scrollWidth,rowClient:row.clientWidth,
      tagTop:tag.getBoundingClientRect().top,rowTop:row.getBoundingClientRect().top,rowBottom:row.getBoundingClientRect().bottom,
      cards:cards.map(c=>({name:c.querySelector('b').textContent,fullyVisible:c.getBoundingClientRect().left>=0&&c.getBoundingClientRect().right<=innerWidth,top:c.getBoundingClientRect().top,bottom:c.getBoundingClientRect().bottom,img:c.querySelector('img').naturalWidth})),
      reducedSafe:getComputedStyle(document.querySelector('.artifact-forge')).overflow
    }});
    await page.screenshot({path:`/private/tmp/zimingqi-artifact-${cfg.name}.png`,fullPage:true});
    await page.locator('.artifact-card').first().click();
    await page.waitForFunction(()=>window.__forgeDone===true,{timeout:3000});
    const after=await page.evaluate(()=>({artifact:S.players[0].relics.find(id=>isArtifact(RMAP[id])),round:S.round,veil:!!document.querySelector('#strat-veil')}));
    reports.push({viewport:cfg.name,before,after});await page.close();
  }
}finally{await browser.close();server.close()}

const good=!pageErrors.length&&reports.every(r=>r.before.docWidth===r.before.innerWidth&&r.before.cards.length===3&&r.before.cards.every(c=>c.img>0)&&r.after.artifact==='earthseal'&&r.after.round===7&&!r.after.veil)
  &&reports.find(r=>r.viewport==='phone').before.rowWidth>reports.find(r=>r.viewport==='phone').before.rowClient
  &&reports.find(r=>r.viewport==='desktop').before.cards.every(c=>c.fullyVisible);
console.log(JSON.stringify({reports,pageErrors,screenshots:['/private/tmp/zimingqi-artifact-phone.png','/private/tmp/zimingqi-artifact-desktop.png']},null,2));
console.log(good?'自鸣棋神器炉双视口验收通过':'自鸣棋神器炉双视口验收失败');
if(!good)process.exitCode=1;
