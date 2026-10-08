import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CommandMenu } from '../ui/CommandMenu';
import { HelpBar } from '../ui/HelpBar';
import { WalletBox } from '../ui/WalletBox';
import { useUi } from '../state/ui';
import { navForPath } from './nav';
import styles from './Layout.module.css';

const NOT_FOUND_TITLE = 'Lost in the Darkness';
const NOT_FOUND_HELP = "There's nothing at this address. Pick a command to head back.";

/** App shell: MENU header, command menu with the hand, the framed panel and the help bar. */
export function Layout() {
  const { pathname } = useLocation();
  const nav = navForPath(pathname);
  const screenKey = nav?.key ?? 'missing';
  const title = nav?.label ?? NOT_FOUND_TITLE;

  const hint = useUi((s) => s.hint);
  const toast = useUi((s) => s.toast);
  const toastKind = useUi((s) => s.toastKind);

  // Leaving a screen drops its toast and hover hint, like the prototype's setTab.
  useEffect(() => {
    useUi.setState({ hint: null, toast: null, toastKind: 'info', pop: null });
  }, [screenKey]);

  useEffect(() => {
    document.title = `${title} · KH2FM 100% Tracker`;
  }, [title]);

  const helpText = toast ?? hint ?? nav?.help ?? NOT_FOUND_HELP;

  return (
    <div className={styles.kh}>
      <header className={styles.top}>
        <div className={styles.menuTag} aria-hidden="true">
          <span>MENU</span>
        </div>
        <div className={styles.loc}>
          <span className={styles.locName}>{title}</span>
          <span className={styles.locSub}>Kingdom Hearts II Final Mix · 100% Completion Tracker</span>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.cmds} aria-label="Tracker sections">
          <CommandMenu />
          <WalletBox munny="—" lv={1} totalLabel="ALL" total="0%" />
        </nav>

        <main className={styles.panel}>
          <h1 className={styles.ptitle}>{title}</h1>
          <div className={styles.scr} key={screenKey}>
            <Outlet />
          </div>
        </main>
      </div>

      <HelpBar text={helpText} trophy={toast !== null && toastKind === 'trophy'} />
    </div>
  );
}
