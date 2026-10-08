import type { Progress, TrophyEvaluation } from '../../../core/types';
import type { CategorySpec } from '../../../screens/StatusScreen';
import { KH1_JOURNAL, type Kh1JournalDef } from '../data/journal';
import { KH1_TROPHY_GROUPS } from '../data/trophies';
import { countOn, evaluateTrophies, valueOf } from './catalog';
import { KH1_SECTION_ITEMS, kh1ItemsIn, type Kh1Category } from './items';

export type Kh1Profile = 'journal' | 'trophies' | 'everything';

export const KH1_PROFILES: readonly { id: Kh1Profile; name: string; label: string; total: string }[] = [
  { id: 'journal', name: 'Journal', label: 'JOURNAL', total: 'JOURNAL' },
  { id: 'trophies', name: 'Trophies', label: 'TROPHIES', total: 'TROPHIES' },
  { id: 'everything', name: 'Everything', label: 'EVERYTHING', total: 'ALL' },
];

export const isKh1Profile = (v: unknown): v is Kh1Profile =>
  v === 'journal' || v === 'trophies' || v === 'everything';

export interface Kh1SectionScore {
  def: Kh1JournalDef;
  done: number;
  total: number;
  ratio: number;
}

export interface Kh1Scores {
  sections: Kh1SectionScore[];
  journalDone: number;
  trophies: TrophyEvaluation;
  ratio: Record<Kh1Profile, number>;
  cats: Record<Kh1Profile, CategorySpec[]>;
}

const ids = (...cats: Kh1Category[]) => cats.flatMap((c) => kh1ItemsIn(c).map((i) => i.id));
const IDS = {
  chest: ids('chest'),
  reward: ids('reward'),
  event: ids('event'),
  prize: ids('prize'),
  magic: ids('magic'),
  summon: ids('summon'),
  keyblade: ids('keyblade'),
  gear: ids('staff', 'shield'),
  synthesis: ids('synthesis'),
  records: ids('gummi', 'feat', 'keyhole', 'torn-page'),
};

export function sectionScore(p: Progress, def: Kh1JournalDef): Kh1SectionScore {
  if (def.kind === 'counter' && def.counter) {
    const item = kh1ItemsIn(def.id === 'dalmatians' ? 'puppies' : 'trinity')[0];
    const total = item?.max ?? 1;
    const done = Math.min(valueOf(p, def.counter), total);
    return { def, done, total, ratio: done / total };
  }
  const list = KH1_SECTION_ITEMS[def.id];
  const done = countOn(p, list);
  return { def, done, total: list.length, ratio: list.length ? done / list.length : 0 };
}

export function computeKh1Scores(p: Progress): Kh1Scores {
  const sections = KH1_JOURNAL.map((def) => sectionScore(p, def));
  const journalRatio = sections.reduce((a, s) => a + s.ratio, 0) / sections.length;
  const trophies = evaluateTrophies(p);

  const all: CategorySpec[] = [
    { name: 'Treasures', done: countOn(p, IDS.chest), total: IDS.chest.length, link: 'worlds' },
    { name: 'Event Rewards', done: countOn(p, IDS.reward), total: IDS.reward.length, link: 'worlds' },
    { name: 'Story Events', done: countOn(p, IDS.event), total: IDS.event.length, link: 'worlds' },
    { name: 'Prizes', done: countOn(p, IDS.prize), total: IDS.prize.length, link: 'worlds' },
    {
      name: 'Journal',
      done: sections.reduce((a, s) => a + s.done, 0),
      total: sections.reduce((a, s) => a + s.total, 0),
      link: 'journal',
    },
    { name: 'Sora', done: valueOf(p, 'lv.sora'), total: 100, link: 'abilities' },
    {
      name: 'Magic',
      done: IDS.magic.reduce((a, id) => a + valueOf(p, id), 0),
      total: IDS.magic.length * 3,
      link: 'abilities',
    },
    { name: 'Summons', done: countOn(p, IDS.summon), total: IDS.summon.length, link: 'abilities' },
    { name: 'Keyblades', done: countOn(p, IDS.keyblade), total: IDS.keyblade.length, link: 'equipment' },
    { name: 'Staves & Shields', done: countOn(p, IDS.gear), total: IDS.gear.length, link: 'equipment' },
    { name: 'Synthesis', done: countOn(p, IDS.synthesis), total: IDS.synthesis.length, link: 'synthesis' },
    { name: 'Records', done: countOn(p, IDS.records), total: IDS.records.length, link: 'records' },
    {
      name: 'Your Goals',
      done: countOn(
        p,
        p.custom.map((g) => g.id),
      ),
      total: p.custom.length,
      link: 'records',
    },
  ];
  const everything = all.filter((c) => c.total > 0);
  const everythingRatio = everything.reduce((a, c) => a + c.done / c.total, 0) / everything.length;

  return {
    sections,
    journalDone: sections.filter((s) => s.ratio === 1).length,
    trophies,
    ratio: {
      journal: journalRatio,
      trophies: trophies.earned / trophies.scored,
      everything: everythingRatio,
    },
    cats: {
      journal: sections.map((s) => ({ name: s.def.name, done: s.done, total: s.total, link: 'journal' })),
      trophies: KH1_TROPHY_GROUPS.map(([g, name]) => {
        const ts = trophies.list.filter((t) => t.group === g);
        return { name, done: ts.filter((t) => t.earned).length, total: ts.length, link: 'trophies' };
      }),
      everything,
    },
  };
}
