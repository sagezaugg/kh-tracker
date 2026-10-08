#!/usr/bin/env python3
"""
Rebuild data/kh2fm-locations.json from the Archipelago KH2 world.

Usage:
  git clone --depth 1 --filter=blob:none --sparse https://github.com/ArchipelagoMW/Archipelago.git ap
  (cd ap && git sparse-checkout set worlds/kh2)
  python3 scripts/extract_locations.py ap/worlds/kh2 data/kh2fm-locations.json

Pin the Archipelago commit you extracted from in the output's "source" field when you
productionize this (see PROMPT.md). Archipelago is MIT-licensed; credit it in the app.

Output shape:
  {"v":1,"source":"...","worlds":[[worldId, worldName, [[key, name, visitTag, saveOffset, bit, type], ...]], ...]}
  type: "c" = treasure chest, "p" = event reward / pop-up, "b" = story boss / bonus
  saveOffset is relative to the start of a KH2FM save slot (the "KH2J" magic).
"""
import json
import re
import sys

WORLDS = [
    ("LoD", "Land of Dragons", "LoD_Checks"),
    ("AG", "Agrabah", "AG_Checks"),
    ("DC", "Disney Castle", "DC_Checks"),
    ("TR", "Timeless River", "TR_Checks"),
    ("AW", "100 Acre Wood", "HundredAcreChecks"),
    ("OC", "Olympus Coliseum", "Oc_Checks"),
    ("BC", "Beast's Castle", "BC_Checks"),
    ("SP", "Space Paranoids", "SP_Checks"),
    ("HT", "Halloween Town", "HT_Checks"),
    ("PR", "Port Royal", "PR_Checks"),
    ("HB", "Hollow Bastion", "HB_Checks"),
    ("PL", "Pride Lands", "PL_Checks"),
    ("TT", "Twilight Town", "TT_Checks"),
    ("TW", "The World That Never Was", "TWTNW_Checks"),
    ("AT", "Atlantica", "Atlantica_Checks"),
]
# Superbosses (AS / Data / Lingering Will / Sephiroth) are tracked separately in the app.
SUPERBOSS = re.compile(r" AS |Data |Lingering|Sephiroth")
# Absent Silhouette bonus flags live at 0x370C; they duplicate the superboss list.
AS_BONUS_OFFSET = 0x370C


def main(base: str, out_path: str) -> None:
    names = {m.group(1): m.group(2) for m in re.finditer(r'^(\w+)\s*=\s*"([^"]*)"', open(f"{base}/Names/LocationName.py").read(), re.M)}
    loc_src = open(f"{base}/Locations.py").read()
    types = {m.group(1): m.group(2) for m in re.finditer(r'LocationName\.(\w+):\s*LocationData\(\s*\d+\s*,\s*"([^"]+)"', loc_src)}
    pop_block = loc_src[loc_src.index("popups_set"):]
    pop_block = pop_block[: pop_block.index("}")]
    popups = set(re.findall(r"LocationName\.(\w+)", pop_block))

    client = open(f"{base}/ClientStuff/WorldLocations.py").read()
    groups = {}
    for g in re.finditer(r"^(\w+) = \{(.*?)^\}", client, re.M | re.S):
        rows = []
        for m in re.finditer(r"LocationName\.(\w+):\s*WorldLocationData\((0x[0-9A-Fa-f]+|\d+),\s*(\d+)\)", g.group(2)):
            k = m.group(1)
            rows.append(dict(k=k, n=names.get(k, k), t=types.get(k, "?"), a=int(m.group(2), 0), b=int(m.group(3))))
        groups[g.group(1)] = rows

    worlds = []
    for wid, wname, gname in WORLDS:
        seen, rows = set(), []
        for r in groups.get(gname, []):
            if r["t"] in ("?", "Critical", "Keyblade"):
                continue  # starting items / "game started" flag
            if SUPERBOSS.search(r["n"]) or r["a"] == AS_BONUS_OFFSET:
                continue
            if r["t"] == "Chest":
                t = "p" if r["k"] in popups else "c"
            else:
                t = "b"
            key = (r["a"], r["b"])
            if t == "b" and key in seen:
                continue  # Double/Second Get Bonus share one flag
            seen.add(key)
            n, tag = r["n"], ""
            m = re.match(r"^\(([^)]*)\)\s*(.*)$", n)
            if m:
                tag, n = m.group(1), m.group(2)
            tag = re.sub(r"^Post ", "", tag).split(":")[0]
            if t == "b":
                n = re.sub(r"\s*(Bonus|Get Bonus).*$", "", n).strip()
            rows.append([r["k"][:24], n, tag, r["a"], r["b"], t])
        worlds.append([wid, wname, rows])

    out = {"v": 1, "source": "Save offsets from ArchipelagoMW worlds/kh2 (WorldLocations.py)", "worlds": worlds}
    with open(out_path, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    counts = {t: sum(1 for w in worlds for r in w[2] if r[5] == t) for t in "cpb"}
    print(f"wrote {out_path}: chests={counts['c']} rewards={counts['p']} bosses={counts['b']}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
