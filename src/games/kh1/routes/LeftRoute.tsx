import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Item } from '../../../core/types';
import { ChecklistRow, ChecklistRows } from '../../../ui/ChecklistRow';
import { ProgressBar } from '../../../ui/ProgressBar';
import { Section } from '../../../ui/Section';
import { Segmented } from '../../../ui/Segmented';
import { useCheckToggle } from '../../../ui/hooks';
import common from '../../../ui/common.module.css';
import { useProgress, useTracker } from '../../context';
import { SAVE_WORLD_TO_KEY } from '../data/constants';
import { KH1_WORLDS } from '../data/locations';
import { KH1_CLEARED_ID } from '../data/trophies';
import { isOn } from '../model/catalog';
import { KH1_ITEM_BY_ID } from '../model/items';
import { isKh1Profile, type Kh1Profile } from '../model/scoring';
import { useKh1Scores } from '../hooks';
import styles from './LeftRoute.module.css';

const COUNT_OPTS = [
  ['journal', 'Journal'],
  ['trophies', 'Trophies'],
  ['everything', 'Everything'],
] as const;
const TAG: Record<Kh1Profile, 'journal' | 'trophy' | 'everything'> = {
  journal: 'journal',
  trophies: 'trophy',
  everything: 'everything',
};
const TYPE_LABEL: Record<string, string> = {
  chest: 'Chest',
  reward: 'Reward',
  event: 'Event',
  prize: 'Prize',
};
const OPEN_GROUPS = 3;
const ROWS_SHOWN = 8;

/** Remaining world items for one KH1 definition of 100%, plus the closest trophies. */
export function Kh1LeftRoute() {
  const p = useProgress();
  const scores = useKh1Scores();
  const toggle = useCheckToggle();
  const rawProfile = useTracker((s) => s.profile);
  const [params, setParams] = useSearchParams();
  const param = params.get('count');
  const count: Kh1Profile = isKh1Profile(param)
    ? param
    : isKh1Profile(rawProfile)
      ? rawProfile
      : 'everything';
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [all, setAll] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () =>
      KH1_WORLDS.map((w) => ({
        world: w,
        rows: w.locations
          .filter((l) => !isOn(p, l.id) && (KH1_ITEM_BY_ID.get(l.id) as Item).tags.includes(TAG[count]))
          .map((l) => ({ id: l.id, name: l.short, tag: TYPE_LABEL[l.type], auto: !!l.flag })),
      }))
        .filter((g) => g.rows.length)
        .sort((a, b) => b.rows.length - a.rows.length),
    [p, count],
  );
  const total = groups.reduce((a, g) => a + g.rows.length, 0);
  const hereKey = p.lastImport?.worldId !== undefined ? SAVE_WORLD_TO_KEY[p.lastImport.worldId] : undefined;
  const here = groups.find((g) => g.world.key === hereKey);
  const reach = scores.trophies.list
    .filter((t) => !t.earned && t.id !== 'plat' && t.total > 0)
    .map((t) => ({ t, ratio: t.done / t.total }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 6);

  return (
    <div className={styles.wrap}>
      <Segmented
        label="Count toward"
        options={COUNT_OPTS}
        value={count}
        onChange={(v) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('count', v);
              return next;
            },
            { replace: true },
          )
        }
      />
      <p className={common.showing}>
        <b>{total}</b> left in worlds
        {p.lastImport ? `; ${here?.rows.length ?? 0} where you saved (${p.lastImport.world})` : ''}.
      </p>
      <div className={styles.cols}>
        <div className={styles.main}>
          <h2 className="sr-only">Worlds</h2>
          {groups.map((g, i) => {
            const isOpen = open[g.world.key] ?? i < OPEN_GROUPS;
            const rows = all[g.world.key] ? g.rows : g.rows.slice(0, ROWS_SHOWN);
            return (
              <section key={g.world.key} className={styles.group} aria-label={g.world.name}>
                <button
                  type="button"
                  className={styles.head}
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => ({ ...o, [g.world.key]: !isOpen }))}
                >
                  <h3 className={styles.title}>{g.world.name}</h3>
                  <span className={styles.cnt}>{g.rows.length}</span>
                </button>
                {isOpen && (
                  <div className={styles.body}>
                    <ChecklistRows>
                      {rows.map((r) => (
                        <ChecklistRow key={r.id} {...r} on={false} onToggle={toggle} />
                      ))}
                    </ChecklistRows>
                    {g.rows.length > ROWS_SHOWN && (
                      <button
                        type="button"
                        className={common.pill}
                        style={{ marginTop: 8 }}
                        aria-expanded={!!all[g.world.key]}
                        onClick={() => setAll((a) => ({ ...a, [g.world.key]: !a[g.world.key] }))}
                      >
                        {all[g.world.key] ? 'Show fewer' : `Show ${g.rows.length - ROWS_SHOWN} more`}
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          {groups.length === 0 && <p className={common.note}>Every world item for this goal is done.</p>}
        </div>
        <aside className={styles.side}>
          <Section title="Trophies within reach">
            {reach.map(({ t, ratio }) => (
              <div key={t.id} className={styles.tr}>
                <b>{t.name}</b>
                <span>{t.total > 1 ? `${t.total - t.done} left · ${t.req}` : t.req}</span>
                {t.total > 1 && <ProgressBar pct={Math.floor(ratio * 100)} variant="party" />}
              </div>
            ))}
            {reach.length === 0 && <p className={common.note}>Every trophy is earned.</p>}
            {!isOn(p, KH1_CLEARED_ID) && (
              <p className={common.note}>
                Beaten the final battle? KH1FM can&apos;t save afterwards, so mark the game cleared on Config
                to unlock the ending trophies.
              </p>
            )}
          </Section>
          <Section title="Beyond the worlds">
            {scores.cats.everything
              .filter((c) => c.link !== 'worlds' && c.done < c.total)
              .map((c) => (
                <div key={c.name} className={styles.tr}>
                  <b>
                    {c.name} · {c.done} / {c.total}
                  </b>
                </div>
              ))}
          </Section>
        </aside>
      </div>
    </div>
  );
}
