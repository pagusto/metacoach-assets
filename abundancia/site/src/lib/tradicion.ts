// Tradición: lo que comparten las cinco páginas de la sección (/tradicion y sus cuatro hijas).
// Solo para el frontmatter: importa los JSON. El cliente usa src/lib/tradicion-cliente.ts.

import cabala from '../data/cabala.json';
import hermetismo from '../data/hermetismo.json';
import maestros from '../data/maestros.json';
import practicas from '../data/practicas.json';

export interface Cuenta {
  n: number;
  de: string;
  ancla: string;
}

export interface PaginaTradicion {
  id: 'cabala' | 'hermetismo' | 'maestros' | 'practicas';
  href: string;
  /** Nombre corto (navegación). */
  nombre: string;
  /** Titular de la página. */
  titulo: string;
  resumen: string;
  cuentas: Cuenta[];
}

/** Las cuatro páginas de la sección, en orden, con su resumen y sus cuentas (salen de los JSON). */
export const PAGINAS: PaginaTradicion[] = [
  {
    id: 'cabala',
    href: '/tradicion/cabala',
    nombre: 'Cábala',
    titulo: cabala.titulo,
    resumen: cabala.resumen,
    cuentas: [
      { n: cabala.sefirot.length, de: 'sefirot', ancla: 'sefirot' },
      { n: cabala.ensenanzas.length, de: 'enseñanzas', ancla: 'ensenanzas' },
      { n: cabala.glosario.length, de: 'términos', ancla: 'glosario' },
    ],
  },
  {
    id: 'hermetismo',
    href: '/tradicion/hermetismo',
    nombre: 'Hermetismo',
    titulo: hermetismo.titulo,
    resumen: hermetismo.resumen,
    cuentas: [
      { n: hermetismo.principios.length, de: 'principios', ancla: 'principios' },
      { n: hermetismo.ensenanzas.length, de: 'enseñanzas', ancla: 'ensenanzas' },
      { n: hermetismo.glosario.length, de: 'términos', ancla: 'glosario' },
    ],
  },
  {
    id: 'maestros',
    href: '/tradicion/maestros',
    nombre: 'Maestros',
    titulo: 'Maestros del Nuevo Pensamiento',
    resumen: maestros.resumen,
    cuentas: [
      { n: maestros.maestros.length, de: 'maestros', ancla: 'maestros' },
      { n: maestros.linea_tiempo.length, de: 'hitos', ancla: 'linea' },
      { n: maestros.mitos.length, de: 'mitos', ancla: 'mitos' },
    ],
  },
  {
    id: 'practicas',
    href: '/tradicion/practicas',
    nombre: 'Prácticas',
    titulo: 'Prácticas y evidencia',
    resumen: practicas.resumen,
    cuentas: [
      { n: practicas.practicas.length, de: 'prácticas', ancla: 'practicas' },
      { n: practicas.energias.length, de: 'energías', ancla: 'energias' },
      { n: practicas.mitos.length, de: 'mitos', ancla: 'mitos' },
    ],
  },
];

/** Definiciones de las etiquetas de evidencia (las mismas de src/data/ESQUEMAS.md). */
export const ETIQUETAS = [
  { tipo: 'tradicion', def: 'Lo que enseña una tradición o un maestro, dicho en sus propios términos.' },
  { tipo: 'documentado', def: 'Hecho histórico o empírico con una fuente fiable.' },
  { tipo: 'estudio', def: 'Hallazgo de una investigación publicada.' },
  { tipo: 'anecdota', def: 'Lo cuenta la propia persona o su entorno, sin documento que lo confirme.' },
  { tipo: 'mito', def: 'Se repite, pero es falso o no tiene respaldo.' },
] as const;

export type TipoEtiqueta = (typeof ETIQUETAS)[number]['tipo'];

/** Asegura que el valor de «etiqueta» de un JSON es uno de los cinco tipos. */
export function tipoEtiqueta(valor: string | null | undefined, porDefecto: TipoEtiqueta = 'tradicion'): TipoEtiqueta {
  return ETIQUETAS.some((e) => e.tipo === valor) ? (valor as TipoEtiqueta) : porDefecto;
}

/** Texto listo para componer: «10 %» y «N = 1.023» no se parten al final de la línea. */
export function afinar(s: string): string {
  return s.replace(/ %/g, '\u202f%').replace(/(\S) = (\S)/g, '$1\u00a0=\u00a0$2');
}

/** Idioma y dirección de un texto original, según su escritura. */
export function idioma(texto: string, porDefecto = 'en'): { lang: string; dir: 'rtl' | 'ltr'; he: boolean } {
  if (/[֐-׿]/.test(texto)) return { lang: 'he', dir: 'rtl', he: true };
  if (/[Ͱ-Ͽἀ-῿]/.test(texto)) return { lang: 'grc', dir: 'ltr', he: false };
  return { lang: porDefecto, dir: 'ltr', he: false };
}

/** Primer año de cuatro cifras que aparece en un texto, o null. */
export function anio(texto: string): number | null {
  const m = /\b(1[5-9]\d\d|20\d\d)\b/.exec(texto);
  return m ? Number(m[1]) : null;
}

/** Dos cifras con cero a la izquierda: 1 → «01». */
export function dosCifras(n: number): string {
  return String(n).padStart(2, '0');
}

/** Un número pequeño en letras, para titulares («Doce enseñanzas»). */
export function enLetras(n: number, femenino = false): string {
  const L = ['Cero', femenino ? 'Una' : 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez',
    'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve', 'Veinte'];
  return L[n] ?? String(n);
}
