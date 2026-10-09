import { Navigate } from 'react-router';
import { createTrackerStore } from '../../core/store';
import type { LocationType } from './data/locations';
import { FINAL_XEMNAS_ID, LOCATIONS } from './data/locations';
import { DIFFICULTIES, FORMS, MAGIC } from './data/constants';
import { KEYBLADES } from './data/keyblades';
import { SCORED_TROPHY_COUNT } from './data/trophies';
import { fromPrototypeState } from './migrations';
import { KH2_CATALOG, evaluateTrophies } from './model/catalog';
import { isProfile, pct, PROFILES } from './model/scoring';
import { NAV } from './nav';
import { detect } from './save/detect';
import { parseError, parseSave } from './save/parseSave';
import { scoresFor } from './hooks';
import { Kh2Wallet } from './Wallet';
import { StatusRoute } from './routes/StatusRoute';
import { LeftRoute } from './routes/LeftRoute';
import { WorldsRoute } from './routes/WorldsRoute';
import { JournalRoute } from './routes/JournalRoute';
import { SynthesisRoute } from './routes/SynthesisRoute';
import { DriveRoute } from './routes/DriveRoute';
import { KeybladesRoute } from './routes/KeybladesRoute';
import { RecordsRoute } from './routes/RecordsRoute';
import { TrophiesScreen } from '../../screens/TrophiesScreen';
import { ConfigScreen } from '../../screens/ConfigScreen';
import type { GameDefinition } from '../types';

export const kh2Store = createTrackerStore({
  storageKey: 'kh2fm-tracker',
  catalog: KH2_CATALOG,
  profiles: PROFILES.map((p) => p.id),
  defaultProfile: 'everything',
  maxDifficulty: DIFFICULTIES.length - 1,
});

const TROPHY_NOTE =
  "Most trophies unlock from your checklist and save imports. If you've earned one the tracker can't see, mark it by hand. The world trophies use each world's last story boss as the trigger.";

export const KH2: GameDefinition = {
  id: 'kh2',
  title: 'Kingdom Hearts II Final Mix',
  short: 'KH2FM',
  basePath: '/kh2',
  themeColor: '#03082a',
  nav: NAV,
  catalog: KH2_CATALOG,
  store: kh2Store,
  profiles: PROFILES,
  difficulties: DIFFICULTIES,
  configToggles: [
    {
      id: FINAL_XEMNAS_ID,
      on: 'Game cleared (Final Xemnas beaten)',
      off: 'Mark game cleared (Final Xemnas beaten)',
    },
  ],
  playthroughNote:
    'The difficulty and ending trophies depend on these. Importing a save sets the difficulty for you.',
  backup: {
    app: 'kh2fm-100',
    catalog: KH2_CATALOG,
    maxDifficulty: DIFFICULTIES.length - 1,
    isProfile,
    legacy: fromPrototypeState,
  },
  save: {
    formatsNote:
      "Supported: the PC save (KHIIFM.png from the Epic or Steam 1.5+2.5 save folder), a raw PS2 save extracted from a memory card, and PCSX2 .ps2 memory cards when the save is stored in one piece. PS4 saves are encrypted and won't read. The file stays in your browser and is never uploaded anywhere.",
    parse: parseSave,
    detect: (bytes) => detect(bytes),
    error: parseError,
    previewRows: (det, simulated) => {
      const found = (t: LocationType) => LOCATIONS.filter((l) => l.type === t && det.checks[l.id]).length;
      const total = (t: LocationType) => LOCATIONS.filter((l) => l.type === t).length;
      const reports = Object.keys(det.checks).filter((id) => id.startsWith('r.') && det.checks[id]).length;
      return [
        ['Sora', `LV ${det.values['lv.sora']}`],
        ['Trophies after sync', `${evaluateTrophies(simulated).earned} / ${SCORED_TROPHY_COUNT}`],
        ['Treasures', `${found('chest')} / ${total('chest')}`],
        ['Rewards', `${found('reward')} / ${total('reward')}`],
        ['Story Bosses', `${found('boss')} / ${total('boss')}`],
        ['Ansem Reports', `${reports} / 13`],
        ['Keyblades', `${KEYBLADES.filter((k) => det.checks[k.id]).length} / ${KEYBLADES.length}`],
        ['Drive Forms', `${FORMS.reduce((a, f) => a + (det.values[`lv.${f.key}`] ?? 0), 0)} / 35`],
        ['Magic', `${MAGIC.reduce((a, m) => a + (det.values[`lv.${m.key}`] ?? 0), 0)} / 18`],
      ];
    },
  },
  Wallet: Kh2Wallet,
  summary: (p, profile) => {
    const s = scoresFor(p);
    if (profile === 'trophies') {
      return {
        value: `${s.trophies.earned}/${SCORED_TROPHY_COUNT}`,
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
    { index: true, element: <StatusRoute /> },
    { path: 'left', element: <LeftRoute /> },
    { path: 'worlds', element: <Navigate to="lod" replace /> },
    { path: 'worlds/:worldId', element: <WorldsRoute /> },
    { path: 'journal', element: <JournalRoute /> },
    { path: 'trophies', element: <TrophiesScreen note={TROPHY_NOTE} /> },
    { path: 'synthesis', element: <SynthesisRoute /> },
    { path: 'drive', element: <DriveRoute /> },
    { path: 'keyblades', element: <KeybladesRoute /> },
    { path: 'records', element: <RecordsRoute /> },
    { path: 'config', element: <ConfigScreen /> },
  ],
};
