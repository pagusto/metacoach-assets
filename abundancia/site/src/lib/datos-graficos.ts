// Gráficos de las calculadoras de /datos, como cadenas de SVG. Sirven al compilar (estado por
// defecto) y en el cliente (cada cambio). Solo escriben números: no insertan texto de la persona.
//
// Dos capas por gráfico de líneas:
//   .lc-trazo  viewBox 0 0 100 100 sin conservar proporción: rejilla, área y líneas (trazo no escalado).
//   .lc-capa   coordenadas en porcentaje y píxeles: puntos y rótulos, que no se deforman.
// Color: azul (--accion) para lo que calcula la persona, tinta para la referencia.

import { aniosIndependencia, ejeRedondo, type Compuesto, type Reparto, type ResultadoPrecio } from './datos-calculo';
import { num } from './datos-formato';

type Punto = [number, number];
interface Marca {
  v: number;
  texto: string;
}

const r2 = (v: number) => String(Math.round(v * 100) / 100);
const pc = (v: number) => `${r2(v)}%`;
const camino = (puntos: Punto[]) => puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join('');

interface Marco {
  marcasX: Marca[];
  marcasY: Marca[];
  /** Posición de 0 a 100 de cada marca. */
  fx: (v: number) => number;
  fy: (v: number) => number;
  /** Lado de los rótulos del eje vertical: el que la curva deja libre. */
  ladoY: 'izq' | 'der';
  trazos: string;
  capa: string;
}

function marco(o: Marco): string {
  const rejilla = o.marcasY.map((m) => `M0 ${r2(o.fy(m.v))}H100`).join('');
  const rotY = o.marcasY
    .map((m) => `<text class="lc-eje-t" x="${o.ladoY === 'izq' ? '0' : '100%'}" y="${pc(o.fy(m.v))}" dy="-5" text-anchor="${o.ladoY === 'izq' ? 'start' : 'end'}">${m.texto}</text>`)
    .join('');
  const rotX = o.marcasX
    .map((m, i) => {
      const ancla = i === 0 ? 'start' : i === o.marcasX.length - 1 && o.fx(m.v) > 95 ? 'end' : 'middle';
      return `<text class="lc-eje-t" x="${pc(o.fx(m.v))}" y="100%" dy="18" text-anchor="${ancla}">${m.texto}</text>`;
    })
    .join('');
  return (
    `<svg class="lc-trazo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">` +
    (rejilla ? `<path class="lc-rej" d="${rejilla}"/>` : '') +
    o.trazos +
    `<path class="lc-base" d="M0 100H100"/></svg>` +
    `<svg class="lc-capa" width="100%" height="100%" aria-hidden="true">${rotY}${rotX}${o.capa}</svg>`
  );
}

const punto = (x: number, y: number, clase: string) => `<circle class="lc-p ${clase}" cx="${pc(x)}" cy="${pc(y)}" r="5"/>`;

function rotulo(x: number, y: number, dx: number, dy: number, ancla: 'start' | 'end', nombre: string, cifra: string): string {
  return (
    `<text class="lc-rot" x="${pc(x)}" y="${pc(y)}" dx="${dx}" dy="${dy}" text-anchor="${ancla}">` +
    (nombre ? `<tspan>${nombre}</tspan>` : '') +
    (nombre && cifra ? ' ' : '') +
    (cifra ? `<tspan class="lc-num">${cifra}</tspan>` : '') +
    `</text>`
  );
}

// ---------- 1 · Interés compuesto ----------

/** Paso de las marcas de años según la duración. */
function pasoAnios(n: number): number {
  if (n <= 6) return 1;
  if (n <= 12) return 2;
  if (n <= 30) return 5;
  return 10;
}

/**
 * Valor (azul) y total aportado (tinta) año a año. «lectura» es el año que señala el cursor;
 * si falta o es el último, solo se rotulan los extremos.
 */
export function graficoCompuesto(c: Compuesto, lectura?: number): string {
  const n = Math.max(1, c.serie.length - 1);
  const hayValor = c.final > 0;
  const { tope, paso } = ejeRedondo(Math.max(c.final, c.aportado, 0) * 1.15 || 1);
  const fx = (a: number) => (a / n) * 100;
  const fy = (v: number) => 100 - (v / tope) * 100;

  const marcasY: Marca[] = [];
  if (hayValor) for (let v = paso; v <= tope + 1e-9; v += paso) marcasY.push({ v, texto: num(v, paso < 1 ? 2 : 0) });
  const marcasX: Marca[] = [];
  const pa = pasoAnios(n);
  for (let a = 0; a <= n; a += pa) marcasX.push({ v: a, texto: String(a) });

  const valor: Punto[] = c.serie.map((p) => [fx(p.anio), fy(p.valor)]);
  const aportado: Punto[] = c.serie.map((p) => [fx(p.anio), fy(p.aportado)]);
  const area = camino(valor) + camino([...aportado].reverse()).replace('M', 'L') + 'Z';
  const trazos =
    `<path class="lc-area" d="${area}"/>` +
    `<path class="lc-l lc-ref" d="${camino(aportado)}"/>` +
    `<path class="lc-l lc-azul" d="${camino(valor)}"/>`;

  const fin = c.serie[c.serie.length - 1];
  const yv = fy(fin.valor);
  const ya = fy(fin.aportado);
  let capa = '';
  if (lectura !== undefined && lectura > 0 && lectura < n) {
    const p = c.serie[Math.round(lectura)];
    capa +=
      `<line class="lc-guia" x1="${pc(fx(p.anio))}" x2="${pc(fx(p.anio))}" y1="0" y2="100%"/>` +
      punto(fx(p.anio), fy(p.aportado), 'lc-p-ref') +
      punto(fx(p.anio), fy(p.valor), 'lc-p-azul');
  }
  capa += punto(100, ya, 'lc-p-ref') + punto(100, yv, 'lc-p-azul');
  // Los nombres van a la derecha de cada extremo; si las dos líneas acaban juntas, se separan.
  const juntas = ya - yv < 9;
  capa += rotulo(100, yv, 10, juntas ? -4 : 5, 'start', 'Valor', '');
  capa += rotulo(100, ya, 10, juntas ? 14 : 5, 'start', 'Aportado', '');
  return marco({ marcasX, marcasY, fx, fy, ladoY: 'izq', trazos, capa });
}

// ---------- 3 · Años a la independencia ----------

export const TASA_MIN = 5;
export const TASA_MAX = 95;

/** Años hasta la independencia según la tasa de ahorro (de 5 a 95 %), con el punto elegido. */
export function graficoIndependencia(tasaPct: number, retornoPct: number, multiplo = 25): string {
  const { tope, paso } = ejeRedondo(aniosIndependencia(TASA_MIN, retornoPct, multiplo));
  const fx = (s: number) => s;
  const fy = (a: number) => 100 - (Math.min(a, tope) / tope) * 100;

  const marcasY: Marca[] = [];
  for (let v = paso; v <= tope + 1e-9; v += paso) marcasY.push({ v, texto: v + paso > tope + 1e-9 ? `${num(v)} años` : num(v) });
  const marcasX: Marca[] = [0, 25, 50, 75, 100].map((v) => ({ v, texto: v === 100 ? '100 %' : String(v) }));

  const curva: Punto[] = [];
  for (let s = TASA_MIN; s <= TASA_MAX; s++) curva.push([fx(s), fy(aniosIndependencia(s, retornoPct, multiplo))]);
  const trazos = `<path class="lc-l lc-azul" d="${camino(curva)}"/>`;

  const anios = aniosIndependencia(tasaPct, retornoPct, multiplo);
  const x = fx(tasaPct);
  const y = fy(anios);
  const derecha = x > 78;
  const capa =
    `<line class="lc-guia" x1="${pc(x)}" x2="${pc(x)}" y1="${pc(y)}" y2="100%"/>` +
    punto(x, y, 'lc-p-azul') +
    rotulo(x, y, derecha ? -8 : 10, derecha ? -26 : -10, derecha ? 'end' : 'start', '', `${num(anios, 1)} años`);
  return marco({ marcasX, marcasY, fx, fy, ladoY: 'der', trazos, capa });
}

// ---------- 4 · Subir el precio ----------

/**
 * Ancho, en píxeles, del canal que piden las cifras a la derecha de las barras: 8 px de separación
 * y unos 7,5 px por carácter, redondeado al múltiplo de 8. Hasta once caracteres caben en los 96 px
 * de siempre. La hoja solo lo usa en el cuadrado compacto, donde un beneficio de doce cifras o más
 * se salía del palacio.
 */
export function canalPrecio(r: ResultadoPrecio): number {
  const largo = Math.max(num(r.antes).length, num(r.despues).length);
  return Math.ceil((8 + largo * 7.5) / 8) * 8;
}

/** Dos barras a la misma escala: beneficio de ahora (tinta) y con el precio nuevo (azul). */
export function graficoPrecio(r: ResultadoPrecio): string {
  const lo = Math.min(0, r.antes, r.despues);
  const hi = Math.max(0, r.antes, r.despues);
  const ancho = hi - lo || 1;
  const fx = (v: number) => ((v - lo) / ancho) * 100;
  const x0 = fx(0);
  const cero = lo < 0 ? `<line class="gp-cero" x1="${pc(x0)}" x2="${pc(x0)}" y1="0" y2="20"/>` : '';
  const fila = (nombre: string, v: number, clase: string) => {
    const xv = fx(v);
    const desde = Math.min(x0, xv);
    const hasta = Math.max(x0, xv);
    const marca =
      clase === 'gp-antes'
        ? `<rect x="${pc(desde)}" y="10" width="${pc(hasta - desde)}" height="2"/><line x1="${pc(xv)}" x2="${pc(xv)}" y1="6" y2="16"/>`
        : `<rect x="${pc(desde)}" y="7" width="${pc(hasta - desde)}" height="8"/>`;
    return (
      `<p class="gp-rot">${nombre}</p>` +
      `<svg class="gp-barra ${clase}" width="100%" height="20" aria-hidden="true">${cero}${marca}` +
      `<text x="${pc(hasta)}" y="16" dx="8">${num(v)}</text></svg>`
    );
  };
  return fila('Ahora', r.antes, 'gp-antes') + fila('Con el precio nuevo', r.despues, 'gp-despues');
}

// ---------- 2 · Reparto ----------

/** Una barra entera partida en tres: dar (lleno), ahorrar (medio tono) y vivir (contorno). */
export function franjaReparto(r: Reparto): string {
  const a = r.dar;
  const b = r.dar + r.ahorrar;
  const corte = (x: number) => (x > 0 && x < 100 ? `<line class="fr-corte" x1="${pc(x)}" x2="${pc(x)}" y1="0" y2="12"/>` : '');
  return (
    `<svg class="fr" width="100%" height="12" aria-hidden="true">` +
    (r.vivir > 0 ? `<rect class="fr-vivir" x="${pc(b)}" y="0.75" width="${pc(100 - b)}" height="10.5"/>` : '') +
    (r.dar > 0 ? `<rect class="fr-dar" x="0" y="0" width="${pc(a)}" height="12"/>` : '') +
    (r.ahorrar > 0 ? `<rect class="fr-ahorrar" x="${pc(a)}" y="0" width="${pc(b - a)}" height="12"/>` : '') +
    corte(a) +
    corte(b) +
    `</svg>`
  );
}

// ---------- 5 · Evaluador ----------

/** Regla de «min» a «max» con los cortes marcados y una barra azul hasta el total. */
export function escalaEvaluador(total: number, min = 4, max = 20, cortes: number[] = [8, 12, 16]): string {
  const fx = (v: number) => ((v - min) / (max - min)) * 100;
  const marcas = [min, ...cortes, max];
  return (
    `<svg class="ev-escala" width="100%" height="34" aria-hidden="true">` +
    `<rect class="ev-barra" x="0" y="5" width="${pc(fx(total))}" height="8"/>` +
    `<line class="ev-base" x1="0" x2="100%" y1="13.5" y2="13.5"/>` +
    marcas.map((v) => `<line class="ev-base" x1="${pc(fx(v))}" x2="${pc(fx(v))}" y1="0" y2="14"/>`).join('') +
    marcas
      .map((v, i) => `<text x="${pc(fx(v))}" y="30" text-anchor="${i === 0 ? 'start' : i === marcas.length - 1 ? 'end' : 'middle'}">${v}</text>`)
      .join('') +
    `</svg>`
  );
}
