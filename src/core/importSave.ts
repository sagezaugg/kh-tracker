import { valueOf } from './progress';
import type { Catalog, Detected, ImportMeta, Progress, SaveSlot } from './types';

export type ImportMode = 'sync' | 'add';

export interface ImportOutcome {
  next: Progress;
  added: number;
  removed: number;
  /** Menu entries that gained something. */
  news: string[];
}

export function importMeta(fileName: string, slot: SaveSlot, at = new Date()): ImportMeta {
  return {
    file: fileName,
    slot: slot.label,
    lv: slot.lv,
    munny: slot.munny,
    world: slot.world,
    worldId: slot.worldId,
    diff: slot.diffName,
    at: at.toISOString(),
  };
}

/**
 * Applies detected save values to progress. `sync` makes every save-detected item match the slot;
 * `add` never unchecks or lowers anything. Either way, items the user set by hand (overrides) are
 * left alone, and items without a save flag are never touched.
 */
export function applyImport(
  cat: Catalog,
  p: Progress,
  det: Detected,
  meta: ImportMeta,
  difficulty: number | null,
  mode: ImportMode,
): ImportOutcome {
  const checks = { ...p.checks };
  const values = { ...p.values };
  const news = new Set<string>();
  let added = 0;
  let removed = 0;

  for (const [id, v] of Object.entries(det.checks)) {
    if (p.overrides[id]) continue;
    const was = checks[id] === true;
    if (v && !was) {
      checks[id] = true;
      added++;
      news.add(cat.navKeyOf(id));
    } else if (!v && was && mode === 'sync') {
      delete checks[id];
      removed++;
    }
  }
  for (const [id, v] of Object.entries(det.values)) {
    if (p.overrides[id]) continue;
    const was = valueOf(cat, p, id);
    const nv = mode === 'sync' ? v : Math.max(was, v);
    if (nv > was) news.add(cat.navKeyOf(id));
    values[id] = nv;
  }

  const next: Progress = {
    ...p,
    checks,
    values,
    lastImport: meta,
    difficulty: difficulty ?? p.difficulty,
  };
  return { next, added, removed, news: [...news] };
}

export interface ImportCounts {
  added: number;
  removed: number;
  trophiesGained: number;
}

/** "Slot 1: 3 newly checked, 1 unchecked, 1 trophy earned." */
export function importSummary(slotLabel: string, c: ImportCounts): string {
  return (
    `${slotLabel}: ${c.added} newly checked` +
    (c.removed ? `, ${c.removed} unchecked` : '') +
    (c.trophiesGained > 0
      ? `, ${c.trophiesGained} ${c.trophiesGained === 1 ? 'trophy' : 'trophies'} earned`
      : '') +
    '.'
  );
}

/** The slot to re-import: the one with the remembered label, or the only slot in the file. */
export function pickSlot<T extends { label: string }>(
  slots: readonly T[],
  label: string | undefined,
): T | undefined {
  return slots.find((s) => s.label === label) ?? (slots.length === 1 ? slots[0] : undefined);
}
