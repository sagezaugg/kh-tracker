/** URL ids for the world checklist, in the prototype's world order. */
export const WORLD_ROUTE_IDS = [
  'lod',
  'ag',
  'dc',
  'tr',
  'aw',
  'oc',
  'bc',
  'sp',
  'ht',
  'pr',
  'hb',
  'pl',
  'tt',
  'tw',
  'at',
] as const;

export type WorldRouteId = (typeof WORLD_ROUTE_IDS)[number];

export function isWorldRouteId(id: string | undefined): id is WorldRouteId {
  return id !== undefined && (WORLD_ROUTE_IDS as readonly string[]).includes(id);
}
