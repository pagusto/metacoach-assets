"""HTTP educado: una sesión con cookies, pausa entre peticiones y caché en disco de 24 h.

Reglas de uso (ver README): uso personal, baja frecuencia, sin proxies rotativos, sin resolver
captchas. Un 403/429 o una página de challenge se trata como bloqueo y se deja de insistir.
"""
from __future__ import annotations

import hashlib
import http.cookiejar
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

from ..modelo import Bloqueado

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
PAUSA_S = 2.0
CACHE_HORAS = 24
_MARCAS_CHALLENGE = ("incapsula", "_incapsula_resource", "captcha", "access denied",
                     "request unsuccessful", "pardon our interruption", "akamai")


class Sesion:
    def __init__(self, cache_dir: Path, pausa: float = PAUSA_S):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.pausa = pausa
        self._ultima = 0.0
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def _esperar(self):
        falta = self.pausa - (time.monotonic() - self._ultima)
        if falta > 0:
            time.sleep(falta)
        self._ultima = time.monotonic()

    def _clave(self, metodo, url, cuerpo):
        return hashlib.sha256(f"{metodo}|{url}|{cuerpo or ''}".encode()).hexdigest()[:24]

    def pedir(self, url: str, *, metodo: str = "GET", json_body=None, cabeceras=None,
              usar_cache: bool = True, timeout: int = 25) -> str:
        cuerpo = json.dumps(json_body) if json_body is not None else None
        ruta_cache = self.cache_dir / f"{self._clave(metodo, url, cuerpo)}.txt"
        if usar_cache and ruta_cache.exists() and \
                time.time() - ruta_cache.stat().st_mtime < CACHE_HORAS * 3600:
            return ruta_cache.read_text(encoding="utf-8")

        h = {"User-Agent": UA, "Accept": "application/json, text/html;q=0.9, */*;q=0.8",
             "Accept-Language": "en-AU,en;q=0.9"}
        if cuerpo is not None:
            h["Content-Type"] = "application/json"
        h.update(cabeceras or {})
        req = urllib.request.Request(url, data=cuerpo.encode() if cuerpo else None,
                                     headers=h, method=metodo)
        self._esperar()
        try:
            with self.opener.open(req, timeout=timeout) as r:
                texto = r.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 429):
                raise Bloqueado(f"{url} respondió {e.code}") from e
            raise
        except urllib.error.URLError as e:
            # Sin salida a internet o proxy que deniega el host: no es un bloqueo de la tienda.
            raise ConnectionError(f"Sin acceso a {url}: {e.reason}") from e
        bajo = texto[:4000].lower()
        if any(m in bajo for m in _MARCAS_CHALLENGE) and "<html" in bajo:
            raise Bloqueado(f"{url} devolvió una página de verificación anti-bots")
        ruta_cache.write_text(texto, encoding="utf-8")
        return texto
