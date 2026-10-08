import type { Item } from '../core/types';
import type { RowSpec } from './ItemSection';

/** Checklist rows for registry items. Save-probed items carry the green dot. */
export function rowsOf(items: readonly Item[]): RowSpec[] {
  return items.map((i) => ({ id: i.id, name: i.name, tag: i.tag, auto: i.probe !== undefined }));
}
