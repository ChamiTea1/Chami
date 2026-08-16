/**
 * Redefine theme configuration for Astro.
 * Ported from hexo-theme-redefine's _config.yml.
 * https://github.com/EvanNotFound/hexo-theme-redefine
 */

export const siteConfig = {
	title: '茶糜的小站',
	subtitle: '记录生活与学习的点点滴滴',
	author: '茶糜',
	url: 'https://chami.asia',
	language: 'zh-CN',
	description: '记录生活与学习的点点滴滴。',
};

/* ------------------------------------------------------------------ */
/* Theme configuration (mirrors _config.yml)                           */
/* ------------------------------------------------------------------ */

export const themeConfig = {
	info: {
		title: siteConfig.title,
		subtitle: siteConfig.subtitle,
		author: siteConfig.author,
		url: siteConfig.url,
	},

	defaults: {
		favicon: 'https://cdn.jsdelivr.net/gh/ChamiTea1/img-bed@main/avatar/shaoye.jpg',
		logo: '',
		avatar: 'https://cdn.jsdelivr.net/gh/ChamiTea1/img-bed@main/avatar/shaoye.jpg',
	},

	colors: {
		primary: '#39c5bb',
		default_mode: 'light' as 'light' | 'dark',
	},

	global: {
		content_max_width: '1000px',
		sidebar_width: '210px',
		scroll_progress: {
			bar: false,
			percentage: true,
		},
		website_counter: {
			url: 'https://cn.vercount.one/js',
			enable: true,
			site_pv: true,
			site_uv: true,
			post_pv: true,
		},
		single_page: true,
		preloader: {
			enable: false,
			custom_message: '',
		},
		side_tools: {
			gear_rotation: true,
			auto_expand: false,
		},
		open_graph: {
			enable: true,
			image: 'https://cdn.jsdelivr.net/gh/ChamiTea1/img-bed@main/avatar/shaoye.jpg',
			description: siteConfig.description,
		},
		google_analytics: {
			enable: false,
			id: '',
		},
		fonts: {
			chinese: {
				enable: false,
				family: '',
				url: '',
			},
			english: {
				enable: false,
				family: '',
				url: '',
			},
			title: {
				enable: false,
				family: '',
				url: '',
			},
		},
	},

	fontawesome: {
		thin: false,
		light: false,
		duotone: false,
		sharp_solid: false,
	},

	home_banner: {
		enable: true,
		style: 'fixed' as 'static' | 'fixed',
		image: {
			light: [
				'/images/wallhaven-wqery6-light.webp',
				'/images/wallpapers/japan-artistic.jpg',
				'/images/wallpapers/kawaii-cat-girl.webp',
				'/images/wallpapers/love-heart-tree.jpg',
				'/images/wallpapers/milky-way.jpg',
			],
			dark: ['/images/wallhaven-wqery6-dark.webp'],
		},
		title: "坠入无边黑暗，携光而来拯救之",
		subtitle: {
			text: ['云销雨霁，彩彻区明', 
				   '萍水相逢，尽是他乡之客', 
				   '生活随笔与碎碎念'],
			hitokoto: {
				enable: false,
				show_author: false,
				refresh_on_loop: false,
				api: 'https://v1.hitokoto.cn',
			},
			typing_speed: 100,
			backing_speed: 80,
			starting_delay: 500,
			backing_delay: 1500,
			loop: true,
			smart_backspace: true,
		},
		text_color: {
			light: '#fff',
			dark: '#d1d1b6',
		},
		text_style: {
			title_size: '2.8rem',
			subtitle_size: '1.5rem',
			line_height: '1.2',
		},
		custom_font: {
			enable: false,
			family: '',
			url: '',
		},
		social_links: {
			enable: true,
			style: 'default' as 'default' | 'reverse' | 'center',
			links: [] as { name?: string; icon?: string; url: string }[],
			qrs: [] as { name?: string; icon?: string; qr: string }[],
		},
	},

	navbar: {
		auto_hide: false,
		color: {
			left: '#f78736',
			right: '#367df7',
			transparency: 35,
		},
		width: {
			home: '1200px',
			pages: '1000px',
		},
		links: [
			{ label: 'Home', path: '/', icon: 'fa-regular fa-house' },
			{ label: '相册', path: '/photos', icon: 'fa-regular fa-images' },
			{ label: '音乐', path: '/music', icon: 'fa-regular fa-music' },
			{ label: 'Archives', path: '/archives', icon: 'fa-regular fa-archive' },
			{ label: 'Tags', path: '/tags', icon: 'fa-regular fa-tags' },
			{ label: 'Categories', path: '/categories', icon: 'fa-regular fa-folder' },
			{ label: 'About', path: '/about', icon: 'fa-regular fa-user' },
		] as { label: string; path: string; icon?: string; submenus?: { label: string; path: string }[] }[],
		search: {
			enable: false,
			preload: true,
			top_n_per_article: 1,
			path: '/search.json',
		},
	},

	home: {
		sidebar: {
			enable: true,
			position: 'left' as 'left' | 'right',
			// first_item 菜单卡片已按站长要求移除，sidebar.links 仅用于移动端菜单（Navbar）
			announcement: '欢迎来到我的小站~',
			show_on_mobile: true,
			links: [
				{ label: 'Archives', path: '/archives', icon: 'fa-regular fa-archive' },
				{ label: 'Tags', path: '/tags', icon: 'fa-regular fa-tags' },
				{ label: 'Categories', path: '/categories', icon: 'fa-regular fa-folder' },
			],
		},
		article_date_format: 'auto' as 'auto' | 'relative' | string,
		excerpt_length: 200,
		categories: {
			enable: true,
			limit: 3,
		},
		tags: {
			enable: true,
			limit: 3,
		},
	},

	articles: {
		style: {
			font_size: '16px',
			line_height: '1.5',
			image_border_radius: '12px',
			image_alignment: 'center' as 'left' | 'center',
			image_caption: false,
			link_icon: true,
			delete_mask: false,
			title_alignment: 'left' as 'left' | 'center',
			heading_spacing: 'default' as 'compact' | 'default' | 'spacious',
		},
		word_count: {
			enable: true,
			count: true,
			min2read: true,
		},
		author_label: {
			enable: true,
			auto: true,
			list: [],
		},
		code_block: {
			copy: true,
			style: 'mac' as 'mac' | 'default',
			highlight_theme: {
				light: 'github',
				dark: 'vs2015',
			},
			font: {
				enable: false,
				family: '',
				url: '',
			},
		},
		toc: {
			enable: true,
			max_depth: 3,
			number: false,
			expand: true,
			init_open: true,
		},
		copyright: {
			enable: true,
			default: 'cc_by_nc_sa' as
				| 'cc_by_nc_sa'
				| 'cc_by_nd'
				| 'cc_by_nc'
				| 'cc_by_sa'
				| 'cc_by'
				| 'all_rights_reserved'
				| 'public_domain',
		},
		lazyload: true,
		pangu_js: false,
		recommendation: {
			enable: true,
			title: '推荐阅读',
			limit: 3,
			// 推荐阅读卡片在本移植版仅桌面端渲染，移动端不显示，故无 mobile_limit。
			placeholder: '/images/wallhaven-wqery6-light.webp',
			skip_dirs: [] as string[],
		},
	},

	comment: {
		enable: false,
		system: 'waline' as 'waline' | 'gitalk' | 'twikoo' | 'giscus' | 'utterances' | 'artalk',
		config: {
			waline: {
				serverUrl: '',
				lang: 'zh-CN',
				emoji: [],
				recaptchaV3Key: '',
				turnstileKey: '',
				reaction: false,
				locale: undefined as Record<string, string> | undefined,
				login: '',
				wordLimit: undefined as number | undefined,
				pageSize: undefined as number | undefined,
				commentSorting: undefined as string | undefined,
				meta: [] as string[],
			},
			gitalk: {
				// 注意：Gitalk 的 clientSecret 会注入前端脚本（其 OAuth 流程使然，与原主题一致）。
				// 介意明文暴露的话请改用 giscus/waline 等不需要 secret 的评论系统。
				clientID: '',
				clientSecret: '',
				repo: '',
				owner: '',
				proxy: '',
			},
			twikoo: {
				version: '1.6.10',
				server_url: '',
				region: '',
			},
			giscus: {
				repo: '',
				repo_id: '',
				category: '',
				category_id: '',
				mapping: 'pathname',
				strict: 0,
				reactions_enabled: 1,
				emit_metadata: 0,
				lang: 'en',
				input_position: 'bottom',
				loading: 'lazy',
			},
			artalk: {
				server: '',
				site: '',
			},
			utterances: {
				repo: '',
				issue_term: 'pathname',
				issue_number: '',
				label: '',
				theme_light: 'github-light',
				theme_dark: 'github-dark',
			},
		},
	},

	footer: {
		runtime: true,
		icon: '<i class="fa-solid fa-heart fa-beat" style="--fa-animation-duration: 0.5s; color: #f54545"></i>',
		// 使用 ISO 格式，避免不同浏览器日期解析差异
		start: '2026-08-10T00:00:00',
		statistics: true,
		customize: '',
		icp: {
			enable: false,
			number: '',
			url: '',
		},
	},

	plugins: {
		feed: {
			enable: true,
		},
		aplayer: {
			enable: false,
			type: 'fixed' as 'fixed' | 'mini',
			audios: [
				{
					name: '',
					artist: '',
					url: '',
					cover: '',
					lrc: '',
					theme: '',
				},
			],
		},
		mermaid: {
			enable: false,
			version: '11.4.1',
			theme: {
				light: 'default',
				dark: 'dark',
			},
		},
		// MetingJS 自定义解析 API（留空则用默认公共 API），参考 LuviciiBlog 的 asset.meting_api
		meting_api: '',
	},

	inject: {
		enable: false,
		head: [] as string[],
		footer: [] as string[],
	},

	page_templates: {
		tags_style: 'blur' as 'blur' | 'cloud',
		// 友链页卡片列数（2 或 3）
		friends_column: 2 as 2 | 3,
		// 相册瀑布流分批加载
		masonry: {
			batch_size: 12,
			initial_batch_size: 24,
		},
	},

	credit: {
		// Please keep the theme credit. It respects the original author's work.
		theme_version: '2.7.0',
	},
};

export type ThemeConfig = typeof themeConfig;

/* ------------------------------------------------------------------ */
/* Shiki code theme mapping (theme config -> bundled Shiki themes)     */
/* ------------------------------------------------------------------ */

const shikiThemeMap: Record<string, string> = {
	github: 'github-light',
	'atom-one-light': 'one-light',
	default: 'github-light',
	'github-dark': 'github-dark',
	'monokai-sublime': 'monokai',
	vs2015: 'dark-plus',
	'night-owl': 'night-owl',
	'atom-one-dark': 'one-dark-pro',
	nord: 'nord',
	'tokyo-night-dark': 'tokyo-night',
	'a11y-dark': 'github-dark',
	agate: 'github-dark',
};

export const markdownConfig = {
	codeThemes: {
		light: shikiThemeMap[themeConfig.articles.code_block.highlight_theme.light] ?? 'github-light',
		dark: shikiThemeMap[themeConfig.articles.code_block.highlight_theme.dark] ?? 'dark-plus',
	},
};

/* ------------------------------------------------------------------ */
/* CSS variable generation (port of scripts/helpers/style-helpers.js)  */
/* ------------------------------------------------------------------ */

const safeValue = (value: unknown, fallback: string): string => {
	const text = String(value ?? '').trim();
	return text && !/[;{}<>\u0000-\u001f]/.test(text) ? text : fallback;
};

const safeLength = (value: unknown, fallback: string, unitless = false): string => {
	const text = String(value ?? '').trim();
	const pattern = unitless
		? /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|%|vh|vw|ch)?$/i
		: /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|%|vh|vw|ch)$/i;
	return pattern.test(text) ? text : fallback;
};

const safeColor = (value: unknown, fallback: string): string => {
	const text = String(value ?? '').trim();
	const pattern = /^(?:#[\da-f]{3,8}|[a-z]+|(?:rgb|hsl|oklab|oklch|lab|lch|color)\([^;{}<>]+\))$/i;
	return pattern.test(text) ? text : fallback;
};

const normalizeHex = (value: unknown, fallback: string): string => {
	const text = String(value ?? '').trim().toLowerCase();
	if (/^#[\da-f]{6}$/.test(text)) return text;
	if (/^#[\da-f]{3}$/.test(text)) {
		return `#${[...text.slice(1)].map((channel) => channel.repeat(2)).join('')}`;
	}
	return fallback;
};

const relativeLuminance = (color: string): number => {
	const channels = [1, 3, 5]
		.map((index) => parseInt(color.slice(index, index + 2), 16) / 255)
		.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (first: string, second: string): number => {
	const values = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
	return (values[0] + 0.05) / (values[1] + 0.05);
};

const primaryText = (primary: string): string => {
	const light = '#fff';
	const dark = '#202124';
	return contrastRatio(primary, light) >= contrastRatio(primary, dark) ? light : dark;
};

const scaleLength = (value: string, factor: number, fallback: string): string => {
	const match = String(value).match(/^(-?(?:\d+\.?\d*|\.\d+))(px|rem|em|%|vh|vw|ch)$/i);
	return match ? `${Number(match[1]) * factor}${match[2]}` : fallback;
};

const lightenHex = (color: string, amount: number): string => {
	const value = color.replace('#', '');
	if (!/^[\da-f]{6}$/i.test(value)) return color;
	const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let hue = 0;
	let saturation = 0;
	let lightness = (max + min) / 2;

	if (max !== min) {
		const delta = max - min;
		saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
		hue =
			max === r
				? (g - b) / delta + (g < b ? 6 : 0)
				: max === g
					? (b - r) / delta + 2
					: (r - g) / delta + 4;
		hue /= 6;
	}

	lightness = Math.min(1, lightness + amount * (1 - lightness));
	const hueToRgb = (p: number, q: number, input: number): number => {
		let t = input;
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
	const p = 2 * lightness - q;
	const channels =
		saturation === 0
			? [lightness, lightness, lightness]
			: [hueToRgb(p, q, hue + 1 / 3), hueToRgb(p, q, hue), hueToRgb(p, q, hue - 1 / 3)];
	return `#${channels.map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
};

const withHexAlpha = (color: string, alpha: unknown, fallback: string): string => {
	const hex = String(color).replace('#', '');
	const alphaText = String(alpha ?? '35').padStart(2, '0').slice(-2);
	if (!/^[\da-f]{6}$/i.test(hex) || !/^[\da-f]{2}$/i.test(alphaText)) return fallback;
	const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
	const opacity = ((parseInt(alphaText, 16) / 255) * 100).toFixed(1);
	return `rgb(${channels.join(' ')} / ${opacity}%)`;
};

const headings = (style: ThemeConfig['articles']['style']): Record<string, string> => {
	const presets = {
		compact: ['2.4rem', '1.8rem', '1.5rem', '1.25rem', '1.05rem', '0.95rem'],
		default: ['3.2rem', '2.4rem', '1.9rem', '1.6rem', '1.4rem', '1.3rem'],
		spacious: ['4rem', '3rem', '2.4rem', '2rem', '1.75rem', '1.5rem'],
	};
	const values = presets[style.heading_spacing] ?? presets.default;
	return Object.fromEntries(
		values.map((fallback, index) => [`--heading-h${index + 1}-margin`, safeLength(fallback, fallback)]),
	);
};

const declarations = (values: Record<string, string>): string =>
	Object.entries(values)
		.map(([name, value]) => `${name}:${value}`)
		.join(';');

/** Generates the runtime CSS variables, equivalent to the theme's themeStyles() helper. */
export function themeVars(): string {
	const t = themeConfig;
	const articleStyle = t.articles.style;
	const primary = normalizeHex(t.colors.primary, '#a31f34');
	const selection = lightenHex(primary, 0.1);
	const contentWidth = safeLength(t.global.content_max_width, '1000px');
	const light = {
		'--home-banner-text-color': safeColor(t.home_banner.text_color.light, '#fff'),
	};
	const dark = {
		'--home-banner-text-color': safeColor(t.home_banner.text_color.dark, '#d1d1b6'),
	};
	const navLeft = safeColor(t.navbar.color.left, '#f78736');
	const navRight = safeColor(t.navbar.color.right, '#367df7');
	const layout = {
		'--primary-color': primary,
		'--rd-primary-text': primaryText(primary),
		'--selection-color': selection,
		'--content-max-width': contentWidth,
		'--content-with-toc-max-width': scaleLength(contentWidth, 1.2, '1200px'),
		'--navbar-width-home': safeLength(t.navbar.width.home, '1200px'),
		'--navbar-width-pages': safeLength(t.navbar.width.pages, '1000px'),
		'--toc-width': safeLength(t.global.sidebar_width, '210px'),
		'--article-font-size': safeLength(articleStyle.font_size, '16px'),
		'--article-line-height': safeLength(articleStyle.line_height, '1.5', true),
		'--image-radius': safeLength(articleStyle.image_border_radius, '12px'),
		'--image-alignment': ['left', 'center'].includes(articleStyle.image_alignment) ? articleStyle.image_alignment : 'center',
		'--home-title-size': safeLength(t.home_banner.text_style.title_size, '2.8rem'),
		'--home-subtitle-size': safeLength(t.home_banner.text_style.subtitle_size, '1.5rem'),
		'--home-line-height': safeLength(t.home_banner.text_style.line_height, '1.2', true),
		'--nav-color-1': withHexAlpha(navLeft, t.navbar.color.transparency, 'rgb(247 135 54 / 20.8%)'),
		'--nav-color-2': withHexAlpha(navRight, t.navbar.color.transparency, 'rgb(54 125 247 / 20.8%)'),
		...headings(articleStyle),
	};
	return `<style id="redefine-theme-vars">:root{${declarations(layout)}}.light{${declarations(light)}}.dark{${declarations(dark)}}</style>`;
}

/** Data attributes for <html>, equivalent to themeStyleAttrs(). */
export function themeStyleAttrs(): Record<string, string> {
	const t = themeConfig;
	const articleStyle = t.articles.style;
	return {
		'data-code-style': ['mac', 'default'].includes(t.articles.code_block.style) ? t.articles.code_block.style : 'default',
		'data-heading-spacing': ['compact', 'spacious'].includes(articleStyle.heading_spacing) ? articleStyle.heading_spacing : 'default',
		'data-image-alignment': ['left', 'center'].includes(articleStyle.image_alignment) ? articleStyle.image_alignment : 'center',
		'data-tag-style': safeValue(t.page_templates.tags_style, 'cloud'),
	};
}

/** Config injected into the page for client-side scripts. */
export function clientThemeConfig(): Record<string, unknown> {
	const t = themeConfig;
	return {
		colors: t.colors,
		language: siteConfig.language,
		global: t.global,
		home_banner: {
			...t.home_banner,
			subtitle: {
				...t.home_banner.subtitle,
				text: Array.isArray(t.home_banner.subtitle.text) ? t.home_banner.subtitle.text : [t.home_banner.subtitle.text],
			},
		},
		articles: t.articles,
		navbar: t.navbar,
		home: t.home,
		footer: t.footer,
		footerStart: t.footer.start,
		plugins: {
			...t.plugins,
			mermaid: {
				...t.plugins.mermaid,
				theme: {
					light: t.plugins.mermaid.theme.light || 'default',
					dark: t.plugins.mermaid.theme.dark || 'dark',
				},
			},
		},
		comment: t.comment,
		inject: t.inject,
		page_templates: t.page_templates,
		root: '/',
	};
}

/* ------------------------------------------------------------------ */
/* Utilities used across pages                                          */
/* ------------------------------------------------------------------ */

export interface NavLink {
	label: string;
	path: string;
	icon?: string;
	submenus?: { label: string; path: string }[];
}

export function getAuthorLabel(postCount: number): string {
	const { enable, auto, list } = themeConfig.articles.author_label;
	if (!enable) return '';
	let level = Math.floor(Math.log2(Math.max(postCount, 1)));
	level = level < 2 ? 1 : level - 1;
	if (auto === false && list.length > 0) {
		return level > list.length ? list[list.length - 1] : list[level - 1];
	}
	return `Lv${level}`;
}
