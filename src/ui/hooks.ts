import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useTracker } from '../games/context';
import { useUi } from '../core/ui';

/** `?q=` text filter and `?hide=1` hide-obtained toggle, kept in the URL so views can be shared. */
export function useFilters() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const hide = params.get('hide') === '1';
  const patch = useCallback(
    (key: 'q' | 'hide', value: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return {
    q,
    hide,
    needle: q.trim().toLowerCase(),
    setQ: (v: string) => patch('q', v || null),
    toggleHide: () => patch('hide', hide ? null : '1'),
  };
}

const POP_MS = 750;

/**
 * Toggles a check by hand, with the one-shot feedback: the row pops, and if a trophy was earned
 * the help bar turns gold. Bulk changes and imports go through the store directly and stay quiet.
 */
export function useCheckToggle() {
  const toggle = useTracker((s) => s.toggle);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (id: string) => {
      const res = toggle(id);
      if (!res.on) return;
      const ui = useUi.getState();
      ui.setPop(id);
      if (res.earned.length) {
        ui.showToast(`Trophy earned: ${res.earned.map((t) => t.name).join(', ')}!`, 'trophy');
      }
      clearTimeout(timer.current);
      timer.current = setTimeout(() => useUi.getState().setPop(null), POP_MS);
    },
    [toggle],
  );
}

/** Thousands separators, or an em dash for missing values. */
export function fmtNum(n: number | null | undefined): string {
  return n == null ? '—' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
