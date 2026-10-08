# Build: KH2 Final Mix 100% Completion Tracker

You're turning a working prototype into a production TypeScript + React single-page app with real URL routing, deployed on Vercel. The prototype, its data and the design decisions are all in this folder. Read everything below before writing code, then work through the milestones in order.

## What's in this folder

| Path | What it is |
| --- | --- |
| `reference/prototype/Main.dc.html` | The working prototype: all tracker logic, save parser, trophy rules, styles and copy. **Source of truth for behavior, constants and look.** It's a custom component format (`<x-dc>` template + a `class Component extends DCLogic` script with `renderVals()`); `{{x}}` holes, `<sc-if>` and `<sc-for>` are its templating. Port the behavior, not the format. |
| `reference/prototype/Synthesis.dc.html` | Static design for the Synthesis screen (not yet functional). |
| `reference/prototype/Remaining.dc.html` | Static design for the What's Left screen (not yet functional). |
| `reference/completion-definitions.md` | The three definitions of 100%, Journal sections, trophy rule kinds, and open questions. |
| `data/kh2fm-locations.json` | 317 chests, 89 event rewards, 52 story bosses across 15 worlds, each with its save-slot bit flag. The prototype fetches an older copy from a `/_blob/…` URL; ignore that and import this file directly. This copy also has better visit tags (TT3, TWTNW2…). |
| `scripts/extract_locations.py` | Regenerates that JSON from the Archipelago KH2 world. |

## Stack and conventions

- **Vite + React 18 + TypeScript** (`strict: true`, no `any` in app code).
- **React Router v6** with `createBrowserRouter` — real paths, no hash routing. Still a single-page app.
- **State:** Zustand with the `persist` middleware (localStorage), wrapped so storage failures (private mode, blocked storage) don't crash the app.
- **Styling:** CSS Modules plus one global `tokens.css` holding the palette, fonts and motion tokens. No UI kit; this is a custom KH2-style look. Font: Saira Semi Condensed from Google Fonts.
- **Tests:** Vitest + React Testing Library. **Lint/format:** ESLint (typescript-eslint, react-hooks) + Prettier.
- **Node 20**, npm. Add `typecheck`, `lint`, `test` and `build` scripts.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Status: three profile gauges + category cards |
| `/left` | What's Left (build from `Remaining.dc.html` design) |
| `/worlds` → redirect to `/worlds/lod` | |
| `/worlds/:worldId` | World checklist (ids: `lod, ag, dc, tr, aw, oc, bc, sp, ht, pr, hb, pl, tt, tw, at`) |
| `/journal` | 12 Journal sections |
| `/trophies` | 51 trophies |
| `/synthesis` | Synthesis (build from `Synthesis.dc.html` design) |
| `/drive` | Drive & Magic (steppers, charms, key items, Anti Form counter) |
| `/keyblades` | Keyblades |
| `/records` | Superbosses, cups, Mushroom XIII, feats, Gummi, extras, custom goals |
| `/config` | Playthrough (difficulty + game cleared), save import, backup/restore, reset |
| `*` | Not-found screen in the same style, linking home |

Filters live in the query string where it helps sharing (`?q=` text filter, `?hide=1` hide obtained). The command menu is a list of `<NavLink>`s, and the active route drives the selected state and the hand cursor.

## Architecture

```
src/
  data/        locations.json (copied from data/), trophies.ts, journal.ts, keyblades.ts, constants.ts
  save/        parseSave.ts, detect.ts, offsets.ts   ← pure functions, no React
  model/       items.ts (item registry), rules.ts (trophy evaluation), scoring.ts (per-profile %), remaining.ts, synthesis.ts
  state/       store.ts (Zustand), migrations.ts, backup.ts
  ui/          CommandMenu, HandCursor, Panel, HelpBar, Gauge, PartyCard, ChecklistRow, Section, Stepper, TrophyCard, WorldPicker, Toast…
  routes/      one file per screen
  styles/      tokens.css, global.css
```

Use the data model from `completion-definitions.md`:

```ts
type DefinitionTag = 'journal' | 'trophy' | 'everything';
interface Item { id: string; name: string; category: string; world?: WorldId; journalSection?: JournalSection;
  tags: DefinitionTag[]; kind: 'check' | 'level' | 'counter'; max?: number; probe?: SaveProbe; source?: string; }
type SaveProbe = { type: 'bit'; offset: number; bit: number } | { type: 'count'; offset: number; min: number }
  | { type: 'byte'; offset: number } | { type: 'equip'; itemId: number };
type Rule = { all: string[] } | { item: string; atLeast: number } | { save: 'difficulty'; atLeast: Difficulty }
  | { and: Rule[] } | { or: Rule[] } | { manual: true };
interface Progress { checks: Record<string, boolean>; values: Record<string, number>;
  overrides: Record<string, 'manual'>; difficulty?: Difficulty; lastImport?: ImportMeta; }
```

- **Keep the prototype's item ids exactly** (`w.<key>`, `r.1`…`r.13`, `kb.<slug>`, `do.<id>`, `cup.<slug>`, `js.<section>`, `tro.<id>`, etc.), so backup codes from the prototype restore cleanly.
- **Never store trophies.** Evaluate them from progress every render (memoized).
- **Overrides:** record which checks the user set by hand. "Sync to this save" must not undo them; the prototype can't tell them apart, so this is new.
- **Playthroughs:** put progress under `playthroughs[id]` with an active id. A UI for several playthroughs can come later; the store shape should support it from day one.

## Save import: port exactly, then test

Port `parseSave` and `detect` from the prototype into `src/save/`, typed and pure. Key facts (all in the prototype):

- **PC file:** `KHIIFM.png` / `KHIIFM_WW.png`, size `0x6BED08`: a 0x70-byte PNG header, then 100 × 0x158-byte entry headers (only the first 0xF0 bytes are XOR-scrambled, and we don't need them), then slots at stride `0x10FC0`. Slot index = `round((offset - 0x86D0) / 0x10FC0)`.
- **Slot detection:** scan for the magic `KH2J`/`KH2U`/`KH2E` followed by a u32 version of `0x3A` (Final Mix). Versions `0x2D`/`0x2A` mean the original KH2: show the "not Final Mix" error. Sanity check: Sora's LV byte must be 1–99.
- **PCSX2 `.ps2` cards** (8,650,752 bytes): strip the 16 ECC bytes from each 528-byte page before scanning. This only works when the save is stored contiguously; say so in the UI.
- **Offsets:**
  - Sora LV `0x24FF`, munny u32 `0x2440`, difficulty byte `0x2498` (0–3), world id `0x0C`.
  - Form levels at `0x32F6/0x332E/0x3366/0x339E/0x33D6`, with unlock bits `0x36C0` (1, 2, 4, 6) and Limit at `0x36CA` bit 3. Summon level `0x3526`.
  - Magic counts at `0x3594–0x3597`, `0x35CF`, `0x35D0`.
  - Report bits at `0x36C4`–`0x36C6`. Proofs at `0x36B2–0x36B4`, Promise Charm at `0x3694`. Torn-page delivery bits at `0x1DB7`/`0x1DB8`.
  - Keyblade inventory addresses and item ids are in `KEYS`. A Keyblade also counts if it's equipped: u16 at `0x24F0`, and each Drive Form's slot at `0x32F4 + i*0x38`.
  - AS/Data/superboss flags are in `AS_LIST`, `DATA_ORG` and `SUPER`; chests, rewards and bosses come from `locations.json`.
- **The file never leaves the browser.** Use `File.arrayBuffer()`, and parse in a Web Worker if it blocks the UI noticeably.
- **Import flow to keep:** slot picker cards (LV, world, munny, difficulty) → preview (counts plus "trophies after sync") → **Sync to this save** or **Only add new checks** → toast summary. Sections that gained items show **NEW!**. Importing also sets the difficulty.

**Test fixture:** the owner will place a real PC save at `tests/fixtures/KHIIFM.png`. Add it to `.gitignore`, and skip the fixture tests when the file is missing. Expected results for that file:
- One Final Mix slot, labelled "Slot 1": LV 45, munny 3,779, **Critical**, saved in The World That Never Was.
- Chests 272/317, rewards 78/89, story bosses 50/52, Ansem Reports 13/13, Keyblades 19/24. The missing Keyblades are Mysterious Abyss, Fatal Crest, Fenrir, Ultima Weapon and Winner's Proof.
- Forms: Valor 5, Wisdom 5, Limit 2, Master 4, Final 1. Magic: Fire 3, Blizzard 2, Thunder 3, Cure 3, Magnet 3, Reflect 3. Summon level 1, all 4 charms, torn pages 5/5, Proofs 0.
- Final Xemnas is **not** detected (known open question).

Also write synthetic unit tests: a hand-built buffer with the magic and flags set, a non-FM version, an ECC-wrapped card, and an empty file.

## Screens to port (match the prototype's look and copy)

- **Status:** three gauge buttons (Journal %, Trophies n/50, Everything %). Selecting one sets the active profile, which drives the KH2-party-style category cards below it and the "TOTAL" readout in the MUNNY/LV box. Show the last-import card or the import tip.
- **Worlds:** world picker grid with per-world %, then "Check all"/"Clear", filter + hide obtained, and sections for Story Bosses / Treasures / Rewards. Save-detected rows carry the green dot.
- **Journal:** the 12 sections in the prototype order. Treasures is a summary with a link to Worlds; the six sections without entry lists are one checkbox each with the explanatory note.
- **Trophies:** tier chips, filter, hide earned, cards with cup icon, tier, requirement, progress bar and EARNED stamp. "Mark earned"/"Unmark" for anything not auto-earned. The Platinum unlocks from the other 50.
- **Drive & Magic:** steppers with pip gauges (Sora ±1/±10, forms 0–7, summon 1–7, magic 0–3 with tier names, Anti Form 0–13), plus summon charms and key items.
- **Records:** as the prototype, with the add-a-goal form.
- **Config:** Playthrough card, import, backup code (copy to clipboard, with a fallback message), restore, and reset that needs a second press.

### New: What's Left (`/left`)

Build from `Remaining.dc.html`, computed from data, not hardcoded:

- **Controls:** "Count toward" (Journal / Trophies / Everything) filters which items appear. "Hints": Counts only / Area / Full, where Area hides item names inside chests and Full shows them. Full hint text doesn't exist yet, so show names until it does. "Group by": World, or Visit (by the `visitTag` field).
- **"You're saved in" banner** from the last import's world id: remaining items in that world, plus the total remaining.
- **Quick wins:** rank worlds by remaining items. Add bonus weight for items that also complete a trophy or count as Ultima materials. Show the top 3 with the trophy chips they'd advance.
- **World groups** sorted by remaining count, collapsed after the first 3, with type tags (Chest / Reward / Boss / Map / Ultima).
- **Side panel:** "Trophies within reach" are the unearned trophies sorted by progress ratio, plus the "clear game" hint when it applies. "Beyond the worlds" shows Keyblades, superbosses and Drive Forms.

### New: Synthesis (`/synthesis`)

Build from `Synthesis.dc.html`:

- **Ultima Weapon** (Final Mix, from KHWiki and Gamer Guides): needs the Ultimate Recipe and Moogle LV 2 or higher. Recipe: Orichalcum+ ×13, Orichalcum ×1, Mythril Crystal ×1, Dense Crystal ×1, Twilight Crystal ×1, Serenity Crystal ×3. An Energy Crystal cuts the Orichalcum+ needed to 7; make the Base / With Energy Crystal toggle real. The Ultimate Recipe chest is item `w.MansionBasementCorridorU`.
- **Orichalcum+, 7 total.** Map each source to its item id so the list fills from the save:
  - `w.StarryHillOrichalcumPlus` (100 Acre Wood)
  - `w.CentralComputerCoreOrich` (Space Paranoids)
  - `w.SunsetTerraceOrichalcumP` (Twilight Town)
  - `w.TheBrinkofDespairOrichal` (TWTNW)
  - `w.MusicalOrichalcumPlus` (Atlantica)
  - `w.OrichalcumPlusGoddessofF` (Goddess of Fate Cup)
  - the Moogle "one of every item" reward (manual)
  
  Use the data's names. The design says "Central Computer Mesa", but the data calls it "Central Computer Core".
- **Material counts:** inventory offsets for materials aren't mapped yet. Make the Have column manual number inputs, stored as `values`, with a TODO for save detection. **Don't guess offsets.**
- **"Unopened chests with Ultima materials":** filter unchecked chest items whose names contain those material names.
- **Synthesis Notes stats:** manual inputs for now, out of 69 items and 9 Moogle levels.

## KH2 look and motion (all in the prototype CSS)

- **Palette and pieces:** deep navy ground with scanlines; blue framed panels; gray pill command buttons with a red-orange selected outline that pulses; the "MENU" pill header; the orange italic location title; yellow-orange italic "NEW!" tags; the MUNNY/LV/TOTAL box; a blue help bar whose text follows hover and focus.
- **Animated scanline glow:** one slow sweeping band plus drifting lines, fixed behind content, never blocking pointer events.
- **Hand cursor:** bobs beside the active item, and follows hover and keyboard focus within the menu.
- **Screen transitions:** right-to-left wipe, slide and shimmer on route change. Use the route key, or `AnimatePresence` if you add Framer Motion; plain CSS is fine.
- **Manual check-off:** the diamond spins and pops with a ring and sparks, and the row flashes gold. If the check completes a trophy, the help bar turns gold ("Trophy earned: X!"), the cup pops and Trophies gets NEW!. **Bulk changes and imports never trigger per-row animations.**
- **Progress bars** animate their width.
- **`prefers-reduced-motion`** turns all of the above off.

## Accessibility and responsiveness

Real `<button>`/`<a>`/`<input>` with labels; `aria-pressed` on toggles; `aria-current="page"` on the active menu link; visible focus rings; ≥44px touch targets; text contrast ≥4.5:1. At phone width the menu becomes a wrapping row, the hand hides, and nothing scrolls horizontally.

## Legal and credits

- **Fan project.** Use no Disney/Square Enix logos, artwork, fonts, music or sounds. Add a footer disclaimer: unofficial fan tool, not affiliated with Square Enix or Disney.
- **Credits page or footer link:** Archipelago KH2 world (MIT) for location flags; Kingdom Save Editor for save structure. KSE is **GPL-3.0**, so reference its documented offsets but don't copy its code.

## Deploy on Vercel

- Add `vercel.json` with an SPA rewrite so deep links work: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`. Build command `npm run build`, output `dist`.
- Add a README covering local dev, tests, the fixture, regenerating data, and deploying (connect the GitHub repo in Vercel, or `vercel` / `vercel --prod` from the CLI).
- If the Vercel CLI is installed and logged in, make a **preview** deploy and report the URL. **Ask before any production deploy.** If it isn't available, stop at a green `npm run build` and the documented steps.

## Milestones (commit after each)

1. Scaffold: Vite/TS/Router/Zustand/Vitest/ESLint, tokens, app shell (header, menu with hand, panel, help bar), all routes stubbed, `vercel.json`.
2. Data + save layer: port the constants, items registry and `parseSave`/`detect` with all tests passing (fixture tests included when the file is present).
3. Model: trophy rules, profile scoring, store with persist, migrations (accept prototype backup codes, `app: 'kh2fm-100'`, v1 and v2), overrides.
4. Port the existing screens: Status, Worlds, Journal, Trophies, Drive, Keyblades, Records, Config.
5. New screens: What's Left and Synthesis.
6. Motion and polish, accessibility pass, mobile pass.
7. README, credits and disclaimer, Vercel preview deploy.

**Definition of done:** `typecheck`, `lint`, `test` and `build` all pass. Every route works on a hard refresh, which proves the SPA rewrite. Importing the fixture reproduces the expected numbers. The look matches the prototype.

## Rules

- **Don't invent game data.** Anything listed in "Open questions" stays a TODO with a manual fallback. That covers offsets, entry lists, counts and drop sources.
- Keep the prototype's copy unless it's wrong for the new structure.
- Ask me if a decision isn't covered here and is costly to undo. Otherwise pick the sensible default and note it in the README under "Decisions".
