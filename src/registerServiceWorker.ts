import { useUi } from './core/ui';

/** Open tabs look for a new deploy at most this often (on focus and on a timer). */
export const UPDATE_CHECK_MS = 30 * 60 * 1000;

/**
 * Registers the offline service worker (built into dist/sw.js) in production builds only.
 * The worker takes over as soon as a new version installs, but the open page still runs the old code,
 * so a tab that was already controlled gets an "update ready" prompt to reload.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  // On a first visit the worker claims the page too; that isn't an update.
  const hadController = sw.controller !== null;
  sw.addEventListener('controllerchange', () => {
    if (hadController) useUi.getState().setUpdateReady(true);
  });

  window.addEventListener('load', () => {
    sw.register('/sw.js')
      .then((reg) => watchForUpdates(reg))
      .catch(() => {
        // Offline support is a bonus; the tracker works the same without it.
      });
  });
}

/** Browsers only look for a new worker on navigation, which a long-open tracker tab rarely does. */
function watchForUpdates(reg: ServiceWorkerRegistration): void {
  let last = Date.now();
  const check = () => {
    if (Date.now() - last < UPDATE_CHECK_MS) return;
    last = Date.now();
    reg.update().catch(() => {
      // Offline or the server is unreachable; try again next time.
    });
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  setInterval(check, UPDATE_CHECK_MS);
}
