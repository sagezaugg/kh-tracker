import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const inPublic = (url: string) => existsSync(join(ROOT, 'public', new URL(url, 'https://x').pathname));

describe('link previews and install metadata', () => {
  const html = read('index.html');

  it('points every preview image and icon at a file in public/', () => {
    const urls = [
      ...html.matchAll(
        /(?:href|content)="((?:https:\/\/kh-tracker\.vercel\.app)?\/[^"]*\.(?:png|svg|webmanifest))"/g,
      ),
    ].map((m) => m[1]);
    expect(urls).toEqual(
      expect.arrayContaining([
        '/favicon.svg',
        '/apple-touch-icon.png',
        '/manifest.webmanifest',
        'https://kh-tracker.vercel.app/og.png',
      ]),
    );
    for (const url of urls) expect(inPublic(url), url).toBe(true);
  });

  it('has an installable manifest whose icons exist', () => {
    const manifest = JSON.parse(read('public/manifest.webmanifest'));
    expect(manifest).toMatchObject({ start_url: '/', display: 'standalone' });
    const sizes = manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`);
    expect(sizes).toEqual(expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']));
    for (const icon of manifest.icons) expect(inPublic(icon.src), icon.src).toBe(true);
  });

  it('keeps the service worker build placeholders in place', () => {
    const sw = read('pwa/sw.js');
    expect(sw).toContain("'__SW_VERSION__'");
    expect(sw).toContain('__SW_PRECACHE__');
  });
});
