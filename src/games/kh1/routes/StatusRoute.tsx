import { StatusScreen } from '../../../screens/StatusScreen';
import { useKh1Scores } from '../hooks';

const pct = (r: number) => Math.floor(r * 100);

export function Kh1StatusRoute() {
  const s = useKh1Scores();
  return (
    <StatusScreen
      gauges={[
        {
          id: 'journal',
          value: `${pct(s.ratio.journal)}%`,
          pct: pct(s.ratio.journal),
          sub: `${s.journalDone} of ${s.sections.length} sections complete`,
        },
        {
          id: 'trophies',
          value: `${s.trophies.earned}/${s.trophies.scored}`,
          pct: pct(s.ratio.trophies),
          sub: s.trophies.platinum ? 'Platinum earned' : 'Platinum locked',
        },
        {
          id: 'everything',
          value: `${pct(s.ratio.everything)}%`,
          pct: pct(s.ratio.everything),
          sub: 'Every goal in the tracker',
        },
      ]}
      cats={s.cats}
      tip="Tip: open Config to import KHFM.png. Chests, event rewards, story events, Ansem's Reports, the 99 puppies, magic, summons, Keyblades and synthesis materials fill in on their own. Everything else you check off by hand."
    />
  );
}
