// Formato y lectura de los datos de /datos. Sirve al compilar y en el cliente; sin DOM.

/**
 * Número a la española con separador de miles siempre («1.234», «5,2») y signo menos tipográfico.
 * Lo que no es un número finito (un desbordamiento) se escribe «—», no «0».
 */
export function num(n: number, dec = 0, decMin = dec): string {
  if (!Number.isFinite(n)) return '—';
  const v = n;
  const s = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decMin,
    maximumFractionDigits: dec,
    useGrouping: 'always',
  } as Intl.NumberFormatOptions).format(Math.abs(v));
  // «−0» no existe: si al redondear queda en cero, se escribe sin signo.
  return v < 0 && /[1-9]/.test(s) ? `−${s}` : s;
}

/** Con signo explícito y sin ceros de relleno: «+200», «−150», «+12,5», «0». */
export function conSigno(n: number, dec = 0): string {
  const s = num(n, dec, 0);
  return n > 0 && /[1-9]/.test(s) ? `+${s}` : s;
}

/** Porcentaje con espacio fino sin corte: «12,5 %». */
export function pctFino(n: number, dec = 0, decMin = 0): string {
  return `${num(n, dec, decMin)} %`;
}

/** Espacio fino sin corte antes de «%» en un texto ya escrito. */
export function fino(s: string): string {
  return s.replace(/ %/g, ' %');
}

type TipoEtiqueta = 'estudio' | 'documentado';

/**
 * datos.json no trae «etiqueta» por afirmación. Se deduce de la fuente: revista con revisión,
 * prepublicación académica o boletín de investigación es «estudio»; informe, estadística
 * oficial o prensa es «documentado».
 */
export function etiquetaDeFuente(cita: string | null | undefined): TipoEtiqueta {
  return /\b(PNAS|Science|SSRN|Journal|Bulletin|Review of|Econom[ei]tr)/i.test(cita ?? '') ? 'estudio' : 'documentado';
}

/** «15.900 millones USD» → { valor: 15900, unidad: 'millones USD' }. null si no empieza por una cifra. */
export function leerImporte(texto: string | null | undefined): { valor: number; unidad: string } | null {
  const m = /^\s*([\d.]+(?:,\d+)?)\s*(.*)$/.exec(texto ?? '');
  if (!m) return null;
  const valor = Number(m[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(valor) ? { valor, unidad: m[2].trim() } : null;
}

/** Agrupa conservando el orden de aparición. */
export function agrupar<T>(lista: T[], clave: (x: T) => string): { clave: string; items: T[] }[] {
  const grupos: { clave: string; items: T[] }[] = [];
  for (const x of lista) {
    const k = clave(x);
    let g = grupos.find((y) => y.clave === k);
    if (!g) grupos.push((g = { clave: k, items: [] }));
    g.items.push(x);
  }
  return grupos;
}

/** Fuentes sin repetir (por URL o, si falta, por cita). */
export function sinRepetir<T extends { cita: string; url: string | null }>(fuentes: (T | null | undefined)[]): T[] {
  const vistas = new Set<string>();
  const salida: T[] = [];
  for (const f of fuentes) {
    if (!f) continue;
    const k = f.url ?? f.cita;
    if (!vistas.has(k)) {
      vistas.add(k);
      salida.push(f);
    }
  }
  return salida;
}
