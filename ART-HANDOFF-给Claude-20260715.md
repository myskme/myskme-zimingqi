# 自鸣棋 20260715 美术系统 · 给 Claude Code 的接线交接单

交付版本：`20260715a`  
委托起始基线：`main@c06f61b`  
最终同步基线：`main@5f829ee`（Claude 全日验收 19 修，`#selftest 253/253`）  
职责边界：GitHub 只新增版本化运行时美术资产与接线文档；Image2 母版、构建／验证工具和高 DPR 验收画板收录在 iCloud 长期资源包。本次不修改战斗数值、机制、事件模拟、存档、`_meta`、`S` 或页面运行时代码。接线由 Claude Code 完成。

## 1. 交付目录

| 目录 | 内容 | 运行时定位 |
|---|---|---|
| `assets/vfx-20260715/` | 8 张静态 WebP 帧图、2 档透明演武台、manifest 与接线说明 | 战斗回放层／`#arena` 装饰层 |
| `assets/card-frames-20260715/` | 5 档 3:4 透明卡框、共用底板、5 枚角标、4 档星辉词缀品质框 | 征募三选一／角色详情可复用 |
| `assets/ui-framework-20260715/` | 四角饰、章节分隔纹、云丝纹理、MYSKME 印章 | 面板装饰与品牌层 |
| `assets/boss-event-20260715/` | 叶王名牌、横竖屏紫雾转场、事件卡背 | 叶王入场／事件翻牌 |
| `assets/roster-art-20260715/` | 名册双尺寸封面、5 档称号纹章、7 类成就纹章 | 「狼先生的名册」 |
| iCloud 长期包 `assets/art-direction-20260715/` | 4 张 Image2 母版、透明地台源、提示词、离线总览与 3 张高 DPR 设备验收画板 | 设计追溯，不进 GitHub 运行时目录 |
| iCloud 长期包 `scripts/` | 确定性构建、设备验收与统一校验脚本 | 复现／验收，不进 GitHub 运行时目录 |

旧资产没有同名覆盖或删除；`ART_VER=20260713f`、`UI_ICON_VER=20260714c` 均未改。

## 2. 战斗 VFX 接线：只进回放层

推荐接入 `runPlayback()` 内的 `applyEntry()`，不要进入 `simulateBattle()`。资源是静态 WebP 图集，不是 animated WebP；帧序统一从左到右、从上到下（row-major）。详细帧率、锚点、显示尺寸、混合模式、峰值帧和校验值都在 `assets/vfx-20260715/vfx-manifest.json`。

事件路由：

```text
普通斩击：e.t === 'dmg' && e.tag === '攻击' && source存在 && source.tg !== 'pierce'
穿透箭迹：e.t === 'dmg' && e.tag === '攻击' && source存在 && source.tg === 'pierce'
暴击金爆：e.t === 'dmg' && e.crit
冲击环：e.t === 'dmg' && (e.hpDmg ?? e.amt) > 0
护盾受击：e.t === 'shieldHit'
死亡碎散：e.t === 'die'
治疗光：e.t === 'heal'
蛇蜕紫雾：e.t === 'shed'
```

两个不可混淆的语义：

1. 死亡特效必须绑定 `e.t === 'die'`，不能绑定 `e.kill`。复读复活和叶王蛇蜕也可能在伤害事件上出现 `kill:true`，若用 `kill` 会在复活／蜕皮前错误碎尸。
2. 当前 `shieldHit` 没有护盾剩余量，所以该图定义为“护盾受击裂纹”，每次 `shieldHit` 都可播放，不能只叫“破盾”。

建议：

- 普通攻击叠“斩击 + 低强度冲击环”；穿透攻击叠“箭迹 + 冲击环”，不再加斩击；暴击额外叠金爆。
- `e.eff > 1` 可将冲击环放大约 12%，`e.eff < 1` 缩到 85% 且透明度降到 60%。
- `PB.skip === true` 不创建 VFX 节点；`PB.speed === 2` 时动画时长与飞行时间同步减半。
- VFX 容器 `pointer-events:none`、`aria-hidden="true"`；建议最多同时 8–10 个节点，共享一个 `requestAnimationFrame`。
- `prefers-reduced-motion: reduce` 只显示 manifest 中 `peakFrame` 约 120ms 再淡出。
- 资源失败时保留现有 `.u.hit`、`.u.dead`、飘字、CSS 护盾与战斗日志，继续满足“有图则用、缺图回退”。

演武台使用 `arena-dais-1600.webp`；窄屏可用 `arena-dais-800.webp`。建议置于 `#arena` 的绝对装饰层，`center bottom`，宽度约竞技场 108%–112%，底部下沉约 28px，不能挡单位点击。

## 3. 征募卡框接线

五档卡框均为 `768×1024` 透明 WebP，共用画井 `x=64, y=60, w=640, h=900`，结构递进不是单纯换色。推荐叠放顺序：

```text
recruit-backplate.webp
→ cardURL(id) 角色全幅图（object-fit: contain）
→ recruit-frame-{rarity}.webp
→ 左上阵营徽记／右上穿透或嘲讽／右下 rarity-corner
→ DOM 名称、费用与操作按钮
```

- 29 张旧 `card-*.webp` 为透明角色裁切；瑾、涵、浩、睿、海、欣复用的 6 张正式立绘带深蓝不透明背景。底板和画井已经按两类素材共同设计，接线时不要强制抠除这 6 张背景。
- 固定 3:4 全幅叠框优先；若走 `border-image`，manifest 记录了 `slicePx:96`。
- `rarity-corner-*.svg` 不烘焙 N/R/SR/SSR/UR 文字，字母继续由 DOM 输出，便于本地化和读屏。
- `affix-quality-common/fine/rare/legendary.svg` 替代词缀临时圆点，分别对应凡／秀／珍／传世；只在购买后的已拥有单位详情或名册显示。**征募候选卡不得显示**，以免泄露购买时随机词缀结果。
- iPad 与手机征募卡建议保持最大宽 340px；卡框是透明叠层，不要额外加高成本滤镜。

## 4. 界面框架件

`assets/ui-framework-20260715/` 是装饰系统，不是 24px 语义图标。请不要把它们塞进现有 45 枚 `UI_ICON_PATHS`，也不要修改图标数量自检。

- 四角饰：各自独立方向，不需要运行时旋转也可用；作为 `mask-image` 或 `<img aria-hidden>`。
- `divider-broken-cloud.svg`：章节标题／模式说明／名册小节的横向分隔。
- `pattern-cloudsilk-mask.svg`：256×256 无缝遮罩，建议面板不透明度 2.5%–6%，不能影响正文对比度。
- `brand-myskme-seal.svg`：纯路径的 MYSKME 品牌印章，推荐在说明页、名册页和事件卡背附近克制使用。

全部 SVG 使用 `currentColor`，无 `<text>`、外部字体、`<image>`、外链或 SVG filter，适合离线和 `file://`。

## 5. 叶王入场与事件卡背

- `boss-yewang-nameplate.webp` 为透明横幅，不含烘焙文字；中央已留 DOM 标题安全区。叶王名、称号、无障碍文本继续用 HTML。
- 两张 `boss-yewang-transition-*` 只在边缘放紫雾和金黑裂纹，中部通透。横屏用 1600×900，手机竖屏用 900×1600；已有叶王正式立绘才是主体。
- 替换 `startBossSequence()` 的廉价蛇形折线时，只换视觉节点，完整保留 `bossResolved`、续局幂等、发奖和抓人逻辑。
- `event-card-back.webp` 为 840×600，对应当前 420×300 显示位的 2×图；无汉字“命”、无人物、无蛇形、无可读文字。

## 6. 「狼先生的名册」

- 双尺寸封面：`roster-cover-1200.webp`／`roster-cover-600.webp`；右侧为 DOM 标题与账号数据安全区。
- 五档称号纹章：见习生、学徒、高徒、首徒、断云弟子，逐档增加结构，但不使用皇冠、金币、数字或汉字。
- 7 枚成就类别徽记复用覆盖现有 18 个成就；完整 ID 映射写在 `assets/roster-art-20260715/manifest.json`。
- 接线只读取现有 `_meta` 数据；不要把 `_meta` 写入 `S`，不要改变 `zmq_meta` 与 `dyyw1` 的存储边界。

## 7. 验收与复现

离线总览：长期资源包 `assets/art-direction-20260715/preview-gallery.html`。主验收视口为 iPad 横屏、iPad 竖屏与手机竖屏，全部按高 DPR 渲染检查；桌面端只做兼容性检查，不作为本轮的主视觉基准。

已产出三张物理像素验收画板：`qa-ipad-landscape-2x.webp` 2388×1668、`qa-ipad-portrait-2x.webp` 1668×2388、`qa-phone-portrait-3x.webp` 1290×2796。三张都只在 iCloud 长期包中保留，不增加 GitHub Pages 运行时体积。

统一验证：

```bash
MYSK_NODE_MODULES="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" \
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" \
  scripts/validate-all.mjs .
```

接线完成后请继续运行项目原有 `#selftest`；本次资产提交本身不新增运行时代码，因此以最新 Claude 基线 `253/253` 为准。若接线新增断言，由 Claude 在自己的提交里同步新总数并追加 `AI-COLLABORATION.md`，不要重写 Codex 条目。

## 8. 双方协作备注

- Claude 下一步开始前先 `git pull --rebase`，确认本资产提交已在祖先历史中。
- 接线只改增量，不整段覆盖 `index.html`，尤其不要改变 `BOUNTIES / BONDS / ZODIAC`、星辉词缀／星芒成长、不屈命脉、名匠榜／玩家名片、云阶十行、模拟战斗、账户成长、音效与 45 枚正式图标。
- 新一轮美术如需调整，继续创建 `*-20260715b` 等新目录，通过映射切换；不要覆盖本轮正式文件。
