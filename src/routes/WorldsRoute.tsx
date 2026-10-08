import { useParams, useSearchParams } from 'react-router-dom';
import { WORLD_SHORT } from '../data/constants';
import { worldByRouteId, WORLDS, type LocationType } from '../data/locations';
import { ITEM_BY_ID } from '../model/items';
import type { Item } from '../model/types';
import { useTracker } from '../state/store';
import { FilterBar } from '../ui/FilterBar';
import { ItemSection } from '../ui/ItemSection';
import { WorldPicker } from '../ui/WorldPicker';
import { useFilters } from '../ui/hooks';
import { rowsOf } from '../ui/rows';
import common from '../ui/common.module.css';
import { NotFoundRoute } from './NotFoundRoute';

const SECTIONS: readonly (readonly [LocationType, string, string?])[] = [
  ['boss', 'Story Bosses'],
  ['chest', 'Treasures'],
  ['reward', 'Rewards', 'Maps, Keyblades, abilities and other items handed out by events.'],
];

export function WorldsRoute() {
  const { worldId } = useParams();
  const [params] = useSearchParams();
  const { needle, hide } = useFilters();
  const setChecks = useTracker((s) => s.setChecks);
  const world = worldId ? worldByRouteId(worldId) : undefined;
  if (!world) return <NotFoundRoute />;

  const short = WORLD_SHORT[world.key];
  const ids = world.locations.map((l) => l.id);
  const keep = params.get('hide') === '1' ? '?hide=1' : '';
  const itemsOf = (t: LocationType) =>
    world.locations.filter((l) => l.type === t).map((l) => ITEM_BY_ID.get(l.id) as Item);

  return (
    <>
      <WorldPicker worlds={WORLDS} current={world} search={keep} />
      <div className={common.tools}>
        <button
          type="button"
          className={`${common.pill} ${common.blue}`}
          onClick={() => setChecks(ids, true)}
        >
          Check all in {short}
        </button>
        <button type="button" className={common.pill} onClick={() => setChecks(ids, false)}>
          Clear {short}
        </button>
      </div>
      <FilterBar />
      <h2 className="sr-only">{world.name}</h2>
      {SECTIONS.map(([t, title, note]) => {
        const items = itemsOf(t);
        if (!items.length) return null;
        return (
          <ItemSection key={t} title={title} note={note} rows={rowsOf(items)} needle={needle} hide={hide} />
        );
      })}
    </>
  );
}
