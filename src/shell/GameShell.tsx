import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from 'zustand';
import { useUi } from '../core/ui';
import { GameContext, navForPath } from '../games/context';
import type { GameDefinition } from '../games/types';
import { CommandMenu } from '../ui/CommandMenu';
import { Frame } from './Frame';
import { NOT_FOUND_HELP, NOT_FOUND_TITLE } from './notFound';
import styles from './Shell.module.css';

/** Hosts one game: its command menu, wallet box and screens, inside the shared frame. */
export function GameShell({ game }: { game: GameDefinition }) {
  const { pathname } = useLocation();
  const nav = navForPath(game, pathname);
  const screenKey = nav?.key ?? 'missing';
  const title = nav?.label ?? NOT_FOUND_TITLE;
  const news = useStore(game.store, (s) => s.news);
  const clearNews = useStore(game.store, (s) => s.clearNews);

  // Leaving a screen drops its toast and hover hint, like the prototype's setTab.
  useEffect(() => {
    useUi.setState({ hint: null, toast: null, toastKind: 'info', pop: null });
  }, [screenKey, game.id]);

  // Visiting a screen clears its NEW! tag; so does anything earned while you're on it.
  useEffect(() => {
    if (nav && news[nav.key]) clearNews(nav.key);
  }, [nav, news, clearNews]);

  useEffect(() => {
    document.title = `${title} · ${game.short} 100% Tracker`;
  }, [title, game.short]);

  return (
    <GameContext.Provider value={game}>
      <Frame title={title} sub={`${game.title} · 100% Completion Tracker`} help={nav?.help ?? NOT_FOUND_HELP}>
        <div className={styles.body}>
          <nav className={styles.cmds} aria-label="Tracker sections">
            <CommandMenu news={news} />
            <game.Wallet />
          </nav>
          <main className={styles.panel} id="main" tabIndex={-1}>
            <h1 className={styles.ptitle}>{title}</h1>
            <Outlet />
          </main>
        </div>
      </Frame>
    </GameContext.Provider>
  );
}
