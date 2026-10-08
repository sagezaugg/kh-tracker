import { create } from 'zustand';

export type ToastKind = 'info' | 'trophy';

/** What the save watcher is doing, for the Config screen. */
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
  watchStatus: WatchStatus;
  /** Bumped to restart the watcher (new file picked, permission granted). */
  watchNonce: number;
  setHint: (hint: string | null) => void;
  showToast: (text: string, kind?: ToastKind) => void;
  clearToast: () => void;
  setPop: (id: string | null) => void;
  restartWatch: () => void;
}

/** Transient, never-persisted UI state shared across the shell and screens. */
export const useUi = create<UiState>()((set) => ({
  hint: null,
  toast: null,
  toastKind: 'info',
  pop: null,
  watchStatus: { kind: 'no-file' },
  watchNonce: 0,
  setHint: (hint) => set({ hint }),
  showToast: (text, kind = 'info') => set({ toast: text, toastKind: kind }),
  clearToast: () => set({ toast: null, toastKind: 'info' }),
  setPop: (pop) => set({ pop }),
  restartWatch: () => set((s) => ({ watchNonce: s.watchNonce + 1 })),
}));
