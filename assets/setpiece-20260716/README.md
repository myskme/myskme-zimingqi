# 自鸣棋 · 戏眼过场 20260716a

一句话接线：影军敌方真实 `die` 时用 `ghost-shatter` **替换**普通死亡碎散；现有 `isFinal` 收尾斩慢镜邻接叠加横／竖屏 `finisher-flash`。

- `ghost-shatter.webp`／`ghost-shatter@2x.webp`：4×2、8 帧、20fps、128／256px cell，紫色魂散，无尸体／骨骼／血。
- `finisher-flash-landscape.webp`：1600×900，iPad 横屏。
- `finisher-flash-portrait.webp`：900×1600，iPad／手机竖屏。
- 斩影判定需结合当前影军上下文、敌方 side 与 `e.t==='die'`；不能只看 fighter.fac。
- finisher 不写入战斗 log，不改变结算，资源失败保留已有慢镜与微震。
