import type { ReactNode } from 'react';
import styles from './Section.module.css';
import common from './common.module.css';

interface SectionProps {
  title: string;
  /** Right-aligned count, e.g. "3 / 13". */
  count?: string;
  note?: string;
  children?: ReactNode;
  /** Optional extra marker after the title (NEW!). */
  badge?: ReactNode;
}

/** An orange italic section heading with a count, an optional note and its content. */
export function Section({ title, count, note, children, badge }: SectionProps) {
  return (
    <section className={styles.sec}>
      <div className={styles.secHead}>
        <h2 className={styles.secT}>
          {title}
          {badge}
        </h2>
        {count !== undefined && <span className={styles.secC}>{count}</span>}
      </div>
      {note && <p className={common.note}>{note}</p>}
      {children}
    </section>
  );
}
