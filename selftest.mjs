// 自鸣棋自检 CI runner：headless 打开 index.html#selftest → 读 document.title = "#selftest N/N" → 断言 N===N。
// selftest 命中 #selftest hash 时游戏 early-return 只跑 runSelftest()，不进游戏、不需 assets/canvas → headless 稳。
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const file = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
    if (file.includes('..')) { res.writeHead(400); return res.end('bad'); }
    res.writeHead(200); res.end(await readFile(ROOT + file));
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
let title = '';
try {
  await page.goto(`http://localhost:${port}/index.html#selftest`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => /#selftest \d+\/\d+/.test(document.title), null, { timeout: 30000 });
  title = await page.title();
} finally {
  await browser.close(); server.close();
}

const m = title.match(/#selftest (\d+)\/(\d+)/);
if (!m) { console.error('✗ 没读到 #selftest 结果，title=' + JSON.stringify(title)); process.exit(1); }
const pass = +m[1], total = +m[2];
console.log(`自鸣棋 #selftest ${pass}/${total}`);
if (total === 0 || pass !== total) { console.error(`✗ 自检未全过 (${pass}/${total})`); process.exit(1); }
console.log('✅ 全过');
