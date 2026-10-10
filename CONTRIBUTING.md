# Contributing

Thanks for helping. The most useful contributions right now are **save flags**: finding where a game stores
something the tracker can only check by hand today, or fixing one it reads wrong. Content fixes (names, missing
items, Journal lists) and bug reports are just as welcome.

## Ground rules

- **Don't invent game data.** Every offset, count, list and name needs a source: a documented save format, a
  tool's source code, a wiki page, or your own before/after save comparison. Put the source in a comment next to
  the data. If it isn't known, leave the item as a manual check.
- **Kingdom Save Editor is GPL-3.0.** Reference its documented offsets and ids; don't copy its code.
- **Never commit save files.** `tests/fixtures/` is gitignored for that reason.
- **Never change an existing item id** without a rename entry (see [Item ids](#item-ids)). Players' progress is
  stored by id.

## Setup

Requires Node 22.22+.

```bash
npm ci
npm run dev
```

Before opening a PR, run what CI runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run format` fixes formatting. The [README](README.md) covers the project layout, the data sources and the
reasoning behind past decisions (the "Decisions" list).

## Where game data lives

Each game is a folder under `src/games/<game>/`:

| Folder    | What's in it                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `data/`   | Raw game data: `locations.json` (generated), constants and save offsets, Journal, synthesis, trophies |
| `model/`  | `items.ts` turns the data into checklist items; `catalog.ts` is what the shared engine reads          |
| `save/`   | Save file parsing and detection                                                                       |
| `routes/` | The game's screens                                                                                    |

`locations.json` is generated; don't edit it by hand. Change the extraction script in `scripts/` and regenerate
(the README has the exact commands).

## Item ids

Progress is saved under item ids (`w.StormRider`, `r.3`, `kb.fenrir`…) and, for trophies marked by hand,
`tro.<trophy id>`. If an id changes, anyone who had it checked silently loses that check.

`tests/ids/<game>.json` lists every id players may have saved, and CI fails if one disappears.

- **Renaming an id:** add `'old.id': 'new.id'` to `renamedIds` in `src/games/<game>/model/catalog.ts`. Saved
  progress and backup codes are moved to the new id when they load. Then run `npm run ids:update`.
- **Adding items:** run `npm run ids:update` and commit the snapshot change with your PR.
- **Removing an item for good:** same, but say why in the PR. Players lose any check they had on it.

## Mapping a save flag

1. Make two saves a moment apart: one just before the event (open the chest, win the cup, read the book) and one
   just after. Copy the save file out after each one, since the game overwrites it.
2. Open the [save diff tool](https://kh-tracker.vercel.app/tools/save-diff), pick the game, load both files and
   choose the slot. It lists every byte that changed and labels bits the tracker already reads.
3. Fewer changes is better. Saving twice in a row without doing anything shows the background noise (play time,
   position) to ignore.
4. Add a `probe` to the item in `model/items.ts` (or the data file it's built from). Offsets are relative to the
   start of the save slot. The probe types are in `src/core/types.ts`:
   - `bit`: one flag bit (most chests, events, reports)
   - `count`: a byte at least `min` (progress counters)
   - `byte`, `level`: a value read as a level, clamped, optionally gated on an unlock bit
   - `equip`, `bitCount`, `listHas`: inventory and equipment, counted flags, and ID lists
5. Check it against a real save: put yours in `tests/fixtures/` (see the README for the expected file names) and
   run `npm test`, or import it locally with `npm run dev`. Say in the PR which save you checked it against and
   whether the event was done in it.

**KH1 shortcut:** addresses from the Steam memory-based tools (the Archipelago connector, the randomizer) convert
to save offsets as `Steam address − 0x2DE9360`. That base is verified, but each derived flag still needs checking
against a real save; a few turned out to be rewritten by the randomizer mod and read wrong in unmodded saves.

## Reporting a wrong flag

Open an [issue](https://github.com/sagezaugg/kh-tracker/issues) with the game, the item, and what you've actually
done in-game. A before/after pair from the save diff tool (just the changed rows) makes it quick to fix. Please
don't attach whole save files to public issues.

## Pull requests

- Keep each PR to one change: one flag, one content fix, one feature.
- Add or update tests for behaviour changes. Data changes are covered by the data and id tests.
- Note the source of any game data in the PR description.
