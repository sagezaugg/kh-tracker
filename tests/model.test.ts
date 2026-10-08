// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { evalRule, evaluateTrophies } from '../src/model/rules';
import { computeScores, pct } from '../src/model/scoring';
import { applyImport, navKeyOfId } from '../src/model/importSave';
import { emptyProgress } from '../src/model/progress';
import { SECTION_ITEMS } from '../src/model/items';
import { FINAL_XEMNAS_ID } from '../src/data/locations';
import type { ImportMeta, Progress } from '../src/model/types';

const withChecks = (ids: string[], extra: Partial<Progress> = {}): Progress => ({
  ...emptyProgress(),
  checks: Object.fromEntries(ids.map((id) => [id, true])),
  ...extra,
});

const trophy = (p: Progress, id: string) => {
  const t = evaluateTrophies(p).list.find((x) => x.id === id);
  if (!t) throw new Error(id);
  return t;
};

describe('evalRule', () => {
  it('counts all/item/section/and rules', () => {
    const p = withChecks(['a', 'b'], { values: { 'lv.sora': 120 } });
    expect(evalRule({ all: ['a', 'b', 'c'] }, p)).toEqual({ done: 2, total: 3 });
    expect(evalRule({ item: 'lv.sora', atLeast: 99 }, p)).toEqual({ done: 99, total: 99 });
    expect(evalRule({ item: 'lv.anti', atLeast: 13 }, p)).toEqual({ done: 0, total: 13 });
    expect(evalRule({ section: 'reports' }, p)).toEqual({ done: 0, total: 13 });
    expect(evalRule({ and: [{ all: ['a'] }, { save: 'difficulty', atLeast: 2 }] }, p)).toEqual({
      done: 1,
      total: 2,
    });
    expect(evalRule({ or: [{ all: ['c'] }, { all: ['a'] }] }, p)).toEqual({ done: 1, total: 1 });
    expect(evalRule({ manual: true }, p)).toEqual({ done: 0, total: 1 });
  });
});

describe('trophies', () => {
  it('earns world trophies from the last story boss', () => {
    expect(trophy(withChecks(['w.StormRider']), 'lod').earned).toBe(true);
    expect(trophy(emptyProgress(), 'lod').earned).toBe(false);
  });

  it('needs the game cleared and the difficulty for ending trophies', () => {
    const cleared = withChecks([FINAL_XEMNAS_ID]);
    expect(trophy(cleared, 'ambitious').earned).toBe(true);
    expect(trophy(cleared, 'critical').earned).toBe(false);
    expect(trophy(cleared, 'critical').progText).toBe('Game cleared · difficulty not set');
    const crit = { ...cleared, difficulty: 3 as const };
    expect(trophy(crit, 'critical').earned).toBe(true);
    expect(trophy(crit, 'proud').earned).toBe(true);
    expect(trophy({ ...emptyProgress(), difficulty: 3 }, 'critical').progText).toBe(
      'Game not cleared · Critical',
    );
  });

  it('counts manual marks and unlocks the Platinum from the other 50', () => {
    const p = withChecks(['tro.skate']);
    const t = trophy(p, 'skate');
    expect([t.auto, t.over, t.earned]).toEqual([false, true, true]);
    const all = evaluateTrophies(p).list.filter((x) => x.id !== 'plat');
    const everything = withChecks(all.map((x) => `tro.${x.id}`));
    const ev = evaluateTrophies(everything);
    expect(ev.earned).toBe(50);
    expect(ev.platinum).toBe(true);
    expect(ev.list[0]).toMatchObject({ id: 'plat', earned: true, progText: '50 / 50' });
  });

  it('earns Journal trophies from complete sections', () => {
    expect(trophy(withChecks([...SECTION_ITEMS.reports]), 'j1').earned).toBe(true);
    expect(trophy(withChecks(['js.charfiles']), 'j2').earned).toBe(true);
  });
});

describe('scores', () => {
  it('starts near zero with the prototype categories', () => {
    const s = computeScores(emptyProgress());
    expect(s.ratio.journal).toBe(0);
    expect(s.ratio.trophies).toBe(0);
    expect(s.cats.everything.map((c) => c.name)).toEqual([
      'Treasures',
      'Rewards',
      'Story Bosses',
      'Journal',
      'Drive Forms',
      'Summons',
      'Magic',
      'Key Items',
      'Sora',
      'Keyblades',
      'Battle Records',
      'Feats & Gummi',
    ]);
    // Sora starts at LV 1 of 99: (1/99) / 12 categories.
    expect(s.ratio.everything).toBeCloseTo(1 / 99 / 12);
    expect(s.cats.journal).toHaveLength(12);
    expect(s.cats.trophies.map((c) => c.total)).toEqual([18, 4, 8, 12, 4, 4]);
  });

  it('averages the 12 Journal sections', () => {
    const s = computeScores(withChecks([...SECTION_ITEMS.reports, 'js.links']));
    expect(s.journalDone).toBe(2);
    expect(pct(s.ratio.journal)).toBe(16);
  });

  it('adds Your Goals only when custom goals exist', () => {
    const s = computeScores({ ...withChecks(['cu.1']), custom: [{ id: 'cu.1', t: 'No-damage run' }] });
    expect(s.cats.everything.at(-1)).toMatchObject({ name: 'Your Goals', done: 1, total: 1 });
  });
});

describe('applyImport', () => {
  const meta: ImportMeta = {
    file: 'f',
    slot: 'Slot 1',
    lv: 45,
    munny: 1,
    world: 'X',
    diff: 'Critical',
    at: '',
  };
  const det = {
    checks: { 'w.A': true, 'w.B': false, 'w.C': false, 'r.1': true },
    values: { 'lv.valor': 3, 'lv.sora': 40 },
  };

  it('sync matches the save, add only adds', () => {
    const p = withChecks(['w.B'], { values: { 'lv.valor': 5 } });
    const sync = applyImport(p, det, meta, 3, 'sync');
    expect(sync.next.checks).toEqual({ 'w.A': true, 'r.1': true });
    expect(sync.next.values['lv.valor']).toBe(3);
    expect([sync.added, sync.removed]).toEqual([2, 1]);
    expect(sync.next.difficulty).toBe(3);
    expect(sync.news.sort()).toEqual(['drive', 'journal', 'worlds']);
    const add = applyImport(p, det, meta, null, 'add');
    expect(add.next.checks).toEqual({ 'w.A': true, 'w.B': true, 'r.1': true });
    expect(add.next.values['lv.valor']).toBe(5);
    expect(add.removed).toBe(0);
  });

  it('leaves manual overrides alone, even on sync', () => {
    const p = withChecks(['w.B'], { overrides: { 'w.B': 'manual', 'w.A': 'manual', 'lv.valor': 'manual' } });
    const out = applyImport(p, det, meta, null, 'sync');
    expect(out.next.checks['w.B']).toBe(true);
    expect(out.next.checks['w.A']).toBeUndefined();
    expect(out.next.values['lv.valor']).toBeUndefined();
    expect(out.next.values['lv.sora']).toBe(40);
  });

  it('maps ids to menu entries like the prototype', () => {
    expect(['w.x', 'r.1', 'kb.x', 'do.x', 'pf.x', 'lv.sora'].map(navKeyOfId)).toEqual([
      'worlds',
      'journal',
      'keys',
      'records',
      'drive',
      'drive',
    ]);
  });
});
