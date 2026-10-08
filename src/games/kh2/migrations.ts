import { customGoals, importMetaFrom, isObj, type Restored } from '../../core/backup';
import { emptyProgress } from '../../core/progress';
import { isDifficulty, SAVE_WORLD_NAMES } from './data/constants';
import { FINAL_XEMNAS_ID, LEGACY_SHARED_IDS } from './data/locations';
import { ITEM_BY_ID } from './model/items';
import { isProfile } from './model/scoring';

const worldIdOf = (name: string): number | undefined => {
  const hit = Object.entries(SAVE_WORLD_NAMES).find(([, n]) => n === name);
  return hit ? Number(hit[0]) : undefined;
};

/**
 * Converts the prototype's state (`{ c, lv, custom, imp, profile, diff, news }`, as found in its
 * v1/v2 backup codes) into a Progress. The prototype can't tell manual checks from imported ones,
 * so overrides start empty, except the game-cleared toggle: no save flag for it is known to work
 * (open question 1), so a checked one was set by hand.
 */
export function fromPrototypeState(s: unknown): Restored {
  const progress = emptyProgress();
  if (!isObj(s)) return { progress };
  if (isObj(s.c)) {
    for (const [id, on] of Object.entries(s.c)) {
      if (on !== true) continue;
      // Prototype ids that collided after key truncation stood for every row sharing them.
      for (const target of LEGACY_SHARED_IDS[id] ?? [id]) progress.checks[target] = true;
    }
  }
  if (isObj(s.lv)) {
    for (const [k, raw] of Object.entries(s.lv)) {
      const id = `lv.${k}`;
      const n = Number(raw);
      const item = ITEM_BY_ID.get(id);
      if (item && item.kind !== 'check' && Number.isFinite(n)) progress.values[id] = n;
    }
  }
  progress.custom = customGoals(s.custom);
  progress.lastImport = importMetaFrom(s.imp, worldIdOf);
  if (isDifficulty(s.diff)) progress.difficulty = s.diff;
  if (progress.checks[FINAL_XEMNAS_ID]) progress.overrides[FINAL_XEMNAS_ID] = 'manual';
  return { progress, profile: isProfile(s.profile) ? s.profile : undefined };
}
