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

const items = masonryData as MasonryItem[];

const toPositiveInt = (value: unknown): number | null => {
	const parsed = Number.parseInt(String(value), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function GET() {
	const normalized = Array.isArray(items)
		? items
				.map((entry) => {
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
				})
				.filter(Boolean)
		: [];

	return new Response(JSON.stringify(normalized), {
		headers: { 'Content-Type': 'application/json' },
	});
}
