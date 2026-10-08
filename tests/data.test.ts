// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LEGACY_SHARED_IDS, LOCATIONS, WORLDS } from '../src/games/kh2/data/locations';
import { TROPHIES } from '../src/games/kh2/data/trophies';
import { KEYBLADES } from '../src/games/kh2/data/keyblades';
import { ITEM_BY_ID, ITEMS, SECTION_ITEMS, TROPHY_ITEM_IDS } from '../src/games/kh2/model/items';
import { WORLD_ROUTE_IDS } from '../src/games/kh2/data/worldIds';

describe('location data', () => {
  it('has 317 chests, 89 rewards and 52 story bosses across 15 worlds', () => {
    const count = (t: string) => LOCATIONS.filter((l) => l.type === t).length;
    expect(count('chest')).toBe(317);
    expect(count('reward')).toBe(89);
    expect(count('boss')).toBe(52);
    expect(WORLDS.map((w) => w.routeId)).toEqual([...WORLD_ROUTE_IDS]);
  });

  it('gives every location a unique id, suffixing truncated-key collisions', () => {
    expect(new Set(LOCATIONS.map((l) => l.id)).size).toBe(LOCATIONS.length);
    expect(LEGACY_SHARED_IDS['w.ElephantGraveyardMythril']).toEqual([
      'w.ElephantGraveyardMythril',
      'w.ElephantGraveyardMythril-2',
    ]);
    expect(Object.keys(LEGACY_SHARED_IDS)).toHaveLength(5);
  });

  it('has 40 map pickups', () => {
    expect(SECTION_ITEMS.maps).toHaveLength(40);
  });
});

describe('item registry', () => {
  it('has unique ids', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it('keeps the prototype id formats', () => {
    for (const id of [
      'r.1',
      'r.13',
      'kb.hero-s-crest',
      'kb.winner-s-proof',
      'do.saix',
      'cup.titan-paradox-cup',
    ]) {
      expect(ITEM_BY_ID.has(id), id).toBe(true);
    }
    for (const id of [
      'js.charfiles',
      'pz.awakening',
      'mg.a-new-day-is-dawning',
      'mu.12',
      'pg.5',
      'sm.peter',
    ]) {
      expect(ITEM_BY_ID.has(id), id).toBe(true);
    }
    expect(KEYBLADES).toHaveLength(24);
  });

  it('every trophy rule points at real items', () => {
    for (const id of TROPHY_ITEM_IDS) expect(ITEM_BY_ID.has(id), id).toBe(true);
  });

  it('tags items with the definitions they count toward', () => {
    expect(ITEM_BY_ID.get('r.1')?.tags).toEqual(['journal', 'trophy', 'everything']);
    expect(ITEM_BY_ID.get('as.vexen')?.tags).toEqual(['everything']);
    expect(ITEM_BY_ID.get('w.Axel2')?.tags).toEqual(['trophy', 'everything']);
  });
});

describe('trophies', () => {
  it('has 51 trophies: 1 Platinum, 2 Gold, 8 Silver, 40 Bronze', () => {
    expect(TROPHIES).toHaveLength(51);
    const tiers = (t: string) => TROPHIES.filter((x) => x.tier === t).length;
    expect([tiers('P'), tiers('G'), tiers('S'), tiers('B')]).toEqual([1, 2, 8, 40]);
    expect(new Set(TROPHIES.map((t) => t.id)).size).toBe(51);
  });
});
