import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from 'zustand';
import { activeProgress } from '../core/store';
import { GAMES } from '../games/registry';
import type { GameDefinition } from '../games/types';
import { ProgressBar } from '../ui/ProgressBar';
import { Frame } from './Frame';
import shell from './Shell.module.css';
import styles from './HomeRoute.module.css';

function GameCard({ game }: { game: GameDefinition }) {
  const p = useStore(game.store, activeProgress);
  const profile = useStore(game.store, (s) => s.profile);
  const sum = game.summary(p, profile);
  return (
    <Link className={styles.card} to={game.basePath}>
      <span className={styles.short}>{game.short}</span>
      <span className={styles.title}>{game.title}</span>
      <span className={styles.value}>{sum.value}</span>
      <ProgressBar pct={sum.pct} variant="gauge" />
      <span className={styles.sub}>
        {sum.sub}
        {p.lastImport ? ` · last import ${p.lastImport.slot}, LV ${p.lastImport.lv}` : ''}
      </span>
    </Link>
  );
}

/** Landing page: pick a game. */
export function HomeRoute() {
  useEffect(() => {
    document.title = 'Kingdom Hearts 100% Tracker';
  }, []);
  return (
    <Frame title="Choose a Game" sub="Kingdom Hearts · 100% Completion Tracker" help="Pick a game to track.">
      <div className={shell.body}>
        <main className={shell.panel} id="main" tabIndex={-1}>
          <h1 className={shell.ptitle}>Choose a Game</h1>
          <div className={styles.cards}>
            {GAMES.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
          <p className={styles.note}>
            Each game keeps its own checklist, save import and backups in this browser. Use the switcher at
            the top to move between them.
          </p>
        </main>
      </div>
    </Frame>
  );
}
