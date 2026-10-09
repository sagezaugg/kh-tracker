import { useEffect } from 'react';
import { useLocation, useRouteError } from 'react-router';
import { describeError, issueUrl } from './errorInfo';
import styles from './RouteError.module.css';

/**
 * Shown when any page throws while rendering. Deliberately standalone (no Frame, switcher or stores),
 * so it still works when one of those is what broke. Links are plain anchors: a full page load gets a
 * clean start.
 */
export function RouteError() {
  const err = useRouteError();
  const { pathname } = useLocation();
  const detail = describeError(err);

  useEffect(() => {
    document.title = 'Something went wrong · Kingdom Hearts 100% Tracker';
    console.error(err);
  }, [err]);

  return (
    <div className={styles.page}>
      <main className={styles.panel}>
        <h1 className={styles.title}>Something went wrong</h1>
        <p>
          This page hit an error and couldn&apos;t be shown. <strong>Your progress is safe:</strong> it&apos;s
          saved in this browser and wasn&apos;t touched.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a className={styles.btn} href="/">
            Back to the game list
          </a>
          <a className={styles.btn} href={issueUrl(pathname, detail)} rel="noreferrer" target="_blank">
            Report it on GitHub
          </a>
        </div>
        <details className={styles.details}>
          <summary>Error details</summary>
          <code>{detail}</code>
        </details>
      </main>
    </div>
  );
}
