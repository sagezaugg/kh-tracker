import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import { kh1ItemsIn } from '../model/items';

const KEYBLADES = rowsOf(kh1ItemsIn('keyblade'));
const STAVES = rowsOf(kh1ItemsIn('staff'));
const SHIELDS = rowsOf(kh1ItemsIn('shield'));

export function Kh1EquipmentRoute() {
  const { needle, hide } = useFilters();
  return (
    <>
      <FilterBar />
      <ItemSection
        title="Keyblades"
        note="A Keyblade counts if it's in the inventory or equipped by Sora. The Dream Sword, Shield and Rod (Dive into the Heart) and the Wooden Sword aren't listed."
        rows={KEYBLADES}
        needle={needle}
        hide={hide}
      />
      <ItemSection
        title="Staves"
        note="Read from the inventory, so a staff Donald has equipped may not show. Which staves Master Magician needs isn't confirmed, so mark that trophy by hand."
        rows={STAVES}
        needle={needle}
        hide={hide}
      />
      <ItemSection
        title="Shields"
        note="Read from the inventory, so a shield Goofy has equipped may not show. Which shields Master Defender needs isn't confirmed, so mark that trophy by hand."
        rows={SHIELDS}
        needle={needle}
        hide={hide}
      />
    </>
  );
}
