# MYSKME 自鸣棋 · 灵光牌面 20260717a

14 张无字 Image2 牌面与 3 枚 `currentColor` 珐琅框。所有玩法名称、效果、费用继续由 DOM 渲染，图片只承担氛围与视觉识别，因此可直接复用到别的网页游戏。

## 运行规格

- 比例：3:4。
- WebP：`384×512`、`768×1024`（`@2x`）、`1152×1536`（`@3x`）。
- 色彩：RGB、无透明通道、无烘焙文字。
- 框饰：`spell-frame-fine.svg`、`spell-frame-rare.svg`、`spell-frame-legendary.svg`，通过 CSS mask 与 `currentColor` 着色。
- 降级：牌面加载失败时保留暗色底板、语义图标、完整名称与玩法说明；框饰加载成功后才由 `body.spok` 启用。

## 逻辑 ID 映射

| 逻辑 ID | 文件主干 | 品质 |
| --- | --- | --- |
| `sp_atk` | `spell-starfire` | 秀 |
| `sp_hp` | `spell-stoneheart` | 秀 |
| `sp_spd` | `spell-windstep` | 秀 |
| `sp_crit` | `spell-starburst` | 珍 |
| `sp_rev` | `spell-return-lantern` | 珍 |
| `sp_pierce` | `spell-void-arrow` | 珍 |
| `sp_first` | `spell-dawnline` | 珍 |
| `sp_atk2` | `spell-twinblades` | 珍 |
| `sp_pcrit` | `spell-gate-arrow` | 珍 |
| `sp_unyield` | `spell-oath-crystal` | 传世 |
| `sp_double` | `spell-doubled-strike` | 传世 |
| `sp_all` | `spell-grand-orrery` | 传世 |
| `sp_slow` | `spell-stasis-ripple` | 珍 |
| `sp_meteor` | `spell-starfall` | 传世 |

浏览器运行时不读取 `manifest.json`；清单只用于资源复用、完整性校验和交接。
