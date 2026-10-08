import type { Item } from '../../../core/types';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { ProgressBar } from '../../../ui/ProgressBar';
import { Section } from '../../../ui/Section';
import { Stepper, StepperGrid } from '../../../ui/Stepper';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import common from '../../../ui/common.module.css';
import { useProgress, useTracker } from '../../context';
import {
  KH1_ULTIMA_RECIPE,
  materialId,
  SYNTHESIS_ITEM_COUNT,
  SYNTHESIS_LISTS,
  synthesisId,
} from '../data/synthesis';
import { countOn, valueOf } from '../model/catalog';
import { KH1_ITEM_BY_ID } from '../model/items';

export function Kh1SynthesisRoute() {
  const p = useProgress();
  const setValue = useTracker((s) => s.setValue);
  const { needle, hide } = useFilters();
  const ready = KH1_ULTIMA_RECIPE.filter((m) => valueOf(p, materialId(m.itemId)) >= m.need).length;
  const made = countOn(
    p,
    SYNTHESIS_LISTS.flatMap((l) => l.items.map(synthesisId)),
  );
  const short = KH1_ULTIMA_RECIPE.filter((m) => valueOf(p, materialId(m.itemId)) < m.need).map((m) => m.name);

  return (
    <>
      <section className={common.card} aria-labelledby="kh1-ultima">
        <h2 className={common.cardT} id="kh1-ultima">
          Ultima Weapon
        </h2>
        <p className={common.note}>
          Final Mix recipe, on synthesis List VI (unlocked after making all 30 items on Lists I–V).{' '}
          {short.length ? `Short on ${short.join(', ')}.` : 'You have every material.'}
        </p>
        <p className={common.showing}>
          <b>{ready}</b> of {KH1_ULTIMA_RECIPE.length} materials ready
        </p>
        <ProgressBar pct={Math.floor((ready / KH1_ULTIMA_RECIPE.length) * 100)} variant="gauge" />
        <div style={{ marginTop: 12 }}>
          <StepperGrid>
            {KH1_ULTIMA_RECIPE.map((m) => {
              const id = materialId(m.itemId);
              const v = valueOf(p, id);
              return (
                <Stepper
                  key={id}
                  name={m.name}
                  sub={`Need ${m.need} · read from your inventory`}
                  value={v}
                  min={0}
                  max={(KH1_ITEM_BY_ID.get(id) as Item).max ?? 99}
                  valueText={`${v} / ${m.need}`}
                  onChange={(n) => setValue(id, n)}
                />
              );
            })}
          </StepperGrid>
        </div>
      </section>

      <Section
        title="Synthesis items"
        count={`${made} / ${SYNTHESIS_ITEM_COUNT}`}
        note="Check each item once you've made it. The save's synthesis record isn't mapped yet, so these are by hand. Synthesis trophies unlock at 1, 3, 15, 30 and all 33."
      />
      <FilterBar />
      {SYNTHESIS_LISTS.map((l) => (
        <ItemSection
          key={l.list}
          title={l.list}
          note={l.unlock}
          rows={rowsOf(l.items.map((n) => KH1_ITEM_BY_ID.get(synthesisId(n)) as Item))}
          needle={needle}
          hide={hide}
        />
      ))}
    </>
  );
}
