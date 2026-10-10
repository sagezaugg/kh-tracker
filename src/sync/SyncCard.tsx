import { useEffect, useState } from 'react';
import common from '../ui/common.module.css';
import {
  disableSync,
  enableSync,
  gameNames,
  joinSync,
  resolveSync,
  syncNow,
  useSync,
  type SyncStatus,
} from './engine';
import styles from './SyncCard.module.css';

function ago(at: number | null, now: number): string {
  if (!at) return 'not yet';
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(at).toLocaleDateString();
}

function statusText(st: SyncStatus, lastSyncAt: number | null, now: number): string {
  switch (st.kind) {
    case 'syncing':
      return 'Syncing…';
    case 'offline':
      return "Offline. Changes will sync when you're back online.";
    case 'error':
      return st.message;
    default:
      return `Synced ${ago(lastSyncAt, now)}.`;
  }
}

/** Config card for cross-device sync. One code covers every game, so it's the same card on each game. */
export function SyncCard() {
  const { code, status, lastSyncAt } = useSync();
  const [entry, setEntry] = useState('');
  const [joinError, setJoinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const join = () =>
    run(async () => {
      setJoinError('');
      const { error } = await joinSync(entry);
      if (error) setJoinError(error);
      else setEntry('');
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code ?? '');
      setCopied('Copied.');
    } catch {
      setCopied('Select the code and copy it.');
    }
  };

  return (
    <section className={common.card} aria-labelledby="cfg-sync">
      <h2 className={common.cardT} id="cfg-sync">
        Sync between devices
      </h2>

      {!code ? (
        <>
          <p className={common.note}>
            Keep your progress for every game in step across your devices with a 6-character code. Anyone with
            the code can see and change the progress, so only share it with people you trust.
          </p>
          <div className={common.btnrow}>
            <button
              type="button"
              className={`${common.pill} ${common.blue}`}
              onClick={() => run(enableSync)}
              disabled={busy}
            >
              Turn on sync
            </button>
          </div>
          {status.kind === 'error' && (
            <p className={common.err} role="alert">
              {status.message}
            </p>
          )}
          <form
            className={styles.join}
            onSubmit={(e) => {
              e.preventDefault();
              void join();
            }}
          >
            <label className={styles.joinLabel}>
              <span>Have a code from another device?</span>
              <input
                className={`${common.search} ${styles.codeInput}`}
                value={entry}
                onChange={(e) => setEntry(e.target.value.toUpperCase())}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABC123"
              />
            </label>
            <button type="submit" className={common.pill} disabled={busy || entry.trim().length !== 6}>
              Use this code
            </button>
          </form>
          {joinError && (
            <p className={common.err} role="alert">
              {joinError}
            </p>
          )}
        </>
      ) : (
        <>
          <p className={common.note}>
            Enter this code on your other devices. Progress for every game syncs automatically.
          </p>
          <div className={styles.codeRow}>
            <output className={styles.code} aria-label="Your sync code">
              {code}
            </output>
            <button type="button" className={common.pill} onClick={copy}>
              Copy code
            </button>
            {copied && <span className={common.ok}>{copied}</span>}
          </div>

          {status.kind === 'conflict' && (
            <div className={styles.ask} role="alert">
              <p>
                <b>{gameNames(status.games)}</b> progress changed on this device and on another one since the
                last sync. Which should every device keep?
              </p>
              <div className={common.btnrow}>
                <button type="button" className={common.pill} onClick={() => run(() => resolveSync('mine'))}>
                  Keep this device&apos;s
                </button>
                <button
                  type="button"
                  className={common.pill}
                  onClick={() => run(() => resolveSync('theirs'))}
                >
                  Use the other device&apos;s
                </button>
              </div>
            </div>
          )}

          {status.kind === 'join-choice' && (
            <div className={styles.ask} role="alert">
              <p>
                This device already has progress. Use the progress saved under <b>{code}</b> (replacing this
                device&apos;s), or upload this device&apos;s progress to that code?
              </p>
              <div className={common.btnrow}>
                <button
                  type="button"
                  className={common.pill}
                  onClick={() => run(() => resolveSync('theirs'))}
                >
                  Use the synced progress
                </button>
                <button type="button" className={common.pill} onClick={() => run(() => resolveSync('mine'))}>
                  Upload this device&apos;s
                </button>
                <button type="button" className={common.pill} onClick={disableSync}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status.kind !== 'conflict' && status.kind !== 'join-choice' && (
            <p className={status.kind === 'error' ? common.err : common.note} role="status">
              {statusText(status, lastSyncAt, now)}
            </p>
          )}

          <div className={common.btnrow}>
            <button
              type="button"
              className={common.pill}
              onClick={() => run(syncNow)}
              disabled={busy || status.kind === 'conflict' || status.kind === 'join-choice'}
            >
              Sync now
            </button>
            <button type="button" className={common.pill} onClick={disableSync}>
              Stop syncing on this device
            </button>
          </div>
        </>
      )}
    </section>
  );
}
