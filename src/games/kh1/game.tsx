import { Navigate } from 'react-router-dom';
import { slug } from '../../core/slug';
import { createTrackerStore } from '../../core/store';
import { ConfigScreen } from '../../screens/ConfigScreen';
import { TrophiesScreen } from '../../screens/TrophiesScreen';
import type { GameDefinition } from '../types';
import { DIFFICULTIES, KEYBLADES, MAGIC, PUPPY_COUNT } from './data/constants';
import { KH1_LOCATIONS, type Kh1LocationType } from './data/locations';
import { KH1_CLEARED_ID } from './data/trophies';
import { kh1ScoresFor } from './hooks';
import { evaluateTrophies, KH1_CATALOG } from './model/catalog';
import { isKh1Profile, KH1_PROFILES } from './model/scoring';
import { KH1_NAV } from './nav';
import { detectKh1, kh1ParseError, parseKh1Save } from './save/parseSave';
import { Kh1Wallet } from './Wallet';
import { Kh1AbilitiesRoute } from './routes/AbilitiesRoute';
import { Kh1EquipmentRoute } from './routes/EquipmentRoute';
import { Kh1JournalRoute } from './routes/JournalRoute';
import { Kh1LeftRoute } from './routes/LeftRoute';
import { Kh1RecordsRoute } from './routes/RecordsRoute';
import { Kh1StatusRoute } from './routes/StatusRoute';
import { Kh1SynthesisRoute } from './routes/SynthesisRoute';
import { Kh1WorldsRoute } from './routes/WorldsRoute';

export const kh1Store = createTrackerStore({
  storageKey: 'kh1fm-tracker',
  catalog: KH1_CATALOG,
  profiles: KH1_PROFILES.map((p) => p.id),
  defaultProfile: 'everything',
  maxDifficulty: DIFFICULTIES.length - 1,
});

const TROPHY_NOTE =
  "Trophies unlock from your checklist and save imports where the game's flags are known: superbosses, five keyholes, Journal sections, Keyblades, synthesis and more. Mark the rest by hand. The Monstro and Blade Master triggers are inferences to verify.";

const pct = (r: number) => Math.floor(r * 100);

export const KH1: GameDefinition = {
  id: 'kh1',
  title: 'Kingdom Hearts Final Mix',
  short: 'KH1FM',
  basePath: '/kh1',
  nav: KH1_NAV,
  catalog: KH1_CATALOG,
  store: kh1Store,
  profiles: KH1_PROFILES,
  difficulties: DIFFICULTIES,
  configToggles: [
    { id: KH1_CLEARED_ID, on: 'Game cleared (Ansem defeated)', off: 'Mark game cleared (Ansem defeated)' },
  ],
  playthroughNote:
    "The difficulty and ending trophies depend on these. Importing a save sets the difficulty for you. KH1FM can't save after the final battle, so mark the game cleared here yourself.",
  backup: {
    app: 'kh1fm-100',
    catalog: KH1_CATALOG,
    maxDifficulty: DIFFICULTIES.length - 1,
    isProfile: isKh1Profile,
  },
  save: {
    formatsNote:
      "Supported: the PC save (KHFM.png or KHFM_WW.png from the Epic or Steam 1.5+2.5 save folder). PS2 and PS4 saves use different formats and won't read. The file stays in your browser and is never uploaded anywhere.",
    parse: parseKh1Save,
    detect: (bytes) => detectKh1(bytes),
    error: kh1ParseError,
    previewRows: (det, simulated) => {
      const found = (t: Kh1LocationType) => {
        const ls = KH1_LOCATIONS.filter((l) => l.type === t && l.flag);
        return `${ls.filter((l) => det.checks[l.id]).length} / ${ls.length}`;
      };
      const trophies = evaluateTrophies(simulated);
      const reports = Object.keys(det.checks).filter((id) => id.startsWith('r.') && det.checks[id]).length;
      const keyblades = KEYBLADES.filter(([, n]) => det.checks[`kb.${slug(n)}`]).length;
      const magic = MAGIC.reduce((a, m) => a + (det.values[`lv.${m.key}`] ?? 0), 0);
      return [
        ['Sora', `LV ${det.values['lv.sora']}`],
        ['Trophies after sync', `${trophies.earned} / ${trophies.scored}`],
        ['Treasures', found('chest')],
        ['Event rewards', found('reward')],
        ['Story events', found('event')],
        ["Ansem's Reports", `${reports} / 13`],
        ['Puppies', `${det.values['kh1.puppies'] ?? 0} / ${PUPPY_COUNT}`],
        ['Keyblades', `${keyblades} / ${KEYBLADES.length}`],
        ['Magic', `${magic} / ${MAGIC.length * 3}`],
      ];
    },
  },
  Wallet: Kh1Wallet,
  summary: (p, profile) => {
    const s = kh1ScoresFor(p);
    if (profile === 'trophies') {
      return {
        value: `${s.trophies.earned}/${s.trophies.scored}`,
        pct: pct(s.ratio.trophies),
        sub: 'Trophies',
      };
    }
    const key = profile === 'journal' ? 'journal' : 'everything';
    return {
      value: `${pct(s.ratio[key])}%`,
      pct: pct(s.ratio[key]),
      sub: key === 'journal' ? 'Journal' : 'Everything',
    };
  },
  routes: [
    { index: true, element: <Kh1StatusRoute /> },
    { path: 'left', element: <Kh1LeftRoute /> },
    { path: 'worlds', element: <Navigate to="tt" replace /> },
    { path: 'worlds/:worldId', element: <Kh1WorldsRoute /> },
    { path: 'journal', element: <Kh1JournalRoute /> },
    { path: 'trophies', element: <TrophiesScreen note={TROPHY_NOTE} /> },
    { path: 'synthesis', element: <Kh1SynthesisRoute /> },
    { path: 'abilities', element: <Kh1AbilitiesRoute /> },
    { path: 'equipment', element: <Kh1EquipmentRoute /> },
    { path: 'records', element: <Kh1RecordsRoute /> },
    { path: 'config', element: <ConfigScreen /> },
  ],
};
