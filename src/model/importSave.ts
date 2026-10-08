import type { NavKey } from '../routes/nav';
import type { Detected } from '../save/detect';
import type { SaveSlot } from '../save/parseSave';
import { valueOf } from './progress';
import type { ImportMeta, Progress } from './types';

export type ImportMode = 'sync' | 'add';

/** Which menu entry shows an item (for NEW! tags). Same mapping as the prototype's `tabOfId`. */
export function navKeyOfId(id: string): NavKey {
  const p = id.split('.')[0];
  if (p === 'w') return 'worlds';
  if (p === 'r' || p === 'pz' || p === 'mg' || p === 'js') return 'journal';
  if (p === 'kb') return 'keys';
  if (['as', 'do', 'sb', 'cup', 'mu', 'cu', 'ft', 'gm', 'ex'].includes(p)) return 'records';
  return 'drive';
}

export interface ImportOutcome {
  next: Progress;
  added: number;
  removed: number;
  /** Menu entries that gained something. */
  news: NavKey[];
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
  p: Progress,
  det: Detected,
  meta: ImportMeta,
  difficulty: Progress['difficulty'] | null,
  mode: ImportMode,
): ImportOutcome {
  const checks = { ...p.checks };
  const values = { ...p.values };
  const news = new Set<NavKey>();
  let added = 0;
  let removed = 0;

  for (const [id, v] of Object.entries(det.checks)) {
    if (p.overrides[id]) continue;
    const was = checks[id] === true;
    if (v && !was) {
      checks[id] = true;
      added++;
      news.add(navKeyOfId(id));
    } else if (!v && was && mode === 'sync') {
      delete checks[id];
      removed++;
    }
  }
  for (const [id, v] of Object.entries(det.values)) {
    if (p.overrides[id]) continue;
    const was = valueOf(p, id);
    const nv = mode === 'sync' ? v : Math.max(was, v);
    if (nv > was) news.add('drive');
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
