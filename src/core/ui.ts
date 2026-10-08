import { create } from 'zustand';

export type ToastKind = 'info' | 'trophy';

/** What a game's save watcher is doing, for its Config screen. */
export type WatchStatus =
  | { kind: 'off' }
  | { kind: 'unsupported' }
  | { kind: 'no-file' }
  | { kind: 'needs-permission'; fileName: string }
  | { kind: 'watching'; fileName: string; checkedAt: number | null }
  | { kind: 'error'; fileName: string; message: string };

interface UiState {
  /** Help-bar text from the hovered/focused control; null falls back to the screen's help. */
  hint: string | null;
  toast: string | null;
  toastKind: ToastKind;
  /** Item id that was just checked by hand, for the one-shot pop animation. */
  pop: string | null;
  /** Per game id. */
  watchStatus: Record<string, WatchStatus>;
  /** Per game id; bumped to restart that game's watcher (new file picked, permission granted). */
  watchNonce: Record<string, number>;
  /** A new version of the site took over this tab; it shows once the page reloads. */
  updateReady: boolean;
  setHint: (hint: string | null) => void;
  showToast: (text: string, kind?: ToastKind) => void;
  clearToast: () => void;
  setPop: (id: string | null) => void;
  setWatchStatus: (gameId: string, status: WatchStatus) => void;
  restartWatch: (gameId: string) => void;
  setUpdateReady: (ready: boolean) => void;
}

export const NO_FILE: WatchStatus = { kind: 'no-file' };

/** Transient, never-persisted UI state shared across the shell and screens. */
export const useUi = create<UiState>()((set) => ({
  hint: null,
  toast: null,
  toastKind: 'info',
  pop: null,
  watchStatus: {},
  watchNonce: {},
  updateReady: false,
  setHint: (hint) => set({ hint }),
  showToast: (text, kind = 'info') => set({ toast: text, toastKind: kind }),
  clearToast: () => set({ toast: null, toastKind: 'info' }),
  setPop: (pop) => set({ pop }),
  setWatchStatus: (gameId, status) => set((s) => ({ watchStatus: { ...s.watchStatus, [gameId]: status } })),
  restartWatch: (gameId) =>
    set((s) => ({ watchNonce: { ...s.watchNonce, [gameId]: (s.watchNonce[gameId] ?? 0) + 1 } })),
  setUpdateReady: (updateReady) => set({ updateReady }),
}));
