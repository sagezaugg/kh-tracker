/** Registers the offline service worker (built into dist/sw.js) in production builds only. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is a bonus; the tracker works the same without it.
    });
  });
}
