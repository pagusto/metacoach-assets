// Formato de fechas, números y texto para la interfaz (español, sin dependencias).
// Los números se formatean con fmt y fmtPct del store; aquí solo se afinan los espacios.

import { fmtPct } from './store';

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

/** «sábado», «domingo»… */
export function nombreDia(d: Date = new Date()): string {
  return DIAS[d.getDay()];
}

/** «14 de noviembre de 2026» */
export function fechaTexto(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** «sábado 14 de noviembre de 2026» */
export function fechaLarga(d: Date = new Date()): string {
  return `${nombreDia(d)} ${fechaTexto(d)}`;
}

/** «14 nov» */
export function fechaCorta(d: Date): string {
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

/** Fecha local a partir de «AAAA-MM-DD» (sin el desfase de zona de new Date(iso)). */
export function deISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Día del año, de 1 a 366. */
export function diaDelAnio(d: Date = new Date()): number {
  const inicio = new Date(d.getFullYear(), 0, 1);
  const hoy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((hoy.getTime() - inicio.getTime()) / 86400000) + 1;
}

/** Espacio fino sin corte antes de «%», para que la cifra y su signo no se separen. */
export function fino(s: string): string {
  return s.replace(/ %/g, ' %');
}

/** Porcentaje con fmtPct del store y espacio fino: «12 %». */
export function pct(n: number, dec = 0): string {
  return fino(fmtPct(n, dec));
}

/** Escapa texto para insertarlo como HTML. */
export function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/**
 * Lee un número escrito a la española: «3.800», «3800», «12,5», «1.250,50».
 * Devuelve 0 si no se entiende; nunca un negativo.
 */
export function leerNumero(texto: string): number {
  let t = String(texto ?? '').replace(/[\s  %]/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Parte una declaración en frases, para componerla una por línea. */
export function frases(texto: string): string[] {
  return texto
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((f) => f.trim())
    .filter(Boolean);
}
