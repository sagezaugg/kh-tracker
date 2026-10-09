import { useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { parseBackup, serializeBackup } from '../core/backup';
import { canWatchFiles, loadSaveHandle, storeSaveHandle } from '../core/handleStore';
import { applyImport, importMeta, importSummary, type ImportMode } from '../core/importSave';
import { isOn } from '../core/progress';
import type { SaveSlot } from '../core/types';
import { NO_FILE, useUi, type WatchStatus } from '../core/ui';
import { useGame, useProgress, useTracker } from '../games/context';
import type { SaveSupport } from '../games/types';
import { fmtNum, useCheckToggle } from '../ui/hooks';
import common from '../ui/common.module.css';
import styles from './ConfigScreen.module.css';

interface PendingImport {
  name: string;
  slots: SaveSlot[];
  sel: number;
  err: string | null;
  /** Present when picked through the File System Access API, so the file can be watched. */
  handle?: FileSystemFileHandle;
  lastModified: number;
}

const COPY_BLOCKED = 'Copy was blocked. Select the code and copy it by hand.';

function watchText(st: WatchStatus, slot: string | undefined, mode: ImportMode): string {
  switch (st.kind) {
    case 'unsupported':
      return "This browser can't watch files. Auto re-import works in Chrome and Edge; here, import again after you save.";
    case 'no-file':
      return 'Import a save above and it will be re-imported every time the game saves.';
    case 'off':
      return 'Off. Your next import still remembers the file, so you can turn this back on any time.';
    case 'needs-permission':
      return `${st.fileName}: after a reload the browser needs your OK before it reads the file again.`;
    case 'watching': {
      const how = `${slot ?? 'its slot'}, ${mode === 'add' ? 'only adding new checks' : 'syncing'}`;
      const when = st.checkedAt ? ` Last checked ${new Date(st.checkedAt).toLocaleTimeString()}.` : '';
      return `Watching ${st.fileName} (${how}).${when}`;
    }
    case 'error':
      return st.message;
  }
}

/** Save import card: file picker, slot picker, preview, Sync / Only add, and auto re-import. */
function ImportCard({ save }: { save: SaveSupport }) {
  const game = useGame();
  const p = useProgress();
  const importSave = useTracker((s) => s.importSave);
  const watch = useTracker((s) => s.watch);
  const setWatch = useTracker((s) => s.setWatch);
  const showToast = useUi((s) => s.showToast);
  const watchStatus = useUi((s) => s.watchStatus[game.id] ?? NO_FILE);
  const restartWatch = useUi((s) => s.restartWatch);
  const [imp, setImp] = useState<PendingImport | null>(null);

  const readFile = async (f: File, handle?: FileSystemFileHandle) => {
    const base = { name: f.name, handle, lastModified: f.lastModified };
    try {
      // The file never leaves the browser.
      const res = save.parse(await f.arrayBuffer());
      setImp({ ...base, slots: res.slots, sel: res.slots.length - 1, err: save.error(res) });
    } catch {
      setImp({ ...base, slots: [], sel: -1, err: "Couldn't read that file." });
    }
    useUi.getState().clearToast();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const f = input.files?.[0];
    if (f) await readFile(f);
    input.value = '';
  };

  /** Chrome/Edge: pick through the File System Access API so the file can be watched afterwards. */
  const pickWatchable = async () => {
    try {
      const [handle] = (await window.showOpenFilePicker?.({ id: `${game.id}-save` })) ?? [];
      if (handle) await readFile(await handle.getFile(), handle);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setImp({ name: '', slots: [], sel: -1, err: "Couldn't open that file.", lastModified: 0 });
      }
    }
  };

  const resumeWatching = async () => {
    const handle = await loadSaveHandle(game.id);
    if ((await handle?.requestPermission?.({ mode: 'read' })) === 'granted') restartWatch(game.id);
  };

  const slot = imp && imp.sel >= 0 ? imp.slots[imp.sel] : null;
  const preview = useMemo(() => {
    if (!slot || !imp) return null;
    const det = save.detect(slot.bytes);
    const sim = applyImport(game.catalog, p, det, importMeta(imp.name, slot), slot.difficulty, 'sync').next;
    return { det, rows: save.previewRows(det, sim) };
  }, [slot, imp, p, save, game.catalog]);

  const apply = (mode: ImportMode) => {
    if (!imp || !slot || !preview) return;
    const sum = importSave(preview.det, importMeta(imp.name, slot), slot.difficulty, mode);
    const { handle } = imp;
    setImp(null);
    showToast(`Imported ${importSummary(slot.label, sum)}`);
    if (handle) {
      setWatch({ slot: slot.label, mode, fileName: imp.name, lastModified: imp.lastModified });
      void storeSaveHandle(game.id, handle).then(() => restartWatch(game.id));
    }
  };

  const watchOn = watch.enabled && watchStatus.kind !== 'unsupported';

  return (
    <section className={common.card} aria-labelledby="cfg-import">
      <h2 className={common.cardT} id="cfg-import">
        Import a save file
      </h2>
      <p className={common.note}>{save.formatsNote}</p>
      <p className={common.note}>
        Something the tracker doesn&apos;t read yet? The <Link to="/tools/save-diff">save diff tool</Link>{' '}
        compares a save from before and after an event to find where the game stores it.
      </p>
      <div className={common.btnrow}>
        {canWatchFiles() ? (
          <button type="button" className={styles.file} onClick={pickWatchable}>
            Choose save file
          </button>
        ) : (
          <label className={styles.file}>
            Choose save file
            <input type="file" onChange={onFile} />
          </label>
        )}
        {imp && (
          <span className={common.note} style={{ margin: 0 }}>
            {imp.name}
          </span>
        )}
      </div>
      {imp?.err && <p className={`${common.note} ${common.err}`}>{imp.err}</p>}
      {imp && imp.slots.length > 0 && (
        <>
          <div className={styles.slots} role="group" aria-label="Save slots">
            {imp.slots.map((sl, i) => {
              const sel = i === imp.sel;
              return (
                <button
                  key={sl.offset}
                  type="button"
                  className={sel ? `${styles.slot} ${styles.sel}` : styles.slot}
                  aria-pressed={sel}
                  onClick={() => setImp({ ...imp, sel: i })}
                >
                  <b>{sl.label}</b>
                  <span>
                    LV {sl.lv} · {sl.world}
                  </span>
                  <span>
                    {fmtNum(sl.munny)} munny · {sl.diffName}
                  </span>
                </button>
              );
            })}
          </div>
          {preview && (
            <dl className={common.kv}>
              {preview.rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className={common.btnrow}>
            <button type="button" className={`${common.pill} ${common.red}`} onClick={() => apply('sync')}>
              Sync to this save
            </button>
            <button type="button" className={`${common.pill} ${common.blue}`} onClick={() => apply('add')}>
              Only add new checks
            </button>
            <button type="button" className={common.pill} onClick={() => setImp(null)}>
              Cancel
            </button>
          </div>
          <p className={common.note}>
            Sync makes every save-detected item match this slot exactly, except anything you changed by hand.
            Only add never unchecks anything, so it&apos;s the one to use when you track a different
            playthrough by hand. Items without a save flag are never touched.
          </p>
        </>
      )}

      <div className={styles.watch}>
        <h3 className={styles.watchT}>Auto re-import</h3>
        <div className={common.btnrow}>
          <button
            type="button"
            className={watchOn ? `${common.pill} ${common.on}` : common.pill}
            aria-pressed={watchOn}
            disabled={watchStatus.kind === 'unsupported'}
            onClick={() => setWatch({ enabled: !watch.enabled })}
          >
            Re-import when the save changes: {watch.enabled ? 'On' : 'Off'}
          </button>
          {watch.enabled && watchStatus.kind === 'needs-permission' && (
            <button type="button" className={`${common.pill} ${common.blue}`} onClick={resumeWatching}>
              Resume watching
            </button>
          )}
        </div>
        <p className={watchStatus.kind === 'error' ? `${common.note} ${common.err}` : common.note}>
          {watchText(watchStatus, watch.slot, watch.mode)}
        </p>
      </div>
    </section>
  );
}

/** Playthrough settings, save import, backup/restore and reset, for any game. */
export function ConfigScreen() {
  const game = useGame();
  const p = useProgress();
  const profile = useTracker((s) => s.profile);
  const setDifficulty = useTracker((s) => s.setDifficulty);
  const restore = useTracker((s) => s.restore);
  const reset = useTracker((s) => s.reset);
  const toggle = useCheckToggle();
  const showToast = useUi((s) => s.showToast);

  const [copyMsg, setCopyMsg] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteErr, setPasteErr] = useState('');
  const [resetArm, setResetArm] = useState(false);

  const exportText = useMemo(
    () => serializeBackup(game.backup.app, p, profile),
    [game.backup.app, p, profile],
  );

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyMsg('Copied.');
    } catch {
      setCopyMsg(COPY_BLOCKED);
    }
  };

  const loadPaste = () => {
    const r = parseBackup(game.backup, pasteText);
    if (!r) {
      setPasteErr(`That isn't a ${game.short} backup code from this tracker.`);
      return;
    }
    restore(r);
    setPasteText('');
    setPasteErr('');
    showToast('Backup restored.');
  };

  return (
    <>
      <section className={common.card} aria-labelledby="cfg-play">
        <h2 className={common.cardT} id="cfg-play">
          Playthrough
        </h2>
        <p className={common.note}>{game.playthroughNote}</p>
        <div className={common.btnrow} role="group" aria-label="Difficulty">
          {game.difficulties.map((d, i) => {
            const sel = p.difficulty === i;
            return (
              <button
                key={d}
                type="button"
                className={sel ? `${common.pill} ${common.on}` : common.pill}
                aria-pressed={sel}
                onClick={() => setDifficulty(sel ? undefined : i)}
              >
                {d}
              </button>
            );
          })}
        </div>
        {game.configToggles.map((t) => {
          const on = isOn(p, t.id);
          return (
            <div key={t.id} className={common.btnrow} style={{ marginTop: 10 }}>
              <button
                type="button"
                className={on ? `${common.pill} ${common.on}` : common.pill}
                aria-pressed={on}
                onClick={() => toggle(t.id)}
              >
                {on ? t.on : t.off}
              </button>
            </div>
          );
        })}
      </section>

      {game.save ? (
        <ImportCard save={game.save} />
      ) : (
        <section className={common.card} aria-labelledby="cfg-import">
          <h2 className={common.cardT} id="cfg-import">
            Import a save file
          </h2>
          <p className={common.note}>
            Save import isn&apos;t available for {game.short} yet. Check items off by hand.
          </p>
        </section>
      )}

      <section className={common.card} aria-labelledby="cfg-backup">
        <h2 className={common.cardT} id="cfg-backup">
          Back up your progress
        </h2>
        <p className={common.note}>
          Your {game.short} progress is kept in this browser. Copy this code somewhere safe, or paste it into
          another browser to move your progress there.
        </p>
        <label>
          <span className="sr-only">Backup code</span>
          <textarea className={common.ta} readOnly value={exportText} onFocus={(e) => e.target.select()} />
        </label>
        <div className={common.btnrow}>
          <button type="button" className={`${common.pill} ${common.blue}`} onClick={copyExport}>
            Copy backup code
          </button>
          {copyMsg && (
            <span className={copyMsg === COPY_BLOCKED ? common.err : common.ok} role="status">
              {copyMsg}
            </span>
          )}
        </div>
      </section>

      <section className={common.card} aria-labelledby="cfg-restore">
        <h2 className={common.cardT} id="cfg-restore">
          Restore from a backup
        </h2>
        <label>
          <span className="sr-only">Paste backup code</span>
          <textarea
            className={common.ta}
            placeholder="Paste a backup code here"
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              setPasteErr('');
            }}
          />
        </label>
        <div className={common.btnrow}>
          <button
            type="button"
            className={`${common.pill} ${common.blue}`}
            onClick={loadPaste}
            disabled={!pasteText.trim()}
          >
            Restore
          </button>
          {pasteErr && (
            <span className={common.err} role="alert">
              {pasteErr}
            </span>
          )}
        </div>
      </section>

      <section className={common.card} aria-labelledby="cfg-reset">
        <h2 className={common.cardT} id="cfg-reset">
          Start over
        </h2>
        <p className={common.note}>Erases every {game.short} check, level and custom goal in this browser.</p>
        <button
          type="button"
          className={`${common.pill} ${common.red}`}
          onClick={() => {
            if (!resetArm) {
              setResetArm(true);
              return;
            }
            reset();
            setResetArm(false);
            showToast('All progress erased.');
          }}
          onBlur={() => setResetArm(false)}
        >
          {resetArm ? 'Press again to erase everything' : 'Reset all progress'}
        </button>
      </section>
    </>
  );
}
