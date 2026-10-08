import { ANTI_FORM_MAX } from '../data/constants';
import { JOURNAL, type JournalSectionDef } from '../data/journal';
import { SCORED_TROPHY_COUNT, TROPHY_GROUPS } from '../data/trophies';
import type { NavKey } from '../routes/nav';
import { itemsIn, SECTION_ITEMS } from './items';
import { countOn, valueOf } from './progress';
import { evaluateTrophies, type TrophyEvaluation } from './rules';
import type { ItemCategory, Progress } from './types';

export type Profile = 'journal' | 'trophies' | 'everything';

export const PROFILES: readonly { id: Profile; name: string; label: string; total: string }[] = [
  { id: 'journal', name: 'Journal', label: 'JOURNAL', total: 'JOURNAL' },
  { id: 'trophies', name: 'Trophies', label: 'TROPHIES', total: 'TROPHIES' },
  { id: 'everything', name: 'Everything', label: 'EVERYTHING', total: 'ALL' },
];

export function isProfile(v: unknown): v is Profile {
  return v === 'journal' || v === 'trophies' || v === 'everything';
}

export interface SectionScore {
  def: JournalSectionDef;
  done: number;
  total: number;
  ratio: number;
}

export interface CategoryScore {
  name: string;
  done: number;
  total: number;
  /** Screen the category card opens. */
  link: NavKey;
}

export interface Scores {
  sections: SectionScore[];
  journalDone: number;
  trophies: TrophyEvaluation;
  ratio: Record<Profile, number>;
  cats: Record<Profile, CategoryScore[]>;
}

const ids = (...cats: ItemCategory[]) => cats.flatMap((c) => itemsIn(c).map((i) => i.id));
const sum = (p: Progress, list: string[]) => list.reduce((a, id) => a + valueOf(p, id), 0);

const IDS = {
  chest: ids('chest'),
  reward: ids('reward'),
  boss: ids('boss'),
  journal: ids('report', 'puzzle', 'minigame', 'journal-single'),
  forms: ids('form'),
  magic: ids('magic'),
  charms: ids('charm'),
  keyItems: ids('proof', 'torn-page'),
  keyblades: ids('keyblade'),
  battle: ids('absent-silhouette', 'data-org', 'superboss', 'cup', 'mushroom'),
  featsGummi: ids('feat', 'gummi', 'extra'),
};

/** Per-profile scores. Port of the prototype's `model()`. */
export function computeScores(p: Progress): Scores {
  const sections = JOURNAL.map((def): SectionScore => {
    const list = SECTION_ITEMS[def.id];
    const done = countOn(p, list);
    return { def, done, total: list.length, ratio: list.length ? done / list.length : 0 };
  });
  const journalRatio = sections.reduce((a, s) => a + s.ratio, 0) / sections.length;
  const trophies = evaluateTrophies(p);

  const allCats: CategoryScore[] = [
    { name: 'Treasures', done: countOn(p, IDS.chest), total: IDS.chest.length, link: 'worlds' },
    { name: 'Rewards', done: countOn(p, IDS.reward), total: IDS.reward.length, link: 'worlds' },
    { name: 'Story Bosses', done: countOn(p, IDS.boss), total: IDS.boss.length, link: 'worlds' },
    { name: 'Journal', done: countOn(p, IDS.journal), total: IDS.journal.length, link: 'journal' },
    { name: 'Drive Forms', done: sum(p, IDS.forms), total: IDS.forms.length * 7, link: 'drive' },
    {
      name: 'Summons',
      done: countOn(p, IDS.charms) + (valueOf(p, 'lv.summon') - 1),
      total: IDS.charms.length + 6,
      link: 'drive',
    },
    { name: 'Magic', done: sum(p, IDS.magic), total: IDS.magic.length * 3, link: 'drive' },
    { name: 'Key Items', done: countOn(p, IDS.keyItems), total: IDS.keyItems.length, link: 'drive' },
    { name: 'Sora', done: valueOf(p, 'lv.sora'), total: 99, link: 'drive' },
    { name: 'Keyblades', done: countOn(p, IDS.keyblades), total: IDS.keyblades.length, link: 'keys' },
    { name: 'Battle Records', done: countOn(p, IDS.battle), total: IDS.battle.length, link: 'records' },
    {
      name: 'Feats & Gummi',
      done: countOn(p, IDS.featsGummi) + Math.min(valueOf(p, 'lv.anti'), ANTI_FORM_MAX),
      total: IDS.featsGummi.length + ANTI_FORM_MAX,
      link: 'records',
    },
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
  const everything = allCats.filter((c) => c.total > 0);
  const everythingRatio = everything.reduce((a, c) => a + c.done / c.total, 0) / everything.length;

  const journalCats = sections.map((s): CategoryScore => ({
    name: s.def.name,
    done: s.done,
    total: s.total,
    link: s.def.id === 'treasures' ? 'worlds' : 'journal',
  }));
  const trophyCats = TROPHY_GROUPS.map(([g, name]): CategoryScore => {
    const ts = trophies.list.filter((t) => t.group === g);
    return { name, done: ts.filter((t) => t.earned).length, total: ts.length, link: 'trophies' };
  });

  return {
    sections,
    journalDone: sections.filter((s) => s.ratio === 1).length,
    trophies,
    ratio: {
      journal: journalRatio,
      trophies: trophies.earned / SCORED_TROPHY_COUNT,
      everything: everythingRatio,
    },
    cats: { journal: journalCats, trophies: trophyCats, everything },
  };
}

/** Floored whole percent, as the prototype shows it. */
export const pct = (ratio: number): number => Math.floor(ratio * 100);
