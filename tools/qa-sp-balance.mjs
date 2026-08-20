import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const server=createServer(async(req,res)=>{
  try{const path=new URL(req.url,'http://local/').pathname,file=resolve(ROOT,path==='/'?'index.html':path.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');res.writeHead(200);res.end(await readFile(file));}
  catch{res.writeHead(404);res.end('404')}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
let report;
try{
  const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  report=await page.evaluate(()=>{
    let testUid=980000;
    const mk=ids=>({army:ids.map(id=>({uid:testUid++,id,star:1,gAtk:0,gHp:0})),reserve:[],relics:[],strats:[]});
    const enemyIds=['guard','lin','pigeon'];
    const scan=(baseId,spId,team,n=720)=>{
      const tally={base:{wins:0,draws:0,rounds:0,procs:0},sp:{wins:0,draws:0,rounds:0,procs:0}};
      for(let i=0;i<n;i++){
        // 0.75→3.25 连续压力坡：既覆盖同费常规敌人，也覆盖无尽后段的高压敌人，避免强阵在窄区间里全胜而失去比较信息。
        const factor=.75+(i%61)/60*2.50,orientation=i%2,seed=82001+i*29;
        for(const kind of ['base','sp']){
          const ids=team.map(id=>id==='$variant'?(kind==='sp'?spId:baseId):id);
          const hero=mk(ids),foe=mk(enemyIds),H=buildFighters(hero,{}),F=buildFighters(foe,{}),hh=sideFlags(hero),ff=sideFlags(foe);
          F.forEach(f=>{f.atk=Math.max(1,Math.round(f.atk*factor));f.hp=Math.max(1,Math.round(f.hp*factor));f.maxhp=f.hp;f.shield=Math.round(f.shield*factor)});
          const result=orientation===0?simulateBattle(H,F,hh,ff,mulberry32(seed),{}):simulateBattle(F,H,ff,hh,mulberry32(seed),{});
          const heroWon=result.winner>=0&&(orientation===0?result.winner===0:result.winner===1),t=tally[kind];
          if(heroWon)t.wins++;if(result.winner<0)t.draws++;t.rounds+=result.log.filter(e=>e.t==='round').length;
          if(kind==='sp'&&result.log.some(e=>e.t==='spProc'&&e.key===spId))t.procs++;
        }
      }
      const share=t=>+((t.wins+t.draws*.5)/n).toFixed(3),baseShare=share(tally.base),spShare=share(tally.sp);
      return {samples:n,baseShare,spShare,uplift:+(spShare-baseShare).toFixed(3),procRate:+(tally.sp.procs/n).toFixed(3),avgRounds:+(tally.sp.rounds/n).toFixed(1)};
    };
    return {
      zi:{base:'zi',sp:'zi_sp',team:['guard','$variant','jie'],result:scan('zi','zi_sp',['guard','$variant','jie'])},
      xin:{base:'xin',sp:'xin_sp',team:['$variant','guard','jia'],result:scan('xin','xin_sp',['$variant','guard','jia'])},
      xuan:{base:'xuan',sp:'xuan_sp',team:['guard','$variant','jie'],result:scan('xuan','xuan_sp',['guard','$variant','jie'])},
      xi:{base:'xi',sp:'xi_sp',team:['$variant','lin','jia'],result:scan('xi','xi_sp',['$variant','lin','jia'])}
    };
  });
}finally{await browser.close();server.close()}

// SP 必须明显超越普通形态；但连续强度坡面上仍要留出敌军压制区，不能变成抽到即自动胜利。
const good=Object.values(report).every(x=>x.result.samples===720&&x.result.spShare>.15&&x.result.spShare<.90
  &&x.result.uplift>=.08&&x.result.uplift<=.32&&x.result.procRate>.70&&x.result.avgRounds>1);
console.log(JSON.stringify(report,null,2));
console.log(good?'自鸣棋首发 SP 强度坡面验收通过':'自鸣棋首发 SP 强度坡面验收失败');
if(!good)process.exitCode=1;
