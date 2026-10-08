import { Link } from 'react-router-dom';
import { countOn } from '../core/progress';
import { useGameHref, useProgress } from '../games/context';
import styles from './WorldPicker.module.css';

/** The parts of a world the picker needs. */
export interface PickerWorld {
  key: string;
  routeId: string;
  name: string;
  locations: readonly { id: string }[];
}

interface WorldPickerProps {
  worlds: readonly PickerWorld[];
  current: PickerWorld;
  /** Query string to carry over (e.g. `?hide=1`). */
  search?: string;
}

/** Grid of world buttons with per-world completion. Each is a link to /worlds/:worldId. */
export function WorldPicker({ worlds, current, search = '' }: WorldPickerProps) {
  const p = useProgress();
  const href = useGameHref();
  return (
    <ul className={styles.wp} aria-label="Worlds">
      {worlds.map((w) => {
        const ids = w.locations.map((l) => l.id);
        const pct = ids.length ? Math.floor((countOn(p, ids) / ids.length) * 100) : 0;
        const sel = w.key === current.key;
        const cls = [styles.wb, sel && styles.sel, pct === 100 && styles.full].filter(Boolean).join(' ');
        return (
          <li key={w.key}>
            <Link
              className={cls}
              to={`${href(`worlds/${w.routeId}`)}${search}`}
              aria-current={sel ? 'page' : undefined}
            >
              <span>{w.name}</span>
              <span className={styles.wpct}>{pct}%</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
