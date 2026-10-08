import { createTrackerStore } from '../../core/store';
import type { Catalog } from '../../core/types';
import { ConfigScreen } from '../../screens/ConfigScreen';
import type { GameDefinition, NavEntry } from '../types';
import { Kh1StatusRoute } from './routes/StatusRoute';
import { Kh1Wallet } from './Wallet';

/** Placeholder until the KH1FM data lands; replaced milestone by milestone. */
const KH1_CATALOG: Catalog = {
  items: [],
  itemById: new Map(),
  defaults: {},
  sectionItems: {},
  trophies: [],
  navKeyOf: () => 'status',
};

const NAV: readonly NavEntry[] = [
  { key: 'status', path: '', label: 'Status', help: 'Overall completion at a glance.' },
  {
    key: 'data',
    path: 'config',
    label: 'Config',
    help: 'Set your difficulty, back up your progress, or start over.',
  },
];

const PROFILES = [{ id: 'everything', name: 'Everything', label: 'EVERYTHING', total: 'ALL' }] as const;

export const kh1Store = createTrackerStore({
  storageKey: 'kh1fm-tracker',
  catalog: KH1_CATALOG,
  profiles: PROFILES.map((p) => p.id),
  defaultProfile: 'everything',
  maxDifficulty: 2,
});

export const KH1: GameDefinition = {
  id: 'kh1',
  title: 'Kingdom Hearts Final Mix',
  short: 'KH1FM',
  basePath: '/kh1',
  nav: NAV,
  catalog: KH1_CATALOG,
  store: kh1Store,
  profiles: PROFILES,
  difficulties: [],
  configToggles: [],
  playthroughNote: 'KH1FM support is being built.',
  backup: { app: 'kh1fm-100', catalog: KH1_CATALOG, maxDifficulty: 2, isProfile: (v) => v === 'everything' },
  Wallet: Kh1Wallet,
  summary: () => ({ value: '0%', pct: 0, sub: 'Coming soon' }),
  routes: [
    { index: true, element: <Kh1StatusRoute /> },
    { path: 'config', element: <ConfigScreen /> },
  ],
};
