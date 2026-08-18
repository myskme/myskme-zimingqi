/* 自鸣棋 PWA：壳层离线、运行资源按需缓存；排行榜/API 与所有写请求永不入缓存。 */
const RELEASE='20260818b';
const SHELL_CACHE='zmq-shell-'+RELEASE;
const ASSET_CACHE='zmq-assets-'+RELEASE;
const CORE_SHELL=[
  './index.html',
  './manifest.webmanifest'
];
const OPTIONAL_SHELL=[
  './assets/pwa-20260809/app-icon-192.png',
  './assets/pwa-20260809/app-icon-512.png',
  './assets/pwa-20260809/apple-touch-icon.png',
  './assets/image2-system-20260713/title-kv-800.webp'
];

async function boundedFetch(input,options,timeoutMs){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs||10000);
  try{return await fetch(input,Object.assign({},options||{},{signal:controller.signal}))}
  finally{clearTimeout(timeout)}
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    // 根路径与 index.html 内容相同，只缓存一份；reload 绕过旧 HTTP 缓存，避免新 SW 配上旧壳。
    // HTML 壳失败时不激活一个“空缓存”控制器；图标/KV 失败仍可降级，不阻断核心安装。
    await Promise.all(CORE_SHELL.map(async url=>{
      const response=await boundedFetch(url,{cache:'reload'},12000);
      if(!response.ok)throw new Error('core shell unavailable');
      await cache.put(url,response);
    }));
    await Promise.allSettled(OPTIONAL_SHELL.map(async url=>{
      const response=await boundedFetch(url,{cache:'reload'},8000);
      if(response.ok)await cache.put(url,response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keep=new Set([SHELL_CACHE,ASSET_CACHE]);
    await Promise.all((await caches.keys()).filter(key=>key.startsWith('zmq-')&&!keep.has(key)).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

const recoveryHTML=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071118"><title>自鸣棋 · 正在恢复</title><style>html,body{height:100%;margin:0;background:#071118;color:#eee8d8;font-family:serif}main{min-height:100%;display:grid;place-content:center;text-align:center;padding:28px;box-sizing:border-box}h1{color:#e8c768;letter-spacing:.18em}p{color:#a8a294;line-height:1.8}button{min-height:48px;padding:0 24px;border:1px solid #c9a64a;background:#17242c;color:#eee8d8;font-size:16px}</style><main><h1>自鸣棋正在恢复</h1><p>旧版桌面缓存或网络入口暂时没有接上。<br>联网后点一下即可重新载入；存档仍保存在本机。</p><button onclick="location.reload()">重新载入</button></main></html>`;

async function navigation(request,event){
  const cachePromise=caches.open(SHELL_CACHE);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4500);
  const network=(async()=>{
    // 禁止旧 GitHub Pages PWA 跟随到未启用 HTTPS 的跨域入口；跨源/错误页都回落已缓存壳，避免 iOS 白屏。
    const fresh=await fetch(request,{signal:controller.signal,redirect:'error'});
    const finalURL=new URL(fresh.url||request.url);
    if(!fresh.ok||finalURL.origin!==self.location.origin)throw new Error('bad navigation response');
    const cache=await cachePromise;await cache.put('./index.html',fresh.clone());return fresh;
  })().finally(()=>clearTimeout(timeout));
  if(event)event.waitUntil(network.catch(()=>null));
  const cache=await cachePromise;
  const cached=(await cache.match('./index.html'))||(await cache.match('./'));
  try{
    // 网络快就拿新版本；弱网超过 900ms 则先开缓存，后台继续更新，下次进入即是新壳。
    if(cached){const fast=await Promise.race([network,new Promise(resolve=>setTimeout(()=>resolve(cached),900))]);if(fast)return fast}
    return await network;
  }catch(error){
    return cached||new Response(recoveryHTML,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
  }
}

async function cacheFirst(request){
  const cache=await caches.open(ASSET_CACHE);
  const hit=await cache.match(request);
  if(hit)return hit;
  const fresh=await boundedFetch(request,null,10000);
  if(fresh.ok)await cache.put(request,fresh.clone());
  return fresh;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith(navigation(request,event));
    return;
  }
  if(url.pathname.includes('/assets/')||/\.(?:png|webp|svg|m4a|mp3|woff2?)$/i.test(url.pathname)){
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
