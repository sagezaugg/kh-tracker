import { countOn, isOn, valueOf } from './progress';
import type {
  Catalog,
  Progress,
  Rule,
  RuleProgress,
  TrophyDef,
  TrophyEvaluation,
  TrophyStatus,
  TrophyTier,
} from './types';

/** Progress toward a rule. A rule is met when done ≥ total. */
export function evalRule(cat: Catalog, rule: Rule, p: Progress): RuleProgress {
  if ('all' in rule) return { done: countOn(p, rule.all), total: rule.all.length };
  if ('item' in rule)
    return { done: Math.min(valueOf(cat, p, rule.item), rule.atLeast), total: rule.atLeast };
  if ('count' in rule) return { done: Math.min(countOn(p, rule.count), rule.atLeast), total: rule.atLeast };
  if ('save' in rule) {
    return { done: p.difficulty !== undefined && p.difficulty >= rule.atLeast ? 1 : 0, total: 1 };
  }
  if ('section' in rule) {
    const ids = cat.sectionItems[rule.section] ?? [];
    return { done: countOn(p, ids), total: ids.length };
  }
  if ('and' in rule) {
    return rule.and.reduce<RuleProgress>(
      (acc, r) => {
        const x = evalRule(cat, r, p);
        return { done: acc.done + x.done, total: acc.total + x.total };
      },
      { done: 0, total: 0 },
    );
  }
  if ('or' in rule) {
    const parts = rule.or.map((r) => evalRule(cat, r, p));
    return parts.reduce((best, x) => (x.done / x.total > best.done / best.total ? x : best), parts[0]);
  }
  return { done: 0, total: 1 };
}

/** Manual "Mark earned" overrides are stored as checks under this prefix. */
export const trophyOverrideId = (trophyId: string): string => `tro.${trophyId}`;

function status(cat: Catalog, t: TrophyDef, p: Progress): TrophyStatus {
  const r = t.rule ? evalRule(cat, t.rule, p) : { done: 0, total: 1 };
  const auto = r.done >= r.total;
  const over = isOn(p, trophyOverrideId(t.id));
  return {
    id: t.id,
    name: t.name,
    tier: t.tier,
    req: t.req,
    group: t.group,
    done: r.done,
    total: r.total,
    auto,
    over,
    earned: auto || over,
    progText: t.progText ? t.progText(p, r) : `${r.done} / ${r.total}`,
  };
}

/** Evaluates every trophy from progress. Trophies are never stored. */
export function evaluateTrophies(cat: Catalog, p: Progress): TrophyEvaluation {
  const platDef = cat.trophies.find((t) => t.group === 'plat');
  const scored = cat.trophies.filter((t) => t !== platDef).map((t) => status(cat, t, p));
  const earned = scored.filter((t) => t.earned).length;
  const platinum = earned === scored.length;
  const list = platDef
    ? [
        {
          id: platDef.id,
          name: platDef.name,
          tier: platDef.tier,
          req: platDef.req,
          group: platDef.group,
          done: earned,
          total: scored.length,
          auto: platinum,
          over: false,
          earned: platinum,
          progText: `${earned} / ${scored.length}`,
        },
        ...scored,
      ]
    : scored;
  return { list, earned, scored: scored.length, platinum };
}

/** Trophies earned in `after` that weren't in `before`. */
export function newlyEarned(before: TrophyEvaluation, after: TrophyEvaluation): TrophyStatus[] {
  const was = new Set(before.list.filter((t) => t.earned).map((t) => t.id));
  return after.list.filter((t) => t.earned && !was.has(t.id));
}

/** Every item id a rule reads. */
export function ruleItemIds(cat: Pick<Catalog, 'sectionItems'>, rule: Rule, into: Set<string>): Set<string> {
  if ('all' in rule) rule.all.forEach((id) => into.add(id));
  else if ('item' in rule) into.add(rule.item);
  else if ('count' in rule) rule.count.forEach((id) => into.add(id));
  else if ('section' in rule) (cat.sectionItems[rule.section] ?? []).forEach((id) => into.add(id));
  else if ('and' in rule) rule.and.forEach((r) => ruleItemIds(cat, r, into));
  else if ('or' in rule) rule.or.forEach((r) => ruleItemIds(cat, r, into));
  return into;
}

export const TIER_NAMES: Readonly<Record<TrophyTier, string>> = {
  P: 'Platinum',
  G: 'Gold',
  S: 'Silver',
  B: 'Bronze',
};
