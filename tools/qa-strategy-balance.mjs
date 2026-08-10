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
    let testUid=900000;
    const mkPlayer=(ids,star=1)=>({army:ids.map(id=>({uid:testUid++,id,star,gAtk:0,gHp:0})),reserve:[],relics:[]});
    // 配对强度扫描：同一构筑分别“开羁绊/关羁绊”，迎战同一份已关羁绊、并从 0.78→1.70 倍连续加压的镜像敌军。
    // 这比“开羁绊直接打无羁绊镜像”更有信息量——后者哪怕只多 1 盾也常出现 100% 胜率，无法判断边际是否过量。
    const duel=(ids,star,strip,n=720)=>{
      const tally={on:{wins:0,draws:0,rounds:0},off:{wins:0,draws:0,rounds:0}};
      const fight=(enabled,factor,orientation,seed)=>{
        const ph=mkPlayer(ids,star),po=mkPlayer(ids,star),H=buildFighters(ph,{}),O=buildFighters(po,{}),fh=sideFlags(ph),fo=sideFlags(po);
        if(!enabled)strip(H,fh);strip(O,fo);
        O.forEach(f=>{f.atk=Math.max(1,Math.round(f.atk*factor));f.hp=Math.max(1,Math.round(f.hp*factor));f.maxhp=f.hp;f.shield=Math.round(f.shield*factor)});
        const result=orientation===0?simulateBattle(H,O,fh,fo,mulberry32(seed),{}):simulateBattle(O,H,fo,fh,mulberry32(seed),{});
        const heroWon=result.winner>=0&&(orientation===0?result.winner===0:result.winner===1);
        return {win:heroWon,draw:result.winner<0,rounds:result.log.filter(e=>e.t==='round').length};
      };
      for(let i=0;i<n;i++){
        const factor=.78+(i%47)/46*.92,orientation=i%2,seed=70001+i*17;
        for(const key of ['off','on']){const r=fight(key==='on',factor,orientation,seed),t=tally[key];if(r.win)t.wins++;if(r.draw)t.draws++;t.rounds+=r.rounds}
      }
      const share=t=>+((t.wins+t.draws*.5)/n).toFixed(3);
      const offShare=share(tally.off),onShare=share(tally.on);
      return {samples:n,baselineShare:offShare,activeShare:onShare,uplift:+(onShare-offShare).toFixed(3),avgRoundsOn:+(tally.on.rounds/n).toFixed(1)};
    };
    const edgeIds=BONDS.edge.ids.slice(0,3),persistIds=BONDS.persist.ids.slice(0,5);
    const data={
      edge:{ids:edgeIds,result:duel(edgeIds,1,(fs,flags)=>{fs.forEach(f=>{f.afFirst=Math.max(0,(f.afFirst||0)-2);f.edgeCrit=false});flags.edgeTier=0})},
      persist:{ids:persistIds,result:duel(persistIds,1,(fs,flags)=>{fs.forEach(f=>{if(f.persistTier){f.hp-=4;f.maxhp-=4;f.persistTier=0;f.spellRevive=false}});flags.persistTier=0})},
      lamp:{ids:['zi','wolf','guard'],result:duel(['zi','wolf','guard'],2,(fs)=>{fs.forEach(f=>{f.shield=Math.max(0,f.shield-3);f.lampLink=false})})},
      valleyWall:{ids:['zeng','hao','guard'],result:duel(['zeng','hao','guard'],1,(fs)=>{const z=fs.find(f=>f.id==='zeng');if(z)z.skill={k:'none'}})}
    };
    return data;
  });
}finally{await browser.close();server.close()}

// 满档构筑允许明显回报，但连续压力扫描的增益必须低于 40pp；常规双人搭档低于 24pp。
const ranges={edge:[.05,.38],persist:[.08,.38],lamp:[.08,.40],valleyWall:[.02,.24]};
const good=Object.entries(report).every(([key,value])=>value.result.samples===720&&value.result.activeShare>.15&&value.result.activeShare<.90&&value.result.uplift>=ranges[key][0]&&value.result.uplift<=ranges[key][1]);
console.log(JSON.stringify(report,null,2));
console.log(good?'自鸣棋关键羁绊镜像平衡验收 ✅':'自鸣棋关键羁绊镜像平衡验收 ❌');
if(!good)process.exitCode=1;
