/**
 * Ultima Weapon (Final Mix). Sources: KHWiki and Gamer Guides, as given in the project brief.
 * Needs the Ultimate Recipe and Moogle LV 2 or higher. An Energy Crystal cuts the Orichalcum+
 * needed from 13 to 7.
 */

export interface MaterialDef {
  id: string;
  name: string;
  /** Gem colour on the ingredients table. */
  gem: 'orp' | 'or' | 'my' | 'de' | 'tw' | 'se' | 'en';
}

export const MATERIALS: readonly MaterialDef[] = [
  { id: 'orichalcum-plus', name: 'Orichalcum+', gem: 'orp' },
  { id: 'orichalcum', name: 'Orichalcum', gem: 'or' },
  { id: 'mythril-crystal', name: 'Mythril Crystal', gem: 'my' },
  { id: 'dense-crystal', name: 'Dense Crystal', gem: 'de' },
  { id: 'twilight-crystal', name: 'Twilight Crystal', gem: 'tw' },
  { id: 'serenity-crystal', name: 'Serenity Crystal', gem: 'se' },
  { id: 'energy-crystal', name: 'Energy Crystal', gem: 'en' },
];

export const MATERIAL_BY_ID: Readonly<Record<string, MaterialDef>> = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m]),
);

export interface Ingredient {
  material: string;
  need: number;
}

export const ULTIMA_RECIPE: readonly Ingredient[] = [
  { material: 'orichalcum-plus', need: 13 },
  { material: 'orichalcum', need: 1 },
  { material: 'mythril-crystal', need: 1 },
  { material: 'dense-crystal', need: 1 },
  { material: 'twilight-crystal', need: 1 },
  { material: 'serenity-crystal', need: 3 },
];

/** With an Energy Crystal the recipe takes 7 Orichalcum+ plus the crystal itself. */
export const ULTIMA_RECIPE_ENERGY: readonly Ingredient[] = [
  { material: 'orichalcum-plus', need: 7 },
  { material: 'energy-crystal', need: 1 },
  ...ULTIMA_RECIPE.slice(1),
];

export const ULTIMATE_RECIPE_ITEM = 'w.MansionBasementCorridorU';
export const MOOGLE_LEVEL_NEEDED = 2;
export const SYNTHESIS_NOTE_ITEMS = 69;
export const MOOGLE_MAX_LEVEL = 9;

/** The 7 Orichalcum+ in the game. Six are location items; the Moogle reward is a manual check. */
export const ORICHALCUM_PLUS_SOURCES: readonly { id: string; manualLabel?: string; place?: string }[] = [
  { id: 'w.StarryHillOrichalcumPlus' },
  { id: 'w.CentralComputerCoreOrich' },
  { id: 'w.SunsetTerraceOrichalcumP' },
  { id: 'w.TheBrinkofDespairOrichal' },
  { id: 'w.MusicalOrichalcumPlus' },
  { id: 'w.OrichalcumPlusGoddessofF' },
  { id: 'syn.moogle-orichalcum-plus', manualLabel: 'Synthesize one of every item', place: 'Moogle shop' },
];

/**
 * Progress keys for Synthesis inputs (stored in Progress.values / checks).
 * TODO(open question 5): material counts, Synthesis Notes progress and Moogle level aren't mapped
 * in the save yet, so these are manual. Don't guess offsets.
 */
export const SYN_KEYS = {
  have: (materialId: string) => `syn.have.${materialId}`,
  notes: 'syn.notes',
  moogle: 'syn.moogle',
  energy: 'syn.energy',
} as const;
