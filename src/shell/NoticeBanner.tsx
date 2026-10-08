import { useState } from 'react';
import { REPO_URL } from '../site';
import styles from './NoticeBanner.module.css';

/** Bump the version to show the notice again after it changes. */
export const NOTICE_KEY = 'kh-tracker-notice-v1';

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(NOTICE_KEY) === 'dismissed';
  } catch {
    return false;
  }
}

/** Site-wide "work in progress" notice. Dismissal is remembered per browser when storage allows. */
export function NoticeBanner() {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(NOTICE_KEY, 'dismissed');
    } catch {
      // Storage blocked: the notice stays hidden for this visit only.
    }
  };

  return (
    <aside className={styles.banner} aria-label="Site notice">
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M10 2 19 18H1z" fill="currentColor" />
        <path d="M10 8v4.5M10 15v.01" stroke="#1a0c00" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className={styles.text}>
        <strong>Work in progress.</strong> Save import doesn&apos;t read every flag yet, and some it reads may
        be wrong, so treat the tracker as a loose guide for now and check things off by hand where it misses
        something. Spotted a wrong flag?{' '}
        <a href={`${REPO_URL}/issues`} rel="noreferrer" target="_blank">
          Report it on GitHub
        </a>
        .
      </p>
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss notice">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  );
}
