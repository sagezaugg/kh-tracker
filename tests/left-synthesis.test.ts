// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LOCATION_BY_ID, LOCATIONS, FINAL_XEMNAS_ID } from '../src/data/locations';
import { splitArea } from '../src/model/areas';
import { computeRemaining } from '../src/model/remaining';
import { computeSynthesis, materialIn } from '../src/model/synthesis';
import { emptyProgress } from '../src/model/progress';
import { SYN_KEYS } from '../src/data/synthesis';
import type { Progress } from '../src/model/types';

const loc = (id: string) => {
  const l = LOCATION_BY_ID.get(id);
  if (!l) throw new Error(id);
  return l;
};

describe('splitArea', () => {
  it('separates the area from the item inside', () => {
    expect(splitArea(loc('w.BambooGroveDarkShard'))).toEqual({ area: 'Bamboo Grove', item: 'Dark Shard' });
    expect(splitArea(loc('w.MansionBasementCorridorU'))).toEqual({
      area: 'Mansion Basement Corridor',
      item: 'Ultimate Recipe',
    });
    expect(splitArea(loc('w.DCCourtyardBlazingStone'))?.area).toBe('Courtyard');
    expect(splitArea(loc('w.ProofofNonexistence'))).toBeNull();
  });

  it('never leaves an empty area or item', () => {
    for (const l of LOCATIONS.filter((x) => x.type === 'chest')) {
      const s = splitArea(l);
      if (!s) continue;
      expect(s.area.length, l.name).toBeGreaterThan(0);
      expect(s.item.length, l.name).toBeGreaterThan(0);
      expect(`${s.area} ${s.item}`).toBe(l.name);
    }
  });
});

describe('computeRemaining', () => {
  it('counts every world item when nothing is done', () => {
    const r = computeRemaining(emptyProgress(), 'everything', 'world', 'full');
    expect(r.total).toBe(317 + 89 + 52);
    expect(r.groups[0].name).toBe('Twilight Town');
    expect(r.groups.map((g) => g.rows.length)).toEqual(
      [...r.groups.map((g) => g.rows.length)].sort((a, b) => b - a),
    );
    expect(r.wins).toHaveLength(3);
    expect(r.here).toBeNull();
  });

  it('filters by definition: Journal shows chests and maps only', () => {
    const r = computeRemaining(emptyProgress(), 'journal', 'world', 'full');
    const rows = r.groups.flatMap((g) => g.rows);
    expect(rows.every((x) => x.loc.type === 'chest' || x.tags.includes('Map'))).toBe(true);
    expect(r.total).toBe(317 + rows.filter((x) => x.loc.type !== 'chest').length);
  });

  it('groups by visit tag', () => {
    const r = computeRemaining(emptyProgress(), 'everything', 'visit', 'full');
    expect(r.groups.some((g) => g.name === 'Twilight Town · TT3')).toBe(true);
    expect(r.groups.reduce((a, g) => a + g.rows.length, 0)).toBe(r.total);
  });

  it('builds the saved-in banner from the last import', () => {
    const p: Progress = {
      ...emptyProgress(),
      lastImport: {
        file: 'f',
        slot: 'Slot 1',
        lv: 45,
        munny: 0,
        world: 'The World That Never Was',
        worldId: 18,
        diff: 'Critical',
        at: '',
      },
      difficulty: 3,
    };
    const r = computeRemaining(p, 'everything', 'world', 'full');
    expect(r.here?.name).toBe('The World That Never Was');
    expect(r.here?.left).toBe(33);
    expect(r.clearHint?.names).toEqual(['Critical Competitor', 'Proud Player', 'Ambitious Adventurer']);
    const cleared = computeRemaining(
      { ...p, checks: { [FINAL_XEMNAS_ID]: true } },
      'everything',
      'world',
      'full',
    );
    expect(cleared.clearHint).toBeNull();
  });

  it('tags Ultima materials and hides details in counts-only mode', () => {
    const r = computeRemaining(emptyProgress(), 'everything', 'world', 'counts');
    const row = r.groups.flatMap((g) => g.rows).find((x) => x.id === 'w.SunsetTerraceOrichalcumP');
    expect(row?.tags).toEqual(['Chest', 'Ultima']);
    expect(r.beyond.find((b) => b.title === 'Keyblades')).toMatchObject({ done: 0, total: 24, detail: null });
  });
});

describe('computeSynthesis', () => {
  it('needs 13 Orichalcum+ by default and 7 with an Energy Crystal', () => {
    const base = computeSynthesis(emptyProgress());
    expect(base.ingredients.map((i) => [i.mat.name, i.need])).toEqual([
      ['Orichalcum+', 13],
      ['Orichalcum', 1],
      ['Mythril Crystal', 1],
      ['Dense Crystal', 1],
      ['Twilight Crystal', 1],
      ['Serenity Crystal', 3],
    ]);
    const ec = computeSynthesis({ ...emptyProgress(), values: { [SYN_KEYS.energy]: 1 } });
    expect(ec.ingredients[0].need).toBe(7);
    expect(ec.ingredients.map((i) => i.mat.name)).toContain('Energy Crystal');
  });

  it('fills Orichalcum+ sources from checks and counts ready materials from manual values', () => {
    const p: Progress = {
      ...emptyProgress(),
      checks: { 'w.StarryHillOrichalcumPlus': true, 'w.MansionBasementCorridorU': true },
      values: {
        [SYN_KEYS.have('orichalcum')]: 2,
        [SYN_KEYS.have('serenity-crystal')]: 1,
        [SYN_KEYS.moogle]: 3,
      },
    };
    const v = computeSynthesis(p);
    expect(v.sources).toHaveLength(7);
    expect(v.sourcesFound).toBe(1);
    expect(v.recipeFound).toBe(true);
    expect(v.moogleOk).toBe(true);
    expect(v.ready).toBe(1);
    expect(v.ingredients[0].where).toBe('6 one-time sources left (below)');
    expect(v.sources[1].name).toBe('Central Computer Core Orichalcum+');
  });

  it('lists unopened chests by material, preferring Orichalcum+ over Orichalcum', () => {
    expect(materialIn('Sunset Terrace Orichalcum+')?.name).toBe('Orichalcum+');
    expect(materialIn('Spooky Cave Orichalcum')?.name).toBe('Orichalcum');
    const v = computeSynthesis(emptyProgress());
    expect(v.unopened.every((u) => u.loc.type === 'chest')).toBe(true);
    expect(v.unopened.some((u) => u.mat.name === 'Energy Crystal')).toBe(false);
  });
});
