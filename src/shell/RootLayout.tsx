import { Outlet, ScrollRestoration } from 'react-router';
import { SaveWatcher } from '../core/saveWatcher';
import { GAMES } from '../games/registry';
import { configureSync } from '../sync/engine';
import { SyncAgent } from '../sync/SyncAgent';

configureSync(GAMES);

/** Top of the route tree: every game's save watcher runs here, whichever game is showing. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      {GAMES.map((g) => (
        <SaveWatcher key={g.id} game={g} />
      ))}
      <SyncAgent />
      <ScrollRestoration />
    </>
  );
}
