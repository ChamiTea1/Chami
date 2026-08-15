import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const POSTS_PER_PAGE = 10;

type Cover = ImageMetadata | string | false;

/** Resolves the cover image (thumbnail > cover > banner > heroImage). */
export function normalizePostCover(data: Post['data']): Cover {
	if (data.thumbnail === false) return false;
	if (typeof data.thumbnail === 'object' && 'src' in data.thumbnail) return data.thumbnail as ImageMetadata;
	if (typeof data.thumbnail === 'string' && data.thumbnail) return data.thumbnail;
	for (const field of [data.cover, data.banner, data.heroImage]) {
		if (field) {
			if (typeof field === 'string') return field;
			if (typeof field === 'object' && 'src' in field) return field as ImageMetadata;
		}
	}
	return false;
}

export function sortPosts(posts: Post[]): Post[] {
	return [...posts].sort((a, b) => {
		const aSticky = a.data.sticky ? 1 : 0;
		const bSticky = b.data.sticky ? 1 : 0;
		if (aSticky !== bSticky) return bSticky - aSticky;
		const diff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
		return diff || a.data.title.localeCompare(b.data.title);
	});
}

export interface TagInfo {
	name: string;
	slug: string;
	count: number;
	posts: Post[];
}

export function getTags(posts: Post[]): TagInfo[] {
	const map = new Map<string, TagInfo>();
	posts.forEach((post) => {
		const tags = normalizeList(post.data.tags ?? post.data.tag);
		tags.forEach((tag) => {
			const slug = tag.toLowerCase();
			if (!map.has(slug)) {
				map.set(slug, { name: tag, slug, count: 0, posts: [] });
			}
			const info = map.get(slug)!;
			info.count += 1;
			info.posts.push(post);
		});
	});
	return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export interface CategoryNode {
	name: string;
	path: string;
	count: number;
	posts: Post[];
	children: CategoryNode[];
}

export function getCategories(posts: Post[]): CategoryNode[] {
	const roots: CategoryNode[] = [];

	const findOrCreate = (nodes: CategoryNode[], name: string, path: string): CategoryNode => {
		let node = nodes.find((n) => n.name === name);
		if (!node) {
			node = { name, path, count: 0, posts: [], children: [] };
			nodes.push(node);
		}
		return node;
	};

	posts.forEach((post) => {
		const cats = normalizeList(post.data.categories ?? post.data.category);
		const segments: string[] = [];
		cats.forEach((cat) => {
			cat.split('/').forEach((segment) => {
				const trimmed = segment.trim();
				if (trimmed) segments.push(trimmed);
			});
		});
		let level = roots;
		let accPath = '';
		const visited = new Set<string>();
		segments.forEach((segment) => {
			accPath = accPath ? `${accPath}/${segment}` : segment;
			const node = findOrCreate(level, segment, accPath);
			if (!visited.has(node.path)) {
				node.count += 1;
				node.posts.push(post);
				visited.add(node.path);
			}
			level = node.children;
		});
	});

	const sortTree = (nodes: CategoryNode[]) => {
		nodes.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
		nodes.forEach((node) => sortTree(node.children));
	};
	sortTree(roots);
	return roots;
}

export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
	const result: CategoryNode[] = [];
	const walk = (list: CategoryNode[]) => {
		list.forEach((node) => {
			result.push(node);
			walk(node.children);
		});
	};
	walk(nodes);
	return result;
}

function normalizeList(value: string | string[] | undefined): string[] {
	if (!value) return [];
	const list = Array.isArray(value) ? value : [value];
	return list.filter(Boolean).map((item) => item.trim());
}

/** Rough plain-text excerpt: prefers frontmatter description, falls back to body. */
export function getExcerpt(post: Post, length = 200): string {
	const description = typeof post.data.description === 'string' ? post.data.description.trim() : '';
	const text = stripMarkdown(description || post.body || '');
	if (text.length <= length) return text;
	return `${text.slice(0, length).trimEnd()}…`;
}

export function stripMarkdown(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/~~~[\s\S]*?~~~/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/\{%[\s\S]*?%\}/g, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/^>\s?/gm, '')
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/^\s*\d+\.\s+/gm, '')
		.replace(/\*\*([^*]*)\*\*/g, '$1')
		.replace(/\*([^*]*)\*/g, '$1')
		.replace(/~~([^~]*)~~/g, '$1')
		.replace(/\|/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Word count (Chinese characters + English words), reading time in minutes. */
export function getWordCount(text: string): { words: number; minutes: number } {
	const plain = stripMarkdown(text);
	const cjk = plain.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)?.length ?? 0;
	const latin = plain.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').match(/[a-zA-Z0-9]+/g)?.length ?? 0;
	const words = cjk + latin;
	const minutes = Math.max(1, Math.round(cjk / 300 + latin / 160));
	return { words, minutes };
}
