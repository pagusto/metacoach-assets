// Rutas internas. El sitio se sirve bajo un prefijo (por ejemplo /shefa) cuando vive dentro
// de otro sitio. Todo enlace interno y todo archivo de /public debe pasar por ruta().
//   <a href={ruta('/arbol')}>   <img src={ruta('/media/x.jpg')}>
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const BASE = base;

export function ruta(p: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(p)) return p;
  const limpio = p.startsWith('/') ? p : '/' + p;
  return base + limpio;
}

// Quita el prefijo de una ruta del navegador para compararla con las rutas del menú.
export function sinBase(pathname: string): string {
  const s = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return s === '' ? '/' : s;
}
