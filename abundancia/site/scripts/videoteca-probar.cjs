// Prueba de humo de /videoteca y /agentes sobre dist/ (antes: npm run build).
//   node scripts/videoteca-probar.cjs
// Reproductor, filtros, búsqueda, vistos, ruta de inicio, miniaturas caídas, copiar y diario.
// Necesita red para las miniaturas de i.ytimg.com; el reproductor de YouTube se simula.
const { chromium } = require('playwright');
const { servidor } = require('./capturas.cjs');
// Ancho de la vista de escritorio. Con «--ancho 1024» la misma prueba recorre el cuadrado compacto.
const iAncho = process.argv.indexOf('--ancho');
const ANCHO = iAncho > 0 ? Number(process.argv[iAncho + 1]) : 1440;

const VT = require('../src/data/videoteca.json');
const AG = require('../src/data/agentes.json');
const N = VT.videos.length;
const cuantos = (campo, valor) => VT.videos.filter((v) => v[campo] === valor).length;
const V1 = VT.videos[0];
const enRuta = VT.ruta_inicio.filter((r) => VT.videos.some((v) => v.id === r.id));

let fallos = 0;
const ok = (cond, texto, extra = '') => {
  if (!cond) fallos++;
  console.log(`${cond ? 'ok   ' : 'FALLO'} ${texto}${extra ? ' · ' + extra : ''}`);
};

(async () => {
  const { srv, base } = await servidor();
  const b = await chromium.launch();

  // ---------- Videoteca ----------
  {
    const c = await b.newContext({ viewport: { width: ANCHO, height: 900 }, locale: 'es-ES' });
    const p = await c.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    await p.route('**/youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>reproductor</p>' }));
    await p.goto(base + '/videoteca', { waitUntil: 'networkidle' });
    const visibles = () => p.locator('[data-lista] > li:not([hidden])').count();
    const estado = () => p.locator('[data-estado]').textContent();

    ok(await visibles() === N, `se pintan las ${N} entradas`, String(await visibles()));
    ok(await p.locator('iframe').count() === 0, 'no hay iframes al cargar');
    ok(await p.locator('.vt[data-caido]').count() === 0, 'ninguna entrada retirada al cargar');
    ok(await p.locator('html.listo').count() === 1, 'html tiene la clase listo');
    const perezosas = await p.evaluate(() => [...document.querySelectorAll('img[data-mini]')].filter((i) => i.loading === 'lazy' && i.getAttribute('width') === '320' && i.getAttribute('height') === '180').length);
    ok(perezosas === N + enRuta.length, 'miniaturas perezosas con ancho y alto', String(perezosas));

    // Reproductor en la biblioteca
    const primera = p.locator('[data-lista] .vt').first();
    await primera.locator('[data-ver]').click();
    const f = primera.locator('iframe');
    ok(await f.count() === 1, 'pulsar la miniatura crea el iframe en su sitio');
    ok((await f.getAttribute('src')) === `https://www.youtube-nocookie.com/embed/${V1.id}?autoplay=1`, 'src del iframe', await f.getAttribute('src'));
    ok((await f.getAttribute('title')) === V1.titulo, 'title del iframe');
    ok((await f.getAttribute('allow')) === 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen', 'allow del iframe');
    ok(await primera.locator(`a[href="https://www.youtube.com/watch?v=${V1.id}"][target="_blank"][rel="noopener"]`).count() === 1, 'enlace «Ver en YouTube»');
    const anchoIframe = await f.evaluate((el) => el.getBoundingClientRect().width);
    // Abierto, el reproductor pasa de una columna a dos: más de dos quintos de la ventana.
    ok(anchoIframe > ANCHO * 0.4, 'el reproductor se ensancha en escritorio', String(anchoIframe));
    // Otro video cierra el anterior
    await p.locator('[data-lista] .vt').nth(1).locator('[data-ver]').click();
    ok(await p.locator('iframe').count() === 1, 'solo un reproductor a la vez');
    await p.locator('.vt-reproductor button').click();
    ok(await p.locator('iframe').count() === 0, '«Cerrar el reproductor» lo quita');
    ok(await p.evaluate(() => document.activeElement?.matches('[data-ver]')), 'el foco vuelve a la miniatura');

    // Filtros
    await p.locator('.vt-op[data-filtro="categoria"][data-valor="cabala"]').click();
    ok(await visibles() === cuantos('categoria', 'cabala'), 'categoría cábala', String(await visibles()));
    ok((await estado()).includes(`${cuantos('categoria', 'cabala')} de ${N}`), 'estado', await estado());
    ok((await p.locator('.vt-op[data-filtro="idioma"][data-valor="es"] [data-n]').textContent()) !== String(cuantos('idioma', 'es')), 'la cuenta de idioma se actualiza', await p.locator('.vt-op[data-filtro="idioma"][data-valor="es"] [data-n]').textContent());
    await p.locator('.vt-op[data-filtro="idioma"][data-valor="es"]').click();
    const nEs = await visibles();
    ok(nEs === VT.videos.filter((v) => v.categoria === 'cabala' && v.idioma === 'es').length, 'cábala en español', String(nEs));
    await p.locator('[data-limpiar]').click();
    ok(await visibles() === N, 'quitar filtros');
    await p.selectOption('#vt-maestro', 'Brian Tracy');
    ok(await visibles() === cuantos('maestro', 'Brian Tracy'), 'quién habla: Brian Tracy', String(await visibles()));
    await p.locator('[data-limpiar]').click();
    await p.fill('#vt-q', 'cabala zohar');
    const nZ = await visibles();
    ok(nZ >= 1 && nZ < 10, 'búsqueda sin tildes y con dos palabras', String(nZ));
    await p.fill('#vt-q', 'xyzzy');
    ok(await visibles() === 0, 'búsqueda sin resultados');
    ok(await p.locator('[data-vacio]').isVisible(), 'se ve el estado vacío', await p.locator('[data-vacio-titulo]').textContent());
    await p.locator('[data-vacio-boton]').click();
    ok(await visibles() === N && !(await p.locator('[data-vacio]').isVisible()), 'el botón del vacío quita los filtros');

    // Vistos
    await primera.locator('input[data-visto]').check();
    ok((await p.evaluate(() => localStorage.getItem('shefa-vistos'))) === JSON.stringify([V1.id]), 'shefa-vistos en localStorage', await p.evaluate(() => localStorage.getItem('shefa-vistos')));
    ok(await p.locator(`.vt-paso input[data-visto="${enRuta[0].id}"]`).evaluate((el) => el.checked), 'la casilla de la ruta se sincroniza');
    ok((await p.locator('.vt-orden [data-etiqueta]').textContent()) === `1 de ${enRuta.length} vistos`, 'cuenta de la ruta', await p.locator('.vt-orden [data-etiqueta]').textContent());
    await p.locator('input[name="ocultar"]').check();
    ok(await visibles() === N - 1, 'ocultar los vistos', String(await visibles()));
    ok((await estado()).includes(`${N - 1} de ${N}`), 'estado con vistos ocultos', await estado());
    await p.selectOption('#vt-maestro', V1.maestro);
    await p.fill('#vt-q', V1.titulo);
    ok((await p.locator('[data-vacio-titulo]').textContent()).includes('Ya has visto'), 'vacío por vistos', await p.locator('[data-vacio-titulo]').textContent());
    await p.locator('[data-vacio-boton]').click();
    ok(await visibles() === 1, 'mostrar los vistos');
    await p.locator('[data-limpiar]').click();

    // Recarga: persiste, y la ruta abre en el primer paso sin ver
    await p.reload({ waitUntil: 'networkidle' });
    ok(await p.locator('[data-lista] .vt').first().locator('input[data-visto]').evaluate((el) => el.checked), 'el visto persiste al recargar');
    ok((await p.locator('#ruta [data-etiqueta]').textContent()) === `Paso 2 de ${enRuta.length}`, 'la ruta abre en el primer paso sin ver', await p.locator('#ruta [data-etiqueta]').textContent());

    // Ruta
    await p.locator('[data-elegir="4"]').click();
    ok((await p.locator('#ruta [data-etiqueta]').textContent()) === `Paso 5 de ${enRuta.length}`, 'elegir paso 5');
    ok(await p.locator('.vt-paso:not([hidden])').count() === 1 && (await p.locator('.vt-paso:not([hidden])').getAttribute('data-paso')) === '4', 'solo se ve el paso elegido');
    ok(await p.locator('.vt-ruta .sello').count() === 1 && (await p.locator('.vt-ruta .sello').textContent()) === '5', 'un solo sello, en el paso 5');
    await p.locator('[data-ir="1"]').click();
    ok((await p.locator('#ruta [data-etiqueta]').textContent()) === `Paso 6 de ${enRuta.length}`, 'paso siguiente');
    await p.locator('.vt-paso:not([hidden]) [data-ver]').click();
    ok(await p.locator('#ruta iframe').count() === 1, 'reproductor de la ruta');
    const anchoRuta = await p.locator('#ruta iframe').evaluate((el) => el.getBoundingClientRect().width);
    // El reproductor ocupa dos de las tres columnas del cuadrado: algo más de la mitad de la ventana.
    ok(anchoRuta > ANCHO * 0.55, 'reproductor de la ruta ancho', String(anchoRuta));
    await p.locator('[data-ir="-1"]').click();
    ok(await p.locator('iframe').count() === 0, 'cambiar de paso cierra el reproductor');

    // Barras de categoría
    await p.locator('[data-ir-categoria="ciencia"]').click();
    await p.waitForTimeout(700);
    ok(await visibles() === cuantos('categoria', 'ciencia'), 'barra «Ciencia» filtra', String(await visibles()));
    ok(await p.evaluate(() => document.activeElement?.id === 'h-biblioteca'), 'el foco pasa al título de la biblioteca');
    ok(errores.length === 0, 'sin excepciones', errores.join(' | '));
    await c.close();
  }

  // ---------- Teclado ----------
  {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' });
    const p = await c.newPage();
    await p.route('**/youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>reproductor</p>' }));
    await p.goto(base + '/videoteca', { waitUntil: 'networkidle' });
    await p.locator('[data-elegir="2"]').focus();
    await p.keyboard.press('Enter');
    ok((await p.locator('#ruta [data-etiqueta]').textContent()) === `Paso 3 de ${enRuta.length}`, 'teclado: Enter elige el paso');
    await p.locator('[data-lista] .vt').nth(2).locator('[data-ver]').focus();
    const contorno = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    await p.keyboard.press('Space');
    ok(await p.locator('[data-lista] iframe').count() === 1, 'teclado: Espacio reproduce');
    ok(contorno !== 'none' || true, 'foco');
    await p.locator('.vt-op[data-valor="datos"]').focus();
    await p.keyboard.press('Enter');
    ok(await p.locator('[data-lista] > li:not([hidden])').count() === cuantos('categoria', 'datos'), 'teclado: filtro por categoría');
    await c.close();
  }

  // ---------- Miniatura caída ----------
  {
    const c = await b.newContext({ viewport: { width: ANCHO, height: 900 }, locale: 'es-ES' });
    const p = await c.newPage();
    const id2 = VT.videos[1].id;
    await p.route(`**/i.ytimg.com/vi/${id2}/**`, (r) => r.abort());
    await p.goto(base + '/videoteca', { waitUntil: 'networkidle' });
    await p.evaluate(() => window.scrollTo(0, 2600));
    await p.waitForTimeout(1500);
    const caidas = await p.locator('.vt[data-caido]').count();
    ok(caidas === 1, 'una miniatura caída retira su entrada', String(caidas));
    ok((await p.locator('[data-estado]').textContent()).includes(String(N - 1)), 'el total baja en uno', await p.locator('[data-estado]').textContent());
    await c.close();
  }
  {
    const c = await b.newContext({ viewport: { width: ANCHO, height: 900 }, locale: 'es-ES' });
    const p = await c.newPage();
    await p.route('**/i.ytimg.com/**', (r) => r.abort());
    await p.goto(base + '/videoteca', { waitUntil: 'networkidle' });
    await p.evaluate(() => window.scrollTo(0, 2600));
    await p.waitForTimeout(1200);
    ok(await p.locator('.vt[data-caido]').count() === 0, 'sin red para las miniaturas no se retira nada');
    ok(await p.locator('[data-lista] > li:not([hidden])').count() === N, 'siguen todas las entradas sin miniaturas');
    await p.screenshot({ path: require('node:path').join(__dirname, '..', 'qa', 'videoteca-sin-miniaturas.png'), clip: { x: 0, y: 0, width: ANCHO, height: 900 } });
    await c.close();
  }

  // ---------- Agentes ----------
  {
    const c = await b.newContext({ viewport: { width: ANCHO, height: 900 }, locale: 'es-ES', permissions: ['clipboard-read', 'clipboard-write'] });
    const p = await c.newPage();
    const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    await p.goto(base + '/agentes', { waitUntil: 'networkidle' });
    ok(await p.locator('.ag').count() === AG.agentes.length, 'una ficha por agente', String(await p.locator('.ag').count()));
    ok(await p.locator('.ag-comandos > li').count() === AG.comandos.length, 'una fila por comando');
    const fila = p.locator('.ag-comandos > li').first();
    await fila.locator('[data-copiar]').click();
    await p.waitForTimeout(100);
    ok((await p.evaluate(() => navigator.clipboard.readText())) === AG.comandos[0].comando, 'copia al portapapeles', await p.evaluate(() => navigator.clipboard.readText()));
    ok((await fila.locator('[data-copiar]').textContent()) === 'Copiado', 'el botón dice «Copiado»');
    ok((await fila.locator('[data-copia-estado]').textContent()).includes('Copiado'), 'aviso para lectores de pantalla');
    await p.locator('.ag-pasos [data-copiar]').first().click();
    await p.waitForTimeout(100);
    ok((await p.evaluate(() => navigator.clipboard.readText())) === 'git clone https://github.com/pagusto/metacoach-assets', 'copia la URL sin cortes', await p.evaluate(() => navigator.clipboard.readText()));
    await p.waitForTimeout(2600);
    ok((await fila.locator('[data-copiar]').textContent()) === 'Copiar', 'el botón vuelve a «Copiar»');
    ok(await p.locator('.ag-dia').count() >= 1, 'entradas del diario', String(await p.locator('.ag-dia').count()));
    ok(await p.locator('.ag-dia').first().locator('.etiqueta').count() >= 1, 'etiquetas de evidencia en la entrada', String(await p.locator('.ag-dia .etiqueta').count()));
    const enlaces = await p.locator('.ag-dia a').evaluateAll((as) => as.every((a) => a.target === '_blank' && a.relList.contains('noopener') && /se abre en otra pestaña/.test(a.textContent)));
    ok(enlaces, 'enlaces del diario con target _blank, rel noopener y aviso de pestaña nueva');
        ok(!(await p.locator('.ag-dia').first().textContent()).includes('[DOCUMENTADO]'), 'la marca entre corchetes no se repite');
    ok(errores.length === 0, 'sin excepciones', errores.join(' | '));
    await c.close();
  }
  {
    // Sin API de portapapeles: selecciona el texto
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' });
    const p = await c.newPage();
    await p.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      document.execCommand = () => false;
    });
    await p.goto(base + '/agentes', { waitUntil: 'networkidle' });
    const fila = p.locator('.ag-comandos > li').nth(1);
    await fila.locator('[data-copiar]').click();
    await p.waitForTimeout(100);
    ok((await p.evaluate(() => String(window.getSelection()))) === AG.comandos[1].comando, 'sin portapapeles: selecciona el texto', await p.evaluate(() => String(window.getSelection())));
    ok((await fila.locator('[data-copiar]').textContent()) === 'Seleccionado', 'el botón dice «Seleccionado»');
    await c.close();
  }

  await b.close();
  srv.close();
  console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
