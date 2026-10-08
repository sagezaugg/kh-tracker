import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseBackup, serializeBackup } from '../src/state/backup';
import { PROTOTYPE_LS_KEY } from '../src/state/migrations';
import { createSafeStorage } from '../src/state/storage';
import { FINAL_XEMNAS_ID } from '../src/data/locations';

/** A backup code as the prototype's Config screen exported it (v2). */
const PROTOTYPE_V2 = JSON.stringify({
  app: 'kh2fm-100',
  v: 2,
  s: {
    c: {
      'w.StormRider': true,
      'r.1': true,
      'w.ElephantGraveyardMythril': true,
      [FINAL_XEMNAS_ID]: true,
      junk: false,
    },
    lv: { sora: 45, valor: 5, anti: 13, bogus: 3 },
    custom: [{ id: 'cu.abc', t: 'No-damage run' }, { nope: 1 }],
    imp: {
      file: 'KHIIFM.png',
      slot: 'Slot 1',
      lv: 45,
      munny: 3779,
      world: 'The World That Never Was',
      diff: 'Critical',
      at: '2026-10-01T00:00:00Z',
    },
    profile: 'trophies',
    diff: 3,
  },
});

describe('backup codes', () => {
  it('restores prototype v2 codes', () => {
    const r = parseBackup(PROTOTYPE_V2);
    if (!r) throw new Error('should parse');
    const p = r.progress;
    expect(p.checks).toEqual({
      'w.StormRider': true,
      'r.1': true,
      'w.ElephantGraveyardMythril': true,
      'w.ElephantGraveyardMythril-2': true,
      [FINAL_XEMNAS_ID]: true,
    });
    expect(p.values).toEqual({ 'lv.sora': 45, 'lv.valor': 5, 'lv.anti': 13 });
    expect(p.custom).toEqual([{ id: 'cu.abc', t: 'No-damage run' }]);
    expect(p.difficulty).toBe(3);
    expect(p.lastImport?.worldId).toBe(18);
    expect(p.overrides).toEqual({ [FINAL_XEMNAS_ID]: 'manual' });
    expect(r.profile).toBe('trophies');
  });

  it('restores v1 codes without a difficulty or profile', () => {
    const r = parseBackup(
      JSON.stringify({ app: 'kh2fm-100', v: 1, s: { c: { 'kb.oblivion': true }, lv: {} } }),
    );
    expect(r?.progress.checks).toEqual({ 'kb.oblivion': true });
    expect(r?.progress.difficulty).toBeUndefined();
    expect(r?.profile).toBeUndefined();
  });

  it('round-trips our own v3 codes, overrides and extra values included', () => {
    const first = parseBackup(PROTOTYPE_V2);
    if (!first) throw new Error('should parse');
    const progress = {
      ...first.progress,
      values: { ...first.progress.values, 'syn.mat.orichalcum-plus': 4 },
      overrides: { 'w.StormRider': 'manual' as const },
    };
    const code = serializeBackup(progress, 'journal');
    expect(JSON.parse(code)).toMatchObject({ app: 'kh2fm-100', v: 3 });
    const again = parseBackup(code);
    expect(again?.progress).toEqual(progress);
    expect(again?.profile).toBe('journal');
  });

  it('rejects anything else', () => {
    expect(parseBackup('')).toBeNull();
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"app":"other","s":{}}')).toBeNull();
    expect(parseBackup('{"app":"kh2fm-100"}')).toBeNull();
  });
});

describe('safe storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('falls back to memory when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    const s = createSafeStorage();
    expect(() => s.setItem('k', 'v')).not.toThrow();
    expect(s.getItem('k')).toBe('v');
    expect(() => s.removeItem('k')).not.toThrow();
    expect(s.getItem('k')).toBeNull();
  });
});

describe('store', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  const load = async () => (await import('../src/state/store')).useTracker;

  it('carries the prototype localStorage over on first load', async () => {
    window.localStorage.setItem(
      PROTOTYPE_LS_KEY,
      JSON.stringify({ c: { 'r.2': true }, lv: { sora: 12 }, custom: [], profile: 'journal', diff: 1 }),
    );
    const store = await load();
    const s = store.getState();
    const p = s.playthroughs[s.activeId].progress;
    expect(p.checks).toEqual({ 'r.2': true });
    expect(p.values['lv.sora']).toBe(12);
    expect(p.difficulty).toBe(1);
    expect(s.profile).toBe('journal');
  });

  it('records overrides on manual changes and announces new trophies', async () => {
    const store = await load();
    const res = store.getState().toggle('w.StormRider');
    expect(res.on).toBe(true);
    expect(res.earned.map((t) => t.name)).toEqual(['Above Honor']);
    const s = store.getState();
    expect(s.news.trophies).toBe(true);
    expect(s.playthroughs[s.activeId].progress.overrides['w.StormRider']).toBe('manual');
    expect(store.getState().toggle('w.StormRider')).toEqual({ on: false, earned: [] });
  });

  it('sync import leaves manual checks alone and sets difficulty', async () => {
    const store = await load();
    store.getState().toggle('w.Hades');
    const meta = { file: 'f', slot: 'Slot 1', lv: 2, munny: 0, world: 'X', diff: 'Proud', at: '' };
    const sum = store
      .getState()
      .importSave({ checks: { 'w.Hades': false, 'w.MCP': true }, values: {} }, meta, 2, 'sync');
    expect(sum).toEqual({ added: 1, removed: 0, trophiesGained: 1 });
    const s = store.getState();
    const p = s.playthroughs[s.activeId].progress;
    expect(p.checks).toEqual({ 'w.Hades': true, 'w.MCP': true });
    expect(p.difficulty).toBe(2);
    expect(s.news).toMatchObject({ worlds: true, trophies: true });
  });

  it('persists to localStorage and clamps values', async () => {
    const store = await load();
    store.getState().setValue('lv.valor', 12);
    store.getState().setValue('lv.sora', 0);
    const saved = JSON.parse(window.localStorage.getItem('kh2fm-tracker') ?? '{}');
    expect(saved.version).toBe(1);
    expect(saved.state.playthroughs.main.progress.values).toEqual({ 'lv.valor': 7, 'lv.sora': 1 });
  });

  it('reset clears progress', async () => {
    const store = await load();
    store.getState().toggle('r.1');
    store.getState().addCustom('  Beat the game  ');
    store.getState().reset();
    const s = store.getState();
    expect(s.playthroughs[s.activeId].progress).toEqual({
      checks: {},
      values: {},
      overrides: {},
      custom: [],
    });
  });
});
