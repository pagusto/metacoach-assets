#!/usr/bin/env python3
"""Build the Garema week-03 documents.

    python3 build.py report            -> SAQD_Works_Summary_Report_03_05-14_Sep_2026.pdf
    python3 build.py ncr-response      -> SAQD_NCR_Response_14_Sep_2026.pdf
    python3 build.py direction-record  -> SAQD_Direction_Record_Aug-Sep_2026.pdf
    python3 build.py                   -> all of the above

Each <name>.html is combined with _base.html (the shared stylesheet), then written out twice:
a print copy with the photos and font faces inlined, which is what Chromium renders to PDF, and
an artifact copy that keeps the Google Fonts link for publishing on the web.
"""
import base64, pathlib, re, subprocess, sys, urllib.request

HERE = pathlib.Path(__file__).parent
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
GF = ("https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700"
      "&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;600&display=swap")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0.0.0 Safari/537.36")
LINK_RE = re.compile(r'<link rel="preconnect".*?display=swap">', re.S)

DOCS = {
    "report": "SAQD_Works_Summary_Report_03_05-14_Sep_2026.pdf",
    "ncr-response": "SAQD_NCR_Response_14_Sep_2026.pdf",
    "direction-record": "SAQD_Direction_Record_Aug-Sep_2026.pdf",
}

_font_css = None


def fetch(url: str) -> bytes:
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()


def inline_images(html: str) -> str:
    """Replace every local image src with a data: URI."""
    def repl(m):
        data = base64.b64encode((HERE / m.group(1)).read_bytes()).decode()
        return f'src="data:image/jpeg;base64,{data}"'
    return re.sub(r'src="((?:photos|sms)/[^"]+)"', repl, html)


def font_faces() -> str:
    """The latin @font-face rules with each woff2 embedded as a data URI (fetched once)."""
    global _font_css
    if _font_css is None:
        css = fetch(GF).decode()
        blocks = []
        for comment, face in re.findall(r"/\* (\S+) \*/\s*(@font-face \{.*?\})", css, re.S):
            if comment not in ("latin", "latin-ext"):
                continue
            url = re.search(r"url\((https://[^)]+\.woff2)\)", face).group(1)
            data = base64.b64encode(fetch(url)).decode()
            blocks.append(re.sub(r"url\(https://[^)]+\.woff2\)",
                                 f"url(data:font/woff2;base64,{data})", face))
        _font_css = "<style>\n" + "\n".join(blocks) + "\n</style>"
    return _font_css


def build(name: str) -> None:
    body = (HERE / f"{name}.html").read_text()
    title, body = body.split("\n", 1) if body.startswith("<title>") else ("", body)
    html = title + "\n" + (HERE / "_base.html").read_text() + "\n" + body

    art = HERE / f"{name}-artifact.html"
    art.write_text(inline_images(html))

    pr = HERE / f"{name}-print.html"
    pr.write_text(LINK_RE.sub(font_faces(), inline_images(html)))

    pdf = HERE / DOCS[name]
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                    "--virtual-time-budget=30000", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf}", pr.as_uri()],
                   check=True, capture_output=True)
    print(f"{name}: {pdf.name} ({pdf.stat().st_size/1024/1024:.2f} MB)")


def main() -> int:
    names = sys.argv[1:] or [n for n in DOCS if (HERE / f"{n}.html").exists()]
    for name in names:
        build(name.removesuffix(".html"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
