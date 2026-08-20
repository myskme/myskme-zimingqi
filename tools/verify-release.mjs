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
ok('SW 核心壳完整安装后才接管',sw.includes('CORE_SHELL.map')&&sw.includes("cache:'reload'")&&sw.includes("throw new Error('core shell unavailable')"));
ok('SW 不重复预缓存根路径与 index',!/const CORE_SHELL=\[\s*'\.\/'/.test(sw)&&sw.includes("'./index.html'"));
ok('SW 拒绝旧入口跨域跳转',sw.includes("redirect:'error'")&&sw.includes("finalURL.origin!==self.location.origin"));
ok('SW 慢网 0.9 秒先开缓存',sw.includes('setTimeout(()=>resolve(cached),900)')&&sw.includes('event.waitUntil(network.catch(()=>null))'));
ok('SW 无可用壳时显示恢复页',sw.includes('recoveryHTML')&&sw.includes('自鸣棋正在恢复'));
ok('SW 后台网络 4.5 秒完整止损',sw.includes('setTimeout(()=>controller.abort(),4500)')&&sw.includes('})().finally(()=>clearTimeout(timeout))'));
ok('SW 资源未命中 10 秒止损',sw.includes('boundedFetch(request,null,10000)'));
ok('SW 音乐按首次播放缓存',sw.includes("mp3"));
ok('补传不抢首屏且恢复联网自愈',html.includes('function schedulePendFlush()')&&html.includes("addEventListener('online',schedulePendFlush)")&&html.includes('schedulePendFlush()} // 世界榜保底'));
ok('本机最佳统一先落耐久队列',html.includes('function soloBestPayloads()')&&html.includes('async function syncSoloBest()')&&html.includes('pays.forEach(pendPush)'));
ok('成功确认不误删并发产生的更高分',html.includes('function pendAck(pay)')&&html.includes("(x.score|0)>score")&&html.includes('if(r&&r.ok){pendAck(pay)'));
ok('快速切榜旧响应不能反盖新页签',html.includes('let lbViewSeq=0')&&html.includes('if(seq!==lbViewSeq)return')&&html.includes('if(seq===lbViewSeq)netFail'));
ok('榜单网关对外口径一致',!html.includes('play.myskme.com')&&html.includes('myskme.com 品牌网关 HTTPS'));
ok('影军与名匠请求统一超时',(html.match(/fetch\(LB_URL/g)||[]).length===1&&html.includes("lbSend({action:'gpull'")&&html.includes("lbSend({action:'hpush'")&&html.includes("lbSend({action:'gpush'"));
ok('SW 注册不重复手动更新',html.includes("navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch")&&!html.includes('reg=>reg.update()'));
ok('真实音效三路并发且单请求限时',html.includes('const REAL_LOAD_CONCURRENCY=3')&&html.includes('Math.min(REAL_LOAD_CONCURRENCY,jobs.length)')&&html.includes('setTimeout(()=>ctl.abort(),10000)'));
ok('四象星图从现有数据源实时派生',html.includes("const ATLAS_ELEMS=['earth','water','fire','wind']")&&html.includes('ATLAS_PLAYS.filter(k=>BONDS[k].ids.includes(id))')&&html.includes('COMBOS.map(atlasComboCard)'));
ok('图鉴立绘四路按当前页延迟加载',html.includes('while(_atlasImgActive<4&&_atlasImgQueue.length)')&&html.includes("querySelectorAll('img[data-atlas-src]')")&&html.includes('requestAnimationFrame(atlasHydrateImages)'));
ok('高清星图支持移动端系统分享与桌面下载',html.includes('navigator.canShare({files:[file]})')&&html.includes("a.download=file.name")&&html.includes("const ATLAS_POSTER=ATLAS_DIR+'zimingqi-atlas-2400.png'"));
ok('高清海报与游戏共用四象羁绊秘契数据',html.includes("['earth','wind','fire','water'].map(posterElement)")&&html.includes('ATLAS_PLAYS.map(posterBond)')&&html.includes('COMBOS.map(posterCombo)')&&html.includes('<section class="ap-cycle"><strong>四象相克环</strong>'));

for(const path of [
  'assets/pwa-20260809/app-icon-192.png',
  'assets/pwa-20260809/app-icon-512.png',
  'assets/pwa-20260809/apple-touch-icon.png',
  'assets/pwa-20260809/favicon-64.png',
  'assets/platform-20260809/app-icon-master-1024.png',
  'assets/platform-20260809/ios/AppIcon.appiconset/AppIcon-1024.png',
  'assets/platform-20260809/wechat/game-icon-512.png',
  'assets/platform-20260809/wechat/share-card-5x4.png',
  'assets/platform-20260809/marketing/og-cover-1200x630.png',
  'assets/codex-atlas-20260810/atlas-background-source.png',
  'assets/codex-atlas-20260810/atlas-background.webp',
  'assets/codex-atlas-20260810/zimingqi-atlas-2400.png',
  'assets/codex-atlas-20260810/zimingqi-atlas-1200.jpg',
  'assets/codex-atlas-20260810/zimingqi-atlas-preview-600.jpg',
  'assets/codex-atlas-20260810/atlas-data.json',
  'assets/codex-atlas-20260810/manifest.json',
  'assets/artifacts-20260820/artifact-earth-seal.webp',
  'assets/artifacts-20260820/artifact-water-mirror.webp',
  'assets/artifacts-20260820/artifact-fire-heart.webp',
  'assets/artifacts-20260820/artifact-wind-wheel.webp'
]){
  const info=await stat(new URL('../'+path,import.meta.url));
  ok(path,info.isFile()&&info.size>1024);
}

for(const item of checks)console.log(`${item.ok?'✓':'✗'} ${item.name}`);
const failed=checks.filter(item=>!item.ok);
console.log(`\n自鸣棋发布校验 ${checks.length-failed.length}/${checks.length}`);
if(failed.length)process.exit(1);
