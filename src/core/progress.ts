import type { Catalog, Progress } from './types';

export function emptyProgress(): Progress {
  return { checks: {}, values: {}, overrides: {}, custom: [] };
}

export const isOn = (p: Progress, id: string): boolean => p.checks[id] === true;

export const countOn = (p: Progress, ids: readonly string[]): number =>
  ids.filter((id) => isOn(p, id)).length;

/** A stored number, or 0. For values that aren't catalog items (synthesis counts and the like). */
export function rawValue(p: Progress, key: string): number {
  const v = p.values[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** A level/counter value, falling back to its starting value. */
export function valueOf(cat: Catalog, p: Progress, id: string): number {
  const v = p.values[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : (cat.defaults[id] ?? 0);
}

/** Clamps a value into its item's stepper range (non-items: 0 and up). */
export function clampValue(cat: Catalog, id: string, v: number): number {
  const item = cat.itemById.get(id);
  const lo = item?.min ?? 0;
  const hi = item?.max ?? Number.MAX_SAFE_INTEGER;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
