import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  pct: number;
  variant: 'gauge' | 'party' | 'trophy' | 'overview';
}

/** Animated-width progress bar in one of the prototype's four styles. Decorative: text carries the value. */
export function ProgressBar({ pct, variant }: ProgressBarProps) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <span className={`${styles.bar} ${styles[variant]}`} aria-hidden="true">
      <span style={{ width: `${w}%` }} />
    </span>
  );
}
