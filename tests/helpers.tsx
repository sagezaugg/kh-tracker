import { act, render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { blankTrackerData } from '../src/core/store';
import { useUi } from '../src/core/ui';
import { GAMES } from '../src/games/registry';
import { kh2Store } from '../src/games/kh2/game';
import { routerFuture, routes } from '../src/router';

export { kh2Store };

export function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

export const kh2Progress = () => {
  const s = kh2Store.getState();
  return s.playthroughs[s.activeId].progress;
};

/** Blank progress for every game and quiet transient UI. */
export function resetAll() {
  act(() => {
    for (const g of GAMES) g.store.setState(blankTrackerData(g.profiles[g.profiles.length - 1].id));
    useUi.setState({
      hint: null,
      toast: null,
      toastKind: 'info',
      pop: null,
      watchStatus: {},
      watchNonce: {},
      updateReady: false,
    });
  });
}
