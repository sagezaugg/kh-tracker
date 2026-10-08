/**
 * Game constants ported from the prototype (reference/prototype/Main.dc.html).
 * Save offsets are relative to the start of a save slot (the "KH2J" magic).
 * Sources: ArchipelagoMW worlds/kh2 (MIT) and Kingdom Save Editor's documented offsets.
 */

export const DIFFICULTIES = ['Beginner', 'Standard', 'Proud', 'Critical'] as const;
export type Difficulty = 0 | 1 | 2 | 3;
export type DifficultyName = (typeof DIFFICULTIES)[number];

export function isDifficulty(v: unknown): v is Difficulty {
  return v === 0 || v === 1 || v === 2 || v === 3;
}

/** In-game world ids (save byte 0x0C) to display names. */
export const SAVE_WORLD_NAMES: Readonly<Record<number, string>> = {
  0: 'Unknown',
  1: 'End of Sea',
  2: 'Twilight Town',
  3: 'Destiny Islands',
  4: 'Hollow Bastion',
  5: "Beast's Castle",
  6: 'Olympus Coliseum',
  7: 'Agrabah',
  8: 'The Land of Dragons',
  9: '100 Acre Wood',
  10: 'Pride Lands',
  11: 'Atlantica',
  12: 'Disney Castle',
  13: 'Timeless River',
  14: 'Halloween Town',
  15: 'World Map',
  16: 'Port Royal',
  17: 'Space Paranoids',
  18: 'The World That Never Was',
};

/** Save world id (byte 0x0C) to the tracker's world key, where one exists. */
export const SAVE_WORLD_TO_KEY: Readonly<Record<number, WorldKey>> = {
  2: 'TT',
  4: 'HB',
  5: 'BC',
  6: 'OC',
  7: 'AG',
  8: 'LoD',
  9: 'AW',
  10: 'PL',
  11: 'AT',
  12: 'DC',
  13: 'TR',
  14: 'HT',
  16: 'PR',
  17: 'SP',
  18: 'TW',
};

export const WORLD_KEYS = [
  'LoD',
  'AG',
  'DC',
  'TR',
  'AW',
  'OC',
  'BC',
  'SP',
  'HT',
  'PR',
  'HB',
  'PL',
  'TT',
  'TW',
  'AT',
] as const;
export type WorldKey = (typeof WORLD_KEYS)[number];

/** Short names used on buttons ("Check all in …"). */
export const WORLD_SHORT: Readonly<Record<WorldKey, string>> = {
  LoD: 'LoD',
  AG: 'Agrabah',
  DC: 'DC',
  TR: 'TR',
  AW: '100AW',
  OC: 'Olympus',
  BC: "Beast's",
  SP: 'SP',
  HT: 'HT',
  PR: 'Port Royal',
  HB: 'HB',
  PL: 'Pride Lands',
  TT: 'TT',
  TW: 'TWTNW',
  AT: 'Atlantica',
};

export interface BitFlag {
  offset: number;
  bit: number;
}

/** Secret Ansem Reports 1–13. */
export const REPORT_BITS: readonly BitFlag[] = [
  { offset: 0x36c4, bit: 6 },
  { offset: 0x36c4, bit: 7 },
  { offset: 0x36c5, bit: 0 },
  { offset: 0x36c5, bit: 1 },
  { offset: 0x36c5, bit: 2 },
  { offset: 0x36c5, bit: 3 },
  { offset: 0x36c5, bit: 4 },
  { offset: 0x36c5, bit: 5 },
  { offset: 0x36c5, bit: 6 },
  { offset: 0x36c5, bit: 7 },
  { offset: 0x36c6, bit: 0 },
  { offset: 0x36c6, bit: 1 },
  { offset: 0x36c6, bit: 2 },
];

export interface FormDef {
  key: 'valor' | 'wisdom' | 'limit' | 'master' | 'final';
  name: string;
  levelOffset: number;
  unlock: BitFlag;
}

export const FORMS: readonly FormDef[] = [
  { key: 'valor', name: 'Valor Form', levelOffset: 0x32f6, unlock: { offset: 0x36c0, bit: 1 } },
  { key: 'wisdom', name: 'Wisdom Form', levelOffset: 0x332e, unlock: { offset: 0x36c0, bit: 2 } },
  { key: 'limit', name: 'Limit Form', levelOffset: 0x3366, unlock: { offset: 0x36ca, bit: 3 } },
  { key: 'master', name: 'Master Form', levelOffset: 0x339e, unlock: { offset: 0x36c0, bit: 6 } },
  { key: 'final', name: 'Final Form', levelOffset: 0x33d6, unlock: { offset: 0x36c0, bit: 4 } },
];

export interface SummonDef {
  key: 'chicken' | 'genie' | 'stitch' | 'peter';
  name: string;
  charm: string;
  flag: BitFlag;
}

export const SUMMONS: readonly SummonDef[] = [
  { key: 'chicken', name: 'Chicken Little', charm: 'Baseball Charm', flag: { offset: 0x36c0, bit: 3 } },
  { key: 'genie', name: 'Genie', charm: 'Lamp Charm', flag: { offset: 0x36c4, bit: 4 } },
  { key: 'stitch', name: 'Stitch', charm: 'Ukulele Charm', flag: { offset: 0x36c0, bit: 0 } },
  { key: 'peter', name: 'Peter Pan', charm: 'Feather Charm', flag: { offset: 0x36c4, bit: 5 } },
];

export const SUMMON_LEVEL_OFFSET = 0x3526;

export interface MagicDef {
  key: 'fire' | 'blizzard' | 'thunder' | 'cure' | 'magnet' | 'reflect';
  offset: number;
  tiers: readonly [string, string, string];
}

export const MAGIC: readonly MagicDef[] = [
  { key: 'fire', offset: 0x3594, tiers: ['Fire', 'Fira', 'Firaga'] },
  { key: 'blizzard', offset: 0x3595, tiers: ['Blizzard', 'Blizzara', 'Blizzaga'] },
  { key: 'thunder', offset: 0x3596, tiers: ['Thunder', 'Thundara', 'Thundaga'] },
  { key: 'cure', offset: 0x3597, tiers: ['Cure', 'Cura', 'Curaga'] },
  { key: 'magnet', offset: 0x35cf, tiers: ['Magnet', 'Magnera', 'Magnega'] },
  { key: 'reflect', offset: 0x35d0, tiers: ['Reflect', 'Reflera', 'Reflega'] },
];

export interface ProofDef {
  key: 'conn' | 'non' | 'peace' | 'charm';
  name: string;
  offset: number;
}

export const PROOFS: readonly ProofDef[] = [
  { key: 'conn', name: 'Proof of Connection', offset: 0x36b2 },
  { key: 'non', name: 'Proof of Nonexistence', offset: 0x36b3 },
  { key: 'peace', name: 'Proof of Peace', offset: 0x36b4 },
  { key: 'charm', name: 'Promise Charm', offset: 0x3694 },
];

/** Torn Page delivery flags (100 Acre Wood), pages 1–5. */
export const TORN_PAGE_BITS: readonly BitFlag[] = [
  { offset: 0x1db7, bit: 4 },
  { offset: 0x1db7, bit: 7 },
  { offset: 0x1db8, bit: 2 },
  { offset: 0x1db8, bit: 4 },
  { offset: 0x1db8, bit: 7 },
];

export const PUZZLES = ['Awakening', 'Heart', 'Duality', 'Frontier', 'Daylight', 'Sunset'] as const;

/** Partial list of Journal mini-games (open question 4), with the world tag shown on the row. */
export const MINIGAMES: readonly (readonly [name: string, tag: string])[] = [
  ['Mail Delivery', 'TT'],
  ['Cargo Climb', 'TT'],
  ['Bumble-Buster', 'TT'],
  ['Poster Duty', 'TT'],
  ['Grandstander', 'TT'],
  ['Junk Sweep', 'TT'],
  ['A Blustery Rescue', '100AW'],
  ['Hunny Slider', '100AW'],
  ['Balloon Bounce', '100AW'],
  ['The Expotition', '100AW'],
  ['The Hunny Pot', '100AW'],
  ['Swim This Way', 'AT'],
  ['Part of Your World', 'AT'],
  ['Under the Sea', 'AT'],
  ["Ursula's Revenge", 'AT'],
  ['A New Day is Dawning', 'AT'],
];

/** Mushroom XIII locations, No. 1–12 (count is open question 4). */
export const MUSHROOMS: readonly (readonly [place: string, tag: string])[] = [
  ["Memory's Skyscraper", 'TWTNW'],
  ['Christmas Tree Plaza', 'HT'],
  ['Bridge', 'BC'],
  ['Palace Gates', 'LoD'],
  ['Treasure Room', 'AG'],
  ['Atrium', 'OC'],
  ['Tunnelway', 'TT'],
  ['Tower', 'TT'],
  ['Castle Gates', 'HB'],
  ['Moonlight Nook', 'PR'],
  ['Waterway', 'TR'],
  ['Old Mansion', 'TT'],
];

export const CUPS = [
  'Pain and Panic Cup',
  'Cerberus Cup',
  'Titan Cup',
  'Goddess of Fate Cup',
  'Pain and Panic Paradox Cup',
  'Cerberus Paradox Cup',
  'Titan Paradox Cup',
  'Hades Paradox Cup',
] as const;

export interface BossDef {
  key: string;
  name: string;
  /** Undefined when the save flag is unknown; those are manual. */
  flag?: BitFlag;
}

export const ABSENT_SILHOUETTES: readonly BossDef[] = [
  { key: 'vexen', name: 'Vexen', flag: { offset: 0x370c, bit: 0 } },
  { key: 'lexaeus', name: 'Lexaeus', flag: { offset: 0x370c, bit: 1 } },
  { key: 'zexion', name: 'Zexion', flag: { offset: 0x370c, bit: 2 } },
  { key: 'marluxia', name: 'Marluxia', flag: { offset: 0x370c, bit: 3 } },
  { key: 'larxene', name: 'Larxene', flag: { offset: 0x370c, bit: 4 } },
];

export const DATA_ORG: readonly BossDef[] = [
  { key: 'xemnas', name: 'Xemnas', flag: { offset: 0x1eda, bit: 2 } },
  { key: 'xigbar', name: 'Xigbar', flag: { offset: 0x1ed9, bit: 7 } },
  { key: 'xaldin', name: 'Xaldin', flag: { offset: 0x1d34, bit: 7 } },
  { key: 'vexen', name: 'Vexen' },
  { key: 'lexaeus', name: 'Lexaeus' },
  { key: 'zexion', name: 'Zexion' },
  { key: 'saix', name: 'Saïx', flag: { offset: 0x1eda, bit: 0 } },
  { key: 'axel', name: 'Axel', flag: { offset: 0x1ceb, bit: 4 } },
  { key: 'demyx', name: 'Demyx', flag: { offset: 0x1d26, bit: 5 } },
  { key: 'luxord', name: 'Luxord', flag: { offset: 0x1eda, bit: 1 } },
  { key: 'marluxia', name: 'Marluxia' },
  { key: 'larxene', name: 'Larxene' },
  { key: 'roxas', name: 'Roxas', flag: { offset: 0x1ed9, bit: 6 } },
];

export const SUPERBOSSES: readonly BossDef[] = [
  { key: 'lw', name: 'Lingering Will', flag: { offset: 0x370c, bit: 6 } },
  { key: 'seph', name: 'Sephiroth', flag: { offset: 0x3708, bit: 3 } },
];

export const FEATS: readonly (readonly [key: string, name: string])[] = [
  ['myhero', 'Rescued by King Mickey in a boss fight'],
  ['skate', 'Skateboarding: score 5,000 points'],
  ['struggle', 'Struggle: win by taking every orb'],
];

export const GUMMI: readonly (readonly [key: string, name: string, tag: string])[] = [
  ['veteran', 'S rank on any Gummi mission', 'Trophy'],
  ['ace', 'S rank on every route of one mission', 'Trophy'],
  ['topgun', 'S rank on every route of one special mission', 'Trophy'],
  ['collector', 'Collect every Gummi Ship model', 'Trophy'],
  ['alls', 'S rank on every route of every mission', 'Everything only'],
];

export const ANTI_FORM_MAX = 13;
