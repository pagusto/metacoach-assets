#!/usr/bin/env python3
"""Inline the SVG figures into the report source, producing a self-contained HTML file."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC  = ROOT / "report" / "crohn-retatrutide-review.src.html"
OUT  = ROOT / "report" / "crohn-retatrutide-review.html"
FIGS = ROOT / "report" / "figures"

NAMES = {
    "FIG1": "fig1-dose-response.svg",
    "FIG2": "fig2-gi-adverse-events.svg",
    "FIG3": "fig3-ibd-forest.svg",
    "FIG4": "fig4-evidence-ladder.svg",
    "FIG5": "fig5-flare-algorithm.svg",
}

html = SRC.read_text(encoding="utf-8")
missing = []
for i, (token, fname) in enumerate(NAMES.items()):
    path = FIGS / fname
    if not path.exists():
        missing.append(fname); continue
    svg = path.read_text(encoding="utf-8").strip()
    # ids must be unique once several SVGs share one document
    for attr in ("t", "d", "ah"):
        svg = svg.replace(f'id="{attr}"', f'id="{attr}{i}"')
        svg = svg.replace(f'#{attr}"', f'#{attr}{i}"')
        svg = svg.replace(f'aria-labelledby="t d"', f'aria-labelledby="t{i} d{i}"')
    if token not in html:
        missing.append(f"{token} placeholder"); continue
    html = html.replace(token, svg)

if missing:
    sys.exit("missing: " + ", ".join(missing))
if re.search(r"\bFIG[1-5]\b", html):
    sys.exit("unreplaced figure placeholder remains")

OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)}  ({len(html):,} bytes, {len(NAMES)} figures inlined)")
