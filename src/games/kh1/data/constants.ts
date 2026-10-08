/**
 * KH1FM game constants. Sources:
 *  - Kingdom Save Editor (GPL-3.0; documented values only, no code): item ids (Types/EquipmentType.cs,
 *    a sequential enum), world ids (Types/WorldType.cs), Final Mix difficulty (Types/DifficultyType.cs),
 *    magic order (Types/CommandType.cs, Models/Character.cs).
 *  - gaithern/KH-1FM-AP-LUA (MIT) 1fmAPConnector.lua: summon ids, puppy/report addresses.
 *  - KHWiki: synthesis lists, Trinity mark count, Journal sections.
 * Offsets are relative to the start of a save slot.
 */

/** DifficultyFm in Kingdom Save Editor: byte at 0x1642C. */
export const DIFFICULTIES = ['Beginner', 'Standard', 'Proud'] as const;

/** Save world id (u32 at 0x2040) to display name (KSE WorldType). */
export const SAVE_WORLD_NAMES: Readonly<Record<number, string>> = {
  0: 'Dive into the Heart',
  1: 'Destiny Islands',
  2: 'Disney Castle',
  3: 'Traverse Town',
  4: 'Wonderland',
  5: 'Deep Jungle',
  6: '100 Acre Wood',
  8: 'Agrabah',
  9: 'Atlantica',
  10: 'Halloween Town',
  11: 'Olympus Coliseum',
  12: 'Monstro',
  13: 'Neverland',
  15: 'Hollow Bastion',
  16: 'End of the World',
};

export const WORLD_KEYS = ['di', 'tt', 'wl', 'oc', 'dj', 'ag', 'mo', 'at', 'ht', 'nl', 'hb', 'aw', 'ew'] as const;
export type Kh1WorldKey = (typeof WORLD_KEYS)[number];

export const SAVE_WORLD_TO_KEY: Readonly<Record<number, Kh1WorldKey>> = {
  1: 'di',
  3: 'tt',
  4: 'wl',
  5: 'dj',
  6: 'aw',
  8: 'ag',
  9: 'at',
  10: 'ht',
  11: 'oc',
  12: 'mo',
  13: 'nl',
  15: 'hb',
  16: 'ew',
};

export const WORLD_SHORT: Readonly<Record<Kh1WorldKey, string>> = {
  di: 'Destiny Islands',
  tt: 'TT',
  wl: 'Wonderland',
  oc: 'Olympus',
  dj: 'Deep Jungle',
  ag: 'Agrabah',
  mo: 'Monstro',
  at: 'Atlantica',
  ht: 'HT',
  nl: 'Neverland',
  hb: 'HB',
  aw: '100AW',
  ew: 'EotW',
};

/** Magic in save order. Unlock bits at 0x74 (bit i), levels at 0x492 + i (0–3). */
export const MAGIC: readonly { key: string; tiers: readonly [string, string, string] }[] = [
  { key: 'fire', tiers: ['Fire', 'Fira', 'Firaga'] },
  { key: 'blizzard', tiers: ['Blizzard', 'Blizzara', 'Blizzaga'] },
  { key: 'thunder', tiers: ['Thunder', 'Thundara', 'Thundaga'] },
  { key: 'cure', tiers: ['Cure', 'Cura', 'Curaga'] },
  { key: 'gravity', tiers: ['Gravity', 'Gravira', 'Graviga'] },
  { key: 'stop', tiers: ['Stop', 'Stopra', 'Stopga'] },
  { key: 'aero', tiers: ['Aero', 'Aerora', 'Aeroga'] },
];
export const MAGIC_UNLOCK_OFFSET = 0x74;
export const MAGIC_LEVEL_OFFSET = 0x492;

/** Summon ids as listed (0xFF-terminated) at 0x7D0, per the AP connector's summon order. */
export const SUMMONS: readonly { key: string; name: string; id: number }[] = [
  { key: 'simba', name: 'Simba', id: 5 },
  { key: 'genie', name: 'Genie', id: 2 },
  { key: 'dumbo', name: 'Dumbo', id: 0 },
  { key: 'bambi', name: 'Bambi', id: 1 },
  { key: 'tinker', name: 'Tinker Bell', id: 3 },
  { key: 'mushu', name: 'Mushu', id: 4 },
];
export const SUMMON_LIST_OFFSET = 0x7d0;

/** Inventory counts: one byte per item id at 0x499 + id. */
export const INVENTORY_OFFSET = 0x499;
/** Item id of Sora's equipped weapon. */
export const SORA_WEAPON_OFFSET = 0x36;
export const SORA_LEVEL_OFFSET = 0x4;

/**
 * Sora's Keyblades (ids 0x51–0x66). The Dream Sword/Shield/Rod (Dive into the Heart only) and
 * the Wooden Sword (Destiny Islands only) are left out of the list; which Keyblades "Blade
 * Master" counts is an inference to verify.
 */
export const KEYBLADES: readonly (readonly [number, string])[] = [
  [0x51, 'Kingdom Key'],
  [0x56, 'Jungle King'],
  [0x57, 'Three Wishes'],
  [0x58, 'Fairy Harp'],
  [0x59, 'Pumpkinhead'],
  [0x5a, 'Crabclaw'],
  [0x5b, 'Divine Rose'],
  [0x5c, 'Spellbinder'],
  [0x5d, 'Olympia'],
  [0x5e, 'Lionheart'],
  [0x5f, 'Metal Chocobo'],
  [0x60, 'Oathkeeper'],
  [0x61, 'Oblivion'],
  [0x62, 'Lady Luck'],
  [0x63, 'Wishing Star'],
  [0x64, 'Ultima Weapon'],
  [0x65, 'Diamond Dust'],
  [0x66, 'One-Winged Angel'],
];

/** Donald's staves (KSE ids 0x67–0x75; the unnamed 0x76 placeholder is left out). */
export const STAVES: readonly (readonly [number, string])[] = [
  [0x67, "Mage's Staff"],
  [0x68, 'Morning Star'],
  [0x69, 'Shooting Star'],
  [0x6a, 'Magus Staff'],
  [0x6b, 'Wisdom Staff'],
  [0x6c, 'Warhammer'],
  [0x6d, 'Silver Mallet'],
  [0x6e, 'Grand Mallet'],
  [0x6f, 'Lord Fortune'],
  [0x70, 'Violetta'],
  [0x71, 'Dream Rod'],
  [0x72, 'Save the Queen'],
  [0x73, "Wizard's Relic"],
  [0x74, 'Meteor Strike'],
  [0x75, 'Fantasista'],
];

/** Goofy's shields (KSE ids 0x77–0x85; the unnamed 0x86 placeholder is left out). */
export const SHIELDS: readonly (readonly [number, string])[] = [
  [0x77, "Knight's Shield"],
  [0x78, 'Mythril Shield'],
  [0x79, 'Onyx Shield'],
  [0x7a, 'Stout Shield'],
  [0x7b, 'Golem Shield'],
  [0x7c, 'Adamant Shield'],
  [0x7d, 'Smasher'],
  [0x7e, 'Gigas Fist'],
  [0x7f, 'Genji Shield'],
  [0x80, "Herc's Shield"],
  [0x81, 'Dream Shield'],
  [0x82, 'Save the King'],
  [0x83, 'Defender'],
  [0x84, 'Mighty Shield'],
  [0x85, 'Seven Elements'],
];

/** 99 puppy flags at 0x1703 (AP connector puppy_array_address). */
export const PUPPY_OFFSET = 0x1703;
export const PUPPY_BYTES = 13;
export const PUPPY_COUNT = 99;

/** KHWiki's Trinity tables list 46 marks (Blue 17, Red 6, Green 9, Yellow 4, White 10). */
export const TRINITY_COUNT = 46;

/** Superbosses and the event location (by name) whose save flag marks each one beaten. */
export const SUPERBOSSES: readonly { key: string; name: string; where: string; location: string }[] = [
  { key: 'kurt', name: 'Kurt Zisa', where: 'Agrabah', location: 'Agrabah Defeat Kurt Zisa Zantetsuken Event' },
  { key: 'phantom', name: 'Phantom', where: 'Neverland', location: 'Neverland Defeat Phantom Stop Event' },
  {
    key: 'icetitan',
    name: 'Ice Titan',
    where: 'Olympus Coliseum (Gold Match)',
    location: 'Olympus Coliseum Defeat Ice Titan Diamond Dust Event',
  },
  {
    key: 'seph',
    name: 'Sephiroth',
    where: 'Olympus Coliseum (Platinum Match)',
    location: 'Olympus Coliseum Defeat Sephiroth One-Winged Angel Event',
  },
  { key: 'unknown', name: 'Unknown', where: 'Hollow Bastion', location: 'Hollow Bastion Defeat Unknown EXP Necklace Event' },
];

export const CUPS = ['Phil Cup', 'Pegasus Cup', 'Hercules Cup', 'Hades Cup'] as const;
