// Fuentes del sitio, reunidas al compilar. Recorre todos los JSON de src/data y recoge cada
// objeto que tenga «cita» y «url» (el tipo Fuente de ESQUEMAS.md), sin importar dónde esté.
// Solo se usa en el frontmatter (página Método): no viaja al navegador.

export interface FuenteRef {
  cita: string;
  url: string | null;
  /** Dominio sin «www.», o null si la fuente no tiene URL. */
  host: string | null;
}

export interface SeccionFuentes {
  /** Nombre del archivo sin extensión: cabala, datos… */
  id: string;
  titulo: string;
  fuentes: FuenteRef[];
}

// Título de cada archivo cuando el JSON no trae «titulo», y orden de las secciones.
const TITULOS: Record<string, string> = {
  cabala: 'Cábala y sustento',
  hermetismo: 'Hermetismo y esoterismo occidental',
  maestros: 'Maestros de la prosperidad',
  fengshui: 'Feng shui del espacio de trabajo',
  colores: 'Riquezas y colores',
  practicas: 'Prácticas con evidencia',
  datos: 'Datos de riqueza',
  videoteca: 'Videoteca',
  agentes: 'Agentes',
};
const ORDEN = ['cabala', 'hermetismo', 'maestros', 'fengshui', 'colores', 'practicas', 'datos'];

const modulos = import.meta.glob<unknown>('../data/*.json', { eager: true, import: 'default' });

function hostDe(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Clave para deduplicar: la URL sin barra final ni «www.», o la cita si no hay URL. */
function claveDe(f: { cita: string; url: string | null }): string {
  if (f.url) return f.url.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '').toLowerCase();
  return `cita:${f.cita.trim().toLowerCase()}`;
}

const paraOrdenar = (t: string) => t.replace(/^[«"“¿¡(\s]+/, '');

function recoger(nodo: unknown, salida: Map<string, FuenteRef>): void {
  if (Array.isArray(nodo)) {
    for (const x of nodo) recoger(x, salida);
    return;
  }
  if (!nodo || typeof nodo !== 'object') return;
  const o = nodo as Record<string, unknown>;
  if (typeof o.cita === 'string' && o.cita.trim() && 'url' in o && (typeof o.url === 'string' || o.url === null)) {
    const f = { cita: o.cita.trim(), url: typeof o.url === 'string' && o.url.trim() ? o.url.trim() : null };
    const k = claveDe(f);
    const previa = salida.get(k);
    // La misma URL citada con dos redacciones: queda la más completa.
    if (!previa || f.cita.length > previa.cita.length) salida.set(k, { ...f, host: hostDe(f.url) });
  }
  for (const valor of Object.values(o)) recoger(valor, salida);
}

/** Las fuentes de cada archivo de datos, sin repetidos y en orden alfabético. */
export function fuentesPorSeccion(): SeccionFuentes[] {
  const secciones: SeccionFuentes[] = [];
  for (const [ruta, datos] of Object.entries(modulos)) {
    const id = ruta.replace(/^.*\//, '').replace(/\.json$/, '');
    const mapa = new Map<string, FuenteRef>();
    recoger(datos, mapa);
    if (!mapa.size) continue;
    const propio = (datos as { titulo?: unknown } | null)?.titulo;
    secciones.push({
      id,
      titulo: typeof propio === 'string' && propio.trim() ? propio.trim() : TITULOS[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
      fuentes: [...mapa.values()].sort((a, b) => paraOrdenar(a.cita).localeCompare(paraOrdenar(b.cita), 'es', { sensitivity: 'base' })),
    });
  }
  const pos = (id: string) => (ORDEN.includes(id) ? ORDEN.indexOf(id) : ORDEN.length);
  return secciones.sort((a, b) => pos(a.id) - pos(b.id) || a.titulo.localeCompare(b.titulo, 'es'));
}

/** Fuentes únicas de todo el sitio (una misma URL puede aparecer en varias secciones). */
export function fuentesUnicas(secciones: SeccionFuentes[]): FuenteRef[] {
  const mapa = new Map<string, FuenteRef>();
  for (const s of secciones) for (const f of s.fuentes) if (!mapa.has(claveDe(f))) mapa.set(claveDe(f), f);
  return [...mapa.values()];
}

// Sitios que el entorno de investigación no dejó abrir: sus referencias se confirmaron con
// resúmenes de buscador y hay que volver a comprobarlas.
export const NO_ABIERTOS = [
  { nombre: 'sefaria.org', coincide: (h: string) => h === 'sefaria.org' || h.endsWith('.sefaria.org') },
  { nombre: 'chabad.org', coincide: (h: string) => h === 'chabad.org' || h.endsWith('.chabad.org') },
  { nombre: 'ubs.com', coincide: (h: string) => h === 'ubs.com' || h.endsWith('.ubs.com') },
  { nombre: 'zh.ch', coincide: (h: string) => h === 'zh.ch' || h.endsWith('.zh.ch') },
  { nombre: 'PubMed', coincide: (h: string) => h.includes('pubmed') },
] as const;

/** Las fuentes de los datos que apuntan a cada sitio no abierto. */
export function porComprobar(secciones: SeccionFuentes[]): { nombre: string; fuentes: FuenteRef[] }[] {
  const unicas = fuentesUnicas(secciones);
  return NO_ABIERTOS.map((sitio) => ({
    nombre: sitio.nombre,
    fuentes: unicas.filter((f) => f.host && sitio.coincide(f.host)),
  }));
}
