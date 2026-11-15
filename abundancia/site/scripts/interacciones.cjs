#!/usr/bin/env node
/* Prueba de humo de las interacciones de Hoy y Árbol sobre el sitio compilado.
 *
 *   npm run build && node scripts/interacciones.cjs
 *
 * Recorre: tema, ritual (persiste al recargar), edición en Hoy, selección de las diez
 * sefirot con teclado, Jésed y Guevurá, libro de fuentes (añadir, editar, quitar),
 * ideas y evidencias, exportar, importar, reiniciar, «Empezar con mis datos» y
 * desbordamiento a 320 px. Sale con código 1 si algo falla.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const { servidor } = require('./capturas.cjs');

let fallos = 0;
function comprobar(nombre, ok, detalle = '') {
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${nombre}${detalle ? `  (${detalle})` : ''}`);
}
const fino = (s) => s.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const { srv, base } = await servidor();
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', locale: 'es-ES', acceptDownloads: true });
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  const texto = async (sel) => fino(await p.locator(sel).first().innerText());
  const estado = () => p.evaluate(() => JSON.parse(localStorage.getItem('shefa-v2') || 'null'));

  // ---------- Hoy ----------
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  comprobar('Hoy: aviso de muestra visible', await p.locator('[data-muestra]').isVisible());

  await p.click('[data-tema]');
  comprobar('tema: pasa a oscuro', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
  await p.reload({ waitUntil: 'networkidle' });
  comprobar('tema: persiste al recargar', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
  await p.click('[data-tema]');
  comprobar('tema: al volver al del sistema no guarda nada', (await p.evaluate(() => localStorage.getItem('shefa-tema'))) === null);

  for (const i of [0, 1, 2, 3]) await p.locator(`[data-paso="${i}"]`).check();
  comprobar('ritual: cuenta 4 de 5', (await texto('[data-v="ritual-cuenta"]')) === '4 de 5');
  await p.reload({ waitUntil: 'networkidle' });
  comprobar('ritual: persiste al recargar', (await p.locator('[data-paso]:checked').count()) === 4);
  comprobar('ritual: racha de 1 día', (await texto('[data-v="racha"]')) === '1 día');

  await p.click('[data-editar="cifra"]');
  await p.fill('#f-cifra', '12.000');
  await p.fill('#f-fecha', '2027-12-31');
  await p.click('[data-form="cifra"] button[type="submit"]');
  comprobar('cifra: se edita', (await texto('[data-v="cifra"]')) === '12.000', await texto('[data-v="cifra"]'));
  comprobar('cifra: fecha', (await texto('[data-v="cifra-fecha"]')).includes('31 de diciembre de 2027'));

  await p.click('[data-editar="declaracion"]');
  await p.fill('#f-declaracion', 'Sirvo con oficio. Cobro lo justo.');
  await p.click('[data-form="declaracion"] button[type="submit"]');
  comprobar('declaración: se edita', (await texto('[data-v="declaracion"]')).includes('Cobro lo justo.'));

  await p.click('[data-editar="ahorro"]');
  await p.fill('#f-ahorro', '15,5');
  await p.keyboard.press('Enter');
  comprobar('ahorro: se edita con coma decimal', (await texto('[data-v="ahorro"]')) === '15,5 %', await texto('[data-v="ahorro"]'));
  comprobar('ahorro: 16 puntos llenos', (await p.locator('[data-v="ahorro-puntos"] .lleno').count()) === 16);

  // ---------- Árbol ----------
  await p.goto(base + '/arbol', { waitUntil: 'networkidle' });
  const ids = ['keter', 'jojma', 'bina', 'jesed', 'guevura', 'tiferet', 'netsaj', 'hod', 'yesod', 'maljut'];
  await p.locator('.nodo[data-id="keter"]').focus();
  await p.keyboard.press('Enter');
  let teclado = true;
  for (let i = 0; i < ids.length; i++) {
    const elegido = await p.evaluate(() => document.querySelector('.nodo[aria-pressed="true"]')?.dataset.id);
    const visible = await p.evaluate(() => [...document.querySelectorAll('.det')].filter((a) => !a.hidden).map((a) => a.dataset.det).join());
    if (elegido !== ids[i] || visible !== ids[i]) { teclado = false; console.log(`      esperaba ${ids[i]}: nodo ${elegido}, detalle ${visible}`); }
    await p.keyboard.press('ArrowDown');
  }
  comprobar('árbol: las diez sefirot se eligen con el teclado (flechas)', teclado);
  await p.locator('.nodo[data-id="hod"]').focus();
  await p.keyboard.press('Space');
  comprobar('árbol: espacio elige el nodo enfocado', (await p.locator('.nodo[aria-pressed="true"]').getAttribute('data-id')) === 'hod');
  comprobar('árbol: un solo sello', (await p.locator('.nodo[aria-pressed="true"]').count()) === 1);

  await p.fill('#h-evidencia', 'Un cliente me recomendó');
  await p.keyboard.press('Enter');
  comprobar('Hod: añade una evidencia', (await texto('.nodo[data-id="hod"] .nodo-v')) === '1');
  await p.click('.nodo[data-id="jojma"]');
  await p.fill('#j-idea', 'Taller de fin de semana');
  await p.keyboard.press('Enter');
  comprobar('Jojmá: añade una idea', (await p.locator('[data-lista="ideas"] li').count()) === 1 && (await texto('.nodo[data-id="jojma"] .nodo-v')) === '2');
  await p.click('[data-quitar-idea="0"]');
  comprobar('Jojmá: quita la idea', (await texto('.nodo[data-id="jojma"] .nodo-v')) === '1');

  await p.click('.nodo[data-id="jesed"]');
  await p.fill('#c-jesed', '7');
  await p.click('[data-form="jesed"] button[type="submit"]');
  comprobar('Jésed: 7 %', (await texto('.nodo[data-id="jesed"] .nodo-v')) === '7 %', await texto('.nodo[data-id="jesed"] .nodo-v'));
  await p.click('.nodo[data-id="guevura"]');
  await p.fill('#c-guevura', '18');
  await p.keyboard.press('Enter');
  comprobar('Guevurá: 18 %', (await texto('.nodo[data-id="guevura"] .nodo-v')) === '18 %');
  comprobar('Guevurá: el detalle lo refleja', (await texto('[data-det="guevura"] [data-valor]')) === '18 %');

  await p.click('.nodo[data-id="keter"]');
  await p.fill('#k-cifra', '10000');
  await p.click('[data-form="keter"] button[type="submit"]');
  comprobar('Kéter: guarda la cifra', (await estado()).cifra === 10000);

  // Libro: añadir, editar todos los campos, quitar
  await p.click('[data-v="anadir"]');
  comprobar('libro: añade una fila', (await p.locator('[data-v="filas"] tr').count()) === 4);
  const fila = p.locator('[data-v="filas"] tr').nth(3);
  await fila.locator('[data-campo="nombre"]').fill('Curso en línea');
  await fila.locator('[data-campo="tipo"]').selectOption('Digital');
  await fila.locator('[data-campo="estado"]').selectOption('ingresando');
  await fila.locator('[data-campo="mensual"]').fill('1500');
  await fila.locator('[data-campo="accion"]').fill('Grabar el primer módulo');
  await fila.locator('[data-campo="accion"]').press('Enter');
  let s = await estado();
  const nueva = s.fuentes[3];
  comprobar('libro: guarda todos los campos', nueva.nombre === 'Curso en línea' && nueva.tipo === 'Digital' && nueva.estado === 'ingresando' && nueva.mensual === 1500 && nueva.accion === 'Grabar el primer módulo', JSON.stringify(nueva));
  comprobar('libro: el importe se formatea', (await fila.locator('[data-campo="mensual"]').inputValue()) === '1.500');
  comprobar('libro: el medidor suma', (await texto('[data-v="meta-total"]')) === '5.300', await texto('[data-v="meta-total"]'));
  comprobar('libro: rótulo «4 fuentes»', (await texto('#libro [data-etiqueta]')) === '4 fuentes');
  const primera = p.locator('[data-v="filas"] tr').nth(0);
  await primera.locator('[data-campo="mensual"]').fill('4.000');
  await primera.locator('[data-campo="mensual"]').press('Tab');
  comprobar('libro: edita una fila existente', (await estado()).fuentes[0].mensual === 4000 && (await texto('[data-v="meta-total"]')) === '6.100');
  await fila.locator('[data-quitar]').click();
  comprobar('libro: quitar pide confirmación en la página', await fila.locator('.confirma').isVisible());
  await fila.locator('[data-no]').click();
  comprobar('libro: cancelar no quita', (await p.locator('[data-v="filas"] tr').count()) === 4);
  await fila.locator('[data-quitar]').click();
  await fila.locator('[data-si]').click();
  comprobar('libro: quita la fila', (await p.locator('[data-v="filas"] tr').count()) === 3 && (await estado()).fuentes.length === 3);

  // Exportar, importar, reiniciar
  const [descarga] = await Promise.all([p.waitForEvent('download'), p.click('[data-v="exportar"]')]);
  const destino = path.join(os.tmpdir(), `shefa-prueba-${Date.now()}.json`);
  await descarga.saveAs(destino);
  const copia = JSON.parse(fs.readFileSync(destino, 'utf8'));
  comprobar('exportar: descarga un JSON con el estado', /^shefa-\d{4}-\d{2}-\d{2}\.json$/.test(descarga.suggestedFilename()) && copia.fuentes.length === 3 && copia.donadoPct === 7);
  copia.donadoPct = 9;
  copia.fuentes.push({ id: 'imp1', nombre: 'Importada', tipo: 'Activo', estado: 'idea', mensual: 0, accion: '' });
  fs.writeFileSync(destino, JSON.stringify(copia));
  await p.setInputFiles('[data-v="importar"]', destino);
  await p.waitForFunction(() => document.querySelectorAll('[data-v="filas"] tr').length === 4);
  comprobar('importar: carga el archivo', (await estado()).donadoPct === 9 && (await texto('.nodo[data-id="jesed"] .nodo-v')) === '9 %');
  const malo = path.join(os.tmpdir(), `shefa-malo-${Date.now()}.json`);
  fs.writeFileSync(malo, '{"hola":1}');
  await p.setInputFiles('[data-v="importar"]', malo);
  await p.waitForFunction(() => (document.querySelector('[data-v="estado-datos"]')?.textContent || '').includes('no es una copia'));
  comprobar('importar: rechaza un archivo ajeno', (await estado()).fuentes.length === 4);
  fs.rmSync(destino); fs.rmSync(malo);

  await p.click('[data-v="reiniciar"]');
  comprobar('reiniciar: pide confirmación en la página', await p.locator('[data-v="confirma"]').isVisible());
  await p.click('[data-v="no-reiniciar"]');
  comprobar('reiniciar: cancelar no borra', (await estado()).fuentes.length === 4);
  await p.click('[data-v="reiniciar"]');
  await p.click('[data-v="si-reiniciar"]');
  s = await estado();
  comprobar('reiniciar: vuelve a la muestra', s.ejemplo === true && s.fuentes.length === 3 && s.donadoPct === 4 && (await p.locator('[data-muestra]').isVisible()));

  // Empezar con mis datos (estado vacío)
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  await p.click('[data-muestra] button');
  s = await estado();
  comprobar('muestra: «Empezar con mis datos» borra los ejemplos', s.ejemplo === false && s.fuentes.length === 0 && s.declaracion === '');
  comprobar('muestra: el aviso desaparece', !(await p.locator('[data-muestra]').isVisible()));
  comprobar('vacío: Hoy muestra 0 de 0', (await texto('[data-v="fuentes"]')) === '0 de 0');
  await p.goto(base + '/arbol', { waitUntil: 'networkidle' });
  comprobar('vacío: el libro avisa de que no hay fuentes', await p.locator('[data-v="libro-vacio"]').isVisible());

  // Sin desbordamiento a 320 px
  for (const ruta of ['/', '/arbol']) {
    await p.setViewportSize({ width: 320, height: 700 });
    await p.goto(base + ruta, { waitUntil: 'networkidle' });
    const d = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(`320 px sin desbordamiento en ${ruta}`, d <= 0, `${d} px`);
  }

  comprobar('sin errores de página', errores.length === 0, errores.join(' | '));
  await navegador.close();
  srv.close();
  console.log(fallos ? `\n${fallos} comprobaciones fallaron` : '\nTodo en orden');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
