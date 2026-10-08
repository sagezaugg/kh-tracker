import { itemsIn } from '../model/items';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';

const ROWS = rowsOf(itemsIn('keyblade'));

export function KeybladesRoute() {
  const { needle, hide } = useFilters();
  return (
    <>
      <FilterBar />
      <ItemSection
        title="Keyblades"
        note="A Keyblade counts if it is in your inventory or equipped by Sora or a Drive Form."
        rows={ROWS}
        needle={needle}
        hide={hide}
      />
    </>
  );
}
