import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeImportReport, reportHasChanges, type ImportReport } from '../src/core/importReport';
import type { Detected, ImportMeta } from '../src/core/types';
import { useUi } from '../src/core/ui';
import { KH2 } from '../src/games/kh2/game';
import { GROUP_LIMIT } from '../src/screens/LatestChanges';
import { kh2Store, renderAt, resetAll } from './helpers';

beforeEach(resetAll);

const meta = (lv: number, at: string): ImportMeta => ({
  file: 'KHIIFM.png',
  slot: 'Slot 1',
  lv,
  munny: 0,
  world: 'Hollow Bastion',
  diff: 'Critical',
  at,
});
const doImport = (det: Detected, m: ImportMeta) =>
  act(() => {
    kh2Store.getState().importSave(det, m, null, 'add');
  });
const report = () => {
  const s = kh2Store.getState();
  return s.reports[s.activeId];
};
const nameOf = (id: string) => KH2.catalog.itemById.get(id)!.name;
const chests = KH2.catalog.items.filter((i) => i.category === 'chest' && i.kind === 'check');

describe('import report', () => {
  it('records newly checked items, raised levels and new trophies', () => {
    doImport({ checks: { 'w.MCP': true }, values: { 'lv.valor': 3 } }, meta(30, '2026-10-08T10:00:00Z'));
    const r = report();
    expect(r.checked).toEqual(['w.MCP']);
    expect(r.raised).toContainEqual(['lv.valor', expect.any(Number), 3]);
    expect(r.trophies.length).toBeGreaterThan(0);
    expect(r.lvFrom).toBeUndefined();
    expect(r).toMatchObject({ slot: 'Slot 1', lv: 30, world: 'Hollow Bastion', unchecked: 0 });
  });

  it('keeps the previous report when an import changes nothing, and replaces it when something changes', () => {
    doImport({ checks: { 'w.MCP': true }, values: {} }, meta(30, 'first'));
    doImport({ checks: { 'w.MCP': true }, values: {} }, meta(30, 'second'));
    expect(report().at).toBe('first');
    doImport({ checks: { 'w.MCP': true }, values: {} }, meta(31, 'third'));
    expect(report()).toMatchObject({ at: 'third', lvFrom: 30, lv: 31, checked: [] });
  });

  it('counts items a sync import unchecks', () => {
    act(() => {
      kh2Store.getState().importSave({ checks: { 'w.MCP': true }, values: {} }, meta(30, 'a'), null, 'sync');
      kh2Store.getState().importSave({ checks: { 'w.MCP': false }, values: {} }, meta(30, 'b'), null, 'sync');
    });
    expect(report()).toMatchObject({ at: 'b', unchecked: 1, checked: [] });
  });

  it('is cleared by dismissing, by restoring a backup and by erasing progress', () => {
    const det = { checks: { 'w.MCP': true }, values: {} };
    doImport(det, meta(30, 'a'));
    act(() => kh2Store.getState().clearReport());
    expect(report()).toBeUndefined();
    doImport({ checks: { [chests[0].id]: true }, values: {} }, meta(30, 'b'));
    act(() => kh2Store.getState().restore({ progress: kh2Store.getState().playthroughs.main.progress }));
    expect(report()).toBeUndefined();
    doImport({ checks: { [chests[1].id]: true }, values: {} }, meta(30, 'c'));
    act(() => kh2Store.getState().reset());
    expect(report()).toBeUndefined();
  });

  it('persists the report with the rest of the tracker', () => {
    doImport({ checks: { 'w.MCP': true }, values: {} }, meta(30, 'a'));
    const saved = JSON.parse(window.localStorage.getItem('kh2fm-tracker') ?? '{}');
    expect(saved.state.reports.main).toMatchObject({ at: 'a', checked: ['w.MCP'] });
  });

  it('validates persisted reports', () => {
    expect(normalizeImportReport(null)).toBeUndefined();
    expect(normalizeImportReport({ at: 'x', slot: 'Slot 1' })).toBeUndefined();
    const r = normalizeImportReport({
      at: 'x',
      slot: 'Slot 1',
      lv: 5,
      checked: ['a', 3, 'b'],
      raised: [['lv.valor', 1, 3], ['bad', 'x', 2], 'junk'],
      trophies: 'nope',
    });
    expect(r).toEqual({
      at: 'x',
      slot: 'Slot 1',
      lvFrom: undefined,
      lv: 5,
      world: '',
      checked: ['a', 'b'],
      unchecked: 0,
      raised: [['lv.valor', 1, 3]],
      trophies: [],
    });
  });

  it('treats a level change alone as a change, but not a first import with nothing in it', () => {
    const base: ImportReport = {
      at: '',
      slot: '',
      lv: 5,
      world: '',
      checked: [],
      unchecked: 0,
      raised: [],
      trophies: [],
    };
    expect(reportHasChanges(base)).toBe(false);
    expect(reportHasChanges({ ...base, lvFrom: 4 })).toBe(true);
    expect(reportHasChanges({ ...base, lvFrom: 5 })).toBe(false);
  });
});

describe('Latest changes card', () => {
  it('shows the last import on Status, grouped by screen, and dismisses', async () => {
    doImport({ checks: { 'w.MCP': true }, values: {} }, meta(30, 'a'));
    doImport(
      { checks: Object.fromEntries(chests.slice(0, GROUP_LIMIT + 3).map((c) => [c.id, true])), values: {} },
      meta(31, '2026-10-08T10:00:00Z'),
    );
    renderAt('/kh2');
    const card = screen.getByRole('region', { name: 'Latest changes from your save' });
    expect(card).toHaveTextContent('LV 30 → 31');
    expect(card).toHaveTextContent('saved in Hollow Bastion');
    expect(card).toHaveTextContent(`${GROUP_LIMIT + 3} newly checked`);
    expect(within(card).getByText(nameOf(chests[0].id))).toBeInTheDocument();
    expect(within(card).queryByText(nameOf(chests[GROUP_LIMIT + 2].id))).not.toBeInTheDocument();
    expect(card).toHaveTextContent('and 3 more');
    expect(within(card).getByRole('link', { name: 'Worlds' })).toHaveAttribute('href', '/kh2/worlds');

    await userEvent.click(within(card).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('region', { name: /Latest changes/ })).not.toBeInTheDocument();
    expect(report()).toBeUndefined();
  });

  it('labels the first import and lists trophies and levels', () => {
    doImport({ checks: { 'w.MCP': true }, values: { 'lv.valor': 3 } }, meta(30, 'a'));
    renderAt('/kh2');
    const card = screen.getByRole('region', { name: 'First save import' });
    expect(within(card).getByRole('link', { name: 'Trophies' })).toHaveAttribute('href', '/kh2/trophies');
    expect(within(card).getByRole('heading', { name: 'Levels and counts' })).toBeInTheDocument();
    expect(card).toHaveTextContent(/→ 3/);
  });

  it('has no axe violations', async () => {
    doImport({ checks: { 'w.MCP': true }, values: { 'lv.valor': 3 } }, meta(30, 'a'));
    renderAt('/kh2');
    const res = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, 'label-content-name-mismatch': { enabled: false } },
    });
    expect(res.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('Update banner', () => {
  it('appears when a new version takes over and can be dismissed', async () => {
    renderAt('/');
    expect(screen.queryByRole('complementary', { name: 'Site update' })).not.toBeInTheDocument();
    act(() => useUi.getState().setUpdateReady(true));
    const banner = screen.getByRole('complementary', { name: 'Site update' });
    expect(banner).toHaveTextContent('Update ready');
    expect(within(banner).getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    await userEvent.click(within(banner).getByRole('button', { name: 'Dismiss update notice' }));
    expect(screen.queryByRole('complementary', { name: 'Site update' })).not.toBeInTheDocument();
  });
});
