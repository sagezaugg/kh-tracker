import { TIER_NAMES } from '../data/trophies';
import type { TrophyStatus } from '../model/rules';
import { useUi } from '../state/ui';
import { CupIcon } from './CupIcon';
import { ProgressBar } from './ProgressBar';
import common from './common.module.css';
import styles from './TrophyCard.module.css';

interface TrophyCardProps {
  t: TrophyStatus;
  onMark?: () => void;
}

/** Trophy card: cup, tier, requirement, progress bar, EARNED stamp and the manual mark button. */
export function TrophyCard({ t, onMark }: TrophyCardProps) {
  const pop = useUi((s) => s.pop === `tro.${t.id}`);
  const canMark = t.id !== 'plat' && !t.auto;
  const pct = t.total ? Math.floor((Math.min(t.done, t.total) / t.total) * 100) : 0;
  const tierCls = styles[`t${t.tier}`];
  return (
    <article
      className={[styles.tr, t.earned && styles.got, t.earned && pop && styles.pop].filter(Boolean).join(' ')}
    >
      <CupIcon className={`${styles.cup} ${tierCls}`} />
      <div className={styles.trB}>
        <div className={styles.trTop}>
          <h3 className={styles.name}>{t.name}</h3>
          <span className={`${styles.tier} ${tierCls}`}>{TIER_NAMES[t.tier]}</span>
        </div>
        <p className={styles.trReq}>{t.req}</p>
        <div className={styles.trProg}>
          <ProgressBar pct={pct} variant="trophy" />
          <span>{t.progText}</span>
        </div>
      </div>
      <div className={styles.trS}>
        {t.earned && <span className={styles.earned}>EARNED</span>}
        {canMark && onMark && (
          <button
            type="button"
            className={`${common.pill} ${common.sm}`}
            onClick={onMark}
            aria-label={(t.over ? 'Unmark ' : 'Mark earned: ') + t.name}
          >
            {t.over ? 'Unmark' : 'Mark earned'}
          </button>
        )}
      </div>
    </article>
  );
}
