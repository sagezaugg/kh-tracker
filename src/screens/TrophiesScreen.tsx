import { useMemo } from 'react';
import { evaluateTrophies, TIER_NAMES, trophyOverrideId } from '../core/rules';
import type { TrophyTier } from '../core/types';
import { useGame, useProgress } from '../games/context';
import { FilterBar } from '../ui/FilterBar';
import { TrophyCard } from '../ui/TrophyCard';
import { useCheckToggle, useFilters } from '../ui/hooks';
import common from '../ui/common.module.css';
import { khwikiUrl } from '../ui/khwiki';
import styles from './TrophiesScreen.module.css';

const TIERS: readonly TrophyTier[] = ['P', 'G', 'S', 'B'];

interface TrophiesScreenProps {
  /** Game-specific explanation under the tier chips. */
  note: string;
}

/** Every trophy for the current game: tier chips, filter, hide earned, manual marks. */
export function TrophiesScreen({ note }: TrophiesScreenProps) {
  const { catalog, info } = useGame();
  const p = useProgress();
  const { list } = useMemo(() => evaluateTrophies(catalog, p), [catalog, p]);
  const { needle, hide } = useFilters();
  const toggle = useCheckToggle();
  const rows = list.filter(
    (t) => (!hide || !t.earned) && (!needle || `${t.name} ${t.req}`.toLowerCase().includes(needle)),
  );

  return (
    <>
      <FilterBar
        label="Filter trophies"
        placeholder="Filter trophies…"
        hideLabel="Hide earned"
        legend={false}
      />
      <ul className={styles.tiers} aria-label="Trophies by tier">
        {TIERS.map((k) => {
          const ts = list.filter((t) => t.tier === k);
          return (
            <li key={k} className={`${styles.tierChip} ${styles[`t${k}`]}`}>
              {TIER_NAMES[k]} {ts.filter((t) => t.earned).length}/{ts.length}
            </li>
          );
        })}
      </ul>
      <p className={common.note}>
        {note}{' '}
        <a href={khwikiUrl(info.trophies)} target="_blank" rel="noreferrer">
          Trophy list on KHWiki<span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
      <h2 className="sr-only">Trophy list</h2>
      <div className={styles.trs}>
        {rows.map((t) => (
          <TrophyCard key={t.id} t={t} onMark={() => toggle(trophyOverrideId(t.id))} />
        ))}
      </div>
      {rows.length === 0 && <p className={common.note}>Nothing to show here.</p>}
    </>
  );
}
