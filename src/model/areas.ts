import { LOCATIONS, type LocationDef } from '../data/locations';

/**
 * Splits a location name like "Bamboo Grove Dark Shard" into an area ("Bamboo Grove") and the item
 * inside ("Dark Shard"), so the Area hint level can hide chest contents. The data has no separate
 * area field, so this is a display heuristic over the names (not game data):
 *
 * 1. The item is the longest trailing phrase that also ends location names in three or more worlds
 *    (items repeat across worlds; area names rarely do), else in two or more.
 * 2. If that area isn't shared with another location in the same world, the longest shorter area
 *    that is shared wins ("Mansion Basement Corridor" over "Mansion Basement Corridor Ultimate").
 * 3. If the area ends in a word that starts a multi-world item ("Courtyard Blazing" + "Stone") and
 *    the area before it branches to other spots, that word moves to the item.
 * 4. Trailing copy numbers ("Potion 2") stay with the item. A few names the rules can't split are
 *    listed in AREA_OVERRIDES.
 */
export interface AreaSplit {
  area: string;
  item: string;
}

/** Hand-checked areas for names the heuristic gets wrong. Keyed by location id; null = don't split. */
const AREA_OVERRIDES: Readonly<Record<string, string | null>> = {
  'w.InterceptorsHoldFeatherC': "Interceptor's Hold",
  'w.TwilightsViewCosmicBelt': "Twilight's View",
  'w.HeartlessManufactoryCosm': 'Heartless Manufactory',
  'w.GoALostIllusion': 'GoA',
  'w.DCCourtyardBlazingStone': 'Courtyard',
  'w.DCCourtyardBlazingShard': 'Courtyard',
  'w.UnderworldEntrancePowerB': 'Underworld Entrance',
  'w.TheBeastsRoomBlazingShar': "The Beast's Room",
  'w.FinklesteinsLabHalloween': "Finklestein's Lab",
  'w.CoRMineshaftMidLevelPowe': 'Mineshaft Mid Level',
  'w.StationofSerenityPotion': 'Station of Serenity',
  'w.StationofCallingPotion': 'Station of Calling',
  'w.SorcerersLoftTowerMap': "Sorcerer's Loft",
  'w.TowerWardrobeMythrilSton': 'Tower Wardrobe',
  'w.ProofofNonexistence': null,
};

const words = (s: string) => s.split(' ');

/** Trailing phrase → worlds whose location names end with it. */
const SUFFIX_WORLDS: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const l of LOCATIONS) {
    const w = words(l.name);
    for (let i = 1; i < w.length; i++) {
      const suf = w.slice(i).join(' ');
      let set = m.get(suf);
      if (!set) m.set(suf, (set = new Set()));
      set.add(l.world);
    }
  }
  return m;
})();

const worldCount = (s: string) => SUFFIX_WORLDS.get(s)?.size ?? 0;

/** First words of multi-word item phrases found in three or more worlds ("Mythril", "Blazing"). */
const ITEM_LEAD_WORDS: Set<string> = new Set(
  [...SUFFIX_WORLDS.keys()].filter((s) => s.includes(' ') && worldCount(s) >= 3).map((s) => words(s)[0]),
);
const STOPWORDS = new Set(['The', 'of']);
const stripNumber = (name: string) => name.replace(/ \d+$/, '');

const BY_WORLD: Map<string, LocationDef[]> = (() => {
  const m = new Map<string, LocationDef[]>();
  for (const l of LOCATIONS) m.set(l.world, [...(m.get(l.world) ?? []), l]);
  return m;
})();

const others = (l: LocationDef) => (BY_WORLD.get(l.world) ?? []).filter((o) => o.id !== l.id);

function sharedPrefix(l: LocationDef, prefix: string): boolean {
  return others(l).some((o) => o.name.startsWith(prefix + ' '));
}

/** Another spot in the world starts with `prefix` but not with `area`. */
function branches(l: LocationDef, prefix: string, area: string): boolean {
  return others(l).some((o) => o.name.startsWith(prefix + ' ') && !o.name.startsWith(area + ' '));
}

function longestSharedPrefix(l: LocationDef, below: string[]): string | null {
  for (let n = below.length - 1; n >= 1; n--) {
    const p = below.slice(0, n).join(' ');
    if (STOPWORDS.has(below[n - 1])) continue;
    if (sharedPrefix(l, p)) return p;
  }
  return null;
}

function findArea(l: LocationDef): string | null {
  if (l.id in AREA_OVERRIDES) {
    const o = AREA_OVERRIDES[l.id];
    return o && l.name.startsWith(o + ' ') ? o : null;
  }
  const w = words(stripNumber(l.name));
  let area: string | null = null;
  for (const min of [3, 2]) {
    const i = w.findIndex((_, k) => k > 0 && worldCount(w.slice(k).join(' ')) >= min);
    if (i > 0) {
      area = w.slice(0, i).join(' ');
      break;
    }
  }
  if (!area) return longestSharedPrefix(l, w);
  if (!sharedPrefix(l, area)) area = longestSharedPrefix(l, words(area)) ?? area;
  const a = words(area);
  const last = a[a.length - 1];
  const before = a.slice(0, -1).join(' ');
  if (
    a.length > 1 &&
    ITEM_LEAD_WORDS.has(last) &&
    !STOPWORDS.has(a[a.length - 2]) &&
    branches(l, before, area)
  ) {
    area = before;
  }
  return area;
}

const cache = new Map<string, AreaSplit | null>();

export function splitArea(l: LocationDef): AreaSplit | null {
  if (!cache.has(l.id)) {
    const area = findArea(l);
    cache.set(l.id, area && area !== l.name ? { area, item: l.name.slice(area.length + 1) } : null);
  }
  return cache.get(l.id) ?? null;
}
