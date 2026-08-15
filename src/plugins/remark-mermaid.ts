/**
 * Converts ```mermaid fenced code blocks into raw `<pre class="mermaid">`
 * elements for client-side rendering (mirrors hexo-filter-mermaid-diagrams).
 */

import { themeConfig } from '../config.ts';

type Node = {
	type: string;
	lang?: string | null;
	value?: string;
	children?: Node[];
	[prop: string]: unknown;
};

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

export function remarkMermaid() {
	return (tree: Node) => {
		if (themeConfig.plugins.mermaid.enable !== true) return;
		const queue: Node[] = [tree];
		while (queue.length > 0) {
			const parent = queue.pop()!;
			const children = parent.children;
			if (!children) continue;
			for (let i = 0; i < children.length; i++) {
				const node = children[i];
				if (node.type === 'code' && (node.lang ?? '').toLowerCase() === 'mermaid') {
					const code = (node.value ?? '').trim();
					if (!code) continue;
					children[i] = {
						type: 'html',
						value: `<pre class="mermaid">${escapeHtml(code)}</pre>`,
					};
					continue;
				}
				if (node.children) queue.push(node as Node);
			}
		}
	};
}
