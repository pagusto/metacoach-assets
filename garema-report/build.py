#!/usr/bin/env python3
"""Build outputs for the Garema works summary report.

  report.html            source (photos referenced from photos/, fonts from Google Fonts)
  -> report-print.html   fonts + photos inlined, used to render the PDF
  -> report-artifact.html photos inlined, Google Fonts link kept (for publishing)
"""
import base64, pathlib, re, subprocess, sys, urllib.request

HERE = pathlib.Path(__file__).parent
SRC = HERE / "report.html"
PDF = HERE / "SAQD_Works_Summary_Report_02_20-26_Aug_2026.pdf"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
GF = ("https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700"
      "&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;600&display=swap")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0.0.0 Safari/537.36")
LINK_RE = re.compile(r'<link rel="preconnect".*?display=swap">', re.S)


def fetch(url: str) -> bytes:
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()


def inline_photos(html: str) -> str:
    def repl(m):
        data = base64.b64encode((HERE / m.group(1)).read_bytes()).decode()
        return f'src="data:image/jpeg;base64,{data}"'
    return re.sub(r'src="(photos/[^"]+)"', repl, html)


def inline_fonts(html: str) -> str:
    """Keep only the latin subsets and embed each woff2 as a data URI."""
    css = fetch(GF).decode()
    blocks = []
    for comment, face in re.findall(r"/\* (\S+) \*/\s*(@font-face \{.*?\})", css, re.S):
        if comment not in ("latin", "latin-ext"):
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", face).group(1)
        data = base64.b64encode(fetch(url)).decode()
        blocks.append(re.sub(r"url\(https://[^)]+\.woff2\)",
                             f"url(data:font/woff2;base64,{data})", face))
    return LINK_RE.sub("<style>\n" + "\n".join(blocks) + "\n</style>", html)


def main() -> int:
    html = SRC.read_text()
    art = HERE / "report-artifact.html"
    art.write_text(inline_photos(html))
    print(f"{art.name}: {art.stat().st_size/1024/1024:.2f} MB")

    pr = HERE / "report-print.html"
    pr.write_text(inline_fonts(inline_photos(html)))
    print(f"{pr.name}: {pr.stat().st_size/1024/1024:.2f} MB")

    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                    "--virtual-time-budget=20000", "--no-pdf-header-footer",
                    f"--print-to-pdf={PDF}", pr.as_uri()],
                   check=True, capture_output=True)
    print(f"{PDF.name}: {PDF.stat().st_size/1024/1024:.2f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
