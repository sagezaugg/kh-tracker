import { emptyProgress } from './progress';
import type { Catalog, CustomGoal, ImportMeta, Progress } from './types';

export const BACKUP_VERSION = 3;

type Obj = Record<string, unknown>;
export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface Restored {
  progress: Progress;
  profile?: string;
}

export function customGoals(v: unknown): CustomGoal[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (x): x is CustomGoal =>
      isObj(x) && typeof x.id === 'string' && !!x.id && typeof x.t === 'string' && !!x.t,
  );
}

export function importMetaFrom(
  v: unknown,
  worldIdOf?: (name: string) => number | undefined,
): ImportMeta | undefined {
  if (!isObj(v)) return undefined;
  const str = (x: unknown) => (typeof x === 'string' ? x : '');
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
  const world = str(v.world);
  const worldId = typeof v.worldId === 'number' ? v.worldId : worldIdOf?.(world);
  return {
    file: str(v.file),
    slot: str(v.slot),
    lv: num(v.lv),
    munny: num(v.munny),
    world,
    worldId,
    diff: str(v.diff),
    at: str(v.at),
  };
}

/** Numeric values; drops anything that names a check item. */
export function valuesFrom(cat: Catalog, v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(v)) return out;
  for (const [id, raw] of Object.entries(v)) {
    const n = Number(raw);
    if (Number.isFinite(n) && cat.itemById.get(id)?.kind !== 'check') out[id] = n;
  }
  return out;
}

/** Validates a Progress-shaped object from storage or a v3 backup. */
export function normalizeProgress(cat: Catalog, s: unknown, maxDifficulty: number): Progress {
  const progress = emptyProgress();
  if (!isObj(s)) return progress;
  if (isObj(s.checks)) {
    for (const [id, on] of Object.entries(s.checks)) if (on === true) progress.checks[id] = true;
  }
  progress.values = valuesFrom(cat, s.values);
  if (isObj(s.overrides)) {
    for (const [id, v] of Object.entries(s.overrides)) if (v === 'manual') progress.overrides[id] = 'manual';
  }
  progress.custom = customGoals(s.custom);
  progress.lastImport = importMetaFrom(s.lastImport);
  const d = s.difficulty;
  if (typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= maxDifficulty) progress.difficulty = d;
  return progress;
}

export interface BackupFormat {
  /** App id written into codes, e.g. "kh2fm-100". */
  app: string;
  catalog: Catalog;
  maxDifficulty: number;
  isProfile: (v: unknown) => boolean;
  /** Older code shapes for this app (anything that isn't v3). */
  legacy?: (s: unknown) => Restored;
}

/** Parses a backup code for one game. Returns null when the text isn't one of its codes. */
export function parseBackup(fmt: BackupFormat, text: string): Restored | null {
  let o: unknown;
  try {
    o = JSON.parse(text.trim());
  } catch {
    return null;
  }
  if (!isObj(o) || o.app !== fmt.app || !isObj(o.s)) return null;
  if (o.v === BACKUP_VERSION) {
    const profile = fmt.isProfile(o.s.profile) ? (o.s.profile as string) : undefined;
    return { progress: normalizeProgress(fmt.catalog, o.s, fmt.maxDifficulty), profile };
  }
  return fmt.legacy ? fmt.legacy(o.s) : null;
}

export function serializeBackup(app: string, progress: Progress, profile: string): string {
  return JSON.stringify({ app, v: BACKUP_VERSION, s: { ...progress, profile } });
}
