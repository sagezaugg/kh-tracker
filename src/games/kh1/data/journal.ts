/** Jiminy's Journal sections in KH1FM (KHWiki "Jiminy's Journal"), each tied to a trophy. */
export const KH1_JOURNAL_SECTIONS = ['story', 'reports', 'characters', 'dalmatians', 'trinity', 'minigames'] as const;
export type Kh1JournalSection = (typeof KH1_JOURNAL_SECTIONS)[number];

export interface Kh1JournalDef {
  id: Kh1JournalSection;
  name: string;
  /** `list`: one row per entry; `counter`: a count (stepper); `single`: one check for the section. */
  kind: 'list' | 'counter' | 'single';
  note?: string;
  singleLabel?: string;
  /** Counter item id for `counter` sections. */
  counter?: string;
}

const SINGLE_NOTE =
  'The entry count for this section is still being mapped. Check it once the section is complete in the game.';

export const KH1_JOURNAL: readonly Kh1JournalDef[] = [
  // TODO(open question): entry counts for Chronicles, Characters and Mini-games, and their save flags.
  {
    id: 'story',
    name: 'Chronicles',
    kind: 'single',
    singleLabel: 'Every Chronicles (story) entry',
    note: SINGLE_NOTE,
  },
  { id: 'reports', name: "Ansem's Report", kind: 'list' },
  {
    id: 'characters',
    name: 'Characters',
    kind: 'single',
    singleLabel: 'Every Characters I, Characters II and Heartless entry',
    note: `${SINGLE_NOTE} Heartless entries are part of the Characters section in KH1.`,
  },
  {
    id: 'dalmatians',
    name: '101 Dalmatians',
    kind: 'counter',
    counter: 'kh1.puppies',
    note: 'Puppies rescued, read from the save. Return them to Pongo and Perdita in Traverse Town.',
  },
  {
    id: 'trinity',
    name: 'Trinity Marks',
    kind: 'counter',
    counter: 'kh1.trinity',
    note: "Trinity marks used. KHWiki lists 46 (Blue 17, Red 6, Green 9, Yellow 4, White 10). The save offset isn't mapped yet, so count them by hand.",
  },
  {
    id: 'minigames',
    name: 'Mini-games',
    kind: 'single',
    singleLabel: 'Every Mini-game entry',
    note: SINGLE_NOTE,
  },
];
