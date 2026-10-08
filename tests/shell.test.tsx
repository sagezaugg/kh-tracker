import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routerFuture, routes } from '../src/router';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
  render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
  return router;
}

describe('app shell', () => {
  it('marks the active menu link with aria-current', () => {
    renderAt('/trophies');
    expect(screen.getByRole('link', { name: 'Trophies' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Status' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trophies');
  });

  it('redirects /worlds to Land of Dragons', () => {
    const router = renderAt('/worlds');
    expect(router.state.location.pathname).toBe('/worlds/lod');
    expect(screen.getByRole('link', { name: 'Worlds' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the not-found screen for unknown paths', () => {
    renderAt('/nowhere');
    expect(screen.getByRole('link', { name: 'Return to Status' })).toHaveAttribute('href', '/');
  });

  it('treats an unknown world id as not found', () => {
    renderAt('/worlds/kh3');
    expect(screen.getByRole('link', { name: 'Return to Status' })).toBeInTheDocument();
  });

  it('lists every menu entry in order', () => {
    renderAt('/');
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
