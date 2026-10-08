import { WORLD_SHORT, type WorldKey } from '../data/constants';
import { WORLDS } from '../data/locations';
import { WorldsScreen } from '../../../screens/WorldsScreen';

const SECTIONS = [
  ['boss', 'Story Bosses'],
  ['chest', 'Treasures'],
  ['reward', 'Rewards', 'Maps, Keyblades, abilities and other items handed out by events.'],
] as const;

export function WorldsRoute() {
  return <WorldsScreen worlds={WORLDS} sections={SECTIONS} short={(w) => WORLD_SHORT[w.key as WorldKey]} />;
}
