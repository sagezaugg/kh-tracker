import { useMemo } from 'react';
import { Link } from 'react-router';
import { WORLD_BY_KEY } from '../data/locations';
import {
  MOOGLE_LEVEL_NEEDED,
  MOOGLE_MAX_LEVEL,
  SYN_KEYS,
  SYNTHESIS_NOTE_ITEMS,
  type MaterialDef,
} from '../data/synthesis';
import { computeSynthesis } from '../model/synthesis';
import { useGameHref, useProgress, useTracker } from '../../context';
import { useUi } from '../../../core/ui';
import { ProgressBar } from '../../../ui/ProgressBar';
import { Segmented } from '../../../ui/Segmented';
import { useCheckToggle } from '../../../ui/hooks';
import common from '../../../ui/common.module.css';
import styles from './SynthesisRoute.module.css';

const RECIPE_OPTS = [
  ['base', 'Base recipe'],
  ['energy', 'With Energy Crystal'],
] as const;

function Gem({ mat }: { mat: MaterialDef }) {
  return <span className={`${styles.gem} ${styles[`g-${mat.gem}`]}`} aria-hidden="true" />;
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  className?: string;
}

function NumberField({ label, value, min, max, onChange, className }: NumberFieldProps) {
  return (
    <label className={className}>
      <span className="sr-only">{label}</span>
      <input
        className={styles.num}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.round(n))));
        }}
      />
    </label>
  );
}

export function SynthesisRoute() {
  const p = useProgress();
  const setValue = useTracker((s) => s.setValue);
  const toggle = useCheckToggle();
  const popId = useUi((s) => s.pop);
  const v = useMemo(() => computeSynthesis(p), [p]);
  const href = useGameHref();
  const total = v.ingredients.length;
  const orichalcumPlusNeed = v.ingredients[0]?.need ?? 13;

  return (
    <div className={styles.wrap}>
      <section className={`${styles.card} ${styles.goal}`} aria-label="Current goal">
        <div className={styles.goalL}>
          <span className={styles.kicker}>CURRENT GOAL</span>
          <h2 className={styles.goalName}>Ultima Weapon</h2>
          <ul className={styles.chips}>
            <li className={v.recipeFound ? `${styles.chip} ${styles.ok}` : `${styles.chip} ${styles.no}`}>
              Ultimate Recipe: {v.recipeFound ? 'found' : 'not found'}
            </li>
            <li className={v.moogleOk ? `${styles.chip} ${styles.ok}` : styles.chip}>
              Needs Moogle LV {MOOGLE_LEVEL_NEEDED} or higher
              {v.moogle > 0 && ` (yours: LV ${v.moogle})`}
            </li>
          </ul>
          <p className={styles.note}>
            {v.recipeFound
              ? 'The Ultimate Recipe chest (Mansion Basement Corridor, Twilight Town) is checked off.'
              : 'The Ultimate Recipe is in a chest in the Mansion Basement Corridor, Twilight Town.'}{' '}
            An Energy Crystal cuts the Orichalcum+ needed from 13 to 7.
          </p>
          <Segmented
            label="Recipe"
            options={RECIPE_OPTS}
            value={v.energy ? 'energy' : 'base'}
            onChange={(o) => setValue(SYN_KEYS.energy, o === 'energy' ? 1 : 0)}
          />
        </div>
        <div className={styles.goalR}>
          <span className={styles.kicker}>READY TO CRAFT</span>
          <span className={styles.big}>
            {v.ready}
            <small> / {total} materials</small>
          </span>
          <ProgressBar pct={Math.floor((v.ready / total) * 100)} variant="gauge" />
          <span className={styles.note} style={{ margin: 0 }}>
            {v.short.length ? `Short on ${v.short.join(', ')}.` : 'You have every material.'}
          </span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="syn-ing">
        <h2 className={styles.cardT} id="syn-ing">
          Ingredients
        </h2>
        <div className={styles.tblWrap}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Need</th>
                <th scope="col">Have*</th>
                <th scope="col" className={styles.progCol}>
                  Progress
                </th>
                <th scope="col">Where to get more</th>
              </tr>
            </thead>
            <tbody>
              {v.ingredients.map((i) => (
                <tr key={i.mat.id}>
                  <th scope="row">
                    <span className={styles.mat}>
                      <Gem mat={i.mat} />
                      {i.mat.name}
                    </span>
                  </th>
                  <td className={styles.numCell}>{i.need}</td>
                  <td>
                    <NumberField
                      label={`${i.mat.name} you have`}
                      value={i.have}
                      min={0}
                      max={99}
                      onChange={(n) => setValue(SYN_KEYS.have(i.mat.id), n)}
                      className={i.enough ? styles.okt : styles.short}
                    />
                  </td>
                  <td className={styles.progCol}>
                    <span className={i.enough ? styles.hb : `${styles.hb} ${styles.low}`} aria-hidden="true">
                      <span style={{ width: `${Math.min(100, Math.floor((i.have / i.need) * 100))}%` }} />
                    </span>
                  </td>
                  <td className={styles.where}>{i.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* TODO(open question 5): read material counts from the save once their offsets are mapped. */}
        <p className={styles.foot}>
          *Enter the counts from your inventory. Material counts aren&apos;t read from the save yet.
          Orichalcum+ sources collected: {v.sourcesFound} of {v.sources.length}.
        </p>
      </section>

      <div className={styles.two}>
        <section className={styles.card} aria-labelledby="syn-orp">
          <h2 className={styles.cardT} id="syn-orp">
            Orichalcum+ · {v.sourcesFound} of {v.sources.length}
          </h2>
          <p className={styles.note}>
            Only {v.sources.length} exist, and each one is a one-time reward. You need {orichalcumPlusNeed},
            so the rest come from synthesis.
          </p>
          <div className={styles.list}>
            {v.sources.map((s) => (
              <div
                key={s.id}
                className={[styles.li, s.found && styles.got, popId === s.id && styles.pop]
                  .filter(Boolean)
                  .join(' ')}
              >
                <label className={styles.liLab}>
                  <input type="checkbox" checked={s.found} onChange={() => toggle(s.id)} />
                  <span className={styles.box} aria-hidden="true" />
                  <span className={styles.liB}>
                    <b>{s.name}</b>
                    <span>{s.place}</span>
                  </span>
                </label>
                {s.found ? (
                  <span className={styles.tag}>Found</span>
                ) : s.trophies.length ? (
                  <span className={`${styles.tag} ${styles.trophy}`}>+ {s.trophies.join(', ')}</span>
                ) : s.worldRoute ? (
                  <Link
                    className={styles.link}
                    to={`${href(`worlds/${s.worldRoute}`)}?q=${encodeURIComponent('Orichalcum+')}`}
                  >
                    Show in Worlds
                  </Link>
                ) : (
                  <span className={styles.tag}>By hand</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card} aria-labelledby="syn-chests">
          <h2 className={styles.cardT} id="syn-chests">
            Unopened chests with Ultima materials
          </h2>
          <p className={styles.note}>
            From your checklist. Opening these also counts toward Treasure Hunter.
          </p>
          <div className={styles.list}>
            {v.unopened.map(({ loc, mat }) => (
              <div key={loc.id} className={styles.li}>
                <Gem mat={mat} />
                <span className={styles.liB}>
                  <b>{loc.name}</b>
                  <span>
                    {WORLD_BY_KEY[loc.world].name}
                    {loc.visitTag ? ` · ${loc.visitTag}` : ''}
                  </span>
                </span>
                <Link
                  className={styles.link}
                  to={`${href(`worlds/${WORLD_BY_KEY[loc.world].routeId}`)}?q=${encodeURIComponent(mat.name)}`}
                >
                  {mat.name}
                </Link>
              </div>
            ))}
            {v.unopened.length === 0 && (
              <p className={styles.note}>None left. Every chest with a material is open.</p>
            )}
          </div>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="syn-notes">
        <h2 className={styles.cardT} id="syn-notes">
          Synthesis Notes
        </h2>
        <p className={styles.note}>
          Make one of every item to fill this Journal section. Doing that earns Craftsman, takes the Moogle to
          LV 9 and gives an Orichalcum+. Enter your progress by hand for now.
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <b>
              <NumberField
                label="Items synthesized"
                value={v.notes}
                min={0}
                max={SYNTHESIS_NOTE_ITEMS}
                onChange={(n) => setValue(SYN_KEYS.notes, n)}
              />{' '}
              / {SYNTHESIS_NOTE_ITEMS}
            </b>
            <span>Items synthesized</span>
          </div>
          <div className={styles.stat}>
            <b>
              LV{' '}
              <NumberField
                label="Moogle level"
                value={v.moogle}
                min={0}
                max={MOOGLE_MAX_LEVEL}
                onChange={(n) => setValue(SYN_KEYS.moogle, n)}
              />{' '}
              / {MOOGLE_MAX_LEVEL}
            </b>
            <span>Moogle level</span>
          </div>
        </div>
        <p className={common.note}>
          The Journal section itself is the &ldquo;Every Synthesis Notes entry&rdquo; check under{' '}
          <Link to={href('journal')}>Journal</Link>.
        </p>
      </section>
    </div>
  );
}
