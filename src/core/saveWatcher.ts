import { useEffect } from 'react';
import { useStore } from 'zustand';
import type { GameDefinition } from '../games/types';
import { canWatchFiles, loadSaveHandle } from './handleStore';
import { importMeta, importSummary, pickSlot } from './importSave';
import { useUi, type WatchStatus } from './ui';

/** How often a watched file's modified time is checked. */
export const POLL_MS = 3000;

export interface PollMemory {
  /** A change seen on the last poll, imported once it holds still for one more poll. */
  pending?: { lastModified: number; size: number };
  /** A version that failed to parse; skipped until the file changes again. */
  failed?: number;
}

export type PollResult =
  | { kind: 'unchanged' | 'pending' }
  | { kind: 'imported'; message: string }
  | { kind: 'failed'; message: string };

/**
 * Checks a game's watched file once. A new version is imported only after it has stayed the same
 * for two polls, so a save the game is still writing isn't read half-finished. Items set by hand
 * are left alone, as with a manual import.
 */
export async function pollOnce(
  game: GameDefinition,
  handle: FileSystemFileHandle,
  mem: PollMemory,
): Promise<PollResult> {
  const save = game.save;
  if (!save) return { kind: 'unchanged' };
  const file = await handle.getFile();
  const { watch, importSave, setWatch } = game.store.getState();
  const stamp = { lastModified: file.lastModified, size: file.size };

  if (stamp.lastModified === watch.lastModified || stamp.lastModified === mem.failed) {
    mem.pending = undefined;
    return { kind: 'unchanged' };
  }
  if (mem.pending?.lastModified !== stamp.lastModified || mem.pending.size !== stamp.size) {
    mem.pending = stamp;
    return { kind: 'pending' };
  }
  mem.pending = undefined;

  const res = save.parse(await file.arrayBuffer());
  const slot = pickSlot(res.slots, watch.slot);
  if (!slot) {
    mem.failed = stamp.lastModified;
    return {
      kind: 'failed',
      message: `The save changed, but ${watch.slot ?? 'a single save slot'} wasn't found in it.`,
    };
  }
  const sum = importSave(save.detect(slot.bytes), importMeta(file.name, slot), slot.difficulty, watch.mode);
  setWatch({ lastModified: stamp.lastModified, slot: slot.label, fileName: file.name });
  return {
    kind: 'imported',
    message: `${game.short} save changed. Re-imported ${importSummary(slot.label, sum)}`,
  };
}

/** Works out whether watching can run right now, without prompting the user. */
async function startStatus(gameId: string): Promise<{ status: WatchStatus; handle?: FileSystemFileHandle }> {
  if (!canWatchFiles()) return { status: { kind: 'unsupported' } };
  const handle = await loadSaveHandle(gameId);
  if (!handle) return { status: { kind: 'no-file' } };
  const perm = (await handle.queryPermission?.({ mode: 'read' })) ?? 'granted';
  if (perm !== 'granted') return { status: { kind: 'needs-permission', fileName: handle.name } };
  return { status: { kind: 'watching', fileName: handle.name, checkedAt: null }, handle };
}

/** Background watcher for one game. Renders nothing; reports through useUi().watchStatus[game.id]. */
export function SaveWatcher({ game }: { game: GameDefinition }) {
  const enabled = useStore(game.store, (s) => s.watch.enabled);
  const nonce = useUi((s) => s.watchNonce[game.id] ?? 0);

  useEffect(() => {
    if (!game.save) return;
    const setStatus = (st: WatchStatus) => useUi.getState().setWatchStatus(game.id, st);
    if (!enabled) {
      setStatus({ kind: canWatchFiles() ? 'off' : 'unsupported' });
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mem: PollMemory = {};

    void startStatus(game.id).then(({ status, handle }) => {
      if (stopped) return;
      setStatus(status);
      if (!handle) return;
      const tick = async () => {
        try {
          const r = await pollOnce(game, handle, mem);
          if (stopped) return;
          if (r.kind === 'imported') useUi.getState().showToast(r.message);
          if (r.kind === 'failed') setStatus({ kind: 'error', fileName: handle.name, message: r.message });
          else setStatus({ kind: 'watching', fileName: handle.name, checkedAt: Date.now() });
        } catch {
          if (stopped) return;
          setStatus({
            kind: 'error',
            fileName: handle.name,
            message: `Can't read ${handle.name} any more. It may have been moved or deleted; choose it again.`,
          });
        }
        if (!stopped) timer = setTimeout(tick, POLL_MS);
      };
      void tick();
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [game, enabled, nonce]);

  return null;
}
