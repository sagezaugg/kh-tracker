import { slug } from '../../../core/slug';

export interface KeybladeDef {
  /** Item id, `kb.<slug>`; matches the prototype. */
  id: string;
  name: string;
  /** In-game item id, used to spot an equipped Keyblade. */
  itemId: number;
  /** Inventory count byte. */
  offset: number;
}

const RAW: readonly (readonly [string, number, number])[] = [
  ['Kingdom Key', 41, 0x35a1],
  ['Oathkeeper', 42, 0x35a2],
  ['Oblivion', 43, 0x35a3],
  ['Star Seeker', 480, 0x367b],
  ['Hidden Dragon', 481, 0x367c],
  ["Hero's Crest", 484, 0x367f],
  ['Monochrome', 485, 0x3680],
  ['Follow the Wind', 486, 0x3681],
  ['Circle of Life', 487, 0x3682],
  ['Photon Debugger', 488, 0x3683],
  ['Gull Wing', 489, 0x3684],
  ['Rumbling Rose', 490, 0x3685],
  ['Guardian Soul', 491, 0x3686],
  ['Wishing Lamp', 492, 0x3687],
  ['Decisive Pumpkin', 493, 0x3688],
  ['Sleeping Lion', 494, 0x3689],
  ['Sweet Memories', 495, 0x368a],
  ['Mysterious Abyss', 496, 0x368b],
  ['Fatal Crest', 497, 0x368c],
  ['Bond of Flame', 498, 0x368d],
  ['Fenrir', 499, 0x368e],
  ['Ultima Weapon', 500, 0x368f],
  ['Two Become One', 543, 0x3698],
  ["Winner's Proof", 544, 0x3699],
];

export const KEYBLADES: readonly KeybladeDef[] = RAW.map(([name, itemId, offset]) => ({
  id: `kb.${slug(name)}`,
  name,
  itemId,
  offset,
}));
