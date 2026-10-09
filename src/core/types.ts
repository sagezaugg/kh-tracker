/** Game-agnostic data model. Each game supplies its own items, trophies and save support. */

export type DefinitionTag = 'journal' | 'trophy' | 'everything';

/** How an item is read from a save slot. Offsets are relative to the slot start. */
export type SaveProbe =
  | { type: 'bit'; offset: number; bit: number }
  | { type: 'count'; offset: number; min: number }
  | { type: 'byte'; offset: number }
  | { type: 'equip'; itemId: number }
  /** A clamped level byte. With `unlock`, the level reads as 0 until that bit is set. */
  | { type: 'level'; offset: number; min: number; max: number; unlock?: { offset: number; bit: number } }
  /** Number of set bits in `length` bytes, capped at `max` (e.g. 99 puppy flags). */
  | { type: 'bitCount'; offset: number; length: number; max: number }
  /** A byte list (ended by 0xFF) contains `value` (e.g. owned summon ids). */
  | { type: 'listHas'; offset: number; length: number; value: number };

export type ItemKind = 'check' | 'level' | 'counter';

export interface Item {
  id: string;
  name: string;
  /** Game-defined grouping ("chest", "keyblade", "dalmatian"…). */
  category: string;
  world?: string;
  journalSection?: string;
  tags: DefinitionTag[];
  kind: ItemKind;
  /** Lowest stepper value for level/counter items. */
  min?: number;
  max?: number;
  /** Any matching probe marks a check as found. */
  probe?: SaveProbe | readonly SaveProbe[];
  /** Short tag shown on the row (world, visit, "Everything only"…). */
  tag?: string;
  /** Visit tag from the location data. */
  visitTag?: string;
  source?: string;
}

/**
 * Trophy rules. `section` is a Journal section being complete; `difficulty` reads the
 * playthrough difficulty. Platinum is derived from the others and has no rule.
 */
export type Rule =
  | { all: readonly string[] }
  | { item: string; atLeast: number }
  /** At least `atLeast` of these checks. */
  | { count: readonly string[]; atLeast: number }
  | { save: 'difficulty'; atLeast: number }
  | { section: string }
  | { and: readonly Rule[] }
  | { or: readonly Rule[] }
  | { manual: true };

export interface RuleProgress {
  done: number;
  total: number;
}

export type TrophyTier = 'P' | 'G' | 'S' | 'B';

export interface TrophyDef {
  id: string;
  name: string;
  tier: TrophyTier;
  req: string;
  /** Game-defined group; 'plat' marks the Platinum. */
  group: string;
  /** Undefined only for the Platinum, which unlocks from the rest. */
  rule?: Rule;
  /** Ending trophies ("finish the game on …"). */
  clear?: boolean;
  /** Custom progress text instead of "n / m". */
  progText?: (p: Progress, r: RuleProgress) => string;
}

export interface TrophyStatus {
  id: string;
  name: string;
  tier: TrophyTier;
  req: string;
  group: string;
  done: number;
  total: number;
  /** Earned from the checklist. */
  auto: boolean;
  /** Marked earned by hand. */
  over: boolean;
  earned: boolean;
  progText: string;
}

export interface TrophyEvaluation {
  /** Every trophy, Platinum first. */
  list: TrophyStatus[];
  /** Earned among the scored (non-Platinum) trophies. */
  earned: number;
  /** Number of scored trophies. */
  scored: number;
  platinum: boolean;
}

export interface ImportMeta {
  file: string;
  slot: string;
  lv: number;
  munny: number;
  /** Display name of the world the slot was saved in. */
  world: string;
  /** Raw save world id when known; used by What's Left. */
  worldId?: number;
  diff: string;
  at: string;
}

export interface CustomGoal {
  id: string;
  t: string;
}

export interface Progress {
  checks: Record<string, boolean>;
  values: Record<string, number>;
  /** Checks the user set by hand. Sync leaves these alone. */
  overrides: Record<string, 'manual'>;
  difficulty?: number;
  lastImport?: ImportMeta;
  custom: CustomGoal[];
}

/** Everything the generic engine needs to know about one game's checklist. */
export interface Catalog {
  items: readonly Item[];
  itemById: ReadonlyMap<string, Item>;
  /** Starting values for level/counter items. */
  defaults: Readonly<Record<string, number>>;
  /** Item ids each Journal section counts. */
  sectionItems: Readonly<Record<string, readonly string[]>>;
  trophies: readonly TrophyDef[];
  /** Menu entry (nav key) that shows an item, for NEW! tags. */
  navKeyOf: (itemId: string) => string;
  /**
   * Stored ids that were renamed: old id → current id. Saved progress and backups are moved over when they
   * load, so renaming an item (or `tro.<trophy id>`) never loses anyone's check. Chains (a → b → c) resolve.
   * tests/ids.test.ts fails if a stored id disappears without an entry here.
   */
  renamedIds?: Readonly<Record<string, string>>;
}

/** One save slot found in a file. */
export interface SaveSlot {
  /** "Slot n" for PC files, "Save n" otherwise. */
  label: string;
  /** Where the slot was found in the (normalized) file. */
  offset: number;
  bytes: Uint8Array;
  lv: number;
  munny: number;
  worldId: number;
  world: string;
  difficulty: number | null;
  diffName: string;
}

export interface ParseResult {
  format: string;
  slots: SaveSlot[];
  /** Saves seen that this game can't read (e.g. non-Final Mix), for the error message. */
  unsupported: number;
}

export interface Detected {
  /** Every save-probed check item, found or not. */
  checks: Record<string, boolean>;
  /** Every save-probed level item. */
  values: Record<string, number>;
}
