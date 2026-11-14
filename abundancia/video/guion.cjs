// Lee la película y escribe el guion, los subtítulos y los tiempos.
//   node guion.cjs            → salida/tiempos.json, salida/riquezas-y-colores.es.vtt, guion.md
// Fuente única: la propia página (window.__guion), para que guion, subtítulos y música no se desvíen.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CPS = 14;     // caracteres por segundo, máximo
const MIN = 2.5;    // segundos mínimos de cada bloque en pantalla
const dir = __dirname;
const cuenta = (t) => t.replace(/ \/ /g, ' ').length;
const hms = (t) => {
  const m = Math.floor(t / 60), s = t - m * 60;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + s.toFixed(3).padStart(6, '0');
};
const ms = (t) => Math.floor(t / 60) + ':' + (t % 60).toFixed(1).padStart(4, '0').replace('.', ',');
const es = (x, d = 1) => x.toFixed(d).replace('.', ',');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(dir, 'pelicula.html') + '?render=1');
  await p.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 30000 });
  const g = await p.evaluate(() => window.__guion);
  await b.close();

  fs.mkdirSync(path.join(dir, 'salida'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'salida', 'tiempos.json'), JSON.stringify({ duracion: g.duracion, tiempos: g.tiempos }, null, 2) + '\n');

  let fallos = 0;
  const filas = [];
  let vtt = 'WEBVTT\n\nNOTE\nRiquezas y colores · Shefa. Texto en pantalla, escena por escena.\n';
  let md = '';
  g.escenas.forEach((e) => {
    const dur = e.fin - e.inicio;
    const bloques = e.bloques.slice().sort((x, y) => x.entra - y.entra);
    const principal = bloques.reduce((n, k) => n + cuenta(k.texto), 0);
    const credito = e.credito ? cuenta(e.credito.texto) : 0;
    // comprobación 1: cada bloque, al menos 2,5 s y a lo sumo 14 c/s
    bloques.forEach((k) => {
      const t = k.sale - k.entra;
      if (t < MIN - 1e-6 || cuenta(k.texto) / t > CPS + 1e-6) { fallos++; console.log('  FALLO bloque', e.n, JSON.stringify(k.texto), es(t, 2) + ' s'); }
    });
    // comprobación 2: lectura acumulada. Desde que entra cada bloque hay tiempo para leerlo junto con los que llegan después.
    const grupos = {};
    bloques.forEach((k) => { (grupos[k.sale] = grupos[k.sale] || []).push(k); });
    Object.values(grupos).forEach((gr) => gr.forEach((k) => {
      const resto = gr.filter((x) => x.entra >= k.entra).reduce((n, x) => n + cuenta(x.texto), 0);
      if (resto / (k.sale - k.entra) > CPS + 1e-6) { fallos++; console.log('  FALLO acumulado', e.n, JSON.stringify(k.texto)); }
    }));
    const v1 = principal / dur, v2 = (principal + credito) / dur;
    if (v2 > CPS + 1e-6) { fallos++; console.log('  FALLO escena', e.n, es(v2)); }
    filas.push({ n: e.n, nombre: e.nombre, rango: ms(e.inicio) + '–' + ms(e.fin), dur, principal, credito, v1, v2 });

    const lineas = bloques.map((k) => k.texto.replace(/ \/ /g, '\n'));
    vtt += '\n' + e.n + '\n' + hms(e.inicio) + ' --> ' + hms(e.fin) + '\n' + lineas.join('\n') + (e.credito ? '\nFuente: ' + e.credito.texto : '') + '\n';

    md += '### ' + e.n + ' · ' + e.nombre + ' · ' + ms(e.inicio) + '–' + ms(e.fin) + ' (' + es(dur) + ' s)\n\n';
    md += '- **Color:** ' + e.color + '\n';
    md += '- **Texto en pantalla:**\n' + bloques.map((k) => '  - ' + k.texto.split(' / ').map((l) => '«' + l + '»').join(' · ') + ' — entra en ' + ms(k.entra) + ', ' + es(k.sale - k.entra) + ' s en pantalla').join('\n') + '\n';
    if (e.credito) md += '- **Crédito en pantalla:** ' + e.credito.texto + '\n';
    md += '- **Hecho que muestra:** ' + e.hecho + '\n';
    md += '- **Fuente:** ' + e.fuente + '\n';
    md += '- **Lectura:** ' + principal + ' caracteres de texto' + (credito ? ' + ' + credito + ' de crédito' : '') + ' → ' + es(v1) + ' c/s' + (credito ? ' (' + es(v2) + ' c/s con el crédito)' : '') + '\n\n';
  });
  fs.writeFileSync(path.join(dir, 'salida', 'riquezas-y-colores.es.vtt'), vtt);

  const cab = fs.readFileSync(path.join(dir, 'guion.cabecera.md'), 'utf8');
  const tabla = '| N.º | Escena | Tiempo | Duración | Caracteres (texto + crédito) | c/s texto | c/s con crédito |\n|---|---|---|---|---|---|---|\n' +
    filas.map((f) => '| ' + f.n + ' | ' + f.nombre + ' | ' + f.rango + ' | ' + es(f.dur) + ' s | ' + f.principal + ' + ' + f.credito + ' | ' + es(f.v1) + ' | ' + es(f.v2) + ' |').join('\n') + '\n';
  const pie = fs.readFileSync(path.join(dir, 'guion.pie.md'), 'utf8');
  fs.writeFileSync(path.join(dir, 'guion.md'), cab.replace('{{DURACION}}', es(g.duracion)).replace('{{ESCENAS}}', String(g.escenas.length)) + '\n## Escenas\n\n' + md + '## Velocidad de lectura\n\n' + tabla + '\n' + pie);

  filas.forEach((f) => console.log(String(f.n).padStart(2), f.nombre.padEnd(18), f.rango.padEnd(14), es(f.dur).padStart(5), String(f.principal).padStart(4), String(f.credito).padStart(3), es(f.v1).padStart(5), es(f.v2).padStart(5)));
  console.log('duración', g.duracion, '· escenas', g.escenas.length, '· fallos', fallos);
  process.exit(fallos ? 1 : 0);
})();
