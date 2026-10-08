import { DIFFICULTIES, FORMS, SAVE_WORLD_TO_KEY, type WorldKey } from '../data/constants';
import { FINAL_XEMNAS_ID, isMapPickup, WORLD_BY_KEY, WORLDS, type LocationDef } from '../data/locations';
import { MATERIALS, ULTIMATE_RECIPE_ITEM } from '../data/synthesis';
import { TROPHIES } from '../data/trophies';
import { splitArea, type AreaSplit } from './areas';
import { ITEM_BY_ID, itemsIn, TROPHY_ITEM_SETS } from './items';
import { isOn, valueOf } from './catalog';
import { evaluateTrophies } from './catalog';
import type { Profile } from './scoring';
import type { DefinitionTag, Item, Progress, TrophyStatus } from '../../../core/types';
import type { ItemCategory } from './items';

export type HintLevel = 'counts' | 'area' | 'full';
export type GroupBy = 'world' | 'visit';
export type RowTag = 'Chest' | 'Reward' | 'Boss' | 'Map' | 'Ultima';

const PROFILE_TAG: Record<Profile, DefinitionTag> = {
  journal: 'journal',
  trophies: 'trophy',
  everything: 'everything',
};

export interface LeftRow {
  id: string;
  loc: LocationDef;
  split: AreaSplit | null;
  tags: RowTag[];
  ultima: boolean;
  /** Unearned trophies this item counts toward. */
  trophyIds: string[];
}

export interface LeftGroup {
  key: string;
  name: string;
  world: WorldKey;
  /** Visit tag when grouped by visit. */
  visit?: string;
  rows: LeftRow[];
  counts: { chest: number; reward: number; boss: number };
}

export interface QuickWin {
  group: LeftGroup;
  score: number;
  trophies: TrophyStatus[];
}

export interface ReachRow {
  t: TrophyStatus;
  left: number;
  ratio: number;
}

export interface BeyondRow {
  title: string;
  done: number;
  total: number;
  /** Detail line, or null in counts-only mode. */
  detail: string | null;
}

export interface Remaining {
  groups: LeftGroup[];
  total: number;
  here: { name: string; world?: WorldKey; group?: LeftGroup; left: number } | null;
  wins: QuickWin[];
  reach: ReachRow[];
  /** Ending trophies that marking Final Xemnas would unlock, or null once the game is cleared. */
  clearHint: { names: string[]; text: string } | null;
  beyond: BeyondRow[];
}

const ULTIMA_NAMES = MATERIALS.map((m) => m.name);
const isUltima = (l: LocationDef) =>
  l.id === ULTIMATE_RECIPE_ITEM || ULTIMA_NAMES.some((n) => l.name.includes(n));

const ENDING_IDS = TROPHIES.filter((t) => t.clear).map((t) => t.id);

function tagsFor(l: LocationDef, ultima: boolean): RowTag[] {
  const tags: RowTag[] = [l.type === 'chest' ? 'Chest' : l.type === 'reward' ? 'Reward' : 'Boss'];
  if (isMapPickup(l)) tags.push('Map');
  if (ultima) tags.push('Ultima');
  return tags;
}

function counts(rows: LeftRow[]) {
  return {
    chest: rows.filter((r) => r.loc.type === 'chest').length,
    reward: rows.filter((r) => r.loc.type === 'reward').length,
    boss: rows.filter((r) => r.loc.type === 'boss').length,
  };
}

const byCount = (a: LeftGroup, b: LeftGroup) => b.rows.length - a.rows.length || a.name.localeCompare(b.name);

/** Everything not done yet, filtered to one definition of 100%. Computed from data, never stored. */
export function computeRemaining(
  p: Progress,
  profile: Profile,
  groupBy: GroupBy,
  hints: HintLevel,
): Remaining {
  const tag = PROFILE_TAG[profile];
  const trophies = evaluateTrophies(p);
  const unearned = trophies.list.filter((t) => !t.earned && t.id !== 'plat');
  const counts_ = (item: Item | undefined) => !!item && item.tags.includes(tag);

  const rowFor = (l: LocationDef): LeftRow => {
    const ultima = isUltima(l);
    return {
      id: l.id,
      loc: l,
      split: l.type === 'chest' ? splitArea(l) : null,
      tags: tagsFor(l, ultima),
      ultima,
      trophyIds: unearned.filter((t) => TROPHY_ITEM_SETS.get(t.id)?.has(l.id)).map((t) => t.id),
    };
  };

  const worldGroups: LeftGroup[] = WORLDS.map((w) => {
    const rows = w.locations.filter((l) => !isOn(p, l.id) && counts_(ITEM_BY_ID.get(l.id))).map(rowFor);
    return { key: w.key, name: w.name, world: w.key, rows, counts: counts(rows) };
  });

  let groups: LeftGroup[];
  if (groupBy === 'visit') {
    const m = new Map<string, LeftGroup>();
    for (const g of worldGroups) {
      for (const r of g.rows) {
        const visit = r.loc.visitTag || g.world;
        const key = `${g.world}:${visit}`;
        let vg = m.get(key);
        if (!vg) {
          vg = { key, name: `${g.name} · ${visit}`, world: g.world, visit, rows: [], counts: counts([]) };
          m.set(key, vg);
        }
        vg.rows.push(r);
      }
    }
    groups = [...m.values()].map((g) => ({ ...g, counts: counts(g.rows) }));
  } else {
    groups = worldGroups;
  }
  groups = groups.filter((g) => g.rows.length > 0).sort(byCount);
  const total = worldGroups.reduce((a, g) => a + g.rows.length, 0);

  // "You're saved in" banner from the last import.
  let here: Remaining['here'] = null;
  const imp = p.lastImport;
  if (imp) {
    const wk = imp.worldId !== undefined ? SAVE_WORLD_TO_KEY[imp.worldId] : undefined;
    const group = wk ? worldGroups.find((g) => g.world === wk) : undefined;
    here = {
      name: wk ? WORLD_BY_KEY[wk].name : imp.world || 'Unknown',
      world: wk,
      group,
      left: group?.rows.length ?? 0,
    };
  }

  // Quick wins: worlds with the most left, plus a bonus for trophy and Ultima items.
  const wins: QuickWin[] = worldGroups
    .filter((g) => g.rows.length > 0)
    .map((g) => {
      const bonus =
        g.rows.filter((r) => r.trophyIds.length > 0).length + g.rows.filter((r) => r.ultima).length;
      const tIds = new Set(g.rows.flatMap((r) => r.trophyIds));
      return {
        group: g,
        score: g.rows.length + bonus * 0.5,
        trophies: unearned.filter((t) => tIds.has(t.id)),
      };
    })
    .sort((a, b) => b.score - a.score || a.group.name.localeCompare(b.group.name))
    .slice(0, 3);

  // Trophies within reach: unearned, closest first. Ending trophies get their own hint.
  const cleared = isOn(p, FINAL_XEMNAS_ID);
  const reach: ReachRow[] = unearned
    .filter((t) => !(ENDING_IDS.includes(t.id) && !cleared))
    .map((t) => ({ t, left: Math.max(0, t.total - t.done), ratio: t.total ? t.done / t.total : 0 }))
    .sort((a, b) => b.ratio - a.ratio || a.left - b.left)
    .slice(0, 5);

  let clearHint: Remaining['clearHint'] = null;
  if (!cleared) {
    const d = p.difficulty;
    const names = unearned
      .filter((t) => ENDING_IDS.includes(t.id))
      .filter((t) => t.id === 'ambitious' || (d !== undefined && (t.id === 'proud' ? d >= 2 : d >= 3)))
      .map((t) => t.name);
    const text =
      d === undefined
        ? 'Mark Final Xemnas as beaten on Config. Set your difficulty there too to see which ending trophies unlock.'
        : `Mark Final Xemnas as beaten on Config. Your playthrough is on ${DIFFICULTIES[d]}, so ${
            names.length === 1
              ? 'this unlocks'
              : names.length === 2
                ? 'both unlock'
                : `all ${names.length} unlock`
          }.`;
    if (names.length) clearHint = { names, text };
  }

  // Beyond the worlds.
  const beyondOf = (
    title: string,
    cats: ItemCategory[],
    detail: (missing: Item[]) => string | null,
  ): BeyondRow | null => {
    const items = cats.flatMap((c) => itemsIn(c)).filter((i) => i.tags.includes(tag));
    if (!items.length) return null;
    const missing = items.filter((i) => !isOn(p, i.id));
    return {
      title,
      done: items.length - missing.length,
      total: items.length,
      detail: hints === 'counts' ? null : detail(missing),
    };
  };
  const list = (missing: Item[]) => (missing.length ? missing.map((i) => i.name).join(', ') : 'All done');
  const beyond: (BeyondRow | null)[] = [
    beyondOf('Journal entries', ['report', 'puzzle', 'minigame', 'journal-single'], (m) =>
      m.length ? `${m.length} left outside the world lists` : 'All done',
    ),
    beyondOf('Keyblades', ['keyblade'], list),
    beyondOf('Superbosses', ['absent-silhouette', 'data-org', 'superboss'], (m) => {
      if (!m.length) return 'All done';
      const groupsLeft = [
        m.some((i) => i.category === 'absent-silhouette') && 'Absent Silhouettes',
        m.some((i) => i.category === 'data-org') && 'Data Organization',
        ...m.filter((i) => i.category === 'superboss').map((i) => i.name),
      ].filter(Boolean);
      return groupsLeft.join(', ');
    }),
    beyondOf('Cups & Mushroom XIII', ['cup', 'mushroom'], (m) =>
      m.length ? `${m.length} left` : 'All done',
    ),
    beyondOf('Feats & Gummi', ['feat', 'gummi', 'extra'], (m) =>
      m.length ? `${m.length} left` : 'All done',
    ),
  ];
  if (tag === 'everything') {
    const sum = FORMS.reduce((a, f) => a + valueOf(p, `lv.${f.key}`), 0);
    const lowest = [...FORMS].sort((a, b) => valueOf(p, `lv.${a.key}`) - valueOf(p, `lv.${b.key}`))[0];
    const lv = valueOf(p, `lv.${lowest.key}`);
    beyond.push({
      title: 'Drive Forms',
      done: sum,
      total: FORMS.length * 7,
      detail:
        hints === 'counts'
          ? null
          : sum === 35
            ? 'All LV 7'
            : lv
              ? `${lowest.name} is LV ${lv}`
              : `${lowest.name} not obtained`,
    });
  }

  return {
    groups,
    total,
    here,
    wins,
    reach,
    clearHint,
    beyond: beyond.filter((b): b is BeyondRow => b !== null && b.done < b.total),
  };
}
