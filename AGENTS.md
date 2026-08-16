## 项目概况

Astro 7 + Tailwind CSS v4 的个人博客，移植自 [hexo-theme-redefine](https://github.com/EvanNotFound/hexo-theme-redefine)，站点语言为中文。

- Node 版本要求 `>=22.12.0`（见 `package.json` engines 和 `.nvmrc`）。
- 常用命令：
  - `npm run dev` — 开发服务器（见下文"开发"节）
  - `npm run build` — 构建到 `dist/`
  - `npm run check` — astro check 类型检查，**改动代码后应跑一遍**
  - `npm run preview` — 预览构建产物
  - `npm run compress-images` — 压缩图片

## 架构要点

- **`src/config.ts` 是全站唯一配置中心**（对应原 hexo 主题的 `_config.yml`）。功能开关、导航、插件配置都改这里；CSS 主题变量由 `themeVars()` 运行时注入，不要在 CSS 里硬编码颜色值。
- **`src/plugins/` 是自定义 remark/rehype 插件**（代码块容器、外链图标、图片懒加载/图注/宽高、hexo 标签插件、mermaid 等）。关键陷阱：`{% folding %}`/`{% grid %}`/`{% tabs %}` 等标签的正文走的是 `markdown-render.ts` 的 **mini 渲染管线**，现已与主管线功能对齐（图注、图片宽高、mermaid、Shiki 代码高亮、代码容器均有）——改插件时记得两条管线同步维护。
- **`public/scripts/main.js` 是手工维护的客户端脚本**（不经过打包），交互逻辑（导航栏、TOC、搜索、懒加载、图片查看器等）都在这里，改前端行为找它。
- 内容集合定义在 `src/content.config.ts`，文章在 `src/content/blog/`；`src/data/*.json`（essays/friends/bookmarks/masonry）是数据驱动页面。
- i18n 文案在 `src/i18n.ts`（仅 en/zh），组件里用 `__()` 取值，新增 key 需两种语言都加（TS 会强制对齐）。

## swup 单页模式注意事项

`single_page: true`（当前配置）时，SwupScriptsPlugin 为 `optin: true` 模式：页面 slot 里通过 `<script src="...">` 引入的第三方脚本**必须加 `data-swup-reload-script` 属性**，否则前端路由切换进该页面时脚本不执行（参考 `src/components/Comments.astro` 的写法）。

另外 BaseLayout 里内置了一个精简版 head 合并插件（`SwupHeadStyles`，挂 `content:replace`）：导航时把新页面的按页样式（`/_astro/` 链接、Astro/Vite 内联样式）补进 head 并等其加载，否则相册扇形、音乐沉浸页等按页 CSS 在 SPA 进入时丢失。它的删除逻辑**只清理这些受管样式**，绝不能扩大到运行时注入的 `<style>`（SwupSlideTheme/ProgressPlugin/Typed/mermaid/waline 都靠它们工作）。

## 内容写作约定

- 文章放 `src/content/blog/`，`pubDate` 用 ISO 格式带时区（如 `2026-08-13T17:30:00+08:00`），不要用空格分隔的非标准格式。
- 支持的 hexo 风格标签插件：`{% note %}`、`{% folding %}`、`{% grid %}`、`{% tabs %}`、`{% btn %}`、`{% audio %}`、`{% bilibili %}` 等（实现见 `src/plugins/remark-tags.ts`）。
  - 行内标签（btn/audio/bilibili）可与同段落的粗体、行内代码、链接共存（2026-08-15 已修复 GFM 自动链接拆散标签参数导致的格式丢失）。

## 音乐页歌单维护

- 歌单数据统一在 `src/data/music.json`（无前端添加入口；播放页 `/music/play/` 通过 URL 参数 `server/type/id/name/cover` 获取信息，样式参考 LuviciiBlog 的沉浸式音乐界面）。
  - 字段：`name`（歌单名）、`server`（`netease` 网易云 / `tencent` QQ音乐）、`type`（`playlist` 歌单，或 `song` 单曲、`id` 可逗号分隔多首）、`id`、`cover`（可选封面 URL）。
  - 取歌单 ID：网易云 `https://music.163.com/#/playlist?id=2426530028` → `2426530028`；QQ音乐 `https://y.qq.com/n/ryqq/playlist/12345` → `12345`。
  - 查歌单名称与封面：`curl "https://music.163.com/api/v6/playlist/detail?id=<ID>"`（取 `playlist.name` 与 `playlist.coverImgUrl`）；封面也可按图片规范放 `public/images/` 或图床。
- 修改 `music.json` 后重新构建部署即可生效；播放页播放器由 `public/scripts/main.js` 的 `initMusicPlay`/`initMusicTools` 动态创建（切换/随机/刷新按钮、随歌曲切换的模糊背景、键盘控制、加载失败错误层）。
  - 播放页 URL（`server/type/id/name/cover` 参数）生成逻辑统一在 `src/utils/music.ts` 的 `musicPlayUrl()`，`music.astro` 和 `music/play.astro` 共用，不要再手写副本。
  - 歌单数据经 play.astro 内 `<script type="application/json" id="music-playlists-data">` 注入（swup 替换 #swup 后仍可读）；若改用内联可执行脚本必须加 `data-swup-reload-script`，否则 SPA 进入时不执行。
  - 模糊背景靠 MutationObserver 盯 `.aplayer-pic` 的 style 变化更新；离开播放页/重建播放器时必须 `destroy()` 实例并断开 observer（`destroyMusicPlayer`）。
  - 移动端（≤768px）歌单是底部抽屉：自有 class `music-list-open` 控制滑出（不要用 APlayer 原生的 `aplayer-list-hide`，bundled aplayer.css 里它是 `display:none !important`）。

## 开发

启动开发服务器时，请使用后台模式：

```
astro dev --background
```

使用 `astro dev stop`、`astro dev status` 和 `astro dev logs` 管理后台服务器。

## 文档

完整文档：https://docs.astro.build

在处理相关任务前，请查阅以下指南：

- [添加页面、动态路由或中间件](https://docs.astro.build/en/guides/routing/)
- [使用 Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [使用 React、Vue、Svelte 或其他框架组件](https://docs.astro.build/en/guides/framework-components/)
- [添加或管理内容](https://docs.astro.build/en/guides/content-collections/)
- [添加样式或使用 Tailwind](https://docs.astro.build/en/guides/styling/)
- [支持多语言](https://docs.astro.build/en/guides/internationalization/)

## 图片规范

- 文章配图：放工程内 `public/images/<主题>/`（例如 `public/images/hakimi/`），单个图片文件超过 4MB 时压缩后再放（可用 `npm run compress-images` 自动处理）。
- 相册（`src/data/masonry.json`）：单个相册 ≤ 20 张照片放工程 `public/images/`；超过 20 张放图床（ChamiTea1 图床仓库），数据文件里填图床 URL。
- 站点固定资源（头像、logo、banner、favicon）：放工程内。
- 图片命名使用小写连字符风格（如 `hakimi-01.jpg`），不要用时间戳等无意义文件名。
- 正文（markdown）图片必须使用 `/images/...` 绝对路径，相对路径不会被打包。
- 图床链接优先使用 jsDelivr 加速：`https://cdn.jsdelivr.net/gh/ChamiTea1/img-bed@main/xxx.jpg`。
- 文章封面建议横版 16:9、宽度 ≥ 1200px（卡片缩略图和文章头图均为横向裁切）。
- 封面设置（frontmatter）：
  - `cover: '/images/<主题>/xxx.jpg'`——本地工程图或图床 URL 均可；
  - `coverPosition: 'top' | 'left' | 'right'`——首页卡片封面位置，默认 `top`（封面在上、文字在下）；
  - 左右排布时封面绝对定位铺满卡片高度并裁切，卡片高度由文字决定（如 welcome 文章，封面用作者头像、`coverPosition: 'right'`）；
  - 不写 `cover` 或 `coverPosition` 即无封面/默认上下排布。
- 所有图片必须写 alt 文本（影响可访问性与 SEO，开启 `image_caption` 后自动显示为图注）。
- 相册照片注意 EXIF 隐私：公开前剥离 GPS 定位信息；如需在图片查看器中展示拍摄参数，保留相机/光圈/快门等字段但删除 GPS。
- 部署目标是 Cloudflare Pages：注意单部署 20000 文件、单文件 ≤ 25 MiB 的限制。

## 部署前检查清单

- `src/config.ts` 的 `url` 已设为 `https://chami.asia`（2026-08-15）；若换域名改这里并重新构建。
- `src/data/` 的 essays/friends/bookmarks 目前是中文示例数据，上线前替换为真实内容。
- 确认 favicon 指向（当前配置指向外部图床头像，`public/favicon.ico`/`favicon.svg` 未被引用）。
