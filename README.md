MetaCoach diagram assets (educational, public).

## Contents

- `*.png` — metabolism diagrams (AMPK/mTOR, hormone axes, GH secretagogues, incretins, longevity).
- `report/` — clinical evidence reviews.
  - `crohn-retatrutide-review.pdf` — Crohn's disease and investigational retatrutide 4 mg (v2.0, Sep 2026).
  - `crohn-retatrutide-review.src.html` — source, with `FIG1`–`FIG5` placeholders.
  - `crohn-retatrutide-review.html` — built, self-contained (figures inlined).
  - `figures/*.svg` — generated, do not hand-edit.
- `tools/` — build scripts.

## Rebuilding the report

```sh
python3 tools/make_figures.py    # regenerate report/figures/*.svg
python3 tools/build_report.py    # inline figures -> crohn-retatrutide-review.html
node    tools/render_pdf.mjs     # render A4 PDF with running page numbers
```

Requires only Python 3 and Node 20+; the PDF step drives a local Chromium over the
DevTools Protocol and needs no npm dependencies.

Reports here are educational research material, not medical advice. Case profiles are
de-identified.
