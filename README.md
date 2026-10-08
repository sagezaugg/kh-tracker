# KH2 Final Mix 100% Tracker

An unofficial, fan-made 100% completion tracker for **Kingdom Hearts II Final Mix**, with save-file import. It's a
single-page app (Vite + React 18 + TypeScript, React Router v6, Zustand) styled after the KH2 pause menu.

Three definitions of 100% are tracked from one checklist: **Jiminy's Journal** (12 sections), **Trophies** (50 + the
Platinum) and **Everything**. Importing a PC save fills in chests, event rewards, story bosses, Ansem Reports, Drive
Forms, magic, summons, Keyblades and more. The save file never leaves the browser.
In Chrome and Edge the tracker can also watch the save file and re-import it every time the game saves
(Config, Auto re-import).

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
  data/     locations.json (copied from data/), constants, trophies, journal, keyblades, synthesis
  save/     parseSave.ts, detect.ts, offsets.ts       pure functions, no React
  model/    items (registry), rules (trophies), scoring, remaining (What's Left), synthesis, importSave, areas
  state/    store.ts (Zustand + persist), migrations.ts, backup.ts, storage.ts, ui.ts (transient)
  ui/       CommandMenu, HandCursor, HelpBar, Gauge, PartyCard, ChecklistRow, Section, Stepper, TrophyCard, …
  routes/   one file per screen
  styles/   tokens.css (palette, fonts, motion), global.css
reference/  the prototype and designs this was ported from
data/       source copy of the location data
scripts/    extract_locations.py
```

Trophies are never stored: they're evaluated from progress on every change (memoized per progress object).

## Tests

```bash
npm test
```

Covers the save parser (hand-built buffers, a non-Final Mix save, an ECC-wrapped PCSX2 card, an empty file, PC slot
labels), detection, trophy rules, scoring, import sync/add with manual overrides, backup codes (prototype v1/v2 and
v3), storage failures, every screen's main interactions, and an axe accessibility pass over every route.

### Real-save fixture

Put a real PC save at `tests/fixtures/KHIIFM.png` (it's in `.gitignore` and never committed). When it's present,
`tests/fixture.test.ts` checks it against the expected values (Slot 1, LV 45, 3,779 munny, Critical, saved in TWTNW;
chests 272/317, rewards 78/89, story bosses 50/52, reports 13/13, Keyblades 19/24, forms 5/5/2/4/1, magic 3/2/3/3/3/3,
summon LV 1, all charms, torn pages 5/5, no Proofs, Final Xemnas not detected). Without the file those tests are
skipped.

## Regenerating the location data

`data/kh2fm-locations.json` is built from the Archipelago KH2 world:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/ArchipelagoMW/Archipelago.git ap
(cd ap && git sparse-checkout set worlds/kh2)
python3 scripts/extract_locations.py ap/worlds/kh2 data/kh2fm-locations.json
cp data/kh2fm-locations.json src/data/locations.json
```

Then run `npm test`: `tests/data.test.ts` checks the totals (317 chests, 89 rewards, 52 bosses) and id uniqueness.

## Deploying (Vercel)

`vercel.json` sets the build command (`npm run build`), the output directory (`dist`) and an SPA rewrite so deep links
like `/worlds/tt` work on a hard refresh.

- **Git integration:** push the repo to GitHub, then in Vercel choose _Add New → Project_, import the repo and keep
  the detected settings. Every push gets a preview URL; the default branch deploys to production.
- **CLI:** `npm i -g vercel`, then `vercel login`, then `vercel` for a preview deploy and `vercel --prod` for
  production.

## Credits

- Location save flags: [Archipelago KH2 world](https://github.com/ArchipelagoMW/Archipelago/tree/main/worlds/kh2)
  (MIT).
- Save structure: [Kingdom Save Editor](https://github.com/Xeeynamo/KingdomSaveEditor) (GPL-3.0). Its documented
  offsets are referenced; none of its code is copied.
- Trophy names, tiers and requirements: Exophase, PSTHC, Gamer Guides. Journal sections: KH Wiki. Ultima Weapon
  recipe: KHWiki and Gamer Guides.

## Open questions (left as TODOs, with manual fallbacks)

See `reference/completion-definitions.md`. In short: the game-cleared (Final Xemnas) flag, entry lists for six
Journal sections, the full mini-game list, Mushroom XIII count, and save offsets for the Anti Form counter, feats,
Gummi ranks, synthesis materials, Synthesis Notes and Moogle level. None of these are guessed; each is a manual check
or input in the UI.

## Decisions

Choices the brief didn't settle, with the default picked:

1. **Menu order** follows the route table and the What's Left design: Status, What's Left, Worlds, Journal, Trophies,
   Synthesis, Drive & Magic, Keyblades, Records, Config.
2. **Duplicate location keys.** The extractor truncates keys to 24 characters, so five pairs of chests share a key
   (e.g. two `ElephantGraveyardMythril…` chests with different flags). The first keeps the prototype id; the second
   gets `-2`. A prototype backup with the shared id checks both rows, matching what the prototype displayed. The real-save fixture still gives the expected
   272/317 chests.
3. **Data-model extensions.** `SaveProbe` gains a `level` probe (clamped byte, optionally gated by an unlock bit) and
   an item may list several probes (any match counts), which is how a Keyblade counts if owned _or_ equipped. `Rule`
   gains `{ section }` (a Journal section complete), mirroring the prototype's `sec`.
4. **Level ids** are `lv.sora`, `lv.valor`, … stored in `values`. The prototype's `lv` map migrates to these.
5. **Manual overrides.** Any change by hand (row toggle, stepper, Check all/Clear, trophy mark, game-cleared toggle)
   records an override. Both _Sync_ and _Only add_ skip overridden items. Overrides are cleared by _Reset_. Restoring
   a prototype backup starts with none, except the game-cleared toggle, which no save flag is known to set.
6. **Backups.** New codes are `{ app: 'kh2fm-100', v: 3, s: Progress & { profile } }` and keep overrides. Prototype v1
   and v2 codes still restore. On first load, progress in the prototype's localStorage key carries over.
7. **Store shape.** Progress lives in `playthroughs[id]` with an `activeId`; the selected profile and NEW! flags are
   global. Persisted data is validated on load, and storage failures fall back to memory.
8. **No Web Worker.** Scanning a full 7 MB PC save takes well under 100 ms, so parsing stays on the main thread.
9. **What's Left.** Count toward / Hints / Group by live in the query string (`?count=&hints=&group=`); Count
   defaults to the active profile. Quick wins score = remaining items + 0.5 per item that counts toward an unearned
   trophy + 0.5 per Ultima item. Groups after the first three start collapsed; each list shows 6 rows before "Show
   more". _Area_ hides chest contents using a name-splitting heuristic (`src/model/areas.ts`) with a small override
   table, since the data has no separate area field. _Full_ shows names until real hint text exists.
10. **Synthesis.** With the Energy Crystal toggle on, the recipe lists Orichalcum+ ×7 plus Energy Crystal ×1. The
    design's "Rank S" chip and "Recipe tables unlocked" stat are left out because the brief gives no data for them.
    Material counts, Synthesis Notes and Moogle level are manual numbers stored under `syn.*` in `values`. The Moogle
    Orichalcum+ is a manual check.
11. **Accessibility.** The help bar shows hover/focus hints visually, but only toasts are announced (a live region
    that changed on every hover would be noisy). Small buttons keep a 44px hit area.
12. **Credits** sit in the site footer rather than a separate page.
13. **Copy tweaks.** The Sync note now says it leaves hand-made changes alone, and the import toast pluralizes
    "trophy".
14. **Auto re-import** uses the File System Access API (Chrome and Edge only; other browsers keep the one-off import
    and the toggle explains why it's unavailable). The picked file's handle is stored in IndexedDB, and its modified
    time is checked every 3 seconds. A new version is imported only after it has stayed the same for two checks, so a
    save the game is still writing isn't read half-finished. Re-imports reuse the slot and mode (Sync or Only add)
    of the last manual import and, like any import, leave hand-made changes alone. The setting is on by default.
    After a page reload the browser usually asks again before reading the file, so Config shows "Resume watching".
15. **No screen transition.** The prototype's wipe-and-shimmer on route change was removed at the owner's request.
