import { isObj } from './backup';
import { isOn, valueOf } from './progress';
import type { Catalog, ImportMeta, Progress, TrophyEvaluation } from './types';

/**
 * What one save import changed, kept so the Status screen can show "latest changes" after the fact.
 * Stores ids only; names come from the catalog when it's shown, so the persisted copy stays small.
 */
export interface ImportReport {
  at: string;
  slot: string;
  /** Sora's level at the import before this one, when there was one. */
  lvFrom?: number;
  lv: number;
  world: string;
  /** Items checked by this import. */
  checked: string[];
  /** Items this import unchecked (Sync mode, when the save disagrees). */
  unchecked: number;
  /** Level and counter items that went up: [id, from, to]. */
  raised: [string, number, number][];
  /** Trophies (Platinum included) newly earned. */
  trophies: string[];
}

/** Compares progress before and after an import. */
export function buildImportReport(
  cat: Catalog,
  before: Progress,
  after: Progress,
  meta: ImportMeta,
  trophiesBefore: TrophyEvaluation,
  trophiesAfter: TrophyEvaluation,
): ImportReport {
  const checked: string[] = [];
  let unchecked = 0;
  const raised: [string, number, number][] = [];
  for (const item of cat.items) {
    if (item.kind === 'check') {
      const was = isOn(before, item.id);
      const now = isOn(after, item.id);
      if (now && !was) checked.push(item.id);
      else if (was && !now) unchecked++;
    } else {
      const was = valueOf(cat, before, item.id);
      const now = valueOf(cat, after, item.id);
      if (now > was) raised.push([item.id, was, now]);
    }
  }
  const had = new Set(trophiesBefore.list.filter((t) => t.earned).map((t) => t.id));
  const trophies = trophiesAfter.list.filter((t) => t.earned && !had.has(t.id)).map((t) => t.id);
  return {
    at: meta.at,
    slot: meta.slot,
    lvFrom: before.lastImport?.lv,
    lv: meta.lv,
    world: meta.world,
    checked,
    unchecked,
    raised,
    trophies,
  };
}

/** Whether a report is worth replacing the last one with. A save with nothing new keeps the old report. */
export function reportHasChanges(r: ImportReport): boolean {
  return (
    r.checked.length > 0 ||
    r.unchecked > 0 ||
    r.raised.length > 0 ||
    r.trophies.length > 0 ||
    (r.lvFrom !== undefined && r.lv !== r.lvFrom)
  );
}

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validates a persisted report, or returns undefined if it's malformed. */
export function normalizeImportReport(raw: unknown): ImportReport | undefined {
  if (!isObj(raw) || !isStr(raw.at) || !isStr(raw.slot) || !isNum(raw.lv)) return undefined;
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter(isStr) : []);
  return {
    at: raw.at,
    slot: raw.slot,
    lvFrom: isNum(raw.lvFrom) ? raw.lvFrom : undefined,
    lv: raw.lv,
    world: isStr(raw.world) ? raw.world : '',
    checked: ids(raw.checked),
    unchecked: isNum(raw.unchecked) ? raw.unchecked : 0,
    raised: Array.isArray(raw.raised)
      ? raw.raised.filter(
          (r): r is [string, number, number] =>
            Array.isArray(r) && r.length === 3 && isStr(r[0]) && isNum(r[1]) && isNum(r[2]),
        )
      : [],
    trophies: ids(raw.trophies),
  };
}
