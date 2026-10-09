#!/usr/bin/env node
/**
 * Downloads the game images listed in scripts/icons/manifest.json from KHWiki and writes small WebP copies
 * into public/icons/, plus the lookup tables the app reads (src/games/<game>/data/icons.json) and
 * public/icons/CREDITS.json (where every image came from).
 *
 * Originals are cached in scripts/icons/.cache (gitignored), so re-running only downloads what's new.
 * Requests go one at a time with a pause between them and a user agent naming the project.
 *
 * Usage: npm run icons:fetch
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = join(ROOT, 'scripts', 'icons', '.cache');
const OUT = join(ROOT, 'public', 'icons');
const API = 'https://www.khwiki.com/api.php';
const UA = 'kh-tracker icon fetch (https://github.com/sagezaugg/kh-tracker)';
const PAUSE_MS = 400;

/** Square icons: shown at up to 48px, so 96px covers 2x screens. */
const ICON = 96;
/** Long weapons (Keyblades, staves): rotated level and fitted to a 3:1 bar, shown at up to 72x24. */
const BAR_W = 144;
const BAR_H = 48;
/** World logos: shown at up to 40px tall. */
const LOGO_H = 80;
const LOGO_MAX_W = 360;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (file) =>
  file
    .replace(/\.[a-z]+$/i, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const exists = (p) =>
  stat(p).then(
    () => true,
    () => false,
  );

async function api(params) {
  const q = new URLSearchParams({ ...params, format: 'json' });
  const res = await fetch(`${API}?${q}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`KHWiki API ${res.status}`);
  return res.json();
}

/** file name -> { url, page } via the MediaWiki API, 50 titles per request. */
async function resolve(files) {
  const out = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const chunk = files.slice(i, i + 50);
    const d = await api({
      action: 'query',
      titles: chunk.map((f) => `File:${f}`).join('|'),
      prop: 'imageinfo',
      iiprop: 'url',
    });
    const norm = new Map((d.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of Object.values(d.query.pages)) {
      const name = (norm.get(p.title) ?? p.title).slice(5);
      const ii = p.imageinfo?.[0];
      if (!ii) throw new Error(`Not on KHWiki: ${name}`);
      out.set(name, { url: ii.url, page: ii.descriptionurl });
    }
    await sleep(PAUSE_MS);
  }
  return out;
}

async function download(file, url) {
  const dest = join(CACHE, file);
  if (await exists(dest)) return { dest, fresh: false };
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} downloading ${file}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  await sleep(PAUSE_MS);
  return { dest, fresh: true };
}

/** Trims transparent edges, then fits the whole image into a transparent square. */
const squareFit = (src) =>
  sharp(src)
    .trim()
    .resize(ICON, ICON, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

/** Trims, then takes a square from the top of a tall figure (head and torso of a full-body render). */
async function squareTop(src) {
  const trimmed = await sharp(src).trim().toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const side = Math.min(width, height);
  return sharp(trimmed.data)
    .extract({ left: Math.floor((width - side) / 2), top: 0, width: side, height: side })
    .resize(ICON, ICON);
}

/**
 * Weapon renders are drawn diagonally, so fitted into a square they shrink to a thin sliver. This finds the
 * shape's main axis from its opaque pixels (principal component of the alpha mask), rotates it level, trims
 * and fits it into a wide bar.
 */
async function levelBar(src) {
  const trimmed = await sharp(src).trim().png().toBuffer();
  const probe = await sharp(trimmed)
    .resize(256, 256, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = probe;
  let n = 0,
    sx = 0,
    sy = 0;
  const pts = [];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 64) {
        pts.push(x, y);
        sx += x;
        sy += y;
        n++;
      }
  const mx = sx / n,
    my = sy / n;
  let cxx = 0,
    cyy = 0,
    cxy = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - mx,
      dy = pts[i + 1] - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  }
  const angle = (0.5 * Math.atan2(2 * cxy, cxx - cyy) * 180) / Math.PI;
  const level = await sharp(trimmed)
    .rotate(-angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  // Point them all the same way: the handle end (thin keychain or grip) goes right, the head left. The
  // thinner end is the one whose outer tenth has fewer opaque pixels.
  const lv = await sharp(level).trim().png().toBuffer();
  const m = await sharp(lv).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const band = Math.max(1, Math.floor(m.info.width / 10));
  const mass = (x0) => {
    let c = 0;
    for (let y = 0; y < m.info.height; y++)
      for (let x = x0; x < x0 + band; x++) if (m.data[(y * m.info.width + x) * 4 + 3] > 64) c++;
    return c;
  };
  const flip = mass(0) < mass(m.info.width - band);
  return sharp(lv)
    .flop(flip)
    .resize(BAR_W, BAR_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
}

/** Trims, then scales a wide logo to a fixed height. */
const logo = (src) =>
  sharp(src).trim().resize({ height: LOGO_H, width: LOGO_MAX_W, fit: 'inside', withoutEnlargement: false });

async function main() {
  const manifest = JSON.parse(await readFile(join(ROOT, 'scripts', 'icons', 'manifest.json'), 'utf8'));
  await mkdir(CACHE, { recursive: true });

  const allFiles = new Set();
  for (const g of Object.values(manifest.games))
    for (const sec of ['items', 'trophies', 'worlds']) Object.values(g[sec]).forEach((f) => allFiles.add(f));
  const files = [...allFiles].sort();

  console.log(`Resolving ${files.length} files on KHWiki…`);
  const where = await resolve(files);

  let fresh = 0;
  for (const [i, file] of files.entries()) {
    const r = await download(file, where.get(file).url);
    if (r.fresh) {
      fresh++;
      process.stdout.write(`\r  downloaded ${fresh} (${i + 1}/${files.length})   `);
    }
  }
  console.log(`\n${fresh} downloaded, ${files.length - fresh} already cached.`);

  await rm(OUT, { recursive: true, force: true });
  const fetched = new Date().toISOString().slice(0, 10);
  const credits = new Map();

  for (const [gameId, g] of Object.entries(manifest.games)) {
    const dir = join(OUT, gameId);
    await mkdir(dir, { recursive: true });
    const cropTop = new Set(g.cropTop ?? []);
    const isBar = (id) => (g.levelBars ?? []).some((prefix) => id.startsWith(prefix));
    const table = { items: {}, trophies: {}, worlds: {} };
    const written = new Map();

    for (const sec of ['items', 'trophies', 'worlds']) {
      for (const [id, file] of Object.entries(g[sec]).sort()) {
        const top = sec === 'items' && cropTop.has(id);
        const bar = sec === 'items' && isBar(id);
        const suffix = top ? '-top' : bar ? '-bar' : '';
        const key = `${file}${suffix}`;
        let entry = written.get(key);
        if (!entry) {
          const src = join(CACHE, file);
          const pipeline =
            sec === 'worlds'
              ? logo(src)
              : top
                ? await squareTop(src)
                : bar
                  ? await levelBar(src)
                  : squareFit(src);
          const { data, info } = await pipeline.webp({ quality: 86, alphaQuality: 90, effort: 6 }).toBuffer({
            resolveWithObject: true,
          });
          const path = `/icons/${gameId}/${slug(file)}${suffix}.webp`;
          await writeFile(join(OUT, gameId, `${slug(file)}${suffix}.webp`), data);
          // Trophies are always square; items and logos carry their size so the app can lay them out.
          entry = sec === 'trophies' ? path : [path, info.width, info.height];
          written.set(key, entry);
          const c = credits.get(file) ?? { file, page: where.get(file).page, fetched, used: [] };
          c.used.push(path);
          credits.set(file, c);
        }
        table[sec][id] = entry;
      }
    }
    await writeFile(
      join(ROOT, 'src', 'games', gameId, 'data', 'icons.json'),
      JSON.stringify(table, null, 2) + '\n',
    );
    console.log(`${gameId}: ${written.size} images written`);
  }

  const list = [...credits.values()].sort((a, b) => a.file.localeCompare(b.file));
  await writeFile(
    join(OUT, 'CREDITS.json'),
    JSON.stringify(
      {
        notice:
          'Kingdom Hearts images are property of Square Enix and Disney, shown here only to identify items, under fair use. Sourced from KHWiki (https://www.khwiki.com); each entry links the file page it came from.',
        images: list,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Credits for ${list.length} source files written.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
