import { detectProbes } from '../../../core/detect';
import type { Detected, Item, ParseResult, SaveSlot } from '../../../core/types';
import { DIFFICULTIES, SAVE_WORLD_NAMES, SORA_LEVEL_OFFSET, SORA_WEAPON_OFFSET } from '../data/constants';
import { KH1_ITEMS } from '../model/items';

/**
 * KH1FM PC save (`KHFM.png` / `KHFM_WW.png`, 0x11EB09D bytes), verified against a real Steam save
 * and Kingdom Save Editor's PcKh1Factory: a 0x70-byte PNG header, 200 × 0x158-byte entry headers
 * (only the first 0xF0 bytes XOR-scrambled; not needed), then entries at stride 0x16C40 from
 * 0x10D30. Entries alternate: game data (u32 magic 0x05 = Final Mix, 0x04 = original) and a
 * 0x400-byte "KHSQ" load-screen preview. Save n is entry 2(n-1).
 */
export const KH1_PC_FILE_SIZE = 0x11eb09d;
export const KH1_FIRST_ENTRY = 0x10d30;
export const KH1_ENTRY_STRIDE = 0x16c40;
export const KH1_ENTRY_COUNT = 200;
export const KH1_SLOT_SIZE = 0x16c00;
export const KH1_MAGIC_FM = 0x05;
export const KH1_MAGIC_ORIGINAL = 0x04;

export const KH1_SLOT_FIELDS = {
  soraLevel: SORA_LEVEL_OFFSET,
  worldId: 0x2040,
  munny: 0x1641c,
  difficulty: 0x1642c,
} as const;

const u32 = (b: Uint8Array, o: number): number =>
  ((b[o] ?? 0) | ((b[o + 1] ?? 0) << 8) | ((b[o + 2] ?? 0) << 16) | ((b[o + 3] ?? 0) << 24)) >>> 0;

function readSlot(bytes: Uint8Array, label: string, offset: number): SaveSlot | null {
  const lv = bytes[KH1_SLOT_FIELDS.soraLevel];
  if (lv < 1 || lv > 100) return null;
  const worldId = u32(bytes, KH1_SLOT_FIELDS.worldId);
  const d = bytes[KH1_SLOT_FIELDS.difficulty];
  const difficulty = d < DIFFICULTIES.length ? d : null;
  return {
    label,
    offset,
    bytes,
    lv,
    munny: u32(bytes, KH1_SLOT_FIELDS.munny),
    worldId,
    world: SAVE_WORLD_NAMES[worldId] ?? 'Unknown',
    difficulty,
    diffName: difficulty === null ? 'Unknown' : DIFFICULTIES[difficulty],
  };
}

/** Finds every KH1FM save in a PC save file, or a single raw slot. Pure. */
export function parseKh1Save(input: ArrayBuffer | Uint8Array): ParseResult {
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  const slots: SaveSlot[] = [];
  let unsupported = 0;

  if (u8.length === KH1_PC_FILE_SIZE) {
    for (let i = 0; i < KH1_ENTRY_COUNT; i++) {
      const o = KH1_FIRST_ENTRY + i * KH1_ENTRY_STRIDE;
      if (o + KH1_SLOT_SIZE > u8.length) break;
      const magic = u32(u8, o);
      if (magic === KH1_MAGIC_ORIGINAL) unsupported++;
      if (magic !== KH1_MAGIC_FM) continue;
      const slot = readSlot(u8.slice(o, o + KH1_SLOT_SIZE), `Slot ${Math.floor(i / 2) + 1}`, o);
      if (slot) slots.push(slot);
    }
    return { format: 'pc', slots, unsupported };
  }

  // A single exported slot (e.g. from a save editor).
  if (u8.length >= KH1_SLOT_SIZE && u32(u8, 0) === KH1_MAGIC_FM) {
    const slot = readSlot(u8.slice(0, KH1_SLOT_SIZE), 'Save 1', 0);
    if (slot) slots.push(slot);
  } else if (u8.length >= KH1_SLOT_SIZE && u32(u8, 0) === KH1_MAGIC_ORIGINAL) {
    unsupported++;
  }
  return { format: 'raw', slots, unsupported };
}

export function kh1ParseError(res: ParseResult): string | null {
  if (res.slots.length) return null;
  return res.unsupported
    ? 'This looks like a save from the original (non-Final Mix) Kingdom Hearts. Only Final Mix saves are supported.'
    : 'No Kingdom Hearts Final Mix save data was found in this file. Use KHFM.png from the 1.5+2.5 save folder.';
}

/** Reads one KH1FM slot. A Keyblade counts if it's in the inventory or equipped by Sora. */
export function detectKh1(bytes: Uint8Array, items: readonly Item[] = KH1_ITEMS): Detected {
  return detectProbes(bytes, items, [bytes[SORA_WEAPON_OFFSET] ?? 0]);
}
