import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage that never throws. Private mode, blocked storage or a full quota fall back to an
 * in-memory map, so the app keeps working for the session.
 */
export function createSafeStorage(): StateStorage {
  const memory = new Map<string, string>();
  const ls = (): Storage | null => {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      return null;
    }
  };
  return {
    getItem(name) {
      let v: string | null;
      try {
        v = ls()?.getItem(name) ?? null;
      } catch {
        v = null;
      }
      return v ?? memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
      try {
        ls()?.setItem(name, value);
      } catch {
        // Keep the in-memory copy.
      }
    },
    removeItem(name) {
      memory.delete(name);
      try {
        ls()?.removeItem(name);
      } catch {
        // Nothing to do.
      }
    },
  };
}
