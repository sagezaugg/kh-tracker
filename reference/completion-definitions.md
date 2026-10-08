# Completion definitions & data model (summary)

Condensed from the design doc "KH2FM Tracker — Completion Definitions & Data Model" (2026-10-08).

## Three views of 100%

One master checklist; each view is a filter plus a scoring rule.

| View | What counts | Scoring |
| --- | --- | --- |
| Jiminy's Journal | The 12 Journal sections | Average of the 12 section ratios |
| Trophies | 50 trophies (Platinum excluded) | Whole trophies earned / 50; per-trophy progress shown but no partial credit |
| Everything | Every item in the tracker | Average of category ratios (see prototype `model()`) |

## Journal sections (each also unlocks a trophy)

| Section | Trophy | Data status |
| --- | --- | --- |
| Ansem Reports | Searcher | 13 reports, save-detected |
| Treasures | Treasure Hunter | 317 chests, save-detected; totals not yet checked against the Journal |
| Puzzles | Puzzler | 6 puzzles, manual |
| Maps | Navigator | 40 map pickups (subset of world items), save-detected |
| Mini-games | Minigame Maniac | 16 listed, partial list |
| Synthesis Notes | Craftsman | single manual check for now (69 items) |
| Character Files | Professor | single manual check — entry list TODO |
| The Heartless | Heartless Highbrow | single manual check — entry list TODO |
| The Nobodies | Nobody Know-It-All | single manual check — entry list TODO |
| Missions | Conqueror | single manual check — entry list TODO |
| Combo Attacks | Limit Master | single manual check — entry list TODO |
| Character Links | Seeker | single manual check — entry list TODO |

## Trophies

All 51 with tiers and rules are in `reference/prototype/Main.dc.html` (`TROPHIES`). Tier counts: 1 Platinum, 2 Gold, 8 Silver, 40 Bronze.
Rule kinds: `all` (item ids), `lv` (value ≥ n), `sec` (Journal section complete), `clear` (Final Xemnas beaten + difficulty ≥ n), `plat` (all others).
World-completion trophies use each world's last story boss as the trigger — an inference to verify.

Sources: Exophase trophy list (names/order), PSTHC PS4 list (tiers/requirements), Gamer Guides trophy guide, KH Wiki Jiminy's Journal.

## Everything-only goals

Every Keyblade (24), Drive Forms LV 7, Summons LV 7 + 4 charms, Magic -ga tier, the Proofs + Promise Charm, Absent Silhouettes (5), event rewards, every ability learned, every Gummi route S rank, custom goals.

## Open questions (do not invent answers — leave TODOs)

1. Final Xemnas: the Archipelago flag (0x1ED8 bit 1) was not set in a real vanilla Critical clear-adjacent save. Find the vanilla "game cleared" flag; until then it's a manual toggle.
2. Entry lists for Character Files, Heartless, Nobodies, Missions, Combo Attacks, Character Links — and whether the save stores Journal flags directly.
3. Do 317 chests match the Journal's per-world Treasure counts?
4. Full Journal mini-game list; Mushroom XIII count (12 vs 13).
5. Save values for: Anti Form counter, skateboard high score, Struggle result, Gummi ranks/blueprints, synthesis material counts, Synthesis Notes progress, Moogle level.
6. Confirm which boss flag fires each world-completion trophy.

Method for most of these: a save-diff tool (upload two saves from before/after an event, list changed bytes/bits).
