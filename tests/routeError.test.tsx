import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { routes } from '../src/router';
import { RouteError } from '../src/shell/RouteError';
import { describeError, issueUrl } from '../src/shell/errorInfo';

function Broken(): never {
  throw new Error('kaboom');
}

beforeEach(() => {
  // React and the error screen both log the thrown error; keep the test output readable.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const renderBroken = (path = '/kh2/worlds') => {
  const router = createMemoryRouter([{ path: '*', element: <Broken />, errorElement: <RouteError /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
};

describe('error screen', () => {
  it('is the root route error element, so every page is covered', () => {
    expect(routes[0].errorElement).toBeDefined();
  });

  it('replaces a page that throws, and says progress is safe', () => {
    renderBroken();
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText(/Your progress is safe/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the game list' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Error: kaboom')).toBeInTheDocument();
    expect(document.title).toBe('Something went wrong · Kingdom Hearts 100% Tracker');
  });

  it('prefills a GitHub issue with the page and error only', () => {
    renderBroken('/kh1/journal');
    const href = screen.getByRole('link', { name: 'Report it on GitHub' }).getAttribute('href')!;
    const url = new URL(href);
    expect(url.pathname).toBe('/sagezaugg/kh-tracker/issues/new');
    expect(url.searchParams.get('title')).toBe('Error on /kh1/journal');
    expect(url.searchParams.get('body')).toContain('`Error: kaboom`');
  });

  it('describes thrown values of any kind', () => {
    expect(describeError(new TypeError('bad'))).toBe('TypeError: bad');
    expect(describeError('plain')).toBe('plain');
    expect(issueUrl('/x', 'y')).toContain('issues/new?title=Error+on+%2Fx');
  });

  it('has no axe violations', async () => {
    renderBroken();
    const res = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, 'label-content-name-mismatch': { enabled: false } },
    });
    expect(res.violations.map((v) => v.id)).toEqual([]);
  });
});
