import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { kh2Progress, kh2Store, renderAt, resetAll } from './helpers';

const progress = kh2Progress;

beforeEach(resetAll);

describe('Status', () => {
  it('switches the profile from the gauges', async () => {
    renderAt('/kh2/');
    const journal = screen.getByRole('button', { name: /JOURNAL/ });
    expect(journal).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(journal);
    expect(journal).toHaveAttribute('aria-pressed', 'true');
    expect(kh2Store.getState().profile).toBe('journal');
    expect(screen.getByRole('link', { name: /Ansem Reports: 0 of 13, open Journal/ })).toHaveAttribute(
      'href',
      '/kh2/journal',
    );
  });
});

describe('Worlds', () => {
  it('checks a row by hand, records the override and announces the trophy', async () => {
    renderAt('/kh2/worlds/tt');
    await userEvent.click(screen.getByRole('checkbox', { name: /^Betwixt and Between TT3/ }));
    expect(progress().checks['w.BetwixtandBetween']).toBe(true);
    expect(progress().overrides['w.BetwixtandBetween']).toBe('manual');
    expect(screen.getByRole('status')).toHaveTextContent('Trophy earned: A Taste of the Past!');
    const nav = screen.getByRole('navigation', { name: 'Tracker sections' });
    expect(within(nav).getByRole('link', { name: /Trophies/ })).toHaveTextContent('NEW!');
  });

  it('filters from the query string and bulk-checks without a toast', async () => {
    renderAt('/kh2/worlds/at?q=orichalcum');
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Check all in Atlantica' }));
    expect(progress().checks['w.MusicalOrichalcumPlus']).toBe(true);
    expect(screen.getByRole('status')).not.toHaveTextContent('Trophy earned');
  });

  it('keeps the hide filter in the URL', async () => {
    const router = renderAt('/kh2/worlds/lod');
    await userEvent.click(screen.getByRole('button', { name: 'Hide obtained' }));
    expect(router.state.location.search).toBe('?hide=1');
    expect(screen.getByRole('link', { name: /Agrabah/ })).toHaveAttribute('href', '/kh2/worlds/ag?hide=1');
  });
});

describe('Trophies', () => {
  it('marks a trophy earned by hand and unlocks nothing else', async () => {
    renderAt('/kh2/trophies?q=skater');
    await userEvent.click(screen.getByRole('button', { name: 'Mark earned: Pro Skater' }));
    expect(screen.getByText('EARNED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unmark Pro Skater' })).toBeInTheDocument();
  });
});

describe('Drive & Magic', () => {
  it('steps levels within range', async () => {
    renderAt('/kh2/drive');
    const raise = screen.getByRole('button', { name: 'Raise Valor Form' });
    for (let i = 0; i < 9; i++) await userEvent.click(raise);
    expect(progress().values['lv.valor']).toBe(7);
    expect(raise).toBeDisabled();
  });
});

describe('Records', () => {
  it('adds and removes a custom goal', async () => {
    renderAt('/kh2/records');
    await userEvent.type(screen.getByRole('textbox', { name: 'New goal' }), 'No-damage Sephiroth');
    await userEvent.click(screen.getByRole('button', { name: 'Add goal' }));
    expect(progress().custom.map((g) => g.t)).toEqual(['No-damage Sephiroth']);
    await userEvent.click(screen.getByRole('button', { name: /Remove this goal/ }));
    expect(progress().custom).toEqual([]);
  });
});

describe('Config', () => {
  it('rejects a bad backup code and restores a prototype one', async () => {
    renderAt('/kh2/config');
    const box = screen.getByRole('textbox', { name: 'Paste backup code' });
    fireEvent.change(box, { target: { value: 'nope' } });
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByRole('alert')).toHaveTextContent("That isn't a KH2FM backup code from this tracker.");
    fireEvent.change(box, {
      target: {
        value: JSON.stringify({
          app: 'kh2fm-100',
          v: 2,
          s: { c: { 'r.1': true }, lv: { sora: 50 }, diff: 2 },
        }),
      },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(progress().checks).toEqual({ 'r.1': true });
    expect(screen.getByRole('button', { name: 'Proud' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('needs a second press to reset', async () => {
    act(() => kh2Store.getState().toggle('r.1'));
    renderAt('/kh2/config');
    await userEvent.click(screen.getByRole('button', { name: 'Reset all progress' }));
    expect(progress().checks['r.1']).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Press again to erase everything' }));
    expect(progress().checks).toEqual({});
  });
});
