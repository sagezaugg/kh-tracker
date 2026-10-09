import { act, render, screen, within } from '@testing-library/react';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameContext } from '../src/games/context';
import { KH1 } from '../src/games/kh1/game';
import { KH1_WORLDS } from '../src/games/kh1/data/locations';
import { KH2 } from '../src/games/kh2/game';
import { WORLDS } from '../src/games/kh2/data/locations';
import type { GameDefinition } from '../src/games/types';
import { GameImage } from '../src/ui/GameImage';
import { MAGIC_GLYPHS, magicGlyphName } from '../src/ui/icons/glyphData';
import { renderAt, resetAll } from './helpers';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicFile = (path: string) => join(ROOT, 'public', path);
const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts/icons/manifest.json'), 'utf8'));

const GAMES: [GameDefinition, readonly { key: string }[]][] = [
  [KH1, KH1_WORLDS],
  [KH2, WORLDS],
];

beforeEach(resetAll);

describe.each(GAMES)('$id icons', (game, worlds) => {
  const { items, trophies, worlds: logos } = game.icons;
  const itemIds = (category: string) =>
    game.catalog.items.filter((i) => i.category === category).map((i) => i.id);

  it('only names ids, trophies and worlds that exist', () => {
    expect(Object.keys(items).filter((id) => !game.catalog.itemById.has(id))).toEqual([]);
    const trophyIds = new Set(game.catalog.trophies.map((t) => t.id));
    expect(Object.keys(trophies).filter((id) => !trophyIds.has(id))).toEqual([]);
    const worldKeys = new Set(worlds.map((w) => w.key));
    expect(Object.keys(logos).filter((k) => !worldKeys.has(k))).toEqual([]);
  });

  it('points at files that exist, with real dimensions', () => {
    const paths = [
      ...Object.values(items).map(([p, w, h]) => [p, w, h] as const),
      ...Object.values(logos).map(([p, w, h]) => [p, w, h] as const),
      ...Object.values(trophies).map((p) => [p, 1, 1] as const),
    ];
    for (const [p, w, h] of paths) {
      expect(p, p).toMatch(new RegExp(`^/icons/${game.id}/[a-z0-9-]+\\.webp$`));
      expect(existsSync(publicFile(p)), p).toBe(true);
      expect(w > 0 && h > 0, p).toBe(true);
    }
  });

  it('matches the manifest (regenerate with npm run icons:fetch after editing it)', () => {
    const m = manifest.games[game.id];
    expect(Object.keys(items).sort()).toEqual(Object.keys(m.items).sort());
    expect(Object.keys(trophies).sort()).toEqual(Object.keys(m.trophies).sort());
    expect(Object.keys(logos).sort()).toEqual(Object.keys(m.worlds).sort());
  });

  it('covers every trophy and world', () => {
    expect(game.catalog.trophies.filter((t) => !trophies[t.id]).map((t) => t.id)).toEqual([]);
    expect(worlds.filter((w) => !logos[w.key]).map((w) => w.key)).toEqual([]);
  });

  it('has a glyph for every spell', () => {
    const spells = itemIds('magic');
    expect(spells.length).toBeGreaterThan(0);
    expect(spells.filter((id) => !magicGlyphName(id))).toEqual([]);
  });
});

describe('icon coverage by category', () => {
  const missing = (game: GameDefinition, categories: string[]) =>
    game.catalog.items
      .filter((i) => categories.includes(i.category) && !game.icons.items[i.id])
      .map((i) => i.id);

  it('KH1: every Keyblade, staff, shield and summon', () => {
    expect(missing(KH1, ['keyblade', 'staff', 'shield', 'summon'])).toEqual([]);
  });

  it('KH2: every Keyblade, Drive Form, charm, report and Torn Page; Proofs except the Promise Charm', () => {
    expect(missing(KH2, ['keyblade', 'form', 'anti', 'charm', 'report', 'torn-page', 'summon'])).toEqual([]);
    // KHWiki has no Promise Charm image.
    expect(missing(KH2, ['proof'])).toEqual(['pf.charm']);
  });

  it('draws every glyph it promises', () => {
    expect(MAGIC_GLYPHS.sort()).toEqual(
      ['aero', 'blizzard', 'cure', 'fire', 'gravity', 'magnet', 'reflect', 'stop', 'thunder'].sort(),
    );
  });
});

describe('credits', () => {
  it('credits every committed image', () => {
    const credits = JSON.parse(readFileSync(publicFile('icons/CREDITS.json'), 'utf8'));
    const credited = new Set<string>(credits.images.flatMap((c: { used: string[] }) => c.used));
    for (const gameId of ['kh1', 'kh2']) {
      for (const f of readdirSync(publicFile(`icons/${gameId}`))) {
        expect(credited.has(`/icons/${gameId}/${f}`), f).toBe(true);
      }
    }
    for (const c of credits.images) expect(c.page).toMatch(/^https:\/\/www\.khwiki\.com\/File:/);
  });
});

describe('icons on screen', () => {
  const imgSrcs = (el: HTMLElement) => [...el.querySelectorAll('img')].map((i) => i.getAttribute('src'));

  it('shows item icons on item rows but not on location rows', () => {
    renderAt('/kh2/keyblades');
    const row = screen.getByRole('checkbox', { name: /^Oathkeeper/ }).closest('label')!;
    expect(imgSrcs(row)).toEqual([KH2.icons.items['kb.oathkeeper'][0]]);
    expect(row.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('keeps location rows plain', () => {
    renderAt('/kh2/worlds/tt');
    const row = screen.getByRole('checkbox', { name: /^Station Dusks/ }).closest('label')!;
    expect(row.querySelector('img, svg')).toBeNull();
  });

  it('shows spell glyphs and form art on the level steppers', () => {
    renderAt('/kh2/drive');
    expect(screen.getByRole('group', { name: 'Fire' }).querySelector('svg')).not.toBeNull();
    expect(imgSrcs(screen.getByRole('group', { name: 'Valor Form' }))).toEqual([
      KH2.icons.items['lv.valor'][0],
    ]);
  });

  it('uses the real trophy image on trophy cards', () => {
    renderAt('/kh1/trophies');
    const t = KH1.catalog.trophies.find((x) => x.group !== 'plat')!;
    const card = screen.getByRole('heading', { name: t.name }).closest('article')!;
    expect(imgSrcs(card)).toEqual([KH1.icons.trophies[t.id]]);
  });

  it('shows world logos with the name still as text', () => {
    renderAt('/kh1/worlds/tt');
    const tile = within(screen.getByRole('list', { name: 'Worlds' })).getByRole('link', {
      name: /Traverse Town/,
    });
    expect(imgSrcs(tile)).toEqual([KH1.icons.worlds.tt[0]]);
    expect(tile).toHaveTextContent('Traverse Town');
    expect(screen.getByRole('heading', { level: 2, name: 'Traverse Town' })).toBeInTheDocument();
  });

  it('removes an image that fails to load instead of showing a broken box', () => {
    render(
      <GameContext.Provider value={KH2}>
        <GameImage src="/icons/kh2/missing.webp" width={10} height={10} />
      </GameContext.Provider>,
    );
    const img = document.querySelector('img')!;
    act(() => {
      img.dispatchEvent(new Event('error'));
    });
    expect(document.querySelector('img')).toBeNull();
  });
});
