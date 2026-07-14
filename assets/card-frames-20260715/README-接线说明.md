# 自鸣棋征募卡框系统 · 20260715

这一包将现有征募三选一从“文字表格 + 小徽章”升级为可复用的完整抽卡框架。Image2 母版只用于确定黑金珐琅材质与五档稀有度的视觉层级；正式资产全部按 `768×1024` 原生 3:4 比例重新构造，没有把母版中的偏窄卡框横向拉伸。

本包只提供美术模板和接线规范，不修改单位数据、抽取权重、征募逻辑、存档或 `_meta`。

## 固定画井

所有卡框共用同一角色画井：

```text
x = 64
y = 60
width = 640
height = 900
```

角色图、卡面图和所有后续裁切都应以这组坐标为唯一依据。五档卡框的透明窗口完全对齐，因此切换稀有度时角色不会跳动、缩放或偏位。

## 文件清单

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `recruit-backplate.webp` | 768×1024 | 共用黑蓝星图底板，完全不透明 |
| `recruit-frame-n.webp` | 768×1024 | N：旧铁单轨、磨损切角 |
| `recruit-frame-r.webp` | 768×1024 | R：蓝钢双轨、四角铆钉 |
| `recruit-frame-sr.webp` | 768×1024 | SR：紫银双框、晶面与中轴菱晶 |
| `recruit-frame-ssr.webp` | 768×1024 | SSR：鎏金三轨、四枚锁扣、上下星钻 |
| `recruit-frame-ur.webp` | 768×1024 | UR：象牙圣金、日轮、羽饰与外扩星芒 |
| `rarity-corner-n.svg` | 160×56 | N 稀有度角标结构 |
| `rarity-corner-r.svg` | 160×56 | R 稀有度角标结构 |
| `rarity-corner-sr.svg` | 160×56 | SR 稀有度角标结构 |
| `rarity-corner-ssr.svg` | 160×56 | SSR 稀有度角标结构 |
| `rarity-corner-ur.svg` | 160×56 | UR 稀有度角标结构 |
| `affix-quality-common.svg` | 96×24 | 星辉词缀“凡”品质框 |
| `affix-quality-fine.svg` | 96×24 | 星辉词缀“秀”品质框 |
| `affix-quality-rare.svg` | 96×24 | 星辉词缀“珍”品质框 |
| `affix-quality-legendary.svg` | 96×24 | 星辉词缀“传世”品质框 |
| `manifest.json` | — | 尺寸、层级、画井、颜色、字节数与 SHA-256 |
| `preview.webp` | 1600×930 | 仅供交付验收，不进入运行时 |

五枚角标与四枚词缀品质框 SVG 均只使用 `currentColor`，没有文字、字体、外链、图片或 SVG filter。稀有度与词缀名称继续使用真实 HTML 文本叠加，方便中文/英文切换、读屏和高分屏渲染。

## 星辉词缀品质框

这四枚 SVG 是对 Claude `47b25d1` 中词缀品质临时 `.af-dot` 的正式结构替代：

- `common / 凡` 使用 `#9a9686`；`fine / 秀` 使用 `#7fc4d8`；`rare / 珍` 使用 `#c77dff`；`legendary / 传世` 使用 `#ffb13c`。
- 颜色只是语义辅助，四档同时使用不同轮廓，灰度与色觉缺陷场景下仍能辨识。
- **征募候选卡不显示词缀品质**；购买后才在已拥有单位详情或名册中显示，避免提前泄露购买时随机结果。
- SVG 不自带文字；“凡／秀／珍／传世”由 DOM 输出，并保留现有词缀机制与无障碍语义。

## 推荐叠层顺序

从下到上：

1. `recruit-backplate.webp`
2. `cardURL(id)` 对应的角色卡面
3. `recruit-frame-{rarity}.webp`
4. 阵营/四象等语义图标
5. `rarity-corner-{rarity}.svg` 与真实稀有度文本

卡框与底板始终保持 3:4；禁止分别设置不一致的宽高，也不要对 Image2 母版进行非等比拉伸。

## 两类现有卡面的适配

- 透明角色立绘：放入画井后使用 `object-fit: contain; object-position: center bottom`，让脚部或衣摆靠近底部。
- 已经带背景的 512×768 卡面：放入画井后使用 `object-fit: cover; object-position: center top`。如某个角色头饰较高，只为该角色单独调整 `object-position`，不要改变全局画井。
- 卡面加载失败：保留当前徽章、名称、费用、属性与选择按钮，不能让征募流程失效。

## 响应式与性能

- 大图只需加载一张共用底板和当前可见的三张稀有度框；不要预加载全部角色卡面。
- 三选一关闭后释放不再需要的临时图片引用；下一轮再按实际候选加载。
- iPad 横／竖屏与手机竖屏都应保证按钮可点、稀有度可读；空间不足时整体等比缩小或改单列，不能单独压扁宽度。
- 框和角标属于装饰层，应设置 `pointer-events:none` 与 `aria-hidden="true"`。
- `preview.webp` 是验收图，不接入正式页面。

## 构建

可复现构建脚本位于 iCloud 长期资源包：`scripts/build-card-frames.mjs`。GitHub 运行时交付不附 Image2 母版和构建脚本。

```sh
NODE_PATH=/Users/wangzhongcheng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
  node scripts/build-card-frames.mjs
```
脚本只重建本目录的派生资产、预览与 manifest，不写游戏代码。接线前以 `manifest.json` 中的文件名、画井和哈希为准。
