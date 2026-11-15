#!/usr/bin/env node
/* Capturas del sitio compilado.
 *
 *   npm run build
 *   node scripts/capturas.cjs / /arbol
 *   node scripts/capturas.cjs --sin-muestra /          (pulsa «Empezar con mis datos» antes de capturar)
 *   node scripts/capturas.cjs --ancho 320 /arbol       (añade un ancho más, solo móvil)
 *
 * Sirve dist/ con un servidor estático propio (puerto 4321 o el siguiente libre), y por cada
 * ruta guarda en qa/ cuatro capturas de página entera: 1440 × 900 y 390 × 844, en claro y en
 * oscuro. Por cada captura imprime el desbordamiento horizontal en píxeles y los errores de
 * la página (excepciones, errores de consola y peticiones fallidas). Sale con código 1 si
 * hubo desbordamiento o errores.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
// Prefijo bajo el que se sirve el sitio (igual que `base` en astro.config.mjs).
const PREFIJO = '/shefa';
const DIST = path.join(RAIZ, 'dist');
const SALIDA = path.join(RAIZ, 'qa');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function servidor() {
  const srv = http.createServer((req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let archivo = path.join(DIST, ruta);
    if (!archivo.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
    else if (!fs.existsSync(archivo) && fs.existsSync(archivo + '.html')) archivo += '.html';
    else if (!fs.existsSync(archivo) && fs.existsSync(path.join(archivo, 'index.html'))) archivo = path.join(archivo, 'index.html');
    if (!fs.existsSync(archivo)) {
      const p404 = path.join(DIST, '404.html');
      res.writeHead(404, { 'content-type': TIPOS['.html'] });
      res.end(fs.existsSync(p404) ? fs.readFileSync(p404) : 'No encontrado');
      return;
    }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
    fs.createReadStream(archivo).pipe(res);
  });
  return new Promise((ok, mal) => {
    let puerto = 4321;
    srv.on('error', (e) => {
      if (e.code === 'EADDRINUSE' && puerto < 4340) srv.listen(++puerto, '127.0.0.1');
      else mal(e);
    });
    srv.on('listening', () => ok({ srv, base: `http://127.0.0.1:${puerto}${PREFIJO}` }));
    srv.listen(puerto, '127.0.0.1');
  });
}

const nombreDe = (ruta) => (ruta.replace(/^\/+|\/+$/g, '').replace(/[^\w-]+/g, '-') || 'hoy');

module.exports = { servidor };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const sinMuestra = args.includes('--sin-muestra');
  const iAncho = args.indexOf('--ancho');
  const anchoExtra = iAncho >= 0 ? Number(args[iAncho + 1]) : 0;
  const rutas = args.filter((a, i) => a.startsWith('/') && !(iAncho >= 0 && i === iAncho + 1));
  if (!rutas.length) rutas.push('/');
  if (!fs.existsSync(DIST)) { console.error('No existe dist/. Ejecuta antes: npm run build'); process.exit(2); }
  fs.mkdirSync(SALIDA, { recursive: true });

  const vistas = [
    { nombre: 'desktop', width: 1440, height: 900 },
    { nombre: 'mobile', width: 390, height: 844 },
  ];
  if (anchoExtra) vistas.push({ nombre: `w${anchoExtra}`, width: anchoExtra, height: 800 });

  const { srv, base } = await servidor();
  const navegador = await chromium.launch();
  let fallos = 0;

  for (const ruta of rutas) {
    for (const vista of vistas) {
      for (const tema of ['light', 'dark']) {
        const contexto = await navegador.newContext({
          viewport: { width: vista.width, height: vista.height },
          colorScheme: tema, deviceScaleFactor: 1, locale: 'es-ES',
        });
        const pagina = await contexto.newPage();
        const errores = [];
        pagina.on('pageerror', (e) => errores.push(`excepción: ${e.message}`));
        pagina.on('console', (m) => { if (m.type() === 'error') errores.push(`consola: ${m.text()}`); });
        pagina.on('requestfailed', (r) => {
          // El navegador corta la descarga de audio y video tras leer los metadatos: no es un fallo.
          const abortada = (r.failure() || {}).errorText === 'net::ERR_ABORTED';
          if (abortada && r.resourceType() === 'media') return;
          errores.push(`petición fallida: ${r.url()}`);
        });
        pagina.on('response', (r) => { if (r.status() >= 400) errores.push(`${r.status()}: ${r.url()}`); });

        await pagina.goto(base + ruta, { waitUntil: 'networkidle' });
        if (sinMuestra) {
          const boton = pagina.locator('[data-muestra] button').first();
          if (await boton.isVisible().catch(() => false)) await boton.click();
        }
        await pagina.evaluate(() => document.fonts.ready);
        await pagina.waitForTimeout(150);
        const desborde = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        const archivo = `${nombreDe(ruta)}-${vista.nombre}-${tema}${sinMuestra ? '-vacio' : ''}.png`;
        await pagina.screenshot({ path: path.join(SALIDA, archivo), fullPage: true });
        const mal = desborde > 0 || errores.length > 0;
        if (mal) fallos++;
        console.log(`${mal ? 'REVISAR' : 'ok     '} qa/${archivo}  desborde horizontal: ${Math.max(0, desborde)} px  errores: ${errores.length}`);
        errores.forEach((e) => console.log(`         ${e}`));
        await contexto.close();
      }
    }
  }

  await navegador.close();
  srv.close();
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
