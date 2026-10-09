import type { ReactNode } from 'react';
import { InfoButton } from './InfoButton';
import styles from './Stepper.module.css';

interface StepperProps {
  name: string;
  sub: string;
  value: number;
  min: number;
  max: number;
  valueText: string;
  onChange: (v: number) => void;
  /** Show pips, one per level. */
  pips?: boolean;
  /** Add ±10 buttons (Sora's level). */
  big?: boolean;
  /** Decorative icon beside the name. */
  icon?: ReactNode;
  /** Item id whose how-to-obtain note gets an (i) button, if it has one. */
  infoId?: string;
}

/** A level stepper with optional pip gauge, as on the Drive & Magic screen. */
export function Stepper({
  name,
  sub,
  value,
  min,
  max,
  valueText,
  onChange,
  pips,
  big,
  icon,
  infoId,
}: StepperProps) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className={styles.stp} role="group" aria-label={name}>
      <div className={styles.stpH}>
        {icon}
        <div className={styles.stpN}>
          <b>{name}</b>
          <span>{sub}</span>
        </div>
        {infoId && <InfoButton id={infoId} name={name} />}
      </div>
      <div className={styles.stpC}>
        {big && (
          <button
            type="button"
            className={`${styles.sb} ${styles.sm}`}
            onClick={() => set(value - 10)}
            disabled={value <= min}
            aria-label="Lower level by 10"
          >
            −10
          </button>
        )}
        <button
          type="button"
          className={styles.sb}
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`Lower ${name}`}
        >
          −
        </button>
        {pips && (
          <span className={styles.pips} aria-hidden="true">
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={i < value ? `${styles.pip} ${styles.on}` : styles.pip} />
            ))}
          </span>
        )}
        <output className={styles.stpV} aria-live="polite">
          {valueText}
        </output>
        <button
          type="button"
          className={styles.sb}
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Raise ${name}`}
        >
          +
        </button>
        {big && (
          <button
            type="button"
            className={`${styles.sb} ${styles.sm}`}
            onClick={() => set(value + 10)}
            disabled={value >= max}
            aria-label="Raise level by 10"
          >
            +10
          </button>
        )}
      </div>
    </div>
  );
}

export function StepperGrid({ children }: { children: ReactNode }) {
  return <div className={styles.stps}>{children}</div>;
}
