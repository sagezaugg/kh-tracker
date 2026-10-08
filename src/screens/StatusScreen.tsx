import { useGame, useGameHref, useProgress, useTracker } from '../games/context';
import { Gauge } from '../ui/Gauge';
import { PartyCard } from '../ui/PartyCard';
import common from '../ui/common.module.css';
import styles from './StatusScreen.module.css';

export interface GaugeSpec {
  id: string;
  value: string;
  pct: number;
  sub: string;
}

export interface CategorySpec {
  name: string;
  done: number;
  total: number;
  /** Nav key of the screen the card opens. */
  link: string;
}

interface StatusScreenProps {
  gauges: readonly GaugeSpec[];
  /** Category cards for each profile id. */
  cats: Readonly<Record<string, readonly CategorySpec[]>>;
  tip: string;
}

/** Profile gauges, KH-party-style category cards and the last import, for any game. */
export function StatusScreen({ gauges, cats, tip }: StatusScreenProps) {
  const game = useGame();
  const href = useGameHref();
  const profile = useTracker((s) => s.profile);
  const setProfile = useTracker((s) => s.setProfile);
  const imp = useProgress().lastImport;
  const prof = game.profiles.find((p) => p.id === profile) ?? game.profiles[game.profiles.length - 1];

  return (
    <>
      <div className={styles.gauges}>
        {gauges.map((g) => (
          <Gauge
            key={g.id}
            label={game.profiles.find((p) => p.id === g.id)?.label ?? g.id}
            value={g.value}
            pct={g.pct}
            sub={g.sub}
            selected={g.id === prof.id}
            onPick={() => setProfile(g.id)}
          />
        ))}
      </div>
      <p className={common.showing}>
        Showing your <b>{prof.name}</b> completion. Pick a gauge to switch.
      </p>
      <div className={styles.cards}>
        {(cats[prof.id] ?? []).map((c) => {
          const nav = game.nav.find((n) => n.key === c.link);
          return (
            <PartyCard
              key={c.name}
              name={c.name}
              done={c.done}
              total={c.total}
              to={href(nav?.path)}
              screen={nav?.label ?? 'Status'}
            />
          );
        })}
      </div>
      {imp ? (
        <div className={common.card} style={{ marginTop: 18 }}>
          <h2 className={common.cardT}>Last save import</h2>
          <dl className={common.kv}>
            <div>
              <dt>File</dt>
              <dd>{imp.file || '—'}</dd>
            </div>
            <div>
              <dt>Slot</dt>
              <dd>
                {imp.slot || '—'} · LV {imp.lv}
              </dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{imp.diff || '—'}</dd>
            </div>
            <div>
              <dt>Saved in</dt>
              <dd>{imp.world || '—'}</dd>
            </div>
            <div>
              <dt>Imported</dt>
              <dd>{imp.at ? new Date(imp.at).toLocaleString() : '—'}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className={common.note} style={{ marginTop: 18 }}>
          {tip}
        </p>
      )}
    </>
  );
}
