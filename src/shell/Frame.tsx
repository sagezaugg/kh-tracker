import type { ReactNode } from 'react';
import { useUi } from '../core/ui';
import { HelpBar } from '../ui/HelpBar';
import { SiteFooter } from '../ui/SiteFooter';
import { GameSwitcher } from './GameSwitcher';
import { NoticeBanner } from './NoticeBanner';
import { UpdateBanner } from './UpdateBanner';
import { SyncBanner } from '../sync/SyncBanner';
import styles from './Shell.module.css';

interface FrameProps {
  /** Orange location title on the right of the header. */
  title: string;
  /** Line under the title. */
  sub: string;
  /** Help-bar text when nothing is hovered and no toast is showing. */
  help: string;
  /** Game id for the per-game colour theme (tokens.css); omitted on site pages. */
  gameId?: string;
  children: ReactNode;
}

/** The KH2-style page frame: scanlines, MENU header with the game switcher, help bar, footer. */
export function Frame({ title, sub, help, gameId, children }: FrameProps) {
  const hint = useUi((s) => s.hint);
  const toast = useUi((s) => s.toast);
  const toastKind = useUi((s) => s.toastKind);
  return (
    <div className={styles.kh} data-game={gameId}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <UpdateBanner />
      <SyncBanner />
      <NoticeBanner />
      <header className={styles.top}>
        <div className={styles.menuTag} aria-hidden="true">
          <span>MENU</span>
        </div>
        <GameSwitcher />
        <div className={styles.loc}>
          <span className={styles.locName}>{title}</span>
          <span className={styles.locSub}>{sub}</span>
        </div>
      </header>
      {children}
      <HelpBar
        text={toast ?? hint ?? help}
        trophy={toast !== null && toastKind === 'trophy'}
        announce={toast}
      />
      <SiteFooter />
    </div>
  );
}
