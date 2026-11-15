// Cálculo de las calculadoras de /datos. Funciones puras: sin DOM, sin estado, sin red.
// Las comprueba scripts/datos-verificar.mjs (node scripts/datos-verificar.mjs).

// ---------- 1 · Interés compuesto ----------

/** Tasa mensual equivalente a un retorno anual efectivo: i = (1 + r)^(1/12) − 1. */
export function tasaMensual(retornoAnualPct: number): number {
  return Math.pow(1 + retornoAnualPct / 100, 1 / 12) - 1;
}

/** Valor de aportar «aporte» al final de cada mes durante «meses»: aporte × ((1 + i)^n − 1) ÷ i. */
export function valorTrasMeses(aporte: number, meses: number, retornoAnualPct: number): number {
  const i = tasaMensual(retornoAnualPct);
  if (Math.abs(i) < 1e-12) return aporte * meses;
  return (aporte * (Math.pow(1 + i, meses) - 1)) / i;
}

export interface PuntoCompuesto {
  anio: number;
  aportado: number;
  valor: number;
}
export interface Compuesto {
  final: number;
  aportado: number;
  crecimiento: number;
  serie: PuntoCompuesto[];
}

/** Aporte mensual constante, años enteros y retorno real anual en %. Serie con un punto por año, desde 0. */
export function interesCompuesto(aporteMensual: number, anios: number, retornoAnualPct: number): Compuesto {
  const n = Math.max(0, Math.round(anios));
  const serie: PuntoCompuesto[] = [];
  for (let a = 0; a <= n; a++) {
    serie.push({ anio: a, aportado: aporteMensual * 12 * a, valor: valorTrasMeses(aporteMensual, 12 * a, retornoAnualPct) });
  }
  const ultimo = serie[serie.length - 1];
  return { final: ultimo.valor, aportado: ultimo.aportado, crecimiento: ultimo.valor - ultimo.aportado, serie };
}

// ---------- 2 · Reparto del ingreso ----------

export interface Reparto {
  dar: number;
  ahorrar: number;
  vivir: number;
}
export type ParteReparto = keyof Reparto;

const entre = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Cambia una parte y ajusta las otras para que las tres sumen 100.
 * Al mover «dar» o «ahorrar», la diferencia sale de «vivir» (o vuelve a él) y, si no alcanza, de la otra.
 * Al mover «vivir», la diferencia sale de «ahorrar» y, si no alcanza, de «dar».
 */
export function ajustarReparto(actual: Reparto, parte: ParteReparto, valor: number): Reparto {
  const v = entre(Math.round(Number.isFinite(valor) ? valor : 0), 0, 100);
  const resto = 100 - v;
  // «protegida» conserva su valor mientras quepa; «absorbe» se queda con lo que sobra.
  const protegida: ParteReparto = parte === 'dar' ? 'ahorrar' : 'dar';
  const absorbe: ParteReparto = parte === 'vivir' ? 'ahorrar' : 'vivir';
  const p = Math.min(actual[protegida], resto);
  const nuevo: Reparto = { dar: 0, ahorrar: 0, vivir: 0 };
  nuevo[parte] = v;
  nuevo[protegida] = p;
  nuevo[absorbe] = resto - p;
  return nuevo;
}

export interface Importes {
  mes: Reparto;
  anio: Reparto;
}

/** Importes al mes y al año de cada parte. */
export function importesReparto(ingresoMensual: number, r: Reparto): Importes {
  const mes = {
    dar: (ingresoMensual * r.dar) / 100,
    ahorrar: (ingresoMensual * r.ahorrar) / 100,
    vivir: (ingresoMensual * r.vivir) / 100,
  };
  return { mes, anio: { dar: mes.dar * 12, ahorrar: mes.ahorrar * 12, vivir: mes.vivir * 12 } };
}

// ---------- 3 · Años a la independencia ----------

/**
 * Años hasta reunir «multiplo» veces el gasto anual, ahorrando una parte fija del ingreso
 * con retorno real constante y partiendo de cero.
 *   n = ln(1 + multiplo × r × (1 − s) ÷ s) ÷ ln(1 + r)      (si r = 0: n = multiplo × (1 − s) ÷ s)
 */
export function aniosIndependencia(tasaAhorroPct: number, retornoRealPct = 5, multiplo = 25): number {
  const s = tasaAhorroPct / 100;
  if (!(s > 0)) return Infinity;
  if (s >= 1) return 0;
  const r = retornoRealPct / 100;
  const meta = (multiplo * (1 - s)) / s; // meta, en años de ahorro
  if (Math.abs(r) < 1e-12) return meta;
  return Math.log(1 + r * meta) / Math.log(1 + r);
}

// ---------- 4 · Subir el precio ----------

export interface EntradaPrecio {
  precio: number;
  unidades: number;
  coste: number;
  subidaPct: number;
  pierdePct: number;
}
export interface ResultadoPrecio {
  precioNuevo: number;
  unidadesNuevas: number;
  antes: number;
  despues: number;
  cambio: number;
  /** Cambio en % del beneficio actual; null si el beneficio actual no es positivo. */
  cambioPct: number | null;
  /**
   * Parte de clientes que puedes perder sin ganar menos que ahora; null si el precio nuevo no cubre el coste.
   * Pasa de 100 cuando hoy se pierde con cada venta y con el precio nuevo no: ni perdiéndolos todos ganas menos.
   */
  equilibrioPct: number | null;
}

/**
 * Beneficio = (precio − coste por unidad) × unidades. Los costes fijos no cambian, así que no alteran la diferencia.
 * Equilibrio: pérdida máxima de clientes = 1 − (precio − coste) ÷ (precio nuevo − coste).
 */
export function subirPrecio(e: EntradaPrecio): ResultadoPrecio {
  const precioNuevo = e.precio * (1 + e.subidaPct / 100);
  const unidadesNuevas = e.unidades * (1 - entre(e.pierdePct, 0, 100) / 100);
  const antes = (e.precio - e.coste) * e.unidades;
  const despues = (precioNuevo - e.coste) * unidadesNuevas;
  const cambio = despues - antes;
  const margenNuevo = precioNuevo - e.coste;
  return {
    precioNuevo,
    unidadesNuevas,
    antes,
    despues,
    cambio,
    cambioPct: antes > 0 ? (cambio / antes) * 100 : null,
    equilibrioPct: margenNuevo > 0 ? Math.max(0, (1 - (e.precio - e.coste) / margenNuevo) * 100) : null,
  };
}

// ---------- 5 · Evaluador de una fuente de ingreso ----------

export type NivelFuente = 'probar' | 'reforzar' | 'replantear' | 'descartar';
export interface Evaluacion {
  total: number;
  maximo: number;
  nivel: NivelFuente;
  /** Índice de la respuesta más baja (la primera, si hay empate). */
  masFloja: number;
}

/** Suma de respuestas de 1 a 5. Con cuatro preguntas: 16–20 probar, 12–15 reforzar, 8–11 replantear, 4–7 descartar. */
export function evaluarFuente(respuestas: number[]): Evaluacion {
  const r = respuestas.map((x) => entre(Math.round(Number(x) || 1), 1, 5));
  const total = r.reduce((t, x) => t + x, 0);
  const maximo = r.length * 5;
  const parte = total / maximo;
  const nivel: NivelFuente = parte >= 0.8 ? 'probar' : parte >= 0.6 ? 'reforzar' : parte >= 0.4 ? 'replantear' : 'descartar';
  return { total, maximo, nivel, masFloja: r.indexOf(Math.min(...r)) };
}

// ---------- Banderas rojas ----------

/** 0 = ninguna, 1 = una, 2 = dos o tres, 3 = cuatro o más. */
export function nivelBanderas(marcadas: number): 0 | 1 | 2 | 3 {
  if (marcadas <= 0) return 0;
  if (marcadas === 1) return 1;
  return marcadas <= 3 ? 2 : 3;
}

// ---------- Ejes ----------

/** Tope redondo por encima de un valor (1, 2, 2,5, 5 o 10 × 10^k) y paso para unas cuatro marcas. */
export function ejeRedondo(max: number, marcas = 4): { tope: number; paso: number } {
  if (!(max > 0) || !Number.isFinite(max)) return { tope: 1, paso: 1 / marcas };
  const bruto = max / marcas;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto - 1e-9) ?? 10 * pot;
  return { tope: Math.ceil(max / paso - 1e-9) * paso, paso };
}
