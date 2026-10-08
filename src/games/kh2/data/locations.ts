import raw from './locations.json';
import { WORLD_KEYS, type WorldKey } from './constants';
import type { WorldRouteId } from './worldIds';

export type LocationType = 'chest' | 'reward' | 'boss';

export interface LocationDef {
  /** Item id, `w.<key>`; matches the prototype except for the de-duplicated keys below. */
  id: string;
  name: string;
  /** Visit tag from the data (TT3, TWTNW2, …); empty when the data has none. */
  visitTag: string;
  world: WorldKey;
  offset: number;
  bit: number;
  type: LocationType;
}

export interface WorldDef {
  key: WorldKey;
  routeId: WorldRouteId;
  name: string;
  locations: readonly LocationDef[];
}

const TYPE_CODES: Readonly<Record<string, LocationType>> = { c: 'chest', p: 'reward', b: 'boss' };

function isWorldKey(v: unknown): v is WorldKey {
  return typeof v === 'string' && (WORLD_KEYS as readonly string[]).includes(v);
}

function fail(what: string): never {
  throw new Error(`locations.json: ${what}`);
}

/**
 * The extractor truncates keys to 24 characters, which makes five pairs of chests share a key
 * (e.g. two "ElephantGraveyardMythril…" chests with different flags). The first keeps the
 * prototype id; later ones get `-2`, `-3`… Maps each colliding prototype id to all its new ids.
 */
export const LEGACY_SHARED_IDS: Record<string, string[]> = {};

function parse(): WorldDef[] {
  const data: unknown = raw;
  if (typeof data !== 'object' || data === null || !('worlds' in data) || !Array.isArray(data.worlds)) {
    fail('missing worlds');
  }
  const seen = new Map<string, number>();
  return data.worlds.map((w: unknown): WorldDef => {
    if (!Array.isArray(w) || w.length !== 3) fail('bad world entry');
    const [key, name, rows] = w as unknown[];
    if (!isWorldKey(key) || typeof name !== 'string' || !Array.isArray(rows)) fail('bad world header');
    const locations = rows.map((r: unknown): LocationDef => {
      if (!Array.isArray(r) || r.length !== 6) fail(`bad row in ${key}`);
      const [k, n, tag, offset, bit, t] = r as unknown[];
      if (
        typeof k !== 'string' ||
        typeof n !== 'string' ||
        typeof tag !== 'string' ||
        typeof offset !== 'number' ||
        typeof bit !== 'number' ||
        typeof t !== 'string' ||
        !(t in TYPE_CODES)
      ) {
        fail(`bad row ${String(k)}`);
      }
      const base = `w.${k}`;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      if (count > 1) {
        LEGACY_SHARED_IDS[base] = [...(LEGACY_SHARED_IDS[base] ?? [base]), id];
      }
      return { id, name: n, visitTag: tag, world: key, offset, bit, type: TYPE_CODES[t] };
    });
    return { key, routeId: key.toLowerCase() as WorldRouteId, name, locations };
  });
}

export const WORLDS: readonly WorldDef[] = parse();

export const LOCATIONS: readonly LocationDef[] = WORLDS.flatMap((w) => w.locations);

export const LOCATION_BY_ID: ReadonlyMap<string, LocationDef> = new Map(LOCATIONS.map((l) => [l.id, l]));

export const WORLD_BY_KEY: Readonly<Record<WorldKey, WorldDef>> = Object.fromEntries(
  WORLDS.map((w) => [w.key, w]),
) as Record<WorldKey, WorldDef>;

export function worldByRouteId(routeId: string): WorldDef | undefined {
  return WORLDS.find((w) => w.routeId === routeId);
}

/** The game-cleared flag. Not detected from real saves yet (open question 1), so it's usually manual. */
export const FINAL_XEMNAS_ID = 'w.FinalXemnas';

/** Map pickups count for the Journal's Maps section. */
export function isMapPickup(l: LocationDef): boolean {
  return / Map$/.test(l.name);
}
