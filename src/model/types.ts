import type { Difficulty, WorldKey } from '../data/constants';
import type { JournalSection } from '../data/journal';

export type DefinitionTag = 'journal' | 'trophy' | 'everything';

/** How an item is read from a save slot. Offsets are relative to the slot start. */
export type SaveProbe =
  | { type: 'bit'; offset: number; bit: number }
  | { type: 'count'; offset: number; min: number }
  | { type: 'byte'; offset: number }
  | { type: 'equip'; itemId: number }
  /** A clamped level byte. With `unlock`, the level reads as 0 until that bit is set. */
  | { type: 'level'; offset: number; min: number; max: number; unlock?: { offset: number; bit: number } };

export type ItemKind = 'check' | 'level' | 'counter';

export type ItemCategory =
  | 'chest'
  | 'reward'
  | 'boss'
  | 'report'
  | 'puzzle'
  | 'minigame'
  | 'journal-single'
  | 'mushroom'
  | 'keyblade'
  | 'absent-silhouette'
  | 'data-org'
  | 'superboss'
  | 'cup'
  | 'charm'
  | 'proof'
  | 'torn-page'
  | 'feat'
  | 'gummi'
  | 'extra'
  | 'sora'
  | 'form'
  | 'summon'
  | 'magic'
  | 'anti';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  world?: WorldKey;
  journalSection?: JournalSection;
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
 * playthrough difficulty. Platinum is derived from the other 50 and has no rule here.
 */
export type Rule =
  | { all: readonly string[] }
  | { item: string; atLeast: number }
  | { save: 'difficulty'; atLeast: Difficulty }
  | { section: JournalSection }
  | { and: readonly Rule[] }
  | { or: readonly Rule[] }
  | { manual: true };

export interface ImportMeta {
  file: string;
  slot: string;
  lv: number;
  munny: number;
  /** Display name of the world the slot was saved in. */
  world: string;
  /** Raw save world id (byte 0x0C) when known; used by What's Left. */
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
  difficulty?: Difficulty;
  lastImport?: ImportMeta;
  custom: CustomGoal[];
}
