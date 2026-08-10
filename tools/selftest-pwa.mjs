import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';

const ROOT=resolve(process.argv[2]||'.');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
let navigationMode='normal';
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://local/').pathname);
    if((path==='/'||path==='/index.html')&&navigationMode==='redirect'){
      res.writeHead(302,{Location:'http://127.0.0.1:9/old-custom-domain'});res.end();return;
    }
    if((path==='/'||path==='/index.html')&&navigationMode==='slow')await new Promise(resolveDelay=>setTimeout(resolveDelay,1800));
    const file=resolve(ROOT,path==='/'?'index.html':path.replace(/^\/+/,''));
    if(!file.startsWith(ROOT))throw new Error('bad path');
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});
    res.end(body);
  }catch(error){res.writeHead(404);res.end('404')}
});

await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const requests=[];const errors=[];
page.on('request',request=>requests.push(request.url()));
page.on('pageerror',error=>errors.push(String(error)));

try{
  await page.goto(url,{waitUntil:'load'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const online=await page.evaluate(()=>({
    title:document.title,
    controlled:Boolean(navigator.serviceWorker.controller),
    width:document.documentElement.scrollWidth,
    solo:Boolean(document.querySelector('#btn-solo'))
  }));
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  const offline=await page.evaluate(()=>({title:document.title,solo:Boolean(document.querySelector('#btn-solo'))}));
  await context.setOffline(false);
  navigationMode='slow';const slowStart=Date.now();await page.reload({waitUntil:'domcontentloaded'});const slowMs=Date.now()-slowStart;
  const slow=await page.evaluate(()=>({title:document.title,solo:Boolean(document.querySelector('#btn-solo')),bootMs:window.__ZMQ_BOOT_MS}));
  navigationMode='redirect';await page.reload({waitUntil:'domcontentloaded'});
  const redirectFallback=await page.evaluate(()=>({title:document.title,solo:Boolean(document.querySelector('#btn-solo'))}));
  const bgmOnFirstVisit=requests.some(item=>item.includes('/assets/bgm/'));
  const allGood=online.controlled&&online.width===390&&online.solo&&offline.solo&&slow.solo&&slowMs<1500&&redirectFallback.solo&&!bgmOnFirstVisit&&!errors.length;
  console.log(JSON.stringify({online,offline,slowNavigation:{...slow,elapsedMs:slowMs},oldDomainRedirectFallback:redirectFallback,bgmOnFirstVisit,pageErrors:errors,requestCount:requests.length},null,2));
  console.log(allGood?'自鸣棋 PWA 在线/离线验收 ✅':'自鸣棋 PWA 在线/离线验收 ❌');
  if(!allGood)process.exitCode=1;
}finally{
  await browser.close();
  server.close();
}
