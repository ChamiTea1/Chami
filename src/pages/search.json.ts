import { getCollection } from 'astro:content';
import { stripMarkdown } from '../utils/collections';

export async function GET() {
	const posts = await getCollection('blog');
	const items = posts
		.filter((post) => post.data.title)
		.map((post) => ({
			title: post.data.title,
			url: `/blog/${post.id}/`,
			content: stripMarkdown(post.body ?? ''),
		}));
	return new Response(JSON.stringify(items), {
		headers: { 'Content-Type': 'application/json' },
	});
}
