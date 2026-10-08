import { isDifficulty, SAVE_WORLD_NAMES } from '../data/constants';
import { FINAL_XEMNAS_ID, LEGACY_SHARED_IDS } from '../data/locations';
import { ITEM_BY_ID } from '../model/items';
import { emptyProgress } from '../model/progress';
import { isProfile, type Profile } from '../model/scoring';
import type { CustomGoal, ImportMeta, Progress } from '../model/types';

/** localStorage key the prototype used. Read once to carry progress over. */
export const PROTOTYPE_LS_KEY = 'kh2fm-100-tracker-v1';

type Obj = Record<string, unknown>;
export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface Restored {
  progress: Progress;
  profile?: Profile;
}

function customGoals(v: unknown): CustomGoal[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (x): x is CustomGoal =>
      isObj(x) && typeof x.id === 'string' && !!x.id && typeof x.t === 'string' && !!x.t,
  );
}

function checksFrom(v: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!isObj(v)) return out;
  for (const [id, on] of Object.entries(v)) {
    if (on !== true) continue;
    // Prototype ids that collided after key truncation stood for every row sharing them.
    for (const target of LEGACY_SHARED_IDS[id] ?? [id]) out[target] = true;
  }
  return out;
}

/** Numeric values. Prototype levels map `sora` to `lv.sora`, keeping only known level items. */
function valuesFrom(v: unknown, keyPrefix: string, knownItemsOnly: boolean): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(v)) return out;
  for (const [k, raw] of Object.entries(v)) {
    const id = keyPrefix + k;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    const item = ITEM_BY_ID.get(id);
    if (item?.kind === 'check') continue;
    if (knownItemsOnly && !item) continue;
    out[id] = n;
  }
  return out;
}

function importMetaFrom(v: unknown): ImportMeta | undefined {
  if (!isObj(v)) return undefined;
  const str = (x: unknown) => (typeof x === 'string' ? x : '');
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
  const world = str(v.world);
  let worldId = typeof v.worldId === 'number' ? v.worldId : undefined;
  if (worldId === undefined) {
    const hit = Object.entries(SAVE_WORLD_NAMES).find(([, n]) => n === world);
    if (hit) worldId = Number(hit[0]);
  }
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

/**
 * Converts the prototype's state (`{ c, lv, custom, imp, profile, diff, news }`, used in both its
 * localStorage and its v1/v2 backup codes) into a Progress. The prototype can't tell manual checks
 * from imported ones, so overrides start empty, except the game-cleared toggle: no save flag for
 * it is known to work (open question 1), so a checked one was set by hand.
 */
export function fromPrototypeState(s: unknown): Restored {
  const progress = emptyProgress();
  if (!isObj(s)) return { progress };
  progress.checks = checksFrom(s.c);
  progress.values = valuesFrom(s.lv, 'lv.', true);
  progress.custom = customGoals(s.custom);
  progress.lastImport = importMetaFrom(s.imp);
  if (isDifficulty(s.diff)) progress.difficulty = s.diff;
  if (progress.checks[FINAL_XEMNAS_ID]) progress.overrides[FINAL_XEMNAS_ID] = 'manual';
  return { progress, profile: isProfile(s.profile) ? s.profile : undefined };
}

/** Normalizes a Progress-shaped object from our own (v3) backups or storage. */
export function normalizeProgress(s: unknown): Progress {
  const progress = emptyProgress();
  if (!isObj(s)) return progress;
  progress.checks = checksFrom(s.checks);
  progress.values = valuesFrom(s.values, '', false);
  if (isObj(s.overrides)) {
    for (const [id, v] of Object.entries(s.overrides)) if (v === 'manual') progress.overrides[id] = 'manual';
  }
  progress.custom = customGoals(s.custom);
  progress.lastImport = importMetaFrom(s.lastImport);
  if (isDifficulty(s.difficulty)) progress.difficulty = s.difficulty;
  return progress;
}
