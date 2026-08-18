<div align="center">

**简体中文** | [English](README_EN.md)

</div>

# Chami

基于 [Astro](https://astro.build/) 构建的现代个人博客。快速、美观且完全自包含——具备渐变导航栏、卡片式文章、深色/浅色模式、单页切换等特性。

## 特性

- 现代化设计系统：渐变导航栏、卡片式文章、Geist/Chillax 字体、Font Awesome 图标
- 全屏首页横幅：固定背景、打字机副标题（Typed.js + 一言 API）、社交链接与二维码
- 首页侧边栏（头像、作者等级、站点统计、公告、友链）+ 带封面/摘要/标签的文章卡片
- 文章页：封面模糊标题覆盖层、作者 + 等级标签、元信息行（日期、分类、标签、字数、阅读时间）、粘性目录（滚动监听）、版权框、上一篇/下一篇导航、文章推荐（TF-IDF）
- 深色/浅色模式切换（持久化保存，尊重 `prefers-color-scheme`）、导航栏收缩 + 移动端抽屉
- 侧边工具：主题切换、滚动进度百分比/进度条、回到顶部/底部、RSS
- **swup 单页切换**（SPA 过渡 + 预加载 + 进度条 + 滑动动画）
- **站内搜索**（构建时索引、对话框式搜索、关键词高亮）
- **图片查看器**（点击放大、拖拽、滚轮缩放、上一张/下一张、EXIF 面板）
- **评论系统**（waline / giscus / gitalk / twikoo / utterances / artalk，配置驱动）
- **Tag 插件**：`{% button %}` `{% callout %}` `{% note %}` `{% folding %}` `{% grid %}` `{% tabs %}`
- **Mermaid** 图表（```mermaid 代码块）、**APlayer** 音乐播放器、**Preloader** 加载动画、**Pangu** 中英文排版间距
- Shiki 代码高亮（浅色/深色主题、mac 风格容器带复制/折叠按钮）、懒加载、del-mask、外链图标、表格滚动
- 页面：首页（分页）、文章页、`/archives`、`/tags`、`/tags/<tag>/`、`/categories`（嵌套）、`/categories/<cat>/`、`/friends`、`/bookmarks`、`/essays`、`/photos`（瀑布流）、`/music`、`/about`、404
- 页脚：版权、运行时长统计、站点统计、Vercount 浏览量、ICP 备案、自定义注入
- Google Analytics、自定义字体 URL、head/footer 注入、RSS + sitemap

## 项目结构

```text
├── public/
│   ├── fonts/            # Geist, Geist Mono, Chillax 字体
│   ├── fontawesome/      # Font Awesome CSS + webfonts
│   ├── images/           # favicon、头像、Logo、横幅图片
│   └── scripts/          # main.js + Typed.min.js
├── src/
│   ├── config.ts         # 所有站点配置都在这里
│   ├── i18n.ts           # 多语言翻译（en / zh-CN）
│   ├── components/       # 导航栏、页脚、文章卡片、目录等
│   ├── layouts/BaseLayout.astro
│   ├── pages/            # 首页、blog/[...slug]、标签、分类、归档等
│   ├── styles/global.css # Tailwind v4 + 主题 CSS 入口
│   ├── plugins/          # rehype 插件（代码容器）
│   └── content/blog/     # 文章（Markdown 与 MDX）
├── astro.config.mjs
└── package.json
```

## 配置

所有站点配置都集中在 **`src/config.ts`**：

- `siteConfig` — 站点标题、副标题、作者、URL、语言（`en` / `zh-CN`）
- `themeConfig.colors` — 主色、默认模式
- `themeConfig.home_banner` — 横幅图片、标题、打字机副标题、社交链接、二维码、破碎效果参数
- `themeConfig.navbar` — 导航链接（可带子菜单）、渐变色、宽度、**站内搜索**（启用/预加载/每篇文章的 top_n）
- `themeConfig.home` — 侧边栏、文章卡片选项
- `themeConfig.articles` — 代码块样式/主题、目录、版权许可、**文章推荐**（启用/标题/数量）
- `themeConfig.comment` — 评论系统（`waline`/`giscus`/`gitalk`/`twikoo`/`utterances`/`artalk`）+ 系统配置
- `themeConfig.plugins` — aplayer 音乐列表、mermaid 主题/版本
- `themeConfig.footer` — 运行时长统计、站点统计、ICP、自定义
- `themeConfig.global` — 单页模式（swup）、预加载动画、网站计数器（Vercount）、Google Analytics、注入（head/footer HTML）、自定义字体
- `themeConfig.page_templates` — 标签页样式、友链列数、瀑布流分批大小

数据驱动页面读取 `src/data/` 下的数据：

- `friends.json` — `[{ links_category, has_thumbnail, list: [{ name, link, description, avatar, thumbnail }] }]`
- `bookmarks.json` — `[{ category, icon, items: [{ name, link, description, image }] }]`
- `essays.json` — `[{ date: 'YYYY-MM-DD HH:mm:ss', content: 'markdown' }]`
- `masonry.json` — `[{ image, title, description, width, height, exif }]`

## 文章 Frontmatter

```yaml
---
title: '文章标题'
description: '摘要'
pubDate: '2024-06-19'
updatedDate: '2024-07-01'
cover: './cover.jpg'       # 封面 | 横幅 | 缩略图（thumbnail: false 关闭）
tags: ['Astro', 'Blog']
categories: ['指南']       # 嵌套分类：['父分类', '子分类']
sticky: true               # 置顶
license: 'cc_by_nc_sa'     # 覆盖默认许可
toc: false                 # 关闭本篇目录
comment: false
expires: '2025-01-01'      # 该日期后显示"过时"警告
og_image: './og.jpg'
---
```

## Tag 插件

```markdown
{% button 按钮文字, https://example.com %}
{% button url="https://example.com" text="带名称" icon="fa-brands fa-github" align="center" %}
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

## 命令

| 命令 | 操作 |
| :--- | :--- |
| `npm run dev` | 在 `localhost:4321` 启动开发服务器 |
| `npm run build` | 构建生产版本到 `./dist/` |
| `npm run preview` | 预览生产构建 |

## 备注

- 文章 URL 为 `/blog/<slug>/`；首页分页为 `/page/<n>/`。
- 站内搜索（`navbar.search.enable`）无需额外配置——索引在构建时生成（`/search.json`）。
- swup（单页模式）默认开启（`global.single_page`）；标记了 `data-swup-reload-script` 的脚本会在页面切换时重新执行。
- Font Awesome 资源（含部分 Pro 图标）随站点打包。
- 中文分词推荐使用纯 JS TF-IDF 分词器；搜索索引使用 JSON 格式。
