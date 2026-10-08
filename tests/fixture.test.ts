// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseSave } from '../src/save/parseSave';
import { detect } from '../src/save/detect';
import { LOCATIONS, FINAL_XEMNAS_ID } from '../src/data/locations';
import { KEYBLADES } from '../src/data/keyblades';

/** Owner-supplied real PC save; not committed. These tests skip when it's missing. */
const FIXTURE = fileURLToPath(new URL('./fixtures/KHIIFM.png', import.meta.url));
const present = existsSync(FIXTURE);

describe.skipIf(!present)('real PC save fixture (tests/fixtures/KHIIFM.png)', () => {
  const load = () => {
    const res = parseSave(new Uint8Array(readFileSync(FIXTURE)));
    return { res, slot: res.slots[0], det: detect(res.slots[0].bytes) };
  };

  it('has one Final Mix slot: Slot 1, LV 45, 3,779 munny, Critical, in TWTNW', () => {
    const { res, slot } = load();
    expect(res.format).toBe('pc');
    expect(res.slots).toHaveLength(1);
    expect(slot).toMatchObject({
      label: 'Slot 1',
      lv: 45,
      munny: 3779,
      diffName: 'Critical',
      world: 'The World That Never Was',
    });
  });

  it('detects chests, rewards, bosses, reports and Keyblades', () => {
    const { det } = load();
    const found = (t: string) => LOCATIONS.filter((l) => l.type === t && det.checks[l.id]).length;
    expect(found('chest')).toBe(272);
    expect(found('reward')).toBe(78);
    expect(found('boss')).toBe(50);
    expect(Array.from({ length: 13 }, (_, i) => det.checks[`r.${i + 1}`]).filter(Boolean)).toHaveLength(13);
    const missing = KEYBLADES.filter((k) => !det.checks[k.id]).map((k) => k.name);
    expect(missing).toEqual(['Mysterious Abyss', 'Fatal Crest', 'Fenrir', 'Ultima Weapon', "Winner's Proof"]);
  });

  it('reads forms, magic, summons, charms, pages and proofs', () => {
    const { det } = load();
    const v = det.values;
    expect([v['lv.valor'], v['lv.wisdom'], v['lv.limit'], v['lv.master'], v['lv.final']]).toEqual([
      5, 5, 2, 4, 1,
    ]);
    expect([
      v['lv.fire'],
      v['lv.blizzard'],
      v['lv.thunder'],
      v['lv.cure'],
      v['lv.magnet'],
      v['lv.reflect'],
    ]).toEqual([3, 2, 3, 3, 3, 3]);
    expect(v['lv.summon']).toBe(1);
    expect(['sm.chicken', 'sm.genie', 'sm.stitch', 'sm.peter'].every((id) => det.checks[id])).toBe(true);
    expect([1, 2, 3, 4, 5].every((i) => det.checks[`pg.${i}`])).toBe(true);
    expect(['pf.conn', 'pf.non', 'pf.peace'].some((id) => det.checks[id])).toBe(false);
  });

  it('does not detect Final Xemnas (open question 1)', () => {
    expect(load().det.checks[FINAL_XEMNAS_ID]).toBe(false);
  });
});
