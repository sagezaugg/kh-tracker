import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Restored } from './backup';
import { isObj, normalizeProgress } from './backup';
import { applyImport, type ImportMode } from './importSave';
import {
  buildImportReport,
  normalizeImportReport,
  reportHasChanges,
  type ImportReport,
} from './importReport';
import { clampValue, emptyProgress, isOn } from './progress';
import { evaluateTrophies, newlyEarned } from './rules';
import { createSafeStorage } from './storage';
import type { Catalog, Detected, ImportMeta, Progress, TrophyStatus } from './types';

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
  profile: string;
  /** Menu entries (nav keys) showing NEW!. */
  news: Record<string, boolean>;
  watch: WatchSettings;
  /** Per playthrough id: the latest import that changed something. */
  reports: Record<string, ImportReport>;
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

export interface TrackerActions {
  /** A check changed by hand. Records an override so a later Sync leaves it alone. */
  toggle: (id: string) => ToggleResult;
  /** Bulk change by hand ("Check all", "Clear"). */
  setChecks: (ids: readonly string[], on: boolean) => void;
  setValue: (id: string, value: number) => void;
  setDifficulty: (d: number | undefined) => void;
  addCustom: (text: string) => void;
  removeCustom: (id: string) => void;
  setProfile: (p: string) => void;
  clearNews: (key: string) => void;
  /** Dismisses the active playthrough's latest-changes report. */
  clearReport: () => void;
  importSave: (det: Detected, meta: ImportMeta, difficulty: number | null, mode: ImportMode) => ImportSummary;
  setWatch: (patch: Partial<WatchSettings>) => void;
  restore: (r: Restored) => void;
  reset: () => void;
}

export type TrackerState = TrackerData & TrackerActions;
export type TrackerStore = UseBoundStore<StoreApi<TrackerState>>;

export interface StoreConfig {
  storageKey: string;
  catalog: Catalog;
  profiles: readonly string[];
  defaultProfile: string;
  maxDifficulty: number;
}

export const activeProgress = (s: TrackerData): Progress =>
  (s.playthroughs[s.activeId] ?? Object.values(s.playthroughs)[0]).progress;

/** Creates one game's persisted tracker store. */
export function createTrackerStore(cfg: StoreConfig): TrackerStore {
  const { catalog } = cfg;

  const initialData = (): TrackerData => ({
    activeId: DEFAULT_ID,
    playthroughs: { [DEFAULT_ID]: { id: DEFAULT_ID, name: 'Playthrough 1', progress: emptyProgress() } },
    profile: cfg.defaultProfile,
    news: {},
    watch: { enabled: true, mode: 'sync' },
    reports: {},
  });

  /** Validates persisted data, dropping anything malformed. */
  const normalizeData = (raw: unknown): TrackerData => {
    const data = initialData();
    if (!isObj(raw)) return data;
    if (isObj(raw.playthroughs)) {
      const list: Record<string, Playthrough> = {};
      for (const [id, pt] of Object.entries(raw.playthroughs)) {
        if (!isObj(pt)) continue;
        list[id] = {
          id,
          name: typeof pt.name === 'string' ? pt.name : id,
          progress: normalizeProgress(catalog, pt.progress, cfg.maxDifficulty),
        };
      }
      if (Object.keys(list).length) data.playthroughs = list;
    }
    data.activeId =
      typeof raw.activeId === 'string' && raw.activeId in data.playthroughs
        ? raw.activeId
        : Object.keys(data.playthroughs)[0];
    if (typeof raw.profile === 'string' && cfg.profiles.includes(raw.profile)) data.profile = raw.profile;
    if (isObj(raw.news)) {
      for (const [k, v] of Object.entries(raw.news)) if (v === true) data.news[k] = true;
    }
    if (isObj(raw.reports)) {
      for (const [id, r] of Object.entries(raw.reports)) {
        const report = id in data.playthroughs ? normalizeImportReport(r) : undefined;
        if (report) data.reports[id] = report;
      }
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
    return data;
  };

  return create<TrackerState>()(
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
            const earned = on
              ? newlyEarned(evaluateTrophies(catalog, before), evaluateTrophies(catalog, next))
              : [];
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
              values: { ...p.values, [id]: clampValue(catalog, id, value) },
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

          clearReport() {
            const { reports, activeId } = get();
            if (!reports[activeId]) return;
            const next = { ...reports };
            delete next[activeId];
            set({ reports: next });
          },

          importSave(det, meta, difficulty, mode) {
            const before = activeProgress(get());
            const out = applyImport(catalog, before, det, meta, difficulty, mode);
            const tBefore = evaluateTrophies(catalog, before);
            const tAfter = evaluateTrophies(catalog, out.next);
            const gained = tAfter.earned - tBefore.earned;
            const news = { ...get().news };
            out.news.forEach((k) => (news[k] = true));
            if (gained > 0) news.trophies = true;
            const report = buildImportReport(catalog, before, out.next, meta, tBefore, tAfter);
            const reports = reportHasChanges(report)
              ? { ...get().reports, [get().activeId]: report }
              : get().reports;
            update(() => out.next, { news, reports });
            return { added: out.added, removed: out.removed, trophiesGained: Math.max(0, gained) };
          },

          setWatch(patch) {
            set({ watch: { ...get().watch, ...patch } });
          },

          restore({ progress, profile }) {
            // A restored backup makes the old "latest changes" meaningless.
            const reports = { ...get().reports };
            delete reports[get().activeId];
            update(() => progress, {
              reports,
              ...(profile && cfg.profiles.includes(profile) ? { profile } : {}),
            });
          },

          reset() {
            update(() => emptyProgress(), { news: {}, reports: {} });
          },
        };
      },
      {
        name: cfg.storageKey,
        version: STORE_VERSION,
        storage: createJSONStorage(() => createSafeStorage()),
        partialize: (s): TrackerData => ({
          activeId: s.activeId,
          playthroughs: s.playthroughs,
          profile: s.profile,
          news: s.news,
          watch: s.watch,
          reports: s.reports,
        }),
        // Future store versions migrate here; v1 is the first.
        migrate: (persisted) => normalizeData(persisted),
        merge: (persisted, current) => ({ ...current, ...normalizeData(persisted) }),
      },
    ),
  );
}

/** Fresh data for tests and resets. */
export function blankTrackerData(defaultProfile: string): TrackerData {
  return {
    activeId: DEFAULT_ID,
    playthroughs: { [DEFAULT_ID]: { id: DEFAULT_ID, name: 'Playthrough 1', progress: emptyProgress() } },
    profile: defaultProfile,
    news: {},
    watch: { enabled: true, mode: 'sync' },
    reports: {},
  };
}
