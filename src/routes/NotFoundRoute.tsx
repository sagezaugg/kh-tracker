import { Link } from 'react-router-dom';
import styles from './NotFoundRoute.module.css';

export function NotFoundRoute() {
  return (
    <div className={styles.wrap}>
      <p className={styles.note}>
        This path leads nowhere. The page you asked for isn&apos;t part of the tracker, or the link is out of
        date.
      </p>
      <Link className={styles.home} to="/">
        Return to Status
      </Link>
    </div>
  );
}
