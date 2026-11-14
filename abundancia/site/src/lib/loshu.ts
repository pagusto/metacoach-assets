// El cuadrado Lo Shu: nueve palacios, con el sur arriba como en el diagrama original.
// Cada fila, columna y diagonal suma 15.

export const LO_SHU: readonly (readonly number[])[] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

/** Fila y columna (0 a 2) del palacio n dentro del cuadrado. */
export function posicion(n: number): { fila: number; col: number } {
  for (let fila = 0; fila < 3; fila++) {
    const col = LO_SHU[fila].indexOf(n);
    if (col >= 0) return { fila, col };
  }
  return { fila: 1, col: 1 };
}

/** Rectángulo que abarca un grupo de palacios (para piezas que ocupan varios). */
export function caja(celdas: number[]): { fila: number; col: number; filas: number; cols: number } {
  const ps = (celdas.length ? celdas : [5]).map(posicion);
  const f0 = Math.min(...ps.map((p) => p.fila));
  const f1 = Math.max(...ps.map((p) => p.fila));
  const c0 = Math.min(...ps.map((p) => p.col));
  const c1 = Math.max(...ps.map((p) => p.col));
  return { fila: f0, col: c0, filas: f1 - f0 + 1, cols: c1 - c0 + 1 };
}
