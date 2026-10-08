import { Outlet, ScrollRestoration } from 'react-router-dom';
import { SaveWatcher } from '../core/saveWatcher';
import { GAMES } from '../games/registry';

/** Top of the route tree: every game's save watcher runs here, whichever game is showing. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      {GAMES.map((g) => (
        <SaveWatcher key={g.id} game={g} />
      ))}
      <ScrollRestoration />
    </>
  );
}
