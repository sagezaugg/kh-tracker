import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage that never throws. Private mode, blocked storage or a full quota fall back to an
 * in-memory map, so the app keeps working for the session.
 */
export function createSafeStorage(fallbackRead?: (name: string) => string | null): StateStorage {
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
      let v: string | null = null;
      try {
        v = ls()?.getItem(name) ?? null;
      } catch {
        v = null;
      }
      v ??= memory.get(name) ?? null;
      if (v === null && fallbackRead) {
        try {
          v = fallbackRead(name);
        } catch {
          v = null;
        }
      }
      return v;
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

/** Reads a raw localStorage key without throwing. */
export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
