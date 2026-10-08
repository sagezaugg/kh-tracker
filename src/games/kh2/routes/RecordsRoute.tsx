import { itemsIn } from '../model/items';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { CustomGoals } from '../../../ui/CustomGoals';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';

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
  return (
    <>
      <FilterBar />
      {GROUPS.map((g) => (
        <ItemSection key={g.title} title={g.title} note={g.note} rows={g.rows} needle={needle} hide={hide} />
      ))}
      <CustomGoals needle={needle} hide={hide} />
    </>
  );
}
