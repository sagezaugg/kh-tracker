import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderAt, resetAll } from './helpers';

beforeEach(resetAll);

describe('app shell', () => {
  it('marks the active menu link with aria-current', () => {
    renderAt('/kh2/trophies');
    const nav = screen.getByRole('navigation', { name: 'Tracker sections' });
    expect(within(nav).getByRole('link', { name: 'Trophies' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Status' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trophies');
  });

  it('redirects /kh2/worlds to Land of Dragons', () => {
    const router = renderAt('/kh2/worlds');
    expect(router.state.location.pathname).toBe('/kh2/worlds/lod');
  });

  it('shows the not-found screen inside a game and outside any game', () => {
    renderAt('/kh2/nowhere');
    expect(screen.getByRole('link', { name: 'Return to KH2FM Status' })).toHaveAttribute('href', '/kh2');
  });

  it('shows a site-level not-found page for unknown top-level paths', () => {
    document.title = 'Status · KH2FM 100% Tracker';
    renderAt('/nowhere');
    expect(screen.getByRole('link', { name: 'Return to the game list' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Lost in the Darkness · Kingdom Hearts 100% Tracker');
  });

  it('treats an unknown world id as not found', () => {
    renderAt('/kh2/worlds/kh3');
    expect(screen.getByRole('link', { name: 'Return to KH2FM Status' })).toBeInTheDocument();
  });

  it('lists every KH2 menu entry in order', () => {
    renderAt('/kh2');
    const nav = screen.getByRole('navigation', { name: 'Tracker sections' });
    const labels = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual([
      'Status',
      "What's Left",
      'Worlds',
      'Journal',
      'Trophies',
      'Synthesis',
      'Drive & Magic',
      'Keyblades',
      'Records',
      'Config',
    ]);
  });
});

describe('game switcher', () => {
  it('lists the games on the home page and marks the active one elsewhere', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Choose a Game');
    const games = screen.getByRole('navigation', { name: 'Site' });
    expect(
      within(games)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Home', 'KH1FM: Kingdom Hearts Final Mix', 'KH2FM: Kingdom Hearts II Final Mix', 'Save Diff']);
    expect(within(games).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(games).getByRole('link', { name: /KH2FM/ }));
    expect(
      within(screen.getByRole('navigation', { name: 'Site' })).getByRole('link', { name: /KH2FM/ }),
    ).toHaveAttribute('aria-current', 'true');
  });

  it('keeps the same screen when the other game has it', () => {
    renderAt('/kh2/config');
    const games = screen.getByRole('navigation', { name: 'Site' });
    expect(within(games).getByRole('link', { name: /KH1FM/ })).toHaveAttribute('href', '/kh1/config');
  });

  it("falls back to the other game's Status for screens it lacks", () => {
    renderAt('/kh2/drive');
    const games = screen.getByRole('navigation', { name: 'Site' });
    expect(within(games).getByRole('link', { name: /KH1FM/ })).toHaveAttribute('href', '/kh1');
  });
});

describe('site navigation and themes', () => {
  it('links home and to the save diff tool from inside a game', () => {
    renderAt('/kh1/journal');
    const site = screen.getByRole('navigation', { name: 'Site' });
    expect(within(site).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(site).getByRole('link', { name: 'Save Diff' })).toHaveAttribute('href', '/tools/save-diff');
  });

  it('tags each game frame for its colour theme', () => {
    renderAt('/kh1');
    expect(document.querySelector('[data-game]')).toHaveAttribute('data-game', 'kh1');
  });

  it('links Config to the save diff tool', () => {
    renderAt('/kh2/config');
    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: 'save diff tool' })).toHaveAttribute(
      'href',
      '/tools/save-diff',
    );
  });
});

describe('source link', () => {
  it('links to the GitHub repository from the footer and the home page', () => {
    renderAt('/');
    const links = [
      screen.getByRole('link', { name: 'Source code on GitHub' }),
      screen.getByRole('link', { name: 'GitHub' }),
    ];
    for (const a of links) expect(a).toHaveAttribute('href', 'https://github.com/sagezaugg/kh-tracker');
  });
});

describe('work-in-progress notice', () => {
  it('shows on every page until dismissed, and stays dismissed', async () => {
    renderAt('/kh1');
    const notice = screen.getByRole('complementary', { name: 'Site notice' });
    expect(notice).toHaveTextContent('Work in progress.');
    expect(within(notice).getByRole('link', { name: 'Report it on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/sagezaugg/kh-tracker/issues',
    );
    await userEvent.click(within(notice).getByRole('button', { name: 'Dismiss notice' }));
    expect(screen.queryByRole('complementary', { name: 'Site notice' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('kh-tracker-notice-v1')).toBe('dismissed');
  });

  it('stays hidden once dismissed', () => {
    window.localStorage.setItem('kh-tracker-notice-v1', 'dismissed');
    renderAt('/');
    expect(screen.queryByRole('complementary', { name: 'Site notice' })).not.toBeInTheDocument();
  });
});
