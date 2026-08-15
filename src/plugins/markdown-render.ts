/**
 * Minimal markdown renderer used for hexo tag bodies and data-driven pages
 * (essays etc.). Full posts go through Astro's own pipeline; this one is for
 * inner content only.
 *
 * Feature-parity with the main pipeline: mermaid, Shiki code highlighting +
 * code containers, KaTeX, external link icons, delete mask, table scroll,
 * lazyload, image captions and image dimensions.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { codeToHast } from 'shiki';
import { markdownConfig } from '../config.ts';
import { remarkMermaid } from './remark-mermaid.ts';
import { rehypeCodeContainers } from './rehype-code-containers.ts';
import { rehypeImageSize } from './rehype-image-size.ts';
import { rehypeExternalLinks, rehypeDeleteMask, rehypeTableScroll, rehypeLazyload, rehypeImageCaption } from './rehype-filters.ts';

type Node = {
	type: string;
	children?: Node[];
	[prop: string]: unknown;
};

let tagTransformer: ((tree: Node) => void | Promise<void>) | null = null;

/** Registers the hexo-tag transformer (set by remark-tags to avoid a circular import). */
export function setTagTransformer(fn: (tree: Node) => void | Promise<void>) {
	tagTransformer = fn;
}

function applyTagTransformer() {
	return async (tree: Node) => {
		await tagTransformer?.(tree);
	};
}

/* ------------------------------------------------------------------ */
/* Shiki highlighting for mini-pipeline code blocks                     */
/* ------------------------------------------------------------------ */

const LANGUAGE_CLASS_RE = /^language-([\S]+)$/;

function textContent(node: Node): string {
	if (node.type === 'text') return String(node.value ?? '');
	if (!node.children) return '';
	return node.children.map(textContent).join('');
}

/**
 * Mirrors Astro's own Shiki output so the site CSS and runtime copy/fold
 * buttons keep working: `astro-code` class, `data-language`, wrap styles.
 */
function normalizeShikiTransformer(lang: string) {
	return {
		pre(node: { properties?: Record<string, unknown> }) {
			const props = (node.properties ??= {});
			const rawClass = Array.isArray(props.className)
				? props.className.join(' ')
				: typeof props.className === 'string'
					? props.className
					: '';
			props.className = rawClass.replace(/shiki/g, 'astro-code').split(/\s+/).filter(Boolean);
			props.dataLanguage = lang;
			const style = typeof props.style === 'string' ? props.style : '';
			props.style = style + '; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
		},
	};
}

function rehypeShikiMini() {
	return async (tree: Node) => {
		const queue: Node[] = [tree];
		const jobs: { parent: Node; index: number; code: string; lang: string }[] = [];
		while (queue.length > 0) {
			const parent = queue.pop()!;
			const children = parent.children;
			if (!children) continue;
			for (let i = 0; i < children.length; i++) {
				const node = children[i];
				if (!node || node.type !== 'element') continue;
				if (node.tagName === 'pre') {
					const codeEl = (node.children ?? []).find((child: Node) => child.type === 'element' && child.tagName === 'code');
					if (codeEl) {
						const codeProps = (codeEl.properties ?? {}) as Record<string, unknown>;
						const rawClasses = codeProps.className;
						const classes: string[] = Array.isArray(rawClasses)
							? rawClasses.map(String)
							: typeof rawClasses === 'string'
								? [rawClasses]
								: [];
						const langClass = classes.find((cls: string) => LANGUAGE_CLASS_RE.test(cls));
						const lang = langClass ? LANGUAGE_CLASS_RE.exec(langClass)![1] : 'plaintext';
						jobs.push({ parent, index: i, code: textContent(codeEl), lang });
					}
					continue;
				}
				queue.push(node);
			}
		}
		for (const job of jobs) {
			for (const lang of [job.lang, 'plaintext']) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const result: any = await codeToHast(job.code, {
						lang,
						themes: { light: markdownConfig.codeThemes.light, dark: markdownConfig.codeThemes.dark },
						transformers: [normalizeShikiTransformer(lang) as never],
					});
					const pre = result?.children?.[0];
					if (pre) {
						job.parent.children![job.index] = pre;
						break;
					}
				} catch {
					// Unknown language: fall back to plaintext, keep the original node if both fail.
				}
			}
		}
	};
}

/* ------------------------------------------------------------------ */
/* Renderer setup                                                      */
/* ------------------------------------------------------------------ */

// 使用 any 规避 unified 泛型与自定义 tree 类型的兼容问题
let miniRenderer: any = null;

function getMiniRenderer() {
	if (!miniRenderer) {
		miniRenderer = unified()
			.use(applyTagTransformer)
			.use(remarkMath)
			.use(remarkMermaid)
			.use(remarkGfm)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeShikiMini)
			.use(rehypeCodeContainers)
			.use(rehypeKatex)
			.use(rehypeExternalLinks)
			.use(rehypeDeleteMask)
			.use(rehypeTableScroll)
			.use(rehypeLazyload)
			.use(rehypeImageCaption)
			.use(rehypeImageSize)
			.use(rehypeRaw)
			.use(rehypeStringify, { allowDangerousHtml: true });
	}
	return miniRenderer;
}

export async function renderMarkdownBody(nodes: Node[]): Promise<string> {
	const root: Node = { type: 'root', children: nodes };
	const processor = getMiniRenderer();
	const hast = await processor.run(root as never);
	return String(processor.stringify(hast as never)).trim();
}

let stringRenderer: any = null;

/** Renders a markdown string to HTML (same plugin set as the body renderer). */
export async function renderMarkdownString(markdown: string): Promise<string> {
	if (!stringRenderer) {
		stringRenderer = unified()
			.use(remarkParse)
			.use(applyTagTransformer)
			.use(remarkMath)
			.use(remarkMermaid)
			.use(remarkGfm)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeShikiMini)
			.use(rehypeCodeContainers)
			.use(rehypeKatex)
			.use(rehypeExternalLinks)
			.use(rehypeDeleteMask)
			.use(rehypeTableScroll)
			.use(rehypeLazyload)
			.use(rehypeImageCaption)
			.use(rehypeImageSize)
			.use(rehypeRaw)
			.use(rehypeStringify, { allowDangerousHtml: true });
	}
	const file = await stringRenderer.process(markdown);
	return String(file.value).trim();
}

let parseProcessor: any = null;

/** Parses a markdown string into mdast root children. */
export function parseMarkdown(markdown: string): Node[] {
	if (!parseProcessor) {
		parseProcessor = unified().use(remarkParse);
	}
	const tree = parseProcessor.parse(markdown) as unknown as Node;
	return tree.children ?? [];
}
