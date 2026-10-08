import { KH1 } from './kh1/game';
import { KH2 } from './kh2/game';
import type { GameDefinition } from './types';

/** Supported games, in switcher order. */
export const GAMES: readonly GameDefinition[] = [KH1, KH2];
