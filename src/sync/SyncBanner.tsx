import { Link } from 'react-router';
import { gameNames, useSync } from './engine';
import styles from './SyncBanner.module.css';

/**
 * Site-wide nudge while sync is paused waiting for an answer (a conflict, or a join on a device that
 * already had progress). The question itself is on the Config screen.
 */
export function SyncBanner() {
  const status = useSync((s) => s.status);
  if (status.kind !== 'conflict' && status.kind !== 'join-choice') return null;
  const gameId = status.kind === 'conflict' ? status.games[0] : 'kh2';
  const text =
    status.kind === 'conflict'
      ? `Sync is paused: ${gameNames(status.games)} progress changed on two devices.`
      : 'Sync is paused until you choose which progress to keep.';
  return (
    <aside className={styles.banner} aria-label="Sync">
      <p>
        <strong>{text}</strong> <Link to={`/${gameId}/config`}>Choose which to keep in Config</Link>.
      </p>
    </aside>
  );
}
