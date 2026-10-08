import { useEffect, useMemo, useState } from 'react';
import { bin, diffBytes, diffReport, hex, parseRange, type ByteChange } from '../core/saveDiff';
import type { Catalog, SaveProbe, SaveSlot } from '../core/types';
import { GAMES } from '../games/registry';
import { Segmented } from '../ui/Segmented';
import common from '../ui/common.module.css';
import { Frame } from './Frame';
import shell from './Shell.module.css';
import styles from './SaveDiffRoute.module.css';

const MAX_ROWS = 500;

interface Side {
  name: string;
  /** Whole file (raw mode) or parsed slots (game mode). */
  raw: Uint8Array;
  slots: SaveSlot[];
  sel: number;
  err: string | null;
}

/** offset → bit → item names, from every bit probe in a catalog. */
function knownBits(cat: Catalog): Map<number, Map<number, string[]>> {
  const m = new Map<number, Map<number, string[]>>();
  for (const item of cat.items) {
    const probes: readonly SaveProbe[] = !item.probe
      ? []
      : Array.isArray(item.probe)
        ? item.probe
        : [item.probe as SaveProbe];
    for (const p of probes) {
      if (p.type !== 'bit') continue;
      const byBit = m.get(p.offset) ?? new Map<number, string[]>();
      byBit.set(p.bit, [...(byBit.get(p.bit) ?? []), item.name]);
      m.set(p.offset, byBit);
    }
  }
  return m;
}

/** Compare two saves byte by byte to find where the game stores a flag or counter. */
export function SaveDiffRoute() {
  useEffect(() => {
    document.title = 'Save Diff · Kingdom Hearts 100% Tracker';
  }, []);
  const games = GAMES.filter((g) => g.save);
  const [mode, setMode] = useState<string>(games[games.length - 1]?.id ?? 'raw');
  const [sides, setSides] = useState<[Side | null, Side | null]>([null, null]);
  const [range, setRange] = useState('');
  const [singleBit, setSingleBit] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const game = games.find((g) => g.id === mode);

  const load = async (i: 0 | 1, f: File | undefined) => {
    if (!f) return;
    const raw = new Uint8Array(await f.arrayBuffer());
    let side: Side = { name: f.name, raw, slots: [], sel: -1, err: null };
    if (game?.save) {
      const res = game.save.parse(raw);
      side = { ...side, slots: res.slots, sel: res.slots.length - 1, err: game.save.error(res) };
    }
    setSides((s) => (i === 0 ? [side, s[1]] : [s[0], side]));
    setCopyMsg('');
  };

  const bytesOf = (s: Side | null): Uint8Array | null => {
    if (!s) return null;
    if (!game) return s.raw;
    return s.sel >= 0 ? s.slots[s.sel].bytes : null;
  };

  const a = bytesOf(sides[0]);
  const b = bytesOf(sides[1]);
  const r = parseRange(range);
  const changes: ByteChange[] = useMemo(
    () => (a && b ? diffBytes(a, b, { start: r?.start, end: r?.end, singleBitOnly: singleBit }) : []),
    [a, b, r?.start, r?.end, singleBit],
  );
  const known = useMemo(() => (game ? knownBits(game.catalog) : new Map()), [game]);

  const label = (c: ByteChange): string => {
    const names = [...c.set, ...c.cleared].flatMap((bit) => known.get(c.offset)?.get(bit) ?? []);
    return names.length ? names.join(', ') : '';
  };
  const report = () =>
    diffReport(
      changes,
      `${sides[0]?.name ?? '?'} -> ${sides[1]?.name ?? '?'}${game ? ` (${game.short}, slot-relative offsets)` : ' (file offsets)'}`,
    );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report());
      setCopyMsg('Copied.');
    } catch {
      setCopyMsg('Copy was blocked. Select the report below and copy it by hand.');
    }
  };

  const modeOpts = [...games.map((g) => [g.id, g.short] as const), ['raw', 'Raw file'] as const];

  return (
    <Frame
      title="Save Diff"
      sub="Kingdom Hearts · 100% Completion Tracker"
      help="Compare a save from before and after an event to find its flag."
    >
      <div className={shell.body}>
        <main className={shell.panel} id="main" tabIndex={-1}>
          <h1 className={shell.ptitle}>Save Diff</h1>
          <p className={common.note}>
            Save once just before something happens in the game (opening a chest, beating a boss, finishing a
            Journal entry), copy the save file, then do it and save again. Load both files here to see every
            byte that changed. Files stay in your browser.
          </p>
          <div className={styles.controls}>
            <Segmented
              label="Read as"
              options={modeOpts}
              value={mode}
              onChange={(v) => {
                setMode(v);
                setSides([null, null]);
              }}
            />
          </div>
          <div className={styles.sides}>
            {([0, 1] as const).map((i) => {
              const s = sides[i];
              return (
                <section key={i} className={common.card} aria-label={i === 0 ? 'Before' : 'After'}>
                  <h2 className={common.cardT}>{i === 0 ? 'Before' : 'After'}</h2>
                  <label className={styles.file}>
                    Choose {i === 0 ? '"before"' : '"after"'} save
                    <input type="file" onChange={(e) => void load(i, e.target.files?.[0])} />
                  </label>
                  {s && <p className={common.note}>{s.name}</p>}
                  {s?.err && <p className={`${common.note} ${common.err}`}>{s.err}</p>}
                  {s && s.slots.length > 1 && (
                    <label className={styles.slotPick}>
                      Slot{' '}
                      <select
                        value={s.sel}
                        onChange={(e) => {
                          const sel = Number(e.target.value);
                          setSides((all) => (i === 0 ? [{ ...s, sel }, all[1]] : [all[0], { ...s, sel }]));
                        }}
                      >
                        {s.slots.map((sl, k) => (
                          <option key={sl.offset} value={k}>
                            {sl.label} · LV {sl.lv} · {sl.world}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {s && s.slots.length === 1 && (
                    <p className={common.note}>
                      {s.slots[0].label} · LV {s.slots[0].lv} · {s.slots[0].world}
                    </p>
                  )}
                </section>
              );
            })}
          </div>

          <div className={common.tools}>
            <label className={common.searchLabel}>
              <span className="sr-only">Offset range</span>
              <input
                className={common.search}
                placeholder="Offset range, e.g. 0x1D00-0x1F00"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={singleBit ? `${common.pill} ${common.on}` : common.pill}
              aria-pressed={singleBit}
              onClick={() => setSingleBit(!singleBit)}
            >
              Single-bit changes only
            </button>
            <button
              type="button"
              className={`${common.pill} ${common.blue}`}
              onClick={copy}
              disabled={!a || !b}
            >
              Copy report
            </button>
            {copyMsg && <span className={copyMsg === 'Copied.' ? common.ok : common.err}>{copyMsg}</span>}
          </div>

          {a && b ? (
            <>
              <p className={common.showing}>
                <b>{changes.length}</b> changed byte{changes.length === 1 ? '' : 's'}
                {game ? ' in the slot (offsets are from the slot start)' : ' in the file'}
                {changes.length > MAX_ROWS
                  ? `; showing the first ${MAX_ROWS}. Narrow the range to see more.`
                  : '.'}
              </p>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th scope="col">Offset</th>
                      <th scope="col">Before</th>
                      <th scope="col">After</th>
                      <th scope="col">Bits</th>
                      {game && <th scope="col">Already mapped</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {changes.slice(0, MAX_ROWS).map((c) => (
                      <tr key={c.offset}>
                        <th scope="row">
                          {hex(c.offset, 4)} <span className={styles.dec}>({c.offset})</span>
                        </th>
                        <td>
                          {hex(c.before)} <span className={styles.bin}>{bin(c.before)}</span>
                        </td>
                        <td>
                          {hex(c.after)} <span className={styles.bin}>{bin(c.after)}</span>
                        </td>
                        <td>
                          {c.set.map((x) => (
                            <span key={`s${x}`} className={styles.setBit}>
                              +{x}
                            </span>
                          ))}
                          {c.cleared.map((x) => (
                            <span key={`c${x}`} className={styles.clrBit}>
                              −{x}
                            </span>
                          ))}
                        </td>
                        {game && <td className={styles.known}>{label(c)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label>
                <span className="sr-only">Report</span>
                <textarea
                  className={common.ta}
                  readOnly
                  value={report()}
                  onFocus={(e) => e.target.select()}
                />
              </label>
            </>
          ) : (
            <p className={common.note}>Load both saves to compare them.</p>
          )}
        </main>
      </div>
    </Frame>
  );
}
