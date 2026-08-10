# 自鸣棋 · 正式域名与网络发布说明

当前正式正门为 `https://zimingqi.myskme.com/`，由 GitHub Pages 承载并强制 HTTPS；
`https://myskme.github.io/myskme-zimingqi/` 保留为同源代码的灾备入口。排行榜固定访问
`https://myskme.com/api/game` 品牌网关，继续写原 Cloudflare Worker + D1，不迁库、不双写。

## 已落地

- `manifest.webmanifest`、PWA 图标与 `sw.js`：打开一次后可离线进入游戏；图片、音效、音乐
  只在实际使用时缓存，首访不下载全体立绘和三首背景音乐。
- 导航网络优先：已有缓存时，弱网超过 0.9 秒先开旧壳，后台继续更新；后台请求在 4.5 秒
  止损。核心壳安装强制绕过旧 HTTP 缓存，根路径与 `index.html` 不重复预缓存。
- 静态资源缓存优先、未命中请求 10 秒止损；跨域榜单、`/api/` 与所有非 GET 请求不进 SW。
- 榜单 POST 不声明 `application/json`，保持 CORS simple request，避免额外 OPTIONS 往返。
- 待上传成绩在首屏 `load` 后的空闲期补传，不与标题 KV 抢带宽；浏览器从离线恢复联网时
  会自动触发同一条单飞队列。失败记录保留在本机，重复补传由后端 `max` 语义保证幂等。
- 影军、名匠榜与世界榜统一通过带超时的 `lbSend`；真实音效 24 个小文件限制为三路并发。
- “回响战书”把真实军团快照放进分享链接；正式域名不可用时可回退 GitHub Pages 灾备入口。
- 世界回廊不造虚拟玩家：空榜显示个人门槛；真人池空时只出现明确标注的“系统守关局”，
  且不会上传真实榜单。
- `edgeone.json` 与手动 EdgeOne 打包流程保留为未来可选的第二分发层，当前没有接管正式域名，
  也不应修改 `zimingqi.myskme.com` 的现有 DNS 或证书。

## 发布与验收

1. 从最新 `main` 建分支，保持 `CNAME` 为 `zimingqi.myskme.com`。
2. 运行 `npm run verify:release`、`npm run selftest:pwa` 与内置 `#selftest`。
3. 验收 HTTPS 200、HTTP 301、榜单读写、飞行模式重开、慢网缓存回落和 390×844 无溢出。
4. 用两台设备验证回响战书：A 结算分享，B 打开后首页出现“真实回响”，第 4 关遇到 A 军团。
5. 只有在明确决定启用 EdgeOne 时，才运行手动工作流构建 ZIP 并在预览域名验收；不要自动
   覆盖当前 GitHub Pages 正式入口。

本机验证与可选打包：

```bash
npm run verify:release
npm run selftest:pwa
npm run build:edgeone -- /private/tmp/zimingqi-edgeone.zip
```
