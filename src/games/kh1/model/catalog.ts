import * as core from '../../../core/progress';
import { evaluateTrophies as coreEvaluate } from '../../../core/rules';
import type { Catalog, Progress, TrophyEvaluation } from '../../../core/types';
import { KH1_TROPHIES } from '../data/trophies';
import { KH1_DEFAULT_VALUES, KH1_ITEM_BY_ID, KH1_ITEMS, KH1_SECTION_ITEMS } from './items';

/** Which KH1 menu entry shows an item (for NEW! tags). */
export function kh1NavKeyOf(id: string): string {
  const p = id.split('.')[0];
  if (p === 'w') return 'worlds';
  if (p === 'r' || p === 'js' || id === 'kh1.puppies' || id === 'kh1.trinity') return 'journal';
  if (p === 'kb' || p === 'st' || p === 'sh') return 'equipment';
  if (p === 'syn' || p === 'mat') return 'synthesis';
  if (p === 'lv' || p === 'sm') return 'abilities';
  return 'records';
}

export const KH1_CATALOG: Catalog = {
  items: KH1_ITEMS,
  itemById: KH1_ITEM_BY_ID,
  defaults: KH1_DEFAULT_VALUES,
  sectionItems: KH1_SECTION_ITEMS,
  trophies: KH1_TROPHIES,
  navKeyOf: kh1NavKeyOf,
  // Old stored id → new id, for any item or `tro.<trophy>` that gets renamed. See Catalog.renamedIds.
  renamedIds: {},
};

export { countOn, isOn } from '../../../core/progress';
export const valueOf = (p: Progress, id: string): number => core.valueOf(KH1_CATALOG, p, id);
export const evaluateTrophies = (p: Progress): TrophyEvaluation => coreEvaluate(KH1_CATALOG, p);
