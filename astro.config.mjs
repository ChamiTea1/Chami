// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import { siteConfig, markdownConfig } from './src/config';
import { rehypeCodeContainers } from './src/plugins/rehype-code-containers';
import { rehypeExternalLinks, rehypeDeleteMask, rehypeTableScroll, rehypeLazyload, rehypeImageCaption } from './src/plugins/rehype-filters';
import { rehypeImageSize } from './src/plugins/rehype-image-size';
import { remarkRedefineTags } from './src/plugins/remark-tags';
import { remarkMermaid } from './src/plugins/remark-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 插件使用自定义 tree 类型，与 unified 的严格类型不兼容，统一放宽
/** @type {any} */
const remarkPlugins = [remarkMath, remarkRedefineTags, remarkMermaid];
/** @type {any} */
const rehypePlugins = [
	rehypeCodeContainers,
	rehypeKatex,
	rehypeExternalLinks,
	rehypeDeleteMask,
	rehypeTableScroll,
	rehypeLazyload,
	rehypeImageCaption,
	rehypeImageSize,
];

// https://astro.build/config
export default defineConfig({
	site: siteConfig.url,
	integrations: [
		mdx(),
		// /blog/ 是重定向占位页，不进 sitemap
		sitemap({
			filter: (page) => !page.endsWith('/blog/'),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		processor: unified({
			remarkPlugins,
			rehypePlugins,
			// 关闭 smartypants，避免改写数学公式里的引号和破折号
			smartypants: false,
		}),
		shikiConfig: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			themes: {
				light: /** @type {any} */ (markdownConfig.codeThemes.light),
				dark: /** @type {any} */ (markdownConfig.codeThemes.dark),
			},
			wrap: true,
		},
	},
});
