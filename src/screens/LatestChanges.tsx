import { Link } from 'react-router';
import type { ImportReport } from '../core/importReport';
import { TIER_NAMES } from '../core/rules';
import { useGame, useGameHref, useTracker } from '../games/context';
import type { GameDefinition } from '../games/types';
import common from '../ui/common.module.css';
import styles from './LatestChanges.module.css';

/** Names shown per group before "+n more". */
export const GROUP_LIMIT = 8;

interface Group {
  key: string;
  label: string;
  path?: string;
  names: { id: string; name: string; tag?: string }[];
}

/** Newly checked items grouped by the menu screen that lists them, in menu order. */
function groupChecked(game: GameDefinition, ids: readonly string[]): Group[] {
  const byKey = new Map<string, Group>();
  for (const id of ids) {
    const item = game.catalog.itemById.get(id);
    if (!item) continue;
    const key = game.catalog.navKeyOf(id);
    let g = byKey.get(key);
    if (!g) {
      const nav = game.nav.find((n) => n.key === key);
      g = { key, label: nav?.label ?? 'Other', path: nav?.path, names: [] };
      byKey.set(key, g);
    }
    g.names.push({ id, name: item.name, tag: item.tag });
  }
  const order = (k: string) => {
    const i = game.nav.findIndex((n) => n.key === k);
    return i < 0 ? game.nav.length : i;
  };
  return [...byKey.values()].sort((a, b) => order(a.key) - order(b.key));
}

function when(at: string): string {
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** "Latest changes" card on the Status screen: what the most recent save import that changed anything did. */
export function LatestChanges({ report }: { report: ImportReport }) {
  const game = useGame();
  const href = useGameHref();
  const clearReport = useTracker((s) => s.clearReport);
  const groups = groupChecked(game, report.checked);
  const trophies = report.trophies
    .map((id) => game.catalog.trophies.find((t) => t.id === id))
    .filter((t) => t !== undefined);
  const raised = report.raised
    .map(([id, from, to]) => ({ id, from, to, name: game.catalog.itemById.get(id)?.name }))
    .filter((r) => r.name !== undefined);
  const trophyNav = game.nav.find((n) => n.key === 'trophies');
  const total = groups.reduce((n, g) => n + g.names.length, 0);
  const first = report.lvFrom === undefined;

  const meta = [
    report.slot,
    report.lvFrom !== undefined && report.lvFrom !== report.lv
      ? `LV ${report.lvFrom} → ${report.lv}`
      : `LV ${report.lv}`,
    report.world && `saved in ${report.world}`,
    when(report.at),
  ].filter(Boolean);

  return (
    <section className={`${common.card} ${styles.card}`} aria-labelledby="latest-changes">
      <div className={styles.head}>
        <h2 className={common.cardT} id="latest-changes">
          {first ? 'First save import' : 'Latest changes from your save'}
        </h2>
        <button type="button" className={`${common.pill} ${common.sm}`} onClick={clearReport}>
          Dismiss
        </button>
      </div>
      <p className={styles.meta}>{meta.join(' · ')}</p>
      <p className={styles.summary}>
        {[
          total > 0 && `${total} newly checked`,
          raised.length > 0 && `${raised.length} ${raised.length === 1 ? 'level' : 'levels'} up`,
          trophies.length > 0 && `${trophies.length} ${trophies.length === 1 ? 'trophy' : 'trophies'} earned`,
          report.unchecked > 0 && `${report.unchecked} unchecked to match the save`,
        ]
          .filter(Boolean)
          .join(', ') || 'Sora levelled up.'}
      </p>

      {trophies.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupT}>
            {trophyNav ? <Link to={href(trophyNav.path)}>Trophies</Link> : 'Trophies'}
          </h3>
          <ul className={styles.list}>
            {trophies.map((t) => (
              <li key={t.id}>
                {t.name} <span className={styles.tag}>{TIER_NAMES[t.tier]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {groups.map((g) => {
        const more = g.names.length - GROUP_LIMIT;
        return (
          <div className={styles.group} key={g.key}>
            <h3 className={styles.groupT}>
              {g.path !== undefined ? <Link to={href(g.path)}>{g.label}</Link> : g.label}{' '}
              <span className={styles.count}>+{g.names.length}</span>
            </h3>
            <ul className={styles.list}>
              {g.names.slice(0, GROUP_LIMIT).map((n) => (
                <li key={n.id}>
                  {n.name}
                  {n.tag && <span className={styles.tag}>{n.tag}</span>}
                </li>
              ))}
              {more > 0 && <li className={styles.more}>and {more} more</li>}
            </ul>
          </div>
        );
      })}

      {raised.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupT}>Levels and counts</h3>
          <ul className={styles.list}>
            {raised.map((r) => (
              <li key={r.id}>
                {r.name}{' '}
                <span className={styles.tag}>
                  {r.from} → {r.to}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
