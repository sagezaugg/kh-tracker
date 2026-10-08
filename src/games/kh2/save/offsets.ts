/**
 * File-layout offsets for KH2FM saves. Item flags live with their data in src/data and
 * src/model/items.ts. Structure documented by Kingdom Save Editor (GPL-3.0; offsets only,
 * no code copied) and ArchipelagoMW worlds/kh2 (MIT).
 */

/** PC `KHIIFM.png` / `KHIIFM_WW.png`: 0x70-byte PNG header, 100 × 0x158 entry headers, then slots. */
export const PC_FILE_SIZE = 0x6bed08;
export const PC_FIRST_SLOT = 0x86d0;
export const PC_SLOT_STRIDE = 0x10fc0;

/** PCSX2 `.ps2` card: 16,384 pages of 512 data bytes + 16 ECC bytes. */
export const PS2_CARD_SIZE = 8_650_752;
export const PS2_PAGE_RAW = 528;
export const PS2_PAGE_DATA = 512;
export const PS2_PAGE_COUNT = PS2_CARD_SIZE / PS2_PAGE_RAW;

/** Bytes read per slot, counted from the magic. Covers every flag we probe. */
export const SLOT_SIZE = 0x3800;

/** "KH2" followed by a region byte: J, U or E. */
export const MAGIC = [0x4b, 0x48, 0x32] as const;
export const REGION_BYTES = [0x4a, 0x55, 0x45] as const;

/** u32 after the magic. */
export const VERSION_OFFSET = 4;
export const VERSION_FINAL_MIX = 0x3a;
export const VERSIONS_VANILLA = [0x2d, 0x2a] as const;

/** Slot fields shown on the slot picker. */
export const SLOT_FIELDS = {
  worldId: 0x0c,
  munny: 0x2440,
  difficulty: 0x2498,
  soraLevel: 0x24ff,
} as const;

/** u16 item id of Sora's equipped Keyblade, and each Drive Form's Keyblade slot. */
export const EQUIP_SORA = 0x24f0;
export const EQUIP_FORM_BASE = 0x32f4;
export const EQUIP_FORM_STRIDE = 0x38;
export const EQUIP_FORM_COUNT = 5;
