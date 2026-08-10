# 自鸣棋 · 四象星图（2026-08-10）

这组资源服务于游戏内“四象星图 · 羁绊图鉴”和可保存的高清总览图。

- `atlas-background-source.png`：Codex ImageGen 原始无字底图，仅负责氛围，不承载玩法资料。
- `atlas-background.webp`：游戏内轻量底图。
- `zimingqi-atlas-2400.png`：2400 × 3000 高清收藏海报，由 `tools/build-atlas-poster.mjs` 从 `index.html` 的 `ZODIAC / BONDS / COMBOS` 实时生成。
- `zimingqi-atlas-1200.jpg`：1200 × 1500 网页与社交传播版，供 Hub、编年史与分享页直接使用。
- `zimingqi-atlas-preview-600.jpg`：600 × 750 列表缩略图，避免首页为了一个入口下载高清原图。
- `atlas-data.json`：四象、43 人、六种打法和秘契的跨端结构化快照，微信版本、iOS 版或其他 MYSKME 页面可直接读取。
- `manifest.json`：每个产物的用途、尺寸、字节数和 SHA-256；便于后续同步、去重与自动验收。

重新生成：

```bash
npm run build:atlas
npm run qa:atlas
```

设计原则：四象是第一层记忆地图，打法羁绊是第二层构筑筛选，秘契组合是第三层长期追求。中文、人数、阈值和效果不写进生成式底图，避免资料漂移。任何下游项目优先读 `atlas-data.json` 或引用轻量图，不复制手写名单；角色与羁绊更新后由同一命令重新派生全部资产。

## ImageGen 原始提示词

参考图：`assets/image2-system-20260713/title-kv-1600.webp`

> Create a brand-consistent background plate for a premium vertical collector infographic for the MYSKME fantasy strategy game 自鸣棋, using the attached title art only as a visual-language reference. No characters. No readable text, letters, numbers, logos, UI buttons, frames, HUD, watermark, or icons. Portrait 4:5 composition. A deep midnight indigo-black celestial parchment surface with restrained antique gold linework. Divide the field subtly into four harmonious elemental regions arranged around one calm central circular cycle: earth = warm umber and mineral gold, water = deep blue and pale cyan, fire = muted vermilion and ember orange, wind = blue-grey and cool silver. Include delicate star dust, thin constellation-thread arcs, clouds and chessboard geometry that remain extremely subtle so exact Chinese labels and unit portraits can be overlaid clearly. Keep the center and four main content zones low-detail and readable. Mysterious, elegant, museum-atlas quality, mature East Asian fantasy, luxurious but restrained. Avoid cyberpunk, neon, sci-fi cockpit, ornate card frames, weapon silhouettes, crosshairs, halos, chibi motifs, busy decoration, or high contrast behind text. Flat front-facing poster background, no perspective tilt.
