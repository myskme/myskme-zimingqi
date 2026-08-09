import {readFile,stat} from 'node:fs/promises';

const text=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const checks=[];
const ok=(name,value)=>checks.push({name,ok:Boolean(value)});

const [html,manifestRaw,sw,edge]=await Promise.all([
  text('index.html'),text('manifest.webmanifest'),text('sw.js'),text('edgeone.json')
]);
const manifest=JSON.parse(manifestRaw);
JSON.parse(edge);

ok('正式域名 canonical',html.includes('<link rel="canonical" href="https://zimingqi.myskme.com/">'));
ok('品牌网关保持单一 D1 入口',html.includes("const LB_URL='https://myskme.com/api/game'"));
ok('榜单普通 POST 不触发 JSON 预检',!html.includes("headers:{'Content-Type':'application/json'}"));
ok('首访不预热全部单位立绘',!html.includes('UNITS.forEach(x=>{const u=artURL(x.id)'));
ok('PWA 注册',html.includes("navigator.serviceWorker.register('./sw.js'"));
ok('PWA 独立显示',manifest.display==='standalone'&&manifest.start_url==='./');
ok('真实回响分享闭环',html.includes("const PRIMARY_SHARE_URL='https://zimingqi.myskme.com/'")&&html.includes("const FALLBACK_SHARE_URL='https://myskme.github.io/myskme-zimingqi/'")&&html.includes("location.hostname==='zimingqi.myskme.com'?PRIMARY_SHARE_URL:FALLBACK_SHARE_URL")&&html.includes('function echoParse')&&html.includes('navigator.share'));
ok('榜单不填充虚拟玩家',html.includes('NO FABRICATED PLAYERS')&&html.includes("SIM_GHOST_NAMES=['回廊守卫 · 系统局']"));
ok('战报二维码随承载入口自动切换',html.includes('const QR_PRIMARY=')&&html.includes('const QR_FALLBACK=')&&html.includes("location.hostname==='zimingqi.myskme.com'?QR_PRIMARY:QR_FALLBACK"));
ok('SW 不缓存非 GET',sw.includes("if(request.method!=='GET')return"));
ok('SW 排除跨域与 API',sw.includes("url.origin!==self.location.origin||url.pathname.startsWith('/api/')"));
ok('SW 导航 4.5 秒超时回落',sw.includes('setTimeout(()=>controller.abort(),4500)'));
ok('SW 音乐按首次播放缓存',sw.includes("mp3"));

for(const path of [
  'assets/pwa-20260809/app-icon-192.png',
  'assets/pwa-20260809/app-icon-512.png',
  'assets/pwa-20260809/apple-touch-icon.png',
  'assets/pwa-20260809/favicon-64.png',
  'assets/platform-20260809/app-icon-master-1024.png',
  'assets/platform-20260809/ios/AppIcon.appiconset/AppIcon-1024.png',
  'assets/platform-20260809/wechat/game-icon-512.png',
  'assets/platform-20260809/wechat/share-card-5x4.png',
  'assets/platform-20260809/marketing/og-cover-1200x630.png'
]){
  const info=await stat(new URL('../'+path,import.meta.url));
  ok(path,info.isFile()&&info.size>1024);
}

for(const item of checks)console.log(`${item.ok?'✓':'✗'} ${item.name}`);
const failed=checks.filter(item=>!item.ok);
console.log(`\n自鸣棋发布校验 ${checks.length-failed.length}/${checks.length}`);
if(failed.length)process.exit(1);
