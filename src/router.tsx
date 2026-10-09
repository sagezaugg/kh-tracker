import { createBrowserRouter, type RouteObject } from 'react-router';
import { GAMES } from './games/registry';
import { GameShell } from './shell/GameShell';
import { HomeRoute } from './shell/HomeRoute';
import { NotFoundPage } from './shell/NotFoundPage';
import { NotFoundRoute } from './shell/NotFoundRoute';
import { RootLayout } from './shell/RootLayout';
import { RouteError } from './shell/RouteError';
import { SaveDiffRoute } from './shell/SaveDiffRoute';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    // Any page that throws while rendering lands here instead of React Router's bare default screen.
    errorElement: <RouteError />,
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
