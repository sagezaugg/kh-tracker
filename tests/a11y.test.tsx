import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderAt, resetAll } from './helpers';

const PATHS = [
  '/',
  '/kh2',
  '/kh2/left',
  '/kh2/worlds/lod',
  '/kh2/journal',
  '/kh2/trophies',
  '/kh2/synthesis',
  '/kh2/drive',
  '/kh2/keyblades',
  '/kh2/records',
  '/kh2/config',
  '/kh2/missing',
  '/kh1',
  '/kh1/left',
  '/kh1/worlds/tt',
  '/kh1/journal',
  '/kh1/trophies',
  '/kh1/synthesis',
  '/kh1/abilities',
  '/kh1/equipment',
  '/kh1/records',
  '/kh1/config',
  '/tools/save-diff',
  '/missing',
];

beforeEach(resetAll);

describe('accessibility smoke test (axe)', () => {
  it.each(PATHS)('%s has no axe violations', async (path) => {
    renderAt(path);
    // jsdom can't compute colours or layout (contrast is checked by hand against the tokens), and
    // label-content-name-mismatch needs layout too.
    const res = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, 'label-content-name-mismatch': { enabled: false } },
    });
    expect(
      res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
});
