#!/usr/bin/env python3
"""Generate print-quality SVG figures for the Crohn's + retatrutide evidence review.

No third-party dependencies: SVG is emitted directly so the figures stay vector-crisp
in the rendered PDF and remain diffable in git.
"""
from __future__ import annotations

import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "report" / "figures"

# --- design tokens -------------------------------------------------------------
INK       = "#17262e"
MUTED     = "#5d6f79"
FAINT     = "#8fa0a9"
GRID      = "#e2e8eb"
RULE      = "#c9d3d8"
PAPER     = "#ffffff"

TEAL      = "#1f6f8b"   # primary / statistically supported
TEAL_DK   = "#16506b"
FOCUS     = "#bf5a1c"   # the patient's actual dose - 4 mg
FOCUS_LT  = "#f1e0d3"
NEUTRAL   = "#9aa7ae"   # placebo / not significant
SAND      = "#c9a227"
SLATE     = "#4c6b7a"

SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif"


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def txt(x, y, s, size=11, fill=INK, anchor="start", weight="400", style="normal",
        family=SANS, spacing=None):
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-size="{size}" '
            f'fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" '
            f'font-style="{style}"{ls}>{esc(s)}</text>')


def frame(w, h, body, title, desc=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="100%" role="img" aria-labelledby="t d">'
            f'<title id="t">{esc(title)}</title><desc id="d">{esc(desc)}</desc>'
            f'<rect width="{w}" height="{h}" fill="{PAPER}"/>{body}</svg>\n')


def write(name, svg):
    p = OUT / name
    p.write_text(svg, encoding="utf-8")
    print(f"  {name:34s} {len(svg):>6,d} bytes")


# ==============================================================================
# Fig 1 - retatrutide dose-response, Phase 2 (48 wk) vs Phase 3 (80 wk)
# ==============================================================================
def fig_dose_response():
    W, H = 700, 400
    L, R, T, B = 62, 214, 44, 58
    pw, ph = W - L - R, H - T - B
    xmin, xmax = 0, 13.0
    ymin, ymax = 0.0, 31.0            # plotted as magnitude of loss

    def X(d): return L + (d - xmin) / (xmax - xmin) * pw
    def Y(v): return T + (v - ymin) / (ymax - ymin) * ph

    p2 = [(1, 8.7), (4, 17.1), (8, 22.8), (12, 24.2)]     # NEJM 2023, 48 wk
    p3 = [(4, 19.0), (9, 25.9), (12, 28.3)]               # TRIUMPH-1, 80 wk
    placebo = 2.1

    s = []
    # focus band on the 4 mg dose
    s.append(f'<rect x="{X(3.45):.1f}" y="{T}" width="{X(4.55)-X(3.45):.1f}" '
             f'height="{ph}" fill="{FOCUS_LT}" opacity="0.75"/>')
    s.append(txt(X(4), T - 10, "4 mg — this case", 9.5, FOCUS, "middle", "700", spacing="0.3"))

    # y grid + labels
    for v in range(0, 31, 5):
        y = Y(v)
        s.append(f'<line x1="{L}" y1="{y:.1f}" x2="{L+pw}" y2="{y:.1f}" '
                 f'stroke="{GRID}" stroke-width="1"/>')
        s.append(txt(L - 9, y + 3.6, f"−{v}%" if v else "0", 10, MUTED, "end"))

    # placebo reference
    s.append(f'<line x1="{L}" y1="{Y(placebo):.1f}" x2="{L+pw}" y2="{Y(placebo):.1f}" '
             f'stroke="{NEUTRAL}" stroke-width="1.4" stroke-dasharray="5 3"/>')
    s.append(txt(L + pw - 4, Y(placebo) - 7, "placebo −2.1%", 9, MUTED, "end", "600"))

    # x axis
    s.append(f'<line x1="{L}" y1="{T+ph:.1f}" x2="{L+pw}" y2="{T+ph:.1f}" '
             f'stroke="{RULE}" stroke-width="1.2"/>')
    for d in (1, 4, 8, 9, 12):
        s.append(f'<line x1="{X(d):.1f}" y1="{T+ph:.1f}" x2="{X(d):.1f}" '
                 f'y2="{T+ph+5:.1f}" stroke="{RULE}" stroke-width="1.2"/>')
        s.append(txt(X(d), T + ph + 18, str(d), 10, MUTED, "middle"))
    s.append(txt(L + pw / 2, T + ph + 38, "weekly subcutaneous dose (mg)", 10.5, MUTED, "middle"))
    s.append(f'<text transform="translate(16,{T+ph/2:.1f}) rotate(-90)" font-family="{SANS}" '
             f'font-size="10.5" fill="{MUTED}" text-anchor="middle">mean body-weight reduction</text>')

    # series
    for pts, colour, dash, label in (
            (p2, SLATE, "6 4", "Phase 2 · 48 weeks"),
            (p3, TEAL, "", "Phase 3 TRIUMPH-1 · 80 weeks")):
        d = " ".join(f"{'M' if i == 0 else 'L'}{X(x):.1f},{Y(y):.1f}"
                     for i, (x, y) in enumerate(pts))
        s.append(f'<path d="{d}" fill="none" stroke="{colour}" stroke-width="2.2" '
                 f'stroke-dasharray="{dash}" stroke-linejoin="round"/>')
        for x, y in pts:
            hot = abs(x - 4) < 0.01
            s.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="{5.2 if hot else 4}" '
                     f'fill="{FOCUS if hot else colour}" stroke="{PAPER}" stroke-width="1.6"/>')

    # value labels, nudged to avoid collisions
    for x, y, col, dx, dy, anch in ((1, 8.7, SLATE, 0, -12, "middle"), (4, 17.1, SLATE, -13, -9, "end"),
                                    (8, 22.8, SLATE, 0, -12, "middle"), (12, 24.2, SLATE, 0, -12, "middle")):
        s.append(txt(X(x) + dx, Y(y) + dy, f"−{y}%", 9.5, col, anch, "700"))
    for x, y, dx, dy, anch in ((4, 19.0, -13, 17, "end"), (9, 25.9, 0, 17, "middle"), (12, 28.3, 0, 17, "middle")):
        s.append(txt(X(x) + dx, Y(y) + dy, f"−{y}%", 9.5, FOCUS if x == 4 else TEAL, anch, "700"))

    # legend / annotation panel
    lx = L + pw + 24
    s.append(txt(lx, T + 4, "WHAT CHANGED", 9, FOCUS, "start", "700", spacing="0.9"))
    s.append(f'<line x1="{lx}" y1="{T+11}" x2="{W-14}" y2="{T+11}" stroke="{RULE}"/>')
    lines = [
        ("The 4 mg dose now has its own", "600"),
        ("Phase 3 read-out: −19.0% at", "600"),
        ("80 weeks (n=2,339).", "600"),
        ("", "400"),
        ("The earlier estimate for this", "400"),
        ("case leaned on Phase 2 alone", "400"),
        ("(−17.1% at 48 weeks), which", "400"),
        ("understated both the effect", "400"),
        ("and the exposure duration.", "400"),
    ]
    y = T + 28
    for line, wt in lines:
        if line:
            s.append(txt(lx, y, line, 9.5, INK if wt == "600" else MUTED, "start", wt))
        y += 13.5

    y += 8
    for colour, dash, label in ((SLATE, "6 4", "Phase 2 · 48 wk"), (TEAL, "", "Phase 3 · 80 wk")):
        s.append(f'<line x1="{lx}" y1="{y-4:.1f}" x2="{lx+22}" y2="{y-4:.1f}" stroke="{colour}" '
                 f'stroke-width="2.2" stroke-dasharray="{dash}"/>')
        s.append(f'<circle cx="{lx+11}" cy="{y-4:.1f}" r="3.6" fill="{colour}" '
                 f'stroke="{PAPER}" stroke-width="1.4"/>')
        s.append(txt(lx + 29, y, label, 9.5, MUTED))
        y += 15

    return frame(W, H, "".join(s),
                 "Retatrutide dose-response for body-weight reduction",
                 "Phase 2 at 48 weeks and Phase 3 TRIUMPH-1 at 80 weeks, with the 4 mg dose highlighted.")


# ==============================================================================
# Fig 2 - TRIUMPH-1 gastrointestinal adverse events by dose
# ==============================================================================
def fig_gi_ae():
    W, H = 700, 404
    L, R, T, B = 58, 20, 62, 98
    pw, ph = W - L - R, H - T - B
    ymax = 50

    cats = ["Nausea", "Diarrhoea", "Constipation", "Vomiting"]
    series = [
        ("Placebo", NEUTRAL, [14.8, 13.5, 10.9, 4.8]),
        ("4 mg",    FOCUS,   [28.6, 25.2, 23.8, 10.6]),
        ("9 mg",    SLATE,   [38.4, 34.1, 25.9, 22.8]),
        ("12 mg",   TEAL,    [42.4, 32.0, 26.1, 25.3]),
    ]

    def Y(v): return T + ph - v / ymax * ph

    gw = pw / len(cats)
    bw = gw * 0.165
    gap = gw * 0.030

    s = []
    for v in range(0, ymax + 1, 10):
        y = Y(v)
        s.append(f'<line x1="{L}" y1="{y:.1f}" x2="{L+pw}" y2="{y:.1f}" stroke="{GRID}"/>')
        s.append(txt(L - 9, y + 3.6, f"{v}%", 10, MUTED, "end"))

    for ci, cat in enumerate(cats):
        gx = L + ci * gw
        block = (len(series) * bw) + (len(series) - 1) * gap
        x0 = gx + (gw - block) / 2
        for si, (name, colour, vals) in enumerate(series):
            v = vals[ci]
            x = x0 + si * (bw + gap)
            y = Y(v)
            s.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" '
                     f'height="{T+ph-y:.1f}" fill="{colour}" rx="1.5"/>')
            s.append(txt(x + bw / 2, y - 5, f"{v}", 8.6, colour if name != "Placebo" else MUTED,
                         "middle", "700"))
        s.append(txt(gx + gw / 2, T + ph + 19, cat, 10.5, INK, "middle", "600"))
        if ci:
            s.append(f'<line x1="{gx:.1f}" y1="{T+6}" x2="{gx:.1f}" y2="{T+ph:.1f}" '
                     f'stroke="{GRID}"/>')

    s.append(f'<line x1="{L}" y1="{T+ph:.1f}" x2="{L+pw}" y2="{T+ph:.1f}" '
             f'stroke="{RULE}" stroke-width="1.2"/>')

    # the clinically decisive annotation: diarrhoea at 4 mg
    dx = L + 1 * gw + (gw - (4 * bw + 3 * gap)) / 2 + 1 * (bw + gap) + bw / 2
    s.append(f'<path d="M{dx:.1f},{Y(25.2)-16:.1f} L{dx:.1f},{T+26:.1f} L{L+pw-236:.1f},{T+26:.1f}" '
             f'fill="none" stroke="{FOCUS}" stroke-width="1.2" stroke-dasharray="3 2.5"/>')
    s.append(f'<circle cx="{dx:.1f}" cy="{Y(25.2)-16:.1f}" r="2.6" fill="{FOCUS}"/>')
    s.append(f'<rect x="{L+pw-232:.1f}" y="{T+8}" width="232" height="36" rx="3" '
             f'fill="{FOCUS_LT}" stroke="{FOCUS}" stroke-width="0.8"/>')
    s.append(txt(L + pw - 222, T + 22, "1 in 4 on 4 mg reports diarrhoea —", 9.5, "#8a3f12", "start", "700"))
    s.append(txt(L + pw - 222, T + 35, "indistinguishable from a flare on symptoms alone.", 9.2, "#8a3f12"))

    s.append(txt(L, T - 40, "Gastrointestinal adverse events are dose-related — but only modestly lower at 4 mg",
                 11.5, INK, "start", "700"))
    s.append(txt(L, T - 25, "TRIUMPH-1, n = 2,339, 80 weeks. Events were predominantly mild to moderate.",
                 9.8, MUTED))

    ly = T + ph + 46
    lx = L
    for name, colour, _ in series:
        s.append(f'<rect x="{lx}" y="{ly-8}" width="11" height="11" fill="{colour}" rx="1.5"/>')
        s.append(txt(lx + 16, ly + 1, name, 9.8, MUTED, "start", "600" if name == "4 mg" else "400"))
        lx += 74
    s.append(txt(L, ly + 19,
                 "Discontinuation for adverse events — placebo 4.9% · 4 mg 4.1% · 9 mg 6.9% · 12 mg 11.3%",
                 9, FAINT))

    return frame(W, H, "".join(s), "Gastrointestinal adverse events by retatrutide dose in TRIUMPH-1",
                 "Grouped bars comparing nausea, diarrhoea, constipation and vomiting across placebo and 4, 9 and 12 mg.")


# ==============================================================================
# Fig 3 - forest plot: pooled GLP-1 receptor agonist outcomes in IBD
# ==============================================================================
def fig_forest():
    W, H = 700, 330
    L, R, T, B = 232, 128, 74, 62
    pw, ph = W - L - R, H - T - B
    lo, hi = 0.30, 2.2

    def X(v): return L + (math.log(v) - math.log(lo)) / (math.log(hi) - math.log(lo)) * pw

    rows = [
        ("Any IBD-related surgery", "11 studies · 16,242 pts", 0.61, 0.44, 0.84, True,  "HR 0.61 (0.44–0.84)"),
        ("Hospitalisation, all IBD", "pooled cohorts",          0.91, 0.71, 1.17, False, "HR 0.91 (0.71–1.17)"),
        ("Hospitalisation, Crohn's", "sensitivity analysis",    0.93, 0.78, 1.10, False, "HR 0.93 (0.78–1.10)"),
    ]

    s = []
    s.append(txt(14, T - 44, "What the IBD evidence actually supports", 11.5, INK, "start", "700"))
    s.append(txt(14, T - 29, "Pooled estimates from retrospective cohorts of GLP-1 receptor agonist users with IBD. "
                 "No trial has randomised an IBD population.", 9.8, MUTED))

    # axis
    for v, lab in ((0.4, "0.4"), (0.5, "0.5"), (0.7, "0.7"), (1.0, "1.0"), (1.5, "1.5"), (2.0, "2.0")):
        x = X(v)
        s.append(f'<line x1="{x:.1f}" y1="{T-6}" x2="{x:.1f}" y2="{T+ph:.1f}" stroke="{GRID}"/>')
        s.append(txt(x, T + ph + 17, lab, 9.5, MUTED, "middle"))
    s.append(f'<line x1="{X(1):.1f}" y1="{T-6}" x2="{X(1):.1f}" y2="{T+ph:.1f}" '
             f'stroke="{MUTED}" stroke-width="1.3"/>')
    s.append(f'<line x1="{L}" y1="{T+ph:.1f}" x2="{L+pw}" y2="{T+ph:.1f}" stroke="{RULE}" stroke-width="1.2"/>')
    s.append(txt(X(1), T + ph + 34, "hazard ratio (log scale)", 9.8, MUTED, "middle"))
    s.append(txt(X(1) - 8, T + ph + 50, "◀ favours GLP-1 RA", 8.8, FAINT, "end"))
    s.append(txt(X(1) + 8, T + ph + 50, "favours non-use ▶", 8.8, FAINT, "start"))

    rh = ph / (len(rows) + 1)
    for i, (label, sub, est, cl, cu, sig, txtval) in enumerate(rows):
        y = T + rh * (i + 0.62)
        colour = TEAL if sig else NEUTRAL
        s.append(txt(14, y + 1, label, 10.4, INK, "start", "600"))
        s.append(txt(14, y + 13, sub, 8.8, FAINT))
        s.append(f'<line x1="{X(cl):.1f}" y1="{y:.1f}" x2="{X(cu):.1f}" y2="{y:.1f}" '
                 f'stroke="{colour}" stroke-width="1.6"/>')
        for b in (cl, cu):
            s.append(f'<line x1="{X(b):.1f}" y1="{y-4.5:.1f}" x2="{X(b):.1f}" y2="{y+4.5:.1f}" '
                     f'stroke="{colour}" stroke-width="1.6"/>')
        s.append(f'<rect x="{X(est)-4.6:.1f}" y="{y-4.6:.1f}" width="9.2" height="9.2" '
                 f'fill="{colour}" transform="rotate(45 {X(est):.1f} {y:.1f})"/>')
        s.append(txt(W - 14, y + 1, txtval, 9.4, colour, "end", "700" if sig else "400"))
        s.append(txt(W - 14, y + 13, "significant" if sig else "not significant", 8.6,
                     TEAL if sig else FAINT, "end"))

    # the retracted claim
    y = T + rh * (len(rows) + 0.62)
    s.append(f'<line x1="14" y1="{y-14:.1f}" x2="{W-14}" y2="{y-14:.1f}" stroke="{RULE}" stroke-dasharray="3 3"/>')
    s.append(txt(14, y + 2, "Ileus / intestinal obstruction", 10.4, INK, "start", "600"))
    s.append(txt(14, y + 14, "the claim this report withdraws", 8.8, FOCUS))
    s.append(f'<rect x="{L}" y="{y-9:.1f}" width="{pw}" height="18" rx="3" fill="#f6f7f8"/>')
    s.append(txt(L + pw / 2, y + 3.5, "no significant association in either direction", 9.4, MUTED, "middle", "600"))
    s.append(txt(W - 14, y + 2, "not protective", 9.4, FOCUS, "end", "700"))
    s.append(txt(W - 14, y + 14, "≈1–2% event rate", 8.6, FAINT, "end"))

    return frame(W, H, "".join(s), "Pooled GLP-1 receptor agonist outcomes in inflammatory bowel disease",
                 "Forest plot of surgery and hospitalisation hazard ratios, and a note that no protective effect on ileus was demonstrated.")


# ==============================================================================
# Fig 4 - evidence ladder
# ==============================================================================
def fig_evidence():
    W, H = 700, 372
    L, R, T, B = 14, 14, 54, 26
    pw = W - L - R

    rungs = [
        ("Randomised phase 3 evidence in humans", TEAL_DK,
         ["Semaglutide", "Tirzepatide"], "approved for obesity; IBD data are observational only"),
        ("Randomised phase 2–3, still investigational", TEAL,
         ["Retatrutide"], "no IBD trial; FDA submission signalled for Q1 2027"),
        ("Retrospective human cohorts only", SLATE,
         ["GLP-1 class in IBD"], "surgery HR 0.61; confounding by indication unresolved"),
        ("Animal models only", SAND,
         ["KPV", "BPC-157"], "rodent colitis and soft-tissue healing; no published human trial"),
        ("No human efficacy data of any kind", FOCUS,
         ["TB-500"], "extrapolated from thymosin β4 biology"),
    ]

    s = []
    s.append(txt(L, T - 32, "Evidence standing of every compound in the protocol", 11.5, INK, "start", "700"))
    s.append(txt(L, T - 17, "Read top to bottom: the further down a compound sits, the more of its rationale is inference rather than measurement.",
                 9.8, MUTED))

    rh = (H - T - B) / len(rungs)
    for i, (label, colour, names, note) in enumerate(rungs):
        y = T + i * rh
        s.append(f'<rect x="{L}" y="{y:.1f}" width="{pw}" height="{rh-9:.1f}" rx="3" '
                 f'fill="{"#fbfcfc" if i % 2 == 0 else "#f5f8f9"}"/>')
        s.append(f'<rect x="{L}" y="{y:.1f}" width="4.5" height="{rh-9:.1f}" rx="2" fill="{colour}"/>')
        s.append(txt(L + 16, y + 19, label, 10.6, INK, "start", "700"))
        s.append(txt(L + 16, y + 34, note, 9.2, MUTED))
        cx = L + pw - 14
        for name in reversed(names):
            tw = 8.2 + len(name) * 5.9
            s.append(f'<rect x="{cx-tw:.1f}" y="{y+12:.1f}" width="{tw:.1f}" height="20" rx="10" '
                     f'fill="{colour}"/>')
            s.append(txt(cx - tw / 2, y + 25.8, name, 9.6, "#ffffff", "middle", "700"))
            cx -= tw + 8
    return frame(W, H, "".join(s), "Evidence standing of each compound",
                 "Five tiers from randomised phase 3 human evidence down to compounds with no human efficacy data.")


# ==============================================================================
# Fig 5 - flare vs drug adverse effect decision algorithm
# ==============================================================================
def fig_algorithm():
    W, H = 700, 430
    s = []
    s.append(txt(14, 22, "Is this the disease or is this the drug?", 11.5, INK, "start", "700"))
    s.append(txt(14, 37, "The decision this protocol exists to make. Symptom character cannot separate the two — only objective markers can.",
                 9.8, MUTED))

    def box(x, y, w, h, title, body, fill, stroke, tc=INK, r=4):
        o = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
             f'stroke="{stroke}" stroke-width="1.1"/>']
        o.append(txt(x + w / 2, y + 17, title, 10.2, tc, "middle", "700"))
        yy = y + 31
        for line in body:
            o.append(txt(x + w / 2, yy, line, 9.1, MUTED if tc == INK else tc, "middle"))
            yy += 12
        return "".join(o)

    def arrow(x1, y1, x2, y2, label=None, colour=MUTED, side="right"):
        o = [f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{colour}" stroke-width="1.4" '
             f'marker-end="url(#ah)" fill="none"/>']
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            if abs(y1 - y2) < 1:                      # horizontal arrow: label sits above it
                o.append(txt(mx, my - 7, label, 9, colour, "middle", "700"))
            else:
                o.append(txt(mx + (7 if side == "right" else -7), my + 3, label, 9, colour,
                             "start" if side == "right" else "end", "700"))
        return "".join(o)

    s.append(f'<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
             f'markerHeight="6" orient="auto-start-reverse">'
             f'<path d="M0,1 L9,5 L0,9 z" fill="{MUTED}"/></marker></defs>')

    cx = W / 2
    s.append(box(cx - 150, 56, 300, 46, "New or worsening GI symptom",
                 ["loose stools · cramping · nausea · bloating"], "#f5f8f9", RULE))
    s.append(arrow(cx, 102, cx, 124))

    s.append(box(cx - 150, 124, 300, 44, "Persists beyond 7 days?", [], FOCUS_LT, FOCUS, "#8a3f12"))

    s.append(arrow(cx - 150, 146, 120, 146, "no", MUTED, "left"))
    s.append(box(14, 178, 212, 62, "Symptomatic management",
                 ["dose timing, low-fat meals, hydration,", "magnesium; log it and keep the", "8-week marker schedule"],
                 "#fbfcfc", RULE))

    s.append(arrow(cx, 168, cx, 196, "yes"))
    s.append(box(cx - 116, 196, 232, 62, "Measure, do not infer",
                 ["faecal calprotectin + CRP", "(± CBC, ferritin, albumin)"], "#eaf1f4", TEAL, TEAL_DK))

    s.append(arrow(cx - 60, 258, 300, 288, None))
    s.append(arrow(cx + 60, 258, 470, 288, None))

    s.append(box(196, 288, 208, 74, "Markers rising",
                 ["treat as active disease", "gastroenterology review now;", "hold dose escalation and", "suspend resistance training"],
                 "#fdf0ec", FOCUS, "#8a3f12"))
    s.append(box(420, 288, 208, 74, "Markers quiet",
                 ["treat as drug adverse effect", "hold current dose, manage", "symptomatically, re-measure", "at the next 8-week point"],
                 "#eef4f0", "#3f7d5c", "#2f5f45"))

    s.append(f'<rect x="14" y="380" width="{W-28}" height="38" rx="4" fill="#fbfcfc" stroke="{RULE}"/>')
    s.append(txt(26, 396, "Override at any point:", 9.4, FOCUS, "start", "700"))
    s.append(txt(132, 396, "rectal bleeding · fever · pain > 3/10 · vomiting with distension or absent stool · rapid unintended weight loss",
                 9.2, INK))
    s.append(txt(26, 410, "These are not titration problems. They are urgent obstruction, abscess or perforation questions — same-day assessment.",
                 9.2, MUTED))

    return frame(W, H, "".join(s), "Decision algorithm distinguishing a Crohn's flare from a drug adverse effect",
                 "Flow chart: symptoms persisting beyond seven days trigger faecal calprotectin and CRP; rising markers are treated as active disease, quiet markers as a drug effect.")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print("writing figures to", OUT)
    write("fig1-dose-response.svg", fig_dose_response())
    write("fig2-gi-adverse-events.svg", fig_gi_ae())
    write("fig3-ibd-forest.svg", fig_forest())
    write("fig4-evidence-ladder.svg", fig_evidence())
    write("fig5-flare-algorithm.svg", fig_algorithm())
