// Textos de las calculadoras y de la lista de banderas de /datos.
// Los usan la página (al compilar) y el cliente, para que digan lo mismo.

import { nivelBanderas, type NivelFuente, type ParteReparto } from './datos-calculo';

export const PARTES: { id: ParteReparto; nombre: string }[] = [
  { id: 'dar', nombre: 'Dar' },
  { id: 'ahorrar', nombre: 'Ahorrar' },
  { id: 'vivir', nombre: 'Vivir' },
];

export const PREGUNTAS: { texto: string; corto: string }[] = [
  { texto: '¿La comprarían tus clientes actuales?', corto: 'que la compren tus clientes actuales' },
  { texto: '¿Usa una habilidad que ya tienes?', corto: 'que use una habilidad que ya tienes' },
  { texto: '¿Se puede probar en dos semanas con poco dinero?', corto: 'que se pueda probar en dos semanas con poco dinero' },
  { texto: '¿Crece sin más horas tuyas?', corto: 'que crezca sin más horas tuyas' },
];

export const TEXTO_NIVEL: Record<NivelFuente, { titulo: string; texto: string }> = {
  probar: {
    titulo: 'Pruébala',
    texto: 'Cumple casi todo. Diseña una prueba de dos semanas con un cliente real y un precio.',
  },
  reforzar: {
    titulo: 'Refuérzala antes de probar',
    texto: 'Tiene base, pero le falta algo. Mejora primero su punto más flojo.',
  },
  replantear: {
    titulo: 'Replantéala',
    texto: 'Hoy falla en más de un punto. Cámbiala hasta que suba o déjala en tu lista de ideas.',
  },
  descartar: {
    titulo: 'Déjala por ahora',
    texto: 'No encaja con tus clientes, tu oficio ni tu tiempo. Dedica la semana a otra idea.',
  },
};

/** Frase sobre la respuesta más baja; vacía si todas valen lo mismo. */
export function textoMasFloja(respuestas: number[], masFloja: number): string {
  const min = Math.min(...respuestas);
  if (min === Math.max(...respuestas)) return '';
  return `Punto más flojo: ${PREGUNTAS[masFloja]?.corto ?? ''} (${min} de 5).`;
}

/** Veredicto llano según el número de banderas marcadas. */
export function veredictoBanderas(n: number): string {
  switch (nivelBanderas(n)) {
    case 0:
      return 'Ninguna bandera marcada. No prueba que sea segura: comprueba el registro antes de pagar.';
    case 1:
      return 'Una bandera. Detente y pide por escrito lo que falta antes de poner dinero.';
    case 2:
      return `${n} banderas. No pongas dinero hasta comprobar el registro y hablarlo con alguien de fuera.`;
    default:
      return `${n} banderas. Coincide con el patrón de una estafa: no pagues ni invites a nadie.`;
  }
}
