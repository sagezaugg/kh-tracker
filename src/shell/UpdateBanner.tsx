import { useUi } from '../core/ui';
import styles from './UpdateBanner.module.css';

/** Shown when a new deploy has taken over this tab: the page keeps running the old code until reloaded. */
export function UpdateBanner() {
  const ready = useUi((s) => s.updateReady);
  const setReady = useUi((s) => s.setUpdateReady);
  return (
    <div role="status">
      {ready && (
        <aside className={styles.banner} aria-label="Site update">
          <p className={styles.text}>
            <strong>Update ready.</strong> A new version of the tracker is available. Your progress is kept.
          </p>
          <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
            Reload
          </button>
          <button
            type="button"
            className={styles.close}
            onClick={() => setReady(false)}
            aria-label="Dismiss update notice"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </aside>
      )}
    </div>
  );
}
