#!/usr/bin/env python3
"""
Build src/games/kh1/data/locations.json from the Archipelago KH1 world and its game-side mod.

Sources (both MIT):
  - ArchipelagoMW/Archipelago  worlds/kh1/Locations.py           (location names, regions, types)
  - gaithern/KH-1FM-AP-LUA      1fmAPConnector.lua                 (how each location is detected)

The Lua mod reads *game memory* on Steam/EGS. A KH1FM save slot is a copy of the same block, so
save offset = Steam address - 0x2DE9360. That base was checked against three independent fields
in a real Steam save (inventory 0x499, Sora's stats 0x6, Sora's level 0x38) and matches Kingdom
Save Editor's documented offsets (munny 0x1641C, world 0x2040). Individual flags were not each
verified in-game; treat them like any derived data.

Usage:
  git clone --filter=blob:none --sparse https://github.com/ArchipelagoMW/Archipelago.git ap
  (cd ap && git sparse-checkout set worlds/kh1 && git checkout 9b64e832874a50d5d14d5bc599d356d2c5194d7a)
  git clone https://github.com/gaithern/KH-1FM-AP-LUA.git kh1lua
  (cd kh1lua && git checkout 4fe14a5445cabe13b36aa50c7aa3378027f1afb3)
  python3 scripts/kh1/extract_locations.py ap/worlds/kh1/Locations.py kh1lua/1fmAPConnector.lua \\
      src/games/kh1/data/locations.json

Output:
  {"v":1,"source":"...","worlds":[[key, name, [[id, name, type, flag], ...]], ...],
   "reports":[[n, offset, bit], ...]}
  type: "c" chest, "r" event reward, "s" story event, "p" prize
  flag: [] (no known save flag), ["b", offset, bit] or ["g", offset, minValue] (byte >= value)
  Ansem Report locations are moved to "reports" (the tracker lists them in the Journal).
  Destiny Islands' unflagged gathering tasks are dropped: they're story chores, not goals.
"""
import ast
import json
import re
import sys

STEAM_BASE = 0x2DE9360
AP_COMMIT = '9b64e832874a50d5d14d5bc599d356d2c5194d7a'
LUA_COMMIT = '4fe14a5445cabe13b36aa50c7aa3378027f1afb3'

# Region (Archipelago) -> tracker world key, in game order. Homecoming only holds Final Ansem.
WORLDS = [
    ('di', 'Destiny Islands'),
    ('tt', 'Traverse Town'),
    ('wl', 'Wonderland'),
    ('oc', 'Olympus Coliseum'),
    ('dj', 'Deep Jungle'),
    ('ag', 'Agrabah'),
    ('mo', 'Monstro'),
    ('at', 'Atlantica'),
    ('ht', 'Halloween Town'),
    ('nl', 'Neverland'),
    ('hb', 'Hollow Bastion'),
    ('aw', '100 Acre Wood'),
    ('ew', 'End of the World'),
]
TYPES = {'Chest': 'c', 'Reward': 'r', 'Static': 's', 'Prize': 'p'}  # others are randomizer-only


def so(steam: int) -> int:
    return steam - STEAM_BASE


def load_locations(path):
    tree = ast.parse(open(path, encoding='utf-8').read())
    locs = {}
    for node in tree.body:
        if isinstance(node, ast.AnnAssign) and node.target.id in ('location_table', 'event_location_table'):
            for k, v in zip(node.value.keys, node.value.values):
                args = [ast.literal_eval(a) for a in v.args]
                locs[k.value] = dict(name=k.value, region=args[0], id=args[1], type=args[2] if len(args) > 2 else None)
    return list(locs.values())


def load_rules(lua_path):
    lua = open(lua_path, encoding='utf-8').read().splitlines()
    rules = {}
    # Chests: id = 2650000 + k*10 + b  ->  chests-opened byte k-1, bit b-1 (read_chests_opened_array).
    for k in range(1, 510):
        for b in range(1, 9):
            rules[2650000 + k * 10 + b] = ['b', so(0x2DE992C) + k - 1, b - 1]
    # Ansem Reports: id = 2657000 + k*10 + b  ->  report byte k-1, bit b-1.
    for k in range(1, 3):
        for b in range(1, 9):
            rules[2657000 + k * 10 + b] = ['b', so(0x2DEAD20) + k - 1, b - 1]
    # World-progress thresholds.
    cur = None
    for line in lua:
        m = re.search(r'world_progress_location_threshholds\[(\d+)\] = \{', line)
        if m:
            cur = int(m.group(1))
        m = re.search(r'\{(0x[0-9A-Fa-f]+), (\d{7})\}', line)
        if m and cur:
            off = so(0x2DEA864) + (cur - 1) if cur <= 12 else so(0x2DEA864) + 0xE
            rules[int(m.group(2))] = ['g', off, int(m.group(1), 16)]
    # Misc lookup table: {{egs, steam}, id, bit (0 = whole byte), value}.
    for line in lua:
        m = re.search(r'\{\{0x[0-9A-Fa-f]+, (0x[0-9A-Fa-f]+)\}, (\d{7}), (\d+), (0x[0-9A-Fa-f]+)\}', line)
        if m:
            lid, bit, val, off = int(m.group(2)), int(m.group(3)), int(m.group(4), 16), so(int(m.group(1), 16))
            rules.setdefault(lid, ['b', off, bit - 1] if bit > 0 else ['g', off, val])
    for j in range(1, 11):  # postcards mailed (count)
        rules[2656119 + j] = ['g', so(0x2DEB01F), j]
    for j in range(1, 17):  # Atlantica clams (bits)
        rules[2656200 + j] = ['b', so(0x2DEB109) + (j - 1) // 8, (j - 1) % 8]
    # Superboss/cup events the connector reads from the report bits.
    rules[2659017] = ['b', so(0x2DEAD20), 0]  # Hades Cup: defeat Hades
    rules[2656378] = rules[2657026]  # Defeat Kurt Zisa
    rules[2656379] = rules[2657024]  # Defeat Unknown
    # Geppetto's House and Magician's Study rewards (0xD2F-0xD3A): the mod rewrites these bytes for its
    # own logic (write_geppetto_conditions), and in a real unmodded save rewards 4/5, all summons,
    # Pinocchio and All Arts read 0 even when done. No reliable vanilla flag, so they stay manual.
    for lid in range(2656303, 2656314):
        rules.pop(lid, None)
    return rules


def main(loc_path, lua_path, out_path):
    locs = load_locations(loc_path)
    rules = load_rules(lua_path)
    by_region = {name: [] for _, name in WORLDS}
    reports = []
    for L in locs:
        t = TYPES.get(L['type'])
        if not t or L['region'] not in by_region:
            continue
        flag = rules.get(L['id'], [])
        if L['region'] == 'Destiny Islands' and t == 's' and not flag:
            continue  # raft-gathering chores: story steps, not completion goals
        m = re.search(r"Ansem's Report (\d+)$", L['name'])
        if m and flag:
            reports.append([int(m.group(1)), flag[1], flag[2]])
            continue
        by_region[L['region']].append([f"w.{L['id']}", L['name'], t, flag])
    out = {
        'v': 1,
        'source': f'ArchipelagoMW/Archipelago@{AP_COMMIT[:8]} worlds/kh1/Locations.py + '
        f'gaithern/KH-1FM-AP-LUA@{LUA_COMMIT[:8]} 1fmAPConnector.lua (Steam address - 0x{STEAM_BASE:X})',
        'worlds': [[k, name, by_region[name]] for k, name in WORLDS],
        'reports': sorted(reports),
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
    count = lambda t: sum(1 for _, _, rows in out['worlds'] for r in rows if r[2] == t)
    flagged = lambda t: sum(1 for _, _, rows in out['worlds'] for r in rows if r[2] == t and r[3])
    print(f'wrote {out_path}: ' + ', '.join(f'{t} {flagged(t)}/{count(t)}' for t in 'crsp') + f', reports {len(reports)}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
