import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { siteConfig } from '../config';
import { sortPosts, stripMarkdown } from '../utils/collections';

export async function GET(context) {
	const posts = sortPosts(await getCollection('blog'));
	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}/`,
			description: post.data.description ?? stripMarkdown(post.body ?? '').slice(0, 200),
			content: post.rendered?.html ?? `<p>${stripMarkdown(post.body ?? '')}</p>`,
			pubDate: post.data.pubDate,
		})),
	});
}
