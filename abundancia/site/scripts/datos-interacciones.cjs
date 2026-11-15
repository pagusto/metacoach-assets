#!/usr/bin/env node
/* Prueba de humo de /datos: calculadoras, banderas rojas, plegado de cifras y enlaces.
 *
 *   npm run build
 *   node scripts/datos-interacciones.cjs
 *
 * Sirve dist/ con el servidor de capturas.cjs y recorre la página con Playwright.
 * Sale con código 1 si alguna comprobación falla.
 */
const { chromium } = require('playwright');
const { servidor } = require('./capturas.cjs');

let fallos = 0;
let pruebas = 0;
function comprobar(nombre, ok, detalle = '') {
  pruebas++;
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLO'} ${nombre}${ok || !detalle ? '' : `: ${detalle}`}`);
}
const limpio = (s) => (s || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const { srv, base } = await servidor();
  const navegador = await chromium.launch();
  const errores = [];

  // ---------- Escritorio ----------
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-ES' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`excepción: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(`consola: ${m.text()}`); });
  await p.goto(`${base}/datos`, { waitUntil: 'networkidle' });

  const texto = async (clave) => limpio(await p.locator(`[data-v="${clave}"]`).first().textContent());
  const poner = (sel, valor) => p.locator(sel).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, valor);

  comprobar('la página marca «listo»', await p.evaluate(() => document.documentElement.classList.contains('listo')));
  comprobar('reparto: con los datos de muestra, la cifra se rotula como de muestra', (await p.locator('[data-v="r-origen-muestra"]').isVisible()) && !(await p.locator('[data-v="r-origen"]').isVisible()));
  comprobar('26 cifras con su fuente', (await p.locator('.d-cifras article.cf').count()) === 26 && (await p.locator('.d-cifras article.cf .fuente-cita').count()) === 26);
  comprobar('en escritorio las notas de las cifras están abiertas', await p.locator('.cf-d').evaluateAll((ds) => ds.every((d) => d.open)));

  // 1 · Interés compuesto
  comprobar('compuesto: valor por defecto', (await texto('c-final')) === '124.456', await texto('c-final'));
  await p.locator('#c-aporte').fill('500');
  const esperado = (ap, an, r) => {
    const i = Math.pow(1 + r / 100, 1 / 12) - 1;
    return i === 0 ? ap * an * 12 : (ap * (Math.pow(1 + i, an * 12) - 1)) / i;
  };
  const es = (n) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }).format(Math.round(n));
  comprobar('compuesto: 500 al mes', (await texto('c-final')) === es(esperado(500, 20, 5.2)), await texto('c-final'));
  comprobar('compuesto: total aportado', (await texto('c-aportado')) === '120.000', await texto('c-aportado'));
  await poner('#c-anios', 30);
  comprobar('compuesto: 30 años', (await texto('c-final')) === es(esperado(500, 30, 5.2)) && (await texto('c-anios')) === '30 años', await texto('c-final'));
  await p.locator('#c-anios').focus();
  await p.keyboard.press('ArrowRight');
  comprobar('compuesto: el plazo se mueve con el teclado', (await texto('c-anios')) === '31 años', await texto('c-anios'));
  await p.keyboard.press('ArrowLeft');
  await p.locator('#c-activo').selectOption({ index: 1 });
  comprobar('compuesto: el selector de activos pone el retorno', (await p.locator('#c-retorno').inputValue()) === '1,7', await p.locator('#c-retorno').inputValue());
  comprobar('compuesto: bonos globales', (await texto('c-final')) === es(esperado(500, 30, 1.7)), await texto('c-final'));
  await p.locator('#c-retorno').fill('3');
  comprobar('compuesto: un retorno propio deja el selector en «Otro valor»', (await p.locator('#c-activo').inputValue()) === '');
  await p.locator('#c-retorno').fill('0');
  comprobar('compuesto: con retorno 0 el valor es lo aportado', (await texto('c-final')) === '180.000' && (await texto('c-crecimiento')) === '0', await texto('c-final'));
  await p.locator('#c-retorno').fill('-2');
  comprobar('compuesto: admite un retorno negativo y dice con cuál calcula', (await texto('c-final')) === es(esperado(500, 30, -2)) && limpio(await p.locator('[data-v="c-retorno-t"]').textContent()) === '−2 %', `${await texto('c-final')} · ${await p.locator('[data-v="c-retorno-t"]').textContent()}`);
  await p.locator('#c-retorno').fill('200');
  comprobar('compuesto: un retorno fuera de rango se acota y se dice (100 %)', limpio(await p.locator('[data-v="c-retorno-t"]').textContent()) === '100 %');
  await p.locator('#c-retorno').fill('5,2');
  comprobar('compuesto: «5,2» vuelve a marcar acciones globales', (await p.locator('#c-activo').inputValue()) === '5.2', await p.locator('#c-activo').inputValue());
  comprobar('compuesto: la tabla año a año tiene 30 filas', (await p.locator('[data-v="c-tabla"] tr').count()) === 30);

  const grafico = p.locator('[data-v="c-grafico"]');
  await grafico.focus();
  await p.keyboard.press('ArrowLeft');
  comprobar('compuesto: lectura con teclado (año 29)', (await grafico.getAttribute('aria-valuenow')) === '29' && (await texto('c-lectura')).startsWith('Año 29:'), await texto('c-lectura'));
  await p.keyboard.press('Home');
  comprobar('compuesto: Inicio lleva al año 0', (await texto('c-lectura')).startsWith('Año 0: valor 0'), await texto('c-lectura'));
  const caja = await grafico.boundingBox();
  await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  comprobar('compuesto: lectura con el cursor (año 15)', (await texto('c-lectura')).startsWith('Año 15:'), await texto('c-lectura'));
  await p.mouse.move(caja.x - 60, caja.y - 60);
  comprobar('compuesto: al salir el cursor vuelve al último año', (await texto('c-lectura')).startsWith('Año 30:'), await texto('c-lectura'));

  // 2 · Reparto
  const partes = async () => Promise.all(['dar', 'ahorrar', 'vivir'].map(async (id) => Number(await p.locator(`#r-${id}`).inputValue())));
  comprobar('reparto: 10, 20 y 70 por defecto', JSON.stringify(await partes()) === '[10,20,70]', JSON.stringify(await partes()));
  comprobar('reparto: importes por defecto', (await texto('r-mes-dar')) === '380' && (await texto('r-anio-vivir')) === '31.920');
  await poner('#r-dar', 15);
  comprobar('reparto: dar a 15 sale de vivir', JSON.stringify(await partes()) === '[15,20,65]', JSON.stringify(await partes()));
  await poner('#r-vivir', 95);
  comprobar('reparto: vivir a 95 agota ahorrar y reduce dar', JSON.stringify(await partes()) === '[5,0,95]', JSON.stringify(await partes()));
  await poner('#r-ahorrar', 100);
  comprobar('reparto: ahorrar a 100 deja las otras a cero', JSON.stringify(await partes()) === '[0,100,0]', JSON.stringify(await partes()));
  await poner('#r-dar', 10);
  comprobar('reparto: sin vivir, dar sale de ahorrar', JSON.stringify(await partes()) === '[10,90,0]', JSON.stringify(await partes()));
  await poner('#r-ahorrar', 20);
  comprobar('reparto: de vuelta a 10, 20 y 70', JSON.stringify(await partes()) === '[10,20,70]', JSON.stringify(await partes()));
  await p.locator('#r-ingreso').fill('5.000');
  comprobar('reparto: 5.000 al mes con 10/20/70', (await texto('r-mes-dar')) === '500' && (await texto('r-mes-ahorrar')) === '1.000' && (await texto('r-mes-vivir')) === '3.500' && (await texto('r-anio-ahorrar')) === '12.000');
  comprobar('reparto: porcentajes escritos', (await texto('r-pct-vivir')) === '70 %', await texto('r-pct-vivir'));
  comprobar('reparto: la franja tiene sus tres partes', (await p.locator('[data-v="r-franja"] rect').count()) === 3);

  // 3 · Independencia
  comprobar('independencia: 36,7 años por defecto', (await texto('i-anios')) === '36,7', await texto('i-anios'));
  await poner('#i-tasa', 50);
  comprobar('independencia: al 50 % son 16,6 años', (await texto('i-anios')) === '16,6', await texto('i-anios'));
  await p.locator('#i-retorno').fill('0');
  await poner('#i-tasa', 25);
  comprobar('independencia: al 25 % sin retorno son 75 años', (await texto('i-anios')) === '75,0', await texto('i-anios'));
  comprobar('independencia: el supuesto repite el retorno', (await texto('i-retorno-t')) === '0 %', await texto('i-retorno-t'));
  comprobar('independencia: la curva se dibuja', (await p.locator('[data-v="i-grafico"] path.lc-azul').count()) === 1);
  await p.locator('#i-retorno').fill('5');

  // 4 · Subir el precio
  comprobar('precio: +200 y +12,5 % por defecto', (await texto('p-cambio')) === '+200' && (await texto('p-cambio-pct')) === '+12,5 %', `${await texto('p-cambio')} ${await texto('p-cambio-pct')}`);
  comprobar('precio: equilibrio al 20 %', (await texto('p-equilibrio')).includes('20 %'), await texto('p-equilibrio'));
  await p.locator('#p-pierde').fill('20');
  comprobar('precio: en el equilibrio el cambio es 0', (await texto('p-cambio')) === '0', await texto('p-cambio'));
  await p.locator('#p-pierde').fill('30');
  comprobar('precio: perder el 30 % resta 200', (await texto('p-cambio')) === '−200' && (await texto('p-cambio-pct')) === '−12,5 %', `${await texto('p-cambio')} ${await texto('p-cambio-pct')}`);
  await p.locator('#p-coste').fill('200');
  comprobar('precio: si el precio nuevo no cubre el coste, lo dice', (await texto('p-equilibrio')).includes('no cubre el coste'), await texto('p-equilibrio'));
  await p.locator('#p-coste').fill('60');
  await p.locator('#p-pierde').fill('10');

  // 5 · Evaluador
  comprobar('evaluador: 12 de 20 por defecto', (await texto('e-total')) === '12' && (await texto('e-titulo')) === 'Refuérzala antes de probar');
  for (let i = 0; i < 4; i++) await p.locator(`input[name="e-${i}"][value="5"]`).check({ force: true });
  comprobar('evaluador: todo 5 da 20 y «Pruébala»', (await texto('e-total')) === '20' && (await texto('e-titulo')) === 'Pruébala', await texto('e-total'));
  await p.locator('input[name="e-3"][value="5"]').focus();
  await p.keyboard.press('ArrowLeft');
  comprobar('evaluador: las flechas cambian la respuesta', (await texto('e-total')) === '19' && (await texto('e-floja')).includes('crezca sin más horas'), `${await texto('e-total')} · ${await texto('e-floja')}`);
  for (let i = 0; i < 4; i++) await p.locator(`input[name="e-${i}"][value="1"]`).check({ force: true });
  comprobar('evaluador: todo 1 da 4 y «Déjala por ahora»', (await texto('e-total')) === '4' && (await texto('e-titulo')) === 'Déjala por ahora');

  // Banderas rojas
  const casillas = p.locator('input[name="bandera"]');
  comprobar('banderas: 12 casillas', (await casillas.count()) === 12);
  comprobar('banderas: sin marcas no hay sello y el botón está inactivo', !(await p.locator('[data-v="b-n"]').evaluate((el) => el.classList.contains('sello'))) && (await p.locator('[data-v="b-borrar"]').isDisabled()));
  await casillas.nth(0).check();
  comprobar('banderas: una marca', (await texto('b-n')) === '1' && (await texto('b-veredicto')).startsWith('Una bandera'), await texto('b-veredicto'));
  comprobar('banderas: el sello aparece con la primera', await p.locator('[data-v="b-n"]').evaluate((el) => el.classList.contains('sello')));
  await casillas.nth(1).focus();
  await p.keyboard.press('Space');
  comprobar('banderas: se marcan con la barra espaciadora', (await texto('b-n')) === '2' && (await texto('b-veredicto')).startsWith('2 banderas. No pongas'), await texto('b-veredicto'));
  await casillas.nth(5).check();
  await casillas.nth(11).check();
  comprobar('banderas: cuatro marcas, patrón de estafa', (await texto('b-n')) === '4' && (await texto('b-veredicto')).includes('patrón de una estafa'), await texto('b-veredicto'));
  comprobar('banderas: un solo sello en la página', (await p.locator('.sello').count()) === 1);
  await p.locator('[data-v="b-borrar"]').click();
  comprobar('banderas: borrar deja todo a cero', (await texto('b-n')) === '0' && (await casillas.evaluateAll((cs) => cs.every((c) => !c.checked))) && (await p.locator('.sello').count()) === 0);

  // Nada se guarda
  comprobar('las calculadoras no escriben en el almacenamiento', await p.evaluate(() => localStorage.getItem('shefa-v2') === null));

  // Enlaces
  const enlaces = await p.evaluate(() => Array.from(document.querySelectorAll('main a')).map((a) => ({ href: a.getAttribute('href') || '', target: a.target, rel: a.rel })));
  const externos = enlaces.filter((a) => /^https?:/.test(a.href));
  comprobar(`enlaces externos (${externos.length}) con target _blank y rel noopener`, externos.length > 40 && externos.every((a) => a.target === '_blank' && /noopener/.test(a.rel)));
  const raiz = await p.evaluate(() => Array.from(document.querySelectorAll('[href^="/"], [src^="/"]')).map((e) => e.getAttribute('href') || e.getAttribute('src')).filter((u) => !u.startsWith('/shefa/') && u !== '/shefa'));
  comprobar('ninguna ruta interna sin el prefijo', raiz.length === 0, raiz.join(', '));
  const anclas = enlaces.filter((a) => a.href.startsWith('#'));
  const rotas = await p.evaluate((ids) => ids.filter((id) => !document.getElementById(id)), anclas.map((a) => a.href.slice(1)));
  comprobar(`anclas internas (${anclas.length}) con destino`, anclas.length >= 5 && rotas.length === 0, rotas.join(', '));
  const ids = await p.evaluate(() => {
    const vistos = new Map();
    document.querySelectorAll('[id]').forEach((e) => vistos.set(e.id, (vistos.get(e.id) || 0) + 1));
    return Array.from(vistos).filter(([, n]) => n > 1).map(([id]) => id);
  });
  comprobar('ningún id repetido', ids.length === 0, ids.join(', '));
  const sinNombre = await p.evaluate(() => Array.from(document.querySelectorAll('main input, main select, main textarea')).filter((el) => !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map((el) => el.id || el.name));
  comprobar('todos los controles tienen etiqueta', sinNombre.length === 0, sinNombre.join(', '));
  const niveles = await p.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3, h4, h5')).map((h) => Number(h.tagName[1])));
  comprobar('encabezados en orden, sin saltos', niveles[0] === 1 && niveles.every((n, i) => i === 0 || n - niveles[i - 1] <= 1), niveles.join(''));
  await ctx.close();

  // ---------- El ingreso del reparto sale del libro de fuentes guardado ----------
  const ctx2 = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-ES' });
  await ctx2.addInitScript(() => {
    localStorage.setItem('shefa-v2', JSON.stringify({ v: 2, ejemplo: false, cifra: 9000, fuentes: [{ id: 'a', nombre: 'Clases', tipo: 'Servicio', estado: 'ingresando', mensual: 4200, accion: '' }, { id: 'b', nombre: 'Guía', tipo: 'Digital', estado: 'probando', mensual: 800, accion: '' }] }));
  });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errores.push(`excepción: ${e.message}`));
  await p2.goto(`${base}/datos`, { waitUntil: 'networkidle' });
  comprobar('reparto: propone el ingreso del libro de fuentes (5.000)', (await p2.locator('#r-ingreso').inputValue()) === '5.000' && (await p2.locator('[data-v="r-origen"]').isVisible()) && !(await p2.locator('[data-v="r-origen-muestra"]').isVisible()), await p2.locator('#r-ingreso').inputValue());
  comprobar('reparto: los importes usan ese ingreso', limpio(await p2.locator('[data-v="r-mes-ahorrar"]').textContent()) === '1.000');
  await p2.locator('#r-ingreso').fill('2.000');
  comprobar('reparto: al escribir, el aviso del libro se oculta', !(await p2.locator('[data-v="r-origen"]').isVisible()));
  comprobar('reparto: lo guardado no cambia', await p2.evaluate(() => JSON.parse(localStorage.getItem('shefa-v2')).fuentes[0].mensual === 4200));
  await ctx2.close();

  // ---------- Móvil ----------
  const ctx3 = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES', hasTouch: true });
  const m = await ctx3.newPage();
  m.on('pageerror', (e) => errores.push(`excepción: ${e.message}`));
  await m.goto(`${base}/datos`, { waitUntil: 'networkidle' });
  comprobar('móvil: las notas de las cifras empiezan plegadas', await m.locator('.cf-d').evaluateAll((ds) => ds.every((d) => !d.open)));
  await m.locator('.cf-d summary').first().click();
  comprobar('móvil: «Nota y fuente» despliega la nota', await m.locator('.cf-d').first().evaluate((d) => d.open) && (await m.locator('.cf-d').first().locator('.fuente-cita').isVisible()));
  await m.locator('#precio a[href^="#c-"]').click();
  const abierta = () => m.waitForFunction(() => document.querySelector('#c-precio-uno-por-ciento .cf-d').open, null, { timeout: 3000 }).then(() => true, () => false);
  comprobar('móvil: «Ver la cifra» abre la cifra enlazada', await abierta());
  await m.locator('#c-precio-uno-por-ciento .cf-d summary').click();
  await m.locator('#precio a[href^="#c-"]').click();
  comprobar('móvil: «Ver la cifra» la vuelve a abrir tras cerrarla a mano', await abierta());
  for (const ancho of [390, 320]) {
    await m.setViewportSize({ width: ancho, height: 800 });
    const desborde = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(`móvil ${ancho} px: sin desbordamiento horizontal`, desborde <= 0, `${desborde} px`);
  }
  const pequenos = await m.evaluate(() => Array.from(document.querySelectorAll('main p, main li, main dd, main dt, main span, main a, main label, main th, main td, main summary, main figcaption, main legend'))
    .filter((el) => el.offsetParent && el.childNodes.length && Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => `${el.className || el.tagName}:${getComputedStyle(el).fontSize}`).slice(0, 5));
  comprobar('móvil: ningún texto por debajo de 14 px', pequenos.length === 0, pequenos.join(', '));
  await ctx3.close();

  comprobar('sin errores de página', errores.length === 0, errores.join(' | '));
  console.log(`\n${pruebas} comprobaciones, ${fallos} fallos`);
  await navegador.close();
  srv.close();
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
