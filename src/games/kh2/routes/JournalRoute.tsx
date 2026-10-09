import { Link } from 'react-router';
import { JOURNAL } from '../data/journal';
import { ITEM_BY_ID, SECTION_ITEMS } from '../model/items';
import type { Item } from '../../../core/types';
import { useScores } from '../hooks';
import { useGameHref } from '../../context';
import { FilterBar } from '../../../ui/FilterBar';
import { ItemSection } from '../../../ui/ItemSection';
import { Section } from '../../../ui/Section';
import { useFilters } from '../../../ui/hooks';
import { rowsOf } from '../../../ui/rows';
import common from '../../../ui/common.module.css';

export function JournalRoute() {
  const { needle, hide } = useFilters();
  const { sections } = useScores();
  const href = useGameHref();
  return (
    <>
      <FilterBar />
      {JOURNAL.map((def) => {
        if (def.kind === 'summary') {
          const s = sections.find((x) => x.def.id === def.id);
          const done = s?.done ?? 0;
          const total = s?.total ?? 0;
          return (
            <Section key={def.id} title={def.name} count={`${done} / ${total}`}>
              <p className={common.note}>
                Treasures are tracked world by world. {done} of {total} chests found.
              </p>
              <Link className={`${common.pill} ${common.blue}`} to={href('worlds')}>
                Open Worlds
              </Link>
            </Section>
          );
        }
        const items = SECTION_ITEMS[def.id].map((id) => ITEM_BY_ID.get(id) as Item);
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
