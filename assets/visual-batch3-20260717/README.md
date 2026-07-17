# MYSKME 自鸣棋 · 视觉全权第三批 20260717c

本目录只承载“世界回廊 · 名望仪式”的正式运行资产，不含玩法数据。

## 资产

- `profile/`：Image2 分别生成横向与竖向两套无字名片底板，每套三档 WebP，以及确定性的名片框／分隔纹 SVG。
- `emblems/rank-*.svg`：世界回廊前三名 currentColor 徽章。
- `emblems/arena-tier-*.svg`：群英擂台五档 currentColor 段位章；阈值与名称仍由现有 DOM/数据提供。
- `emblems/hall-laurel.svg`、`feed-ribbon.svg`、`corridor-pattern.svg`：名匠榜、绝品实录与回廊底纹。
- `emblems/emblem-death.svg`：打法轴“亡语”的 currentColor 纹章。

所有 SVG 均无文字、字体、脚本、外链和位图引用。运行时以 CSS mask 或同源内联路径使用；资源探针失败时保留旧面板、数字名次与文字标签。

## Image2 母版

原始 PNG 不进入 GitHub Pages，长期包保存在本批交付的 `masters/profile-backplate-image2.png`。生成目标为高级黑金珐琅、星象仪器、东方幻想与课堂肉鸽统一语言；中心留给 DOM 姓名、称号、签名、纪录与镇店之宝，不烘焙任何文字、数字或按钮。

## 运行边界

- 不修改 `pget/psave/plike/htop/dmtop`、榜单顺序、分数、阈值、存档或网络。
- 玩家名片样式严格限定在 `.player-profile-card`，不污染课堂答题卡共用的 `.pcard`。
- `prefers-reduced-motion` 下停止绝品实录流光与徽章呼吸，只保留静态层级。
