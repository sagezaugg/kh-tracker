import { useProgress, useTracker } from '../context';
import { fmtNum } from '../../ui/hooks';
import { WalletBox } from '../../ui/WalletBox';
import { valueOf } from './model/catalog';
import { KH1_PROFILES } from './model/scoring';
import { useKh1Scores } from './hooks';

/** MUNNY from the last import, Sora's LV, and the active profile's total. */
export function Kh1Wallet() {
  const p = useProgress();
  const s = useKh1Scores();
  const profile = useTracker((x) => x.profile);
  const prof = KH1_PROFILES.find((x) => x.id === profile) ?? KH1_PROFILES[2];
  const total =
    prof.id === 'trophies'
      ? `${s.trophies.earned}/${s.trophies.scored}`
      : `${Math.floor(s.ratio[prof.id] * 100)}%`;
  return (
    <WalletBox
      munny={p.lastImport ? fmtNum(p.lastImport.munny) : '—'}
      lv={valueOf(p, 'lv.sora')}
      totalLabel={prof.total}
      total={total}
    />
  );
}
