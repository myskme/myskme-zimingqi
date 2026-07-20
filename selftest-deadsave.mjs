// 自鸣棋 · 「命脉耗尽的死档能不能被续局复活」行为验证
// 造一个 life=0 / phase=battle 的存档 → 刷新 → 看 resumePhase 把人送到哪
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const ROOT = process.argv[2];
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const file = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
    res.writeHead(200); res.end(await readFile(ROOT + '/' + file));
  } catch { if(!res.headersSent) res.writeHead(404); res.end('404'); }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('   [pageerror]', String(e).slice(0, 120)));
await page.route('**/*', r => (/workers\.dev/.test(r.request().url()) ? r.abort() : r.continue()));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(800);

// 造死档：phase=battle，命脉 0（这正是修复前 soloResolve 落下的状态）
await page.evaluate(() => {
  const dead = {
    solo: true, phase: 'battle', life: 0, lifeMax: 2, round: 4, difficulty: 1,
    endless: false, soloWins: 0, econRound: 4, rngState: 12345, uidSeq: 50,
    players: [{ name: '测试', coins: 9, crowns: 0, wins: 0, army: [], bench: [] }],
    soloFoe: [], ghostUsed: [], bounties: [], stratsGiven: [],
  };
  localStorage.setItem('dyyw1', JSON.stringify(dead));
});
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(1500);

const state = await page.evaluate(() => {
  const hasResume = !!document.querySelector('#btn-resume, [id*=resume]');
  let clicked = null;
  try {
    if (typeof S !== 'undefined' && S && S.solo) { clicked = 'auto'; }
  } catch (e) {}
  return {
    hasResumeBtn: hasResume,
    savedPhase: (() => { try { return JSON.parse(localStorage.getItem('dyyw1') || '{}').phase; } catch (e) { return null; } })(),
  };
});

// 直接驱动 resumePhase 看它路由到哪（不依赖标题页按钮长什么样）
const routed = await page.evaluate(() => {
  const log = [];
  const orig = { soloPreBattle: window.soloPreBattle, soloEnd: window.soloEnd, soloRound: window.soloRound };
  try {
    window.soloPreBattle = () => log.push('soloPreBattle(重打本关=复活)');
    window.soloEnd = (v) => log.push('soloEnd(' + v + ')');
    window.soloRound = () => log.push('soloRound');
    S = JSON.parse(localStorage.getItem('dyyw1'));
    resumePhase();
  } catch (e) { log.push('ERR:' + e.message); }
  finally { Object.assign(window, orig); }
  return log;
});

console.log('  存档里的 phase:', state.savedPhase);
console.log('  resumePhase 路由到:', routed.join(', ') || '(无)');
const revived = routed.some(x => x.includes('soloPreBattle'));
console.log(revived ? '  ❌ 死档被复活：又回到开战屏，可无限重打' : '  ✅ 死档直走结算，不能重打');

await browser.close(); server.close();
process.exit(revived ? 1 : 0);
