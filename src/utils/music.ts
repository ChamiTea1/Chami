export interface PlaylistEntry {
	name: string;
	server: string;
	type: string;
	id: string;
	cover?: string;
}

/** 生成 /music/play/ 播放页链接（music.astro 与 play.astro 共用，全站唯一一份）。 */
export function musicPlayUrl(p: PlaylistEntry): string {
	return `/music/play/?server=${encodeURIComponent(p.server)}&type=${encodeURIComponent(p.type || 'playlist')}&id=${encodeURIComponent(p.id)}&name=${encodeURIComponent(p.name)}${
		p.cover ? `&cover=${encodeURIComponent(p.cover)}` : ''
	}`;
}
