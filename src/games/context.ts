import { createContext, useCallback, useContext } from 'react';
import { useStore } from 'zustand';
import { activeProgress, type TrackerState } from '../core/store';
import type { Progress } from '../core/types';
import type { GameDefinition, NavEntry } from './types';

export const GameContext = createContext<GameDefinition | null>(null);

/** The game whose screens are showing. Throws outside a game route. */
export function useGame(): GameDefinition {
  const g = useContext(GameContext);
  if (!g) throw new Error('useGame() needs a GameContext provider');
  return g;
}

/** Selects from the current game's tracker store. */
export function useTracker<T>(selector: (s: TrackerState) => T): T {
  return useStore(useGame().store, selector);
}

export function useProgress(): Progress {
  return useTracker(activeProgress);
}

/** Absolute path inside the current game: `href('worlds/tt')` → `/kh2/worlds/tt`. */
export function useGameHref(): (path?: string) => string {
  const base = useGame().basePath;
  return useCallback((path = '') => (path ? `${base}/${path.replace(/^\//, '')}` : base), [base]);
}

export function navHref(game: GameDefinition, n: NavEntry): string {
  return n.path ? `${game.basePath}/${n.path}` : game.basePath;
}

/** The menu entry that owns a pathname (`/kh2/worlds/lod` → Worlds). */
export function navForPath(game: GameDefinition, pathname: string): NavEntry | undefined {
  if (!pathname.startsWith(game.basePath)) return undefined;
  const rest = pathname.slice(game.basePath.length).split('/').filter(Boolean);
  return game.nav.find((n) => n.path === (rest[0] ?? ''));
}
