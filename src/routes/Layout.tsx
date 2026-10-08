import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { CommandMenu } from '../ui/CommandMenu';
import { HelpBar } from '../ui/HelpBar';
import { SiteFooter } from '../ui/SiteFooter';
import { WalletBox } from '../ui/WalletBox';
import { fmtNum } from '../ui/hooks';
import { useUi } from '../state/ui';
import { useProgress, useScores, useTracker } from '../state/store';
import { valueOf } from '../model/progress';
import { PROFILES, pct } from '../model/scoring';
import { SCORED_TROPHY_COUNT } from '../data/trophies';
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
  const news = useTracker((s) => s.news);
  const clearNews = useTracker((s) => s.clearNews);
  const profile = useTracker((s) => s.profile);
  const progress = useProgress();
  const scores = useScores();

  // Leaving a screen drops its toast and hover hint, like the prototype's setTab.
  useEffect(() => {
    useUi.setState({ hint: null, toast: null, toastKind: 'info', pop: null });
  }, [screenKey]);

  // Visiting a screen clears its NEW! tag; so does anything earned while you're on it.
  useEffect(() => {
    if (nav && news[nav.key]) clearNews(nav.key);
  }, [nav, news, clearNews]);

  useEffect(() => {
    document.title = `${title} · KH2FM 100% Tracker`;
  }, [title]);

  const helpText = toast ?? hint ?? nav?.help ?? NOT_FOUND_HELP;
  const prof = PROFILES.find((p) => p.id === profile) ?? PROFILES[2];
  const total =
    profile === 'trophies'
      ? `${scores.trophies.earned}/${SCORED_TROPHY_COUNT}`
      : `${pct(scores.ratio[profile])}%`;

  return (
    <div className={styles.kh}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
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
          <CommandMenu news={news} />
          <WalletBox
            munny={progress.lastImport ? fmtNum(progress.lastImport.munny) : '—'}
            lv={valueOf(progress, 'lv.sora')}
            totalLabel={prof.total}
            total={total}
          />
        </nav>

        <main className={styles.panel} id="main" tabIndex={-1}>
          <h1 className={styles.ptitle}>{title}</h1>
          <Outlet />
        </main>
      </div>

      <HelpBar text={helpText} trophy={toast !== null && toastKind === 'trophy'} announce={toast} />
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
