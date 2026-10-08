import type { Item } from '../../../core/types';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { Section } from '../../../ui/Section';
import { Stepper, StepperGrid } from '../../../ui/Stepper';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import { useProgress, useTracker } from '../../context';
import { KH1_JOURNAL } from '../data/journal';
import { valueOf } from '../model/catalog';
import { KH1_ITEM_BY_ID, KH1_SECTION_ITEMS } from '../model/items';

export function Kh1JournalRoute() {
  const { needle, hide } = useFilters();
  const p = useProgress();
  const setValue = useTracker((s) => s.setValue);
  return (
    <>
      <FilterBar />
      {KH1_JOURNAL.map((def) => {
        const counter = def.counter;
        if (def.kind === 'counter' && counter) {
          const item = KH1_ITEM_BY_ID.get(counter) as Item;
          const v = valueOf(p, counter);
          const max = item.max ?? 0;
          return (
            <Section key={def.id} title={def.name} count={`${v} / ${max}`} note={def.note}>
              <StepperGrid>
                <Stepper
                  name={item.name}
                  sub={item.probe ? 'Read from your save' : 'Counted by hand'}
                  value={v}
                  min={0}
                  max={max}
                  valueText={`${v} / ${max}`}
                  onChange={(n) => setValue(counter, n)}
                  big
                />
              </StepperGrid>
            </Section>
          );
        }
        const items = KH1_SECTION_ITEMS[def.id].map((id) => KH1_ITEM_BY_ID.get(id) as Item);
        return (
          <ItemSection
            key={def.id}
            title={def.name}
            note={def.note}
            rows={rowsOf(items)}
            needle={needle}
            hide={hide}
          />
        );
      })}
    </>
  );
}
