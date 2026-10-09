import { TIER_NAMES } from '../core/rules';
import { useContext } from 'react';
import type { TrophyStatus } from '../core/types';
import { useUi } from '../core/ui';
import { GameContext } from '../games/context';
import { CupIcon } from './CupIcon';
import { GameImage } from './GameImage';
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
  const art = useContext(GameContext)?.icons.trophies[t.id];
  return (
    <article
      className={[styles.tr, t.earned && styles.got, t.earned && pop && styles.pop].filter(Boolean).join(' ')}
    >
      {art ? (
        <GameImage src={art} width={52} height={52} className={styles.art} />
      ) : (
        <CupIcon className={`${styles.cup} ${tierCls}`} />
      )}
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
