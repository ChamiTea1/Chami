/**
 * Port of hexo-theme-redefine's tag plugins as a remark plugin:
 *   {% button %}/{% btn %}/{% cell %}, {% callout %}/{% note %}...,
 *   {% folding %}, {% grid %}/{% btns %}/{% buttons %}, {% tabs %}/{% subtabs %}
 *
 * Tag blocks appear as paragraph nodes in mdast; bodies between opening and
 * closing tags are rendered through a mini markdown pipeline and inserted as
 * raw HTML (which rehype-raw parses at the end of Astro's pipeline).
 */

import { renderMarkdownBody, renderMarkdownString, parseMarkdown, setTagTransformer } from './markdown-render.ts';

type Node = {
	type: string;
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

/* ---------------------------------------------------------- */
/* Arg helpers                                                  */
/* ---------------------------------------------------------- */

type TagArgs = { positional: string[]; named: Record<string, string> };

function parseTagArgs(args: string[]): TagArgs {
	const result: TagArgs = { positional: [], named: {} };
	const raw = args
		.join(' ')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.trim();
	if (!raw) return result;

	const tokenRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
	let match: RegExpExecArray | null;
	let lastIndex = 0;
	let consumed = false;
	while ((match = tokenRegex.exec(raw)) !== null) {
		result.named[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
		if (!consumed) {
			const before = raw.slice(lastIndex, match.index).trim();
			if (before) result.positional.push(...before.split(/\s+/));
			consumed = true;
		}
		lastIndex = tokenRegex.lastIndex;
	}
	if (consumed) {
		const after = raw.slice(lastIndex).trim();
		if (after) result.positional.push(...after.split(/\s+/));
	} else {
		result.positional.push(...raw.split(/\s+/).filter(Boolean));
	}
	return result;
}

const cn = (...groups: (string | false | undefined)[]) => groups.filter(Boolean).join(' ');

/* ---------------------------------------------------------- */
/* Button ({% button %}, {% btn %}, {% cell %})                 */
/* ---------------------------------------------------------- */

const BUTTON_SIZE_CLASS: Record<string, string> = {
	sm: 'px-3 py-2 text-[0.9rem]',
	md: 'px-4 py-3',
	lg: 'px-6 py-5 text-[1.2rem]',
};
const BUTTON_ALIGN_CLASS: Record<string, string> = {
	inline: '',
	left: 'my-4 mr-auto flex w-fit',
	center: 'my-4 mx-auto flex w-full justify-center',
	right: 'my-4 ml-auto flex w-fit',
};

function renderButton(args: string[]): string {
	const rawArgs = args.join(' ').trim();
	const parsed = parseTagArgs(args);
	const hasNamed = ['text', 'label', 'url', 'href', 'icon', 'image', 'img', 'size', 'align', 'title', 'target', 'rel'].some((k) => parsed.named[k] != null);

	let text = '';
	let url = '';
	let iconClass = '';
	let imageSrc = '';
	let size = 'md';
	let align = 'inline';
	let title = '';
	let target = '';
	let rel = '';

	if (hasNamed) {
		text = (parsed.named.text || parsed.named.label || parsed.positional[0] || '').trim();
		url = (parsed.named.url || parsed.named.href || parsed.positional[1] || '').trim();
		const visual = (parsed.named.image || parsed.named.img || '').trim()
			? { icon: '', image: (parsed.named.image || parsed.named.img || '').trim() }
			: (parsed.named.icon || '').trim()
				? { icon: parsed.named.icon.trim(), image: '' }
				: { icon: parsed.positional[2] || '', image: '' };
		iconClass = visual.icon;
		imageSrc = visual.image;
		size = parsed.named.size || parsed.positional[3] || 'md';
		align = parsed.named.align || parsed.positional[4] || 'inline';
		title = (parsed.named.title || '').trim() || text;
		target = (parsed.named.target || '').trim();
		rel = (parsed.named.rel || '').trim() || (target === '_blank' ? 'noopener noreferrer' : '');
	} else {
		const delimiter = rawArgs.includes('::') ? '::' : ',';
		const parts = rawArgs
			.split(delimiter)
			.map((p) => p.trim())
			.filter(Boolean);
		if (parts.length >= 4) {
			const styleToken = parts[0];
			text = parts[1];
			url = parts[2];
			const visual = parts[3].includes('fa-') ? { icon: parts[3], image: '' } : { icon: '', image: parts[3] };
			iconClass = visual.icon;
			imageSrc = visual.image;
			const tokens = styleToken.toLowerCase().split(/\s+/);
			if (tokens.some((t) => t === 'sm' || t === 'small')) size = 'sm';
			if (tokens.some((t) => t === 'lg' || t === 'large')) size = 'lg';
			if (tokens.some((t) => ['left', 'center', 'right'].includes(t))) align = tokens.find((t) => ['left', 'center', 'right'].includes(t))!;
		} else if (parts.length === 3) {
			const [first, second, third] = parts;
			if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(second)) {
				text = first;
				url = second;
				if (third.includes('fa-')) iconClass = third;
				else imageSrc = third;
			} else {
				text = second;
				url = third;
				const tokens = first.toLowerCase().split(/\s+/);
				if (tokens.some((t) => t === 'sm' || t === 'small')) size = 'sm';
				if (tokens.some((t) => t === 'lg' || t === 'large')) size = 'lg';
			}
		} else if (parts.length === 2) {
			text = parts[0];
			url = parts[1];
		} else if (parts.length === 1) {
			text = parts[0];
		}
	}

	const normalizedSize = size === 'sm' || size === 'small' ? 'sm' : size === 'lg' || size === 'large' ? 'lg' : 'md';
	const normalizedAlign = ['left', 'center', 'right'].includes(align) ? align : 'inline';
	const className = cn(
		'not-markdown box-border inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl border border-rd-gray-alpha-400 bg-rd-gray-100 text-center no-underline hover:bg-rd-gray-200 focus:bg-rd-gray-200 active:bg-rd-gray-300',
		BUTTON_SIZE_CLASS[normalizedSize],
		BUTTON_ALIGN_CLASS[normalizedAlign],
		!url && 'cursor-not-allowed opacity-60',
	);
	const visualMarkup = iconClass
		? `<i class="${escapeHtml(iconClass)}" aria-hidden="true"></i>`
		: imageSrc
			? `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(text)}" class="not-markdown inline-block h-5 w-5 object-contain align-middle" data-image-viewer="ignore" loading="lazy">`
			: '';
	const content = visualMarkup ? `${visualMarkup} ${escapeHtml(text)}` : escapeHtml(text);
	const tagName = url ? 'a' : 'span';
	const attrs = cn(
		url ? `href="${escapeHtml(url)}"` : false,
		`title="${escapeHtml(title || text)}"`,
		target && `target="${escapeHtml(target)}"`,
		rel && `rel="${escapeHtml(rel)}"`,
		!url && 'role="button" aria-disabled="true"',
	);
	return `<${tagName} data-writing-button class="${className}" ${attrs}>${content}</${tagName}>`;
}

/* ---------------------------------------------------------- */
/* Callout ({% callout %}, {% note %}, {% noteL %}...)          */
/* ---------------------------------------------------------- */

const CALLOUT_VARIANTS = new Set([
	'default', 'gray', 'success', 'warning', 'yellow', 'danger', 'red',
	'primary', 'purple', 'question', 'orange', 'info', 'blue', 'green',
	'tip', 'pink',
]);

function extractIcon(tokens: string[]): { iconClass: string; remainingTokens: string[] } {
	let styleToken = '';
	let iconIndex = -1;
	tokens.forEach((token, index) => {
		if (['fa-solid', 'fa-regular', 'fa-light', 'fa-thin', 'fa-duotone', 'fa-brands', 'fa-sharp-solid', 'fa-sharp-regular', 'fa-sharp-light', 'fa-sharp-thin'].includes(token)) {
			if (!styleToken) styleToken = token;
			return;
		}
		if (token.startsWith('fa-') && iconIndex === -1) iconIndex = index;
	});
	if (iconIndex === -1) return { iconClass: '', remainingTokens: tokens };
	const iconClass = `${styleToken || 'fa-solid'} ${tokens[iconIndex]}`;
	const remainingTokens = tokens.filter((_, index) => index !== iconIndex && !(styleToken && tokens[index] === styleToken));
	return { iconClass, remainingTokens };
}

async function renderCallout(args: string[], body: Node[]): Promise<string> {
	const rawArgs = args.join(' ').trim();
	const parsed = parseTagArgs(args);
	const namedType = (parsed.named.type || '').trim();
	const namedTitle = (parsed.named.title || '').trim();
	const namedIcon = (parsed.named.icon || '').trim();
	const namedVariant = (parsed.named.variant || '').trim();

	let type = 'default';
	let iconClass = '';
	let title = '';
	let variant: 'titled' | 'simple' = 'simple';
	let extraClasses: string[] = [];

	if (namedType || namedTitle || namedIcon || namedVariant) {
		type = namedType || parsed.positional[0] || 'default';
		iconClass = namedIcon;
		title = namedTitle;
		variant = namedVariant === 'titled' || namedTitle ? 'titled' : namedVariant === 'simple' ? 'simple' : 'simple';
		if (!iconClass && variant === 'simple') {
			const extracted = extractIcon(parsed.positional.slice(1));
			iconClass = extracted.iconClass;
			extraClasses = extracted.remainingTokens;
		}
	} else if (rawArgs.includes('::')) {
		const [left, right] = rawArgs.split('::').map((p) => p.trim());
		const tokens = left.split(/\s+/).filter(Boolean);
		type = tokens[0] || 'default';
		const extracted = extractIcon(tokens.slice(1));
		iconClass = extracted.iconClass;
		extraClasses = extracted.remainingTokens;
		title = right;
		variant = 'titled';
	} else {
		const tokens = rawArgs.split(/\s+/).filter(Boolean);
		type = tokens[0] || 'default';
		const extracted = extractIcon(tokens.slice(1));
		iconClass = extracted.iconClass;
		extraClasses = extracted.remainingTokens;
		variant = 'simple';
	}

	const normalizedType = CALLOUT_VARIANTS.has(type) ? type : 'default';
	const iconMarkup = iconClass ? `<i class="${escapeHtml(iconClass)} shrink-0 text-sm leading-none text-(--callout-primary-color)" aria-hidden="true"></i>` : '';
	const content = await renderMarkdownBody(body);

	if (variant === 'titled') {
		return `<aside class="${cn('callout', extraClasses.join(' '), 'relative mb-4 flex flex-row gap-2 rounded-xl border border-rd-gray-alpha-400 bg-(--callout-bg-color) p-3 pl-1')}" data-kind="titled" data-variant="${normalizedType}" role="note">
  <div aria-hidden="true" class="w-0.5 shrink-0 self-stretch rounded-full bg-(--callout-primary-color) opacity-60"></div>
  <div class="flex min-w-0 flex-1 flex-col gap-2">
    <div class="flex items-center gap-2 font-semibold tracking-tight">${iconMarkup} ${escapeHtml(title || 'Note')}</div>
    <div class="markdown-body min-w-0 flex-1">${content}</div>
  </div>
</aside>`;
	}

	return `<aside class="${cn('callout', extraClasses.join(' '), 'relative mb-4 flex flex-row items-center gap-2 rounded-xl border border-rd-gray-alpha-400 bg-(--callout-bg-color) p-3 pl-1')}" data-kind="simple" data-variant="${normalizedType}" role="note">
  <div aria-hidden="true" class="w-0.5 shrink-0 self-stretch rounded-full bg-(--callout-primary-color) opacity-60"></div>
  ${iconMarkup}
  <div class="markdown-body min-w-0 flex-1">${content}</div>
</aside>`;
}

/* ---------------------------------------------------------- */
/* Folding ({% folding %})                                      */
/* ---------------------------------------------------------- */

const FOLDING_VARIANTS = new Set(['default', 'yellow', 'blue', 'green', 'red', 'orange', 'pink', 'cyan', 'white', 'black', 'gray', 'purple']);

async function renderFolding(args: string[], body: Node[]): Promise<string> {
	const rawArgs = args.join(' ').trim();
	const parsed = parseTagArgs(args);
	const hasNamed = ['title', 'class', 'classes', 'style', 'open'].some((k) => parsed.named[k] != null);

	let title = '';
	let classNames: string[] = [];
	let open = false;

	if (hasNamed) {
		title = (parsed.named.title || '').trim() || parsed.positional.join(' ').trim();
		classNames = [parsed.named.class, parsed.named.classes, parsed.named.style]
			.filter(Boolean)
			.flatMap((value) => (value as string).split(/\s+/))
			.filter(Boolean);
		open = ['1', 'true', 'yes', 'on'].includes((parsed.named.open || '').toLowerCase());
	} else {
		const delimiter = rawArgs.includes('::') ? '::' : ',';
		const parts = rawArgs.split(delimiter).map((p) => p.trim()).filter(Boolean);
		if (parts.length === 1) {
			// 单参数即标题：{% folding 标题 %}
			title = parts[0];
			classNames = [];
		} else {
			classNames = (parts[0] || '').split(/\s+/).filter(Boolean);
			title = parts[1] || '';
		}
	}

	const variant = classNames.find((cls) => FOLDING_VARIANTS.has(cls)) || 'default';
	const customClass = classNames.filter((cls) => !FOLDING_VARIANTS.has(cls)).join(' ');

	let content = await renderMarkdownBody(body);
	content = content.replace(/<(h[1-6])>/g, (_, tag) => `<p class="${tag}">`).replace(/<\/(h[1-6])>/g, () => '</p>');

	return `<details class="folding group relative my-4 rounded-xl border border-rd-gray-alpha-400 bg-rd-gray-100 ${customClass}" data-variant="${variant}"${open ? ' open' : ''} data-header-exclude>
  <summary class="not-markdown flex cursor-pointer items-center rounded-[calc(0.75rem-1px)] px-4 py-3 group-open:rounded-b-none"><span>${escapeHtml(title)}</span><i class="fa-solid fa-chevron-right ml-auto pt-[3px] transition-transform duration-200 group-open:rotate-90" aria-hidden="true"></i></summary>
  <div class="markdown-body min-w-0 p-4">${content}</div>
</details>`;
}

/* ---------------------------------------------------------- */
/* Grid ({% grid %}, {% btns %}, {% buttons %})                  */
/* ---------------------------------------------------------- */

async function renderGrid(args: string[], body: Node[]): Promise<string> {
	const parsed = parseTagArgs(args);
	const hasNamed = ['cols', 'columns', 'gap', 'class', 'classes'].some((k) => parsed.named[k] != null);

	let cols = 2;
	let gap = '16px';
	let classNames: string[] = [];

	if (hasNamed) {
		cols = Number(parsed.named.cols ?? parsed.named.columns ?? parsed.positional[0] ?? 2);
		gap = (parsed.named.gap || parsed.positional[1] || '16px').trim();
		classNames = [parsed.named.class, parsed.named.classes].filter(Boolean).flatMap((v) => (v as string).split(/\s+/)).filter(Boolean);
	} else {
		const positional = args.map((a) => a.trim()).filter(Boolean);
		if (Number.isFinite(Number(positional[0]))) {
			cols = Number(positional[0]);
			classNames = positional.slice(1);
		} else {
			classNames = positional;
		}
		if (classNames.length && /^-?\d+(\.\d+)?(px|rem|em|%|vw|vh)?$/.test(classNames[0])) {
			gap = /^-?\d+(\.\d+)?$/.test(classNames[0]) ? `${classNames[0]}px` : classNames[0];
			classNames = classNames.slice(1);
		}
	}

	if (!Number.isFinite(cols)) cols = 2;
	cols = Math.min(6, Math.max(2, Math.floor(cols)));
	if (!gap) gap = '16px';

	const content = (await renderMarkdownBody(body)).replace(/>[ \t]*\n[ \t]*</g, '><').trim();

	return `<div class="${cn('grid my-4', classNames.join(' '))}" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: ${escapeHtml(gap)};">${content}</div>`;
}

/* ---------------------------------------------------------- */
/* Tabs ({% tabs %}, {% subtabs %}, {% subsubtabs %})            */
/* ---------------------------------------------------------- */

let tabGroupSeed = 0;

const TAB_START_REGEX = /^[\t ]*<!--\s*tab\b([^\r\n]*?)-->\s*$/;

function splitTabBlocks(body: Node[]): { headerRaw: string; nodes: Node[]; index: number }[] {
	const blocks: { headerRaw: string; nodes: Node[]; index: number }[] = [];
	let current: { headerRaw: string; nodes: Node[]; index: number } | null = null;
	body.forEach((node) => {
		if (node.type === 'html' && TAB_START_REGEX.test(node.value || '')) {
			current = {
				headerRaw: (node.value || '').match(TAB_START_REGEX)![1].trim(),
				nodes: [],
				index: blocks.length + 1,
			};
			blocks.push(current);
			return;
		}
		if (current) {
			current.nodes.push(node);
		} else if (blocks.length === 0) {
			blocks.push({ headerRaw: '', nodes: [node], index: 1 });
		} else {
			blocks[blocks.length - 1].nodes.push(node);
		}
	});
	return blocks;
}

async function renderTabs(args: string[], body: Node[], tagName: string): Promise<string> {
	tabGroupSeed += 1;
	const rawArgs = args.join(' ').trim();
	const parsed = parseTagArgs(args);
	let tabName = '';
	let activeTabIndex = 0;

	const namedTabName = (parsed.named.name || parsed.named.id || '').trim();
	const namedActive = Number(parsed.named.active ?? Number.NaN);
	if (namedTabName || Number.isFinite(namedActive)) {
		tabName = namedTabName || parsed.positional[0] || '';
		activeTabIndex = Number.isFinite(namedActive) ? namedActive : Number(parsed.positional[1]) || 0;
	} else if (rawArgs) {
		if (!rawArgs.includes('::') && !rawArgs.includes(',') && Number.isFinite(Number(rawArgs))) {
			activeTabIndex = Number(rawArgs);
		} else {
			const delimiter = rawArgs.includes('::') ? '::' : ',';
			const [name = '', active = ''] = rawArgs.split(delimiter).map((p) => p.trim());
			tabName = name;
			activeTabIndex = Number(active) || 0;
		}
	}

	const normalizedName = tabName
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^[-_]+|[-_]+$/g, '') || `${tagName}-${tabGroupSeed}`;
	const groupId = `tab-${normalizedName}-${tabGroupSeed}`;

	const blocks = splitTabBlocks(body);
	const hasExplicitActive = activeTabIndex > 0 && activeTabIndex <= blocks.length;
	const resolvedActiveIndex = hasExplicitActive ? activeTabIndex : 1;

	let tabNav = '';
	let tabContent = '';
	for (const block of blocks) {
		const [caption = '', icon = ''] = block.headerRaw.split('@').map((p) => p.trim());
		const tabId = `${groupId}-tab-${block.index}`;
		const panelId = `${groupId}-panel-${block.index}`;
		const content = await renderMarkdownBody(block.nodes);
		const active = block.index === resolvedActiveIndex;
		const iconMarkup = icon ? `<i class="${escapeHtml(icon.includes('fa-') ? icon : `fa-solid fa-${icon}`)} mr-1" aria-hidden="true"></i>` : '';

		tabNav += `<button id="${tabId}" type="button" role="tab" aria-controls="${panelId}" aria-selected="${active}" class="inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent py-2 text-sm font-medium text-rd-gray-900 transition-colors hover:text-rd-gray-1000 aria-selected:border-primary aria-selected:text-primary" tabindex="${active ? '0' : '-1'}">${iconMarkup}${escapeHtml(caption)}</button>`;
		tabContent += `<div id="${panelId}" role="tabpanel" aria-labelledby="${tabId}" class="markdown-body min-w-0"${active ? '' : ' hidden'}>${content}</div>`;
	}

	return `<div id="${groupId}" data-tabs class="tabs relative my-4 rounded-xl border border-rd-gray-alpha-400 bg-rd-gray-100 overflow-hidden"><div role="tablist" aria-orientation="horizontal" class="not-markdown scrollbar-hide flex gap-3.5 overflow-x-auto px-4">${tabNav}</div><div class="rounded-lg bg-rd-background-100/70 shadow-sm p-4">${tabContent}</div></div>`;
}

/* ---------------------------------------------------------- */
/* Main plugin                                                  */
/* ---------------------------------------------------------- */

const BLOCK_TAGS: Record<string, (args: string[], body: Node[]) => string | Promise<string>> = {
	callout: renderCallout,
	note: (args, body) => renderCallout(args, body),
	notes: (args, body) => renderCallout(args, body),
	subnote: (args, body) => renderCallout(args, body),
	notel: (args, body) => renderCallout([...args, '::'], body),
	'notel-large': (args, body) => renderCallout([...args, '::'], body),
	noteL: (args, body) => renderCallout([...args, '::'], body),
	folding: renderFolding,
	grid: renderGrid,
	btns: renderGrid,
	buttons: renderGrid,
};

const INLINE_TAGS = new Set(['button', 'btn', 'cell', 'audio', 'bilibili']);

const OPEN_TAG_REGEX = /^\{%\s*(?!end[\w-])([\w-]+)([^%]*?)%\}$/;
const END_TAG_REGEX = /^\{%\s*end([\w-]+)\s*%\}$/;
const INLINE_TAG_REGEX = /\{%\s*(button|btn|cell|audio|bilibili)\s+([^%]*?)%\}/g;

/* ---------------------------------------------------------- */
/* Bilibili embed ({% bilibili BVxxx [page] %})                 */
/* ---------------------------------------------------------- */

function renderBilibili(args: string[]): string {
	const parsed = parseTagArgs(args);
	const source = (parsed.named.bvid || parsed.named.url || parsed.positional[0] || '').trim();
	if (!source) return '';
	let bvid = source;
	const bvMatch = source.match(/BV[0-9A-Za-z]+/);
	if (bvMatch) bvid = bvMatch[0];
	const pageRaw = parsed.named.p || parsed.positional[1] || '1';
	const page = Number(pageRaw) > 0 ? String(Number(pageRaw)) : '1';
	return `<div class="bilibili-player"><iframe src="https://player.bilibili.com/player.html?isOutside=true&bvid=${escapeHtml(bvid)}&p=${escapeHtml(page)}&autoplay=0&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" loading="lazy"></iframe></div>`;
}

/* ---------------------------------------------------------- */
/* Inline MetingJS player ({% audio ... %})                     */
/*   {% audio https://music.163.com/song?id=xxx %}              */
/*   {% audio 歌名, 歌曲ID, 平台 %}                              */
/*   {% audio name="..." id="..." server="netease" %}           */
/* ---------------------------------------------------------- */

function renderAudio(args: string[]): string {
	const raw = args
		.join(' ')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.trim();
	if (!raw) return '';

	const attrs: string[] = [];

	const looksLikeLink = /^(?:https?:\/\/)?(?:music\.163\.com|y\.qq\.com|xiami\.com|kugou\.com|kuwo\.cn)/i.test(raw);
	if (looksLikeLink) {
		attrs.push(`auto="${escapeHtml(raw)}"`);
	} else {
		const named: Record<string, string> = {};
		const namedRegex = /(name|artist|url|cover|id|server|type|auto)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s,]+))/g;
		let match: RegExpExecArray | null;
		while ((match = namedRegex.exec(raw)) !== null) {
			named[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
		}

		if (Object.keys(named).length > 0) {
			if (named.auto) attrs.push(`auto="${escapeHtml(named.auto)}"`);
			if (named.id) attrs.push(`id="${escapeHtml(named.id)}"`);
			if (named.server) attrs.push(`server="${escapeHtml(named.server)}"`);
			if (named.type) attrs.push(`type="${escapeHtml(named.type)}"`);
			if (named.name) attrs.push(`name="${escapeHtml(named.name)}"`);
			if (named.artist) attrs.push(`artist="${escapeHtml(named.artist)}"`);
			if (named.url) attrs.push(`url="${escapeHtml(named.url)}"`);
			if (named.cover) attrs.push(`cover="${escapeHtml(named.cover)}"`);
		} else {
			const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
			const first = parts[0] || '';
			if (first) attrs.push(`name="${escapeHtml(first)}"`);
			if (parts[1]) attrs.push(`id="${escapeHtml(parts[1])}"`);
			if (parts[2]) attrs.push(`server="${escapeHtml(parts[2])}"`);
		}
	}

	const hasSource = attrs.some((a) => a.startsWith('auto=') || a.startsWith('id=') || a.startsWith('url='));
	if (!hasSource) return '';
	const hasServer = attrs.some((a) => a.startsWith('server='));
	const serverAttr = hasServer ? '' : ' server="netease"';
	const hasType = attrs.some((a) => a.startsWith('type='));
	const typeAttr = hasType ? '' : ' type="song"';

	return `<div class="aplayer-inline my-4"><meting-js${serverAttr}${typeAttr} mutex="true" preload="none" theme="var(--primary-color)" order="list" ${attrs.join(' ')}></meting-js></div>`;
}

function renderInlineTag(tagName: string, args: string[]): string {
	if (tagName === 'bilibili') return renderBilibili(args);
	if (tagName === 'audio') return renderAudio(args);
	return renderButton(args);
}

function nodeText(node: Node): string {
	if (node.type === 'text' || node.type === 'html') return node.value || '';
	if (node.type === 'inlineCode') return '`' + (node.value ?? '') + '`';
	if (node.type === 'break') return '\n';
	if (node.type === 'image') return String(node.alt ?? '');
	if (node.children) {
		return node.children.map(nodeText).join('');
	}
	return '';
}

/** Serializes an inline node back to its markdown source (preserves formatting markers). */
function nodeToMarkdown(node: Node): string {
	if (node.type === 'text' || node.type === 'html') return node.value || '';
	if (node.type === 'inlineCode') return '`' + (node.value ?? '') + '`';
	if (node.type === 'break') return '\n';
	if (node.type === 'image') return '![' + String(node.alt ?? '') + '](' + String(node.url ?? '') + ')';
	if (node.type === 'link') {
		const text = (node.children ?? []).map(nodeToMarkdown).join('');
		const url = String(node.url ?? '');
		// GFM literal autolink: emit the bare URL so tag arguments stay intact.
		return text === url ? url : '[' + text + '](' + url + ')';
	}
	if (node.type === 'emphasis') return '*' + (node.children ?? []).map(nodeToMarkdown).join('') + '*';
	if (node.type === 'strong') return '**' + (node.children ?? []).map(nodeToMarkdown).join('') + '**';
	if (node.type === 'delete') return '~~' + (node.children ?? []).map(nodeToMarkdown).join('') + '~~';
	if (node.children) return node.children.map(nodeToMarkdown).join('');
	return '';
}

/** Reconstructs the raw-ish text of a paragraph, tolerating autolinks etc. */
function paragraphText(node: Node): string | null {
	if (node.type !== 'paragraph') return null;
	if (!node.children || node.children.length === 0) return null;
	return node.children.map(nodeText).join('');
}

function processInlineTags(node: Node) {
	if (!node.children) return;
	const next: Node[] = [];
	node.children.forEach((child) => {
		if (child.type !== 'text' || !child.value || !child.value.includes('{%')) {
			// Recurse into emphasis/link/etc. so tags inside bold or links still render.
			if (child.children) processInlineTags(child);
			next.push(child);
			return;
		}
		const text = child.value;
		const segments: Node[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		INLINE_TAG_REGEX.lastIndex = 0;
		while ((match = INLINE_TAG_REGEX.exec(text)) !== null) {
			if (match.index > lastIndex) {
				segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
			}
			segments.push({ type: 'html', value: renderInlineTag(match[1], [match[2]]) });
			lastIndex = INLINE_TAG_REGEX.lastIndex;
		}
		if (lastIndex < text.length) {
			segments.push({ type: 'text', value: text.slice(lastIndex) });
		}
		next.push(...segments);
	});
	node.children = next;
}

const getBlockRenderer = (tagName: string): ((args: string[], body: Node[]) => string | Promise<string>) | null => {
	if (tagName === 'tabs' || tagName === 'subtabs' || tagName === 'subsubtabs') {
		return (a, b) => renderTabs(a, b, tagName);
	}
	return BLOCK_TAGS[tagName] ?? null;
};

/** Handles opening tag + body + end tag inside ONE paragraph, keeping inner mdast nodes intact. */
async function processSameParagraphTag(parent: Node, index: number, paragraph: Node): Promise<boolean> {
	const children = paragraph.children ?? [];
	const first = children[0];
	const last = children[children.length - 1];
	if (!first || !last || first.type !== 'text' || last.type !== 'text') return false;

	const firstValue = first.value || '';
	const openMatch = firstValue.match(/^\{%\s*([\w-]+)([^%]*?)%\}([\s\S]*)$/);
	if (!openMatch) return false;

	let head = openMatch[3] || '';
	let tail = '';
	let middle = children.slice(1, -1);

	if (first === last) {
		// The end tag lives inside the same text node as the open tag.
		const innerEnd = head.match(/([\s\S]*?)\{%\s*end([\w-]+)\s*%\}\s*$/);
		if (!innerEnd || innerEnd[2] !== openMatch[1]) return false;
		head = innerEnd[1];
		tail = '';
		middle = [];
	} else {
		const lastValue = last.value || '';
		const endMatch = lastValue.match(/([\s\S]*?)\{%\s*end([\w-]+)\s*%\}\s*$/);
		if (!endMatch || endMatch[2] !== openMatch[1]) return false;
		tail = endMatch[1];
	}

	const renderer = getBlockRenderer(openMatch[1]);
	if (!renderer) return false;

	const args = openMatch[2].trim() ? [openMatch[2].trim()] : [];
	const bodyNodes: Node[] = [];
	if (head.includes('{%')) {
		bodyNodes.push(...parseMarkdown(head));
	} else if (head) {
		bodyNodes.push({ type: 'text', value: head });
	}
	bodyNodes.push(...middle);
	if (tail.includes('{%')) {
		bodyNodes.push(...parseMarkdown(tail));
	} else if (tail) {
		bodyNodes.push({ type: 'text', value: tail });
	}

	parent.children![index] = { type: 'html', value: await renderer(args, bodyNodes) };
	return true;
}

/** Extracts mdast body nodes from a closing paragraph that contains trailing content. */
function closingParagraphBody(paragraph: Node, tagName: string): Node[] | null {
	const children = paragraph.children ?? [];
	const last = children[children.length - 1];
	if (!last || last.type !== 'text') return null;
	const endMatch = (last.value || '').match(/([\s\S]*?)\{%\s*end([\w-]+)\s*%\}\s*$/);
	if (!endMatch || endMatch[2] !== tagName) return null;
	if (!endMatch[1] && children.length === 1) return null;
	const fragments: Node[] = [];
	if (children.length > 1) fragments.push(...children.slice(0, -1));
	if (endMatch[1]) fragments.push({ type: 'text', value: endMatch[1] });
	// Wrap fragments in a paragraph so tag reconstruction works downstream.
	return [{ type: 'paragraph', children: fragments }];
}

/** Scans sibling paragraphs for the matching end tag, honoring nesting depth. */
function scanBlockEnd(children: Node[], startIndex: number, tagName: string, bodyNodes: Node[], initialDepth = 1): number | null {
	let j = startIndex;
	let depth = initialDepth;
	while (j < children.length) {
		const candidate = children[j];
		const candidateText = paragraphText(candidate);
		if (candidateText !== null && candidateText !== undefined) {
			const candTrimmed = candidateText.trim();
			const endMatch = candTrimmed.match(END_TAG_REGEX);
			const nestedOpen = candTrimmed.match(OPEN_TAG_REGEX);
			if (endMatch && (!nestedOpen || nestedOpen.index! > endMatch.index!)) {
				if (endMatch[1] === tagName) {
					depth -= 1;
					if (depth === 0) {
						return j;
					}
					// Inner close: belongs to a nested block, keep it in the body.
					bodyNodes.push(candidate);
					j += 1;
					continue;
				}
				// Mismatched end tag: keep consuming.
			} else if (nestedOpen && nestedOpen[1] === tagName) {
				depth += 1;
			}
			const closingBody = closingParagraphBody(candidate, tagName);
			if (closingBody) {
				depth -= 1;
				bodyNodes.push(...closingBody);
				if (depth === 0) {
					return j;
				}
				j += 1;
				continue;
			}
		}
		bodyNodes.push(candidate);
		j += 1;
	}
	return null;
}

/** Counts unclosed same-name tags inside the remainder of an opening paragraph. */
function nestedDepthOffset(tagName: string, text: string): number {
	let depth = 0;
	const openRegex = new RegExp(`\\{%\\s*${tagName}(?:[\\s%])`, 'g');
	const closeRegex = new RegExp(`\\{%\\s*end${tagName}(?:[\\s%])`, 'g');
	depth += (text.match(openRegex) || []).length;
	depth -= (text.match(closeRegex) || []).length;
	return depth;
}

/** Replaces a whole paragraph with rendered content when it is (or contains) tags. */
async function processTagParagraph(parent: Node, index: number, text: string): Promise<'block' | 'inline' | 'none'> {
	const trimmed = text.trim();
	const paragraph = parent.children![index];
	const children = parent.children!;

	// Case B: opening tag + body + end tag all inside one paragraph
	if (await processSameParagraphTag(parent, index, paragraph)) {
		return 'block';
	}

	const argsFor = (rawArgs: string) => (rawArgs.trim() ? [rawArgs.trim()] : []);
	const tryRenderBlock = async (tagName: string, args: string[], bodyNodes: Node[]): Promise<string | null> => {
		const renderer = getBlockRenderer(tagName);
		return renderer ? await renderer(args, bodyNodes) : null;
	};

	// Case D: paragraph starts with an opening tag followed by content
	const firstChild = paragraph.children?.[0];
	if (firstChild && firstChild.type === 'text') {
		const startMatch = (firstChild.value || '').match(/^\{%\s*(?!end[\w-])([\w-]+)([^%]*?)%\}([\s\S]*)$/);
		if (startMatch) {
			const openTagLength = startMatch[0].indexOf('%}') + 2;
			const remainderText = text.slice(openTagLength);
			const bodyNodes: Node[] = [...parseMarkdown(remainderText)];
			const depthBump = nestedDepthOffset(startMatch[1], remainderText);
			const childrenForScan = children;
			// Temporarily account for nested opens inside the remainder paragraph.
			const endIndex = scanBlockEnd(childrenForScan, index + 1, startMatch[1], bodyNodes, 1 + depthBump);
			if (endIndex !== null) {
				const html = await tryRenderBlock(startMatch[1], argsFor(startMatch[2]), bodyNodes);
				if (html) {
					children.splice(index, endIndex - index + 1, { type: 'html', value: html });
					return 'block';
				}
			}
		}
	}

	// Case A: paragraph is exactly an opening tag
	const openMatch = trimmed.match(OPEN_TAG_REGEX);
	if (openMatch) {
		const tagName = openMatch[1];
		const bodyNodes: Node[] = [];
		const endIndex = scanBlockEnd(children, index + 1, tagName, bodyNodes);
		if (endIndex !== null) {
			const html = await tryRenderBlock(tagName, argsFor(openMatch[2]), bodyNodes);
			if (html) {
				children.splice(index, endIndex - index + 1, { type: 'html', value: html });
				return 'block';
			}
		}
		// Not a block tag — fall through to inline handling.
	}

	// Case C: inline tags inside the paragraph
	INLINE_TAG_REGEX.lastIndex = 0;
	if (INLINE_TAG_REGEX.test(text)) {
		// When the paragraph contains structured inline nodes (emphasis, links,
		// inline code, ...), flattening via paragraphText would destroy their
		// Markdown markup. Replace tags inside text nodes only and keep the rest
		// of the node tree intact.
		const hasStructuredChildren = (paragraph.children ?? []).some(
			(child) => child.type !== 'text' && child.type !== 'html',
		);
		if (hasStructuredChildren) {
			// GFM 自动链接会把标签参数里的 URL 拆成独立 link 节点（例如
			// {% audio https://... %}），此时标签跨多个节点、无法按文本节点
			// 逐一匹配。检测到跨节点标签时回退到 flatten 渲染，保证内容不丢。
			const hasSplitTag = (paragraph.children ?? []).some((child) => {
				if (child.type !== 'text') return false;
				const value = String(child.value ?? '');
				const open = value.indexOf('{%');
				return open !== -1 && !value.slice(open).includes('%}');
			});
			if (!hasSplitTag) {
				processInlineTags(paragraph);
				return 'inline';
			}
			// 标签跨节点（GFM 自动链接拆散了参数里的 URL）：把段落序列化回
			// markdown 源码再渲染，保住周围的粗体/行内代码/链接等格式。
			const reconstructed = (paragraph.children ?? []).map(nodeToMarkdown).join('');
			const markdownSegments: string[] = [];
			let markdownLastIndex = 0;
			let markdownMatch: RegExpExecArray | null;
			INLINE_TAG_REGEX.lastIndex = 0;
			while ((markdownMatch = INLINE_TAG_REGEX.exec(reconstructed)) !== null) {
				if (markdownMatch.index > markdownLastIndex) {
					markdownSegments.push(reconstructed.slice(markdownLastIndex, markdownMatch.index));
				}
				markdownSegments.push(renderInlineTag(markdownMatch[1], [markdownMatch[2]]));
				markdownLastIndex = INLINE_TAG_REGEX.lastIndex;
			}
			if (markdownLastIndex < reconstructed.length) {
				markdownSegments.push(reconstructed.slice(markdownLastIndex));
			}
			const reconstructedHtml = await renderMarkdownString(markdownSegments.join(''));
			parent.children![index] = { type: 'html', value: reconstructedHtml };
			return 'inline';
		}
		const segments: string[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		INLINE_TAG_REGEX.lastIndex = 0;
		while ((match = INLINE_TAG_REGEX.exec(text)) !== null) {
			if (match.index > lastIndex) segments.push(text.slice(lastIndex, match.index));
			segments.push(renderInlineTag(match[1], [match[2]]));
			lastIndex = INLINE_TAG_REGEX.lastIndex;
		}
		if (lastIndex < text.length) segments.push(text.slice(lastIndex));
		const rendered = await renderMarkdownString(segments.join(''));
		parent.children![index] = { type: 'html', value: rendered };
		return 'inline';
	}
	return 'none';
}

export function remarkRedefineTags() {
	return async (tree: Node) => {
		const queue: Node[] = [tree];
		while (queue.length > 0) {
			const parent = queue.pop()!;
			const children = parent.children;
			if (!children) continue;

			let i = 0;
			while (i < children.length) {
				const child = children[i];
				if (!child) break;

				const text = paragraphText(child);
				if (text !== null && text.includes('{%')) {
					const result = await processTagParagraph(parent, i, text);
					if (result === 'block' || result === 'inline') {
						continue;
					}
				}

				processInlineTags(child);
				queue.push(child);
				i += 1;
			}
		}
	};
}

// Register the transformer for nested tag rendering (mini markdown pipeline).
setTagTransformer(remarkRedefineTags());
