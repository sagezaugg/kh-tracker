import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { GAMES } from './games/registry';
import { GameShell } from './shell/GameShell';
import { HomeRoute } from './shell/HomeRoute';
import { NotFoundPage } from './shell/NotFoundPage';
import { NotFoundRoute } from './shell/NotFoundRoute';
import { RootLayout } from './shell/RootLayout';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeRoute /> },
      ...GAMES.map((g): RouteObject => ({
        path: g.id,
        element: <GameShell game={g} />,
        children: [...g.routes, { path: '*', element: <NotFoundRoute /> }],
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

/** Opt in to the v7 behaviours now so the upgrade is a no-op. */
export const routerFuture = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
} as const;

export function createAppRouter() {
  return createBrowserRouter(routes, { future: routerFuture });
}
