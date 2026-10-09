import { createBrowserRouter, type RouteObject } from 'react-router';
import { GAMES } from './games/registry';
import { GameShell } from './shell/GameShell';
import { HomeRoute } from './shell/HomeRoute';
import { NotFoundPage } from './shell/NotFoundPage';
import { NotFoundRoute } from './shell/NotFoundRoute';
import { RootLayout } from './shell/RootLayout';
import { SaveDiffRoute } from './shell/SaveDiffRoute';

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
      { path: 'tools/save-diff', element: <SaveDiffRoute /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
