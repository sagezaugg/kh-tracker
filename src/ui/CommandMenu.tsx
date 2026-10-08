import { NavLink } from 'react-router-dom';
import { useUi } from '../core/ui';
import { navHref, useGame } from '../games/context';
import { HandCursor } from './HandCursor';
import { NewTag } from './NewTag';
import styles from './CommandMenu.module.css';

interface CommandMenuProps {
  /** Menu entries that should show NEW! (hidden on the active entry). */
  news?: Record<string, boolean>;
  onVisit?: (key: string) => void;
}

/** The gray pill command list. The active route drives the selected outline and the hand. */
export function CommandMenu({ news = {}, onVisit }: CommandMenuProps) {
  const setHint = useUi((s) => s.setHint);
  const game = useGame();
  return (
    <ul className={styles.cmdlist}>
      {game.nav.map((n) => (
        <li key={n.key} className={styles.item}>
          <NavLink
            to={navHref(game, n)}
            end={n.path === ''}
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
