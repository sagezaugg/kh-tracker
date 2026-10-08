import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty } from '../data/constants';
import { applyImport, type ImportMode } from '../model/importSave';
import { emptyProgress, isOn } from '../model/progress';
import { clampValue } from '../model/progress';
import { evaluateTrophies, newlyEarned, type TrophyStatus } from '../model/rules';
import { computeScores, type Profile, type Scores } from '../model/scoring';
import type { ImportMeta, Progress } from '../model/types';
import type { NavKey } from '../routes/nav';
import type { Detected } from '../save/detect';
import { fromPrototypeState, isObj, normalizeProgress, PROTOTYPE_LS_KEY, type Restored } from './migrations';
import { createSafeStorage, readRaw } from './storage';

export const STORE_KEY = 'kh2fm-tracker';
export const STORE_VERSION = 1;
const DEFAULT_ID = 'main';

export interface Playthrough {
  id: string;
  name: string;
  progress: Progress;
}

/** Auto re-import of a watched save file (File System Access API; the handle lives in IndexedDB). */
export interface WatchSettings {
  /** The user's toggle. Watching only happens once a file handle has been picked. */
  enabled: boolean;
  mode: ImportMode;
  /** Slot label to re-import ("Slot 1"). */
  slot?: string;
  fileName?: string;
  /** Modified time of the version last imported, so unchanged files are skipped. */
  lastModified?: number;
}

export interface TrackerData {
  activeId: string;
  playthroughs: Record<string, Playthrough>;
  profile: Profile;
  /** Menu entries showing NEW!. */
  news: Partial<Record<NavKey, boolean>>;
  watch: WatchSettings;
}

export interface ToggleResult {
  on: boolean;
  /** Trophies this change earned. */
  earned: TrophyStatus[];
}

export interface ImportSummary {
  added: number;
  removed: number;
  trophiesGained: number;
}

interface TrackerActions {
  /** A check changed by hand. Records an override so a later Sync leaves it alone. */
  toggle: (id: string) => ToggleResult;
  /** Bulk change by hand ("Check all", "Clear"). */
  setChecks: (ids: readonly string[], on: boolean) => void;
  setValue: (id: string, value: number) => void;
  setDifficulty: (d: Difficulty | undefined) => void;
  addCustom: (text: string) => void;
  removeCustom: (id: string) => void;
  setProfile: (p: Profile) => void;
  clearNews: (key: NavKey) => void;
  importSave: (
    det: Detected,
    meta: ImportMeta,
    difficulty: Difficulty | null,
    mode: ImportMode,
  ) => ImportSummary;
  setWatch: (patch: Partial<WatchSettings>) => void;
  restore: (r: Restored) => void;
  reset: () => void;
}

export type TrackerState = TrackerData & TrackerActions;

export function initialData(): TrackerData {
  return {
    activeId: DEFAULT_ID,
    playthroughs: { [DEFAULT_ID]: { id: DEFAULT_ID, name: 'Playthrough 1', progress: emptyProgress() } },
    profile: 'everything',
    news: {},
    watch: { enabled: true, mode: 'sync' },
  };
}

export const activeProgress = (s: TrackerData): Progress =>
  (s.playthroughs[s.activeId] ?? Object.values(s.playthroughs)[0]).progress;

/** Envelope for the prototype's localStorage, so its progress carries over on first load. */
function legacyEnvelope(name: string): string | null {
  if (name !== STORE_KEY) return null;
  const raw = readRaw(PROTOTYPE_LS_KEY);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  const { progress, profile } = fromPrototypeState(parsed);
  const data = initialData();
  data.playthroughs[DEFAULT_ID].progress = progress;
  if (profile) data.profile = profile;
  return JSON.stringify({ state: data, version: STORE_VERSION });
}

/** Validates persisted data, dropping anything malformed. */
export function normalizeData(raw: unknown): TrackerData {
  const data = initialData();
  if (!isObj(raw)) return data;
  if (isObj(raw.playthroughs)) {
    const list: Record<string, Playthrough> = {};
    for (const [id, pt] of Object.entries(raw.playthroughs)) {
      if (!isObj(pt)) continue;
      list[id] = {
        id,
        name: typeof pt.name === 'string' ? pt.name : id,
        progress: normalizeProgress(pt.progress),
      };
    }
    if (Object.keys(list).length) data.playthroughs = list;
  }
  data.activeId =
    typeof raw.activeId === 'string' && raw.activeId in data.playthroughs
      ? raw.activeId
      : Object.keys(data.playthroughs)[0];
  if (raw.profile === 'journal' || raw.profile === 'trophies' || raw.profile === 'everything') {
    data.profile = raw.profile;
  }
  if (isObj(raw.watch)) {
    const w = raw.watch;
    data.watch = {
      enabled: w.enabled !== false,
      mode: w.mode === 'add' ? 'add' : 'sync',
      slot: typeof w.slot === 'string' ? w.slot : undefined,
      fileName: typeof w.fileName === 'string' ? w.fileName : undefined,
      lastModified: typeof w.lastModified === 'number' ? w.lastModified : undefined,
    };
  }
  if (isObj(raw.news)) {
    for (const [k, v] of Object.entries(raw.news)) if (v === true) data.news[k as NavKey] = true;
  }
  return data;
}

export const useTracker = create<TrackerState>()(
  persist(
    (set, get) => {
      const update = (fn: (p: Progress) => Progress, extra: Partial<TrackerData> = {}) =>
        set((s) => {
          const pt = s.playthroughs[s.activeId];
          return {
            ...extra,
            playthroughs: { ...s.playthroughs, [s.activeId]: { ...pt, progress: fn(pt.progress) } },
          };
        });

      return {
        ...initialData(),

        toggle(id) {
          const before = activeProgress(get());
          const on = !isOn(before, id);
          const checks = { ...before.checks };
          if (on) checks[id] = true;
          else delete checks[id];
          const next: Progress = { ...before, checks, overrides: { ...before.overrides, [id]: 'manual' } };
          const earned = on ? newlyEarned(evaluateTrophies(before), evaluateTrophies(next)) : [];
          update(() => next, earned.length ? { news: { ...get().news, trophies: true } } : {});
          return { on, earned };
        },

        setChecks(ids, on) {
          update((p) => {
            const checks = { ...p.checks };
            const overrides = { ...p.overrides };
            for (const id of ids) {
              if (on) checks[id] = true;
              else delete checks[id];
              overrides[id] = 'manual';
            }
            return { ...p, checks, overrides };
          });
        },

        setValue(id, value) {
          update((p) => ({
            ...p,
            values: { ...p.values, [id]: clampValue(id, value) },
            overrides: { ...p.overrides, [id]: 'manual' },
          }));
        },

        setDifficulty(d) {
          update((p) => {
            const next = { ...p };
            if (d === undefined) delete next.difficulty;
            else next.difficulty = d;
            return next;
          });
        },

        addCustom(text) {
          const t = text.trim();
          if (!t) return;
          const id = `cu.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
          update((p) => ({ ...p, custom: [...p.custom, { id, t }] }));
        },

        removeCustom(id) {
          update((p) => {
            const checks = { ...p.checks };
            delete checks[id];
            return { ...p, checks, custom: p.custom.filter((g) => g.id !== id) };
          });
        },

        setProfile(profile) {
          set({ profile });
        },

        clearNews(key) {
          const news = get().news;
          if (!news[key]) return;
          const next = { ...news };
          delete next[key];
          set({ news: next });
        },

        importSave(det, meta, difficulty, mode) {
          const before = activeProgress(get());
          const out = applyImport(before, det, meta, difficulty, mode);
          const gained = evaluateTrophies(out.next).earned - evaluateTrophies(before).earned;
          const news = { ...get().news };
          out.news.forEach((k) => (news[k] = true));
          if (gained > 0) news.trophies = true;
          update(() => out.next, { news });
          return { added: out.added, removed: out.removed, trophiesGained: Math.max(0, gained) };
        },

        setWatch(patch) {
          set({ watch: { ...get().watch, ...patch } });
        },

        restore({ progress, profile }) {
          update(() => progress, profile ? { profile } : {});
        },

        reset() {
          update(() => emptyProgress(), { news: {} });
        },
      };
    },
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => createSafeStorage(legacyEnvelope)),
      partialize: (s): TrackerData => ({
        activeId: s.activeId,
        playthroughs: s.playthroughs,
        profile: s.profile,
        news: s.news,
        watch: s.watch,
      }),
      // Future store versions migrate here; v1 is the first.
      migrate: (persisted) => normalizeData(persisted),
      merge: (persisted, current) => ({ ...current, ...normalizeData(persisted) }),
    },
  ),
);

export const useProgress = (): Progress => useTracker(activeProgress);

const scoreCache = new WeakMap<Progress, Scores>();

/** Scores for a progress object, memoized per (immutable) progress. */
export function scoresFor(p: Progress): Scores {
  let s = scoreCache.get(p);
  if (!s) {
    s = computeScores(p);
    scoreCache.set(p, s);
  }
  return s;
}

/** Trophy and profile scores for the active playthrough, recomputed only when progress changes. */
export function useScores(): Scores {
  const p = useProgress();
  return useMemo(() => scoresFor(p), [p]);
}
