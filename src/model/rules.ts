import { DIFFICULTIES } from '../data/constants';
import { FINAL_XEMNAS_ID } from '../data/locations';
import {
  SCORED_TROPHY_COUNT,
  TROPHIES,
  trophyOverrideId,
  type TrophyDef,
  type TrophyGroup,
  type TrophyTier,
} from '../data/trophies';
import { SECTION_ITEMS } from './items';
import { countOn, isOn, valueOf } from './progress';
import type { Progress, Rule } from './types';

export interface RuleProgress {
  done: number;
  total: number;
}

/** Progress toward a rule. A rule is met when done ≥ total. */
export function evalRule(rule: Rule, p: Progress): RuleProgress {
  if ('all' in rule) return { done: countOn(p, rule.all), total: rule.all.length };
  if ('item' in rule) return { done: Math.min(valueOf(p, rule.item), rule.atLeast), total: rule.atLeast };
  if ('save' in rule)
    return { done: p.difficulty !== undefined && p.difficulty >= rule.atLeast ? 1 : 0, total: 1 };
  if ('section' in rule) {
    const ids = SECTION_ITEMS[rule.section];
    return { done: countOn(p, ids), total: ids.length };
  }
  if ('and' in rule) {
    return rule.and.reduce<RuleProgress>(
      (acc, r) => {
        const x = evalRule(r, p);
        return { done: acc.done + x.done, total: acc.total + x.total };
      },
      { done: 0, total: 0 },
    );
  }
  if ('or' in rule) {
    const parts = rule.or.map((r) => evalRule(r, p));
    return parts.reduce((best, x) => (x.done / x.total > best.done / best.total ? x : best), parts[0]);
  }
  return { done: 0, total: 1 };
}

export interface TrophyStatus {
  id: string;
  name: string;
  tier: TrophyTier;
  req: string;
  group: TrophyGroup;
  done: number;
  total: number;
  /** Earned from the checklist. */
  auto: boolean;
  /** Marked earned by hand. */
  over: boolean;
  earned: boolean;
  progText: string;
}

function status(t: TrophyDef, p: Progress): TrophyStatus {
  const { done, total } = t.rule ? evalRule(t.rule, p) : { done: 0, total: 1 };
  const auto = done >= total;
  const over = isOn(p, trophyOverrideId(t.id));
  let progText = `${done} / ${total}`;
  if (t.clear) {
    const cleared = isOn(p, FINAL_XEMNAS_ID);
    const needsDiff = t.rule !== undefined && 'and' in t.rule;
    progText =
      (cleared ? 'Game cleared' : 'Game not cleared') +
      (needsDiff
        ? ` · ${p.difficulty !== undefined ? DIFFICULTIES[p.difficulty] : 'difficulty not set'}`
        : '');
  }
  return {
    id: t.id,
    name: t.name,
    tier: t.tier,
    req: t.req,
    group: t.group,
    done,
    total,
    auto,
    over,
    earned: auto || over,
    progText,
  };
}

export interface TrophyEvaluation {
  /** All 51, Platinum first. */
  list: TrophyStatus[];
  /** Earned among the 50 scored trophies. */
  earned: number;
  platinum: boolean;
}

/** Evaluates every trophy from progress. Trophies are never stored. */
export function evaluateTrophies(p: Progress): TrophyEvaluation {
  const scored = TROPHIES.filter((t) => t.group !== 'plat').map((t) => status(t, p));
  const earned = scored.filter((t) => t.earned).length;
  const platinum = earned === SCORED_TROPHY_COUNT;
  const platDef = TROPHIES[0];
  const plat: TrophyStatus = {
    id: platDef.id,
    name: platDef.name,
    tier: platDef.tier,
    req: platDef.req,
    group: platDef.group,
    done: earned,
    total: SCORED_TROPHY_COUNT,
    auto: platinum,
    over: false,
    earned: platinum,
    progText: `${earned} / ${SCORED_TROPHY_COUNT}`,
  };
  return { list: [plat, ...scored], earned, platinum };
}

/** Trophies earned in `after` that weren't in `before`. */
export function newlyEarned(before: TrophyEvaluation, after: TrophyEvaluation): TrophyStatus[] {
  const was = new Set(before.list.filter((t) => t.earned).map((t) => t.id));
  return after.list.filter((t) => t.earned && !was.has(t.id));
}
