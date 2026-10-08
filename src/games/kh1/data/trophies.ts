import { isOn } from '../../../core/progress';
import { slug } from '../../../core/slug';
import type { Progress, Rule, TrophyDef } from '../../../core/types';
import { CUPS, DIFFICULTIES, KEYBLADES } from './constants';
import { KH1_LOCATIONS, locationId } from './locations';
import { SYNTHESIS_LISTS, synthesisId } from './synthesis';

/**
 * KH1FM trophies (PS4 / HD 1.5+2.5 ReMIX). Names, order and requirements: KHWiki "Trophies";
 * tiers cross-checked with PlayStation LifeStyle (1 Platinum, 2 Gold, 4 Silver, 49 Bronze; KHWiki
 * shows Level Master as Bronze, PlayStation LifeStyle as Silver, and the 1/2/4/49 split needs
 * Silver). Rules use a save flag or a tracked item only where one exists; everything else is
 * marked by hand.
 */

export type Kh1TrophyGroup = 'plat' | 'story' | 'battle' | 'coliseum' | 'journal' | 'synthesis' | 'gummi' | 'feats';

export const KH1_TROPHY_GROUPS: readonly (readonly [Exclude<Kh1TrophyGroup, 'plat'>, string])[] = [
  ['story', 'Story'],
  ['battle', 'Battle'],
  ['coliseum', 'Coliseum'],
  ['journal', 'Journal'],
  ['synthesis', 'Synthesis'],
  ['gummi', 'Gummi Ship'],
  ['feats', 'Feats'],
];

/**
 * The game-cleared toggle. KH1FM can't save after the final battle, so no save will ever show it:
 * this stays a manual check by design.
 */
export const KH1_CLEARED_ID = 'kh1.cleared';

const cleared: Rule = { all: [KH1_CLEARED_ID] };
const clearOn = (atLeast: number): Rule =>
  atLeast === 0 ? cleared : { and: [cleared, { save: 'difficulty', atLeast }] };
const clearText =
  (needsDifficulty: boolean) =>
  (p: Progress): string =>
    (isOn(p, KH1_CLEARED_ID) ? 'Game cleared' : 'Game not cleared') +
    (needsDifficulty
      ? ` · ${p.difficulty !== undefined ? (DIFFICULTIES[p.difficulty] ?? 'difficulty not set') : 'difficulty not set'}`
      : '');

const loc = (name: string): Rule => ({ all: [locationId(name)] });
const CHEST_IDS = KH1_LOCATIONS.filter((l) => l.type === 'chest').map((l) => l.id);
const SYNTH_IDS = SYNTHESIS_LISTS.flatMap((l) => l.items.map(synthesisId));
const cupIds = (suffix: string) => CUPS.map((c) => locationId(`Complete ${c}${suffix}`));

export const KH1_TROPHIES: readonly (TrophyDef & { group: Kh1TrophyGroup })[] = [
  { id: 'plat', name: 'KINGDOM HEARTS Master', tier: 'P', req: 'Obtain all trophies.', group: 'plat' },
  {
    id: 'proud',
    name: 'Proud Player',
    tier: 'G',
    req: 'Clear Final Mix on Proud.',
    group: 'story',
    rule: clearOn(2),
    clear: true,
    progText: clearText(true),
  },
  {
    id: 'fmmaster',
    name: 'Final Mix Master',
    tier: 'S',
    req: 'Clear the game on Final Mix or a higher difficulty.',
    group: 'story',
    rule: clearOn(1),
    clear: true,
    progText: clearText(true),
  },
  {
    id: 'novice',
    name: 'Novice Player',
    tier: 'B',
    req: 'Clear the game on Final Mix: Beginner or a higher difficulty.',
    group: 'story',
    rule: clearOn(0),
    clear: true,
    progText: clearText(false),
  },
  {
    id: 'armor',
    name: 'Unchanging Armor',
    tier: 'S',
    req: 'Clear the game without changing equipment.',
    group: 'feats',
    rule: { all: ['ft.armor'] },
  },
  {
    id: 'undefeated',
    name: 'Undefeated',
    tier: 'S',
    req: 'Clear the game without using a continue.',
    group: 'feats',
    rule: { all: ['ft.undefeated'] },
  },
  {
    id: 'speedster',
    name: 'Speedster',
    tier: 'G',
    req: 'Defeat the World of Chaos in the End of the World within 15 hours.',
    group: 'feats',
    rule: { all: ['ft.speedster'] },
  },
  {
    id: 'unknown',
    name: "He Who Doesn't Exist",
    tier: 'B',
    req: 'Defeat the Mysterious Man in Hollow Bastion.',
    group: 'battle',
    rule: loc('Hollow Bastion Defeat Unknown EXP Necklace Event'),
  },
  {
    id: 'phantom',
    name: 'The Cloaked Shadow',
    tier: 'B',
    req: 'Defeat the Phantom at the Clock Tower.',
    group: 'battle',
    rule: loc('Neverland Defeat Phantom Stop Event'),
  },
  {
    id: 'kurt',
    name: 'The Sandy Blade',
    tier: 'B',
    req: 'Defeat Kurt Zisa in Agrabah.',
    group: 'battle',
    rule: loc('Agrabah Defeat Kurt Zisa Zantetsuken Event'),
  },
  { id: 'cup1', name: 'Novice Hero', tier: 'B', req: 'Win the Phil Cup.', group: 'coliseum', rule: loc('Complete Phil Cup') },
  {
    id: 'cup2',
    name: 'Artisan Hero',
    tier: 'B',
    req: 'Win the Pegasus Cup.',
    group: 'coliseum',
    rule: loc('Complete Pegasus Cup'),
  },
  {
    id: 'cup3',
    name: 'Hero of the Coliseum',
    tier: 'B',
    req: 'Win the Hercules Cup.',
    group: 'coliseum',
    rule: loc('Complete Hercules Cup'),
  },
  {
    id: 'cup4',
    name: 'Coliseum Champion',
    tier: 'B',
    req: 'Win the Hades Cup.',
    group: 'coliseum',
    rule: loc('Complete Hades Cup'),
  },
  {
    id: 'icetitan',
    name: 'The Frosty Giant',
    tier: 'B',
    req: 'Defeat the Ice Titan in the Gold Match at Olympus Coliseum.',
    group: 'coliseum',
    rule: loc('Olympus Coliseum Defeat Ice Titan Diamond Dust Event'),
  },
  {
    id: 'seph',
    name: 'One-Winged Angel',
    tier: 'B',
    req: 'Defeat Sephiroth in the Platinum Match at Olympus Coliseum.',
    group: 'coliseum',
    rule: loc('Olympus Coliseum Defeat Sephiroth One-Winged Angel Event'),
  },
  {
    id: 'solo',
    name: 'Supreme Soloist',
    tier: 'B',
    req: 'Complete any solo challenge.',
    group: 'coliseum',
    rule: { count: cupIds(' Solo'), atLeast: 1 },
  },
  {
    id: 'timeatk',
    name: 'Time Attacker',
    tier: 'B',
    req: 'Complete any time trial challenge.',
    group: 'coliseum',
    rule: { count: cupIds(' Time Trial'), atLeast: 1 },
  },
  {
    id: 'level',
    name: 'Level Master',
    tier: 'S',
    req: 'Get Sora to Level 100.',
    group: 'feats',
    rule: { item: 'lv.sora', atLeast: 100 },
  },
  {
    id: 'treasure',
    name: 'Treasure Hunter',
    tier: 'B',
    req: 'Open 100 treasure chests.',
    group: 'feats',
    rule: { count: CHEST_IDS, atLeast: 100 },
  },
  {
    id: 'riches',
    name: 'From Rags to Riches',
    tier: 'B',
    req: 'Hold over 10 thousand munny.',
    group: 'feats',
    rule: { all: ['ft.riches'] },
  },
  {
    id: 'hhunter',
    name: 'Heartless Hunter',
    tier: 'B',
    req: 'Defeat over 2,000 Heartless.',
    group: 'feats',
    rule: { all: ['ft.hhunter'] },
  },
  {
    id: 'kh-tt',
    name: 'Where the Bells Toll',
    tier: 'B',
    req: 'Seal the Keyhole in Traverse Town.',
    group: 'story',
    rule: { all: ['kh.tt'] },
  },
  {
    id: 'kh-wl',
    name: 'The Rabbit Hole',
    tier: 'B',
    req: 'Seal the Keyhole in Wonderland.',
    group: 'story',
    rule: { all: ['kh.wl'] },
  },
  {
    id: 'kh-oc',
    name: 'Junior Hero',
    tier: 'B',
    req: 'Seal the Keyhole in Olympus Coliseum.',
    group: 'story',
    rule: { all: ['kh.oc'] },
  },
  {
    id: 'kh-dj',
    name: 'Member of the Tribe',
    tier: 'B',
    req: 'Seal the Keyhole in Deep Jungle.',
    group: 'story',
    rule: loc('Deep Jungle Seal Keyhole Jungle King Event'),
  },
  {
    id: 'kh-ag',
    name: 'Magic Lamp',
    tier: 'B',
    req: 'Seal the Keyhole in Agrabah.',
    group: 'story',
    rule: loc('Agrabah Seal Keyhole Three Wishes Event'),
  },
  {
    id: 'kh-mo',
    name: 'Honest Soul',
    tier: 'B',
    req: 'Escape from Monstro.',
    group: 'story',
    // Inference to verify: escaping follows the last fight there, Parasite Cage II.
    rule: loc('Monstro Defeat Parasite Cage II Stop Event'),
  },
  {
    id: 'kh-at',
    name: 'Master of the Seas',
    tier: 'B',
    req: 'Seal the Keyhole in Atlantica.',
    group: 'story',
    rule: loc('Atlantica Seal Keyhole Crabclaw Event'),
  },
  {
    id: 'kh-ht',
    name: 'Pumpkin Prince',
    tier: 'B',
    req: 'Seal the Keyhole in Halloween Town.',
    group: 'story',
    rule: loc('Halloween Town Seal Keyhole Pumpkinhead Event'),
  },
  {
    id: 'kh-nl',
    name: 'Pixie Dust',
    tier: 'B',
    req: 'Seal the Keyhole in Never Land.',
    group: 'story',
    rule: loc('Neverland Seal Keyhole Fairy Harp Event'),
  },
  {
    id: 'kh-hb',
    name: 'End of the World',
    tier: 'B',
    req: 'Seal the Keyhole in Hollow Bastion.',
    group: 'story',
    rule: { all: ['kh.hb'] },
  },
  {
    id: 'kh-aw',
    name: "Pooh's Friend",
    tier: 'B',
    req: 'Seal the Keyhole in the 100 Acre Wood.',
    group: 'story',
    rule: { all: ['kh.aw'] },
  },
  {
    id: 'record',
    name: 'Record Keeper',
    tier: 'B',
    req: "Collect all Jiminy's Journal entries.",
    group: 'journal',
    rule: {
      and: [
        { section: 'story' },
        { section: 'reports' },
        { section: 'characters' },
        { item: 'kh1.puppies', atLeast: 99 },
        { item: 'kh1.trinity', atLeast: 46 },
        { section: 'minigames' },
      ],
    },
  },
  {
    id: 'story-j',
    name: 'Storyteller',
    tier: 'B',
    req: "Collect all Story entries in Jiminy's Journal.",
    group: 'journal',
    rule: { section: 'story' },
  },
  {
    id: 'searcher',
    name: 'Searcher',
    tier: 'B',
    req: "Collect all Ansem Reports in Jiminy's Journal.",
    group: 'journal',
    rule: { section: 'reports' },
  },
  {
    id: 'professor',
    name: 'Professor',
    tier: 'B',
    req: "Collect all Character entries in Jiminy's Journal.",
    group: 'journal',
    rule: { section: 'characters' },
  },
  {
    id: 'topdog',
    name: 'Top Dog',
    tier: 'B',
    req: "Collect all 101 Dalmatian entries in Jiminy's Journal.",
    group: 'journal',
    rule: { item: 'kh1.puppies', atLeast: 99 },
  },
  {
    id: 'bestfriend',
    name: 'Best Friend',
    tier: 'B',
    req: "Collect all Trinity List entries in Jiminy's Journal.",
    group: 'journal',
    rule: { item: 'kh1.trinity', atLeast: 46 },
  },
  {
    id: 'minigame',
    name: 'Mini-game Maniac',
    tier: 'B',
    req: "Collect all Mini-game entries in Jiminy's Journal.",
    group: 'journal',
    rule: { section: 'minigames' },
  },
  {
    id: 'synth-all',
    name: 'Synthesis Master',
    tier: 'B',
    req: 'Synthesize all items.',
    group: 'synthesis',
    rule: { all: SYNTH_IDS },
  },
  {
    id: 'synth-1',
    name: 'First Synthesis',
    tier: 'B',
    req: 'Synthesize an item for the first time.',
    group: 'synthesis',
    rule: { count: SYNTH_IDS, atLeast: 1 },
  },
  {
    id: 'synth-3',
    name: 'Synthesis Novice',
    tier: 'B',
    req: 'Synthesize 3 types of items.',
    group: 'synthesis',
    rule: { count: SYNTH_IDS, atLeast: 3 },
  },
  {
    id: 'synth-15',
    name: 'Synthesis Amateur',
    tier: 'B',
    req: 'Synthesize 15 types of items.',
    group: 'synthesis',
    rule: { count: SYNTH_IDS, atLeast: 15 },
  },
  {
    id: 'synth-30',
    name: 'Synthesis Vet',
    tier: 'B',
    req: 'Synthesize 30 types of items.',
    group: 'synthesis',
    rule: { count: SYNTH_IDS, atLeast: 30 },
  },
  {
    id: 'collector',
    name: 'Gummi Ship Collector',
    tier: 'B',
    req: 'Obtain 30 or more gummi ship blueprints.',
    group: 'gummi',
    rule: { all: ['gm.collector'] },
  },
  {
    id: 'flyingace',
    name: 'Flying Ace',
    tier: 'B',
    req: 'Shoot down over 2,500 enemies with your gummi ship.',
    group: 'gummi',
    rule: { all: ['gm.flyingace'] },
  },
  {
    id: 'customizer',
    name: 'Customizer',
    tier: 'B',
    req: 'Modify a gummi ship and update the data.',
    group: 'gummi',
    rule: { all: ['gm.customizer'] },
  },
  {
    id: 'topgun',
    name: 'Top Gun',
    tier: 'B',
    req: 'Clear all gummi ship routes.',
    group: 'gummi',
    rule: { all: ['gm.topgun'] },
  },
  {
    id: 'test',
    name: 'Test Pilot',
    tier: 'B',
    req: 'Clear gummi ship mission 1.',
    group: 'gummi',
    rule: { all: ['gm.mission1'] },
  },
  {
    id: 'veteran',
    name: 'Veteran Pilot',
    tier: 'B',
    req: 'Clear gummi ship mission 2.',
    group: 'gummi',
    rule: { all: ['gm.mission2'] },
  },
  {
    id: 'ace',
    name: 'Ace Pilot',
    tier: 'B',
    req: 'Clear gummi ship mission 3.',
    group: 'gummi',
    rule: { all: ['gm.mission3'] },
  },
  {
    id: 'oathkeeper',
    name: 'Oathkeeper',
    tier: 'B',
    req: 'Obtain the Oathkeeper Keyblade.',
    group: 'feats',
    rule: { all: ['kb.oathkeeper'] },
  },
  {
    id: 'blade',
    name: 'Blade Master',
    tier: 'B',
    req: 'Obtain all Keyblades.',
    group: 'feats',
    // Inference to verify: the 18 Keyblades Sora keeps (see constants.ts).
    rule: { all: KEYBLADES.map(([, n]) => `kb.${slug(n)}`) },
  },
  {
    id: 'magician',
    name: 'Master Magician',
    tier: 'B',
    req: 'Obtain all staves.',
    group: 'feats',
    // TODO: which staves count isn't confirmed; mark by hand (the list is on Equipment).
    rule: { manual: true },
  },
  {
    id: 'defender',
    name: 'Master Defender',
    tier: 'B',
    req: 'Obtain all shields.',
    group: 'feats',
    // TODO: which shields count isn't confirmed; mark by hand (the list is on Equipment).
    rule: { manual: true },
  },
];
