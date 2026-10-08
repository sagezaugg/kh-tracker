import { SCORED_TROPHY_COUNT } from '../data/trophies';
import { pct } from '../model/scoring';
import { useScores } from '../hooks';
import { StatusScreen } from '../../../screens/StatusScreen';

export function StatusRoute() {
  const scores = useScores();
  return (
    <StatusScreen
      gauges={[
        {
          id: 'journal',
          value: `${pct(scores.ratio.journal)}%`,
          pct: pct(scores.ratio.journal),
          sub: `${scores.journalDone} of 12 sections complete`,
        },
        {
          id: 'trophies',
          value: `${scores.trophies.earned}/${SCORED_TROPHY_COUNT}`,
          pct: pct(scores.ratio.trophies),
          sub: scores.trophies.platinum ? 'Platinum earned' : 'Platinum locked',
        },
        {
          id: 'everything',
          value: `${pct(scores.ratio.everything)}%`,
          pct: pct(scores.ratio.everything),
          sub: 'Every goal in the tracker',
        },
      ]}
      cats={scores.cats}
      tip="Tip: open Config to import a save file. Treasures, rewards, story bosses, reports, forms, magic, summons and Keyblades fill in on their own, and most trophies follow from those. Everything else you check off by hand."
    />
  );
}
