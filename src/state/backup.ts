import { isProfile, type Profile } from '../model/scoring';
import type { Progress } from '../model/types';
import { fromPrototypeState, isObj, normalizeProgress, type Restored } from './migrations';

export const BACKUP_APP = 'kh2fm-100';
export const BACKUP_VERSION = 3;

/**
 * Parses a backup code: the prototype's `{ app: 'kh2fm-100', v: 1 | 2, s }` or ours (`v: 3`).
 * Returns null when the text isn't a backup from this tracker.
 */
export function parseBackup(text: string): Restored | null {
  let o: unknown;
  try {
    o = JSON.parse(text.trim());
  } catch {
    return null;
  }
  if (!isObj(o) || o.app !== BACKUP_APP || !isObj(o.s)) return null;
  if (o.v === BACKUP_VERSION) {
    return { progress: normalizeProgress(o.s), profile: isProfile(o.s.profile) ? o.s.profile : undefined };
  }
  // v1, v2 and unversioned codes all share the prototype's state shape.
  return fromPrototypeState(o.s);
}

export function serializeBackup(progress: Progress, profile: Profile): string {
  return JSON.stringify({ app: BACKUP_APP, v: BACKUP_VERSION, s: { ...progress, profile } });
}
