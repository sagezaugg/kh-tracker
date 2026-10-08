import { CupIcon } from './CupIcon';
import styles from './HelpBar.module.css';

interface HelpBarProps {
  text: string;
  trophy?: boolean;
}

/** The blue bar along the bottom. Its text follows hover and focus, and turns gold for trophies. */
export function HelpBar({ text, trophy = false }: HelpBarProps) {
  return (
    <div
      className={trophy ? `${styles.help} ${styles.trophy}` : styles.help}
      role="status"
      aria-live="polite"
    >
      {trophy && <CupIcon key={`cup:${text}`} className={styles.cup} />}
      <p key={trophy ? `text:${text}` : undefined}>{text}</p>
    </div>
  );
}
