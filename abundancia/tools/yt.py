#!/usr/bin/env python3
"""YouTube sin clave de API: buscar y verificar videos.

  yt.py search "consulta" [-n 10] [--lang es]   -> lista JSON (id, título, duración, canal, vistas)
  yt.py check ID [ID ...]                       -> verifica existencia y si se puede incrustar (oEmbed)

Un video es válido para la videoteca solo si check devuelve ok=true.
"""
import argparse, json, re, subprocess, sys, urllib.parse

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")


def curl(url, lang="en"):
    p = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "40", "-A", UA,
         "-H", f"Accept-Language: {lang},en;q=0.8", url],
        capture_output=True)
    return p.stdout.decode("utf-8", "ignore")


def http_code(url):
    p = subprocess.run(
        ["curl", "-sS", "-o", "/dev/null", "--max-time", "20", "-A", UA,
         "-w", "%{http_code}", url], capture_output=True)
    return p.stdout.decode().strip()


def _txt(o):
    if not o:
        return ""
    if "simpleText" in o:
        return o["simpleText"]
    return "".join(r.get("text", "") for r in o.get("runs", []))


def search(q, n=10, lang="en"):
    url = ("https://www.youtube.com/results?search_query="
           + urllib.parse.quote_plus(q) + f"&hl={lang}")
    h = curl(url, lang)
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", h, re.S)
    if not m:
        return []
    out = []

    def walk(o):
        if isinstance(o, dict):
            v = o.get("videoRenderer")
            if v and v.get("videoId"):
                out.append({
                    "id": v["videoId"],
                    "title": _txt(v.get("title")),
                    "duration": _txt(v.get("lengthText")),
                    "channel": _txt(v.get("ownerText")),
                    "views": _txt(v.get("viewCountText")),
                    "published": _txt(v.get("publishedTimeText")),
                    "url": "https://www.youtube.com/watch?v=" + v["videoId"],
                })
            for x in o.values():
                walk(x)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(json.loads(m.group(1)))
    seen, res = set(), []
    for r in out:
        if r["id"] not in seen:
            seen.add(r["id"])
            res.append(r)
    return res[:n]


def check(vid):
    o = curl("https://www.youtube.com/oembed?format=json&url="
             + urllib.parse.quote("https://www.youtube.com/watch?v=" + vid, safe=""))
    thumb = http_code(f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg")
    try:
        j = json.loads(o)
        return {"id": vid, "ok": True, "title": j.get("title"),
                "channel": j.get("author_name"), "channel_url": j.get("author_url"),
                "thumb_http": thumb}
    except Exception:
        return {"id": vid, "ok": False,
                "error": (o.strip()[:80] or "sin respuesta"), "thumb_http": thumb}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("-n", type=int, default=10)
    s.add_argument("--lang", default="en")
    c = sub.add_parser("check")
    c.add_argument("ids", nargs="+")
    a = ap.parse_args()
    if a.cmd == "search":
        print(json.dumps(search(a.query, a.n, a.lang), ensure_ascii=False, indent=1))
    else:
        print(json.dumps([check(i) for i in a.ids], ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
