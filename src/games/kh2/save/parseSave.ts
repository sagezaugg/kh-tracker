import type { ParseResult, SaveSlot } from '../../../core/types';
import { DIFFICULTIES, isDifficulty, SAVE_WORLD_NAMES } from '../data/constants';
import {
  MAGIC,
  PC_FILE_SIZE,
  PC_FIRST_SLOT,
  PC_SLOT_STRIDE,
  PS2_CARD_SIZE,
  PS2_PAGE_COUNT,
  PS2_PAGE_DATA,
  PS2_PAGE_RAW,
  REGION_BYTES,
  SLOT_FIELDS,
  SLOT_SIZE,
  VERSION_FINAL_MIX,
  VERSION_OFFSET,
  VERSIONS_VANILLA,
} from './offsets';

export type SaveFormat = 'pc' | 'ps2-card' | 'raw';
export type { ParseResult, SaveSlot };

/** Removes the 16 ECC bytes from each 528-byte page of a PCSX2 memory card. */
export function stripEcc(card: Uint8Array): Uint8Array {
  const out = new Uint8Array(PS2_PAGE_COUNT * PS2_PAGE_DATA);
  for (let p = 0; p < PS2_PAGE_COUNT; p++) {
    out.set(card.subarray(p * PS2_PAGE_RAW, p * PS2_PAGE_RAW + PS2_PAGE_DATA), p * PS2_PAGE_DATA);
  }
  return out;
}

const u32 = (b: Uint8Array, o: number): number =>
  (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/**
 * Finds every Final Mix save slot in a file. Pure: no DOM, no React. Port of the prototype's
 * `parseSave`: scan for `KH2J`/`KH2U`/`KH2E` + version 0x3A, sanity-check Sora's LV (1–99).
 * PS2 cards only work when the save is stored contiguously on the card.
 */
export function parseSave(input: ArrayBuffer | Uint8Array): ParseResult {
  let format: SaveFormat = 'raw';
  let u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (u8.length === PS2_CARD_SIZE) {
    u8 = stripEcc(u8);
    format = 'ps2-card';
  } else if (u8.length === PC_FILE_SIZE) {
    format = 'pc';
  }

  const slots: SaveSlot[] = [];
  let unsupported = 0;
  const lim = u8.length - SLOT_SIZE;
  for (let i = 0; i <= lim; i++) {
    if (u8[i] !== MAGIC[0] || u8[i + 1] !== MAGIC[1] || u8[i + 2] !== MAGIC[2]) continue;
    if (!(REGION_BYTES as readonly number[]).includes(u8[i + 3])) continue;
    const ver = u32(u8, i + VERSION_OFFSET);
    if ((VERSIONS_VANILLA as readonly number[]).includes(ver)) {
      unsupported++;
      continue;
    }
    if (ver !== VERSION_FINAL_MIX) continue;
    const bytes = u8.slice(i, i + SLOT_SIZE);
    const lv = bytes[SLOT_FIELDS.soraLevel];
    if (lv < 1 || lv > 99) continue;
    const label =
      format === 'pc'
        ? `Slot ${Math.round((i - PC_FIRST_SLOT) / PC_SLOT_STRIDE)}`
        : `Save ${slots.length + 1}`;
    const worldId = bytes[SLOT_FIELDS.worldId];
    const d = bytes[SLOT_FIELDS.difficulty];
    const difficulty = isDifficulty(d) ? d : null;
    slots.push({
      label,
      offset: i,
      bytes,
      lv,
      munny: u32(bytes, SLOT_FIELDS.munny),
      worldId,
      world: SAVE_WORLD_NAMES[worldId] ?? 'Unknown',
      difficulty,
      diffName: difficulty === null ? 'Unknown' : DIFFICULTIES[difficulty],
    });
    i += SLOT_SIZE - 1;
  }
  return { format, slots, unsupported };
}

/** The import screen's error copy for a parse result with no usable slots, or null. */
export function parseError(res: ParseResult): string | null {
  if (res.slots.length) return null;
  return res.unsupported
    ? 'This looks like an original (non-Final Mix) KH2 save. Only Final Mix saves are supported.'
    : 'No Kingdom Hearts II Final Mix save data was found in this file.';
}
