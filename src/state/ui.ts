import { create } from 'zustand';

export type ToastKind = 'info' | 'trophy';

interface UiState {
  /** Help-bar text from the hovered/focused control; null falls back to the screen's help. */
  hint: string | null;
  toast: string | null;
  toastKind: ToastKind;
  /** Item id that was just checked by hand, for the one-shot pop animation. */
  pop: string | null;
  setHint: (hint: string | null) => void;
  showToast: (text: string, kind?: ToastKind) => void;
  clearToast: () => void;
  setPop: (id: string | null) => void;
}

/** Transient, never-persisted UI state shared across the shell and screens. */
export const useUi = create<UiState>()((set) => ({
  hint: null,
  toast: null,
  toastKind: 'info',
  pop: null,
  setHint: (hint) => set({ hint }),
  showToast: (text, kind = 'info') => set({ toast: text, toastKind: kind }),
  clearToast: () => set({ toast: null, toastKind: 'info' }),
  setPop: (pop) => set({ pop }),
}));
