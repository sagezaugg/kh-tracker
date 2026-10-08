import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { BackupFormat } from '../core/backup';
import type { TrackerStore } from '../core/store';
import type { Catalog, Detected, ParseResult, Progress } from '../core/types';

export type GameId = 'kh1' | 'kh2';

/** One command-menu entry. `path` is relative to the game's base path ('' = the game's Status). */
export interface NavEntry {
  key: string;
  path: string;
  label: string;
  help: string;
}

export interface ProfileDef {
  id: string;
  /** "Journal" in "Showing your Journal completion". */
  name: string;
  /** Gauge label. */
  label: string;
  /** Label in the MUNNY/LV box. */
  total: string;
}

/** A row on the import preview: [label, value]. */
export type PreviewRow = readonly [string, string];

export interface SaveSupport {
  /** Copy for the import card. */
  formatsNote: string;
  parse: (buf: ArrayBuffer | Uint8Array) => ParseResult;
  detect: (bytes: Uint8Array) => Detected;
  /** Error copy for a result with no usable slots, or null. */
  error: (res: ParseResult) => string | null;
  /** Counts shown before applying an import. `simulated` is progress after a Sync. */
  previewRows: (det: Detected, simulated: Progress) => PreviewRow[];
}

/** A Config toggle backed by a check item (e.g. "Game cleared"). */
export interface ConfigToggle {
  id: string;
  on: string;
  off: string;
}

export interface GameSummary {
  /** Headline percent or count for the home screen. */
  value: string;
  pct: number;
  sub: string;
}

/** Everything the shell needs to host one game. */
export interface GameDefinition {
  id: GameId;
  /** "Kingdom Hearts II Final Mix". */
  title: string;
  /** "KH2FM". */
  short: string;
  basePath: string;
  nav: readonly NavEntry[];
  /** Child routes under basePath (paths relative, index route = Status). */
  routes: RouteObject[];
  catalog: Catalog;
  store: TrackerStore;
  profiles: readonly ProfileDef[];
  difficulties: readonly string[];
  configToggles: readonly ConfigToggle[];
  /** Notes shown in the Playthrough card. */
  playthroughNote: string;
  backup: BackupFormat;
  /** Undefined until the game's save format is supported. */
  save?: SaveSupport;
  /** MUNNY / LV / TOTAL box under the menu. */
  Wallet: ComponentType;
  summary: (p: Progress, profile: string) => GameSummary;
}
