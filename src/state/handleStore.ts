/**
 * Keeps the watched save's FileSystemFileHandle in IndexedDB (handles can't go in localStorage).
 * Every call fails soft: no IndexedDB, private mode or a blocked database just means no handle.
 */
const DB = 'kh2fm-tracker';
const STORE = 'handles';
const KEY = 'save';

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    } finally {
      db.close();
    }
  });
}

export async function loadSaveHandle(): Promise<FileSystemFileHandle | null> {
  const h = await run<unknown>('readonly', (s) => s.get(KEY));
  return h && typeof h === 'object' && 'getFile' in h ? (h as FileSystemFileHandle) : null;
}

export async function storeSaveHandle(handle: FileSystemFileHandle): Promise<boolean> {
  return (await run('readwrite', (s) => s.put(handle, KEY))) !== null;
}

export async function clearSaveHandle(): Promise<void> {
  await run('readwrite', (s) => s.delete(KEY));
}

/** True when this browser can hand out watchable file handles (Chrome, Edge). */
export function canWatchFiles(): boolean {
  return typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';
}
