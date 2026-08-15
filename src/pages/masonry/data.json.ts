import masonryData from '../../data/masonry.json';

interface MasonryItem {
	image?: string;
	url?: string;
	src?: string;
	title?: string;
	description?: string;
	width?: number;
	height?: number;
	w?: number;
	h?: number;
	exif?: boolean;
}

interface MasonryAlbum {
	name?: string;
	slug?: string;
	cover?: string;
	description?: string;
	items?: MasonryItem[];
}

const albums = masonryData as MasonryAlbum[];

const toPositiveInt = (value: unknown): number | null => {
	const parsed = Number.parseInt(String(value), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalize = (entry: MasonryItem | null | undefined): Record<string, unknown> | null => {
	if (!entry || typeof entry !== 'object') return null;
	const image = entry.image || entry.url || entry.src;
	if (!image) return null;
	const width = toPositiveInt(entry.width ?? entry.w);
	const height = toPositiveInt(entry.height ?? entry.h);
	const item: Record<string, unknown> = {
		image,
		title: entry.title || '',
		description: entry.description || '',
		exif: entry.exif === true,
	};
	if (width && height) {
		item.width = width;
		item.height = height;
	}
	return item;
};

export function GET() {
	// 兼容旧端点：把所有子相册的照片拍平输出（新相册页走内联数据，不再请求此端点）
	const items = Array.isArray(albums) ? albums.flatMap((album) => (album.items ?? []).map(normalize).filter(Boolean)) : [];

	return new Response(JSON.stringify(items), {
		headers: { 'Content-Type': 'application/json' },
	});
}
