import { useMemo } from 'react';
import type { Progress } from '../../core/types';
import { useProgress } from '../context';
import { computeScores, type Scores } from './model/scoring';

const cache = new WeakMap<Progress, Scores>();

/** KH2 scores for a progress object, memoized per (immutable) progress. */
export function scoresFor(p: Progress): Scores {
  let s = cache.get(p);
  if (!s) {
    s = computeScores(p);
    cache.set(p, s);
  }
  return s;
}

/** Trophy and profile scores for the active KH2 playthrough. */
export function useScores(): Scores {
  const p = useProgress();
  return useMemo(() => scoresFor(p), [p]);
}
