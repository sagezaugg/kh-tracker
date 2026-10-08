import { useState } from 'react';
import { itemsIn } from '../model/items';
import { useProgress, useTracker } from '../../context';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { Section } from '../../../ui/Section';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import common from '../../../ui/common.module.css';

const GROUPS = [
  {
    title: 'Absent Silhouettes',
    rows: rowsOf(itemsIn('absent-silhouette')),
    note: 'Not a trophy: only the Data versions count toward To Rule Them All.',
  },
  {
    title: 'Data Organization XIII',
    rows: rowsOf(itemsIn('data-org')),
    note: 'The save has no known flag for five of these, so mark them by hand.',
  },
  { title: 'Superbosses', rows: rowsOf(itemsIn('superboss')) },
  { title: 'Coliseum Cups', rows: rowsOf(itemsIn('cup')) },
  { title: 'Mushroom XIII', rows: rowsOf(itemsIn('mushroom')) },
  { title: 'Feats', rows: rowsOf(itemsIn('feat')) },
  { title: 'Gummi Ship', rows: rowsOf(itemsIn('gummi')) },
  { title: 'Extras', rows: rowsOf(itemsIn('extra')) },
];

export function RecordsRoute() {
  const { needle, hide } = useFilters();
  const custom = useProgress().custom;
  const addCustom = useTracker((s) => s.addCustom);
  const removeCustom = useTracker((s) => s.removeCustom);
  const [text, setText] = useState('');

  const customRows = custom.map((g) => ({ id: g.id, name: g.t, onDelete: () => removeCustom(g.id) }));
  const add = () => {
    if (!text.trim()) return;
    addCustom(text);
    setText('');
  };

  return (
    <>
      <FilterBar />
      {GROUPS.map((g) => (
        <ItemSection key={g.title} title={g.title} note={g.note} rows={g.rows} needle={needle} hide={hide} />
      ))}
      <ItemSection title="Your goals" rows={customRows} needle={needle} hide={hide} />
      <Section title="Add a goal">
        <p className={common.note}>
          Add anything else you count toward your 100%, like a no-damage run. Custom goals count toward
          Everything.
        </p>
        <form
          className={common.addrow}
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className={common.searchLabel} style={{ flexBasis: 260 }}>
            <span className="sr-only">New goal</span>
            <input
              className={common.search}
              type="text"
              placeholder="e.g. S-rank every Gummi route"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
            />
          </label>
          <button type="submit" className={`${common.pill} ${common.blue}`} disabled={!text.trim()}>
            Add goal
          </button>
        </form>
      </Section>
    </>
  );
}
