import { Link, useLocation } from 'react-router-dom';
import { GAMES } from '../games/registry';
import type { GameDefinition } from '../games/types';
import styles from './GameSwitcher.module.css';

/** Where switching to `target` lands: the same screen if that game has it, else its Status. */
function targetPath(target: GameDefinition, pathname: string): string {
  const current = GAMES.find((g) => pathname === g.basePath || pathname.startsWith(`${g.basePath}/`));
  if (!current || current.id === target.id) return target.basePath;
  const screen = pathname.slice(current.basePath.length).split('/').filter(Boolean)[0] ?? '';
  return target.nav.some((n) => n.path === screen && screen)
    ? `${target.basePath}/${screen}`
    : target.basePath;
}

/** Pills for each supported game. The active game drives the selected outline. */
export function GameSwitcher() {
  const { pathname } = useLocation();
  return (
    <nav className={styles.switcher} aria-label="Games">
      {GAMES.map((g) => {
        const active = pathname === g.basePath || pathname.startsWith(`${g.basePath}/`);
        return (
          <Link
            key={g.id}
            to={targetPath(g, pathname)}
            className={active ? `${styles.game} ${styles.on}` : styles.game}
            aria-current={active ? 'true' : undefined}
          >
            {g.short}
            <span className="sr-only">: {g.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
