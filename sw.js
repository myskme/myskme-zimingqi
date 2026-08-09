/* 自鸣棋 PWA：壳层离线、运行资源按需缓存；排行榜/API 与所有写请求永不入缓存。 */
const RELEASE='20260809b';
const SHELL_CACHE='zmq-shell-'+RELEASE;
const ASSET_CACHE='zmq-assets-'+RELEASE;
const SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/pwa-20260809/app-icon-192.png',
  './assets/pwa-20260809/app-icon-512.png',
  './assets/pwa-20260809/apple-touch-icon.png',
  './assets/image2-system-20260713/title-kv-800.webp'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await Promise.allSettled(SHELL.map(async url=>{
      const response=await fetch(url);
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

async function navigation(request){
  const cache=await caches.open(SHELL_CACHE);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4500);
  try{
    const fresh=await fetch(request,{signal:controller.signal});
    if(fresh.ok)await cache.put('./index.html',fresh.clone());
    return fresh;
  }catch(error){
    return (await cache.match('./index.html'))||(await cache.match('./'))||Response.error();
  }finally{
    clearTimeout(timeout);
  }
}

async function cacheFirst(request){
  const cache=await caches.open(ASSET_CACHE);
  const hit=await cache.match(request);
  if(hit)return hit;
  const fresh=await fetch(request);
  if(fresh.ok)await cache.put(request,fresh.clone());
  return fresh;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith(navigation(request));
    return;
  }
  if(url.pathname.includes('/assets/')||/\.(?:png|webp|svg|m4a|mp3|woff2?)$/i.test(url.pathname)){
    event.respondWith(cacheFirst(request));
  }
});
