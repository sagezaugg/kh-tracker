import type { ReactNode } from 'react';
import { useUi } from '../state/ui';
import styles from './ChecklistRow.module.css';
import common from './common.module.css';

interface ChecklistRowProps {
  id: string;
  name: string;
  on: boolean;
  tag?: string;
  /** Filled in by save imports: shows the green dot. */
  auto?: boolean;
  onToggle: (id: string) => void;
  onDelete?: () => void;
}

/** A diamond checkbox row. Pops with a ring and sparks when checked by hand. */
export function ChecklistRow({ id, name, on, tag, auto, onToggle, onDelete }: ChecklistRowProps) {
  const pop = useUi((s) => s.pop === id);
  const cls = [styles.row, on && styles.on, on && pop && styles.pop].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <label className={styles.lab}>
        <input type="checkbox" checked={on} onChange={() => onToggle(id)} />
        <span className={styles.box} aria-hidden="true" />
        <span className={styles.nm}>{name}</span>
        {tag && <span className={styles.tag}>{tag}</span>}
        {auto && (
          <span className={common.autoDot} title="Detected from save files">
            <span className="sr-only">(detected from save files)</span>
          </span>
        )}
      </label>
      {onDelete && (
        <button
          type="button"
          className={styles.x}
          onClick={onDelete}
          aria-label={`Remove this goal: ${name}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ChecklistRows({ children }: { children: ReactNode }) {
  return <div className={styles.rows}>{children}</div>;
}
