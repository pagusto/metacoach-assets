// Videoteca: nombres legibles de los campos de videoteca.json, direcciones de YouTube y
// utilidades de duración y búsqueda. Lo usan la página (al compilar) y su cliente.

export interface Video {
  id: string;
  titulo: string;
  /** El mismo título sin emoji ni versales, para pintarlo. Opcional. */
  titulo_visible?: string;
  canal: string;
  duracion: string;
  idioma: string;
  maestro: string;
  anio_original: number | null;
  categoria: string;
  temas: string[];
  resumen: string;
  por_que: string;
  tipo_canal: string;
  nota: string;
}

/** Categorías en el orden en que se muestran. Una categoría nueva en el JSON se añade al final. */
export const CATEGORIAS: Record<string, string> = {
  maestros: 'Maestros',
  ciencia: 'Ciencia',
  datos: 'Datos',
  cabala: 'Cábala',
  hermetismo: 'Hermetismo',
  'feng-shui': 'Feng shui',
  'color-diseno': 'Color y diseño',
};

export const IDIOMAS: Record<string, string> = { es: 'Español', en: 'Inglés' };

/** Tipo de canal: quién publica el video. Del más cercano a la fuente al más lejano. */
export const TIPOS_CANAL: Record<string, { nombre: string; rotulo: string; glosa: string }> = {
  oficial: { nombre: 'Oficial', rotulo: 'Canal oficial', glosa: 'El canal de quien habla o de su institución.' },
  autorizado: { nombre: 'Autorizado', rotulo: 'Canal autorizado', glosa: 'Un tercero con título para publicarlo: organizador, editorial o medio.' },
  archivo: { nombre: 'Archivo', rotulo: 'Canal de archivo', glosa: 'Un canal que conserva grabaciones históricas.' },
  fan: { nombre: 'Fan', rotulo: 'Canal de fans', glosa: 'La subida de un particular o de un canal de aficionados.' },
};

const inicial = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const nombreCategoria = (id: string) => CATEGORIAS[id] ?? inicial(id.replace(/-/g, ' '));
export const nombreIdioma = (id: string) => IDIOMAS[id] ?? id;
export const nombreTipoCanal = (id: string) => TIPOS_CANAL[id]?.nombre ?? inicial(id);
export const rotuloTipoCanal = (id: string) => TIPOS_CANAL[id]?.rotulo ?? `Canal: ${id}`;

/** Categorías presentes en los datos, en el orden de CATEGORIAS. */
export function ordenCategorias(videos: Video[]): string[] {
  const conocidas = Object.keys(CATEGORIAS);
  const presentes = [...new Set(videos.map((v) => v.categoria))];
  return [...conocidas.filter((c) => presentes.includes(c)), ...presentes.filter((c) => !conocidas.includes(c))];
}

// ---------- YouTube ----------
/** Miniatura de 320 × 180. */
export const miniatura = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
/** Miniatura de 640 × 480 (16:9 con bandas), para el reproductor grande. No todos los videos la tienen. */
export const miniaturaGrande = (id: string) => `https://i.ytimg.com/vi/${id}/sddefault.jpg`;
export const enYouTube = (id: string) => `https://www.youtube.com/watch?v=${id}`;
/** Reproductor sin cookies hasta que se pulsa reproducir. */
export const incrustado = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
export const PERMISOS_REPRODUCTOR = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';

// ---------- Título y canal ----------
/** Título que se pinta: el limpio (sin emoji ni versales) si el JSON lo trae; si no, el exacto. */
export function tituloVisible(v: { titulo: string; titulo_visible?: string }): string {
  return v.titulo_visible?.trim() || v.titulo;
}

/** ¿El texto está en escritura hebrea? Para marcarlo con lang="he" y la clase .he. */
export function esHebreo(texto: string): boolean {
  return /[\u0590-\u05FF]/.test(texto);
}

// ---------- Duración ----------
/** «2:12:44» o «29:18» en segundos. Devuelve 0 si no se entiende. */
export function segundos(duracion: string): number {
  const partes = String(duracion || '').split(':').map(Number);
  if (!partes.length || partes.some((n) => !Number.isFinite(n))) return 0;
  return partes.reduce((total, n) => total * 60 + n, 0);
}

/** Duración para lectores de pantalla: «2 h 12 min», «29 min». */
export function duracionHablada(duracion: string): string {
  const s = segundos(duracion);
  if (!s) return duracion;
  // Se redondea primero el total a minutos: así nunca sale «10 h 60 min».
  const min = Math.round(s / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${Math.max(1, m)} min`;
}

// ---------- Búsqueda ----------
/** Minúsculas y sin tildes, para comparar textos. */
export function normalizar(s: string): string {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
