# Works Summary Report — The Garema Hotel

Weekly works summary issued by **SA Quality Ductwork** to **Climatech** (site supervisor: Keith Morgan)
for the mechanical package at The Garema Hotel, Canberra ACT (principal contractor: TP Dynamics).

| File | What it is |
| --- | --- |
| `report.html` | Source document — edit this one. Photos referenced from `photos/`. |
| `photos/PH-01…22.jpg` | Site photographs and the two message directions, resized, cropped and orientation-corrected. |
| `build.py` | Inlines photos and fonts, then renders the PDF with Chromium. |
| `report-print.html` | Generated — photos + fonts inlined, used for the PDF. |
| `report-artifact.html` | Generated — photos inlined, for publishing as a web page. |
| `SAQD_Works_Summary_Report_02_20-26_Aug_2026.pdf` | Generated — 7 pages, A4. |

## Rebuilding after an edit

```bash
python3 build.py     # regenerates both HTML variants and the PDF
```

Requires `pillow` and a Chromium binary (path set at the top of `build.py`).

## Adding photos

1. Drop the new image in `photos/` named `PH-23.jpg` (continue the sequence, max ~1400 px, orientation corrected).
2. Add a `<figure>` block in `report.html` following the existing pattern — ID badge, tag, title, description.
3. Run `python3 build.py`.

Each sheet is a `.sheet` div sized to A4. Keep a sheet's content under **294 mm** tall or it spills onto
an extra page; four photos per sheet in the 2-up grid is the working limit.

## Page structure

1. Executive summary — one page: project data, scope, progress by work front, coordination, safety, next period.
2–7. Photographic record — sections A to E, with the supervisor direction panel on sheet 5 and the
     distribution list and signatures on the last sheet.

A screenshot used as evidence gets `class="frame doc"` so the whole image is shown instead of being cropped square.
