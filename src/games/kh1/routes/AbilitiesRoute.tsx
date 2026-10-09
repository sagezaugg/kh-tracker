import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { Section } from '../../../ui/Section';
import { ItemIcon } from '../../../ui/GameImage';
import { Stepper, StepperGrid } from '../../../ui/Stepper';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import { useProgress, useTracker } from '../../context';
import { MAGIC } from '../data/constants';
import { valueOf } from '../model/catalog';
import { kh1ItemsIn } from '../model/items';

const SUMMONS = rowsOf(kh1ItemsIn('summon'));

export function Kh1AbilitiesRoute() {
  const p = useProgress();
  const setValue = useTracker((s) => s.setValue);
  const { needle, hide } = useFilters();
  const sora = valueOf(p, 'lv.sora');
  const magSum = MAGIC.reduce((a, m) => a + valueOf(p, `lv.${m.key}`), 0);
  return (
    <>
      <Section title="Sora" count={`LV ${sora} / 100`}>
        <StepperGrid>
          <Stepper
            name="Sora"
            sub="Level"
            value={sora}
            min={1}
            max={100}
            valueText={`LV ${sora}`}
            onChange={(n) => setValue('lv.sora', n)}
            big
          />
        </StepperGrid>
      </Section>
      <Section title="Magic" count={`${magSum} / ${MAGIC.length * 3}`}>
        <StepperGrid>
          {MAGIC.map((m) => {
            const n = valueOf(p, `lv.${m.key}`);
            return (
              <Stepper
                key={m.key}
                name={m.tiers[0]}
                sub={n ? m.tiers[n - 1] : 'Not learned'}
                value={n}
                min={0}
                max={3}
                valueText={n ? `LV ${n}` : '—'}
                onChange={(v) => setValue(`lv.${m.key}`, v)}
                pips
                icon={<ItemIcon id={`lv.${m.key}`} size={40} />}
              />
            );
          })}
        </StepperGrid>
      </Section>
      <FilterBar />
      <ItemSection title="Summons" rows={SUMMONS} needle={needle} hide={hide} />
    </>
  );
}
