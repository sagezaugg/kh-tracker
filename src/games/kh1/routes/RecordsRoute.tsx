import { CustomGoals } from '../../../ui/CustomGoals';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection, type RowSpec } from '../../../ui/ItemSection';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import { CUPS, SUPERBOSSES } from '../data/constants';
import { KH1_LOCATION_BY_ID, locationId } from '../data/locations';
import { kh1ItemsIn } from '../model/items';

const auto = (id: string) => !!KH1_LOCATION_BY_ID.get(id)?.flag;

const BOSSES: RowSpec[] = SUPERBOSSES.map((b) => {
  const id = locationId(b.location);
  return { id, name: b.name, tag: b.where, auto: auto(id) };
});

const CUP_ROWS: RowSpec[] = CUPS.flatMap((c) =>
  ['', ' Solo', ' Time Trial'].map((suffix) => {
    const id = locationId(`Complete ${c}${suffix}`);
    return { id, name: suffix ? `${c}: ${suffix.trim()}` : c, auto: auto(id) };
  }),
);

const KEYHOLE_EVENTS: readonly (readonly [string, string])[] = [
  ['Deep Jungle', 'Deep Jungle Seal Keyhole Jungle King Event'],
  ['Agrabah', 'Agrabah Seal Keyhole Three Wishes Event'],
  ['Atlantica', 'Atlantica Seal Keyhole Crabclaw Event'],
  ['Halloween Town', 'Halloween Town Seal Keyhole Pumpkinhead Event'],
  ['Neverland', 'Neverland Seal Keyhole Fairy Harp Event'],
];
const MONSTRO = locationId('Monstro Defeat Parasite Cage II Stop Event');
const KEYHOLES: RowSpec[] = [
  ...KEYHOLE_EVENTS.map(([world, name]) => {
    const id = locationId(name);
    return { id, name: `${world} Keyhole sealed`, auto: auto(id) };
  }),
  { id: MONSTRO, name: 'Escaped from Monstro (Parasite Cage II beaten)', auto: auto(MONSTRO) },
  ...rowsOf(kh1ItemsIn('keyhole')),
];

export function Kh1RecordsRoute() {
  const { needle, hide } = useFilters();
  return (
    <>
      <FilterBar />
      <ItemSection
        title="Superbosses"
        note="Read from the save where the event flag is known. These are the same checks as on the world lists."
        rows={BOSSES}
        needle={needle}
        hide={hide}
      />
      <ItemSection
        title="Olympus Coliseum Cups"
        note="Cup wins aren't stored where the save can be read yet, so check them by hand."
        rows={CUP_ROWS}
        needle={needle}
        hide={hide}
      />
      <ItemSection
        title="Keyholes"
        note="Worlds with a flagged Seal Keyhole event fill in from the save; the rest are by hand."
        rows={KEYHOLES}
        needle={needle}
        hide={hide}
      />
      <ItemSection title="Gummi Ship" rows={rowsOf(kh1ItemsIn('gummi'))} needle={needle} hide={hide} />
      <ItemSection title="Feats" rows={rowsOf(kh1ItemsIn('feat'))} needle={needle} hide={hide} />
      <ItemSection
        title="Torn Pages"
        note="Whether the save counts pages held or delivered isn't confirmed, so these are by hand."
        rows={rowsOf(kh1ItemsIn('torn-page'))}
        needle={needle}
        hide={hide}
      />
      <CustomGoals needle={needle} hide={hide} />
    </>
  );
}
