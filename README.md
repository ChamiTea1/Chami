# AstroChamiBlog

基于 [hexo-theme-redefine](https://github.com/EvanNotFound/hexo-theme-redefine)（作者 EvanNotFound）的 Astro 移植版博客主题。

## 功能特性

- **Redefine 设计体系**：渐变导航栏、卡片式文章、Geist/Chillax 字体、Font Awesome 图标
- **全屏首页 Banner**：固定背景图、打字机副标题（Typed.js + 一言 API）、社交链接与二维码
- **首页侧边栏**（头像、作者 Lv、站点统计、公告、友链）+ 文章卡片（封面/摘要/标签）
- **文章页**：模糊标题封面、作者与 Lv 标识、元信息行（日期、分类、标签、字数、阅读时间）、带滚动监听的固定目录（TOC）、版权声明、上一篇/下一篇导航、文章推荐（TF-IDF）
- **明暗模式切换**（持久化保存，遵循 `prefers-color-scheme`）、导航栏收缩 + 移动端抽屉菜单
- **侧边工具**：主题切换、滚动进度百分比/进度条、回到顶部/底部、RSS
- **swup 单页切换**（SPA 过渡动画 + 预加载 + 进度条 + 滑动动画）
- **站内搜索**（构建时生成索引、Redefine 风格对话框、关键词高亮）
- **图片查看器**（点击放大、拖拽、滚轮缩放、上一张/下一张、EXIF 信息面板）
- **评论系统**（waline / giscus / gitalk / twikoo / utterances / artalk，配置驱动）
- **Hexo 标签插件**：`{% button %}` `{% callout %}` `{% note %}` `{% folding %}` `{% grid %}` `{% tabs %}`
- **Mermaid** 图表（```` ```mermaid ```` 代码块）、**APlayer** 音乐播放器、**Preloader** 加载动画、**Pangu** 中英文排版优化
- **Shiki 代码高亮**（明暗主题、mac 风格容器、复制/折叠按钮）、懒加载、del 删除线遮罩、外链图标、表格横向滚动
- **页面**：首页（分页）、文章页、`/archives` 归档、`/tags` 标签、`/tags/<tag>/`、`/categories` 分类（嵌套）、`/categories/<cat>/`、`/friends` 友链、`/bookmarks` 书签、`/essays` 随笔、`/photos` 照片墙（瀑布流）、`/about` 关于、404
- **页脚**：版权、运行时长统计、站点统计、Vercount 浏览量、ICP 备案、注入代码
- **其他**：Google Analytics、自定义字体 URL、head/footer 注入、RSS + sitemap

## 项目结构

```text
├── public/
│   ├── fonts/            # Geist、Geist Mono、Chillax 字体
│   ├── fontawesome/      # Font Awesome CSS + webfonts
│   ├── images/           # favicon、头像、logo、横幅图片
│   └── scripts/          # main.js + Typed.min.js
├── src/
│   ├── config.ts         # 主题配置（由 _config.yml 移植而来）
│   ├── i18n.ts           # 多语言翻译（en / zh-CN）
│   ├── components/       # 导航栏、页脚、文章卡片、目录等组件
│   ├── layouts/BaseLayout.astro
│   ├── pages/            # index、blog/[...slug]、tags、categories、archives 等页面
│   ├── styles/global.css # Tailwind v4 + 主题 CSS 入口
│   ├── plugins/          # rehype 插件（代码容器等）
│   └── content/blog/     # 博客文章（Markdown & MDX）
├── astro.config.mjs
└── package.json
```

## 配置说明

所有主题选项都位于 **`src/config.ts`**（对应 Redefine 的 `_config.yml`）：

- `siteConfig` — 站点标题、副标题、作者、URL、语言（`en` / `zh-CN`）
- `themeConfig.colors` — 主题色、默认模式
- `themeConfig.home_banner` — 横幅图片、标题、打字机副标题、社交链接、二维码
- `themeConfig.navbar` — 导航链接（支持子菜单）、渐变色、宽度、**站内搜索**（启用/预加载/top_n_per_article）
- `themeConfig.home` — 侧边栏、文章卡片选项
- `themeConfig.articles` — 代码块样式/主题、目录（TOC）、版权许可、**相关推荐**（启用/标题/数量）
- `themeConfig.comment` — 评论系统（`waline`/`giscus`/`gitalk`/`twikoo`/`utterances`/`artalk`）+ 系统配置
- `themeConfig.plugins` — APlayer 音频、Mermaid 主题/版本
- `themeConfig.footer` — 运行时长、统计、ICP、自定义内容
- `themeConfig.global` — 单页模式（swup）、Preloader、网站计数器（Vercount）、Google Analytics、注入（head/footer HTML）、自定义字体
- `themeConfig.page_templates` — 标签页样式、友链列数、瀑布流分批数量

数据驱动页面读取 `src/data/` 下的文件：

- `friends.json` — `[{ links_category, has_thumbnail, list: [{ name, link, description, avatar, thumbnail }] }]`
- `bookmarks.json` — `[{ category, icon, items: [{ name, link, description, image }] }]`
- `essays.json` — `[{ date: 'YYYY-MM-DD HH:mm:ss', content: 'markdown' }]`
- `masonry.json` — `[{ image, title, description, width, height, exif }]`

## 文章 Frontmatter

```yaml
---
title: '文章标题'
description: '文章摘要'
pubDate: '2024-06-19'
updatedDate: '2024-07-01'
cover: './cover.jpg'       # cover | banner | thumbnail（thumbnail: false 可关闭）
tags: ['Astro', 'Blog']
categories: ['指南']       # 嵌套分类：['父分类', '子分类']
sticky: true                # 置顶
license: 'cc_by_nc_sa'      # 覆盖默认版权许可
toc: false                  # 关闭本文章的目录
comment: false
expires: '2025-01-01'       # 该日期后显示"文章已过期"提示
og_image: './og.jpg'
---
```

## Hexo 标签插件

```markdown
{% button 按钮文字, https://example.com %}
{% button url="https://example.com" text="带名称的按钮" icon="fa-brands fa-github" align="center" %}
{% callout info %}提示内容{% endcallout %}
{% callout warning :: 带标题的提示 %}内容{% endcallout %}
{% note info %}兼容旧语法{% endnote %}
{% folding 折叠标题 %}折叠内容{% endfolding %}
{% folding title="默认展开" open=true %}内容{% endfolding %}
{% grid 2 %}...{% endgrid %}
{% tabs 标签组 %}
<!-- tab 第一个 -->
内容一
<!-- tab 第二个 -->
内容二
{% endtabs %}
```

## 常用命令

| 命令               | 说明                                             |
| :----------------- | :----------------------------------------------- |
| `npm run dev`      | 启动开发服务器，访问 `localhost:4321`            |
| `npm run build`    | 构建生产站点到 `./dist/` 目录                     |
| `npm run preview`  | 本地预览生产构建结果                              |

## 注意事项

- 文章 URL 格式为 `/blog/<slug>/`；首页分页为 `/page/<n>/`。
- 站内搜索（`navbar.search.enable`）无需额外配置——索引在构建时自动生成（`/search.json`）。
- swup（单页模式）默认开启（`global.single_page`）；标记了 `data-swup-reload-script` 的脚本会在页面切换时重新执行。
- Font Awesome 资源（包含部分 Pro 图标）来自原主题。
- 未移植的部分：基于 nodejieba 的中文分词推荐（改用纯 JS TF-IDF 分词器替代）、hexo-generator-searchdb 的 XML 格式（改用 JSON 格式）。

## 致谢

主题设计出自 [EvanNotFound](https://github.com/EvanNotFound/hexo-theme-redefine)。请在页脚保留主题版权信息。
