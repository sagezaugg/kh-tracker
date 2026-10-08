/**
 * KH1FM synthesis (KHWiki "Synthesis", Final Mix tab): 33 items in six lists, unlocked by making
 * unique items from earlier lists. Ultima Weapon's Final Mix recipe is from KHWiki "Ultima Weapon".
 * Material item ids are from Kingdom Save Editor's item enum; counts are read from the inventory.
 */

export const SYNTHESIS_LISTS: readonly { list: string; unlock: string; items: readonly string[] }[] = [
  {
    list: 'List I',
    unlock: 'Available when the workshop opens.',
    items: ['Mega-Potion', 'Cottage', 'Energy Bangle', 'Power Chain', 'Magic Armlet', 'EXP Earring'],
  },
  {
    list: 'List II',
    unlock: 'Make 3 unique items from List I.',
    items: ['Mega-Ether', 'Guard Earring', 'Angel Bangle', 'Golem Chain', 'Rune Armlet', 'Moogle Badge'],
  },
  {
    list: 'List III',
    unlock: 'Make 9 unique items from Lists I and II.',
    items: ['AP Up', 'Dark Ring', 'Master Earring', 'Gaia Bangle', 'Titan Chain', 'Mythril'],
  },
  {
    list: 'List IV',
    unlock: 'Make 15 unique items from Lists I–III.',
    items: ['Elixir', 'Defense Up', 'Heartguard', 'Three Stars', 'Atlas Armlet', 'Crystal Crown'],
  },
  {
    list: 'List V',
    unlock: 'Make 21 unique items from Lists I–IV.',
    items: ['Megalixir', 'Power Up', 'Cosmic Arts', 'EXP Bracelet', 'Ribbon', 'Dark Matter'],
  },
  {
    list: 'List VI',
    unlock: 'Make all 30 items from Lists I–V.',
    items: ['Fantasista', 'Seven Elements', 'Ultima Weapon'],
  },
];

export const SYNTHESIS_ITEM_COUNT = SYNTHESIS_LISTS.reduce((a, l) => a + l.items.length, 0);

/** Ultima Weapon, Final Mix recipe (List VI). */
export const KH1_ULTIMA_RECIPE: readonly { name: string; itemId: number; need: number }[] = [
  { name: 'Thunder Gem', itemId: 0xf6, need: 5 },
  { name: 'Mystery Goo', itemId: 0xfb, need: 5 },
  { name: 'Serenity Power', itemId: 0x9b, need: 3 },
  { name: 'Stormy Stone', itemId: 0x10, need: 3 },
  { name: 'Dark Matter', itemId: 0x9c, need: 3 },
];

export const synthesisId = (name: string): string =>
  `syn.${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

export const materialId = (itemId: number): string => `mat.${itemId.toString(16)}`;
