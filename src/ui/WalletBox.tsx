import styles from './WalletBox.module.css';

interface WalletBoxProps {
  munny: string;
  lv: number;
  totalLabel: string;
  total: string;
}

/** The MUNNY / LV / TOTAL box under the command menu. */
export function WalletBox({ munny, lv, totalLabel, total }: WalletBoxProps) {
  return (
    <dl className={styles.wal}>
      <dt className={`${styles.label} ${styles.m}`}>MUNNY</dt>
      <dd className={styles.value}>{munny}</dd>
      <dt className={`${styles.label} ${styles.t}`}>LV</dt>
      <dd className={`${styles.value} ${styles.vt}`}>{lv}</dd>
      <dt className={`${styles.label} ${styles.t}`}>{totalLabel}</dt>
      <dd className={`${styles.value} ${styles.vt}`}>{total}</dd>
    </dl>
  );
}
