import { LOCATIONS, LOCATION_BY_ID, WORLD_BY_KEY, type LocationDef } from '../data/locations';
import {
  MATERIAL_BY_ID,
  MATERIALS,
  MOOGLE_LEVEL_NEEDED,
  ORICHALCUM_PLUS_SOURCES,
  SYN_KEYS,
  ULTIMA_RECIPE,
  ULTIMA_RECIPE_ENERGY,
  ULTIMATE_RECIPE_ITEM,
  type MaterialDef,
} from '../data/synthesis';
import { TROPHY_ITEM_SETS } from './items';
import { isOn } from './progress';
import { evaluateTrophies } from './rules';
import type { Progress } from './types';

export interface IngredientRow {
  mat: MaterialDef;
  need: number;
  have: number;
  enough: boolean;
  where: string;
}

export interface SourceRow {
  id: string;
  name: string;
  place: string;
  found: boolean;
  manual: boolean;
  worldRoute?: string;
  /** Unearned trophies this source also counts toward. */
  trophies: string[];
}

export interface UnopenedRow {
  loc: LocationDef;
  mat: MaterialDef;
}

export interface SynthesisView {
  energy: boolean;
  recipeFound: boolean;
  moogle: number;
  moogleOk: boolean;
  notes: number;
  ingredients: IngredientRow[];
  ready: number;
  short: string[];
  sources: SourceRow[];
  sourcesFound: number;
  unopened: UnopenedRow[];
}

/** Read a manual synthesis number (stored in Progress.values). */
export const synValue = (p: Progress, key: string): number => {
  const v = p.values[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

/** Material whose name appears in a location name; longest name first so Orichalcum+ beats Orichalcum. */
const MATS_LONGEST_FIRST = [...MATERIALS].sort((a, b) => b.name.length - a.name.length);
export function materialIn(name: string): MaterialDef | undefined {
  return MATS_LONGEST_FIRST.find((m) => name.includes(m.name));
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function computeSynthesis(p: Progress): SynthesisView {
  const energy = synValue(p, SYN_KEYS.energy) === 1;
  const recipe = energy ? ULTIMA_RECIPE_ENERGY : ULTIMA_RECIPE;
  const unearned = evaluateTrophies(p).list.filter((t) => !t.earned && t.id !== 'plat');

  const unopened: UnopenedRow[] = LOCATIONS.filter((l) => l.type === 'chest' && !isOn(p, l.id)).flatMap(
    (l) => {
      const mat = materialIn(l.name);
      return mat && (mat.id !== 'energy-crystal' || energy) ? [{ loc: l, mat }] : [];
    },
  );

  const sources: SourceRow[] = ORICHALCUM_PLUS_SOURCES.map((s) => {
    const loc = LOCATION_BY_ID.get(s.id);
    return {
      id: s.id,
      name: loc?.name ?? s.manualLabel ?? s.id,
      place: loc ? WORLD_BY_KEY[loc.world].name : (s.place ?? ''),
      found: isOn(p, s.id),
      manual: !loc,
      worldRoute: loc ? WORLD_BY_KEY[loc.world].routeId : undefined,
      trophies: unearned.filter((t) => TROPHY_ITEM_SETS.get(t.id)?.has(s.id)).map((t) => t.name),
    };
  });
  const sourcesFound = sources.filter((s) => s.found).length;

  const ingredients: IngredientRow[] = recipe.map(({ material, need }) => {
    const mat = MATERIAL_BY_ID[material];
    const have = synValue(p, SYN_KEYS.have(material));
    const enough = have >= need;
    let where = 'Enough';
    if (!enough) {
      if (material === 'orichalcum-plus') {
        where = `${plural(sources.length - sourcesFound, 'one-time source', 'one-time sources')} left (below)`;
      } else {
        const n = unopened.filter((u) => u.mat.id === material).length;
        where = n ? plural(n, 'unopened chest', 'unopened chests') : 'No unopened chests left';
      }
    }
    return { mat, need, have, enough, where };
  });

  const moogle = synValue(p, SYN_KEYS.moogle);
  return {
    energy,
    recipeFound: isOn(p, ULTIMATE_RECIPE_ITEM),
    moogle,
    moogleOk: moogle >= MOOGLE_LEVEL_NEEDED,
    notes: synValue(p, SYN_KEYS.notes),
    ingredients,
    ready: ingredients.filter((i) => i.enough).length,
    short: ingredients.filter((i) => !i.enough).map((i) => i.mat.name),
    sources,
    sourcesFound,
    unopened,
  };
}
