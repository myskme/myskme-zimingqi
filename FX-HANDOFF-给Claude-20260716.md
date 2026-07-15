# 自鸣棋 · 四象／十二星座／戏眼特效接线单（Codex → Claude）

> 交付版本：`20260716a`
> 制作基线：`e650f434b5174e95df9cead1358c14a732475eca`
> 分工边界：Codex 已完成母版、正式运行资产与资产验证；Claude 只接表现层并完成真机／浏览器验收。本文不授权改动玩法、数值或存档。

## 1. 交付结论

三套资产已齐，全部位于独立版本目录，没有覆盖或删除既有文件：

| 包 | 目录／清单 | 正式运行资产（不含预览） | 体积 |
|---|---|---:|---:|
| 四象元素 | `assets/elements-20260716/` · `elements-manifest.json` | 8 WebP + 4 SVG | 1,370,786 bytes |
| 十二星座 | `assets/zodiac-20260716/` · `manifest.json` | 12 SVG | 17,399 bytes |
| 戏眼过场 | `assets/setpiece-20260716/` · `setpiece-manifest.json` | 4 WebP | 1,075,712 bytes |
| 合计 | 3 个版本化目录 | **12 WebP + 16 SVG** | **2,463,897 bytes（约 2.35 MiB）** |

`preview.webp` 仅供目检，不进入运行时。三份 manifest 是文件名、规格、颜色、SHA-256 与路由语义的事实源；不要从中文名自行拼路径。

## 2. 四象相克命中特效

### 2.1 文件契约

每象均有一组 1x／2x 透明 WebP 命中图集和一张矢量成阵环：

| 象 | 固定颜色（复用 `ELEM_COLOR2`） | 命中图集 | 成阵环 |
|---|---|---|---|
| 火 `fire` | `#e08b7a` | `element-fire-hit.webp` / `element-fire-hit@2x.webp` | `element-fire-ring.svg` |
| 水 `water` | `#7fc4d8` | `element-water-hit.webp` / `element-water-hit@2x.webp` | `element-water-ring.svg` |
| 风 `wind` | `#9cc0e8` | `element-wind-hit.webp` / `element-wind-hit@2x.webp` | `element-wind-ring.svg` |
| 土 `earth` | `#c9a64a` | `element-earth-hit.webp` / `element-earth-hit@2x.webp` | `element-earth-ring.svg` |

- 1x：`512×256`，4×2、8 帧、row-major、每格 `128×128`。
- 2x：`1024×512`，4×2、8 帧、row-major、每格 `256×256`，但逻辑显示尺寸仍按 128 CSS px 计算。
- 帧率：24fps；四象 `peakFrame=4`；混合建议 `screen`。
- 命中特效建议逻辑显示约 `148×112px`，锚点约 `(0.5, 0.45)`；优先用 `image-set(... 1x, ...@2x 2x)`，不要把 @2x 当作双倍 CSS 尺寸。
- 每个 ring 是 `viewBox="0 0 512 512"` 的 `currentColor` SVG。iPad 建议约 `520×520px`，手机约 `330×330px`；128px 命中图禁止硬拉成全屏环。

### 2.2 相克命中路由（必须按事件语义）

唯一新增触发条件：

```js
e.t === 'dmg' && e.tag === '攻击' && e.eff > 1
```

接线要点：

1. `e.s` 是**战斗实例 uid**，不是角色 id，也不是元素键。请在 `runPlayback(A, B, ...)` 的闭包初始化阶段，根据 `[...A, ...B]` 建一次 `uid → fighter → element` 映射，元素继续复用现有 `unitElem(fighter.id)`／运行时事实源；不要从 `fac`、单位名字或 uid 猜元素。
2. `e.d` 同样是 uid，特效锚在现有受击者 DOM 节点上。攻击者 uid 无法反查出 `fire/water/wind/earth` 时，只跳过新增元素图，不阻断原回放。
3. **满盾仍播。** `e.eff>1` 已表达克制参与伤害计算；即使 `(e.hpDmg ?? 0) === 0`，也必须播放攻击者所属象的 hit。不要再用“血量实际下降”作为元素光门槛。
4. 护盾裂纹与元素光可同时出现：前者表达护盾吸收，后者表达元素克制，语义不同。
5. 保留现有斩击／箭迹／冲击环、青色“克”字、飘字、声音与物理弹退；本包只在其上增加元素身份，不替代伤害判定。
6. 沿用当前 VFX 并发与清场纪律（建议并发上限 10，开战前／跳过后清残留）。`PB.skip` 时不创建新节点。

### 2.3 四象升档成阵环（触发点不在战斗）

真实触发点在 `buyUnit()` 的购买后羁绊对比，不在 `applyEntry()`、`simulateBattle()` 或结算阶段：

- 只处理 `fire/water/wind/earth` 四个键；`pierce`、`vanguard` 升档不能误播四象环。
- 对单条象比较购买前后的 `bondTier`。`0 → 1` 为首档，播放一次同象 ring；`1 → 2` 为满档，也播放同一张 ring。
- 满档不另造资源，使用 `scale × 1.12`（可轻微加强亮度）；首档保持 `1.0`。
- “四象成环”是**某一象自身升档**，不要求火水风土同时激活。
- 如果同次购买还触发词缀揭晓，两个全屏演出必须进入表现队列错峰播放，不能相互压住。
- `prefers-reduced-motion: reduce` 下不旋转、不缩放：直接显示完整 ring 约 300ms 后淡出。

ring 若作为外部资源使用，优先走 CSS mask，并用 `background: ELEM_COLOR2[key]` 着色；需要内部描边动画时才安全内联。资源探针失败时不要显示一整块 `currentColor` 实心层。

## 3. 三星觉醒“星座绽放”

### 3.1 查表与触发

- 只在单位真正从二星升为三星的现有分支触发；不改合星条件、碎片、属性或存档。
- 角色本命星座以当前 `index.html::ZODIAC` 为运行时事实源；35 名单位已覆盖 12 星座。
- 先取星座中文名，再用 `assets/zodiac-20260716/manifest.json.zodiacByChinese` 反查文件与四象。不要自行猜拼音，尤其：`处女 → zodiac-chunv.svg`，`天秤 → zodiac-tiancheng.svg`。
- 容器颜色从 manifest 的 element 回到现有 `ELEM_COLOR2[element]`；不新建第二套色值。

### 3.2 SVG 内部动画限制

十二张 SVG 均为 `viewBox="0 0 120 120"`，并提供：

- `.zodiac-line`：可描边 `<path>`，带 `pathLength="100"` 与 `data-step`。
- `.zodiac-star`：可淡入 `<circle>`，带 `data-step`。
- 全部仅用 `currentColor`；无 text/font/image/href/filter/script/外链。

**不能直接用普通 `<img src="…svg">` 做逐笔动画。** 外部 `<img>` 是独立文档，不能可靠继承页面父节点的 `currentColor`，页面 CSS 也选不到内部 path/circle。要实现“连线依次画出＋星点依次点亮”，请只从本包白名单文件安全读取并内联 SVG，再按 `data-step` 排序驱动；不要把任意外部 SVG 字符串直接写入页面。

建议节奏：连线用 `stroke-dasharray:100`、`stroke-dashoffset:100→0`，星点随后由 `opacity:0→1`。iPad 显示宽度 `180–220px`，手机 `138–168px`。`prefers-reduced-motion: reduce` 下直接显示完整星图约 500ms 后淡出，不逐笔描线、不震动叠加。

若内联读取在离线／`file://` 环境失败，保持现有三星 `shake + toast + burst`，星座图静默缺席；绝不能阻断升星结果。

## 4. 影军“斩影溃散”

### 4.1 文件契约

- `ghost-shatter.webp`：`512×256`，4×2、8 帧、每格 128px。
- `ghost-shatter@2x.webp`：`1024×512`，4×2、8 帧、每格 256px。
- 20fps，`peakFrame=4`，建议逻辑显示约 `166×132px`，锚点约 `(0.5, 0.46)`，混合 `screen`。
- 紫色魂散，不是血肉／骨骼／碎尸。

### 4.2 判定与互斥

斩影必须同时满足：

1. 本场是**单人影军战**（建议在开战／创建回放时快照该上下文，不要等结算清空 `S.ghostFoe` 后再猜）；
2. 死亡目标属于敌方一侧（当前单人回放中的 `B`／`sideOf[e.d] === 'R'`）；
3. 当前事件为真实 `e.t === 'die'`。

命中以上条件时，`ghost-shatter` **替换**当前普通 `death` 图集，二者不得叠播。不能以 `fighter.fac === 'ghost'` 作为判定：普通幽灵制式、Boss 或其他上下文会造成误判。也不能绑到伤害事件里的 `e.kill`，因为复读复活与叶王蛇蜕也可能先出现 `kill:true`。

资源不存在、解码失败或上下文不完整时，回退到现有普通死亡碎散；死亡、复活、蛇蜕与结算事件本身一律不改。

## 5. 收尾斩定格光

### 5.1 文件与方向

- 横屏：`finisher-flash-landscape.webp`，`1600×900`。
- 竖屏：`finisher-flash-portrait.webp`，`900×1600`。
- 二者均为透明单帧叠层，建议 `screen`；峰值约 110ms、总时长约 360ms。

用方向媒体查询／`<picture>` 选择资源：iPad 横屏使用 landscape；iPad 竖屏与手机竖屏使用 portrait。按容器居中 cover，允许边缘自然裁切，但不能拉伸变形；设备旋转后应跟随切档。

### 5.2 接线边界

- 邻接现有 `runPlayback.step()` 中 `isFinal && !PB.skip` 分支，只给已有 final-blow 慢镜叠一层光；不要重新定义“最后一杀”，也不要写回 battle log。
- `PB.skip` 时完全不创建／不等待收尾斩节点，跳过仍须立即完成。
- `prefers-reduced-motion: reduce` 下只静态显示峰值约 110ms；不做缩放、位移、重复闪白或额外震屏。
- 资源失败时保留已有 final-blow 慢镜、局部微震与音效，不影响 `onEnd`。

## 6. 统一降级与代码红线

所有新增特效都必须“有图则用、缺图回退”，且加载失败不能延长或卡住回放：

| 新特效失败 | 必须保留的原表现 |
|---|---|
| 四象命中 | 伤害飘字、青色“克”字、现有 VFX 与 CSS 打击感 |
| 四象成阵环 | 原羁绊 toast／声音 |
| 星座绽放 | 原三星震屏、toast、burst 与升星结果 |
| 斩影溃散 | 普通 death 碎散 |
| 收尾斩定格光 | 原 final-blow 慢镜、微震与音效 |

本轮接线只能改表现层。禁止改动或重新解释：

- `simulateBattle`、伤害、相克、羁绊阈值、抽卡、升星、复活、蛇蜕、胜负与结算；
- 战斗事件结构或事件写回；
- 存档版本、`S`、`_meta`；
- `BONDS`／`ZODIAC` 正典数据；
- 现有 45 枚 `UI_ICON_PATHS`；
- 既有 20260715 资产或目录。

需要临时状态时放在视觉闭包／DOM／模块级瞬时容器，不能塞进 `S`。接线前拉取最新 main 并 rebase；提交只追加 `AI-COLLABORATION.md`，不覆盖 Codex／Claude 既有记录，不强推。

## 7. 验收基准

视觉设计基准不是桌面，而是下列三档高 DPR 设备；桌面只做兼容：

| 场景 | CSS 视口 | DPR | 物理像素验收画板 |
|---|---:|---:|---:|
| iPad 横屏（围桌） | 1194×834 | 2 | 2388×1668 |
| iPad 竖屏 | 834×1194 | 2 | 1668×2388 |
| 手机竖屏 | 430×932 | 3 | 1290×2796 |

接线后逐档核对：

- 1x／2x 命中图集自动选档，透明边缘无黑框，单帧不越格；
- ring 与星座保持矢量清晰，细线不糊、不被裁切；
- 横竖 finisher 方向选择正确，旋转设备后不沿用旧构图；
- 战斗快速播放、跳过、连续开战无残留节点；
- reduced-motion 下无反复闪烁、全屏缩放或强震；
- 断网与资源 404 时所有玩法、结算、升星、买入仍可完成，控制台不抛未捕获异常。

## 8. 验证命令与回执格式

资产验证器依赖 Node、Sharp 与 `xmllint`。若当前 Node 环境已可解析 `sharp`：

```bash
node tools/effects-20260716/validate-effects.mjs .
```

若 Sharp 位于独立依赖目录：

```bash
MYSK_NODE_MODULES=/absolute/path/to/node_modules \
  node tools/effects-20260716/validate-effects.mjs .
```

本次母版的预期结果：

```text
checks: 38
errors: []
warnings: []
totalRuntimeBytes: 2463897
```

Claude 完成接线后还应运行：

```bash
npm run selftest
```

基线为 `#selftest 264/264`；接线若新增守卫，总数可以增加，但必须保持全部通过。建议新增至少四类回归钉子：相克路由与满盾、四象升档键过滤、斩影只替换真实影军 die、PB.skip／reduced-motion 不阻断回放。

最终请在 `AI-COLLABORATION.md` 追加回执：Claude 的基线 SHA 与接线提交 SHA、修改文件、三套资产实际引用情况、`#selftest N/N`、iPad 横／竖与手机竖屏实测结果、断网／缺图降级结果，以及任何偏离本单的理由。
