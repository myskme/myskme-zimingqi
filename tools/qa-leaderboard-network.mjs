import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local/').pathname);
    const file=resolve(ROOT,pathname==='/'?'index.html':pathname.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});res.end(body);
  }catch(error){res.writeHead(404);res.end('404')}
});

await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const calls=[],pageErrors=[];
let submitMode='ok',submitDelay=0,raceMode=false;
page.on('pageerror',error=>pageErrors.push(String(error)));
await page.route('https://myskme.com/api/game',async route=>{
  const request=route.request(),method=request.method(),headers=request.headers();
  let payload={};try{payload=JSON.parse(request.postData()||'{}')}catch(error){}
  calls.push({method,contentType:headers['content-type']||'',action:payload.action,day:String(payload.day??'')});
  if(payload.action==='dmtop'){
    const slow=raceMode&&String(payload.day)==='0';
    if(raceMode)await new Promise(done=>setTimeout(done,slow?320:35));
    const name=raceMode?(slow?'旧慢榜':'新快榜'):'探针';
    await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ok:true,top:[{id:slow?'slow':'fast',name,score:slow?90:12}]})});return;
  }
  if(payload.action==='dmsub'){
    if(submitDelay)await new Promise(done=>setTimeout(done,submitDelay));
    if(submitMode==='fail'){await route.abort('connectionreset');return}
    await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"ok":true,"rank":4}'});return;
  }
  await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"ok":true,"top":[]}'});
});

const checks=[];
const check=(name,ok,detail='')=>checks.push({name,ok:Boolean(ok),detail});

try{
  await page.goto(url,{waitUntil:'load'});
  await page.evaluate(()=>localStorage.clear());

  calls.length=0;
  await page.evaluate(()=>lbSend({action:'dmtop',board:'zmq',day:'0'}));
  const probe=calls.slice();
  check('品牌网关保持 CORS simple POST',probe.length===1&&probe[0].method==='POST'&&(!probe[0].contentType||probe[0].contentType.startsWith('text/plain'))&&!probe.some(x=>x.method==='OPTIONS'),JSON.stringify(probe));

  submitDelay=180;
  const mergeRace=await page.evaluate(async()=>{
    localStorage.setItem('zmq_pending',JSON.stringify([{action:'dmsub',board:'zmq',day:'0',id:'race',name:'先分',score:5}]));
    const flight=pendFlush();setTimeout(()=>pendPush({action:'dmsub',board:'zmq',day:'0',id:'race',name:'后分',score:9}),45);
    await flight;return pendLoad();
  });
  check('补传飞行中产生的更高分不会被旧响应吞掉',mergeRace.length===1&&mergeRace[0].score===9,JSON.stringify(mergeRace));
  await page.evaluate(()=>pendFlush());
  check('保留的更高分可在下一趟确认送达',await page.evaluate(()=>pendLoad().length===0));
  submitDelay=0;

  submitMode='fail';
  const failedBest=await page.evaluate(async()=>{
    localStorage.setItem('zmq_pending','[]');localStorage.setItem('zmq_solobest',JSON.stringify({d0:7,d2:11}));
    const result=await syncSoloBest();return {result,pending:pendLoad()};
  });
  check('手动上传失败后两档最佳都耐久留存',failedBest.result.tried===2&&failedBest.result.left===2&&failedBest.pending.length===2,JSON.stringify(failedBest));
  submitMode='ok';
  const recoveredBest=await page.evaluate(async()=>{const result=await syncSoloBest();return {result,pending:pendLoad()};});
  check('重试成功后清理已确认任务',recoveredBest.result.sent===2&&recoveredBest.result.left===0&&recoveredBest.pending.length===0,JSON.stringify(recoveredBest));

  raceMode=true;
  await page.evaluate(()=>showLbHall());
  await page.click('.lbtab[data-d="1"]');
  await page.waitForFunction(()=>document.querySelector('#lblist')?.textContent.includes('新快榜'));
  await page.waitForTimeout(420);
  const hall=await page.evaluate(()=>({text:document.querySelector('#lblist')?.textContent||'',cap:document.querySelector('#lb-cap')?.textContent||'',width:document.documentElement.scrollWidth}));
  check('快速切榜只让最新响应落屏',hall.text.includes('新快榜')&&!hall.text.includes('旧慢榜'),JSON.stringify(hall));
  check('排行榜面板 390px 无横向溢出',hall.width===390,String(hall.width));
  check('网络专项无脚本错误',pageErrors.length===0,pageErrors.join('\n'));

  for(const item of checks)console.log(`${item.ok?'✓':'✗'} ${item.name}${item.ok||!item.detail?'':'\n  '+item.detail}`);
  const failed=checks.filter(item=>!item.ok);
  console.log(`\n自鸣棋排行榜网络专项 ${checks.length-failed.length}/${checks.length}`);
  if(failed.length)process.exitCode=1;
}finally{
  await browser.close();server.close();
}
