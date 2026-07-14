# MYSKME 通用游戏图标系统 20260714b

本目录是自鸣棋上线用和跨项目复用的 43 枚完整部署副本：24px `currentColor` 原创 SVG、整套 sprite、manifest 与预览图。

本版在首批 37 枚基础上新增：

- `elem-wind / elem-fire / elem-earth / elem-water`
- `bounty-wolf-fang`
- `state-shadow-echo`

旧的 `assets/ui-icons-20260714/` 保留不动，本目录是独立版本，不会同名覆盖旧资产。游戏运行时继续使用 `index.html` 内联同源 SVG，确保课堂断网与 `file://` 打开不增加外部请求；这里的文件用于其他 MYSKME 游戏复用、设计检查与后续扩展。

Sprite 用法：

```html
<svg class="game-icon" aria-hidden="true">
  <use href="assets/ui-icons-20260714b/myskme-icons.svg#mysk-elem-wind"></use>
</svg>
```

图标默认继承 CSS `color`。纯图标按钮需在按钮本体提供完整 `aria-label`，触控热区建议不小于 40×40px。

完整长期资源包另含 Image2 母版、32／64px PNG、提示词、设计规范、构建脚本和 Obsidian 交付记录。
