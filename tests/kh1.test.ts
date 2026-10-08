// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { KH1_LOCATIONS, KH1_WORLDS, REPORT_FLAGS } from '../src/games/kh1/data/locations';
import { KH1_TROPHIES } from '../src/games/kh1/data/trophies';
import { KH1_ITEM_BY_ID, KH1_ITEMS, KH1_TROPHY_ITEM_SETS } from '../src/games/kh1/model/items';
import {
  detectKh1,
  KH1_ENTRY_STRIDE,
  KH1_FIRST_ENTRY,
  KH1_PC_FILE_SIZE,
  kh1ParseError,
  parseKh1Save,
} from '../src/games/kh1/save/parseSave';
import { computeKh1Scores } from '../src/games/kh1/model/scoring';
import { applyImport, importMeta } from '../src/core/importSave';
import { emptyProgress } from '../src/core/progress';
import { KH1_CATALOG } from '../src/games/kh1/model/catalog';

describe('KH1 data', () => {
  it('has 216 chests with save flags across 13 worlds', () => {
    expect(KH1_WORLDS).toHaveLength(13);
    const chests = KH1_LOCATIONS.filter((l) => l.type === 'chest');
    expect(chests).toHaveLength(216);
    expect(chests.every((l) => l.flag)).toBe(true);
  });

  it('maps all 13 Ansem Reports to Journal bits at 0x19C0', () => {
    expect(REPORT_FLAGS.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(REPORT_FLAGS[0]).toEqual({ n: 1, offset: 0x19c0, bit: 7 });
    expect(REPORT_FLAGS[12]).toEqual({ n: 13, offset: 0x19c1, bit: 3 });
  });

  it('has unique item ids', () => {
    expect(new Set(KH1_ITEMS.map((i) => i.id)).size).toBe(KH1_ITEMS.length);
  });

  it('has 56 trophies: 1 Platinum, 2 Gold, 4 Silver, 49 Bronze', () => {
    expect(KH1_TROPHIES).toHaveLength(56);
    const tiers = (t: string) => KH1_TROPHIES.filter((x) => x.tier === t).length;
    expect([tiers('P'), tiers('G'), tiers('S'), tiers('B')]).toEqual([1, 2, 4, 49]);
    expect(new Set(KH1_TROPHIES.map((t) => t.id)).size).toBe(56);
  });

  it('every trophy rule points at real items', () => {
    for (const [tid, ids] of KH1_TROPHY_ITEM_SETS) {
      for (const id of ids) expect(KH1_ITEM_BY_ID.has(id), `${tid}: ${id}`).toBe(true);
    }
  });
});

describe('KH1 flags the randomizer mod rewrites', () => {
  it("leaves Geppetto's House and Magician's Study rewards manual", () => {
    const manual = KH1_LOCATIONS.filter((l) =>
      /Geppetto Reward|All Summons Reward|Talk to Pinocchio|Magician's Study Obtained/.test(l.name),
    );
    expect(manual.length).toBeGreaterThanOrEqual(10);
    expect(manual.every((l) => !l.flag)).toBe(true);
  });
});

describe('parseKh1Save (synthetic)', () => {
  function pcFile(entries: [index: number, magic: number, lv: number][]): Uint8Array {
    const b = new Uint8Array(KH1_PC_FILE_SIZE);
    for (const [i, magic, lv] of entries) {
      const o = KH1_FIRST_ENTRY + i * KH1_ENTRY_STRIDE;
      new DataView(b.buffer).setUint32(o, magic, true);
      b[o + 4] = lv;
      new DataView(b.buffer).setUint32(o + 0x1641c, 1234, true);
      b[o + 0x1642c] = 1;
      new DataView(b.buffer).setUint32(o + 0x2040, 3, true);
    }
    return b;
  }

  it('reads Final Mix saves from data entries and labels them by save number', () => {
    const res = parseKh1Save(
      pcFile([
        [0, 5, 30],
        [1, 0x5153484b, 0],
        [4, 5, 99],
      ]),
    );
    expect(res.format).toBe('pc');
    expect(res.slots.map((s) => [s.label, s.lv, s.munny, s.diffName, s.world])).toEqual([
      ['Slot 1', 30, 1234, 'Standard', 'Traverse Town'],
      ['Slot 3', 99, 1234, 'Standard', 'Traverse Town'],
    ]);
  });

  it('reports original-KH1 saves and empty files', () => {
    const vanilla = parseKh1Save(pcFile([[0, 4, 10]]));
    expect(vanilla.slots).toHaveLength(0);
    expect(kh1ParseError(vanilla)).toMatch(/non-Final Mix/);
    expect(kh1ParseError(parseKh1Save(new ArrayBuffer(0)))).toMatch(/No Kingdom Hearts Final Mix save/);
  });

  it('counts puppy bits and reads summons from the owned list', () => {
    const b = pcFile([[0, 5, 50]]);
    const o = KH1_FIRST_ENTRY;
    b[o + 0x1703] = 0b111; // 3 puppies
    b.set([5, 2, 0xff], o + 0x7d0); // Simba, Genie
    const d = detectKh1(parseKh1Save(b).slots[0].bytes);
    expect(d.values['kh1.puppies']).toBe(3);
    expect([d.checks['sm.simba'], d.checks['sm.genie'], d.checks['sm.dumbo']]).toEqual([true, true, false]);
  });
});

const FIXTURE = fileURLToPath(new URL('./fixtures/KHFM.png', import.meta.url));

describe.skipIf(!existsSync(FIXTURE))('real KH1FM PC save (tests/fixtures/KHFM.png)', () => {
  const res = () => parseKh1Save(new Uint8Array(readFileSync(FIXTURE)));

  it('finds two Final Mix saves', () => {
    expect(res().slots.map((s) => [s.label, s.lv, s.munny, s.diffName, s.world])).toEqual([
      ['Slot 1', 100, 23666, 'Proud', 'End of the World'],
      ['Slot 2', 54, 2479, 'Proud', 'Neverland'],
    ]);
  });

  it('reads Slot 1 progress', () => {
    const d = detectKh1(res().slots[0].bytes);
    const found = (t: string) => KH1_LOCATIONS.filter((l) => l.type === t && d.checks[l.id]).length;
    expect([found('chest'), found('reward'), found('event')]).toEqual([208, 56, 95]);
    expect(Object.keys(d.checks).filter((id) => id.startsWith('r.') && d.checks[id])).toHaveLength(13);
    expect(Object.keys(d.checks).filter((id) => id.startsWith('kb.') && d.checks[id])).toHaveLength(18);
    expect(d.values['kh1.puppies']).toBe(99);
    expect(d.values['lv.sora']).toBe(100);
    expect(
      ['fire', 'blizzard', 'thunder', 'cure', 'gravity', 'stop', 'aero'].map((k) => d.values[`lv.${k}`]),
    ).toEqual([3, 3, 3, 3, 3, 3, 3]);
    expect(Object.keys(d.checks).filter((id) => id.startsWith('sm.') && d.checks[id])).toHaveLength(6);
  });

  it('turns an import into trophies and scores', () => {
    const slot = res().slots[0];
    const p = applyImport(
      KH1_CATALOG,
      emptyProgress(),
      detectKh1(slot.bytes),
      importMeta('KHFM.png', slot),
      slot.difficulty,
      'sync',
    ).next;
    const s = computeKh1Scores(p);
    const earned = new Set(s.trophies.list.filter((t) => t.earned).map((t) => t.id));
    for (const id of [
      'level',
      'treasure',
      'searcher',
      'topdog',
      'blade',
      'oathkeeper',
      'kurt',
      'unknown',
      'seph',
    ]) {
      expect(earned.has(id), id).toBe(true);
    }
    expect(earned.has('proud')).toBe(false); // the final battle has no save flag yet
    expect(p.difficulty).toBe(2);
  });
});
