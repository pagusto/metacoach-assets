#!/usr/bin/env node
/* Comprobación en vivo de Shefa con un navegador real.
 *
 *   node scripts/vivo.cjs https://shefa-prosperai.vercel.app/shefa
 *   node scripts/vivo.cjs https://pabloagusto.vercel.app/shefa dist/shefa     (antes: npm run build)
 *
 * Por cada una de las 15 rutas: responde 200, sin errores de página ni peticiones fallidas, con
 * los estilos aplicados (la variable --M tiene valor) y, si se pasa la carpeta compilada, con un
 * HTML idéntico al de local, byte a byte.
 * /colores: la película carga metadatos, avanza al reproducir, los subtítulos cargan y el aviso
 * «todavía no está disponible» sigue oculto.
 * /videoteca: todas las miniaturas responden, ninguna entrada queda retirada y el reproductor de
 * YouTube responde.
 * Sale con código 1 si algo falla y con 2 si no pudo empezar.
 *
 * La película es H.264 y el Chromium de Playwright para Windows no lo trae: se usa Edge o Chrome
 * si están instalados (channel: 'msedge' o 'chrome'). Playwright está instalado de forma global:
 * export NODE_PATH="$(npm root -g)".
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || '').replace(/\/+$/, '');
const DIST = process.argv[3] ? path.resolve(process.argv[3]) : null;
if (!/^https?:\/\//.test(BASE)) {
  console.error('Uso: node scripts/vivo.cjs <base> [dist/shefa]\n  p. ej. node scripts/vivo.cjs https://shefa-prosperai.vercel.app/shefa dist/shefa');
  process.exit(2);
}
if (DIST && !fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`No encuentro ${path.join(DIST, 'index.html')}. Ejecuta antes: npm run build, y pasa dist/shefa.`);
  process.exit(2);
}

// Las 15 rutas del sitio ('' es Hoy). Si añades una página, añádela aquí: con la carpeta
// compilada, el script falla cuando la lista y dist/shefa no coinciden.
const RUTAS = ['', 'arbol', 'ritual', 'tradicion', 'tradicion/cabala', 'tradicion/hermetismo', 'tradicion/maestros',
  'tradicion/practicas', 'espacio', 'datos', 'videoteca', 'colores', 'agentes', 'metodo', 'sistema'];

let fallos = 0;
const ok = (cond, texto, extra = '') => {
  if (!cond) fallos++;
  console.log(`${cond ? 'ok   ' : 'FALLO'} ${texto}${extra ? ' · ' + extra : ''}`);
};
const huella = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);
const nombre = (r) => `/${r || '(Hoy)'}`;

// Rutas compiladas en local: cada index.html de dist/shefa, salvo la página 404.
function rutasCompiladas(dir, rel = '') {
  const rutas = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.isDirectory()) rutas.push(...rutasCompiladas(dir, path.posix.join(rel, e.name)));
    else if (e.name === 'index.html') rutas.push(rel);
  }
  return rutas;
}

async function abrirNavegador() {
  for (const channel of ['msedge', 'chrome']) {
    try { return { b: await chromium.launch({ channel }), cual: channel }; } catch { /* no está instalado: siguiente */ }
  }
  return { b: await chromium.launch(), cual: 'chromium de Playwright' };
}

(async () => {
  const { b, cual } = await abrirNavegador();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-ES' });
  const sonda = await c.newPage();
  const h264 = await sonda.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') !== '');
  await sonda.close();
  console.log(`Base: ${BASE} · navegador: ${cual}${h264 ? '' : ' (sin H.264: la película no se podrá reproducir)'}`);

  if (DIST) {
    const compiladas = rutasCompiladas(DIST).sort();
    const sobran = compiladas.filter((r) => !RUTAS.includes(r));
    const faltan = RUTAS.filter((r) => !compiladas.includes(r));
    ok(sobran.length === 0 && faltan.length === 0, `la lista de ${RUTAS.length} rutas coincide con las páginas compiladas`,
      [sobran.length ? `sin comprobar: ${sobran.map(nombre).join(', ')}` : '', faltan.length ? `no compiladas: ${faltan.map(nombre).join(', ')}` : ''].filter(Boolean).join(' · '));
  }

  for (const r of RUTAS) {
    const p = await c.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(`excepción: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error') errores.push(`consola: ${m.text()}`); });
    p.on('requestfailed', (q) => {
      const motivo = (q.failure() || {}).errorText;
      if (motivo === 'net::ERR_ABORTED' && q.resourceType() === 'media') return; // corte normal tras leer los metadatos
      errores.push(`petición fallida: ${q.url()} ${motivo}`);
    });
    p.on('response', (s) => { if (s.status() >= 400) errores.push(`${s.status()}: ${s.url()}`); });

    const url = `${BASE}/${r}`;
    let resp = null;
    try {
      resp = await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      ok(false, nombre(r), `no cargó: ${String(e.message).split('\n')[0]}`);
      await p.close();
      continue;
    }
    const d = await p.evaluate(() => ({
      hojas: document.styleSheets.length,
      reglas: [...document.styleSheets].reduce((n, h) => { try { return n + h.cssRules.length; } catch { return n; } }, 0),
      modulo: getComputedStyle(document.documentElement).getPropertyValue('--M').trim(),
      fuente: getComputedStyle(document.body).fontFamily.split(',')[0].trim(),
      titulo: document.title,
    }));
    const estilos = d.reglas > 50 && d.modulo !== '';
    ok(resp.status() === 200 && estilos && errores.length === 0, nombre(r),
      `HTTP ${resp.status()} · ${d.hojas} hojas, ${d.reglas} reglas, --M ${d.modulo || 'vacío'}, fuente ${d.fuente} · «${d.titulo}»` +
      (errores.length ? ` · ${errores.join(' | ')}` : ''));

    if (DIST) {
      const local = path.join(DIST, r, 'index.html');
      const servido = await (await c.request.get(url)).body();
      const igual = fs.existsSync(local) && huella(servido) === huella(fs.readFileSync(local));
      ok(igual, `${nombre(r)}: HTML idéntico al compilado en local`,
        igual ? '' : `${servido.length} B servidos; ${fs.existsSync(local) ? `${fs.statSync(local).size} B en local` : 'no existe en local'}`);
    }

    if (r === 'colores') {
      const v = await p.evaluate(async () => {
        const el = document.querySelector('video[data-v="pelicula"]');
        if (!el) return null;
        const espera = (ms) => new Promise((res) => setTimeout(res, ms));
        await Promise.race([
          new Promise((res) => { if (el.readyState >= 1) res(); el.addEventListener('loadedmetadata', res, { once: true }); el.addEventListener('error', res, { once: true }); }),
          espera(30000),
        ]);
        el.muted = true;
        let avanza = false; let motivo = '';
        try { await el.play(); await espera(2500); avanza = el.currentTime > 0.5; el.pause(); } catch (e) { motivo = String(e.message || e); }
        const pista = el.querySelector('track');
        const aviso = document.querySelector('[data-v="pelicula-falta"]');
        return {
          listo: el.readyState, duracion: el.duration, ancho: el.videoWidth, alto: el.videoHeight,
          error: el.error ? el.error.code : null, avanza, motivo, fuente: el.currentSrc,
          subtitulos: pista ? pista.readyState : -1, // 2 = cargados
          cartel: el.poster, hayAviso: !!aviso, avisoVisible: aviso ? !aviso.hidden : false,
        };
      });
      ok(v && v.listo >= 1 && v.duracion > 10 && v.ancho > 0 && v.error === null, 'película: carga metadatos',
        v ? `${Math.round(v.duracion)} s, ${v.ancho}×${v.alto}, readyState ${v.listo}, error ${v.error} · ${v.fuente}` : 'no hay <video data-v="pelicula">');
      ok(v && v.avanza, 'película: avanza al reproducir', v ? (v.motivo || (h264 ? '' : 'este navegador no trae H.264')) : '');
      ok(v && v.subtitulos === 2, 'película: subtítulos cargados', v ? `readyState de la pista ${v.subtitulos}` : '');
      ok(v && v.hayAviso && !v.avisoVisible, 'película: el aviso «todavía no está disponible» sigue oculto', v && !v.hayAviso ? 'no encuentro el aviso en la página' : '');
      if (v && v.cartel) { const cartel = await c.request.get(v.cartel); ok(cartel.status() === 200, 'película: cartel', `${cartel.status()} ${v.cartel}`); }
    }

    if (r === 'videoteca') {
      const minis = [...new Set(await p.evaluate(() => [...document.querySelectorAll('img[data-mini]')].map((i) => i.getAttribute('src'))))];
      const malas = [];
      for (const u of minis) { const s = await c.request.get(u); if (s.status() !== 200) malas.push(`${s.status()} ${u}`); }
      ok(minis.length > 0 && malas.length === 0, `videoteca: ${minis.length} miniaturas distintas responden 200`, malas.join(' | '));
      const pintadas = await p.locator('[data-lista] > li:not([hidden])').count();
      const caidas = await p.locator('.vt[data-caido]').count();
      ok(pintadas > 0 && caidas === 0, `videoteca: ${pintadas} entradas pintadas, ${caidas} retiradas`);
      // Reproductor: lo que YouTube escriba en la consola no cuenta como error del sitio.
      p.removeAllListeners('console'); p.removeAllListeners('requestfailed'); p.removeAllListeners('response');
      const primera = p.locator('[data-lista] .vt').first();
      const [incrustado] = await Promise.all([
        p.waitForResponse((s) => s.url().startsWith('https://www.youtube-nocookie.com/embed/'), { timeout: 30000 }).catch(() => null),
        primera.locator('[data-ver]').click(),
      ]);
      const src = await primera.locator('iframe').getAttribute('src').catch(() => null);
      ok(incrustado && incrustado.status() === 200, 'videoteca: el reproductor de YouTube responde', `${incrustado ? incrustado.status() : 'sin respuesta'} ${src}`);
    }
    await p.close();
  }

  await b.close();
  console.log(fallos ? `${fallos} fallo(s)` : 'Todo en orden');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
