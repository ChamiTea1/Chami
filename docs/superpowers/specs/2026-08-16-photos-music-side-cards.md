# 相册/音乐一级页右侧模块卡

日期：2026-08-16
状态：模块选型已与用户确认（各 3 个）

## 目标

在 `/photos/` 和 `/music/` 一级页右侧加侧栏（每页 3 个模块卡），复用首页侧栏（`HomeSidebar.astro`）的卡片样式与布局模式：`w-60`、`hidden md:block`、sticky、卡片统一为 `rounded-2xl border border-rd-gray-alpha-400 bg-rd-background-100 p-5 shadow-rd`。

## 共用部分

- 新增 `src/components/SideCard.astro`：卡片外壳（props：`icon`、`title`；slot 为内容），避免 6 次重复卡片外壳类名。
- 两个页面改为 flex 行布局：主内容 `flex-1 min-w-0`，右侧 `<aside>`（`hidden md:block w-60 shrink-0 sticky`），与首页侧栏断点行为一致（移动端隐藏，此前已有"移动端隐藏侧栏"的提交约定）。
- 需要客户端行为的数据一律用 `<script type="application/json">` 数据标签注入（swup 安全，不依赖脚本执行）；逻辑写进 `public/scripts/main.js` 的 `initPage` 流程，按元素存在性守卫、幂等。
- i18n：新增 key 在 `src/i18n.ts` en/zh 各加一份。

## 相册页 `/photos/`（`src/pages/photos.astro`）

1. **相册统计卡**（纯静态）：相册数、照片总数（构建时从 `masonry.json` 求和）。
2. **照片盲盒卡**：SSR 默认渲染第一张照片（无 JS 也有内容）；全部照片（image/title/相册名/slug，共 25 张、约 4KB）经 `<script type="application/json" id="photos-pool-data">` 注入；`main.js` 新增 `initPhotosHome()` 在每次 `page:view` 随机抽一张，更新缩略图/标题/链接（点击进对应子相册）。
3. **最近更新卡**（纯静态）：约定 `masonry.json` 数组最前为最新，取前 3 个相册做链接列表（AGENTS.md 补充该约定）。

## 音乐页 `/music/`（`src/pages/music.astro`）

1. **继续播放卡**：播放页 `bindMusicPlayer` 的 `loadeddata` 时把 `{song, artist, playlist, url: location.href}` 写入 `localStorage["music-last-played"]`；一级页 `initMusicHome()` 读取并填充（歌名 - 歌手、来源歌单、点击经 swup 跳回该 URL）；无记录时显示占位文案。
2. **随机歌单卡**：SSR 按钮默认指向第一个歌单（无 JS 可用）；歌单 URL 用 `src/utils/music.ts` 的 `musicPlayUrl()` 预计算后经 JSON 数据标签注入；`initMusicHome()` 绑点击 → 随机抽一条 → `swup.loadPage`（无 swup 则 `location.href`）。
3. **歌单统计卡**（纯静态）：歌单总数、按平台计数（`netease`→网易云音乐 / `tencent`→QQ音乐，en 为 NetEase / QQ Music）。

## 不动的部分

- 子相册页 `/photos/[album]/`、播放页 `/music/play/`、数据文件格式、首页侧栏。

## 验证

- `npm run check`、`npm run build` 通过。
- dev 目检：两页桌面右侧出现 3 卡、移动端隐藏；盲盒每次进入换图；音乐页听过歌后出现"继续播放"并可跳回；随机歌单按钮可跳。
