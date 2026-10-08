import styles from './Segmented.module.css';

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
}

/** A pill of mutually exclusive toggle buttons with a visible label. */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className={styles.ctl}>
      <span className={styles.ctlL} aria-hidden="true">
        {label}
      </span>
      <div className={styles.seg} role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            className={v === value ? `${styles.opt} ${styles.on}` : styles.opt}
            aria-pressed={v === value}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
