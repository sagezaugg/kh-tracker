import { ruleItemIds } from '../../../core/rules';
import { slug } from '../../../core/slug';
import type { DefinitionTag, Item, SaveProbe } from '../../../core/types';
import {
  INVENTORY_OFFSET,
  KEYBLADES,
  MAGIC,
  MAGIC_LEVEL_OFFSET,
  MAGIC_UNLOCK_OFFSET,
  PUPPY_BYTES,
  PUPPY_COUNT,
  PUPPY_OFFSET,
  SHIELDS,
  SORA_LEVEL_OFFSET,
  STAVES,
  SUMMON_LIST_OFFSET,
  SUMMONS,
  TRINITY_COUNT,
} from '../data/constants';
import { KH1_JOURNAL, KH1_JOURNAL_SECTIONS, type Kh1JournalSection } from '../data/journal';
import { KH1_LOCATIONS, REPORT_FLAGS, type Kh1LocationDef } from '../data/locations';
import { KH1_ULTIMA_RECIPE, materialId, SYNTHESIS_LISTS, synthesisId } from '../data/synthesis';
import { KH1_CLEARED_ID, KH1_TROPHIES } from '../data/trophies';

export type Kh1Category =
  | 'chest'
  | 'reward'
  | 'event'
  | 'prize'
  | 'report'
  | 'journal-single'
  | 'puppies'
  | 'trinity'
  | 'sora'
  | 'magic'
  | 'summon'
  | 'keyblade'
  | 'staff'
  | 'shield'
  | 'synthesis'
  | 'material'
  | 'gummi'
  | 'feat'
  | 'keyhole'
  | 'torn-page'
  | 'cleared';

type Seed = Omit<Item, 'tags' | 'category'> & { category: Kh1Category };

const probeOf = (l: Kh1LocationDef): SaveProbe | undefined =>
  !l.flag
    ? undefined
    : l.flag.kind === 'bit'
      ? { type: 'bit', offset: l.flag.offset, bit: l.flag.bit }
      : { type: 'count', offset: l.flag.offset, min: l.flag.value };

const LOCATION_CATEGORY = { chest: 'chest', reward: 'reward', event: 'event', prize: 'prize' } as const;

const inv = (itemId: number): SaveProbe => ({ type: 'count', offset: INVENTORY_OFFSET + itemId, min: 1 });

/** Manual checks for trophies the save can't show yet. */
export const KH1_FEATS: readonly (readonly [string, string])[] = [
  ['ft.armor', 'Clear the game without changing equipment'],
  ['ft.undefeated', 'Clear the game without using a continue'],
  ['ft.speedster', 'Defeat the World of Chaos within 15 hours'],
  ['ft.riches', 'Hold over 10,000 munny'],
  ['ft.hhunter', 'Defeat over 2,000 Heartless'],
];
export const KH1_GUMMI: readonly (readonly [string, string])[] = [
  ['gm.mission1', 'Clear gummi ship mission 1'],
  ['gm.mission2', 'Clear gummi ship mission 2'],
  ['gm.mission3', 'Clear gummi ship mission 3'],
  ['gm.topgun', 'Clear all gummi ship routes'],
  ['gm.customizer', 'Modify a gummi ship and update the data'],
  ['gm.collector', 'Obtain 30 or more gummi ship blueprints'],
  ['gm.flyingace', 'Shoot down over 2,500 enemies with your gummi ship'],
];
/** Keyholes with no flagged "Seal Keyhole" event, checked by hand. */
export const KH1_MANUAL_KEYHOLES: readonly (readonly [string, string])[] = [
  ['kh.tt', 'Traverse Town Keyhole sealed'],
  ['kh.wl', 'Wonderland Keyhole sealed'],
  ['kh.oc', 'Olympus Coliseum Keyhole sealed'],
  ['kh.hb', 'Hollow Bastion Keyhole sealed'],
  ['kh.aw', '100 Acre Wood Keyhole sealed'],
];

const SEEDS: Seed[] = [
  ...KH1_LOCATIONS.map((l): Seed => ({
    id: l.id,
    name: l.short,
    category: LOCATION_CATEGORY[l.type],
    world: l.world,
    kind: 'check',
    probe: probeOf(l),
  })),
  ...REPORT_FLAGS.map((r): Seed => ({
    id: `r.${r.n}`,
    name: `Ansem's Report ${r.n}`,
    category: 'report',
    journalSection: 'reports',
    kind: 'check',
    probe: { type: 'bit', offset: r.offset, bit: r.bit },
  })),
  ...KH1_JOURNAL.filter((j) => j.kind === 'single').map((j): Seed => ({
    id: `js.${j.id}`,
    name: j.singleLabel ?? j.name,
    category: 'journal-single',
    journalSection: j.id,
    kind: 'check',
  })),
  {
    id: 'kh1.puppies',
    name: 'Puppies rescued',
    category: 'puppies',
    journalSection: 'dalmatians',
    kind: 'counter',
    min: 0,
    max: PUPPY_COUNT,
    probe: { type: 'bitCount', offset: PUPPY_OFFSET, length: PUPPY_BYTES, max: PUPPY_COUNT },
  },
  {
    id: 'kh1.trinity',
    name: 'Trinity marks used',
    category: 'trinity',
    journalSection: 'trinity',
    kind: 'counter',
    min: 0,
    max: TRINITY_COUNT,
  },
  {
    id: 'lv.sora',
    name: 'Sora',
    category: 'sora',
    kind: 'level',
    min: 1,
    max: 100,
    probe: { type: 'level', offset: SORA_LEVEL_OFFSET, min: 1, max: 100 },
  },
  ...MAGIC.map((m, i): Seed => ({
    id: `lv.${m.key}`,
    name: m.tiers[0],
    category: 'magic',
    kind: 'level',
    min: 0,
    max: 3,
    probe: {
      type: 'level',
      offset: MAGIC_LEVEL_OFFSET + i,
      min: 1,
      max: 3,
      unlock: { offset: MAGIC_UNLOCK_OFFSET, bit: i },
    },
  })),
  ...SUMMONS.map((s): Seed => ({
    id: `sm.${s.key}`,
    name: s.name,
    category: 'summon',
    kind: 'check',
    probe: { type: 'listHas', offset: SUMMON_LIST_OFFSET, length: 8, value: s.id },
  })),
  ...KEYBLADES.map(([itemId, name]): Seed => ({
    id: `kb.${slug(name)}`,
    name,
    category: 'keyblade',
    kind: 'check',
    probe: [inv(itemId), { type: 'equip', itemId }],
  })),
  ...STAVES.map(([itemId, name]): Seed => ({
    id: `st.${slug(name)}`,
    name,
    category: 'staff',
    kind: 'check',
    tag: 'Everything only',
    probe: inv(itemId),
  })),
  ...SHIELDS.map(([itemId, name]): Seed => ({
    id: `sh.${slug(name)}`,
    name,
    category: 'shield',
    kind: 'check',
    tag: 'Everything only',
    probe: inv(itemId),
  })),
  // TODO(open question): the save's synthesis record isn't mapped, so these are manual.
  ...SYNTHESIS_LISTS.flatMap((l) =>
    l.items.map((name): Seed => ({
      id: synthesisId(name),
      name,
      category: 'synthesis',
      kind: 'check',
      tag: l.list,
    })),
  ),
  ...KH1_ULTIMA_RECIPE.map((m): Seed => ({
    id: materialId(m.itemId),
    name: m.name,
    category: 'material',
    kind: 'counter',
    min: 0,
    max: 99,
    probe: { type: 'byte', offset: INVENTORY_OFFSET + m.itemId },
  })),
  ...KH1_GUMMI.map(([id, name]): Seed => ({ id, name, category: 'gummi', kind: 'check' })),
  ...KH1_FEATS.map(([id, name]): Seed => ({ id, name, category: 'feat', kind: 'check', tag: 'Trophy' })),
  ...KH1_MANUAL_KEYHOLES.map(([id, name]): Seed => ({
    id,
    name,
    category: 'keyhole',
    kind: 'check',
    tag: 'Trophy',
  })),
  // TODO(open question): 0x1400 reads 5 in finished saves, but whether it counts pages held or
  // delivered is unclear, so torn pages stay manual.
  ...[1, 2, 3, 4, 5].map((n): Seed => ({
    id: `pg.${n}`,
    name: `Torn Page ${n} delivered`,
    category: 'torn-page',
    kind: 'check',
    tag: '100AW',
  })),
  { id: KH1_CLEARED_ID, name: 'Game cleared (Ansem defeated)', category: 'cleared', kind: 'check' },
];

export const KH1_SECTION_ITEMS: Readonly<Record<Kh1JournalSection, readonly string[]>> = Object.fromEntries(
  KH1_JOURNAL_SECTIONS.map((s) => [
    s,
    SEEDS.filter((x) => x.journalSection === s && x.kind === 'check').map((x) => x.id),
  ]),
) as Record<Kh1JournalSection, string[]>;

export const KH1_TROPHY_ITEM_SETS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  KH1_TROPHIES.map((t) => [
    t.id,
    t.rule ? ruleItemIds({ sectionItems: KH1_SECTION_ITEMS }, t.rule, new Set()) : new Set(),
  ]),
);
const TROPHY_IDS = new Set([...KH1_TROPHY_ITEM_SETS.values()].flatMap((s) => [...s]));

/** Categories that don't count toward Everything (inputs, not goals). */
const NOT_GOALS: ReadonlySet<Kh1Category> = new Set(['material', 'cleared']);

export const KH1_ITEMS: readonly Item[] = SEEDS.map((s) => {
  const tags: DefinitionTag[] = [];
  if (s.journalSection) tags.push('journal');
  if (TROPHY_IDS.has(s.id)) tags.push('trophy');
  if (!NOT_GOALS.has(s.category)) tags.push('everything');
  return { ...s, tags };
});

export const KH1_ITEM_BY_ID: ReadonlyMap<string, Item> = new Map(KH1_ITEMS.map((i) => [i.id, i]));

export function kh1ItemsIn(category: Kh1Category): Item[] {
  return KH1_ITEMS.filter((i) => i.category === category);
}

export const KH1_DEFAULT_VALUES: Readonly<Record<string, number>> = Object.fromEntries(
  KH1_ITEMS.filter((i) => i.kind !== 'check').map((i) => [i.id, i.min ?? 0]),
);
