#!/usr/bin/env python3
"""Leer fuentes web como texto (usa curl, respeta el proxy de la sesión).

  fetch.py URL [--max 15000] [--grep REGEX] [--raw]
  fetch.py --wiki "Título" [--lang en]     wikitexto de Wikipedia
  fetch.py --doi 10.xxxx/yyyy              metadatos del artículo (Crossref)
  fetch.py --s2 "consulta"                 Semantic Scholar: artículos con resumen
  fetch.py --pubmed "consulta"             PubMed: resultados con resumen

--grep imprime solo las líneas que coinciden (con 2 líneas de contexto).
"""
import argparse, html, json, re, subprocess, sys, time, urllib.parse
from html.parser import HTMLParser

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")
SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "header", "form", "aside"}
BLOCK = {"p", "div", "br", "li", "tr", "h1", "h2", "h3", "h4", "h5", "td", "th",
         "section", "article", "blockquote", "dd", "dt"}


def curl(url, accept=None):
    cmd = ["curl", "-sS", "-L", "--max-time", "45", "-A", UA]
    if accept:
        cmd += ["-H", f"Accept: {accept}"]
    p = subprocess.run(cmd + ["-w", "\n__HTTP__%{http_code}", url], capture_output=True)
    body = p.stdout.decode("utf-8", "ignore")
    code = "000"
    if "\n__HTTP__" in body:
        body, code = body.rsplit("\n__HTTP__", 1)
    return body, code.strip(), p.stderr.decode("utf-8", "ignore").strip()


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.skip += 1
        elif tag in BLOCK:
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP and self.skip:
            self.skip -= 1
        elif tag in BLOCK:
            self.out.append("\n")

    def handle_data(self, d):
        if not self.skip:
            self.out.append(d)


def to_text(h):
    t = Text()
    try:
        t.feed(h)
    except Exception:
        pass
    s = "".join(t.out)
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def emit(text, a):
    if a.grep:
        rx = re.compile(a.grep, re.I)
        lines = text.split("\n")
        keep = set()
        for i, l in enumerate(lines):
            if rx.search(l):
                keep.update(range(max(0, i - 2), min(len(lines), i + 3)))
        text = "\n".join(lines[i] for i in sorted(keep)) or "(sin coincidencias)"
    if len(text) > a.max:
        text = text[:a.max] + f"\n… [truncado: {len(text)} caracteres en total; usa --max o --grep]"
    print(text)


def main():
    # En Windows la salida no es UTF-8 por defecto: comillas y rayas de las fuentes salían rotas.
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url", nargs="?")
    ap.add_argument("--max", type=int, default=15000)
    ap.add_argument("--grep")
    ap.add_argument("--raw", action="store_true")
    ap.add_argument("--wiki")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--doi")
    ap.add_argument("--s2")
    ap.add_argument("--pubmed")
    a = ap.parse_args()

    if a.wiki:
        u = (f"https://{a.lang}.wikipedia.org/w/index.php?action=raw&title="
             + urllib.parse.quote(a.wiki.replace(" ", "_")))
        body, code, err = curl(u)
        if code != "200":
            sys.exit(f"HTTP {code} {err}")
        return emit(body, a)
    if a.doi:
        body, code, err = curl("https://api.crossref.org/works/" + urllib.parse.quote(a.doi, safe="/"))
        if code != "200":
            sys.exit(f"HTTP {code}: DOI no encontrado en Crossref")
        m = json.loads(body)["message"]
        print(json.dumps({
            "title": (m.get("title") or [""])[0],
            "authors": [f"{x.get('given','')} {x.get('family','')}".strip() for x in m.get("author", [])][:12],
            "journal": (m.get("container-title") or [""])[0],
            "year": (m.get("issued", {}).get("date-parts") or [[None]])[0][0],
            "volume": m.get("volume"), "pages": m.get("page"),
            "doi": m.get("DOI"), "cited_by": m.get("is-referenced-by-count"),
            "abstract": re.sub(r"<[^>]+>", "", m.get("abstract", ""))[:1500],
        }, ensure_ascii=False, indent=1))
        return
    if a.s2:
        u = ("https://api.semanticscholar.org/graph/v1/paper/search?limit=8&fields="
             "title,year,authors,venue,abstract,citationCount,externalIds&query="
             + urllib.parse.quote(a.s2))
        for attempt in range(4):
            body, code, err = curl(u)
            if code == "200":
                break
            time.sleep(4 * (attempt + 1))
        if code != "200":
            sys.exit(f"HTTP {code} (Semantic Scholar limita peticiones; reintenta más tarde)")
        for p in json.loads(body).get("data", []):
            print(json.dumps({
                "title": p.get("title"), "year": p.get("year"), "venue": p.get("venue"),
                "authors": [x.get("name") for x in (p.get("authors") or [])][:6],
                "citations": p.get("citationCount"),
                "doi": (p.get("externalIds") or {}).get("DOI"),
                "abstract": (p.get("abstract") or "")[:900],
            }, ensure_ascii=False))
        return
    if a.pubmed:
        u = ("https://pubmed.ncbi.nlm.nih.gov/?format=abstract&size=10&term="
             + urllib.parse.quote(a.pubmed))
        body, code, err = curl(u)
        if code != "200":
            sys.exit(f"HTTP {code} {err}")
        return emit(to_text(body), a)
    if not a.url:
        ap.error("falta URL")
    body, code, err = curl(a.url)
    if code != "200":
        print(f"[HTTP {code}] {err}", file=sys.stderr)
        if not body.strip():
            sys.exit(1)
    emit(body if a.raw else to_text(body), a)


if __name__ == "__main__":
    main()
