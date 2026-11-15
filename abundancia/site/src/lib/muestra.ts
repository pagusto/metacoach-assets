// Aviso de datos de muestra: se ve mientras el estado conserva algún ejemplo.
// El botón «Empezar con mis datos» llama a borrarEjemplos y conserva lo que
// la persona ya había escrito por su cuenta.

import { alCambiar, borrarEjemplos, estadoInicial, guardar, leer, type Estado } from './store';

export function hayMuestra(s: Estado): boolean {
  return s.ejemplo || s.fuentes.some((f) => f.ejemplo);
}

/** Borra los ejemplos sin llevarse lo que ya no coincide con la muestra. */
export function empezarConMisDatos(): Estado {
  const antes = leer();
  const base = estadoInicial();
  const propio = {
    declaracion: antes.declaracion !== base.declaracion ? antes.declaracion : null,
    donadoPct: antes.donadoPct !== base.donadoPct ? antes.donadoPct : null,
    ahorroPct: antes.ahorroPct !== base.ahorroPct ? antes.ahorroPct : null,
  };
  borrarEjemplos();
  return guardar((s) => {
    if (propio.declaracion !== null) s.declaracion = propio.declaracion;
    if (propio.donadoPct !== null) s.donadoPct = propio.donadoPct;
    if (propio.ahorroPct !== null) s.ahorroPct = propio.ahorroPct;
  });
}

/** Conecta todos los avisos [data-muestra] de la página. */
export function iniciarAvisoMuestra(): void {
  const avisos = document.querySelectorAll<HTMLElement>('[data-muestra]');
  if (!avisos.length) return;
  const pintar = (s: Estado) => avisos.forEach((a) => { a.hidden = !hayMuestra(s); });
  avisos.forEach((a) => {
    a.querySelector('button')?.addEventListener('click', () => empezarConMisDatos());
  });
  pintar(leer());
  alCambiar(pintar);
}
