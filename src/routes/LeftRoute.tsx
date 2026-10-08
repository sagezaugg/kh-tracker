import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { WORLD_BY_KEY } from '../data/locations';
import {
  computeRemaining,
  type GroupBy,
  type HintLevel,
  type LeftGroup,
  type LeftRow,
  type RowTag,
} from '../model/remaining';
import { isProfile, type Profile } from '../model/scoring';
import { useProgress, useTracker } from '../state/store';
import { useUi } from '../state/ui';
import { ProgressBar } from '../ui/ProgressBar';
import { Segmented } from '../ui/Segmented';
import { useCheckToggle } from '../ui/hooks';
import common from '../ui/common.module.css';
import styles from './LeftRoute.module.css';

const COUNT_OPTS = [
  ['journal', 'Journal'],
  ['trophies', 'Trophies'],
  ['everything', 'Everything'],
] as const;
const HINT_OPTS = [
  ['counts', 'Counts only'],
  ['area', 'Area'],
  ['full', 'Full'],
] as const;
const GROUP_OPTS = [
  ['world', 'World'],
  ['visit', 'Visit'],
] as const;

const OPEN_GROUPS = 3;
const ROWS_SHOWN = 6;

const isHint = (v: string | null): v is HintLevel => v === 'counts' || v === 'area' || v === 'full';
const isGroup = (v: string | null): v is GroupBy => v === 'world' || v === 'visit';

const TAG_CLASS: Record<RowTag, string | undefined> = {
  Chest: undefined,
  Map: undefined,
  Reward: styles.rew,
  Boss: styles.boss,
  Ultima: styles.ult,
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function summary(c: LeftGroup['counts']): string {
  const parts = [
    c.chest && plural(c.chest, 'chest'),
    c.reward && plural(c.reward, 'reward'),
    c.boss && plural(c.boss, 'story boss', 'story bosses'),
  ].filter(Boolean);
  return parts.join(', ');
}

/** Title and detail line for a row at the current hint level. */
function rowText(r: LeftRow, hints: HintLevel): { title: string; sub: string } {
  const where = r.loc.visitTag || WORLD_BY_KEY[r.loc.world].name;
  if (r.loc.type === 'chest') {
    if (hints === 'area') return { title: r.split?.area ?? 'Treasure chest', sub: `Chest · ${where}` };
    return r.split
      ? { title: r.split.item, sub: `${r.split.area} · ${where}` }
      : { title: r.loc.name, sub: where };
  }
  if (r.loc.type === 'reward') return { title: r.loc.name, sub: `Event reward · ${where}` };
  return { title: r.loc.name, sub: where };
}

function Row({ r, hints }: { r: LeftRow; hints: HintLevel }) {
  const toggle = useCheckToggle();
  const pop = useUi((s) => s.pop === r.id);
  const { title, sub } = rowText(r, hints);
  const tags = hints === 'area' && r.loc.type === 'chest' ? r.tags.filter((t) => t === 'Chest') : r.tags;
  return (
    <label className={pop ? `${styles.row} ${styles.pop}` : styles.row}>
      <input type="checkbox" checked={false} onChange={() => toggle(r.id)} />
      <span className={styles.box} aria-hidden="true" />
      <span className={styles.nm}>
        <b>{title}</b>
        <span>{sub}</span>
      </span>
      {tags.map((t) => (
        <span key={t} className={TAG_CLASS[t] ? `${styles.tag} ${TAG_CLASS[t]}` : styles.tag}>
          {t}
        </span>
      ))}
    </label>
  );
}

function SubList({ title, rows, hints }: { title: string; rows: LeftRow[]; hints: HintLevel }) {
  const [all, setAll] = useState(false);
  if (!rows.length) return null;
  const shown = all ? rows : rows.slice(0, ROWS_SHOWN);
  return (
    <>
      <h4 className={styles.sub}>
        {title} · {rows.length}
      </h4>
      {hints !== 'counts' && (
        <>
          {shown.map((r) => (
            <Row key={r.id} r={r} hints={hints} />
          ))}
          {rows.length > ROWS_SHOWN && (
            <button type="button" className={styles.more} aria-expanded={all} onClick={() => setAll(!all)}>
              {all ? 'Show fewer' : `Show ${rows.length - ROWS_SHOWN} more`}
            </button>
          )}
        </>
      )}
    </>
  );
}

function Group({
  g,
  hints,
  open,
  onToggle,
}: {
  g: LeftGroup;
  hints: HintLevel;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyId = `wg-${g.key.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const header = (
    <button
      type="button"
      className={styles.wgH}
      aria-expanded={open}
      aria-controls={bodyId}
      onClick={onToggle}
    >
      <h3 className={styles.wgT}>{g.name}</h3>
      {!open && <span className={styles.crS}>{summary(g.counts)}</span>}
      <span className={styles.cnt}>{g.rows.length}</span>
      <svg
        className={open ? styles.chev : `${styles.chev} ${styles.chevClosed}`}
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </button>
  );
  return (
    <section className={open ? styles.wg : `${styles.wg} ${styles.closed}`} aria-label={g.name}>
      {header}
      {open && (
        <div className={styles.wgB} id={bodyId}>
          <SubList title="Treasures" rows={g.rows.filter((r) => r.loc.type === 'chest')} hints={hints} />
          <SubList title="Rewards" rows={g.rows.filter((r) => r.loc.type === 'reward')} hints={hints} />
          <SubList title="Story bosses" rows={g.rows.filter((r) => r.loc.type === 'boss')} hints={hints} />
        </div>
      )}
    </section>
  );
}

export function LeftRoute() {
  const p = useProgress();
  const storeProfile = useTracker((s) => s.profile);
  const [params, setParams] = useSearchParams();
  const countParam = params.get('count');
  const count: Profile = isProfile(countParam) ? countParam : storeProfile;
  const hintParam = params.get('hints');
  const hints: HintLevel = isHint(hintParam) ? hintParam : 'full';
  const groupParam = params.get('group');
  const groupBy: GroupBy = isGroup(groupParam) ? groupParam : 'world';
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const set = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const left = useMemo(() => computeRemaining(p, count, groupBy, hints), [p, count, groupBy, hints]);
  const isOpen = (g: LeftGroup, i: number) => toggled[g.key] ?? i < OPEN_GROUPS;

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <Segmented
          label="Count toward"
          options={COUNT_OPTS}
          value={count}
          onChange={(v) => set('count', v)}
        />
        <Segmented label="Hints" options={HINT_OPTS} value={hints} onChange={(v) => set('hints', v)} />
        <Segmented label="Group by" options={GROUP_OPTS} value={groupBy} onChange={(v) => set('group', v)} />
      </div>

      {left.here ? (
        <section className={styles.here} aria-label="Where you are">
          <div className={styles.hereL}>
            <span className={styles.kicker}>YOU&apos;RE SAVED IN</span>
            <h2 className={styles.hereT}>{left.here.name}</h2>
            <span className={styles.hereS}>
              {left.here.group && left.here.left > 0
                ? `${summary(left.here.group.counts)} left here.`
                : left.here.world
                  ? 'Nothing left here for this goal.'
                  : 'Not one of the tracked worlds.'}
            </span>
          </div>
          <span className={styles.bigN}>
            {left.here.left}
            <small> left here</small>
          </span>
          <span className={styles.bigN}>
            {left.total}
            <small> left in worlds</small>
          </span>
        </section>
      ) : (
        <p className={common.note}>
          {left.total} left in worlds. <Link to="/config">Import a save</Link> to see what&apos;s left where
          you saved.
        </p>
      )}

      {left.wins.length > 0 && (
        <div className={styles.wins}>
          {left.wins.map(({ group: g, trophies }) => {
            const top = [...g.rows]
              .sort((a, b) => Number(b.ultima) + b.trophyIds.length - (Number(a.ultima) + a.trophyIds.length))
              .slice(0, 4);
            return (
              <section key={g.key} className={styles.win} aria-label={`Quick win: ${g.name}`}>
                <h2 className={styles.winT}>
                  {g.name} · {g.rows.length} left
                </h2>
                <span className={styles.winN}>{summary(g.counts)}</span>
                {hints !== 'counts' && (
                  <ul className={styles.winList}>
                    {top.map((r) => (
                      <li key={r.id}>{rowText(r, hints).title}</li>
                    ))}
                  </ul>
                )}
                {trophies.length > 0 && (
                  <ul className={styles.chips} aria-label="Trophies this advances">
                    {trophies.slice(0, 4).map((t) => (
                      <li key={t.id} className={styles.tchip}>
                        {t.name}
                      </li>
                    ))}
                  </ul>
                )}
                <Link className={styles.winLink} to={`/worlds/${WORLD_BY_KEY[g.world].routeId}?hide=1`}>
                  Open in Worlds
                </Link>
              </section>
            );
          })}
        </div>
      )}

      <div className={styles.cols}>
        <div className={styles.main}>
          <h2 className="sr-only">Worlds</h2>
          {left.groups.map((g, i) => (
            <Group
              key={g.key}
              g={g}
              hints={hints}
              open={isOpen(g, i)}
              onToggle={() => setToggled((t) => ({ ...t, [g.key]: !isOpen(g, i) }))}
            />
          ))}
          {left.groups.length === 0 && <p className={common.note}>Every world item for this goal is done.</p>}
        </div>

        <aside className={styles.side}>
          <section className={styles.card} aria-labelledby="left-reach">
            <h2 className={styles.cardT} id="left-reach">
              Trophies within reach
            </h2>
            {left.clearHint && (
              <div className={styles.tr}>
                <b>{left.clearHint.names.join(', ')}</b>
                <span>{left.clearHint.text}</span>
              </div>
            )}
            {left.reach.map(({ t, left: n, ratio }) => (
              <div key={t.id} className={styles.tr}>
                <b>{t.name}</b>
                <span>{t.total > 1 ? `${n} left · ${t.req}` : t.req}</span>
                {t.total > 1 && <ProgressBar pct={Math.floor(ratio * 100)} variant="party" />}
              </div>
            ))}
            {!left.clearHint && left.reach.length === 0 && (
              <p className={common.note}>Every trophy is earned.</p>
            )}
          </section>
          {left.beyond.length > 0 && (
            <section className={styles.card} aria-labelledby="left-beyond">
              <h2 className={styles.cardT} id="left-beyond">
                Beyond the worlds
              </h2>
              {left.beyond.map((b) => (
                <div key={b.title} className={styles.tr}>
                  <b>
                    {b.title} · {b.done} / {b.total}
                  </b>
                  {b.detail && <span>{b.detail}</span>}
                </div>
              ))}
            </section>
          )}
          <p className={common.note}>
            {p.lastImport
              ? `Counts come from your ${p.lastImport.slot} import plus anything you checked by hand. `
              : ''}
            Switch Hints to &ldquo;Area&rdquo; to hide what&apos;s inside each chest.
          </p>
        </aside>
      </div>
    </div>
  );
}
