import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (typeof window !== 'undefined') {
  // jsdom doesn't implement scrolling; ScrollRestoration calls it on every navigation.
  window.scrollTo = () => {};
}

afterEach(() => {
  if (typeof window === 'undefined') return;
  cleanup();
  window.localStorage.clear();
});
