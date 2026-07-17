# 第二批确定性 SVG 资产

本目录包含三枚流派纹章与三枚战斗视觉形状。全部为透明底、无文字、单色 `currentColor` SVG；名称、数值与说明继续由 DOM 渲染。

## 文件与视觉语义

| 文件 | 语义 | 静态识别点 |
| --- | --- | --- |
| `emblems/control.svg` | 制御 | 滴漏位于约束环内，四向刻度表达秩序与节拍 |
| `emblems/persist.svg` | 坚韧 | 盾形被闭合外环保护，内部连续结表达恢复与延续 |
| `emblems/edge.svg` | 锋锐 | 向右上突破的箭簇、双侧锋痕与四向星芒 |
| `vfx/slow-field.svg` | 凝滞 | 多层束缚场、低扁轨道与中央滴漏；不动画也能呈现峰值帧 |
| `vfx/meteor-strike.svg` | 星陨 | 斜向焰尾、陨核、落点爆芒与地面冲击弧 |
| `vfx/control-orrery.svg` | 制御开场 | 星象轨道被刻度环约束，中央滴漏锁定战场节拍 |

## 建议色值

| 流派 / 效果 | 主色 | 深色光晕 | chip 低透明底色 |
| --- | --- | --- | --- |
| 制御 / 凝滞 | `#6FD6FF` | `#2E8DA8` | `rgba(111, 214, 255, 0.14)` |
| 坚韧 | `#73D69B` | `#2B7A57` | `rgba(115, 214, 155, 0.14)` |
| 锋锐 / 星陨 | `#FF8A5B` | `#B7412F` | `rgba(255, 138, 91, 0.14)` |

黑金界面中可保留现有金色边框，只用上述颜色控制纹章、chip 内辉光和 VFX 主体。三色互不复用，便于课堂现场快速辨认。

## CSS mask 用法

外链 SVG 作为 `<img>` 时无法继承页面的 `color`，因此运行时优先使用 CSS mask；Safari 同时保留 `-webkit-mask`：

```css
.fac-emblem,
.battle-vfx::before {
  background: currentColor;
  -webkit-mask: var(--art-mask) center / contain no-repeat;
  mask: var(--art-mask) center / contain no-repeat;
}

.fac-emblem {
  display: inline-block;
  inline-size: 1em;
  block-size: 1em;
}

.battle-vfx::before {
  content: "";
  position: absolute;
  inset: 0;
}

.fac-chip[data-fac="control"] {
  color: #6fd6ff;
  background: rgba(111, 214, 255, 0.14);
}
.fac-chip[data-fac="control"] .fac-emblem {
  --art-mask: url("./emblems/control.svg");
}

.battle-vfx.is-slow {
  color: #6fd6ff;
  --art-mask: url("./vfx/slow-field.svg");
}
.battle-vfx.is-meteor {
  color: #ff8a5b;
  --art-mask: url("./vfx/meteor-strike.svg");
}
```

缺图时 `mask-image: none` 可能露出纯色矩形。沿用项目现有资源探针：图片成功解码后再添加启用类；失败时不创建伪元素，让原有文字、日志和战斗反馈继续工作。

## 动效与低动态合约

- SVG 自身不含动画。位移、缩放、透明度和时长全部由外层 CSS 控制。
- `slow-field.svg` 适合约 `420–620ms` 的轻微缩放与淡出；`meteor-strike.svg` 适合约 `360–520ms` 的短促落点闪现；`control-orrery.svg` 适合约 `520–760ms` 的一次性压制亮相。
- `prefers-reduced-motion: reduce` 下取消旋转、位移和连续循环，只显示一次静态峰值构图并淡出。

```css
@media (prefers-reduced-motion: reduce) {
  .battle-vfx,
  .battle-vfx::before {
    animation: none !important;
    transform: none !important;
  }
  .battle-vfx::before { opacity: 0.78; }
}
```

## 文件合约

- 纹章固定 `viewBox="0 0 24 24"`；VFX 固定 `viewBox="0 0 128 128"`。
- 所有可见路径只使用 `currentColor`，不写死运行颜色。
- 不含字体、`text`、脚本、样式表、位图、外链、`foreignObject` 或外部 `use`。
- 不承载数值、目标选择、战斗结算或事件分发；只能挂接已有视觉事件。
- 文件名与目录均为稳定英文 ID，可直接纳入新的版本化美术目录，不覆盖旧资源。
