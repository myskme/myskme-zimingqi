# MYSKME「自鸣棋」视觉全权第二批运行资产

- 版本：`visual-batch2-20260717`
- 页面目录：`assets/visual-batch2-20260717/`
- 内容：更漏人／燧石单位三轨资源，云梭／薪火陶罐遗物，云隙天光／挽歌余响事件图，制御／坚韧／锋锐纹章，凝滞／星陨／制御开场 VFX
- 运行文件：30 个 WebP + 6 个 SVG；WebP 均提供 1×／2×／3× 档
- 透明资产：征募卡、小头像和遗物均保留 alpha；场景立绘与事件牌面为 RGB WebP
- SVG 合约：纹章 `viewBox="0 0 24 24"`，VFX `viewBox="0 0 128 128"`，全部使用 `currentColor`，无字体、脚本、位图与外链
- 缺图策略：图片沿用 DOM 字形回退；VFX 经三文件完整探针后才启用
- 动效策略：只挂现有战斗回放事件，支持 `prefers-reduced-motion`，不修改数值、目标选择或结算

原始 Image2 PNG 与 chroma 中间件不进入 GitHub Pages，保存在长期资源包。逐文件尺寸、模式、字节数与 SHA-256 见 [manifest.json](manifest.json)。
