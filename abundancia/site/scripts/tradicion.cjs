#!/usr/bin/env node
/* Prueba de humo de las cinco páginas de Tradición sobre el sitio compilado.
 *
 *   npm run build && node scripts/tradicion.cjs
 *
 * Recorre: enlaces del portal, índice de página (pegado arriba y sección actual), sello del
 * día, hebreo de derecha a izquierda, enlaces externos en otra pestaña, orden de los
 * encabezados, filtro de prácticas con ratón y con teclado, marcas de la línea de tiempo,
 * matriz accesible, rutas con el prefijo del sitio y desbordamiento a 320 px.
 * Sale con código 1 si algo falla.
 */
const { chromium } = require('playwright');
const { servidor } = require('./capturas.cjs');
// Ancho de la vista de escritorio. Con «--ancho 1024» la misma prueba recorre el cuadrado compacto.
const iAncho = process.argv.indexOf('--ancho');
const ANCHO = iAncho > 0 ? Number(process.argv[iAncho + 1]) : 1440;

const RUTAS = ['/tradicion', '/tradicion/cabala', '/tradicion/hermetismo', '/tradicion/maestros', '/tradicion/practicas'];
let fallos = 0;
function comprobar(nombre, ok, detalle = '') {
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${nombre}${detalle ? `  (${detalle})` : ''}`);
}

(async () => {
  const { srv, base } = await servidor();
  const prefijo = new URL(base).pathname;
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: 900 }, locale: 'es-ES' });
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  p.on('response', (r) => { if (r.status() >= 400) errores.push(`${r.status()} ${r.url()}`); });

  // ---------- Comprobaciones comunes a las cinco páginas ----------
  for (const ruta of RUTAS) {
    await p.goto(base + ruta, { waitUntil: 'networkidle' });
    const d = await p.evaluate((pre) => {
      const internos = [...document.querySelectorAll('a[href^="/"], [src^="/"]')]
        .map((el) => el.getAttribute('href') || el.getAttribute('src'))
        .filter((u) => !u.startsWith(pre + '/') && u !== pre);
      const externos = [...document.querySelectorAll('main a[href^="http"]')];
      const malExternos = externos.filter((a) => a.target !== '_blank' || !/\bnoopener\b/.test(a.rel)).length;
      const niveles = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
      let saltos = 0;
      niveles.forEach((n, i) => { if (i > 0 && n > niveles[i - 1] + 1) saltos++; });
      const hebreo = [...document.querySelectorAll('main *')].filter((el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && /[֐-׿]/.test(n.textContent)));
      const malHebreo = hebreo.filter((el) => el.closest('[lang]')?.lang !== 'he' || el.closest('[dir]')?.dir !== 'rtl').length;
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      const anclas = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter(Boolean);
      return {
        internos, externos: externos.length, malExternos, h1: niveles.filter((n) => n === 1).length, saltos,
        hebreo: hebreo.length, malHebreo,
        repetidos: ids.filter((id, i) => ids.indexOf(id) !== i),
        rotas: anclas.filter((a) => !ids.includes(a)),
        sellos: [...document.querySelectorAll('.sello')].filter((s) => !s.hidden).length,
        actual: document.querySelector('.nav a[aria-current="page"]')?.textContent.trim(),
      };
    }, prefijo);
    comprobar(`${ruta}: rutas internas con el prefijo`, d.internos.length === 0, d.internos.slice(0, 3).join(' '));
    comprobar(`${ruta}: enlaces externos en otra pestaña con noopener`, d.malExternos === 0, `${d.externos} enlaces`);
    comprobar(`${ruta}: un h1 y encabezados en orden`, d.h1 === 1 && d.saltos === 0, `saltos: ${d.saltos}`);
    comprobar(`${ruta}: hebreo con lang="he" y dir="rtl"`, d.malHebreo === 0, `${d.hebreo} textos`);
    comprobar(`${ruta}: ids únicos y anclas que existen`, d.repetidos.length === 0 && d.rotas.length === 0, [...d.repetidos, ...d.rotas].slice(0, 4).join(' '));
    comprobar(`${ruta}: como mucho un sello`, d.sellos <= 1, String(d.sellos));
    comprobar(`${ruta}: el menú marca Tradición`, /Tradición/.test(d.actual || ''), d.actual);
  }

  // ---------- Portal ----------
  await p.goto(base + '/tradicion', { waitUntil: 'networkidle' });
  comprobar('portal: cuatro entradas', (await p.locator('.tr-entrada').count()) === 4);
  comprobar('portal: cinco etiquetas explicadas', (await p.locator('.tr-etqs .etiqueta').count()) === 5);
  comprobar('portal: seis pautas de respeto', (await p.locator('.tr-pautas li').count()) === 6);
  await p.locator('.tr-entrada-t a').first().click();
  await p.waitForLoadState('networkidle');
  comprobar('portal: la primera entrada abre Cábala', new URL(p.url()).pathname.replace(/\/$/, '') === `${prefijo}/tradicion/cabala`, p.url());

  // ---------- Cábala: índice, sello, tabla ----------
  comprobar('cábala: diez sefirot', (await p.locator('.tr-sef tbody tr').count()) === 10);
  comprobar('cábala: doce enseñanzas', (await p.locator('.tr-ens').count()) === 12);
  comprobar('cábala: la subnavegación marca la página', (await p.locator('.tr-sub a[aria-current="page"]').innerText()).includes('Cábala'));
  const hoy = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date().getDay()];
  const sello = p.locator(`.tr-dias [data-dia="${hoy}"] .sello`);
  comprobar('cábala: el sello marca el día de hoy', (await sello.isVisible()) && (await sello.innerText()) === String(new Date().getDate()));
  comprobar('cábala: el nombre de la sefirá abre el Árbol', (await p.locator('.tr-sef tbody tr').first().locator('a').first().getAttribute('href')) === `${prefijo}/arbol#keter`);

  comprobar('índice: empieza en la primera sección', (await p.locator('[data-indice] a[aria-current]').innerText()).includes('Contexto'));
  await p.locator('[data-indice] a[href="#ensenanzas"]').click();
  await p.waitForTimeout(250);
  const pos = await p.evaluate(() => ({
    barra: document.querySelector('[data-indice]').getBoundingClientRect(),
    seccion: document.getElementById('ensenanzas').getBoundingClientRect().top,
  }));
  comprobar('índice: se queda pegado arriba', Math.round(pos.barra.top) === 0, `top ${pos.barra.top}`);
  comprobar('índice: la sección no queda tapada', pos.seccion >= pos.barra.bottom - 1 && pos.seccion < 200, `sección a ${Math.round(pos.seccion)} px`);
  comprobar('índice: marca la sección actual', (await p.locator('[data-indice] a[aria-current]').innerText()).includes('Enseñanzas'));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(250);
  comprobar('índice: al final marca la última sección', (await p.locator('[data-indice] a[aria-current]').innerText()).includes('Fuentes'));
  await p.keyboard.press('Tab');
  const foco = await p.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return { etiqueta: el.tagName, contorno: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 };
  });
  comprobar('teclado: el foco se ve', foco.contorno, foco.etiqueta);

  // ---------- Hermetismo ----------
  await p.goto(base + '/tradicion/hermetismo', { waitUntil: 'networkidle' });
  comprobar('hermetismo: siete principios con su original en inglés', (await p.locator('.tr-prin').count()) === 7 && (await p.locator('.tr-prin figcaption [lang="en"]').count()) === 7);
  comprobar('hermetismo: ocho enseñanzas', (await p.locator('.tr-ens').count()) === 8);
  comprobar('hermetismo: el latín y el griego llevan su idioma', (await p.locator('[lang="la"]').count()) >= 5 && (await p.locator('[lang="grc"]').count()) === 1);

  // ---------- Maestros ----------
  await p.goto(base + '/tradicion/maestros', { waitUntil: 'networkidle' });
  comprobar('maestros: trece entradas y trece vidas', (await p.locator('.tr-maestro').count()) === 13 && (await p.locator('.tr-vida').count()) >= 13);
  comprobar('maestros: dieciocho hitos con su marca', (await p.locator('[data-hito]').count()) === 18 && (await p.locator('[data-marca]').count()) === 18);
  await p.locator('[data-hito="4"]').hover();
  comprobar('línea de tiempo: el hito destaca su marca', await p.locator('[data-marca="4"]').evaluate((el) => el.classList.contains('es')));
  await p.locator('.tr-crono-vidas a[href="#napoleon-hill"]').click();
  await p.waitForTimeout(250);
  const hill = await p.evaluate(() => document.getElementById('napoleon-hill').getBoundingClientRect().top);
  comprobar('línea de tiempo: el nombre lleva a la entrada', hill > 40 && hill < 200, `a ${Math.round(hill)} px`);
  const matriz = await p.evaluate(() => {
    const t = document.querySelector('.tr-matriz');
    return {
      filas: t.querySelectorAll('tbody tr').length,
      celdas: t.querySelectorAll('tbody td').length,
      conTexto: [...t.querySelectorAll('tbody td')].filter((td) => td.textContent.trim()).length,
      monedas: t.querySelectorAll('.tr-moneda').length,
      cabeceras: t.querySelectorAll('thead th[scope="col"]').length,
      caption: !!t.querySelector('caption'),
    };
  });
  comprobar('matriz: 13 filas, 10 columnas, cada celda con texto', matriz.filas === 13 && matriz.cabeceras === 10 && matriz.celdas === matriz.conTexto && matriz.caption, JSON.stringify(matriz));

  // ---------- Prácticas: filtro ----------
  await p.goto(base + '/tradicion/practicas', { waitUntil: 'networkidle' });
  const visibles = () => p.locator('[data-fila="practicas"]:visible').count();
  comprobar('prácticas: dieciséis filas', (await visibles()) === 16);
  await p.locator('[data-filtro="mañana"]').click();
  const nManiana = await visibles();
  const soloManiana = await p.locator('[data-fila="practicas"]:visible').evaluateAll((fs) => fs.every((f) => f.dataset.valor === 'mañana'));
  comprobar('filtro: «Mañana» deja solo las de la mañana', nManiana > 0 && nManiana < 16 && soloManiana, `${nManiana} filas`);
  comprobar('filtro: el botón queda pulsado', (await p.locator('[data-filtro="mañana"]').getAttribute('aria-pressed')) === 'true' && (await p.locator('[data-filtro=""]').getAttribute('aria-pressed')) === 'false');
  comprobar('filtro: el estado lo dice', (await p.locator('[data-filtro-estado]').innerText()).includes(`${nManiana} de 16`), await p.locator('[data-filtro-estado]').innerText());
  await p.locator('[data-filtro="noche"]').focus();
  await p.keyboard.press('Enter');
  comprobar('filtro: funciona con teclado (Intro)', (await p.locator('[data-fila="practicas"]:visible').evaluateAll((fs) => fs.length > 0 && fs.every((f) => f.dataset.valor === 'noche'))));
  await p.locator('[data-filtro=""]').focus();
  await p.keyboard.press('Space');
  comprobar('filtro: «Todas» devuelve las dieciséis (Espacio)', (await visibles()) === 16);
  comprobar('prácticas: calidad con palabra y barras', (await p.locator('.tr-prac .tr-cal').count()) === 16 && (await p.locator('.tr-prac .tr-cal svg rect.si').count()) > 16);
  comprobar('prácticas: ocho energías y el estudio', (await p.locator('.tr-ener tbody tr').count()) === 8 && (await p.locator('.tr-hallazgos li').count()) === 5);

  // ---------- Sin JavaScript: todo el contenido se lee igual ----------
  const sinJs = await navegador.newContext({ viewport: { width: ANCHO, height: 900 }, javaScriptEnabled: false });
  const q = await sinJs.newPage();
  await q.goto(base + '/tradicion/practicas', { waitUntil: 'load' });
  comprobar('sin JavaScript: la tabla se ve entera', (await q.locator('[data-fila="practicas"]:visible').count()) === 16);
  await sinJs.close();

  // ---------- Móvil: 320 px sin desbordamiento, tablas apiladas ----------
  const movil = await navegador.newContext({ viewport: { width: 320, height: 700 }, locale: 'es-ES' });
  const m = await movil.newPage();
  for (const ruta of RUTAS) {
    await m.goto(base + ruta, { waitUntil: 'networkidle' });
    const desborde = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(`${ruta}: sin desbordamiento a 320 px`, desborde <= 0, `${desborde} px`);
  }
  await m.goto(base + '/tradicion/practicas', { waitUntil: 'networkidle' });
  const filaMovil = await m.locator('[data-fila="practicas"]').first().evaluate((f) => ({
    ancho: f.getBoundingClientRect().width, rol: f.getAttribute('role'), display: getComputedStyle(f).display,
  }));
  comprobar('móvil: las filas se apilan y conservan su papel de fila', filaMovil.display === 'block' && filaMovil.rol === 'row' && filaMovil.ancho <= 320, JSON.stringify(filaMovil));
  await movil.close();

  comprobar('sin errores de página', errores.length === 0, errores.slice(0, 3).join(' | '));

  await navegador.close();
  srv.close();
  console.log(fallos ? `\n${fallos} comprobaciones fallan` : '\nTodo en orden');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
