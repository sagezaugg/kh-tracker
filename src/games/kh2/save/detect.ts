import { detectProbes } from '../../../core/detect';
import type { Detected, Item } from '../../../core/types';
import { ITEMS } from '../model/items';
import { EQUIP_FORM_BASE, EQUIP_FORM_COUNT, EQUIP_FORM_STRIDE, EQUIP_SORA } from './offsets';

export type { Detected };

/** Reads one KH2FM slot's bytes into check and level values. A Keyblade counts if owned or equipped. */
export function detect(bytes: Uint8Array, items: readonly Item[] = ITEMS): Detected {
  const u16 = (o: number) => (bytes[o] ?? 0) | ((bytes[o + 1] ?? 0) << 8);
  const equipped = [u16(EQUIP_SORA)];
  for (let f = 0; f < EQUIP_FORM_COUNT; f++) equipped.push(u16(EQUIP_FORM_BASE + f * EQUIP_FORM_STRIDE));
  return detectProbes(bytes, items, equipped);
}
