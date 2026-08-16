# 音乐播放界面对齐 LuviciiBlog 重写 + bug 修复

日期：2026-08-16
状态：已与用户确认方案 A（对齐重写）

## 背景与问题

`/music/play/` 播放页（`src/pages/music/play.astro` + `public/scripts/main.js` 的 `initMusicPlay`/`initMusicTools`）是从 LuviciiBlog（Hexo 主题，`themes/luvicii/source/css/_page/music.styl` + `utils.js`）移植的，但移植不完整且存在真 bug：

1. **切换歌单按钮 SPA 进入时静默失效**：`play.astro` 用内联 `<script set:html>` 注入 `window.music_playlists`，但该脚本在 `#swup` 容器内且无 `data-swup-reload-script`，swup innerHTML 替换后不执行 → `window.music_playlists` 为 undefined。
2. **模糊背景不跟随歌曲封面**：`updateMusicBg` 只在 `loadeddata` 时抄一次 `.aplayer-pic` 的 backgroundImage，换歌/时序问题导致不更新。
3. **加载失败无反馈**：Meting 轮询 6 秒超时后静默放弃，页面空白无提示。
4. **布局错乱/体验缺失**：歌词区、控制条、移动端布局与 LuviciiBlog 差距大；无底部抽屉歌单、无键盘控制。
5. **资源泄漏**：重建/离开页面时 APlayer 实例无 `destroy()`。
6. URL 生成逻辑在 `music.astro` 和 `main.js` 各有一份手写副本。

## 设计

### CSS（重写 `play.astro` 的 `<style is:global>`）

以 LuviciiBlog `music.styl` 为基准移植，变量适配本项目（`--primary-color`、`--current-navbar-height`、导航/页脚选择器）：

- 保留现有 `html[data-type='music']` 整页换肤（深色底、透明导航、隐藏页脚/侧工具）。
- 桌面：`.aplayer` flex `row-reverse` —— 左 40% `.aplayer-body`（封面 180px 圆角 12px、白色 2rem/700 歌名歌手、滚动歌词区），右 60% `.aplayer-list`（当前行半透明白高亮、加大 padding）；高度 `calc(100vh - var(--current-navbar-height))`。
- 歌词：`.aplayer-lrc` 白色，`mask-image` 底部渐隐，当前行高亮用 `var(--primary-color)`。
- 控制条：`.aplayer-controller` `position: fixed; bottom: 50px; max-width: 1500px`；进度条 6px 圆角白条 + 20px 白色圆形 thumb；back/play/forward 绝对定位居左，音量/循环/时间居右。
- 悬浮按钮（switch/random/refresh，沿用现有 DOM）：50px 圆形、`backdrop-filter: saturate(180%) blur(20px)`；桌面 `right: 7vw/11vw/15vw; bottom: 100px`，≤1400px 改右侧纵排（bottom 100/160/220px）。
- ≤768px：`.aplayer-body` 固定顶部全宽；歌单变底部抽屉（`.aplayer-list` `position: fixed; bottom: -88%; border-radius: 15px 15px 0 0`，加展开 class 滑出 + `#menu-mask` 遮罩点击关闭）；控制键重排为居中三段式（back/大 play/forward）。

### JS（`main.js`）

- **数据注入**：`play.astro` 改放 `<script type="application/json" id="music-playlists-data">`，内容为预计算好播放 URL 的歌单数组（frontmatter 里用与 `music.astro` 同一逻辑生成，URL 生成只保留 astro 端一份）；`initMusicTools` 的切换按钮 `JSON.parse(textContent)` 取下一条 URL 跳转。删除 `main.js` 的 `musicPlayUrl`。
- **背景跟随**：MutationObserver 盯 `.aplayer-pic` 的 `style` 属性（`attributeFilter: ['style']`），变化即 `updateMusicBg()`；`loadeddata` 监听保留作兜底。observer 在重建/离开时 `disconnect()`。
- **错误反馈**：`bindMusicPlayer` 轮询超时（6s）或 `aplayer.on('error')` → 在 `#music-player` 内渲染错误层（提示文案 + 「重试」按钮，点击走现有刷新重建逻辑）；重建前清空错误层。
- **资源清理**：模块级 `currentMusicPlayer` 持有 APlayer 实例；`initMusicPlay` 重建前 destroy 旧实例；`page:view` 时若新路径不是 `/music/play` 且实例存在 → destroy + observer disconnect + 解绑键盘。
- **键盘控制**：仅在播放页绑定 keydown——空格 toggle、←/→ 上下曲、↑/↓ 音量 ±0.1（`preventDefault` 防滚动）；随 destroy 解绑。
- **标题**：切歌（`loadeddata`）时 `document.title = '歌名 - 歌手 · 音乐'`；离开页面由 swup 恢复正常标题。

### 不动的部分

- `/music/` 列表页、`src/data/music.json` 数据格式、`{% audio %}` 标签与 `.aplayer-inline` 卡片样式、全局 mini 播放器（`plugins.aplayer.enable: false` 保持）。

## 实施记录（2026-08-16）

已实施完成，`check`/`build` 通过。两处对 spec 的有意偏离：

1. 移动端抽屉不用 `aplayer-list-hide`（本项目 bundled `aplayer.css` 对该 class 是 `display:none !important`，与 LuviciiBlog 实现不同），改用自有 class `music-list-open`，并在 handler 里撤掉 APlayer 原生加的 `aplayer-list-hide`。
2. 播放页还抵消了两处样式冲突：`#music-player .aplayer:hover { transform: none }`（抵消 `.aplayer-inline` 卡片的 hover 上浮）和 `.aplayer-info { height: auto }`（抵消 `aplayer-withlrc` 的 90px 固定高），未改 `global.css`，`{% audio %}` 卡片不受影响。

## 验证

- `npm run check`、`npm run build` 通过。
- dev 服务器目检 `/music/play/`：桌面分栏+歌词+底部控制条正常；缩小到 ≤768px 歌单为底部抽屉可滑出关闭；hover/点击 switch/random/refresh 均生效（含从 `/music/` SPA 进入的场景）；切歌时模糊背景跟随封面；断网/无效 id 时出现错误层且重试可用；键盘控制生效。
