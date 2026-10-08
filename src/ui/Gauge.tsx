import { ProgressBar } from './ProgressBar';
import styles from './Gauge.module.css';

interface GaugeProps {
  label: string;
  value: string;
  pct: number;
  sub: string;
  selected: boolean;
  onPick: () => void;
}

/** One of the three profile gauges on Status. Selecting it sets the active profile. */
export function Gauge({ label, value, pct, sub, selected, onPick }: GaugeProps) {
  return (
    <button
      type="button"
      className={selected ? `${styles.gauge} ${styles.sel}` : styles.gauge}
      aria-pressed={selected}
      onClick={onPick}
    >
      <span className={styles.gL}>{label}</span>
      <span className={styles.gV}>{value}</span>
      <ProgressBar pct={pct} variant="gauge" />
      <span className={styles.gS}>{sub}</span>
    </button>
  );
}
