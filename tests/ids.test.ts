import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { currentId, normalizeProgress } from '../src/core/backup';
import type { Catalog } from '../src/core/types';
import { GAMES } from '../src/games/registry';

/**
 * Saved progress is keyed by item id (and `tro.<trophy id>` for trophies marked by hand), so an id that
 * changes silently unchecks it for everyone. tests/ids/<game>.json lists every id players may have saved.
 *
 * - Renamed an id? Add `old: 'new'` to the catalog's `renamedIds`, then run `npm run ids:update`.
 * - Added or really removed something? Run `npm run ids:update` and commit the snapshot change.
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'ids');
const UPDATE = import.meta.env.MODE === 'update-ids';

const storedIds = (cat: Catalog) =>
  [...cat.items.map((i) => i.id), ...cat.trophies.map((t) => `tro.${t.id}`)].sort();

describe.each(GAMES.map((g) => [g.id, g.catalog] as const))('%s stored ids', (gameId, cat) => {
  const file = join(DIR, `${gameId}.json`);
  const current = storedIds(cat);

  if (UPDATE) {
    it('updates the snapshot', () => {
      writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
    });
    return;
  }

  const snapshot: string[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const live = new Set(current);

  it('keeps every saved id, or renames it', () => {
    const lost = snapshot.filter((id) => !live.has(currentId(cat, id)));
    expect(
      lost,
      `These ids are gone, so anyone who saved them would lose that progress. Add them to renamedIds in ` +
        `src/games/${gameId}/model/catalog.ts, or if they really were removed, run npm run ids:update.`,
    ).toEqual([]);
  });

  it('lists every current id in the snapshot', () => {
    const added = current.filter((id) => !snapshot.includes(id));
    expect(added, `New ids: run npm run ids:update and commit tests/ids/${gameId}.json.`).toEqual([]);
  });

  it('only renames to ids that exist', () => {
    const bad = Object.keys(cat.renamedIds ?? {}).filter((id) => !live.has(currentId(cat, id)));
    expect(bad).toEqual([]);
  });
});

describe('renamedIds', () => {
  const base = GAMES[0].catalog;
  const [a, b] = base.items.filter((i) => i.kind === 'check');
  const level = base.items.find((i) => i.kind !== 'check')!;
  const cat: Catalog = {
    ...base,
    renamedIds: { 'old.a': 'older.a', 'older.a': a.id, 'old.lv': level.id, 'old.b': b.id },
  };

  it('moves checks, values and overrides to the current id, following chains', () => {
    const p = normalizeProgress(
      cat,
      { checks: { 'old.a': true }, values: { 'old.lv': 3 }, overrides: { 'old.a': 'manual' } },
      3,
    );
    expect(p.checks).toEqual({ [a.id]: true });
    expect(p.values).toEqual({ [level.id]: 3 });
    expect(p.overrides).toEqual({ [a.id]: 'manual' });
  });

  it('prefers the current id when both are saved', () => {
    const p = normalizeProgress(cat, { checks: { 'old.b': true, [b.id]: false }, values: {} }, 3);
    expect(p.checks).toEqual({});
  });

  it('stops on a cycle instead of looping', () => {
    expect(currentId({ renamedIds: { x: 'y', y: 'x' } }, 'x')).toBe('x');
  });
});
