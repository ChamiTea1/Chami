/**
 * Compresses images in public/images that exceed a size threshold (default 4MB).
 * Usage: node scripts/compress-images.mjs [--threshold=4] [--quality=80] [--dry-run]
 */

import { readdir, stat, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
	const found = args.find((a) => a.startsWith(`--${name}=`));
	return found ? found.split('=')[1] : fallback;
};

const THRESHOLD_MB = Number(getArg('threshold', 4));
const QUALITY = Number(getArg('quality', 80));
const DRY_RUN = args.includes('--dry-run');
const ROOT = path.join(process.cwd(), 'public', 'images');

const COMPRESSIBLE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);

const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

async function* walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(full);
		} else if (entry.isFile()) {
			yield full;
		}
	}
}

const compress = async (filePath) => {
	const ext = path.extname(filePath).toLowerCase();
	let pipeline;
	if (ext === '.jpg' || ext === '.jpeg') {
		pipeline = sharp(filePath).jpeg({ quality: QUALITY, progressive: true });
	} else if (ext === '.png') {
		pipeline = sharp(filePath).png({ palette: true, quality: QUALITY });
	} else if (ext === '.webp') {
		pipeline = sharp(filePath).webp({ quality: QUALITY });
	} else if (ext === '.tif' || ext === '.tiff') {
		pipeline = sharp(filePath).jpeg({ quality: QUALITY, progressive: true });
	}
	if (!pipeline) return null;

	const tmpPath = `${filePath}.tmp`;
	await pipeline.toFile(tmpPath);
	const [before, after] = await Promise.all([stat(filePath), stat(tmpPath)]);
	if (after.size >= before.size) {
		// Compression didn't help; keep original.
		await unlink(tmpPath);
		return { file: filePath, before: before.size, after: before.size, kept: true };
	}
	if (DRY_RUN) {
		await unlink(tmpPath);
		return { file: filePath, before: before.size, after: after.size, kept: false };
	}
	await rename(tmpPath, filePath);
	return { file: filePath, before: before.size, after: after.size, kept: false };
};

const results = [];
const thresholdBytes = THRESHOLD_MB * 1024 * 1024;
let scanned = 0;

for await (const filePath of walk(ROOT)) {
	const ext = path.extname(filePath).toLowerCase();
	if (!COMPRESSIBLE.has(ext)) continue;
	scanned += 1;
	const info = await stat(filePath);
	if (info.size <= thresholdBytes) continue;
	results.push(await compress(filePath));
}

console.log(`扫描图片 ${scanned} 张，超过 ${THRESHOLD_MB}MB 的 ${results.length} 张${DRY_RUN ? '（dry-run）' : ''}：`);
let savedTotal = 0;
for (const r of results) {
	const saved = r.before - r.after;
	savedTotal += r.kept ? 0 : saved;
	const rel = path.relative(process.cwd(), r.file);
	console.log(
		`  ${r.kept ? '保留' : DRY_RUN ? '将压缩' : '已压缩'}  ${rel}  ${formatSize(r.before)} → ${formatSize(r.after)}${r.kept ? '（压缩无收益）' : ''}`,
	);
}
if (results.length === 0) console.log('  没有需要压缩的图片。');
else console.log(`共节省 ${formatSize(savedTotal)}`);
