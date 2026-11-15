#!/usr/bin/env node
/* Prueba de humo de las páginas Ritual y Método sobre el sitio compilado.
 *
 *   npm run build && node scripts/ritual-prueba.cjs
 *
 * Ritual: sesión y pasos, «Siguiente» y «Saltar», respiración (con y sin movimiento
 * reducido), reloj de cinco minutos, plan si-entonces, dar primero, bloque de 90 minutos
 * (persiste al recargar y se marca solo), cierre de noche, lista de pasos, revisión semanal,
 * racha y desbordamiento a 320 px. Método: lista de fuentes, enlaces en pestaña nueva,
 * secciones plegables y lo guardado en el navegador. El reloj del navegador se controla
 * con page.clock, así que la prueba no espera en tiempo real. Sale con código 1 si algo falla.
 */
const { chromium } = require('playwright');
const { servidor } = require('./capturas.cjs');
// Ancho de la vista de escritorio. Con «--ancho 1024» la misma prueba recorre el cuadrado compacto.
const iAncho = process.argv.indexOf('--ancho');
const ANCHO = iAncho > 0 ? Number(process.argv[iAncho + 1]) : 1440;

let fallos = 0;
function comprobar(nombre, ok, detalle = '') {
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${nombre}${detalle ? `  (${detalle})` : ''}`);
}
const limpio = (s) => s.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const LUNES_8 = new Date(2026, 10, 16, 8, 0, 0);
const DIA = '2026-11-16';

(async () => {
  const { srv, base } = await servidor();
  const navegador = await chromium.launch();

  async function abrir(opciones = {}, hora = LUNES_8, ruta = '/ritual') {
    const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: 900 }, colorScheme: 'light', locale: 'es-ES', ...opciones });
    const p = await contexto.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    await p.clock.install({ time: hora });
    await p.goto(base + ruta, { waitUntil: 'load' });
    return { contexto, p, errores };
  }

  // ---------- Ritual: mañana ----------
  let { contexto, p, errores } = await abrir();
  const texto = async (sel) => limpio(await p.locator(sel).first().innerText());
  const estado = () => p.evaluate(() => JSON.parse(localStorage.getItem('shefa-v2') || 'null'));
  const visible = () => p.evaluate(() => [...document.querySelectorAll('[data-panel]')].filter((x) => !x.hidden).map((x) => x.dataset.panel).join());
  const porque = () => p.evaluate(() => [...document.querySelectorAll('[data-porque]')].filter((x) => !x.hidden).map((x) => x.dataset.porque).join());

  comprobar('ritual: a las 8:00 abre la mañana en el paso 1', (await visible()) === 'manana:0', await visible());
  comprobar('ritual: un solo «Por qué» visible, el del paso', (await porque()) === 'manana:0');
  comprobar('ritual: un solo sello a la vista', (await p.locator('.sello:visible').count()) === 1);
  comprobar('ritual: aviso de muestra visible', await p.locator('[data-muestra]').isVisible());
  comprobar('ritual: «Anterior» deshabilitado en el paso 1', await p.locator('[data-nav="anterior"]').isDisabled());
  comprobar('ritual: la fecha es la del dispositivo', (await texto('[data-fecha]')) === 'lunes 16 de noviembre de 2026', await texto('[data-fecha]'));

  // Respirar: seis ciclos de 4 + 6 segundos
  await p.click('[data-v="respira-boton"]');
  comprobar('respirar: empieza inhalando', (await texto('[data-v="respira-senal"]')) === 'Inhala' && (await p.locator('[data-v="respira-moneda"]').getAttribute('data-fase')) === 'inhala');
  await p.clock.runFor(4500);
  comprobar('respirar: a los 4 s exhala', (await texto('[data-v="respira-senal"]')) === 'Exhala' && (await p.locator('[data-v="respira-moneda"]').getAttribute('data-fase')) === 'exhala');
  comprobar('respirar: cuenta atrás de la fase', (await texto('[data-v="respira-seg"]')) === '6', await texto('[data-v="respira-seg"]'));
  await p.clock.runFor(6000);
  comprobar('respirar: a los 10 s, ciclo 2 e inhala', (await texto('[data-v="respira-ciclo"]')) === 'Ciclo 2 de 6' && (await texto('[data-v="respira-senal"]')) === 'Inhala');
  comprobar('respirar: el arco marca un ciclo de seis', (await p.locator('[data-v="respira-moneda"] .arco').getAttribute('stroke-dasharray')) === '16.7 83.3', await p.locator('[data-v="respira-moneda"] .arco').getAttribute('stroke-dasharray'));
  await p.clock.runFor(50500);
  comprobar('respirar: al minuto termina', (await texto('[data-v="respira-senal"]')) === 'Hecho' && (await texto('[data-v="respira-ciclo"]')) === '6 ciclos completos' && (await texto('[data-v="respira-boton"]')) === 'Repetir');
  comprobar('respirar: no marca el paso por sí solo', !((await estado())?.ritual?.[DIA] || [])[0]);

  await p.click('[data-nav="siguiente"]');
  let s = await estado();
  comprobar('«Siguiente» marca Respirar en el store', s.ritual[DIA][0] === true && s.ritual[DIA].length === 5, JSON.stringify(s.ritual[DIA]));
  comprobar('«Siguiente» pasa al paso 2 y enfoca su título', (await visible()) === 'manana:1' && (await p.evaluate(() => document.activeElement?.id)) === 'rt-t-manana-1');
  comprobar('declaración: muestra la del store', (await texto('[data-v="declaracion"]')).startsWith('Soy un profesional que cumple lo que promete.'));
  comprobar('declaración: enlace a Kéter con el prefijo', (await p.locator('[data-panel="manana:1"] a').getAttribute('href')) === '/shefa/arbol#keter');

  await p.click('[data-nav="saltar"]');
  s = await estado();
  comprobar('«Saltar» avanza sin marcar', (await visible()) === 'manana:2' && !s.ritual[DIA][1]);

  // Visualizar: acción de hoy y reloj de cinco minutos
  await p.fill('#rt-accion', 'Llamar a tres clientes antes de las 10:00');
  await p.locator('#rt-accion').blur();
  s = await estado();
  comprobar('visualizar: guarda la acción de hoy', s.ritualDia?.[DIA]?.accion === 'Llamar a tres clientes antes de las 10:00');
  await p.click('[data-v="vis-boton"]');
  await p.clock.runFor(61500);
  comprobar('visualizar: el reloj corre', (await texto('[data-v="vis-tiempo"]')) === '3:59', await texto('[data-v="vis-tiempo"]'));
  await p.click('[data-v="vis-boton"]');
  await p.clock.runFor(5000);
  comprobar('visualizar: en pausa no corre', (await texto('[data-v="vis-tiempo"]')) === '3:59' && (await texto('[data-v="vis-boton"]')) === 'Reanudar');
  await p.click('[data-v="vis-boton"]');
  await p.clock.fastForward(240000);
  await p.clock.runFor(1000);
  comprobar('visualizar: termina a los cinco minutos', (await texto('[data-v="vis-tiempo"]')) === '0:00' && (await texto('[data-v="vis-estado"]')).startsWith('Cinco minutos') && (await texto('[data-v="vis-boton"]')) === 'Repetir');
  await p.click('[data-nav="siguiente"]');
  s = await estado();
  comprobar('visualizar: «Siguiente» marca su casilla', s.ritual[DIA][2] === true);

  // Obstáculo y plan
  await p.fill('#rt-si', 'Si me dan ganas de aplazar la llamada.');
  await p.fill('#rt-entonces', 'Entonces marco el número antes de abrir el correo');
  await p.locator('#rt-entonces').blur();
  s = await estado();
  comprobar('plan: guarda obstáculo y plan en woop', s.woop.obstaculo.includes('aplazar la llamada') && s.woop.plan.includes('marco el número'));
  comprobar('plan: compone «Si…, entonces…» sin repetir palabras', (await texto('[data-v="frase-plan"]')) === '«Si me dan ganas de aplazar la llamada, entonces marco el número antes de abrir el correo».', await texto('[data-v="frase-plan"]'));
  await p.click('[data-nav="siguiente"]');
  s = await estado();
  comprobar('plan: se anota en la nota del día, sin tocar las cinco casillas', s.ritualDia[DIA].planHecho === true && s.ritual[DIA].filter(Boolean).length === 2);

  // Dar primero
  comprobar('dar: sugiere el 10 % del ingreso real', (await texto('[data-v="dar-cifra"]')) === '380' && (await texto('[data-v="dar-nota"]')) === 'el 10 % de 3.800 al mes', `${await texto('[data-v="dar-cifra"]')} · ${await texto('[data-v="dar-nota"]')}`);
  comprobar('dar: enlace a Jésed con el prefijo', (await p.locator('[data-panel="manana:4"] a.boton-2').getAttribute('href')) === '/shefa/arbol#jesed');
  await p.click('[data-nav="siguiente"]');
  s = await estado();
  comprobar('dar: «Siguiente» marca su casilla', s.ritual[DIA][3] === true && (await visible()) === 'manana:5');

  // Bloque de 90 minutos
  comprobar('bloque: sin «Siguiente» ni «Saltar» en el último paso', (await p.locator('[data-nav="siguiente"]').isHidden()) && (await p.locator('[data-nav="saltar"]').isHidden()));
  comprobar('bloque: repite la acción de hoy', (await texto('[data-v="bloque-accion"]')) === 'Llamar a tres clientes antes de las 10:00');
  const antes = await texto('[data-v="bloque-fin"]');
  comprobar('bloque: antes de empezar anuncia la hora de fin', /^Si empiezas ahora, termina a las \d{1,2}:\d{2}$/.test(antes), antes);
  await p.click('[data-v="bloque-boton"]');
  const inicio = (await estado()).ritualDia[DIA].bloque;
  const fin = new Date(inicio + 90 * 60000);
  const hhmm = `${fin.getHours()}:${String(fin.getMinutes()).padStart(2, '0')}`;
  comprobar('bloque: muestra la hora de fin', (await texto('[data-v="bloque-fin"]')).endsWith(`Termina a las ${hhmm}`), await texto('[data-v="bloque-fin"]'));
  await p.clock.runFor(60500);
  comprobar('bloque: el reloj corre', (await texto('[data-v="bloque-tiempo"]')) === '89:00', await texto('[data-v="bloque-tiempo"]'));
  await p.reload({ waitUntil: 'load' });
  comprobar('bloque: sigue en marcha al recargar', (await texto('[data-v="bloque-tiempo"]')).startsWith('8') && (await texto('[data-v="bloque-boton"]')) === 'Detener');
  comprobar('al recargar, abre el primer paso pendiente', (await visible()) === 'manana:1', await visible());
  await p.click('[data-ir="manana:5"]');
  await p.click('[data-v="bloque-boton"]');
  comprobar('bloque: detener pide confirmación en la página', await p.locator('[data-v="bloque-confirma"]').isVisible());
  await p.click('[data-v="bloque-no"]');
  comprobar('bloque: «Seguir» no lo detiene', (await estado()).ritualDia[DIA].bloque === inicio);
  await p.clock.fastForward(90 * 60000);
  await p.clock.runFor(1000);
  s = await estado();
  comprobar('bloque: a los 90 minutos se marca solo', s.ritual[DIA][4] === true && (await texto('[data-v="bloque-fin"]')).startsWith('Bloque completo'), await texto('[data-v="bloque-fin"]'));

  // Lista de pasos
  comprobar('lista: cuenta los pasos hechos de la sesión', (await texto('.rt-lista [data-etiqueta]')) === '5 de 6', await texto('.rt-lista [data-etiqueta]'));
  comprobar('constancia: 4 de 5 y racha de 1 día', (await texto('[data-v="hoy-cuenta"]')) === '4' && (await texto('[data-v="racha"]')) === '1' && (await texto('[data-v="racha-u"]')) === 'día de racha');
  comprobar('constancia: tira de 14 días con hoy completo', (await p.locator('[data-v="dias14"] svg').count()) === 14 && (await p.locator('[data-v="dias14"] svg.hecho.hoy').count()) === 1);
  await p.locator('[data-hecho="manana:1"]').check();
  comprobar('lista: la casilla marca el paso', (await estado()).ritual[DIA][1] === true && (await texto('[data-v="hoy-cuenta"]')) === '5');
  await p.locator('[data-hecho="manana:5"]').uncheck();
  s = await estado();
  comprobar('lista: desmarcar el bloque pone su reloj a cero', s.ritual[DIA][4] === false && s.ritualDia[DIA].bloque === undefined);
  await p.clock.runFor(2000);
  comprobar('lista: el bloque no vuelve a marcarse solo', (await estado()).ritual[DIA][4] === false);
  await p.locator('[data-ir="manana:0"]').focus();
  await p.keyboard.press('Enter');
  comprobar('lista: el nombre abre el paso con el teclado', (await visible()) === 'manana:0' && (await p.locator('[data-ir="manana:0"]').getAttribute('aria-current')) === 'step');

  // ---------- Ritual: noche ----------
  await p.locator('[data-sesion="noche"]').focus();
  await p.keyboard.press('Space');
  comprobar('noche: se elige con el teclado', (await visible()) === 'noche:0' && (await p.locator('[data-sesion="noche"]').getAttribute('aria-pressed')) === 'true' && new URL(p.url()).hash === '#noche');
  await p.fill('#rt-entro', '1.250,50');
  await p.fill('#rt-salio', '80');
  await p.locator('#rt-salio').blur();
  s = await estado();
  comprobar('noche: guarda lo que entró y salió', s.ritualDia[DIA].entro === 1250.5 && s.ritualDia[DIA].salio === 80, JSON.stringify(s.ritualDia[DIA]));
  comprobar('noche: saldo del día a la española', (await texto('[data-v="saldo"]')) === '+1.170,5', await texto('[data-v="saldo"]'));
  comprobar('noche: enlace al libro con el prefijo', (await p.locator('[data-panel="noche:0"] a.boton-2').getAttribute('href')) === '/shefa/arbol#libro');
  await p.click('[data-nav="siguiente"]');
  await p.fill('#rt-evidencia', 'Cerré la venta del plan mensual');
  await p.keyboard.press('Enter');
  s = await estado();
  comprobar('noche: añade una evidencia con la fecha de hoy', s.evidencias.length === 1 && s.evidencias[0].fecha === DIA && s.evidencias[0].texto === 'Cerré la venta del plan mensual');
  comprobar('noche: la evidencia aparece y cuenta en la semana', (await p.locator('[data-v="evidencias"] li:not(.lista-vacia)').count()) === 1 && (await texto('[data-v="evid-semana"]')) === '1');
  await p.click('[data-v="evidencias"] [data-quitar]');
  comprobar('noche: quita la evidencia', (await estado()).evidencias.length === 0 && (await p.locator('[data-v="evidencias"] .lista-vacia').count()) === 1);
  await p.fill('#rt-evidencia', 'Entregué el informe a tiempo');
  await p.click('[data-form="evidencia"] button');
  await p.click('[data-nav="siguiente"]');
  comprobar('noche: el paso 3 repite el plan de la mañana', (await texto('[data-v="frase-plan-noche"]')).startsWith('«Si me dan ganas de aplazar la llamada'));
  await p.locator('input[name="rt-plan"][value="no"]').check();
  comprobar('noche: anota si el plan se sostuvo', (await estado()).ritualDia[DIA].plan === 'no' && (await texto('[data-v="plan-consejo"]')).includes('paso 4'));
  comprobar('noche: el último botón es «Terminar»', (await texto('[data-nav="siguiente"]')) === 'Terminar');
  await p.click('[data-nav="siguiente"]');
  s = await estado();
  comprobar('noche: «Terminar» cierra los tres pasos', s.ritualDia[DIA].noche.every(Boolean) && (await texto('[data-v="nav-estado"]')).startsWith('Cierre de hoy completo') && (await texto('[data-v="noche-cuenta"]')) === '3');
  comprobar('noche: no toca las cinco casillas del ritual', s.ritual[DIA].filter(Boolean).length === 4);

  // ---------- Revisión semanal ----------
  comprobar('semanal: ingresos por fuente', (await p.locator('[data-v="sem-fuentes"] tr').count()) === 3 && (await texto('[data-v="sem-total"]')) === '3.800');
  comprobar('semanal: días completados', (await texto('[data-v="sem-dias"]')) === '1' && (await p.locator('[data-v="dias7"] svg').count()) === 7);
  comprobar('semanal: semana en curso', (await texto('[data-v="semana"]')) === 'Semana del 16 al 22 de noviembre', await texto('[data-v="semana"]'));
  comprobar('semanal: cuenta cómo fue el plan', (await texto('[data-v="sem-plan"]')) === 'Últimos 7 días: el plan falló 1 vez.', await texto('[data-v="sem-plan"]'));
  comprobar('semanal: el WOOP comparte obstáculo y plan con la mañana', (await p.inputValue('#rt-w-obstaculo')).includes('aplazar la llamada'));
  await p.fill('#rt-w-deseo', 'Cerrar dos clientes nuevos');
  await p.fill('#rt-w-resultado', 'Un mes cubierto');
  await p.fill('#rt-sem-obstaculo', 'Aplazar las llamadas');
  await p.fill('#rt-sem-prioridad', 'Diez llamadas antes del miércoles');
  await p.locator('#rt-sem-prioridad').blur();
  s = await estado();
  comprobar('semanal: guarda el WOOP y las respuestas de la semana', s.woop.deseo === 'Cerrar dos clientes nuevos' && s.woop.resultado === 'Un mes cubierto' && s.ritualSemana?.['2026-11-16']?.obstaculo === 'Aplazar las llamadas' && s.ritualSemana['2026-11-16'].prioridad === 'Diez llamadas antes del miércoles', JSON.stringify(s.ritualSemana));
  await p.reload({ waitUntil: 'load' });
  comprobar('todo persiste al recargar', (await p.inputValue('#rt-sem-prioridad')) === 'Diez llamadas antes del miércoles' && (await p.inputValue('#rt-w-deseo')) === 'Cerrar dos clientes nuevos' && (await p.locator('input[name="rt-plan"][value="no"]').isChecked()) && (await p.inputValue('#rt-entro')) === '1.250,5');
  comprobar('el enlace #noche abre la noche', (await visible()).startsWith('noche:'));

  // El store conserva los campos propios al exportar e importar (Árbol) y en Hoy
  await p.goto(base + '/', { waitUntil: 'load' });
  comprobar('Hoy lee las mismas casillas', (await p.locator('[data-paso]:checked').count()) === 4);
  await p.locator('[data-paso="4"]').check();
  s = await estado();
  comprobar('Hoy conserva las notas del ritual al guardar', s.ritualDia?.[DIA]?.accion === 'Llamar a tres clientes antes de las 10:00' && s.ritual[DIA][4] === true);
  comprobar('ritual: sin errores de página', errores.length === 0, errores.join(' | '));
  await contexto.close();

  // ---------- Ritual: de noche, movimiento reducido, 320 px ----------
  ({ contexto, p, errores } = await abrir({ reducedMotion: 'reduce', viewport: { width: 320, height: 700 } }, new Date(2026, 10, 16, 21, 30, 0)));
  const visible2 = () => p.evaluate(() => [...document.querySelectorAll('[data-panel]')].filter((x) => !x.hidden).map((x) => x.dataset.panel).join());
  comprobar('a las 21:30 abre la noche', (await visible2()) === 'noche:0', await visible2());
  await p.click('[data-sesion="manana"]');
  await p.click('[data-v="respira-boton"]');
  await p.clock.runFor(4500);
  const transform = await p.evaluate(() => getComputedStyle(document.querySelector('[data-v="respira-moneda"]')).transform);
  comprobar('movimiento reducido: la moneda no escala', transform === 'none' && (await p.locator('[data-v="respira-moneda"]').getAttribute('data-fase')) === null, transform);
  comprobar('movimiento reducido: quedan la palabra y la cuenta', limpio(await p.locator('[data-v="respira-senal"]').innerText()) === 'Exhala' && limpio(await p.locator('[data-v="respira-ciclo"]').innerText()) === 'Ciclo 1 de 6');
  comprobar('movimiento reducido: instrucción sin moneda', (await p.locator('.rt-sin-mov').isVisible()) && (await p.locator('.rt-con-mov').isHidden()));
  let desborde = 0;
  for (const sesion of ['manana', 'noche']) {
    await p.click(`[data-sesion="${sesion}"]`);
    const n = await p.locator(`[data-ir^="${sesion}:"]`).count();
    for (let i = 0; i < n; i++) {
      await p.click(`[data-ir="${sesion}:${i}"]`);
      desborde = Math.max(desborde, await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
    }
  }
  comprobar('320 px: ningún paso desborda', desborde <= 0, `${desborde} px`);
  comprobar('ritual a 320 px: sin errores de página', errores.length === 0, errores.join(' | '));
  await contexto.close();

  // ---------- Método ----------
  ({ contexto, p, errores } = await abrir({}, LUNES_8, '/metodo'));
  const total = Number(limpio(await p.locator('#fuentes .mt-total .cifra').innerText()).replace(/\./g, ''));
  const enIndice = await p.locator('#fuentes .mt-indice .cifra').allInnerTexts();
  const enLista = await p.locator('#fuentes .mt-refs li').count();
  comprobar('método: la lista de fuentes cuadra con su índice', enLista === enIndice.reduce((t, x) => t + Number(x), 0) && total > 100 && total <= enLista, `${total} únicas, ${enLista} en lista`);
  const externos = await p.evaluate(() => [...document.querySelectorAll('main a[href^="http"]')].map((a) => ({ t: a.target, r: a.rel })));
  comprobar('método: todo enlace externo abre en otra pestaña con noopener', externos.length > 100 && externos.every((a) => a.t === '_blank' && a.r.includes('noopener')), `${externos.length} enlaces`);
  const internos = await p.evaluate(() => [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')));
  comprobar('método: los enlaces internos llevan el prefijo', internos.every((h) => h.startsWith('/shefa/')), internos.filter((h) => !h.startsWith('/shefa/')).join());
  comprobar('método: cinco etiquetas con su ejemplo y su fuente', (await p.locator('.mt-fila').count()) === 5 && (await p.locator('.mt-fila .mt-fu a').count()) === 5 && (await p.locator('.mt-fila .etiqueta').count()) === 5);
  comprobar('método: el hebreo va de derecha a izquierda', (await p.locator('.mt-he').getAttribute('dir')) === 'rtl' && (await p.locator('.mt-he').getAttribute('lang')) === 'he');
  comprobar('método: en escritorio las secciones llegan abiertas', await p.evaluate(() => [...document.querySelectorAll('details.mt-plegable')].every((d) => d.open)));
  const noAbiertos = await p.locator('#comprobar .mt-indice li').evaluateAll((ls) => ls.map((l) => l.firstElementChild.textContent.trim()));
  comprobar('método: lista los sitios que no se pudieron abrir, bls.gov entre ellos', noAbiertos.length >= 13 && ['sefaria.org', 'ubs.com', 'bls.gov', 'sacred-texts.com'].every((x) => noAbiertos.includes(x)), noAbiertos.join(', '));
  comprobar('método: lo guardado, sin datos aún', limpio(await p.locator('[data-v="g-nota"]').innerText()).startsWith('Aún no has guardado nada') && limpio(await p.locator('[data-v="g-fuentes"]').innerText()) === '3');
  comprobar('método: sin errores de página', errores.length === 0, errores.join(' | '));
  await contexto.close();

  ({ contexto, p, errores } = await abrir({ viewport: { width: 390, height: 844 } }, LUNES_8, '/metodo'));
  comprobar('método en móvil: las secciones llegan plegadas', await p.evaluate(() => [...document.querySelectorAll('details.mt-plegable')].every((d) => !d.open)));
  await p.locator('#fuentes .mt-indice a').first().click();
  comprobar('método en móvil: el índice abre su sección', await p.evaluate(() => document.querySelector('details.mt-plegable').open && [...document.querySelectorAll('details.mt-plegable')].filter((d) => d.open).length === 1));
  await p.locator('details.mt-plegable summary').nth(1).focus();
  await p.keyboard.press('Enter');
  comprobar('método en móvil: una sección se abre con el teclado', await p.evaluate(() => document.querySelectorAll('details.mt-plegable')[1].open));
  await p.click('[data-v="abrir-todas"]');
  comprobar('método en móvil: «Abrir todas» abre todas', (await p.evaluate(() => [...document.querySelectorAll('details.mt-plegable')].every((d) => d.open))) && limpio(await p.locator('[data-v="abrir-todas"]').innerText()) === 'Cerrar todas las secciones');
  comprobar('método en móvil: sin desbordamiento con todo abierto', (await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
  await p.evaluate(() => localStorage.setItem('shefa-v2', JSON.stringify({ v: 2, fuentes: [{ id: 'a', nombre: 'Mía', tipo: 'Servicio', estado: 'ingresando', mensual: 100, accion: '' }], ritual: { '2026-11-15': [true, false, false, false, false] }, evidencias: [{ id: 'e', fecha: '2026-11-15', texto: 'x' }] })));
  await p.reload({ waitUntil: 'load' });
  comprobar('método: lo guardado refleja el navegador', limpio(await p.locator('[data-v="g-fuentes"]').innerText()) === '1' && limpio(await p.locator('[data-v="g-dias"]').innerText()) === '1' && limpio(await p.locator('[data-v="g-evidencias"]').innerText()) === '1' && limpio(await p.locator('[data-v="g-nota"]').innerText()) === 'Solo datos tuyos.');
  comprobar('método en móvil: sin errores de página', errores.length === 0, errores.join(' | '));
  await contexto.close();

  await navegador.close();
  srv.close();
  console.log(fallos ? `\n${fallos} comprobaciones fallaron` : '\nTodo en orden');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
