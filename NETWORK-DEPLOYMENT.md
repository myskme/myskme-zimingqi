# 自鸣棋 · 新域名与网络发布说明

本版本为 `zimingqi.myskme.com` 准备 EdgeOne 静态正门，GitHub Pages 继续作为灾备门。两处
运行同一份 `index.html` 与资源；排行榜仍固定访问 `https://myskme.com/api/game`，继续写
原 Cloudflare Worker + D1，不迁库、不双写。

## 已落地

- `manifest.webmanifest`、PWA 图标与 `sw.js`：打开一次后可离线进入游戏；图片、音效、音乐
  只在实际使用时缓存，首访不下载全体立绘和三首背景音乐。
- 导航网络优先、离线回落；静态资源缓存优先；跨域榜单、`/api/` 和所有非 GET 请求不缓存。
- 榜单 POST 不声明 `application/json`，保持 CORS simple request，避免额外 OPTIONS 往返。
- 结算页的“回响战书”把军团快照放在 `zimingqi.myskme.com/?echo=...` 链接中；接收方首屏即可验明是真实军团并离线开局，不新增账号或后端依赖。
- 世界回廊严格不造虚拟玩家：空榜显示个人门槛；真人池空时只出现明确标注的“系统守关局”，且不会上传真实榜单。
- `edgeone.json` 为入口文件与 Service Worker 设置 `no-cache`，美术资源缓存一天；现有资源
  仍会原名更新，因此不使用 `immutable`。
- `.github/workflows/deploy-edgeone.yml` 只允许手动触发，且默认只构建 ZIP，不会因合并自动上线。

## 上线前一次性配置

1. 在 EdgeOne Makers 创建项目 `myskme-zimingqi`，区域沿用灵石远征的全球可用区方案。
2. 绑定 `zimingqi.myskme.com`，在 DNSPod 完成归属 TXT、CNAME 和免费证书。
3. GitHub 仓库 Secret 配置 `EDGEONE_API_TOKEN`。
4. 先运行默认的手动工作流下载 ZIP；控制台预览验收通过后，再以 `deploy=true` 手动发布。
5. 验收首页、单人点将、榜单读写、飞行模式重开、390×844 无横向溢出；确认请求前无 OPTIONS。
6. 用两台设备验证回响战书：A 结算分享，B 打开链接后首页出现“真实回响”，第 4 关遇到 A 的军团。

本机验证与打包：

```bash
npm run verify:release
npm run build:edgeone -- /private/tmp/zimingqi-edgeone.zip
```
