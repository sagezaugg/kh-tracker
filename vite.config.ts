/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Connect, type Plugin } from 'vite';
import { createMemoryStore, createSyncHandler } from './server/sync';
import react from '@vitejs/plugin-react';

/** public/ files the offline shell needs. The link-preview image isn't one of them. */
const PUBLIC_PRECACHE = [
  'favicon.svg',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
];

/**
 * Writes dist/sw.js from pwa/sw.js with the build's file list, so the app opens offline.
 * The version is a hash of everything precached: any change ships a new worker and drops the old cache.
 */
function pwaPlugin(): Plugin {
  return {
    name: 'kh-tracker-pwa',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const urls: string[] = [];
      for (const file of Object.values(bundle).sort((a, b) => a.fileName.localeCompare(b.fileName))) {
        if (file.fileName.endsWith('.map')) continue;
        urls.push(file.fileName === 'index.html' ? '/' : `/${file.fileName}`);
        hash.update(file.fileName).update(file.type === 'chunk' ? file.code : file.source);
      }
      const publicFiles = new Set(readdirSync('public'));
      for (const name of PUBLIC_PRECACHE) {
        if (!publicFiles.has(name)) this.error(`pwa: public/${name} is missing`);
        urls.push(`/${name}`);
        hash.update(name).update(readFileSync(`public/${name}`));
      }
      const template = readFileSync('pwa/sw.js', 'utf8');
      hash.update(template);
      const source = template
        .replace("'__SW_VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('__SW_PRECACHE__', JSON.stringify(urls));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

/**
 * Serves /api/sync from memory in `npm run dev` and `npm run preview`, so sync works locally without
 * Upstash credentials. Production uses the Vercel Function in api/sync.ts.
 */
function devSyncApi(): Plugin {
  const handle = createSyncHandler(createMemoryStore());
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/sync')) return next();
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', async () => {
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
      });
      const response = await handle(request);
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(await response.text());
    });
  };
  return {
    name: 'kh-tracker-dev-sync',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig({
  plugins: [react(), pwaPlugin(), devSyncApi()],
  build: {
    rolldownOptions: {
      output: {
        // Libraries change far less often than the app, so they get their own long-lived file and a
        // deploy usually only re-downloads the app chunk. Game data stays in the app chunk: the home page
        // gauges and every game's save watcher need it on every page.
        codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
