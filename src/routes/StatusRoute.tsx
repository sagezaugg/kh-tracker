import { SCORED_TROPHY_COUNT } from '../data/trophies';
import { PROFILES, pct, type Profile } from '../model/scoring';
import { useProgress, useScores, useTracker } from '../state/store';
import { Gauge } from '../ui/Gauge';
import { PartyCard } from '../ui/PartyCard';
import common from '../ui/common.module.css';
import { NAV_BY_KEY } from './nav';
import styles from './StatusRoute.module.css';

export function StatusRoute() {
  const scores = useScores();
  const profile = useTracker((s) => s.profile);
  const setProfile = useTracker((s) => s.setProfile);
  const imp = useProgress().lastImport;
  const prof = PROFILES.find((p) => p.id === profile) ?? PROFILES[2];

  const gauges: { id: Profile; value: string; sub: string }[] = [
    {
      id: 'journal',
      value: `${pct(scores.ratio.journal)}%`,
      sub: `${scores.journalDone} of 12 sections complete`,
    },
    {
      id: 'trophies',
      value: `${scores.trophies.earned}/${SCORED_TROPHY_COUNT}`,
      sub: scores.trophies.platinum ? 'Platinum earned' : 'Platinum locked',
    },
    { id: 'everything', value: `${pct(scores.ratio.everything)}%`, sub: 'Every goal in the tracker' },
  ];

  return (
    <>
      <div className={styles.gauges}>
        {gauges.map((g) => (
          <Gauge
            key={g.id}
            label={PROFILES.find((p) => p.id === g.id)?.label ?? g.id}
            value={g.value}
            pct={pct(scores.ratio[g.id])}
            sub={g.sub}
            selected={g.id === profile}
            onPick={() => setProfile(g.id)}
          />
        ))}
      </div>
      <p className={common.showing}>
        Showing your <b>{prof.name}</b> completion. Pick a gauge to switch.
      </p>
      <div className={styles.cards}>
        {scores.cats[profile].map((c) => {
          const nav = NAV_BY_KEY[c.link];
          return (
            <PartyCard
              key={c.name}
              name={c.name}
              done={c.done}
              total={c.total}
              to={nav.path}
              screen={nav.label}
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
          Tip: open Config to import a save file. Treasures, rewards, story bosses, reports, forms, magic,
          summons and Keyblades fill in on their own, and most trophies follow from those. Everything else you
          check off by hand.
        </p>
      )}
    </>
  );
}
