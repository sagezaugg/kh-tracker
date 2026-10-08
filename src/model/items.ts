import {
  ABSENT_SILHOUETTES,
  ANTI_FORM_MAX,
  CUPS,
  DATA_ORG,
  FEATS,
  FORMS,
  GUMMI,
  MAGIC,
  MINIGAMES,
  MUSHROOMS,
  PROOFS,
  PUZZLES,
  REPORT_BITS,
  SUMMON_LEVEL_OFFSET,
  SUMMONS,
  SUPERBOSSES,
  TORN_PAGE_BITS,
  type BossDef,
} from '../data/constants';
import { JOURNAL, JOURNAL_SECTIONS, type JournalSection } from '../data/journal';
import { KEYBLADES } from '../data/keyblades';
import { isMapPickup, LOCATIONS } from '../data/locations';
import { slug } from '../data/slug';
import { TROPHIES } from '../data/trophies';
import type { DefinitionTag, Item, ItemCategory, Rule } from './types';

type ItemSeed = Omit<Item, 'tags'>;

const bossItems = (
  prefix: string,
  list: readonly BossDef[],
  name: (b: BossDef) => string,
  cat: ItemCategory,
  tag?: string,
) =>
  list.map((b): ItemSeed => ({
    id: `${prefix}.${b.key}`,
    name: name(b),
    category: cat,
    kind: 'check',
    tag,
    probe: b.flag ? { type: 'bit', offset: b.flag.offset, bit: b.flag.bit } : undefined,
  }));

const LOCATION_CATEGORY = { chest: 'chest', reward: 'reward', boss: 'boss' } as const;

const SEEDS: ItemSeed[] = [
  ...LOCATIONS.map((l): ItemSeed => ({
    id: l.id,
    name: l.name,
    category: LOCATION_CATEGORY[l.type],
    world: l.world,
    journalSection: l.type === 'chest' ? 'treasures' : isMapPickup(l) ? 'maps' : undefined,
    kind: 'check',
    tag: l.visitTag || undefined,
    visitTag: l.visitTag,
    probe: { type: 'bit', offset: l.offset, bit: l.bit },
  })),
  ...REPORT_BITS.map((b, i): ItemSeed => ({
    id: `r.${i + 1}`,
    name: `Secret Ansem Report ${i + 1}`,
    category: 'report',
    journalSection: 'reports',
    kind: 'check',
    probe: { type: 'bit', offset: b.offset, bit: b.bit },
  })),
  ...PUZZLES.map((p): ItemSeed => ({
    id: `pz.${slug(p)}`,
    name: `${p} Puzzle`,
    category: 'puzzle',
    journalSection: 'puzzles',
    kind: 'check',
  })),
  ...MINIGAMES.map(([name, tag]): ItemSeed => ({
    id: `mg.${slug(name)}`,
    name,
    category: 'minigame',
    journalSection: 'minigames',
    kind: 'check',
    tag,
  })),
  ...JOURNAL.filter((j) => j.kind === 'single').map((j): ItemSeed => ({
    id: `js.${j.id}`,
    name: j.singleLabel ?? j.name,
    category: 'journal-single',
    journalSection: j.id,
    kind: 'check',
  })),
  ...MUSHROOMS.map(([place, tag], i): ItemSeed => ({
    id: `mu.${i + 1}`,
    name: `Mushroom XIII No. ${i + 1}`,
    category: 'mushroom',
    kind: 'check',
    tag: `${tag} · ${place}`,
  })),
  ...KEYBLADES.map((k): ItemSeed => ({
    id: k.id,
    name: k.name,
    category: 'keyblade',
    kind: 'check',
    probe: [
      { type: 'count', offset: k.offset, min: 1 },
      { type: 'equip', itemId: k.itemId },
    ],
  })),
  ...bossItems(
    'as',
    ABSENT_SILHOUETTES,
    (b) => `Absent Silhouette: ${b.name}`,
    'absent-silhouette',
    'Everything only',
  ),
  ...bossItems('do', DATA_ORG, (b) => `Data ${b.name}`, 'data-org'),
  ...bossItems('sb', SUPERBOSSES, (b) => b.name, 'superboss'),
  ...CUPS.map((c): ItemSeed => ({ id: `cup.${slug(c)}`, name: c, category: 'cup', kind: 'check' })),
  ...SUMMONS.map((s): ItemSeed => ({
    id: `sm.${s.key}`,
    name: s.charm,
    category: 'charm',
    kind: 'check',
    tag: s.name,
    probe: { type: 'bit', offset: s.flag.offset, bit: s.flag.bit },
  })),
  ...PROOFS.map((p): ItemSeed => ({
    id: `pf.${p.key}`,
    name: p.name,
    category: 'proof',
    kind: 'check',
    probe: { type: 'count', offset: p.offset, min: 1 },
  })),
  ...TORN_PAGE_BITS.map((b, i): ItemSeed => ({
    id: `pg.${i + 1}`,
    name: `Torn Page ${i + 1} delivered`,
    category: 'torn-page',
    kind: 'check',
    tag: '100AW',
    probe: { type: 'bit', offset: b.offset, bit: b.bit },
  })),
  ...FEATS.map(([key, name]): ItemSeed => ({
    id: `ft.${key}`,
    name,
    category: 'feat',
    kind: 'check',
    tag: 'Trophy',
  })),
  ...GUMMI.map(([key, name, tag]): ItemSeed => ({
    id: `gm.${key}`,
    name,
    category: 'gummi',
    kind: 'check',
    tag,
  })),
  {
    id: 'ex.abilities',
    name: 'Every ability learned',
    category: 'extra',
    kind: 'check',
    tag: 'Everything only',
  },
  {
    id: 'lv.sora',
    name: 'Sora',
    category: 'sora',
    kind: 'level',
    min: 1,
    max: 99,
    probe: { type: 'level', offset: 0x24ff, min: 1, max: 99 },
  },
  ...FORMS.map((f): ItemSeed => ({
    id: `lv.${f.key}`,
    name: f.name,
    category: 'form',
    kind: 'level',
    min: 0,
    max: 7,
    probe: { type: 'level', offset: f.levelOffset, min: 1, max: 7, unlock: f.unlock },
  })),
  {
    id: 'lv.summon',
    name: 'Summon level',
    category: 'summon',
    kind: 'level',
    min: 1,
    max: 7,
    probe: { type: 'level', offset: SUMMON_LEVEL_OFFSET, min: 1, max: 7 },
  },
  ...MAGIC.map((m): ItemSeed => ({
    id: `lv.${m.key}`,
    name: m.tiers[0],
    category: 'magic',
    kind: 'level',
    min: 0,
    max: 3,
    probe: { type: 'level', offset: m.offset, min: 0, max: 3 },
  })),
  // TODO(open question 5): the Anti Form counter's save offset is unknown, so it's manual.
  {
    id: 'lv.anti',
    name: 'Anti Form transformations',
    category: 'anti',
    kind: 'counter',
    min: 0,
    max: ANTI_FORM_MAX,
  },
];

/** Item ids each Journal section counts. Maps overlap with world items; Treasures are every chest. */
export const SECTION_ITEMS: Readonly<Record<JournalSection, readonly string[]>> = (() => {
  const out = Object.fromEntries(JOURNAL_SECTIONS.map((s) => [s, [] as string[]])) as Record<
    JournalSection,
    string[]
  >;
  for (const l of LOCATIONS) {
    if (l.type === 'chest') out.treasures.push(l.id);
    if (isMapPickup(l)) out.maps.push(l.id);
  }
  for (const s of SEEDS) {
    if (s.journalSection && s.journalSection !== 'treasures' && s.journalSection !== 'maps') {
      out[s.journalSection].push(s.id);
    }
  }
  return out;
})();

function ruleItemIds(rule: Rule, into: Set<string>): void {
  if ('all' in rule) rule.all.forEach((id) => into.add(id));
  else if ('item' in rule) into.add(rule.item);
  else if ('section' in rule) SECTION_ITEMS[rule.section].forEach((id) => into.add(id));
  else if ('and' in rule) rule.and.forEach((r) => ruleItemIds(r, into));
  else if ('or' in rule) rule.or.forEach((r) => ruleItemIds(r, into));
}

/** Every item id that some trophy rule reads. */
export const TROPHY_ITEM_IDS: ReadonlySet<string> = (() => {
  const s = new Set<string>();
  TROPHIES.forEach((t) => t.rule && ruleItemIds(t.rule, s));
  return s;
})();

const JOURNAL_ITEM_IDS = new Set(Object.values(SECTION_ITEMS).flat());

export const ITEMS: readonly Item[] = SEEDS.map((s) => {
  const tags: DefinitionTag[] = [];
  if (JOURNAL_ITEM_IDS.has(s.id)) tags.push('journal');
  if (TROPHY_ITEM_IDS.has(s.id)) tags.push('trophy');
  tags.push('everything');
  return { ...s, tags };
});

export const ITEM_BY_ID: ReadonlyMap<string, Item> = new Map(ITEMS.map((i) => [i.id, i]));

export function itemsIn(category: ItemCategory): Item[] {
  return ITEMS.filter((i) => i.category === category);
}

export function hasProbe(item: Item): boolean {
  return item.probe !== undefined;
}

/** Starting values for level/counter items (Sora LV 1, summons LV 1, everything else 0). */
export const DEFAULT_VALUES: Readonly<Record<string, number>> = Object.fromEntries(
  ITEMS.filter((i) => i.kind !== 'check').map((i) => [i.id, i.min ?? 0]),
);
