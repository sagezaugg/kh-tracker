import { act, render } from '@testing-library/react';
import axe from 'axe-core';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routerFuture, routes } from '../src/router';
import { initialData, useTracker } from '../src/state/store';

const PATHS = [
  '/',
  '/left',
  '/worlds/lod',
  '/journal',
  '/trophies',
  '/synthesis',
  '/drive',
  '/keyblades',
  '/records',
  '/config',
  '/missing',
];

beforeEach(() => {
  act(() => useTracker.setState(initialData()));
});

describe('accessibility smoke test (axe)', () => {
  it.each(PATHS)('%s has no axe violations', async (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
    const { container } = render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
    // jsdom can't compute colours or layout (contrast is checked by hand against the tokens), and
    // label-content-name-mismatch needs layout too.
    const res = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, 'label-content-name-mismatch': { enabled: false } },
    });
    expect(
      res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
});
