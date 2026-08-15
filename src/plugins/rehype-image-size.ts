/**
 * Reads local image dimensions (public/images) at build time and writes
 * width/height attributes on <img> tags to prevent layout shift (CLS).
 */

import path from 'node:path';
import { stat } from 'node:fs/promises';
import sharp from 'sharp';

type ImageSize = { width: number; height: number };

const sizeCache = new Map<string, ImageSize | null>();

/** Resolves a /images/... src to a local file and reads its dimensions. */
export async function getLocalImageSize(src: string): Promise<ImageSize | null> {
	if (!src.startsWith('/images/')) return null;
	let relative: string;
	try {
		relative = decodeURIComponent(src.slice('/images/'.length)).replace(/\\/g, '/');
	} catch {
		return null;
	}
	if (!relative || relative.includes('..') || relative.startsWith('/')) return null;

	const filePath = path.join(process.cwd(), 'public', 'images', relative);
	try {
		const { mtimeMs, size } = await stat(filePath);
		const cacheKey = `${filePath}:${mtimeMs}:${size}`;
		if (sizeCache.has(cacheKey)) return sizeCache.get(cacheKey)!;
		const metadata = await sharp(filePath).metadata();
		const result: ImageSize | null =
			metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : null;
		sizeCache.set(cacheKey, result);
		return result;
	} catch {
		return null;
	}
}

type Node = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
	[prop: string]: unknown;
};

function walk(tree: Node, visitor: (node: Node) => void | Promise<void>) {
	const queue: Node[] = [tree];
	while (queue.length > 0) {
		const parent = queue.pop()!;
		const children = parent.children;
		if (!children) continue;
		for (const node of children) {
			visitor(node);
			if (node.children) queue.push(node);
		}
	}
}

/** Adds width/height to images whose src is a local /images/ path. */
export function rehypeImageSize() {
	return async (tree: Node) => {
		const tasks: Promise<void>[] = [];
		walk(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'img') return;
			const props = node.properties ?? {};
			if (props.width !== undefined || props.height !== undefined) return;
			const src = String(props.dataLazySrc ?? props.src ?? '');
			if (!src) return;
			tasks.push(
				getLocalImageSize(src).then((size) => {
					if (size) {
						node.properties = { ...node.properties, width: String(size.width), height: String(size.height) };
					}
				}),
			);
		});
		await Promise.all(tasks);
	};
}
