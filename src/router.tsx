import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { Layout } from './routes/Layout';
import { StatusRoute } from './routes/StatusRoute';
import { LeftRoute } from './routes/LeftRoute';
import { WorldsRoute } from './routes/WorldsRoute';
import { JournalRoute } from './routes/JournalRoute';
import { TrophiesRoute } from './routes/TrophiesRoute';
import { SynthesisRoute } from './routes/SynthesisRoute';
import { DriveRoute } from './routes/DriveRoute';
import { KeybladesRoute } from './routes/KeybladesRoute';
import { RecordsRoute } from './routes/RecordsRoute';
import { ConfigRoute } from './routes/ConfigRoute';
import { NotFoundRoute } from './routes/NotFoundRoute';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <StatusRoute /> },
      { path: 'left', element: <LeftRoute /> },
      { path: 'worlds', element: <Navigate to="/worlds/lod" replace /> },
      { path: 'worlds/:worldId', element: <WorldsRoute /> },
      { path: 'journal', element: <JournalRoute /> },
      { path: 'trophies', element: <TrophiesRoute /> },
      { path: 'synthesis', element: <SynthesisRoute /> },
      { path: 'drive', element: <DriveRoute /> },
      { path: 'keyblades', element: <KeybladesRoute /> },
      { path: 'records', element: <RecordsRoute /> },
      { path: 'config', element: <ConfigRoute /> },
      { path: '*', element: <NotFoundRoute /> },
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
