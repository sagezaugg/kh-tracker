import { Link } from 'react-router-dom';
import type { WorldDef } from '../data/locations';
import { countOn } from '../model/progress';
import { useProgress } from '../state/store';
import styles from './WorldPicker.module.css';

interface WorldPickerProps {
  worlds: readonly WorldDef[];
  current: WorldDef;
  /** Query string to carry over (e.g. `?hide=1`). */
  search?: string;
}

/** Grid of world buttons with per-world completion. Each is a link to /worlds/:worldId. */
export function WorldPicker({ worlds, current, search = '' }: WorldPickerProps) {
  const p = useProgress();
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
              to={`/worlds/${w.routeId}${search}`}
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
