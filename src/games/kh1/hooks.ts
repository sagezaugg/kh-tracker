import { useMemo } from 'react';
import type { Progress } from '../../core/types';
import { useProgress } from '../context';
import { computeKh1Scores, type Kh1Scores } from './model/scoring';

const cache = new WeakMap<Progress, Kh1Scores>();

export function kh1ScoresFor(p: Progress): Kh1Scores {
  let s = cache.get(p);
  if (!s) {
    s = computeKh1Scores(p);
    cache.set(p, s);
  }
  return s;
}

export function useKh1Scores(): Kh1Scores {
  const p = useProgress();
  return useMemo(() => kh1ScoresFor(p), [p]);
}
