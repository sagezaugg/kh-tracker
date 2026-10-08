import type { Detected, Item, SaveProbe } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Reads every save-probed item from one slot's bytes. Pure. `equipped` lists in-game item ids
 * currently equipped, for `equip` probes.
 */
export function detectProbes(
  bytes: Uint8Array,
  items: readonly Item[],
  equipped: readonly number[] = [],
): Detected {
  const B = (o: number) => bytes[o] ?? 0;
  const bit = (o: number, b: number) => ((B(o) >> b) & 1) === 1;

  const bitsIn = (o: number, len: number) => {
    let n = 0;
    for (let i = 0; i < len; i++) for (let x = B(o + i); x; x &= x - 1) n++;
    return n;
  };
  const listHas = (o: number, len: number, v: number) => {
    for (let i = 0; i < len && B(o + i) !== 0xff; i++) if (B(o + i) === v) return true;
    return false;
  };

  const readValue = (p: SaveProbe): number => {
    switch (p.type) {
      case 'bitCount':
        return Math.min(p.max, bitsIn(p.offset, p.length));
      case 'listHas':
        return listHas(p.offset, p.length, p.value) ? 1 : 0;
      case 'level':
        if (p.unlock && !bit(p.unlock.offset, p.unlock.bit)) return 0;
        return clamp(B(p.offset), p.min, p.max);
      case 'byte':
      case 'count':
        return B(p.offset);
      case 'bit':
      case 'equip':
        return readCheck(p) ? 1 : 0;
    }
  };
  const readCheck = (p: SaveProbe): boolean => {
    switch (p.type) {
      case 'bit':
        return bit(p.offset, p.bit);
      case 'count':
        return B(p.offset) >= p.min;
      case 'byte':
        return B(p.offset) > 0;
      case 'equip':
        return equipped.includes(p.itemId);
      case 'level':
      case 'bitCount':
        return readValue(p) > 0;
      case 'listHas':
        return listHas(p.offset, p.length, p.value);
    }
  };

  const checks: Record<string, boolean> = {};
  const values: Record<string, number> = {};
  for (const item of items) {
    if (!item.probe) continue;
    const probes: readonly SaveProbe[] = Array.isArray(item.probe) ? item.probe : [item.probe as SaveProbe];
    if (item.kind === 'check') checks[item.id] = probes.some(readCheck);
    else values[item.id] = Math.max(...probes.map(readValue));
  }
  return { checks, values };
}
