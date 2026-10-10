import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { activeProgress, syncedPart } from '../core/store';
import { createSafeStorage } from '../core/storage';
import type { GameDefinition } from '../games/types';
import { syncApi, type RemoteDoc } from './api';

/**
 * Keeps every game's progress in step across devices through one sync code.
 *
 * Per game it compares three fingerprints: `base` (what was last synced), local (this device now) and
 * remote (the server now). Only remote changed: apply it. Only local changed: upload. Both changed: ask.
 * Games this build doesn't know (added in a later version) are kept untouched in `extra` and sent back,
 * so an older device never deletes a newer game's progress.
 */

export type SyncStatus =
  | { kind: 'off' }
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | { kind: 'offline' }
  | { kind: 'error'; message: string }
  /** The same game changed here and on another device since the last sync. */
  | { kind: 'conflict'; games: string[]; remote: RemoteDoc }
  /** Joining a code while this device already has progress. */
  | { kind: 'join-choice'; remote: RemoteDoc };

interface SyncPersisted {
  code: string | null;
  rev: number;
  /** Game id -> fingerprint of the data last agreed with the server. */
  base: Record<string, string>;
  /** Remote games this build doesn't know, sent back unchanged. */
  extra: Record<string, unknown>;
  lastSyncAt: number | null;
}

interface SyncState extends SyncPersisted {
  status: SyncStatus;
}

const initial: SyncPersisted = { code: null, rev: 0, base: {}, extra: {}, lastSyncAt: null };

export const useSync = create<SyncState>()(
  persist(() => ({ ...initial, status: { kind: 'off' } as SyncStatus }), {
    name: 'kh-tracker-sync',
    storage: createJSONStorage(() => createSafeStorage()),
    partialize: ({ code, rev, base, extra, lastSyncAt }): SyncPersisted => ({
      code,
      rev,
      base,
      extra,
      lastSyncAt,
    }),
    merge: (persisted, current) => {
      const p = (persisted ?? {}) as Partial<SyncPersisted>;
      const code = typeof p.code === 'string' ? p.code : null;
      return {
        ...current,
        code,
        rev: typeof p.rev === 'number' ? p.rev : 0,
        base: p.base && typeof p.base === 'object' ? p.base : {},
        extra: p.extra && typeof p.extra === 'object' ? p.extra : {},
        lastSyncAt: typeof p.lastSyncAt === 'number' ? p.lastSyncAt : null,
        status: code ? { kind: 'idle' } : { kind: 'off' },
      };
    },
  }),
);

const set = (patch: Partial<SyncState>): void => {
  useSync.setState(patch);
};
/**
 * The games to sync, handed over by the shell (configureSync). Importing the registry here would form a
 * cycle: each game's Config screen imports this module.
 */
let GAMES: readonly GameDefinition[] = [];
export function configureSync(games: readonly GameDefinition[]): void {
  GAMES = games;
}
const isKnown = (id: string) => GAMES.some((g) => g.id === id);

/**
 * Key-order-independent JSON, so equal data always fingerprints the same. Like JSON, it skips keys whose
 * value is undefined: data that has been sent and applied must fingerprint the same as the original, or every
 * pull would trigger an upload.
 */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

/** cyrb53: a fast 53-bit string hash; collisions are irrelevant at this scale. */
export function fingerprint(v: unknown): string {
  const str = canonical(v);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const localData = () =>
  Object.fromEntries(GAMES.map((g) => [g.id, syncedPart(g.store.getState())])) as Record<string, unknown>;

/** Whether any game on this device has progress worth protecting. */
export function hasLocalProgress(): boolean {
  return GAMES.some((g) => {
    const s = g.store.getState();
    const p = activeProgress(s);
    return (
      Object.keys(s.playthroughs).length > 1 ||
      Object.keys(p.checks).length > 0 ||
      Object.keys(p.values).length > 0 ||
      p.custom.length > 0 ||
      p.lastImport !== undefined
    );
  });
}

const gameName = (id: string) => GAMES.find((g) => g.id === id)?.short ?? id;
export const gameNames = (ids: readonly string[]) => ids.map(gameName).join(' and ');

function applyGame(id: string, data: unknown) {
  GAMES.find((g) => g.id === id)
    ?.store.getState()
    .applySynced(data);
}

const extraOf = (remote: RemoteDoc) =>
  Object.fromEntries(Object.entries(remote.games).filter(([id]) => !isKnown(id)));

/**
 * Brings this device in line with a remote doc. Applies games only the other side changed and reports
 * which games still need uploading and which conflict.
 */
function reconcile(remote: RemoteDoc): { push: boolean; conflicts: string[] } {
  const { base } = useSync.getState();
  const nextBase = { ...base };
  const conflicts: string[] = [];
  let push = false;
  for (const g of GAMES) {
    const r = remote.games[g.id];
    const R = r === undefined ? undefined : fingerprint(r);
    const L = fingerprint(syncedPart(g.store.getState()));
    const B = base[g.id];
    if (R === L) nextBase[g.id] = L;
    else if (R === undefined) push = true;
    else if (L === B) {
      applyGame(g.id, r);
      // Base is what the server holds; if normalising changed it, the next push uploads the tidy version.
      nextBase[g.id] = R;
      if (fingerprint(syncedPart(g.store.getState())) !== R) push = true;
    } else if (R === B) push = true;
    else conflicts.push(g.id);
  }
  set({ base: nextBase, rev: remote.rev, extra: extraOf(remote), lastSyncAt: Date.now() });
  return { push, conflicts };
}

let running: Promise<void> | null = null;
let again = false;

/** Runs sync steps one at a time; a request during a run schedules exactly one more run. */
function serial(step: () => Promise<void>): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await step();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

function failed(status: number, error?: string) {
  if (status === 404) {
    set({
      status: {
        kind: 'error',
        message: 'That sync code no longer exists. Stop syncing and turn it on again for a new code.',
      },
    });
  } else {
    set({ status: { kind: 'error', message: error ?? 'Sync failed. It will try again shortly.' } });
  }
}

async function upload(depth = 0): Promise<void> {
  const { code, rev, extra } = useSync.getState();
  if (!code) return;
  const local = localData();
  const res = await syncApi.put(code, rev, { ...extra, ...local });
  if (res.offline) return set({ status: { kind: 'offline' } });
  if (res.status === 200) {
    const base = Object.fromEntries(Object.entries(local).map(([id, d]) => [id, fingerprint(d)]));
    return set({ rev: res.body.rev, base, lastSyncAt: Date.now(), status: { kind: 'idle' } });
  }
  if (res.status === 409 && res.body.current && depth < 3) {
    const { push, conflicts } = reconcile(res.body.current);
    if (conflicts.length)
      return set({ status: { kind: 'conflict', games: conflicts, remote: res.body.current } });
    if (push) return upload(depth + 1);
    return set({ status: { kind: 'idle' } });
  }
  failed(res.status, res.body.error);
}

/** Pulls the latest from the server, applies what changed elsewhere and uploads what changed here. */
export function syncNow(): Promise<void> {
  return serial(async () => {
    const { code, status } = useSync.getState();
    if (!code || status.kind === 'conflict' || status.kind === 'join-choice') return;
    set({ status: { kind: 'syncing' } });
    const res = await syncApi.get(code);
    if (res.offline) return set({ status: { kind: 'offline' } });
    if (res.status !== 200) return failed(res.status, res.body.error);
    const { push, conflicts } = reconcile(res.body);
    if (conflicts.length) return set({ status: { kind: 'conflict', games: conflicts, remote: res.body } });
    if (push) return upload();
    set({ status: { kind: 'idle' } });
  });
}

/** Uploads local changes if there are any (called a few seconds after progress changes). */
export function pushIfChanged(): Promise<void> {
  const { code, base, status } = useSync.getState();
  if (!code || status.kind === 'conflict' || status.kind === 'join-choice') return Promise.resolve();
  const changed = GAMES.some((g) => fingerprint(syncedPart(g.store.getState())) !== base[g.id]);
  if (!changed) return Promise.resolve();
  return serial(async () => {
    set({ status: { kind: 'syncing' } });
    await upload();
  });
}

/** Creates a new code holding this device's progress. */
export async function enableSync(): Promise<void> {
  set({ status: { kind: 'syncing' } });
  const local = localData();
  const res = await syncApi.create(local);
  if (res.offline)
    return set({
      status: {
        kind: 'error',
        message: "Can't reach the sync service. Check your connection and try again.",
      },
    });
  if (res.status !== 201)
    return set({ status: { kind: 'error', message: res.body.error ?? 'Could not turn on sync.' } });
  const base = Object.fromEntries(Object.entries(local).map(([id, d]) => [id, fingerprint(d)]));
  set({
    code: res.body.code,
    rev: res.body.rev,
    base,
    extra: {},
    lastSyncAt: Date.now(),
    status: { kind: 'idle' },
  });
}

/** Starts syncing with an existing code. Asks first if this device has progress of its own. */
export async function joinSync(rawCode: string): Promise<{ error?: string }> {
  const code = rawCode.trim().toUpperCase();
  const res = await syncApi.get(code);
  if (res.offline) return { error: "Can't reach the sync service. Check your connection and try again." };
  if (res.status !== 200) return { error: res.body.error ?? 'Could not find that code.' };
  set({ code, rev: res.body.rev, base: {}, extra: extraOf(res.body) });
  if (hasLocalProgress()) {
    set({ status: { kind: 'join-choice', remote: res.body } });
  } else {
    adoptRemote(
      res.body,
      GAMES.map((g) => g.id),
    );
    set({ status: { kind: 'idle' } });
  }
  return {};
}

function adoptRemote(remote: RemoteDoc, ids: readonly string[]) {
  const base = { ...useSync.getState().base };
  for (const id of ids) {
    const r = remote.games[id];
    if (r === undefined) continue;
    applyGame(id, r);
    base[id] = fingerprint(r);
  }
  set({ base, rev: remote.rev, extra: extraOf(remote), lastSyncAt: Date.now() });
}

/** Settles a join or conflict question: keep this device's progress, or take the other device's. */
export async function resolveSync(choice: 'mine' | 'theirs'): Promise<void> {
  const { status } = useSync.getState();
  if (status.kind !== 'conflict' && status.kind !== 'join-choice') return;
  const remote = status.remote;
  const ids = status.kind === 'conflict' ? status.games : GAMES.map((g) => g.id);
  if (choice === 'theirs') {
    adoptRemote(remote, ids);
  } else {
    // Treat the server's copy as the base, so this device's data counts as the newer change and uploads.
    const base = { ...useSync.getState().base };
    for (const id of ids) {
      const r = remote.games[id];
      if (r !== undefined) base[id] = fingerprint(r);
      else delete base[id];
    }
    set({ base, rev: remote.rev, extra: extraOf(remote) });
  }
  set({ status: { kind: 'idle' } });
  await syncNow();
}

/** Stops syncing on this device. Its progress stays; the code keeps working on other devices. */
export function disableSync(): void {
  set({ ...initial, status: { kind: 'off' } });
}
