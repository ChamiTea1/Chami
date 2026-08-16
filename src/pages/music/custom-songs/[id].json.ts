import type { APIRoute, GetStaticPaths } from 'astro';

export const prerender = true;

/**
 * 自建直链歌单的 Meting 格式输出（/music/custom-songs/<id>.json）。
 * 每个自建歌单对应 src/data/custom-music/<id>.json 一个文件
 * （字段 name/artist/url/cover/lrc，直链走图床/jsDelivr），
 * <id> 与 src/data/music.json 里该歌单的 id 一致。
 * 播放页对 server=custom 给 <meting-js> 加 api="/music/custom-songs/<id>.json"。
 */
const songFiles = import.meta.glob('../../../data/custom-music/*.json', { eager: true, import: 'default' });

interface CustomSong {
	name: string;
	artist: string;
	url: string;
	cover?: string;
	lrc?: string;
}

const toMeting = (songs: CustomSong[]) =>
	JSON.stringify(
		songs.map((song) => ({
			title: song.name,
			author: song.artist,
			url: song.url,
			pic: song.cover ?? '',
			lrc: song.lrc ?? '',
		})),
	);

export const getStaticPaths: GetStaticPaths = () =>
	Object.entries(songFiles).map(([path, songs]) => ({
		params: { id: path.match(/custom-music\/(.+)\.json$/)?.[1] ?? '' },
		props: { body: toMeting(songs as CustomSong[]) },
	}));

export const GET: APIRoute = ({ props }) =>
	new Response(props.body, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
