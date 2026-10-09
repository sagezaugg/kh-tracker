import { useContext } from 'react';
import { Link } from 'react-router';
import { GameContext } from '../games/context';
import styles from './NotFoundRoute.module.css';

/** Body for an unknown path; inside a game it links to that game's Status. */
export function NotFoundRoute() {
  const game = useContext(GameContext);
  return (
    <div className={styles.wrap}>
      <p className={styles.note}>
        This path leads nowhere. The page you asked for isn&apos;t part of the tracker, or the link is out of
        date.
      </p>
      <Link className={styles.home} to={game ? game.basePath : '/'}>
        {game ? `Return to ${game.short} Status` : 'Return to the game list'}
      </Link>
    </div>
  );
}
