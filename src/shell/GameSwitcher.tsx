import { Link, useLocation } from 'react-router';
import { GAMES } from '../games/registry';
import type { GameDefinition } from '../games/types';
import styles from './GameSwitcher.module.css';

export const SAVE_DIFF_PATH = '/tools/save-diff';

/** Where switching to `target` lands: the same screen if that game has it, else its Status. */
function targetPath(target: GameDefinition, pathname: string): string {
  const current = GAMES.find((g) => pathname === g.basePath || pathname.startsWith(`${g.basePath}/`));
  if (!current || current.id === target.id) return target.basePath;
  const screen = pathname.slice(current.basePath.length).split('/').filter(Boolean)[0] ?? '';
  return target.nav.some((n) => n.path === screen && screen)
    ? `${target.basePath}/${screen}`
    : target.basePath;
}

function HomeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3 9.5 10 3l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z" fill="currentColor" />
    </svg>
  );
}

function DiffIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4 3h7l5 5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm6 1.5V9h4.5M6 12h3m-1.5-1.5v3M11 13h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Header navigation: back to the game list, switch games, and the save diff tool. */
export function GameSwitcher() {
  const { pathname } = useLocation();
  const cls = (active: boolean) => (active ? `${styles.game} ${styles.on}` : styles.game);
  const onDiff = pathname === SAVE_DIFF_PATH;
  return (
    <nav className={styles.site} aria-label="Site">
      <div className={styles.switcher}>
        <Link to="/" className={cls(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
          <HomeIcon />
          <span>Home</span>
        </Link>
        {GAMES.map((g) => {
          const active = pathname === g.basePath || pathname.startsWith(`${g.basePath}/`);
          return (
            <Link
              key={g.id}
              to={targetPath(g, pathname)}
              className={cls(active)}
              aria-current={active ? 'true' : undefined}
            >
              {g.short}
              <span className="sr-only">: {g.title}</span>
            </Link>
          );
        })}
      </div>
      <Link
        to={SAVE_DIFF_PATH}
        className={onDiff ? `${styles.tool} ${styles.on}` : styles.tool}
        aria-current={onDiff ? 'page' : undefined}
      >
        <DiffIcon />
        <span className={styles.toolText}>Save Diff</span>
      </Link>
    </nav>
  );
}
