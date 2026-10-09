import { useEffect } from 'react';
import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router';
import { REPO_URL } from '../site';
import styles from './RouteError.module.css';

/** A one-line description of whatever was thrown. */
export function describeError(err: unknown): string {
  if (isRouteErrorResponse(err)) return `${err.status} ${err.statusText}`.trim();
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}

/** Prefilled GitHub issue: the page and the error, nothing from the player's progress. */
export function issueUrl(path: string, detail: string): string {
  const body = `**Page:** \`${path}\`\n**Error:** \`${detail}\`\n\n**What I was doing:**\n\n`;
  const q = new URLSearchParams({ title: `Error on ${path}`, body });
  return `${REPO_URL}/issues/new?${q.toString()}`;
}

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
