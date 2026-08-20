import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const server=createServer(async(req,res)=>{
  try{const path=new URL(req.url,'http://local/').pathname;const file=resolve(ROOT,path==='/'?'index.html':path.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');res.writeHead(200);res.end(await readFile(file));}
  catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
let report;
try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  report=await page.evaluate(()=>{
    let testUid=950000;
    const mk=(ids,relics=[])=>({army:ids.map(id=>({uid:testUid++,id,star:1,gAtk:0,gHp:0})),reserve:[],relics,strats:[]});
    const scan=(ids,artifact,n=720)=>{
      const tally={on:{wins:0,draws:0,rounds:0,procs:0},off:{wins:0,draws:0,rounds:0,procs:0}};
      for(let i=0;i<n;i++){
        const factor=.80+(i%47)/46*.90,orientation=i%2,seed=91001+i*23;
        for(const key of ['off','on']){
          const hero=mk(ids,key==='on'?[artifact]:[]),foe=mk(ids),H=buildFighters(hero,{}),F=buildFighters(foe,{}),hh=sideFlags(hero),ff=sideFlags(foe);
          F.forEach(f=>{f.atk=Math.max(1,Math.round(f.atk*factor));f.hp=Math.max(1,Math.round(f.hp*factor));f.maxhp=f.hp;f.shield=Math.round(f.shield*factor)});
          const result=orientation===0?simulateBattle(H,F,hh,ff,mulberry32(seed),{}):simulateBattle(F,H,ff,hh,mulberry32(seed),{});
          const heroWon=result.winner>=0&&(orientation===0?result.winner===0:result.winner===1),t=tally[key];
          if(heroWon)t.wins++;if(result.winner<0)t.draws++;t.rounds+=result.log.filter(e=>e.t==='round').length;
          if(result.log.some(e=>e.t==='artifactProc'&&e.key===artifact))t.procs++;
        }
      }
      const share=t=>+((t.wins+t.draws*.5)/n).toFixed(3),offShare=share(tally.off),onShare=share(tally.on);
      return {samples:n,baselineShare:offShare,artifactShare:onShare,uplift:+(onShare-offShare).toFixed(3),procRate:+(tally.on.procs/n).toFixed(3),avgRounds:+(tally.on.rounds/n).toFixed(1)};
    };
    return {
      earthseal:{team:['guard','duo','lin'],result:scan(['guard','duo','lin'],'earthseal')},
      tideglass:{team:['ziyu','hai','crane'],result:scan(['ziyu','hai','crane'],'tideglass')},
      emberheart:{team:['hui','yu','lin'],result:scan(['hui','yu','lin'],'emberheart')},
      skywheel:{team:['scout','nuo','flint'],result:scan(['scout','nuo','flint'],'skywheel')},
    };
  });
}finally{await browser.close();server.close()}

// 神器要足以改变构筑，但不能成为“拿到就自动赢”。连续压力镜像下，边际控制在 3–34 个百分点。
const good=Object.values(report).every(x=>x.result.samples===720&&x.result.artifactShare>.18&&x.result.artifactShare<.88&&x.result.uplift>=.03&&x.result.uplift<=.34&&x.result.procRate>0);
console.log(JSON.stringify(report,null,2));
console.log(good?'自鸣棋四神器压力平衡验收通过':'自鸣棋四神器压力平衡验收失败');
if(!good)process.exitCode=1;
