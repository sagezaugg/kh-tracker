import raw from './locations.json';
import { WORLD_KEYS, type Kh1WorldKey } from './constants';

export type Kh1LocationType = 'chest' | 'reward' | 'event' | 'prize';

export interface Kh1LocationDef {
  /** `w.<Archipelago location id>`. */
  id: string;
  name: string;
  /** Name without the world prefix, for rows inside a world list. */
  short: string;
  world: Kh1WorldKey;
  type: Kh1LocationType;
  flag?: { kind: 'bit'; offset: number; bit: number } | { kind: 'atLeast'; offset: number; value: number };
}

export interface Kh1WorldDef {
  key: Kh1WorldKey;
  routeId: Kh1WorldKey;
  name: string;
  locations: readonly Kh1LocationDef[];
}

const TYPE_CODES: Readonly<Record<string, Kh1LocationType>> = { c: 'chest', r: 'reward', s: 'event', p: 'prize' };

function fail(what: string): never {
  throw new Error(`kh1 locations.json: ${what}`);
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseFlag(f: unknown): Kh1LocationDef['flag'] {
  if (!Array.isArray(f) || f.length === 0) return undefined;
  const [kind, offset, x] = f as unknown[];
  if (!isNum(offset) || !isNum(x)) fail('bad flag');
  if (kind === 'b') return { kind: 'bit', offset, bit: x };
  if (kind === 'g') return { kind: 'atLeast', offset, value: x };
  fail(`bad flag kind ${String(kind)}`);
}

const data: unknown = raw;
if (typeof data !== 'object' || data === null || !('worlds' in data) || !Array.isArray(data.worlds)) {
  fail('missing worlds');
}

export const KH1_WORLDS: readonly Kh1WorldDef[] = (data.worlds as unknown[]).map((w): Kh1WorldDef => {
  if (!Array.isArray(w) || w.length !== 3) fail('bad world');
  const [key, name, rows] = w as unknown[];
  if (typeof key !== 'string' || !(WORLD_KEYS as readonly string[]).includes(key) || typeof name !== 'string') {
    fail('bad world header');
  }
  if (!Array.isArray(rows)) fail('bad rows');
  const wk = key as Kh1WorldKey;
  const locations = rows.map((r: unknown): Kh1LocationDef => {
    if (!Array.isArray(r) || r.length !== 4) fail('bad row');
    const [id, n, t, flag] = r as unknown[];
    if (typeof id !== 'string' || typeof n !== 'string' || typeof t !== 'string' || !(t in TYPE_CODES)) {
      fail(`bad row ${String(id)}`);
    }
    const short = n.startsWith(`${name} `) ? n.slice(name.length + 1) : n;
    return { id, name: n, short, world: wk, type: TYPE_CODES[t], flag: parseFlag(flag) };
  });
  return { key: wk, routeId: wk, name, locations };
});

export const KH1_LOCATIONS: readonly Kh1LocationDef[] = KH1_WORLDS.flatMap((w) => w.locations);

export const KH1_LOCATION_BY_ID: ReadonlyMap<string, Kh1LocationDef> = new Map(KH1_LOCATIONS.map((l) => [l.id, l]));

const BY_NAME: ReadonlyMap<string, Kh1LocationDef> = new Map(KH1_LOCATIONS.map((l) => [l.name, l]));

/** Location id by exact Archipelago name; throws if the data changed under us. */
export function locationId(name: string): string {
  const l = BY_NAME.get(name);
  if (!l) throw new Error(`kh1: no location named "${name}"`);
  return l.id;
}

/** Ansem Report n → its Journal flag (byte, bit), from the AP connector's report bits. */
export const REPORT_FLAGS: readonly { n: number; offset: number; bit: number }[] = (
  (data as { reports?: unknown }).reports as unknown[] | undefined ?? []
).map((r) => {
  if (!Array.isArray(r) || !r.every(isNum)) fail('bad report');
  const [n, offset, bit] = r as number[];
  return { n, offset, bit };
});

export function kh1WorldByRouteId(routeId: string): Kh1WorldDef | undefined {
  return KH1_WORLDS.find((w) => w.routeId === routeId);
}
