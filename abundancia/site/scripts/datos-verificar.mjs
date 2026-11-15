#!/usr/bin/env node
/* Comprueba la aritmética de las calculadoras de /datos (src/lib/datos-calculo.ts).
 *
 *   node scripts/datos-verificar.mjs
 *
 * Cada resultado se contrasta con una cuenta independiente: una simulación mes a mes,
 * una suma directa o las cifras publicadas en src/data/datos.json. Sale con código 1 si algo falla.
 * Node 22.18 o posterior importa el módulo TypeScript sin compilarlo.
 */
import { readFileSync } from 'node:fs';
import {
  tasaMensual, valorTrasMeses, interesCompuesto, ajustarReparto, importesReparto,
  aniosIndependencia, subirPrecio, evaluarFuente, nivelBanderas, ejeRedondo,
} from '../src/lib/datos-calculo.ts';

const datos = JSON.parse(readFileSync(new URL('../src/data/datos.json', import.meta.url), 'utf8'));
let fallos = 0;
let pruebas = 0;
function cerca(nombre, real, esperado, tol = 1e-6) {
  pruebas++;
  const ok = Number.isFinite(real) && Math.abs(real - esperado) <= tol * Math.max(1, Math.abs(esperado));
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLO'} ${nombre}: ${real} (esperado ${esperado})`);
}
function igual(nombre, real, esperado) {
  pruebas++;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? 'ok   ' : 'FALLO'} ${nombre}: ${JSON.stringify(real)}${ok ? '' : ` (esperado ${JSON.stringify(esperado)})`}`);
}

// 1 · Interés compuesto: contra una simulación mes a mes.
function simular(aporte, anios, rPct) {
  const i = Math.pow(1 + rPct / 100, 1 / 12) - 1;
  let saldo = 0;
  for (let m = 0; m < anios * 12; m++) saldo = saldo * (1 + i) + aporte;
  return saldo;
}
const globales = datos.retornos_reales.find((x) => x.activo === 'Acciones globales').retorno_real_anual_pct;
cerca('tasa mensual compuesta doce veces da la anual', Math.pow(1 + tasaMensual(globales), 12) - 1, globales / 100);
for (const [ap, an, r] of [[300, 20, globales], [100, 1, 0], [250, 35, 6.6], [1000, 10, 1.7], [50, 60, 12]]) {
  const c = interesCompuesto(ap, an, r);
  cerca(`compuesto ${ap}/mes, ${an} años, ${r} %: valor final`, c.final, simular(ap, an, r));
  cerca(`compuesto ${ap}/mes, ${an} años: total aportado`, c.aportado, ap * 12 * an);
  cerca(`compuesto ${ap}/mes, ${an} años: crecimiento`, c.crecimiento, simular(ap, an, r) - ap * 12 * an);
  igual(`compuesto ${ap}/mes, ${an} años: puntos de la serie`, c.serie.length, an + 1);
}
cerca('compuesto: un solo aporte de 100 al cabo de un mes vale 100', valorTrasMeses(100, 1, 5), 100);
cerca('compuesto: 12 aportes de 100 al 0 %', valorTrasMeses(100, 12, 0), 1200);
// Un euro aportado al final del mes 1 crece 11 meses; el del mes 12, ninguno.
cerca('compuesto: dos aportes, el primero crece un mes', valorTrasMeses(100, 2, 12), 100 * Math.pow(1.12, 1 / 12) + 100);

// 2 · Reparto: siempre suma 100 y los importes suman el ingreso.
let r = { dar: 10, ahorrar: 20, vivir: 70 };
for (const parte of ['dar', 'ahorrar', 'vivir']) {
  for (let v = 0; v <= 100; v++) {
    const n = ajustarReparto(r, parte, v);
    if (n.dar + n.ahorrar + n.vivir !== 100 || n.dar < 0 || n.ahorrar < 0 || n.vivir < 0) {
      fallos++;
      console.log(`FALLO reparto ${parte}=${v}: ${JSON.stringify(n)}`);
    }
  }
}
pruebas++;
console.log('ok    reparto: 303 combinaciones suman 100 sin negativos');
igual('reparto: dar a 15 sale de vivir', ajustarReparto(r, 'dar', 15), { dar: 15, ahorrar: 20, vivir: 65 });
igual('reparto: dar a 95 agota vivir y toca ahorrar', ajustarReparto(r, 'dar', 95), { dar: 95, ahorrar: 5, vivir: 0 });
igual('reparto: ahorrar a 100 deja las otras a cero', ajustarReparto(r, 'ahorrar', 100), { dar: 0, ahorrar: 100, vivir: 0 });
igual('reparto: ahorrar a 50 sale de vivir', ajustarReparto(r, 'ahorrar', 50), { dar: 10, ahorrar: 50, vivir: 40 });
igual('reparto: vivir a 80 sale de ahorrar', ajustarReparto(r, 'vivir', 80), { dar: 10, ahorrar: 10, vivir: 80 });
igual('reparto: vivir a 95 agota ahorrar y toca dar', ajustarReparto(r, 'vivir', 95), { dar: 5, ahorrar: 0, vivir: 95 });
igual('reparto: vivir a 50 devuelve a ahorrar', ajustarReparto(r, 'vivir', 50), { dar: 10, ahorrar: 40, vivir: 50 });
const imp = importesReparto(3800, r);
igual('reparto: 3.800 al mes con 10/20/70', imp.mes, { dar: 380, ahorrar: 760, vivir: 2660 });
igual('reparto: al año', imp.anio, { dar: 4560, ahorrar: 9120, vivir: 31920 });
cerca('reparto: los importes suman el ingreso', imp.mes.dar + imp.mes.ahorrar + imp.mes.vivir, 3800);

// 3 · Independencia: contra las cifras de datos.json y contra una simulación anual.
const cifra = datos.cifras.find((x) => x.id === 'ahorro-e-independencia');
cerca(`independencia al 50 %: ${cifra.valor} años en datos.json`, aniosIndependencia(50), 16.6, 0.005);
cerca('independencia al 10 %: 51 años en la nota', aniosIndependencia(10), 51, 0.01);
cerca('independencia al 20 %: 37 años en la nota', aniosIndependencia(20), 37, 0.01);
cerca('independencia al 30 %: 28 años en la nota', aniosIndependencia(30), 28, 0.01);
cerca('independencia al 25 % sin retorno: 75 años', aniosIndependencia(25, 0), 75);
igual('independencia al 100 %: 0 años', aniosIndependencia(100), 0);
igual('independencia al 0 %: nunca', aniosIndependencia(0), Infinity);
for (const [s, rr] of [[20, 5], [35, 3], [60, 7]]) {
  // Con ingreso 1: se ahorra s al final de cada año; meta = 25 × gasto. Al llegar a n años, el saldo iguala la meta.
  const n = aniosIndependencia(s, rr);
  const saldo = ((s / 100) * (Math.pow(1 + rr / 100, n) - 1)) / (rr / 100);
  cerca(`independencia ${s} % al ${rr} %: el saldo a los ${n.toFixed(2)} años es 25 × gasto`, saldo, 25 * (1 - s / 100));
}

// 4 · Subir el precio: contra la cuenta directa.
const p = subirPrecio({ precio: 100, unidades: 40, coste: 60, subidaPct: 10, pierdePct: 10 });
cerca('precio: beneficio actual (100 − 60) × 40', p.antes, 1600);
cerca('precio: beneficio nuevo (110 − 60) × 36', p.despues, 1800);
cerca('precio: cambio', p.cambio, 200);
cerca('precio: cambio en %', p.cambioPct, 12.5);
cerca('precio: equilibrio 1 − 40 ÷ 50', p.equilibrioPct, 20);
const eq = subirPrecio({ precio: 100, unidades: 40, coste: 60, subidaPct: 10, pierdePct: 20 });
cerca('precio: en el punto de equilibrio el cambio es 0', eq.cambio, 0, 1e-9);
// Marn y Rosiello: con margen operativo del 9 %, subir un 1 % sin perder volumen sube el beneficio un 11,1 %.
const mr = subirPrecio({ precio: 100, unidades: 1, coste: 91, subidaPct: 1, pierdePct: 0 });
cerca('precio: 1 % más con margen del 9 % da +11,1 % (cifra de datos.json)', mr.cambioPct, 11.1, 0.002);
const sinMargen = subirPrecio({ precio: 50, unidades: 10, coste: 60, subidaPct: 10, pierdePct: 0 });
igual('precio: si el precio nuevo no cubre el coste no hay equilibrio', sinMargen.equilibrioPct, null);
igual('precio: con beneficio actual negativo no hay cambio en %', sinMargen.cambioPct, null);

// 5 · Evaluador: suma y umbrales.
igual('evaluador 3,3,3,3', evaluarFuente([3, 3, 3, 3]), { total: 12, maximo: 20, nivel: 'reforzar', masFloja: 0 });
igual('evaluador 5,5,5,5', evaluarFuente([5, 5, 5, 5]).nivel, 'probar');
igual('evaluador 4,4,4,4 (16)', evaluarFuente([4, 4, 4, 4]).nivel, 'probar');
igual('evaluador 4,4,4,3 (15)', evaluarFuente([4, 4, 4, 3]).nivel, 'reforzar');
igual('evaluador 3,3,3,2 (11)', evaluarFuente([3, 3, 3, 2]).nivel, 'replantear');
igual('evaluador 2,2,2,2 (8)', evaluarFuente([2, 2, 2, 2]).nivel, 'replantear');
igual('evaluador 2,2,2,1 (7)', evaluarFuente([2, 2, 2, 1]).nivel, 'descartar');
igual('evaluador 1,1,1,1', evaluarFuente([1, 1, 1, 1]).total, 4);
igual('evaluador: la más floja de 4,2,5,2 es la segunda', evaluarFuente([4, 2, 5, 2]).masFloja, 1);

// Banderas y ejes.
igual('banderas: niveles de 0 a 12', [0, 1, 2, 3, 4, 12].map(nivelBanderas), [0, 1, 2, 2, 3, 3]);
igual('eje: 124.470', ejeRedondo(124470), { tope: 150000, paso: 50000 });
igual('eje: 66', ejeRedondo(66), { tope: 80, paso: 20 });
igual('eje: 7', ejeRedondo(7), { tope: 8, paso: 2 });

console.log(`\n${pruebas} comprobaciones, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
