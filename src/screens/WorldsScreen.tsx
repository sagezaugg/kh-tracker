import { useParams, useSearchParams } from 'react-router';
import type { Item } from '../core/types';
import { useGame, useTracker } from '../games/context';
import { NotFoundRoute } from '../shell/NotFoundRoute';
import { FilterBar } from '../ui/FilterBar';
import { ItemSection } from '../ui/ItemSection';
import { WorldPicker, type PickerWorld } from '../ui/WorldPicker';
import { useFilters } from '../ui/hooks';
import { rowsOf } from '../ui/rows';
import common from '../ui/common.module.css';
import { GameImage } from '../ui/GameImage';
import styles from './WorldsScreen.module.css';

export interface ScreenWorld extends PickerWorld {
  locations: readonly { id: string; type: string }[];
}

interface WorldsScreenProps {
  worlds: readonly ScreenWorld[];
  /** [location type, section title, optional note], in display order. */
  sections: readonly (readonly [string, string, string?])[];
  /** Short name for the "Check all in …" buttons. */
  short: (w: ScreenWorld) => string;
}

/** World picker plus the selected world's checklist sections, for any game. */
export function WorldsScreen({ worlds, sections, short }: WorldsScreenProps) {
  const { worldId } = useParams();
  const [params] = useSearchParams();
  const { needle, hide } = useFilters();
  const { catalog, icons } = useGame();
  const setChecks = useTracker((s) => s.setChecks);
  const world = worlds.find((w) => w.routeId === worldId);
  if (!world) return <NotFoundRoute />;

  const ids = world.locations.map((l) => l.id);
  const keep = params.get('hide') === '1' ? '?hide=1' : '';
  const label = short(world);
  const logo = icons.worlds[world.key];
  const itemsOf = (t: string) =>
    world.locations.filter((l) => l.type === t).map((l) => catalog.itemById.get(l.id) as Item);

  return (
    <>
      <WorldPicker worlds={worlds} current={world} search={keep} />
      <div className={common.tools}>
        <button
          type="button"
          className={`${common.pill} ${common.blue}`}
          onClick={() => setChecks(ids, true)}
        >
          Check all in {label}
        </button>
        <button type="button" className={common.pill} onClick={() => setChecks(ids, false)}>
          Clear {label}
        </button>
      </div>
      <FilterBar />
      <h2 className={styles.head}>
        {logo && <GameImage src={logo[0]} width={logo[1]} height={logo[2]} className={styles.logo} />}
        <span className={logo ? 'sr-only' : undefined}>{world.name}</span>
      </h2>
      {sections.map(([t, title, note]) => {
        const items = itemsOf(t);
        if (!items.length) return null;
        return (
          <ItemSection key={t} title={title} note={note} rows={rowsOf(items)} needle={needle} hide={hide} />
        );
      })}
    </>
  );
}
