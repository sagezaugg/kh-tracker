import { ITEMS } from '../model/items';
import type { Item, SaveProbe } from '../model/types';
import { EQUIP_FORM_BASE, EQUIP_FORM_COUNT, EQUIP_FORM_STRIDE, EQUIP_SORA } from './offsets';

export interface Detected {
  /** Every save-probed check item, found or not. */
  checks: Record<string, boolean>;
  /** Every save-probed level item. */
  values: Record<string, number>;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Reads one slot's bytes into check and level values. Pure port of the prototype's `detect`. */
export function detect(bytes: Uint8Array, items: readonly Item[] = ITEMS): Detected {
  const B = (o: number) => bytes[o] ?? 0;
  const u16 = (o: number) => B(o) | (B(o + 1) << 8);
  const bit = (o: number, b: number) => ((B(o) >> b) & 1) === 1;

  const equipped = [u16(EQUIP_SORA)];
  for (let f = 0; f < EQUIP_FORM_COUNT; f++) equipped.push(u16(EQUIP_FORM_BASE + f * EQUIP_FORM_STRIDE));

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
        return readValue(p) > 0;
    }
  };
  const readValue = (p: SaveProbe): number => {
    switch (p.type) {
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
