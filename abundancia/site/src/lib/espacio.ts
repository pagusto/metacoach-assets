// Utilidades de las páginas Espacio y Colores: trigramas, ciclo de los cinco elementos,
// contraste WCAG de las muestras de color y lectura de la paleta en tokens.css.
// Sin dependencias. Se usa al compilar (frontmatter) y, en parte, en el cliente.

// ---------- Trigramas ----------

/** Las tres líneas de un trigrama, de abajo arriba: true = entera (yang), false = partida (yin). */
export function lineasTrigrama(simbolo: string): boolean[] | null {
  const cp = simbolo.codePointAt(0) ?? 0;
  if (cp < 0x2630 || cp > 0x2637) return null; // el centro (☯) no tiene trigrama
  const v = 7 - (cp - 0x2630); // ☰ = 111 … ☷ = 000, con la línea de abajo como bit más alto
  return [Boolean(v & 4), Boolean(v & 2), Boolean(v & 1)];
}

// ---------- Cinco elementos: posiciones en el pentágono ----------

export interface PuntoElemento { id: string; x: number; y: number }

/**
 * Coloca los elementos en un pentágono siguiendo el ciclo de generación (cada uno genera
 * al siguiente en el sentido de las agujas del reloj). Empieza arriba por el primero.
 */
export function pentagono(
  elementos: { id: string; genera: string }[],
  cx: number, cy: number, r: number,
): PuntoElemento[] {
  const orden: string[] = [];
  let actual: string | undefined = elementos[0]?.id;
  while (actual && !orden.includes(actual)) {
    orden.push(actual);
    actual = elementos.find((e) => e.id === actual)?.genera;
  }
  return orden.map((id, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / orden.length;
    return { id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/** Acorta un segmento por los dos extremos (para que la flecha no pise los nodos). */
export function acortar(a: { x: number; y: number }, b: { x: number; y: number }, ini: number, fin: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  return { x1: a.x + ux * ini, y1: a.y + uy * ini, x2: b.x - ux * fin, y2: b.y - uy * fin, ux, uy };
}

/** Punta de flecha (triángulo) en (x, y) apuntando en la dirección (ux, uy). */
export function punta(x: number, y: number, ux: number, uy: number, largo = 9, ancho = 7): string {
  const bx = x - ux * largo;
  const by = y - uy * largo;
  const px = -uy * (ancho / 2);
  const py = ux * (ancho / 2);
  const f = (n: number) => Math.round(n * 10) / 10;
  return `${f(x)},${f(y)} ${f(bx + px)},${f(by + py)} ${f(bx - px)},${f(by - py)}`;
}

// ---------- Color: contraste WCAG 2.x ----------

function canal(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function esHex(h: unknown): h is string {
  return typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h);
}

/** Luminancia relativa de un color #RRGGBB. */
export function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razón de contraste entre dos colores (de 1 a 21). */
export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export interface SobreMuestra { color: string; razon: number; nombre: 'tinta' | 'papel' | 'negro' | 'blanco' }

/**
 * Color de texto para escribir encima de una muestra. Prefiere la tinta o el papel del
 * sistema; si ninguno llega a 4,5:1 (tonos medios), usa negro o blanco puros.
 * Lanza un error si nada alcanza AA, para que la compilación falle antes que el contraste.
 */
export function sobre(fondo: string, tinta: string, papel: string): SobreMuestra {
  const candidatos: SobreMuestra[] = [
    { color: tinta, razon: contraste(fondo, tinta), nombre: 'tinta' },
    { color: papel, razon: contraste(fondo, papel), nombre: 'papel' },
  ];
  const mejor = candidatos.sort((a, b) => b.razon - a.razon)[0];
  if (mejor.razon >= 4.5) return mejor;
  const puros: SobreMuestra[] = [
    { color: '#000000', razon: contraste(fondo, '#000000'), nombre: 'negro' },
    { color: '#FFFFFF', razon: contraste(fondo, '#FFFFFF'), nombre: 'blanco' },
  ];
  const puro = puros.sort((a, b) => b.razon - a.razon)[0];
  if (puro.razon < 4.5) throw new Error(`La muestra ${fondo} no admite texto con contraste AA`);
  return puro;
}

/** «9,6:1» con coma decimal. Redondea hacia abajo para no prometer de más. */
export function razonTexto(r: number): string {
  return `${(Math.floor(r * 10) / 10).toFixed(1).replace('.', ',')}:1`;
}

/** Nivel WCAG de una razón de contraste para texto normal. */
export function nivel(r: number): 'AAA' | 'AA' | 'solo gráfico' | 'no apto' {
  return r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'solo gráfico' : 'no apto';
}

// ---------- Paleta: lectura de tokens.css ----------

export type TokensPaleta = Record<'claro' | 'oscuro', Record<string, string>>;

/** Extrae los colores de los cinco elementos (tema claro y oscuro) del texto de tokens.css. */
export function leerTokens(css: string): TokensPaleta {
  const bloque = (re: RegExp): Record<string, string> => {
    const m = re.exec(css);
    const out: Record<string, string> = {};
    if (!m) return out;
    for (const d of m[1].matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) out[d[1]] = d[2].toUpperCase();
    return out;
  };
  const claro = bloque(/:root\s*\{([^}]*)\}/);
  const oscuro = { ...claro, ...bloque(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/) };
  return { claro, oscuro };
}
