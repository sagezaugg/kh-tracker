export const JOURNAL_SECTIONS = [
  'reports',
  'treasures',
  'puzzles',
  'maps',
  'minigames',
  'synthesis',
  'charfiles',
  'heartless',
  'nobodies',
  'missions',
  'combos',
  'links',
] as const;

export type JournalSection = (typeof JOURNAL_SECTIONS)[number];

export interface JournalSectionDef {
  id: JournalSection;
  name: string;
  /**
   * `list`: rows of items. `summary`: counted here but checked off elsewhere (Treasures → Worlds).
   * `single`: entry list not mapped yet (open question 2), so one checkbox stands for the section.
   */
  kind: 'list' | 'summary' | 'single';
  note?: string;
  /** Row label for `single` sections. */
  singleLabel?: string;
}

export const JOURNAL_SINGLE_NOTE =
  'The full entry list for this section is still being mapped. Check it once the section is complete in the game.';

/** The 12 sections, in the prototype's order. */
export const JOURNAL: readonly JournalSectionDef[] = [
  { id: 'reports', name: 'Ansem Reports', kind: 'list' },
  { id: 'treasures', name: 'Treasures', kind: 'summary' },
  { id: 'puzzles', name: 'Puzzles', kind: 'list', note: 'Mark a puzzle once every piece is placed.' },
  {
    id: 'maps',
    name: 'Maps',
    kind: 'list',
    note: 'These are the same map pickups listed under each world.',
  },
  {
    id: 'minigames',
    name: 'Mini-games',
    kind: 'list',
    note: 'A partial list for now. The full Journal list is still being mapped.',
  },
  // TODO(open question 2/5): 69 Synthesis Notes entries; save flags unknown.
  {
    id: 'synthesis',
    name: 'Synthesis Notes',
    kind: 'single',
    singleLabel: 'Every Synthesis Notes entry',
    note: JOURNAL_SINGLE_NOTE,
  },
  // TODO(open question 2): entry lists for the six sections below.
  {
    id: 'charfiles',
    name: 'Character Files',
    kind: 'single',
    singleLabel: 'Every Character File',
    note: JOURNAL_SINGLE_NOTE,
  },
  {
    id: 'heartless',
    name: 'The Heartless',
    kind: 'single',
    singleLabel: 'Every Heartless entry',
    note: JOURNAL_SINGLE_NOTE,
  },
  {
    id: 'nobodies',
    name: 'The Nobodies',
    kind: 'single',
    singleLabel: 'Every Nobody entry',
    note: JOURNAL_SINGLE_NOTE,
  },
  { id: 'missions', name: 'Missions', kind: 'single', singleLabel: 'Every mission', note: JOURNAL_SINGLE_NOTE },
  { id: 'combos', name: 'Combo Attacks', kind: 'single', singleLabel: 'Every Limit used', note: JOURNAL_SINGLE_NOTE },
  {
    id: 'links',
    name: 'Character Links',
    kind: 'single',
    singleLabel: 'Every Character Links entry',
    note: JOURNAL_SINGLE_NOTE,
  },
];
