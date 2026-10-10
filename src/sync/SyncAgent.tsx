import { useEffect } from 'react';
import { GAMES } from '../games/registry';
import { pushIfChanged, syncNow, useSync } from './engine';

/** Seconds of quiet after a change before it uploads, so a burst of checks becomes one request. */
export const PUSH_DELAY_MS = 3000;
/** How often an open, visible tracker checks for changes made elsewhere. */
export const PULL_EVERY_MS = 5 * 60 * 1000;

/**
 * Background sync. Renders nothing. While a code is set it pulls on start, when the tab becomes visible,
 * when the connection comes back and every few minutes; and uploads a few seconds after progress changes.
 */
export function SyncAgent() {
  const code = useSync((s) => s.code);

  useEffect(() => {
    if (!code) return;
    let pushTimer: ReturnType<typeof setTimeout> | undefined;
    const schedulePush = () => {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => void pushIfChanged(), PUSH_DELAY_MS);
    };
    const unsubscribes = GAMES.map((g) =>
      g.store.subscribe((s, prev) => {
        if (
          s.playthroughs !== prev.playthroughs ||
          s.activeId !== prev.activeId ||
          s.profile !== prev.profile
        ) {
          schedulePush();
        }
      }),
    );
    const pull = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    document.addEventListener('visibilitychange', pull);
    window.addEventListener('online', pull);
    const interval = setInterval(pull, PULL_EVERY_MS);
    void syncNow();
    return () => {
      clearTimeout(pushTimer);
      unsubscribes.forEach((u) => u());
      document.removeEventListener('visibilitychange', pull);
      window.removeEventListener('online', pull);
      clearInterval(interval);
    };
  }, [code]);

  return null;
}
