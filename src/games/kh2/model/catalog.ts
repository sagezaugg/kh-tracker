import * as core from '../../../core/progress';
import { evaluateTrophies as coreEvaluate } from '../../../core/rules';
import type { Catalog, Progress, TrophyEvaluation } from '../../../core/types';
import { TROPHIES } from '../data/trophies';
import { DEFAULT_VALUES, ITEM_BY_ID, ITEMS, SECTION_ITEMS } from './items';

/** Same mapping as the prototype's `tabOfId`: which menu entry shows an item. */
export function navKeyOfId(id: string): string {
  const p = id.split('.')[0];
  if (p === 'w') return 'worlds';
  if (p === 'r' || p === 'pz' || p === 'mg' || p === 'js') return 'journal';
  if (p === 'kb') return 'keys';
  if (['as', 'do', 'sb', 'cup', 'mu', 'cu', 'ft', 'gm', 'ex'].includes(p)) return 'records';
  return 'drive';
}

export const KH2_CATALOG: Catalog = {
  items: ITEMS,
  itemById: ITEM_BY_ID,
  defaults: DEFAULT_VALUES,
  sectionItems: SECTION_ITEMS,
  trophies: TROPHIES,
  navKeyOf: navKeyOfId,
  // Old stored id → new id, for any item or `tro.<trophy>` that gets renamed. See Catalog.renamedIds.
  renamedIds: {},
};

export { countOn, emptyProgress, isOn } from '../../../core/progress';

export const valueOf = (p: Progress, id: string): number => core.valueOf(KH2_CATALOG, p, id);
export const clampValue = (id: string, v: number): number => core.clampValue(KH2_CATALOG, id, v);
export const evaluateTrophies = (p: Progress): TrophyEvaluation => coreEvaluate(KH2_CATALOG, p);
