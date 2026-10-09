// Service worker: lets the tracker open offline once it has loaded online.
// The build (pwaPlugin in vite.config.ts) replaces the two placeholders and writes dist/sw.js.
// Progress lives in localStorage and IndexedDB, not here: this only caches the app's own files.

const VERSION = '__SW_VERSION__';
const PRECACHE = __SW_PRECACHE__;
const SHELL = `kh-tracker-shell-${VERSION}`;
const FONTS = 'kh-tracker-fonts';
const ICONS = 'kh-tracker-icons';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('kh-tracker-') && ![SHELL, FONTS, ICONS].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // Pages: always try the network so a new deploy shows up, and fall back to the cached shell offline.
    // The cached shell only changes with a new service worker, so it always matches the cached assets.
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).catch(() => caches.match('/', { cacheName: SHELL })));
      return;
    }
    // Game icons (public/icons) aren't precached, to keep installs small: they're cached the first time a
    // screen shows them, served from the cache after that, and refreshed in the background.
    if (url.pathname.startsWith('/icons/')) {
      event.respondWith(staleWhileRevalidate(ICONS, request));
      return;
    }
    // Built assets have content hashes in their names, so a cached copy is never stale. ignoreVary because
    // module scripts send an Origin header the precache requests didn't, and servers may "Vary: Origin".
    event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request)));
    return;
  }

  // Google Fonts: serve the cached copy straight away and refresh it in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(FONTS, request));
  }
});

/** Serves the cached copy straight away (if any) and refreshes it in the background. */
function staleWhileRevalidate(cacheName, request) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((hit) => {
      const fresh = fetch(request)
        .then((res) => {
          // The font stylesheet link isn't a CORS request, so its response is opaque (status 0) but usable.
          if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || fresh;
    }),
  );
}
