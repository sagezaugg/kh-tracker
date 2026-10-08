import { WORLD_SHORT, type Kh1WorldKey } from '../data/constants';
import { KH1_WORLDS } from '../data/locations';
import { WorldsScreen } from '../../../screens/WorldsScreen';

const SECTIONS = [
  ['chest', 'Treasures'],
  [
    'reward',
    'Event Rewards',
    'Abilities, Keyblades and items handed out by events. Most are read from the save.',
  ],
  [
    'event',
    'Story Events',
    'Other one-time events: postcards, clams, puppies returned, Trinity unlocks and more.',
  ],
  [
    'prize',
    'Prizes',
    "Prizes from Trinity marks, flower pots and the like. The save flags for these aren't mapped yet, so check them by hand.",
  ],
] as const;

export function Kh1WorldsRoute() {
  return (
    <WorldsScreen worlds={KH1_WORLDS} sections={SECTIONS} short={(w) => WORLD_SHORT[w.key as Kh1WorldKey]} />
  );
}
