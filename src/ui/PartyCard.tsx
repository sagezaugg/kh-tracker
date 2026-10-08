import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';
import styles from './PartyCard.module.css';

interface PartyCardProps {
  name: string;
  done: number;
  total: number;
  to: string;
  screen: string;
}

/** KH2 party-member-style category card: LV is the percent, HP the count, LEFT what remains. */
export function PartyCard({ name, done, total, to, screen }: PartyCardProps) {
  const pct = total ? Math.floor((done / total) * 100) : 0;
  return (
    <Link className={styles.pc} to={to} aria-label={`${name}: ${done} of ${total}, open ${screen}`}>
      <span className={styles.pcN}>{name}</span>
      <span className={styles.pcB}>
        <span className={styles.ln}>
          <span className={styles.lv}>LV</span>
          <span>{pct}%</span>
        </span>
        <span className={styles.ln}>
          <span className={styles.hp}>HP</span>
          <span>
            {done}/{total}
          </span>
        </span>
        <ProgressBar pct={pct} variant="party" />
        <span className={styles.ln}>
          <span className={styles.mp}>LEFT</span>
          <span>{total - done}</span>
        </span>
      </span>
    </Link>
  );
}
