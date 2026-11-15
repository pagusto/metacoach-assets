// Rotación diaria: qué enseñanza y qué sefirá tocan hoy.
// Todo se decide con la fecha del dispositivo; no hay red ni servidor.

import { diaDelAnio, nombreDia } from './formato';

/** Índice del día dentro de una lista de n elementos, según el día del año. */
export function indiceDelDia(n: number, d: Date = new Date()): number {
  return n > 0 ? diaDelAnio(d) % n : 0;
}

/** El elemento de la lista que toca hoy. */
export function delDia<T>(lista: T[], d: Date = new Date()): T | undefined {
  return lista[indiceDelDia(lista.length, d)];
}

/** Alterna dos listas (a1, b1, a2, b2…) para que las tradiciones se turnen. */
export function alternar<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

/** La sefirá cuyo «dia» coincide con el día de la semana. */
export function sefiraDelDia<T extends { dia: string | null }>(sefirot: T[], d: Date = new Date()): T | undefined {
  const hoy = nombreDia(d);
  return sefirot.find((s) => s.dia === hoy);
}
