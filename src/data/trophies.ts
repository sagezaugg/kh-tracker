import type { Rule } from '../model/types';
import { FINAL_XEMNAS_ID } from './locations';

export type TrophyTier = 'P' | 'G' | 'S' | 'B';
export type TrophyGroup = 'plat' | 'story' | 'battle' | 'coliseum' | 'journal' | 'feats' | 'gummi';

export interface TrophyDef {
  id: string;
  name: string;
  tier: TrophyTier;
  req: string;
  group: TrophyGroup;
  /** Undefined only for the Platinum, which unlocks from the other 50. */
  rule?: Rule;
  /** Ending trophies show "Game cleared · Critical" instead of n / m. */
  clear?: boolean;
}

export const TIER_NAMES: Readonly<Record<TrophyTier, string>> = {
  P: 'Platinum',
  G: 'Gold',
  S: 'Silver',
  B: 'Bronze',
};

export const TROPHY_GROUPS: readonly (readonly [Exclude<TrophyGroup, 'plat'>, string])[] = [
  ['story', 'Story'],
  ['battle', 'Battle'],
  ['coliseum', 'Coliseum'],
  ['journal', 'Journal'],
  ['feats', 'Feats'],
  ['gummi', 'Gummi Ship'],
];

const AW_IDS = [
  'pg.1',
  'pg.2',
  'pg.3',
  'pg.4',
  'pg.5',
  'mg.a-blustery-rescue',
  'mg.hunny-slider',
  'mg.balloon-bounce',
  'mg.the-expotition',
  'mg.the-hunny-pot',
];
export const DATA_ORG_IDS = [
  'do.xemnas',
  'do.xigbar',
  'do.xaldin',
  'do.vexen',
  'do.lexaeus',
  'do.zexion',
  'do.saix',
  'do.axel',
  'do.demyx',
  'do.luxord',
  'do.marluxia',
  'do.larxene',
  'do.roxas',
];
const MUSHROOM_IDS = Array.from({ length: 12 }, (_, i) => `mu.${i + 1}`);

const cleared: Rule = { all: [FINAL_XEMNAS_ID] };
const clearOn = (atLeast: 0 | 1 | 2 | 3): Rule =>
  atLeast === 0 ? cleared : { and: [cleared, { save: 'difficulty', atLeast }] };

/**
 * All 51 trophies, ported from the prototype. World trophies use each world's last story boss as
 * the trigger, an inference still to verify (open question 6).
 */
export const TROPHIES: readonly TrophyDef[] = [
  { id: 'plat', name: 'KINGDOM HEARTS II Master', tier: 'P', req: 'Earn every other trophy', group: 'plat' },
  {
    id: 'critical',
    name: 'Critical Competitor',
    tier: 'G',
    req: 'Finish the game on Critical',
    rule: clearOn(3),
    group: 'story',
    clear: true,
  },
  {
    id: 'proud',
    name: 'Proud Player',
    tier: 'S',
    req: 'Finish the game on Proud or higher',
    rule: clearOn(2),
    group: 'story',
    clear: true,
  },
  {
    id: 'ambitious',
    name: 'Ambitious Adventurer',
    tier: 'S',
    req: 'Finish the game and watch the ending',
    rule: clearOn(0),
    group: 'story',
    clear: true,
  },
  {
    id: 'level',
    name: 'Level Master',
    tier: 'S',
    req: 'Raise Sora to LV 99',
    rule: { item: 'lv.sora', atLeast: 99 },
    group: 'feats',
  },
  {
    id: 'myhero',
    name: 'My Hero',
    tier: 'B',
    req: 'Get rescued by King Mickey in a boss fight',
    rule: { all: ['ft.myhero'] },
    group: 'story',
  },
  {
    id: 'lw',
    name: 'Lingering Will',
    tier: 'S',
    req: 'Defeat Lingering Will',
    rule: { all: ['sb.lw'] },
    group: 'battle',
  },
  {
    id: 'seph',
    name: 'One-Winged Angel',
    tier: 'S',
    req: 'Defeat Sephiroth',
    rule: { all: ['sb.seph'] },
    group: 'battle',
  },
  {
    id: 'data',
    name: 'To Rule Them All',
    tier: 'G',
    req: 'Defeat all 13 Data Organization members',
    rule: { all: DATA_ORG_IDS },
    group: 'battle',
  },
  {
    id: 'mush',
    name: 'Mushroom Master',
    tier: 'S',
    req: 'Satisfy every Mushroom XIII',
    rule: { all: MUSHROOM_IDS },
    group: 'battle',
  },
  {
    id: 'cup1',
    name: 'Rookie',
    tier: 'B',
    req: 'Win the Pain and Panic Cup',
    rule: { all: ['cup.pain-and-panic-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup2',
    name: 'Novice Hero',
    tier: 'B',
    req: 'Win the Cerberus Cup',
    rule: { all: ['cup.cerberus-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup3',
    name: 'Artisan Hero',
    tier: 'B',
    req: 'Win the Titan Cup',
    rule: { all: ['cup.titan-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup4',
    name: 'True Hero',
    tier: 'B',
    req: 'Win the Goddess of Fate Cup',
    rule: { all: ['cup.goddess-of-fate-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup5',
    name: 'Coliseum Competitor',
    tier: 'B',
    req: 'Win the Pain and Panic Paradox Cup',
    rule: { all: ['cup.pain-and-panic-paradox-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup6',
    name: 'Coliseum Star',
    tier: 'B',
    req: 'Win the Cerberus Paradox Cup',
    rule: { all: ['cup.cerberus-paradox-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup7',
    name: 'Hero of the Coliseum',
    tier: 'B',
    req: 'Win the Titan Paradox Cup',
    rule: { all: ['cup.titan-paradox-cup'] },
    group: 'coliseum',
  },
  {
    id: 'cup8',
    name: 'Coliseum Champion',
    tier: 'S',
    req: 'Win the Hades Paradox Cup',
    rule: { all: ['cup.hades-paradox-cup'] },
    group: 'coliseum',
  },
  {
    id: 'stt',
    name: "Summer's End",
    tier: 'B',
    req: "Finish Roxas's prologue",
    rule: { all: ['w.Axel2'] },
    group: 'story',
  },
  {
    id: 'tr',
    name: 'A Timeless World',
    tier: 'B',
    req: 'Finish Timeless River',
    rule: { all: ['w.FuturePete'] },
    group: 'story',
  },
  {
    id: 'lod',
    name: 'Above Honor',
    tier: 'B',
    req: 'Finish The Land of Dragons',
    rule: { all: ['w.StormRider'] },
    group: 'story',
  },
  {
    id: 'bc',
    name: 'A Budding Romance',
    tier: 'B',
    req: "Finish Beast's Castle",
    rule: { all: ['w.Xaldin'] },
    group: 'story',
  },
  {
    id: 'oc',
    name: 'Hail the Hero',
    tier: 'B',
    req: 'Finish Olympus Coliseum',
    rule: { all: ['w.Hades'] },
    group: 'story',
  },
  {
    id: 'pr',
    name: 'Lifting the Curse',
    tier: 'B',
    req: 'Finish Port Royal',
    rule: { all: ['w.GrimReaper2'] },
    group: 'story',
  },
  {
    id: 'ag',
    name: 'What Friends Are For',
    tier: 'B',
    req: 'Finish Agrabah',
    rule: { all: ['w.GenieJafar'] },
    group: 'story',
  },
  {
    id: 'ht',
    name: 'The Gift of Love',
    tier: 'B',
    req: 'Finish Halloween Town',
    rule: { all: ['w.Experiment'] },
    group: 'story',
  },
  {
    id: 'pl',
    name: 'Return of the King',
    tier: 'B',
    req: 'Finish Pride Lands',
    rule: { all: ['w.Groundshaker'] },
    group: 'story',
  },
  {
    id: 'sp',
    name: 'Electric Spark',
    tier: 'B',
    req: 'Finish Space Paranoids',
    rule: { all: ['w.MCP'] },
    group: 'story',
  },
  { id: 'aw', name: 'Always Together', tier: 'B', req: 'Finish 100 Acre Wood', rule: { all: AW_IDS }, group: 'story' },
  {
    id: 'at',
    name: 'Kindred Spirits',
    tier: 'B',
    req: 'Finish Atlantica',
    rule: { all: ['mg.a-new-day-is-dawning'] },
    group: 'story',
  },
  {
    id: 'tt',
    name: 'A Taste of the Past',
    tier: 'B',
    req: 'Finish Twilight Town',
    rule: { all: ['w.BetwixtandBetween'] },
    group: 'story',
  },
  {
    id: 'reunion',
    name: 'Reunion',
    tier: 'B',
    req: 'Reunite with Riku and Kairi',
    rule: { all: ['w.XigbarBonus'] },
    group: 'story',
  },
  {
    id: 'j1',
    name: 'Searcher',
    tier: 'B',
    req: 'Journal: every Ansem Report',
    rule: { section: 'reports' },
    group: 'journal',
  },
  {
    id: 'j2',
    name: 'Professor',
    tier: 'B',
    req: 'Journal: every Character File',
    rule: { section: 'charfiles' },
    group: 'journal',
  },
  {
    id: 'j3',
    name: 'Heartless Highbrow',
    tier: 'B',
    req: 'Journal: every Heartless entry',
    rule: { section: 'heartless' },
    group: 'journal',
  },
  {
    id: 'j4',
    name: 'Nobody Know-It-All',
    tier: 'B',
    req: 'Journal: every Nobody entry',
    rule: { section: 'nobodies' },
    group: 'journal',
  },
  {
    id: 'j5',
    name: 'Treasure Hunter',
    tier: 'B',
    req: 'Journal: every Treasure entry',
    rule: { section: 'treasures' },
    group: 'journal',
  },
  {
    id: 'j6',
    name: 'Puzzler',
    tier: 'B',
    req: 'Journal: every Puzzle entry',
    rule: { section: 'puzzles' },
    group: 'journal',
  },
  {
    id: 'j7',
    name: 'Navigator',
    tier: 'B',
    req: 'Journal: every Map entry',
    rule: { section: 'maps' },
    group: 'journal',
  },
  {
    id: 'j8',
    name: 'Conqueror',
    tier: 'B',
    req: 'Journal: every Mission entry',
    rule: { section: 'missions' },
    group: 'journal',
  },
  {
    id: 'j9',
    name: 'Minigame Maniac',
    tier: 'B',
    req: 'Journal: every Mini-game entry',
    rule: { section: 'minigames' },
    group: 'journal',
  },
  {
    id: 'j10',
    name: 'Limit Master',
    tier: 'B',
    req: 'Journal: every Combo Attack entry',
    rule: { section: 'combos' },
    group: 'journal',
  },
  {
    id: 'j11',
    name: 'Craftsman',
    tier: 'B',
    req: 'Journal: every Synthesis Notes entry',
    rule: { section: 'synthesis' },
    group: 'journal',
  },
  {
    id: 'j12',
    name: 'Seeker',
    tier: 'B',
    req: 'Journal: every Character Links entry',
    rule: { section: 'links' },
    group: 'journal',
  },
  {
    id: 'skate',
    name: 'Pro Skater',
    tier: 'B',
    req: 'Score 5,000 points skateboarding',
    rule: { all: ['ft.skate'] },
    group: 'feats',
  },
  {
    id: 'struggle',
    name: 'Struggle Champion',
    tier: 'B',
    req: "Win a Struggle by taking all your opponent's orbs",
    rule: { all: ['ft.struggle'] },
    group: 'feats',
  },
  {
    id: 'anti',
    name: 'Corroded by Darkness',
    tier: 'B',
    req: 'Turn into Anti Form 13 times',
    rule: { item: 'lv.anti', atLeast: 13 },
    group: 'feats',
  },
  {
    id: 'veteran',
    name: 'Veteran Pilot',
    tier: 'B',
    req: 'S rank on any Gummi mission',
    rule: { all: ['gm.veteran'] },
    group: 'gummi',
  },
  {
    id: 'ace',
    name: 'Ace Pilot',
    tier: 'B',
    req: 'S rank on every route of one Gummi mission',
    rule: { all: ['gm.ace'] },
    group: 'gummi',
  },
  {
    id: 'topgun',
    name: 'Top Gun',
    tier: 'B',
    req: 'S rank on every route of one special Gummi mission',
    rule: { all: ['gm.topgun'] },
    group: 'gummi',
  },
  {
    id: 'collector',
    name: 'Gummi Ship Collector',
    tier: 'S',
    req: 'Collect every Gummi Ship model',
    rule: { all: ['gm.collector'] },
    group: 'gummi',
  },
];

/** The 50 trophies that count toward the Trophies profile (Platinum excluded). */
export const SCORED_TROPHY_COUNT = TROPHIES.length - 1;

/** Manual "Mark earned" overrides are stored as checks under this prefix, like the prototype. */
export const trophyOverrideId = (trophyId: string): string => `tro.${trophyId}`;
