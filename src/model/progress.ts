import { DEFAULT_VALUES, ITEM_BY_ID } from './items';
import type { Progress } from './types';

export function emptyProgress(): Progress {
  return { checks: {}, values: {}, overrides: {}, custom: [] };
}

export const isOn = (p: Progress, id: string): boolean => p.checks[id] === true;

/** A level/counter value, falling back to its starting value. */
export function valueOf(p: Progress, id: string): number {
  const v = p.values[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : (DEFAULT_VALUES[id] ?? 0);
}

/** Clamps a value into its item's stepper range. */
export function clampValue(id: string, v: number): number {
  const item = ITEM_BY_ID.get(id);
  const lo = item?.min ?? 0;
  const hi = item?.max ?? Number.MAX_SAFE_INTEGER;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

export const countOn = (p: Progress, ids: readonly string[]): number =>
  ids.filter((id) => isOn(p, id)).length;
