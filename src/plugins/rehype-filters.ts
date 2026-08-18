/**
 * Rehype filters:
 * external link icons, <del> mask, table scroll wrapper, image lazyload,
 * image captions.
 */

import { themeConfig, siteConfig } from '../config.ts';

type Node = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
	[prop: string]: unknown;
};

function walk(tree: Node, visitor: (node: Node, parent: Node, index: number) => void) {
	const queue: { parent: Node; index: number }[] = [];
	if (tree.children) {
		for (let i = tree.children.length - 1; i >= 0; i--) queue.push({ parent: tree, index: i });
	}
	while (queue.length > 0) {
		const { parent, index } = queue.pop()!;
		const node = parent.children![index];
		if (!node) continue;
		visitor(node, parent, index);
		if (node.children) {
			for (let i = node.children.length - 1; i >= 0; i--) queue.push({ parent: node as Node, index: i });
		}
	}
}

const classNameOf = (node: Node): string[] => {
	const value = node.properties?.className;
	if (Array.isArray(value)) return value.map(String);
	if (typeof value === 'string') return [value];
	return [];
};

/* ---------------------------------------------------------- */
/* External links (articles.style.link_icon)                    */
/* ---------------------------------------------------------- */

let siteHostname: string | null = null;
function getSiteHostname(): string {
	if (siteHostname === null) {
		try {
			siteHostname = new URL(siteConfig.url).hostname;
		} catch {
			siteHostname = '';
		}
	}
	return siteHostname;
}

export function rehypeExternalLinks() {
	return (tree: Node) => {
		if (themeConfig.articles.style.link_icon === false) return;
		walk(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'a') return;
			const href = String(node.properties?.href ?? '');
			if (!href) return;
			if ((node.properties?.dataExternalLink as string) === '') return;
			let url: URL;
			try {
				url = new URL(href);
			} catch {
				return;
			}
			if (
				!url.protocol ||
				(url.protocol !== 'http:' && url.protocol !== 'https:') ||
				url.hostname === getSiteHostname()
			)
				return;
			node.properties = {
				...node.properties,
				dataExternalLink: '',
			};
			const textChild = (node.children ?? []).every((child) => child.type !== 'element' && child.type !== 'raw');
			if (!textChild) return;
			node.children = [
				...(node.children ?? []),
				{
					type: 'element',
					tagName: 'i',
					properties: {
						dataExternalIcon: '',
						className: ['fa-solid', 'fa-arrow-up-right', 'ml-[0.2em]', 'align-text-top', 'text-[0.7em]', 'font-light'],
						ariaHidden: 'true',
					},
					children: [],
				},
			];
		});
	};
}

/* ---------------------------------------------------------- */
/* Delete mask (articles.style.delete_mask)                     */
/* ---------------------------------------------------------- */

export function rehypeDeleteMask() {
	return (tree: Node) => {
		if (themeConfig.articles.style.delete_mask !== true) return;
		walk(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'del') return;
			node.properties = { ...node.properties, dataMask: '', tabindex: '0' };
		});
	};
}

/* ---------------------------------------------------------- */
/* Table scroll wrapper                                         */
/* ---------------------------------------------------------- */

export function rehypeTableScroll() {
	return (tree: Node) => {
		walk(tree, (node, parent, index) => {
			if (node.type !== 'element' || node.tagName !== 'table') return;
			if (parent.tagName === 'div' && classNameOf(parent).includes('table-scroll')) return;
			if (classNameOf(node).includes('gutter')) return;
			const wrapper: Node = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['table-scroll'] },
				children: [node],
			};
			parent.children![index] = wrapper;
		});
	};
}

/* ---------------------------------------------------------- */
/* Image lazyload (articles.lazyload)                           */
/* ---------------------------------------------------------- */

export function rehypeLazyload() {
	return (tree: Node) => {
		if (themeConfig.articles.lazyload !== true) return;
		walk(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'img') return;
			const src = String(node.properties?.src ?? '');
			if (!src || (node.properties?.dataLazySrc as string)) return;
			node.properties = {
				...node.properties,
				src: '/images/loading.svg',
				dataLazySrc: src,
				dataLazyState: 'pending',
			};
		});
	};
}

/* ---------------------------------------------------------- */
/* Image caption (articles.style.image_caption)                 */
/* ---------------------------------------------------------- */

export function rehypeImageCaption() {
	return (tree: Node) => {
		if (themeConfig.articles.style.image_caption !== true) return;
		walk(tree, (node, parent, index) => {
			if (node.type !== 'element' || node.tagName !== 'img') return;
			const alt = String(node.properties?.alt ?? '');
			if (!alt) return;
			if (parent.tagName === 'figure') return;
			const figure: Node = {
				type: 'element',
				tagName: 'figure',
				properties: {},
				children: [
					node,
					{
						type: 'element',
						tagName: 'figcaption',
						properties: {},
						children: [{ type: 'text', value: alt }],
					},
				],
			};
			parent.children![index] = figure;
		});
	};
}
