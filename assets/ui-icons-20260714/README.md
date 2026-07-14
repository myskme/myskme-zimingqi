# MYSKME 通用游戏图标系统 20260714a

本目录是自鸣棋上线用和跨项目复用的部署副本：37 枚原创 24px SVG、整套 sprite、manifest 与预览图。运行时路径版本化，不覆盖旧资产。

游戏本体为保证课堂断网和 file:// 打开稳定，将同源路径内联在 index.html；本目录供其他 MYSKME 游戏复用。

~~~html
<svg class="game-icon" aria-hidden="true">
  <use href="assets/ui-icons-20260714/myskme-icons.svg#mysk-stat-attack"></use>
</svg>
~~~

图标使用 currentColor。纯图标按钮必须提供 aria-label，iPad 点击区域建议至少 40×40px。

完整设计规范、Image2 母版、32/64px PNG 和生成脚本保存在独立资源包 MYSKME-通用游戏图标系统-20260714。
