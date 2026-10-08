import { NavLink } from 'react-router-dom';
import { NAV, type NavKey } from '../routes/nav';
import { useUi } from '../state/ui';
import { HandCursor } from './HandCursor';
import { NewTag } from './NewTag';
import styles from './CommandMenu.module.css';

interface CommandMenuProps {
  /** Menu entries that should show NEW! (hidden on the active entry). */
  news?: Partial<Record<NavKey, boolean>>;
  onVisit?: (key: NavKey) => void;
}

/** The gray pill command list. The active route drives the selected outline and the hand. */
export function CommandMenu({ news = {}, onVisit }: CommandMenuProps) {
  const setHint = useUi((s) => s.setHint);
  return (
    <ul className={styles.cmdlist}>
      {NAV.map((n) => (
        <li key={n.key} className={styles.item}>
          <NavLink
            to={n.path}
            end={n.path === '/'}
            className={({ isActive }) => (isActive ? `${styles.cmd} ${styles.sel}` : styles.cmd)}
            onClick={() => onVisit?.(n.key)}
            onMouseEnter={() => setHint(n.help)}
            onMouseLeave={() => setHint(null)}
            onFocus={() => setHint(n.help)}
            onBlur={() => setHint(null)}
          >
            {({ isActive }) => (
              <>
                <HandCursor className={styles.hand} />
                <span>{n.label}</span>
                {news[n.key] && !isActive && <NewTag />}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
