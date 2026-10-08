import { TIER_NAMES, trophyOverrideId, type TrophyTier } from '../data/trophies';
import { useScores } from '../state/store';
import { FilterBar } from '../ui/FilterBar';
import { TrophyCard } from '../ui/TrophyCard';
import { useCheckToggle, useFilters } from '../ui/hooks';
import common from '../ui/common.module.css';
import styles from './TrophiesRoute.module.css';

const TIERS: readonly TrophyTier[] = ['P', 'G', 'S', 'B'];

export function TrophiesRoute() {
  const { list } = useScores().trophies;
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
        Most trophies unlock from your checklist and save imports. If you&apos;ve earned one the tracker
        can&apos;t see, mark it by hand. The world trophies use each world&apos;s last story boss as the
        trigger.
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
