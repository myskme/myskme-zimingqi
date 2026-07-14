# 自鸣棋战斗 VFX 资产包 · 20260715

这一包只新增美术资产，不修改 `index.html`、战斗数值、事件流或存档。成品以 Image2 母版确定黑金珐琅语言，再拆成轻量静态 WebP sprite sheet；接线时应继续遵守“有图则用、缺图回退原 CSS”的原则。

## 文件清单

| 文件 | 图集 | 播放建议 | 语义 |
| --- | --- | --- | --- |
| `vfx-slash.webp` | 6×3，128px/格 | 每行 6 帧，24fps | 三种方向斩击；紫金 |
| `vfx-impact-ring.webp` | 6×1 | 6 帧，24fps | 命中冲击环；紫金 |
| `vfx-crit-gold.webp` | 4×2 | 8 帧，24fps | 暴击金爆 |
| `vfx-death-shatter.webp` | 4×2 | 8 帧，24fps | 无血、无骨的珐琅碎散 |
| `vfx-shield-crack.webp` | 6×1 | 6 帧，20fps | 护盾受击/裂痕；青色 |
| `vfx-pierce-trail.webp` | 6×1 | 6 帧，24fps，飞行约 260ms | 穿透箭迹；金色 |
| `vfx-heal-light.webp` | 4×2 | 8 帧，24fps | 治疗光阵；绿色 |
| `vfx-shed-mist.webp` | 6×2 | 12 帧，15fps | 蛇蜕紫雾、旧鳞与弧线，不出现第二个完整蛇头 |
| `arena-dais-1600.webp` | 1600×420 | iPad 横屏高清主图 | 演武台面 |
| `arena-dais-800.webp` | 800×210 | 小屏或低带宽 | 演武台面半尺寸 |
| `preview.webp` | 1600×1840 | 仅供验收，不接入运行时 | 全包预览 |
| `vfx-manifest.json` | — | 接线权威清单 | 帧率、锚点、混合模式、路由、哈希 |

所有图集均为行优先（row-major）：从左向右播放完一行，再进入下一行；每格固定 `128×128`，四边至少保留 4px 安全区。

## 事件接线路由

建议只在 `runPlayback().applyEntry()` 的表现层接入，勿改 `simulateBattle()`、`dealDmg()`、数值、日志结构或 `_meta`。

1. `e.t === 'dmg' && e.tag === '攻击'`
   - 由 `e.s` 反查出手 fighter。
   - 普通单位：方向斩击 + 目标冲击环。
   - `fighter.tg === 'pierce'`：穿透箭迹从源单位飞向目标 + 目标冲击环，不叠斩击。
   - **注意：`e.eff` 是四象相克倍率，不是穿透标记。**
2. `e.t === 'dmg' && e.tag !== '攻击'`
   - 技能伤害只播冲击环，避免把“噪音、风暴、反震、残片”等误画成挥砍。
3. `e.t === 'dmg' && e.crit === true`
   - 在本次基础命中特效之上追加暴击金爆。
4. `e.t === 'die'`
   - 播放死亡碎散。
   - **绝不能绑定 `e.kill`。** `dmg.kill === true` 后，角色仍可能进入 `revive` 或 `shed`；只有随后的 `die` 才是真正阵亡。
5. `e.t === 'shieldHit'`
   - 播放护盾裂痕。
   - 此事件只有本次吸收量，没有“剩余护盾”字段，所以文案与美术语义应是“护盾受击/裂”，不能直接宣称“破盾”。
6. `e.t === 'heal'`
   - 播放治疗光阵。
7. `e.t === 'shed'`
   - 先移除可能由跳过播放残留的 `.dead`，再播放紫雾；不要加死亡碎散。

## 最小播放约定

- 特效节点应放在独立的 VFX 层，设置 `pointer-events:none` 与 `aria-hidden="true"`，不得挡住棋子点击。
- `slash / impact / crit / shield / pierce / heal` 建议 `mix-blend-mode:screen`；`death / shed` 建议普通混合，避免暗色碎片被冲掉。
- 每场同时活动节点建议不超过 10 个；播放结束立即移除节点。
- `prefers-reduced-motion: reduce` 时只显示 manifest 中 `peakFrame` 约 120ms，不做位移与连续闪烁。
- 图片解码或加载失败时保留当前 `.hit`、飘字、`.dead` 等 CSS 表现，不应阻断战斗回放。
- 图集背景定位：`background-size = 列数×100% 列方向 / 行数×100% 行方向`，或直接用 128px 固定格配合 `steps()`；细节以 `vfx-manifest.json` 为准。

## 地台接线

将演武台放在 `#arena` 内容层之下、页面背景层之上；`object-fit:contain`、水平居中、`pointer-events:none`、`aria-hidden="true"`。iPad 横屏优先使用 1600 版；iPad 竖屏与手机可通过 `srcset` 或媒体查询选 800 版。所有场景都要整体等比 contain，不要裁成满屏背景，否则会丢失左右端的珐琅角饰。

## 构建与复验

可复现构建脚本位于 iCloud 长期资源包：`scripts/build-vfx.mjs`。GitHub 运行时交付不附 Image2 母版和构建脚本，以免增加 Pages 体积。

```sh
NODE_PATH=/Users/wangzhongcheng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
  node scripts/build-vfx.mjs
```

脚本只重建本目录的派生 WebP、预览和 manifest，不写游戏逻辑。交付前请核对：尺寸、alpha、文件名、manifest 中 SHA-256、运行时包体积，以及 `die ≠ kill` / `shieldHit ≠ 确认破盾` 两条语义守卫。
