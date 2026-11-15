// Diario de conocimiento: lee las entradas de src/content/diario/AAAA-MM-DD.md (ver
// src/data/ESQUEMAS.md) y las deja listas para pintar: fecha, título y secciones con sus
// hallazgos, la etiqueta de evidencia de cada uno y los enlaces abriéndose en otra pestaña.
//
//   const entradas = await leerDiario(import.meta.glob('../content/diario/*.md', { eager: true }));

export type TipoEtiqueta = 'tradicion' | 'documentado' | 'estudio' | 'anecdota' | 'mito';
const TIPOS: readonly TipoEtiqueta[] = ['tradicion', 'documentado', 'estudio', 'anecdota', 'mito'];

export interface BloqueDiario {
  /** Etiqueta de evidencia con la que empieza el párrafo, si la trae. */
  etiqueta: TipoEtiqueta | null;
  /** HTML del bloque (sin la etiqueta entre corchetes). */
  html: string;
}
export interface SeccionDiario {
  titulo: string;
  bloques: BloqueDiario[];
}
export interface EntradaDiario {
  /** «AAAA-MM-DD»: ordena las entradas y va en <time datetime>. */
  clave: string;
  fecha: Date | null;
  titulo: string;
  secciones: SeccionDiario[];
}

interface ModuloMd {
  frontmatter?: Record<string, unknown>;
  compiledContent?: () => string | Promise<string>;
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sinMarcas = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function claveDe(ruta: string, fm: Record<string, unknown>): string {
  const f = fm.fecha;
  if (f instanceof Date && !Number.isNaN(f.getTime())) return f.toISOString().slice(0, 10);
  const texto = typeof f === 'string' ? f : '';
  return (/\d{4}-\d{2}-\d{2}/.exec(texto) ?? /\d{4}-\d{2}-\d{2}/.exec(ruta.split('/').pop() ?? ''))?.[0] ?? '';
}

function fechaDe(clave: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clave);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Los enlaces externos se abren en otra pestaña, sin dar acceso a esta. */
function enlacesFuera(html: string): string {
  return html.replace(/<a\s+([^>]*?)href="(https?:[^"]*)"([^>]*)>/g, (_todo, antes: string, url: string, despues: string) => {
    const resto = `${antes}${despues}`.replace(/\s*(target|rel)="[^"]*"/g, '').trim();
    return `<a href="${url}"${resto ? ` ${resto}` : ''} target="_blank" rel="noopener">`;
  });
}

/** El hebreo dentro de un párrafo se marca con su idioma y su dirección (derecha a izquierda). */
function hebreo(html: string): string {
  const tramo = /[֐-׿][֐-׿\s?!.,:;'"-]*[֐-׿]/g;
  return html
    .split(/(<[^>]+>)/)
    .map((parte, i) => (i % 2 ? parte : parte.replace(tramo, (h) => `<span class="he" lang="he" dir="rtl">${h}</span>`)))
    .join('');
}

function bloques(html: string): BloqueDiario[] {
  const salida: BloqueDiario[] = [];
  const re = /<(p|ul|ol|blockquote|h[3-6]|pre|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>/g;
  for (const m of html.matchAll(re)) {
    let trozo = m[0];
    let etiqueta: TipoEtiqueta | null = null;
    if (m[1] === 'p') {
      const marca = /^<p>\s*\[([^\]\d<]{3,20})\]\s*/.exec(trozo);
      const tipo = marca ? sinTildes(marca[1].trim()) : '';
      if (marca && (TIPOS as readonly string[]).includes(tipo)) {
        etiqueta = tipo as TipoEtiqueta;
        trozo = `<p>${trozo.slice(marca[0].length)}`;
      }
    }
    salida.push({ etiqueta, html: hebreo(enlacesFuera(trozo)) });
  }
  return salida;
}

function secciones(html: string): SeccionDiario[] {
  const salida: SeccionDiario[] = [];
  const partes = html.split(/<h2(?:\s[^>]*)?>([\s\S]*?)<\/h2>/);
  // partes: [antes, título 1, cuerpo 1, título 2, cuerpo 2…]
  const previo = bloques(partes[0] ?? '');
  if (previo.length) salida.push({ titulo: '', bloques: previo });
  for (let i = 1; i < partes.length; i += 2) {
    salida.push({ titulo: sinMarcas(partes[i]), bloques: bloques(partes[i + 1] ?? '') });
  }
  return salida;
}

/** Entradas del diario, de la más reciente a la más antigua. */
export async function leerDiario(modulos: Record<string, unknown>): Promise<EntradaDiario[]> {
  const entradas: EntradaDiario[] = [];
  for (const [ruta, mod] of Object.entries(modulos)) {
    const md = mod as ModuloMd;
    const fm = md.frontmatter ?? {};
    const clave = claveDe(ruta, fm);
    const html = md.compiledContent ? await md.compiledContent() : '';
    entradas.push({
      clave,
      fecha: fechaDe(clave),
      titulo: typeof fm.titulo === 'string' ? fm.titulo.trim() : '',
      secciones: secciones(html),
    });
  }
  return entradas.sort((a, b) => (a.clave < b.clave ? 1 : a.clave > b.clave ? -1 : 0));
}
