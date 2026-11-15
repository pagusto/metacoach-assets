#!/usr/bin/env python3
"""Comprueba que el sitio raíz publicado coincide con su carpeta.

    python abundancia/tools/raiz-verificar.py <carpeta> [base] [--trabajo] [--compartir URL]

    <carpeta>    la carpeta del sitio raíz, un repositorio git solo local
    [base]       por defecto, https://pabloagusto.vercel.app
    --trabajo    compara con los archivos de la carpeta tal como están, no con el último commit
    --compartir  enlace «_vercel_share» de un despliegue de prueba protegido

Pide a la base cada archivo del último commit y lo compara byte a byte. vercel.json, .gitignore
y middleware.js no se sirven. empleo/index.html está tras contraseña: debe responder 401 y, con
la variable de entorno EMPLEO_PASSWORD, además se compara. Comprueba también que /empleo/ sigue
cerrado y sin indexar y que las cuatro rutas de Shefa responden.

Sale con código 1 si algo difiere o si, sin --trabajo, la carpeta tiene cambios sin confirmar.
Solo lee: no cambia la carpeta ni publica nada. En Windows, python; en Linux y macOS, python3.
"""
import argparse
import base64
import http.cookiejar
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ap = argparse.ArgumentParser(description='Compara el sitio raíz publicado con su carpeta.')
ap.add_argument('carpeta')
ap.add_argument('base', nargs='?', default='https://pabloagusto.vercel.app')
ap.add_argument('--trabajo', action='store_true',
                help='compara con los archivos de la carpeta, no con el último commit')
ap.add_argument('--compartir', metavar='URL', help='enlace _vercel_share de un despliegue de prueba')
arg = ap.parse_args()
carpeta, base = arg.carpeta.rstrip('/\\'), arg.base.rstrip('/')
clave = os.environ.get('EMPLEO_PASSWORD')

NO_SERVIDOS = {'vercel.json', '.gitignore', 'middleware.js'}
PRIVADOS = {'empleo/index.html'}
RUTAS_SHEFA = ['/shefa', '/shefa/', '/shefa/arbol', '/shefa/arbol/']
AGENTE = {'User-Agent': 'raiz-verificar/1 (comprobacion del propietario)'}
# Los despliegues de prueba añaden al HTML la barra de Vercel.
BARRA = re.compile(rb'\n?<script async data-explicit-opt-in="true" data-deployment-id="[^"]*" '
                   rb'src="https://vercel\.live/[^"]*"></script>\s*$')


def git(*args):
    r = subprocess.run(['git', '-C', carpeta, *args], capture_output=True)
    if r.returncode != 0:
        sys.exit(f'git {" ".join(args)}: {r.stderr.decode(errors="replace").strip()}')
    return r.stdout


def lista(salida):
    return [n for n in salida.decode('utf-8', errors='surrogateescape').split('\0') if n]


def del_disco(rel):
    with open(os.path.join(carpeta, rel), 'rb') as f:
        return f.read()


def del_commit(rel):
    return git('cat-file', 'blob', f'HEAD:{rel}')


cambios = git('status', '--porcelain').decode(errors='replace').splitlines()
commit = git('rev-parse', '--short', 'HEAD').decode().strip()
if arg.trabajo:
    nombres = [n for n in lista(git('ls-files', '-z', '--cached', '--others', '--exclude-standard'))
               if os.path.isfile(os.path.join(carpeta, n))]
    leer, que = del_disco, 'la carpeta tal como está'
else:
    nombres = lista(git('ls-tree', '-r', '-z', '--name-only', 'HEAD'))
    leer, que = del_commit, f'el commit {commit}'
nombres = sorted(n for n in nombres if n not in NO_SERVIDOS)

jar = http.cookiejar.CookieJar()
abridor = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
if arg.compartir:
    with abridor.open(urllib.request.Request(arg.compartir, headers=AGENTE), timeout=60) as r:
        r.read()


def pedir(ruta, con_clave=False):
    """Devuelve (estado, cuerpo, cabeceras) de base + ruta; estado None si no hubo respuesta."""
    cab = dict(AGENTE)
    if con_clave:
        cab['Authorization'] = 'Basic ' + base64.b64encode(('x:' + clave).encode()).decode()
    url = base + urllib.parse.quote(ruta, safe='/')
    ultimo = None
    for intento in range(3):
        try:
            with abridor.open(urllib.request.Request(url, headers=cab), timeout=90) as r:
                return r.status, r.read(), r.headers
        except urllib.error.HTTPError as e:
            return e.code, e.read(), e.headers
        except Exception as e:  # red caída o tiempo agotado: se reintenta
            ultimo = e
            time.sleep(2 * (intento + 1))
    return None, repr(ultimo).encode(), {}


def uno(rel):
    local = leer(rel)
    estado, cuerpo, _ = pedir('/' + rel)
    if rel in PRIVADOS:
        if estado != 401:
            return rel, f'ABIERTO sin contraseña (HTTP {estado})'
        if not clave:
            return rel, 'ok: pide contraseña (401); sin EMPLEO_PASSWORD no se compara'
        estado, cuerpo, _ = pedir('/' + rel, con_clave=True)
    if estado != 200:
        return rel, f'HTTP {estado}'
    if cuerpo == local:
        return rel, 'ok'
    if rel.endswith('.html') and BARRA.sub(b'', cuerpo) == local:
        return rel, 'ok (salvo la barra de Vercel de los despliegues de prueba)'
    return rel, f'DISTINTO ({len(local)} B en la carpeta, {len(cuerpo)} B servidos)'


t0 = time.time()
with ThreadPoolExecutor(max_workers=8) as ex:
    res = list(ex.map(uno, nombres))
mal = [(r, m) for r, m in res if not m.startswith('ok')]

# Lo que no es un archivo: el cierre de /empleo/ y las rutas que se reescriben hacia Shefa.
estado, _, cab = pedir('/empleo/')
if estado != 401:
    mal.append(('/empleo/', f'ABIERTO sin contraseña (HTTP {estado})'))
elif 'noindex' not in (cab.get('X-Robots-Tag') or '').lower():
    mal.append(('/empleo/', 'falta la cabecera X-Robots-Tag: noindex'))
for ruta in RUTAS_SHEFA:
    estado, _, _ = pedir(ruta)
    if estado != 200:
        mal.append((ruta, f'HTTP {estado}'))

print(f'{len(res)} archivos ({que}) contra {base} en {time.time() - t0:.0f} s')
cuenta = {}
for _, m in res:
    cuenta[m] = cuenta.get(m, 0) + 1
for m, n in sorted(cuenta.items()):
    print(f'  {n:4d}  {m}')
for r, m in mal:
    print('FALLO', r, m)

sucio = bool(cambios) and not arg.trabajo
if cambios:
    print(f'{"FALLO" if sucio else "Aviso"}: la carpeta tiene {len(cambios)} cambios sin confirmar en git:')
    for c in cambios[:20]:
        print('   ', c)
    if len(cambios) > 20:
        print(f'    … y {len(cambios) - 20} más')
if not mal and not sucio:
    print(f'Todo en orden: {base} sirve {que}; /empleo/ pide contraseña y las rutas de Shefa responden.')
sys.exit(1 if mal or sucio else 0)
