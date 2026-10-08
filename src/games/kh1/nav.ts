import type { NavEntry } from '../types';

/** KH1FM menu entries in display order. */
export const KH1_NAV: readonly NavEntry[] = [
  {
    key: 'status',
    path: '',
    label: 'Status',
    help: 'Overall completion at a glance. Select a card to jump to it.',
  },
  {
    key: 'left',
    path: 'left',
    label: "What's Left",
    help: "Everything you haven't done yet, grouped by world, biggest first.",
  },
  {
    key: 'worlds',
    path: 'worlds',
    label: 'Worlds',
    help: 'Treasure chests, event rewards and story events for every world.',
  },
  {
    key: 'journal',
    path: 'journal',
    label: 'Journal',
    help: "Jiminy's Journal: Ansem's Report, the 99 puppies, Trinity marks and the rest.",
  },
  {
    key: 'trophies',
    path: 'trophies',
    label: 'Trophies',
    help: 'All 56 trophies. Many unlock from your checklist; mark the rest by hand.',
  },
  {
    key: 'synthesis',
    path: 'synthesis',
    label: 'Synthesis',
    help: 'The Ultima Weapon and all 33 synthesis items.',
  },
  {
    key: 'abilities',
    path: 'abilities',
    label: 'Magic & Summons',
    help: "Sora's level, magic and summons.",
  },
  {
    key: 'equipment',
    path: 'equipment',
    label: 'Equipment',
    help: "Sora's Keyblades, Donald's staves and Goofy's shields.",
  },
  {
    key: 'records',
    path: 'records',
    label: 'Records',
    help: 'Superbosses, Coliseum cups, keyholes, Gummi Ship, feats and your own goals.',
  },
  {
    key: 'data',
    path: 'config',
    label: 'Config',
    help: 'Set your difficulty, import a save, back up your progress, or start over.',
  },
];
