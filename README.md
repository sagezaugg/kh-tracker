# Kingdom Hearts 100% Tracker

An unofficial, fan-made 100% completion tracker for **Kingdom Hearts Final Mix** and **Kingdom Hearts II Final Mix**,
with save-file import. It's a single-page app (Vite + React 18 + TypeScript, React Router v6, Zustand) styled after
the KH2 pause menu. One site, with a game switcher in the header.

**Live site: https://kh-tracker.vercel.app**

Each game tracks three definitions of 100% from one checklist: **Jiminy's Journal**, **Trophies** (Platinum
excluded from the count) and **Everything**. Importing a PC save fills in most of the checklist; the file never
leaves the browser. In Chrome and Edge the tracker can also watch the save file and re-import it every time the game
saves (Config, Auto re-import).

| Game  | Routes   | Save import                                                 | Filled in from the save                                                                                                                          |
| ----- | -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| KH1FM | `/kh1/…` | `KHFM.png` / `KHFM_WW.png` (PC)                             | 216 chests, most event rewards and story events, Ansem's Reports, puppies, Sora LV, magic, summons, Keyblades, staves, shields, Ultima materials |
| KH2FM | `/kh2/…` | `KHIIFM.png` / `KHIIFM_WW.png` (PC), PS2 saves, PCSX2 cards | 317 chests, 89 rewards, 52 bosses, Ansem Reports, Drive Forms, magic, summons, Keyblades, superbosses                                            |

There's also a **save diff tool** at `/tools/save-diff`: load a save from before and after an in-game event to see
every byte and bit that changed. It's how the remaining unknown flags get mapped.

> Unofficial fan tool. Not affiliated with Square Enix or Disney. No game logos, artwork, fonts, music or sounds are
> used.

## Local development

Requires **Node 20+** and npm.

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173. Other scripts:

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm run typecheck` | `tsc --noEmit` (strict)                                  |
| `npm run lint`      | ESLint (typescript-eslint, react-hooks) + Prettier check |
| `npm run format`    | Prettier write                                           |
| `npm test`          | Vitest + React Testing Library (+ axe smoke test)        |
| `npm run build`     | Typecheck, then a production build into `dist/`          |
| `npm run preview`   | Serve `dist/` locally                                    |

## Project layout

```
src/
  core/      game-agnostic engine: types, rules (trophies), progress, importSave, detect (save probes),
             store factory (Zustand + persist), backup codes, storage, file handles, save watcher, save diff
  games/
    types.ts       GameDefinition: nav, routes, catalog, store, save support, wallet, backups
    context.ts     useGame / useTracker / useProgress / useGameHref
    registry.ts    GAMES, in switcher order
    kh1/           data (locations.json, constants, trophies, journal, synthesis), save, model, routes
    kh2/           data, save, model, routes, migrations (prototype backup codes)
  screens/   screens shared by every game: Status, Worlds, Trophies, Config
  shell/     frame, game switcher, home (Choose a Game), game shell, not-found pages, save diff tool
  ui/        CommandMenu, HandCursor, HelpBar, Gauge, PartyCard, ChecklistRow, Section, Stepper, TrophyCard, …
  styles/    tokens.css (palette, fonts, motion), global.css
reference/   the prototype and designs KH2 was ported from
data/        source copy of the KH2 location data
scripts/     extract_locations.py (KH2), kh1/extract_locations.py (KH1)
```

Adding a game means adding a `games/<id>/` folder that exports a `GameDefinition` and listing it in the registry.
Trophies are never stored: they're evaluated from progress on every change (memoized per progress object). Each game
has its own store (`kh1fm-tracker`, `kh2fm-tracker` in localStorage), backups and save watcher.

## Tests

```bash
npm test
```

Covers both save parsers (hand-built buffers, original-game saves, a PCSX2 card, empty files, slot labels),
detection, trophy rules, scoring, import sync/add with manual overrides, backup codes, storage failures, the watcher,
the save diff, every KH2 screen's main interactions, the game switcher, and an axe accessibility pass over every
route of both games.

### Real-save fixtures

Put real PC saves in `tests/fixtures/` (gitignored, never committed). The fixture suites skip when a file is missing.

- `tests/fixtures/KHIIFM.png`: Slot 1, LV 45, 3,779 munny, Critical, saved in TWTNW; chests 272/317, rewards 78/89,
  story bosses 50/52, reports 13/13, Keyblades 19/24, forms 5/5/2/4/1, magic 3/2/3/3/3/3, summon LV 1, all charms,
  torn pages 5/5, no Proofs, Final Xemnas not detected.
- `tests/fixtures/KHFM.png`: Slot 1 LV 100, 23,666 munny, Proud, End of the World (chests 208/216, event rewards
  58, story events 98, reports 13/13, Keyblades 18/18, puppies 99, magic all LV 3, six summons) and Slot 2 LV 54,
  2,479 munny, Proud, Neverland.

## Regenerating the location data

**KH2** is built from the Archipelago KH2 world:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/ArchipelagoMW/Archipelago.git ap
(cd ap && git sparse-checkout set worlds/kh2)
python3 scripts/extract_locations.py ap/worlds/kh2 data/kh2fm-locations.json
cp data/kh2fm-locations.json src/games/kh2/data/locations.json
```

**KH1** is built from the Archipelago KH1 world plus the KH-1FM-AP-LUA connector, pinned to the commits the current
data came from. The usage line at the top of `scripts/kh1/extract_locations.py` has the exact clone commands:

```bash
python3 scripts/kh1/extract_locations.py ap/worlds/kh1/Locations.py kh1lua/1fmAPConnector.lua src/games/kh1/data/locations.json
```

Then run `npm test`: the data tests check totals and id uniqueness, and the fixture tests check real saves.

## Deploying (Vercel)

The live site is the Vercel project `kh-tracker`, linked to this repository: every push to `main` deploys to
production at https://kh-tracker.vercel.app, and other branches get preview URLs.

`vercel.json` sets the build command (`npm run build`), the output directory (`dist`) and an SPA rewrite so deep links
like `/kh2/worlds/tt` work on a hard refresh.

- **Git integration:** push the repo to GitHub, then in Vercel choose _Add New → Project_, import the repo and keep
  the detected settings. Every push gets a preview URL; the default branch deploys to production.
- **CLI:** `npm i -g vercel`, then `vercel login`, then `vercel` for a preview deploy and `vercel --prod` for
  production.

## Credits

- Location data: [Archipelago](https://github.com/ArchipelagoMW/Archipelago) KH1 and KH2 worlds (MIT).
- KH1 save flags: derived from [KH-1FM-AP-LUA](https://github.com/gaithern/KH-1FM-AP-LUA)'s `1fmAPConnector.lua`
  (MIT): its Steam memory addresses minus `0x2DE9360` give the save offset.
- Save structure: [Kingdom Save Editor](https://github.com/Xeeynamo/KingdomSaveEditor) (GPL-3.0). Its documented
  offsets, item ids and enums are referenced; none of its code is copied.
- Trophy names, tiers and requirements: KHWiki, Exophase, PSTHC, PlayStation LifeStyle, Gamer Guides. Journal
  sections, synthesis lists and Ultima Weapon recipes: KHWiki and Gamer Guides.

## License

MIT, see [LICENSE](LICENSE). Kingdom Hearts is a trademark of its owners; this is an unofficial fan project and
includes no game assets.

## Open questions (left as TODOs, with manual fallbacks)

Nothing below is guessed; each is a manual check or input in the UI.

**KH2:** see `reference/completion-definitions.md`. The game-cleared (Final Xemnas) flag, entry lists for six Journal
sections, the full mini-game list, Mushroom XIII count, and save offsets for the Anti Form counter, feats, Gummi ranks,
synthesis materials, Synthesis Notes and Moogle level.

**KH1:** entry counts for Chronicles, Characters and Mini-games; the Trinity mark
counter; cup wins, solo and time-trial records (outside the save slot by the connector's addresses); synthesis
record; gummi records; prizes; whether `0x1400` counts torn pages held or delivered; which staves and shields Master
Magician and Master Defender need.

## Decisions

Choices the brief didn't settle, with the default picked:

1. **Menu order** (KH2) follows the route table and the What's Left design: Status, What's Left, Worlds, Journal,
   Trophies, Synthesis, Drive & Magic, Keyblades, Records, Config. KH1 mirrors it, with Magic & Summons and Equipment
   in place of Drive & Magic and Keyblades.
2. **Duplicate KH2 location keys.** The extractor truncates keys to 24 characters, so five pairs of chests share a key
   (e.g. two `ElephantGraveyardMythril…` chests with different flags). The first keeps the prototype id; the second
   gets `-2`. A prototype backup with the shared id checks both rows. The real-save fixture still gives 272/317.
3. **Data-model extensions.** `SaveProbe` gains `level` (clamped byte, optionally gated by an unlock bit), `bitCount`
   (set bits in a range, for KH1's 99 puppies) and `listHas` (KH1's owned-summon list); an item may list several
   probes (any match counts), which is how a Keyblade counts if owned _or_ equipped. `Rule` gains `{ section }` (a
   Journal section complete) and `{ count, atLeast }` ("open 100 chests", "synthesize 15 items").
4. **Level ids** are `lv.sora`, `lv.valor`, … stored in `values`.
5. **Manual overrides.** Any change by hand (row toggle, stepper, Check all/Clear, trophy mark, game-cleared toggle)
   records an override. Both _Sync_ and _Only add_ skip overridden items. Overrides are cleared by _Reset_.
6. **Backups.** Codes are `{ app, v: 3, s: Progress & { profile } }` with `app` = `kh1fm-100` or `kh2fm-100`. KH2's
   prototype v1/v2 codes still restore.
7. **Store shape.** One persisted store per game; progress lives in `playthroughs[id]` with an `activeId`; the profile
   and NEW! flags are per game. Persisted data is validated on load, and storage failures fall back to memory.
8. **No Web Worker.** Scanning a full PC save (7 MB for KH2, 18 MB for KH1) takes well under 100 ms.
9. **What's Left.** KH2: Count toward / Hints / Group by live in the query string; quick wins score = remaining items
   - 0.5 per item that counts toward an unearned trophy + 0.5 per Ultima item; _Area_ hides chest contents with a
     name-splitting heuristic (`games/kh2/model/areas.ts`). KH1 has a simpler version (Count toward, world groups,
     trophies within reach).
10. **Synthesis.** KH2: with the Energy Crystal toggle on, the recipe lists Orichalcum+ ×7 plus Energy Crystal ×1;
    material counts, Synthesis Notes and Moogle level are manual. KH1: Ultima material counts are read from the
    inventory (item ids from Kingdom Save Editor); the 33 synthesis items are manual checks.
11. **Accessibility.** The help bar shows hover/focus hints visually, but only toasts are announced. Small buttons keep
    a 44px hit area.
12. **Credits** sit in the site footer rather than a separate page.
13. **Auto re-import** uses the File System Access API (Chrome and Edge). Each game keeps its own file handle in
    IndexedDB and its own watcher; watchers run whichever game is showing, and toasts name the game. A new version is
    imported once it holds still for two 3-second checks, reusing the last import's slot and mode.
14. **No screen transition.** The prototype's wipe-and-shimmer on route change was removed at the owner's request.
15. **Multi-game layout.** Games live under `/kh1` and `/kh2`; `/` is a Choose a Game page. No redirects from the old
    single-game paths (the site wasn't deployed yet). The switcher keeps you on the same screen when the other game
    has it.
16. **KH1 save layout and flags.** Verified against a real Steam save: 200 entries at stride `0x16C40` from `0x10D30`,
    alternating game data (magic `0x05`) and a "KHSQ" preview, so save _n_ is entry 2(*n*−1). Location flags are
    derived from the AP connector's memory addresses (Steam − `0x2DE9360`); that base matches three independent fields
    and Kingdom Save Editor, but individual flags haven't each been checked in-game.
17. **KH1 trophy triggers.** Automatic only where a flagged event exists: five "Seal Keyhole" events, the superboss
    events, Journal sections, Keyblades, chest count, synthesis count. Two inferences are flagged in code and should
    be verified: Honest Soul (Monstro) uses Parasite Cage II, and Blade Master needs the 18 Keyblades Sora keeps (not the
    Dive-to-the-Heart Dream weapons or the Wooden Sword). Level Master is Silver (PlayStation LifeStyle; KHWiki shows
    Bronze), which matches the 1/2/4/49 tier split.
18. **KH1 location types.** Worlds list chests, event rewards and story events from the Archipelago data, plus prizes
    (manual). Randomizer-only types (level slots, synth slots, starting accessories) and Destiny Islands' unflagged
    raft-gathering chores are left out; Ansem's Report events move to the Journal.
19. **KH1 game cleared is manual by design.** KH1FM can't save after the final battle, so no save can show it; the
    Config toggle drives the three difficulty-clear trophies.
20. **First in-game check of the derived KH1 flags.** The real save reads all 12 Neverland Clock Tower doors as
    unopened, and the owner confirmed they never opened them.
21. **Per-game themes.** Each game shell sets `data-game` on the frame, and `tokens.css` overrides the blue colour
    family for KH1 (sea teal, after Destiny Islands); KH2 keeps the original blue. The selection red, golds and
    oranges stay shared so the KH look carries across. KH1 text pairs were checked at 6:1 or better.
22. **Site navigation.** The header holds Home (the game list), the game switcher and a Save Diff link; each game's
    Config also links to the save diff tool. Below 480px the decorative MENU tag hides and Save Diff shows only its
    icon, so the nav fits on one row.
