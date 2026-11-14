// Las diez sefirot del tablero: orden, cualidad medible, posición y senderos.
// Disposición luriana (del Arí): 3 senderos horizontales, 7 verticales y 12 diagonales;
// Maljut solo se une a Yesod. Coordenadas en % del marco, origen arriba a la izquierda;
// la columna derecha es la de Jojmá, Jésed y Nétsaj.
// El texto de cada sefirá (tradición, aplicación, práctica, fuente) vive en src/data/cabala.json.

import type { SefiraId } from './store';

export const ORDEN: SefiraId[] = [
  'keter', 'jojma', 'bina', 'jesed', 'guevura', 'tiferet', 'netsaj', 'hod', 'yesod', 'maljut',
];

/** La cualidad que mide el tablero. Es una aplicación moderna, no un nombre tradicional. */
export const CUALIDAD: Record<SefiraId, string> = {
  keter: 'Intención',
  jojma: 'Visión',
  bina: 'Plan',
  jesed: 'Generosidad',
  guevura: 'Disciplina',
  tiferet: 'Equilibrio',
  netsaj: 'Constancia',
  hod: 'Gratitud',
  yesod: 'Canales',
  maljut: 'Manifestación',
};

export const POS: Record<SefiraId, readonly [number, number]> = {
  keter: [50, 5],
  jojma: [82, 19],
  bina: [18, 19],
  jesed: [82, 41],
  guevura: [18, 41],
  tiferet: [50, 53],
  netsaj: [82, 70],
  hod: [18, 70],
  yesod: [50, 81],
  maljut: [50, 96],
};

export type Columna = 'izq' | 'cen' | 'der';
export const COLUMNA: Record<SefiraId, Columna> = {
  keter: 'cen', jojma: 'der', bina: 'izq', jesed: 'der', guevura: 'izq',
  tiferet: 'cen', netsaj: 'der', hod: 'izq', yesod: 'cen', maljut: 'cen',
};

export const SENDEROS: readonly (readonly [SefiraId, SefiraId])[] = [
  // 3 horizontales
  ['jojma', 'bina'], ['jesed', 'guevura'], ['netsaj', 'hod'],
  // 7 verticales
  ['keter', 'tiferet'], ['tiferet', 'yesod'], ['yesod', 'maljut'],
  ['jojma', 'jesed'], ['jesed', 'netsaj'], ['bina', 'guevura'], ['guevura', 'hod'],
  // 12 diagonales
  ['keter', 'jojma'], ['keter', 'bina'], ['jojma', 'tiferet'], ['bina', 'tiferet'],
  ['jojma', 'guevura'], ['bina', 'jesed'], ['jesed', 'tiferet'], ['guevura', 'tiferet'],
  ['tiferet', 'netsaj'], ['tiferet', 'hod'], ['netsaj', 'yesod'], ['hod', 'yesod'],
];
