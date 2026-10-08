import { CupIcon } from './CupIcon';
import styles from './HelpBar.module.css';

interface HelpBarProps {
  text: string;
  trophy?: boolean;
  /** Text to announce to screen readers (toasts). Hover hints are shown but not announced. */
  announce?: string | null;
}

/** The blue bar along the bottom. Its text follows hover and focus, and turns gold for trophies. */
export function HelpBar({ text, trophy = false, announce = null }: HelpBarProps) {
  return (
    <aside className={trophy ? `${styles.help} ${styles.trophy}` : styles.help} aria-label="Help">
      {trophy && <CupIcon key={`cup:${text}`} className={styles.cup} />}
      <p key={trophy ? `text:${text}` : undefined}>{text}</p>
      <span className="sr-only" role="status" aria-live="polite">
        {announce ?? ''}
      </span>
    </aside>
  );
}
