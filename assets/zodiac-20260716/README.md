# 自鸣棋 · 十二星座觉醒星图 20260716a

本目录提供 12 张原创、无文字的 `currentColor` SVG 星图，供三星觉醒“星座绽放”使用。每张图都将星座连线与星点拆成独立节点，Claude Code 可在回放／升星视觉层中依次描线和点亮；本包不修改升星、星象四象、羁绊、数值或存档。

## 中文与文件名

| 中文 | 文件 | 四象 | 颜色来源 |
|---|---|---|---|
| 白羊 | `zodiac-baiyang.svg` | 火 `fire` | `#e08b7a` |
| 金牛 | `zodiac-jinniu.svg` | 土 `earth` | `#c9a64a` |
| 双子 | `zodiac-shuangzi.svg` | 风 `wind` | `#9cc0e8` |
| 巨蟹 | `zodiac-juxie.svg` | 水 `water` | `#7fc4d8` |
| 狮子 | `zodiac-shizi.svg` | 火 `fire` | `#e08b7a` |
| 处女 | `zodiac-chunv.svg` | 土 `earth` | `#c9a64a` |
| 天秤 | `zodiac-tiancheng.svg` | 风 `wind` | `#9cc0e8` |
| 天蝎 | `zodiac-tianxie.svg` | 水 `water` | `#7fc4d8` |
| 射手 | `zodiac-sheshou.svg` | 火 `fire` | `#e08b7a` |
| 摩羯 | `zodiac-mojie.svg` | 土 `earth` | `#c9a64a` |
| 水瓶 | `zodiac-shuiping.svg` | 风 `wind` | `#9cc0e8` |
| 双鱼 | `zodiac-shuangyu.svg` | 水 `water` | `#7fc4d8` |

文件名采用无声调 ASCII 拼音；`处女`中的 `ü` 采用常见输入法写法 `v`，所以是 `chunv`。`天秤`按“秤（chèng）”的规范读音命名为 `tiancheng`。接线应以 `manifest.json.zodiacByChinese` 为唯一反查表，不要在运行时自行猜拼音。

## 节点契约

- 画布统一为 `viewBox="0 0 120 120"`，可无损适配高 DPR iPad 和手机。
- `.zodiac-line` 是可描边的 `<path>`，均带 `pathLength="100"` 和 `data-step`。
- `.zodiac-star` 是可单独淡入的 `<circle>`，均带 `data-step`。
- 全部颜色只使用 `currentColor`；运行时继续从现有 `ELEM_COLOR2` 取四象色，不另建颜色事实源。
- SVG 自身为 `aria-hidden`。单位名、星座名与“三星觉醒”应继续使用可读 DOM 文本／播报。
- 无 `<text>`、字体、位图、`href`、filter、脚本或外链，适合 GitHub Pages、离线与 `file://`。

要动画 SVG 内部节点，需将 SVG 内容内联到觉醒视觉容器；若以普通 `<img>` 引用，外层 CSS 无法逐个控制内部 path/circle。加载失败时保留现有震屏和 toast，不能影响升星结果。

示意动画逻辑：

```js
const lines = node.querySelectorAll('.zodiac-line');
const stars = node.querySelectorAll('.zodiac-star');
lines.forEach((path, index) => {
  path.style.strokeDasharray = '100';
  path.style.strokeDashoffset = '100';
  path.animate(
    [{ strokeDashoffset: 100, opacity: 0 }, { strokeDashoffset: 0, opacity: 0.82 }],
    { duration: 360, delay: index * 130, fill: 'forwards', easing: 'cubic-bezier(.16,1,.3,1)' }
  );
});
stars.forEach((star, index) => {
  star.animate(
    [{ opacity: 0, transform: 'scale(.35)' }, { opacity: 1, transform: 'scale(1)' }],
    { duration: 240, delay: 180 + index * 55, fill: 'forwards', easing: 'cubic-bezier(.16,1,.3,1)' }
  );
});
```

建议觉醒舞台显示宽度：iPad `180–220px`，手机 `138–168px`；星图为矢量，不需要额外的 2x／3x 位图。`prefers-reduced-motion: reduce` 下直接显示完整星图约 500ms 后淡出即可。

## 正典边界

本目录只根据当前 `index.html::ZODIAC` 与委托单核对十二星座的四象归属，不改角色个人星座。当前 35 名单位已覆盖全部 12 星座；后续若角色正典调整，只应更新角色到星座的映射，星图文件的中文键和四象归类不应随意改变。
