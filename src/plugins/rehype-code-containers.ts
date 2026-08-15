/**
 * Wraps Shiki-highlighted `<pre>` blocks in Redefine-style `.code-container`
 * divs with a `data-rel` language label.
 *
 * Runs as a rehype plugin after Astro's built-in Shiki highlighting, which
 * sets `data-language` on the `<pre>` element.
 */

type Node = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
	[prop: string]: unknown;
};

function wrapCodeBlocks(tree: Node) {
	const queue: Node[] = [tree];
	while (queue.length > 0) {
		const parent = queue.pop()!;
		const children = parent.children;
		if (!children) continue;
		for (let i = 0; i < children.length; i++) {
			const node = children[i];
			if (!node || node.type !== 'element') {
				continue;
			}
			if (node.tagName === 'pre') {
				const dataLanguage = (node.properties as Record<string, unknown>)?.dataLanguage;
				let lang: string = 'code';
				if (typeof dataLanguage === 'string' && dataLanguage) {
					lang = dataLanguage;
				} else {
					const code = (node.children ?? []).find((child) => child.type === 'element' && child.tagName === 'code');
					const classes = (code?.properties as Record<string, unknown>)?.className;
					const list = Array.isArray(classes) ? classes : classes ? [classes] : [];
					const match = list
						.map((cls) => String(cls))
						.find((cls) => cls.startsWith('language-'));
					if (match) lang = match.slice('language-'.length);
				}
				// 数学公式由 rehype-katex 接管，不包代码容器
				if (lang === 'math') {
					continue;
				}
				if (['plain', 'plaintext', 'text'].includes(lang)) lang = 'code';
				const label = lang.charAt(0).toUpperCase() + lang.slice(1);
				const wrapper: Node = {
					type: 'element',
					tagName: 'div',
					// rehype-stringify escapes attribute values; pre-escaping here would double-escape.
				properties: { className: ['code-container'], dataRel: label },
					children: [node],
				};
				children[i] = wrapper;
				continue;
			}
			queue.push(node);
		}
	}
}

export function rehypeCodeContainers() {
	return (tree: Node) => {
		wrapCodeBlocks(tree);
	};
}
