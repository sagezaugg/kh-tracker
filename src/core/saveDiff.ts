/** Byte/bit differences between two saves, for mapping unknown save offsets. Pure. */

export interface ByteChange {
  offset: number;
  before: number;
  after: number;
  /** Bits (0–7) that went 0 → 1. */
  set: number[];
  /** Bits (0–7) that went 1 → 0. */
  cleared: number[];
}

export interface DiffOptions {
  /** Only report changes at or after this offset. */
  start?: number;
  /** Only report changes before this offset. */
  end?: number;
  /** Only report bytes where a single bit changed (typical of event flags). */
  singleBitOnly?: boolean;
}

const bitsOf = (x: number) => [0, 1, 2, 3, 4, 5, 6, 7].filter((b) => (x >> b) & 1);

export function diffBytes(a: Uint8Array, b: Uint8Array, opts: DiffOptions = {}): ByteChange[] {
  const len = Math.max(a.length, b.length);
  const start = Math.max(0, opts.start ?? 0);
  const end = Math.min(len, opts.end ?? len);
  const out: ByteChange[] = [];
  for (let i = start; i < end; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x === y) continue;
    const set = bitsOf(~x & y & 0xff);
    const cleared = bitsOf(x & ~y & 0xff);
    if (opts.singleBitOnly && set.length + cleared.length !== 1) continue;
    out.push({ offset: i, before: x, after: y, set, cleared });
  }
  return out;
}

export const hex = (n: number, width = 2): string => `0x${n.toString(16).toUpperCase().padStart(width, '0')}`;
export const bin = (n: number): string => n.toString(2).padStart(8, '0');

/** Plain-text report, one change per line, for pasting into an issue or a chat. */
export function diffReport(changes: readonly ByteChange[], label: string): string {
  const lines = changes.map((c) => {
    const bits = [...c.set.map((b) => `+bit${b}`), ...c.cleared.map((b) => `-bit${b}`)].join(' ');
    return `${hex(c.offset, 4)}  ${hex(c.before)} -> ${hex(c.after)}  ${bin(c.before)} -> ${bin(c.after)}  ${bits}`;
  });
  return [`# ${label}: ${changes.length} changed byte${changes.length === 1 ? '' : 's'}`, ...lines].join(
    '\n',
  );
}

/** Parses "0x1D00-0x1E00" or "7424-7680" into a range; null when blank or invalid. */
export function parseRange(text: string): { start: number; end: number } | null {
  const m = text.trim().match(/^(0x[0-9a-f]+|\d+)\s*[-–]\s*(0x[0-9a-f]+|\d+)$/i);
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2]);
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? { start, end } : null;
}
