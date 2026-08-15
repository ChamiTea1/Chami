# AstroChamiBlog

An Astro port of [hexo-theme-redefine](https://github.com/EvanNotFound/hexo-theme-redefine) by EvanNotFound.

## Features

- Redefine design system: gradient navbar, card-style articles, Geist/Chillax fonts, Font Awesome icons
- Full-screen home banner with fixed background, typed subtitle (Typed.js + 一言 API), social links & QR codes
- Home sidebar (avatar, author Lv, statistics, announcement, links) + post cards with cover/excerpt/tags
- Article page: cover with blurred title overlay, author + Lv label, meta line (dates, categories, tags, word count, reading time), sticky TOC with scroll spy, copyright box, prev/next navigation, article recommendation (TF-IDF)
- Dark/light mode toggle (persisted, respects `prefers-color-scheme`), navbar shrink + mobile drawer
- Side tools: theme toggle, scroll progress percent/bar, scroll top/bottom, RSS
- **swup 单页切换** (SPA transitions + preload + progress bar + slide animations)
- **站内搜索** (build-time index, Redefine-style dialog, keyword highlight)
- **图片查看器** (click to zoom, drag, wheel zoom, prev/next, EXIF panel)
- **评论系统** (waline / giscus / gitalk / twikoo / utterances / artalk, config-driven)
- **Hexo tag 插件**: `{% button %}` `{% callout %}` `{% note %}` `{% folding %}` `{% grid %}` `{% tabs %}`
- **Mermaid** diagrams (```mermaid fences), **APlayer** music player, **Preloader** animation, **Pangu** CJK spacing
- Shiki code highlighting (light/dark themes, mac-style container with copy/fold buttons), lazyload, del-mask, external link icons, table scroll
- Pages: home (paginated), post, `/archives`, `/tags`, `/tags/<tag>/`, `/categories` (nested), `/categories/<cat>/`, `/friends`, `/bookmarks`, `/essays`, `/photos` (masonry), `/about`, 404
- Footer: copyright, runtime counter, site statistics, Vercount page views, ICP, inject
- Google Analytics, custom font URLs, head/footer injection, RSS + sitemap

## Project Structure

```text
├── public/
│   ├── fonts/            # Geist, Geist Mono, Chillax
│   ├── fontawesome/      # Font Awesome CSS + webfonts
│   ├── images/           # favicon, avatar, logo, banner images
│   └── scripts/          # main.js + Typed.min.js
├── src/
│   ├── config.ts         # Theme configuration (port of _config.yml)
│   ├── i18n.ts           # Translations (en / zh-CN)
│   ├── components/       # Navbar, Footer, PostCard, TOC, ...
│   ├── layouts/BaseLayout.astro
│   ├── pages/            # index, blog/[...slug], tags, categories, archives, ...
│   ├── styles/global.css # Tailwind v4 + theme CSS entry
│   ├── plugins/          # rehype plugin (code containers)
│   └── content/blog/     # posts (Markdown & MDX)
├── astro.config.mjs
└── package.json
```

## Configuration

All theme options live in **`src/config.ts`** (mirrors the Redefine `_config.yml`):

- `siteConfig` — title, subtitle, author, url, language (`en` / `zh-CN`)
- `themeConfig.colors` — primary color, default mode
- `themeConfig.home_banner` — banner images, title, typed subtitle, social links, QR codes
- `themeConfig.navbar` — links (with optional submenus), gradient colors, widths, **search** (enable/preload/top_n_per_article)
- `themeConfig.home` — sidebar, post card options
- `themeConfig.articles` — code block style/themes, TOC, copyright license, **recommendation** (enable/title/limit)
- `themeConfig.comment` — comment system (`waline`/`giscus`/`gitalk`/`twikoo`/`utterances`/`artalk`) + system config
- `themeConfig.plugins` — aplayer audios, mermaid theme/version
- `themeConfig.footer` — runtime counter, statistics, ICP, customize
- `themeConfig.global` — single_page (swup), preloader, website_counter (Vercount), google_analytics, inject (head/footer HTML), custom fonts
- `themeConfig.page_templates` — tags style, friends columns, masonry batch sizes

Data-driven pages read from `src/data/`:

- `friends.json` — `[{ links_category, has_thumbnail, list: [{ name, link, description, avatar, thumbnail }] }]`
- `bookmarks.json` — `[{ category, icon, items: [{ name, link, description, image }] }]`
- `essays.json` — `[{ date: 'YYYY-MM-DD HH:mm:ss', content: 'markdown' }]`
- `masonry.json` — `[{ image, title, description, width, height, exif }]`

## Post Frontmatter

```yaml
---
title: 'Post title'
description: 'Summary'
pubDate: '2024-06-19'
updatedDate: '2024-07-01'
cover: './cover.jpg'       # cover | banner | thumbnail (thumbnail: false to disable)
tags: ['Astro', 'Blog']
categories: ['Guide']       # nested: ['Parent', 'Child']
sticky: true                # pin to top
license: 'cc_by_nc_sa'      # override default license
toc: false                  # disable TOC for this post
comment: false
expires: '2025-01-01'       # show "outdated" warning after this date
og_image: './og.jpg'
---
```

## Hexo tag plugins

```markdown
{% button 按钮文字, https://example.com %}
{% button url="https://example.com" text="Named" icon="fa-brands fa-github" align="center" %}
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

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview the production build                 |

## Notes

- Post URLs are `/blog/<slug>/`; home page pagination is `/page/<n>/`.
- Local search (`navbar.search.enable`) requires no extra setup — the index is generated at build time (`/search.json`).
- swup (single page) is enabled by default (`global.single_page`); scripts marked `data-swup-reload-script` re-run on page swaps.
- Font Awesome assets (including some Pro icons) are bundled from the original theme.
- Not ported: nodejieba-based Chinese word segmentation for recommendations (a pure-JS TF-IDF tokenizer is used instead), hexo-generator-searchdb XML format (JSON used instead).

## Credit

Theme design by [EvanNotFound](https://github.com/EvanNotFound/hexo-theme-redefine). Please keep the theme credit in the footer.
