# 首页 banner 多图轮换 + 玻璃击碎特效

日期：2026-08-16
状态：方向已与用户确认（极致破碎消散效果 + 多图轮换池 + 8 秒/张）

## 现状问题

`main.js` 的 banner 轮换是临时实验（注释原文「临时预览」）：把浅色/深色两张**主题变体图**当轮换素材，每 2 秒方块飞散切换一次，且用内联 `display` 覆盖了 `dark:` 主题类，破坏暗色模式横幅适配。

## 设计

### 配置（`src/config.ts`）

- `home_banner.image.light` / `.dark` 支持 `string | string[]`（向后兼容单张）。
- 浅色池初值：`/images/wallpapers/` 5 张 + 现有 `wallhaven-wqery6-light.webp`；深色池初值：现有 `wallhaven-wqery6-dark.webp` 一张（用户后续自行添加，加图遵循 AGENTS.md 图片规范）。

### 组件（`src/components/HomeBanner.astro`）

- SSR 仍只渲染 light/dark 各第一张（首屏正确、暗色正确、无 JS 可用）。
- 两个图片池经 `<script type="application/json">` 数据标签注入容器（swup 安全）。
- 其余图片由 JS 在浏览器空闲时预加载。

### 特效（`public/scripts/main.js` 重写 banner swapper）

- 舞台：容器内两个绝对定位 img（当前/下一张），初始化后隐藏 SSR img；不再触碰 `dark:` 类。
- 每 8 秒轮换：先预载下一张，再触发碎裂——
  - 10×6 共 60 片，每片 `clip-path` 四角随机抖动成不规则多边形；
  - 随机撞击点，碎片按到撞击点距离波纹式延迟起爆；
  - 碎片动画：3D 翻滚（rotateX/Y/Z 随机）+ 向外抛散 + 重力下坠（ease-in 加速）+ 缩小 + 淡出，单片 600-900ms，全程约 1.2s；
  - 新图垫底，1.05→1 轻微落定缩放。
- 暗色切换：`MutationObserver` 盯 `<html>` class，换池不换位置（淡入淡出，不碎裂）；两池长度不同时按下标取模。
- 降级：`prefers-reduced-motion` → 纯淡入淡出；标签页隐藏时暂停计时；离开首页清定时器（沿用现有模式）。
- `[...page].astro` 的 blurred 变体共用同一逻辑（blur 在容器类上，无需特殊处理）。

## 实施记录（2026-08-16）

已实施完成，`check` 0 错误、`build` 通过。一处对 spec 的偏离：图片池没有走 `<script type="application/json">` 注入——`clientThemeConfig()` 本就把整个 `home_banner` 注入 `window.theme`，main.js 直接读 `theme.home_banner.image`，省去数据标签。碎片背景对齐用了 `object-fit:cover` 的实际显示矩形换算（旧实现 `background-size: w h` 会拉伸错位）。

2026-08-16 修复（用户目检发现）：碎裂起爆时必须立刻隐藏底层原图 `cur`（碎片层已完整复刻它），否则碎片飞走后露出的仍是旧图、清理时才瞬间跳新图；同时引入 `stage.currentSrc` 处理碎裂中途切换主题的竞态。碎片密度 10×6 → 14×9（126 片）。

2026-08-16 二次调整（用户要求）：密度再提 10 倍至 45×28（1260 片）；抛散模型从"撞击点径向爆炸"改为"随风飘散"——每次换图随机风向（左/右 ±20° 倾角），碎片按风向投影排序起爆（上风先走、斜向波浪扫屏），轨迹 = 风向漂移 400-900px + 横向飘摆 ±90px + 轻微下坠，rotateZ 大角度翻滚，时长 0.9-1.6s。

## 验证

- `npm run check`、`npm run build` 通过。
- dev 目检：首页每 8 秒玻璃击碎换图、无白屏；切暗色模式横幅正常；翻页页（/page/2/）模糊横幅同样轮换。
