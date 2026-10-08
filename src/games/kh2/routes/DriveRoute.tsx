import { ANTI_FORM_MAX, FORMS, MAGIC } from '../data/constants';
import { itemsIn } from '../model/items';
import { valueOf } from '../model/catalog';
import { useProgress, useTracker } from '../../context';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { Section } from '../../../ui/Section';
import { Stepper, StepperGrid } from '../../../ui/Stepper';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';

const CHARMS = rowsOf(itemsIn('charm'));
const KEY_ITEMS = rowsOf([...itemsIn('proof'), ...itemsIn('torn-page')]);

export function DriveRoute() {
  const p = useProgress();
  const setValue = useTracker((s) => s.setValue);
  const { needle, hide } = useFilters();
  const v = (key: string) => valueOf(p, `lv.${key}`);
  const set = (key: string) => (n: number) => setValue(`lv.${key}`, n);

  const sora = v('sora');
  const summon = v('summon');
  const anti = Math.min(v('anti'), ANTI_FORM_MAX);
  const formSum = FORMS.reduce((a, f) => a + v(f.key), 0);
  const magSum = MAGIC.reduce((a, m) => a + v(m.key), 0);

  return (
    <>
      <Section title="Sora" count={`LV ${sora} / 99`}>
        <StepperGrid>
          <Stepper
            name="Sora"
            sub="Level"
            value={sora}
            min={1}
            max={99}
            valueText={`LV ${sora}`}
            onChange={set('sora')}
            big
          />
        </StepperGrid>
      </Section>
      <Section title="Drive Forms" count={`${formSum} / 35`}>
        <StepperGrid>
          {FORMS.map((f) => {
            const n = v(f.key);
            return (
              <Stepper
                key={f.key}
                name={f.name}
                sub={n ? `Level ${n}` : 'Not obtained'}
                value={n}
                min={0}
                max={7}
                valueText={n ? `LV ${n}` : '—'}
                onChange={set(f.key)}
                pips
              />
            );
          })}
        </StepperGrid>
      </Section>
      <Section title="Summons" count={`LV ${summon} / 7`}>
        <StepperGrid>
          <Stepper
            name="Summon level"
            sub="Shared by all summons"
            value={summon}
            min={1}
            max={7}
            valueText={`LV ${summon}`}
            onChange={set('summon')}
            pips
          />
        </StepperGrid>
      </Section>
      <Section title="Magic" count={`${magSum} / 18`}>
        <StepperGrid>
          {MAGIC.map((m) => {
            const n = v(m.key);
            return (
              <Stepper
                key={m.key}
                name={m.tiers[0]}
                sub={n ? m.tiers[n - 1] : 'Not learned'}
                value={n}
                min={0}
                max={3}
                valueText={n ? `LV ${n}` : '—'}
                onChange={set(m.key)}
                pips
              />
            );
          })}
        </StepperGrid>
      </Section>
      <Section title="Anti Form" count={`${anti} / ${ANTI_FORM_MAX}`}>
        <StepperGrid>
          <Stepper
            name="Anti Form transformations"
            sub="For Corroded by Darkness"
            value={anti}
            min={0}
            max={ANTI_FORM_MAX}
            valueText={`${anti} / ${ANTI_FORM_MAX}`}
            onChange={set('anti')}
          />
        </StepperGrid>
      </Section>
      <FilterBar />
      <ItemSection title="Summon Charms" rows={CHARMS} needle={needle} hide={hide} />
      <ItemSection title="Key Items" rows={KEY_ITEMS} needle={needle} hide={hide} />
    </>
  );
}
