#!/usr/bin/env node
// 自鸣棋 · 对外口径自检
//
// 由来（2026-08-10）：全生态对账查出六处「文档里的数字/网址过期了」，其中三处在本作——
//   总账开头写着 37 名学员、#selftest 288，实际早已是 43 与 320；
//   而正门搬到 zimingqi.myskme.com 之后，好几处还写着 github.io。
//   这类错不会让游戏挂掉，所以没人发现；但下一个接手的 AI 会照着它推理，然后一路错下去。
//
// 原则：**本作对外声明的每个数字与网址，都必须能对得上本仓库里的事实源。**
//   单位数的事实源 = index.html 的 UNITS（不是总账）
//   正门的事实源   = 仓库根的 CNAME（不是 README，GitHub Pages 认的就是这个文件）
//
// 本脚本零依赖、只读、不碰网络，故意做成「只查本仓库」——不依赖任何别的仓库能不能拉到。
// 跨仓库那一层（主页有没有跟着改）由 myskme-hub 自己的同名脚本负责，两边各查各的责任田。
//
// 用法：node tools/qa-consistency.mjs   或   npm run qa:consistency

import { readFileSync } from 'node:fs';

const 错 = [], 疑 = [], 过 = [];
const 读 = p => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

const html = 读('index.html');
const cname = 读('CNAME');
const 总账 = 读('自鸣棋总账-人物剧情系统资产全录.md');
const readme = 读('README.md');
const 日志 = 读('AI-COLLABORATION.md');

if (!html || !cname) {
  console.error('[错] 找不到 index.html 或 CNAME，本脚本必须在自鸣棋仓库根目录运行。');
  process.exit(2);
}

// ── 事实源 ──
const 段 = html.slice(html.indexOf('const UNITS = ['), html.indexOf('const UMAP'));
const UNITS = (段.match(/\{id:'[a-z_]+',/g) || []).length;
const 域名 = cname.trim();
const 正门 = `https://${域名}/`;

if (!UNITS) { console.error('[错] 没能从 index.html 数出 UNITS，脚本的取法可能过时了，先修脚本再说。'); process.exit(2); }
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(域名)) { console.error(`[错] CNAME 内容不像域名：「${域名}」`); process.exit(2); }

// ── 逐条核对对外声明 ──
const 核对 = (名, 文本, 正则, 期望, 出处) => {
  if (文本 == null) { 疑.push(`${名}：找不到文件，跳过`); return; }
  const m = 文本.match(正则);
  if (!m) { 疑.push(`${名}：没匹配到声明（文案改写过？正则要跟着更新，否则这处从此不再受检）`); return; }
  const 实 = m[1].replace(/[<>]/g, '');
  if (实 !== String(期望)) 错.push(`${名} 写的是「${实}」，但 ${出处} 是「${期望}」`);
  else 过.push(`${名} 对上 ${出处}（${期望}）`);
};

核对('总账 现状行的可玩单位数', 总账, /\*\*(\d+) 名可玩单位\*\*/, UNITS, 'index.html 的 UNITS');
核对('总账 现状行的正门', 总账, /正门 <([^>]+)>/, 正门, '仓库根 CNAME');
核对('README 正式地址', readme, /\*\*正式地址：\*\*\s*(\S+)/, 正门, '仓库根 CNAME');

// 自检数字只报「疑」：真值要在浏览器里跑一次才知道，这里只能比
// 「总账写的」与「协作日志里最近一次记录的」，不一致通常是总账忘了更新。
if (总账 && 日志) {
  const 声明 = 总账.match(/#selftest (\d+)\/\d+/);
  const 记录 = [...日志.matchAll(/selftest[`\s*]*(\d+)\/\d+/g)].map(m => +m[1]);
  const 最近 = 记录.length ? Math.max(...记录) : null;
  if (声明 && 最近 != null && +声明[1] !== 最近) 疑.push(`总账写 #selftest ${声明[1]}，协作日志里最高记录是 ${最近}（总账可能忘了更新）`);
  else if (声明 && 最近 != null) 过.push(`#selftest=${最近}：总账与协作日志一致`);
}

// ── 报告 ──
const 线 = '─'.repeat(56);
console.log('\n' + 线 + '\n自鸣棋 · 对外口径自检\n' + 线);
console.log(`事实源：UNITS=${UNITS}（index.html）· 正门=${正门}（CNAME）`);
过.forEach(m => console.log('[过] ' + m));
if (错.length) { console.log(`\n[错] 确定错误 ${错.length} 处（必修）`); 错.forEach(e => console.log('     ' + e)); }
else console.log('\n[过] 确定错误：0');
if (疑.length) { console.log(`[疑] 需人工判读 ${疑.length} 处`); 疑.forEach(w => console.log('     ' + w)); }
console.log(线 + '\n');
process.exit(错.length ? 1 : 0);
