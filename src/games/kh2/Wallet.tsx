import { valueOf } from './model/catalog';
import { PROFILES, pct } from './model/scoring';
import { SCORED_TROPHY_COUNT } from './data/trophies';
import { useProgress, useTracker } from '../context';
import { fmtNum } from '../../ui/hooks';
import { WalletBox } from '../../ui/WalletBox';
import { useScores } from './hooks';

/** MUNNY from the last import, Sora's LV, and the active profile's total. */
export function Kh2Wallet() {
  const p = useProgress();
  const scores = useScores();
  const profile = useTracker((s) => s.profile);
  const prof = PROFILES.find((x) => x.id === profile) ?? PROFILES[2];
  const total =
    profile === 'trophies'
      ? `${scores.trophies.earned}/${SCORED_TROPHY_COUNT}`
      : `${pct(scores.ratio[prof.id === 'journal' ? 'journal' : 'everything'])}%`;
  return (
    <WalletBox
      munny={p.lastImport ? fmtNum(p.lastImport.munny) : '—'}
      lv={valueOf(p, 'lv.sora')}
      totalLabel={prof.total}
      total={total}
    />
  );
}
