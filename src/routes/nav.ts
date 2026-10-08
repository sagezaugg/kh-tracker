/** Menu entries in display order. `key` matches the prototype's tab ids where one existed. */
export interface NavEntry {
  key: NavKey;
  path: string;
  label: string;
  help: string;
}

export type NavKey =
  'status' | 'left' | 'worlds' | 'journal' | 'trophies' | 'synthesis' | 'drive' | 'keys' | 'records' | 'data';

export const NAV: readonly NavEntry[] = [
  {
    key: 'status',
    path: '/',
    label: 'Status',
    help: 'Overall completion at a glance. Select a card to jump to it.',
  },
  {
    key: 'left',
    path: '/left',
    label: "What's Left",
    help: "Everything you haven't done yet, grouped by world, with the quickest wins first.",
  },
  {
    key: 'worlds',
    path: '/worlds',
    label: 'Worlds',
    help: 'Treasures, reward pop-ups and story bosses for every world.',
  },
  {
    key: 'journal',
    path: '/journal',
    label: 'Journal',
    help: "The 12 sections of Jiminy's Journal. Filling one also earns its trophy.",
  },
  {
    key: 'trophies',
    path: '/trophies',
    label: 'Trophies',
    help: 'All 51 trophies. Most unlock from your checklist; mark the rest by hand.',
  },
  {
    key: 'synthesis',
    path: '/synthesis',
    label: 'Synthesis',
    help: "Track the Ultima Weapon and every synthesis item, and see where to find what you're missing.",
  },
  {
    key: 'drive',
    path: '/drive',
    label: 'Drive & Magic',
    help: "Drive Forms, Summons, Magic, Sora's level, Anti Form and key items.",
  },
  { key: 'keys', path: '/keyblades', label: 'Keyblades', help: 'Every Keyblade Sora can wield.' },
  {
    key: 'records',
    path: '/records',
    label: 'Records',
    help: 'Superbosses, cups, Mushroom XIII, feats, Gummi Ship and your own goals.',
  },
  {
    key: 'data',
    path: '/config',
    label: 'Config',
    help: 'Set your difficulty, import a save, back up your progress, or start over.',
  },
];

export const NAV_BY_KEY: Record<NavKey, NavEntry> = Object.fromEntries(NAV.map((n) => [n.key, n])) as Record<
  NavKey,
  NavEntry
>;

/** Finds the menu entry that owns a pathname (`/worlds/lod` → Worlds). */
export function navForPath(pathname: string): NavEntry | undefined {
  if (pathname === '/' || pathname === '') return NAV_BY_KEY.status;
  const first = '/' + pathname.split('/').filter(Boolean)[0];
  return NAV.find((n) => n.path === first);
}
