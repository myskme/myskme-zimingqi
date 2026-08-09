# 自鸣棋跨平台发布资源 · 2026-08-09

统一视觉原则：一枚黑曜石棋子、一道克制金线、一轮深青日蚀。所有文件均为不带预圆角的实色 PNG；平台在最终显示时自行套用圆角或遮罩。

## 母版与网页

- `app-icon-master-1024.png`：1024×1024、无透明通道的唯一母版。
- PWA 派生：`../pwa-20260809/` 中 512、192、180、64 四档。
- `marketing/og-cover-1200x630.png`：正式域名 Open Graph / 社交预览封面。

## iOS

- `ios/AppIcon.appiconset/` 可直接拖入 Xcode Assets；`Contents.json` 使用现代 iOS 的单一 1024×1024 universal 图标入口。
- `ios/AppIcon-1024.png` 是独立备份，便于 App Store Connect、宣传或后续 Icon Composer 使用。
- 图标不带 Alpha、不预切圆角；不要在 Xcode 前再次压缩或套圆角。

## 微信小游戏

- `wechat/game-icon-512.png`：小游戏项目与资料页图标母件。
- `wechat/share-card-5x4.png`：1200×960（5:4）分享图，适合作为 `onShareAppMessage` 的 `imageUrl` 源文件。
- 将来原生迁移时保留网页中的 `echo` 战书协议：分享参数只含版本、化名、难度、最深关与单位 ID/星级，不含账号、手机号或课堂名单。

## 品牌约束

- 不加入狼先生头像、人物群像、第二枚棋子、棋盘、粒子或霓虹特效。
- 不把“18+”印到图标上；成熟感由材质、留白和文案语气表达。
- 新平台只从 1024 母版重新派生，避免多源图标逐步漂移。
