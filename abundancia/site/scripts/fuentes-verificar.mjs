#!/usr/bin/env node
/* Coteja con su fuente lo que el sitio cita: automatiza «Cómo repetirla» de abundancia/auditoria/.
 *
 *   node scripts/fuentes-verificar.mjs                 todo
 *   node scripts/fuentes-verificar.mjs hebreo citas    solo esos bloques (hebreo, citas, estudios, cifras)
 *   node scripts/fuentes-verificar.mjs --detalle       añade la dirección que se abrió en cada «ok»
 *
 * · hebreo    cada cita hebrea de cabala.json contra Sefaria, letra por letra (sin puntos ni acentos;
 *             el Nombre se iguala a «ה׳»; cada tramo separado por «…» debe aparecer en orden).
 * · citas     cada cita en inglés o latín de maestros.json y hermetismo.json contra el texto original
 *             (Project Gutenberg, archive.org, Wikipedia), igualando comillas, guiones y espacios.
 * · estudios  cada tamaño de efecto de practicas.json contra el resumen publicado (Crossref,
 *             Europe PMC, OpenAlex o la página de la revista).
 * · cifras    cada cifra de datos.json contra la página que cita; la serie de la Reserva Federal,
 *             contra su último dato.
 *
 * Por cada elemento imprime «ok», «difiere» o «no abre». «difiere» es que la fuente abrió y no dice
 * lo que dice el sitio, o que el sitio cambió y esta lista no: en los dos casos hay que mirarlo.
 * «no abre» es que ninguna fuente respondió a un script (muchas webs los bloquean a propósito: no
 * insistas ni disfraces el navegador; ábrela a mano). Sale con código 1 solo si algo difiere.
 *
 * Usa curl (Sefaria devuelve HTML a fetch de Node; con curl y «Accept: application/json» da JSON) y,
 * para los PDF, pdftotext si está instalado (Git para Windows lo trae). No guarda nada en disco.
 *
 * Al añadir o cambiar una cita, un estudio o una cifra en src/data, añade o cambia su entrada en
 * FUENTES, más abajo: lo que el sitio publica sin entrada aquí sale como «difiere».
 */
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const leer = (nombre) => JSON.parse(readFileSync(new URL(`../src/data/${nombre}`, import.meta.url), 'utf8'));
const cabala = leer('cabala.json');
const hermetismo = leer('hermetismo.json');
const maestros = leer('maestros.json');
const practicas = leer('practicas.json');
const datos = leer('datos.json');

// ───────────────────────────── Lo que se busca y dónde ─────────────────────────────
// Fuentes: { sefaria }, { gutenberg: n.º }, { archive: id }, { wiki: título }, { doi, en: [índices] },
// { pmcid }, { url } (HTML o PDF) y { fred: serie }. «busca» son tramos que la fuente debe traer;
// se prueban las fuentes en orden y basta con que una los traiga todos.
const FUENTES = {
  // Citas hebreas: id de la enseñanza en cabala.json → referencia de Sefaria.
  hebreo: {
    'fuerza-para-hacer-riqueza': 'Deuteronomy.8.17-18',
    'rico-el-que-se-alegra': 'Pirkei_Avot.4.1',
    'diezma-para-enriquecerte': 'Taanit.9a',
    'ventanas-del-cielo': 'Malachi.3.10',
    'negociar-con-fidelidad': 'Shabbat.31a',
    'ocho-grados-de-tsedaca': 'Mishneh_Torah,_Gifts_to_the_Poor.10.7',
    'decimo-y-quinto': 'Ketubot.50a',
  },
  // Citas en inglés o latín: clave → dónde está el original.
  citas: {
    'principios del Kybalion': [{ gutenberg: 14209 }],
    'hermetismo/kybalion-1908': [{ gutenberg: 14209 }],
    'hermetismo/formas-de-pensamiento': [{ gutenberg: 16269 }],
    'hermetismo/tabla-esmeralda': [{ wiki: 'Emerald_Tablet' }],
    'maestros/james-allen': [{ gutenberg: 4507 }],
    'maestros/wallace-wattles': [{ gutenberg: 59844 }],
    'maestros/florence-scovel-shinn': [{ gutenberg: 74878 }],
    'maestros/charles-haanel': [{ archive: 'themasterkeysystemcharlesf.haanel' }],
    'maestros/napoleon-hill': [{ archive: 'think-and-grow-rich_202107' }],
    'maestros/neville-goddard': [{ archive: 'feeling-is-the-secret-neville-goddard' }],
    'maestros/earl-nightingale': [{ archive: 'the-strangest-secret-earl-nightingale' }],
  },
  // Estudios: id de la práctica → cifras que publica el sitio («sitio», tal como salen en «efecto»),
  // dónde está el resumen publicado y qué debe decir. Ojo: Semantic Scholar, OpenAlex y Europe PMC a
  // veces devuelven el resumen del documento de trabajo bajo el DOI de la revista (así entró un 2.800
  // por 2.820 en noviembre de 2026): si hay borrador y versión publicada, apunta a la publicada.
  estudios: {
    'ahorro-automatico': { sitio: ['3,5', '13,6', '40'], fuentes: [{ doi: '10.1086/380085', en: ['openalex'] }], busca: ['3.5 percent to 13.6 percent', '40 months'] },
    'registro-progreso': { sitio: ['0,40', '138', '19.951'], fuentes: [{ doi: '10.1037/bul0000025', en: ['europepmc', 'openalex'] }], busca: ['138 studies', '19,951', 'd+ = 0.40'] },
    'plan-si-entonces': { sitio: ['0,65', '94'], fuentes: [{ url: 'https://www.sciencedirect.com/science/article/abs/pii/S0065260106380021', ancla: 'Implementation Intentions and Goal Achievement' }], busca: ['94 independent', '.65'] },
    'meta-especifica': { sitio: ['35'], fuentes: [{ doi: '10.1037/0003-066X.57.9.705', en: ['openalex'] }], busca: ['35 years of empirical research'] },
    'woop': { sitio: ['0,336', '21', '15.907'], fuentes: [{ doi: '10.3389/fpsyg.2021.565202', en: ['crossref', 'europepmc', 'openalex'] }], busca: ['21 empirical studies', '15,907', '0.336'] },
    'lazos-debiles': { sitio: ['20'], fuentes: [{ doi: '10.1126/science.abl4476', en: ['crossref', 'europepmc', 'openalex'] }], busca: ['20 million people', 'weak ties increased job mobility'] },
    'grupo-de-pares': { sitio: ['8,1', '2.820'], fuentes: [{ url: 'https://ideas.repec.org/a/oup/qjecon/v133y2018i3p1229-1282..html', ancla: 'Interfirm Relationships and Business Performance' }], busca: ['randomized 2,820 firms', 'revenue by 8.1%'] },
    'meditacion': { sitio: ['0,38', '0,30', '8', '47'], fuentes: [{ pmcid: 'PMC4142584' }], busca: ['47 trials', '0.38', '0.30', '8 weeks'] },
    'respiracion-lenta': { sitio: ['0,05'], fuentes: [{ pmcid: 'PMC9873947' }], busca: ['improvement in mood (p < 0.05)', 'reduction in respiratory rate (p < 0.05)'] },
    'autoeficacia': { sitio: ['0,38', '114', '21.616'], fuentes: [{ doi: '10.1037/0033-2909.124.2.240', en: ['openalex'] }], busca: ['114 studies', '21,616', '.38'] },
    'visualizar-proceso': { sitio: [], fuentes: [{ doi: '10.1177/0146167299025002010', en: ['crossref', 'openalex'] }], busca: ['process simulation enhanced studying and improved grades'] },
    'habito-contexto-fijo': { sitio: ['18', '254', '96'], fuentes: [{ doi: '10.1002/ejsp.674', en: ['crossref', 'openalex'] }], busca: ['96 volunteers', '18 to 254 days'] },
    'gratitud': { sitio: ['0,29', '27'], fuentes: [{ url: 'https://link.springer.com/article/10.1007/s10902-020-00236-6', ancla: 'Gratitude Interventions' }], busca: ['k = 27', '0.29'] },
    'gasto-prosocial': { sitio: [], fuentes: [{ doi: '10.1126/science.1150952', en: ['crossref', 'europepmc', 'openalex'] }], busca: ["spending more of one's income on others predicted greater happiness"] },
    'afirmacion-de-valores': { sitio: [], fuentes: [{ doi: '10.1146/annurev-psych-010213-115137', en: ['europepmc', 'openalex'] }], busca: ['self-affirmation interventions'] },
    // APA PsycNet solo abre en un navegador: leído a mano el 15 de noviembre de 2026 (ver la auditoría).
    'postura-erguida': { sitio: ['0,35', '88', '9.779'], fuentes: [{ doi: '10.1037/bul0000356', en: ['europepmc', 'crossref', 'openalex'] }], busca: ['88 studies', '9,779', 'g = 0.35'] },
  },
  // Cifras: id de la cifra en datos.json → valor que publica el sitio, dónde se lee y qué debe decir.
  cifras: {
    'riqueza-mundial-crecimiento': { sitio: '10,8', fuentes: [{ url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20260630-gwr-2026.html' }], busca: ['rose by 10.8%'] },
    'nuevos-millonarios': { sitio: 'casi 1 millón', fuentes: [{ url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20260630-gwr-2026.html' }], busca: ['rose by 1.5%', 'nearly one million new millionaires'] },
    'adultos-millonarios': { sitio: '1,5', fuentes: [{ url: 'https://en.politis.com.cy/news/economy/1017479/global-wealth-hits-new-high-as-inequality-persists-ubs-report-finds' }], busca: ['1.5% of adults'] },
    'suiza-media': { sitio: '910.382', fuentes: [{ url: 'https://www.finews.com/news/english-news/72740-ubs-global-wealth-report-2026-millionaires-paul-danovan-iqbal-khan-robert-karofsky-joel-mokyr' }, { url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20260630-gwr-2026.html' }], busca: ['910,382'] },
    'eeuu-mediana': { sitio: '68.998', fuentes: [{ url: 'https://www.fortune.com/2026/06/30/global-middle-class-inequality-billionaires-ubs-wealth-report/', ancla: 'UBS' }, { url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20260630-gwr-2026.html' }], busca: ['68,998'] },
    'australia-mediana': { sitio: '210.783', fuentes: [{ url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20260630-gwr-2026.html' }, { url: 'https://www.abc.net.au/news/2026-07-02/ubs-global-wealth-report-australia-millionaires/106869298' }], busca: ['210,783', '616,306'] },
    'mexico-mediana': { sitio: '14.449', fuentes: [{ url: 'https://www.bloomberglinea.com/mercados/el-mundo-suma-mas-ricos-que-nunca-pero-america-latina-sigue-lejos-de-las-grandes-fortunas/' }], busca: ['US$14.449', 'US$75.285'] },
    'forbes-400-hechos-a-si-mismos': { sitio: '71', fuentes: [{ url: 'https://www.forbes.com.au/news/billionaires/the-forbes-400-list-ranking-americas-richest-people/' }], busca: ['71% built their own fortunes'] },
    'herederos-milmillonarios': { sitio: '297.800', fuentes: [{ url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20251204-billionaire-ambitions-report-2025.html' }], busca: ['91 heirs', 'USD 297.8 billion'] },
    'herencia-proyectada': { sitio: '5,9', fuentes: [{ url: 'https://www.ubs.com/global/en/media/display-page-ndp/en-20251204-billionaire-ambitions-report-2025.html' }], busca: ['USD 5.9 trillion', 'by 2040'] },
    // La fuente da el complemento: el 21 % recibió alguna herencia.
    'ramsey-sin-herencia': { sitio: '79', fuentes: [{ url: 'https://www.ramseysolutions.com/retirement/how-many-millionaires-actually-inherited-their-wealth' }], busca: ['only 21% of millionaires received any inheritance'] },
    'fidelity-autodeclarados': { sitio: '86', fuentes: [{ url: 'https://www.nbcnews.com/id/wbna48275085' }, { url: 'https://www.accountingtoday.com/news/most-millionaires-consider-themselves-self-made' }], busca: ['86 percent'] },
    // El sitio debe llevar el último dato de la serie: si sale un trimestre nuevo, esto difiere.
    'acciones-del-1-por-ciento': { sitio: '50,9', fuentes: [{ fred: 'WFRBST01122' }], busca: [] },
    'salarios-en-rentas-altas': { sitio: '16', fuentes: [{ url: 'https://taxfoundation.org/blog/importance-various-sources-income-income-group/' }], busca: ['only 16 percent of total income comes from wages', 'over 62 percent'] },
    'acciones-mundiales-retorno-real': { sitio: '5,2', fuentes: [{ url: 'https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/' }], busca: ['5.2% for worldwide equities', '1.7% on bonds', '0.5% on bills'] },
    'un-dolar-desde-1900': { sitio: '3.296', fuentes: [{ url: 'https://www.ubs.com/content/dam/assets/wm/static/cio/documents/giry2026-summary-public.pdf' }, { url: 'https://www.ubs.com/global/en/wealthmanagement/insights/marketnews/article.3435923.html' }], busca: ['3,296'] },
    'ahorro-e-independencia': { sitio: '16,6', calculo: 'cálculo propio: lo comprueba scripts/datos-verificar.mjs' },
    // bls.gov y ftc.gov niegan el acceso a un script: leídas a mano el 15 de noviembre de 2026.
    'supervivencia-diez-anios': { sitio: '34,7', fuentes: [{ url: 'https://www.bls.gov/opub/ted/2024/34-7-percent-of-business-establishments-born-in-2013-were-still-operating-in-2023.htm', ancla: 'business establishments born in 2013' }], busca: ['34.7 percent', '79.6'] },
    'vida-negocios-mexico': { sitio: '7,7', fuentes: [{ url: 'https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2015/especiales/especiales2015_02_38.pdf' }], busca: ['7.7 años de vida al nacer'] },
    'precio-uno-por-ciento': { sitio: '11,1', fuentes: [{ url: 'https://hbr.org/1992/09/managing-price-gaining-profit', ancla: 'Managing Price, Gaining Profit' }], busca: ['increases operating profit by 11.1', '2,463 companies'] },
    'day-trading-brasil': { sitio: '97', fuentes: [{ doi: '10.2139/ssrn.3423101', en: ['crossref'] }], busca: ['97% of all individuals who persisted for more than 300 days lost money', 'Only 1.1% earned more than the Brazilian minimum wage'] },
    'mlm-ingresos': { sitio: '1.000 o menos', fuentes: [{ url: 'https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-staff-issue-report-multi-level-marketing-income-disclosures', ancla: 'Multi-Level Marketing Income Disclosures' }], busca: ['$1,000 or less per year', '70 different multi-level marketers'] },
    'fraude-eeuu': { sitio: '15.900', fuentes: [{ url: 'https://www.pymnts.com/fraud-prevention/2026/consumer-fraud-losses-quintupled-since-2020-ftc-says/' }], busca: ['$15.9 billion in losses'] },
    'fraude-australia': { sitio: '2.180', fuentes: [{ url: 'https://www.accc.gov.au/media-release/continued-action-critical-to-combat-fraud-as-annual-scam-losses-exceed-2-billion' }], busca: ['$2.18 billion', '7.8 per cent'] },
    'estafas-informaticas-espana': { sitio: '412.850', fuentes: [{ url: 'https://www.interior.gob.es/opencms/es/detalle/articulo/La-cibercriminalidad-se-redujo-un-16-por-ciento-en-2024-el-primer-descenso-de-la-serie-historica/', ancla: 'cibercriminalidad' }], busca: ['412.850', '464.801'] },
    'loteria-powerball': { sitio: '1 entre 292.201.338', fuentes: [{ wiki: 'Powerball' }], busca: ['292,201,338'] },
  },
};

// ───────────────────────────── Descargas ─────────────────────────────
const TMP = mkdtempSync(path.join(tmpdir(), 'fuentes-'));
process.on('exit', () => { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* da igual */ } });
const memoria = new Map();
let n = 0;

// Devuelve { estado, tipo, cuerpo (Buffer) } o { error }. Sin agente de usuario inventado: el de curl.
function curl(url, cabeceras = []) {
  const clave = `${url}|${cabeceras.join('|')}`;
  if (memoria.has(clave)) return memoria.get(clave);
  const archivo = path.join(TMP, `d${++n}`);
  const args = ['-sS', '-L', '--compressed', '--max-time', '60', '-o', archivo, '-w', '%{http_code} %{content_type}'];
  for (const c of cabeceras) args.push('-H', c);
  const r = spawnSync('curl', [...args, url], { encoding: 'utf8' });
  let res;
  if (r.error) res = { error: `no se pudo ejecutar curl (${r.error.code || r.error.message})` };
  else if (r.status !== 0) res = { error: (r.stderr || '').trim().split('\n').pop() || `curl salió con ${r.status}` };
  else {
    const [estado, ...tipo] = r.stdout.trim().split(' ');
    let cuerpo = Buffer.alloc(0);
    try { cuerpo = readFileSync(archivo); } catch { /* sin cuerpo */ }
    res = Number(estado) === 200 ? { estado: 200, tipo: tipo.join(' '), cuerpo, archivo } : { error: `HTTP ${estado}` };
  }
  memoria.set(clave, res);
  return res;
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', thinsp: ' ' };
const sinEntidades = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, e) => ENTIDADES[e.toLowerCase()] ?? m);
// Texto de una página: sin etiquetas, pero con lo que traen los <script> (algunas webs guardan ahí el artículo).
const textoHtml = (s) => sinEntidades(sinEntidades(s.replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\n|\\"/g, ' ').replace(/<[^>]*>/g, ' ')));

let hayPdftotext;
function textoPdf(archivo) {
  if (hayPdftotext === undefined) hayPdftotext = !spawnSync('pdftotext', ['-v'], { encoding: 'utf8' }).error;
  if (!hayPdftotext) return { error: 'es un PDF y falta pdftotext' };
  const r = spawnSync('pdftotext', ['-layout', archivo, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? { texto: r.stdout } : { error: 'pdftotext no pudo leer el PDF' };
}

// Cada lector devuelve { texto, donde } o { error, donde }.
const json = (url) => { const r = curl(url, ['Accept: application/json']); if (r.error) return r; try { return { datos: JSON.parse(r.cuerpo.toString('utf8')) }; } catch { return { error: 'no devolvió JSON' }; } };
const LECTORES = {
  url({ url }) {
    const r = curl(url);
    if (r.error) return { error: r.error, donde: url };
    if (r.cuerpo.subarray(0, 5).toString() === '%PDF-') { const t = textoPdf(r.archivo); return { ...t, donde: url }; }
    return { texto: textoHtml(r.cuerpo.toString('utf8')), donde: url };
  },
  gutenberg({ gutenberg: id }) {
    const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
    const r = curl(url);
    return r.error ? { error: r.error, donde: url } : { texto: r.cuerpo.toString('utf8'), donde: url };
  },
  archive({ archive: id }) {
    const meta = json(`https://archive.org/metadata/${id}`);
    if (meta.error) return { error: meta.error, donde: `archive.org/details/${id}` };
    const f = (meta.datos.files || []).find((x) => /_djvu\.txt$/.test(x.name));
    if (!f) return { error: 'archive.org no trae el texto completo (_djvu.txt)', donde: `archive.org/details/${id}` };
    const url = `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`;
    const r = curl(url);
    return r.error ? { error: r.error, donde: url } : { texto: r.cuerpo.toString('utf8'), donde: url };
  },
  wiki({ wiki: titulo }) {
    const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(titulo)}&action=raw`;
    const r = curl(url);
    return r.error ? { error: r.error, donde: url } : { texto: r.cuerpo.toString('utf8'), donde: url };
  },
  sefaria({ sefaria: ref }) {
    const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0`;
    const r = json(url);
    if (r.error) return { error: r.error, donde: url };
    const he = [r.datos.he].flat(Infinity).filter((x) => typeof x === 'string').join(' ');
    return he ? { texto: he, donde: url } : { error: 'Sefaria no devolvió texto hebreo', donde: url };
  },
  pmcid({ pmcid }) {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(`PMCID:${pmcid}`)}&resultType=core&format=json`;
    const r = json(url);
    if (r.error) return { error: r.error, donde: url };
    const t = r.datos.resultList?.result?.[0]?.abstractText;
    return t ? { texto: textoHtml(t), donde: `Europe PMC, ${pmcid}` } : { error: 'Europe PMC no trae el resumen', donde: url };
  },
  // Un DOI en varios índices: vale el primero que traiga resumen.
  doi({ doi, en = ['crossref', 'europepmc', 'openalex'] }) {
    const errores = [];
    for (const indice of en) {
      let texto = '';
      if (indice === 'crossref') {
        const r = json(`https://api.crossref.org/works/${encodeURIComponent(doi).replace(/%2F/g, '/')}`);
        if (r.error) { errores.push(`Crossref: ${r.error}`); continue; }
        texto = r.datos.message?.abstract || '';
      } else if (indice === 'europepmc') {
        const r = json(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(`DOI:"${doi}"`)}&resultType=core&format=json`);
        if (r.error) { errores.push(`Europe PMC: ${r.error}`); continue; }
        texto = r.datos.resultList?.result?.[0]?.abstractText || '';
      } else if (indice === 'openalex') {
        const r = json(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi).replace(/%2F/g, '/')}`);
        if (r.error) { errores.push(`OpenAlex: ${r.error}`); continue; }
        const palabras = [];
        for (const [palabra, sitios] of Object.entries(r.datos.abstract_inverted_index || {})) for (const i of sitios) palabras[i] = palabra;
        texto = palabras.join(' ');
      }
      if (texto) return { texto: textoHtml(texto), donde: `${indice}, ${doi}` };
      errores.push(`${indice}: sin resumen`);
    }
    return { error: errores.join('; '), donde: `doi:${doi}` };
  },
  fred({ fred: serie }) {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${serie}`;
    const r = curl(url);
    if (r.error) return { error: r.error, donde: url };
    const filas = r.cuerpo.toString('utf8').trim().split(/\r?\n/).slice(1).map((l) => l.split(',')).filter((f) => f.length === 2 && f[1] !== '.' && f[1] !== '');
    return filas.length ? { serie: filas, donde: url } : { error: 'la serie vino vacía', donde: url };
  },
};
const abrir = (fuente) => LECTORES[Object.keys(LECTORES).find((k) => k in fuente)](fuente);

// ───────────────────────────── Comparaciones ─────────────────────────────
// Igual salvo tipografía: comillas, guiones, cursivas de Gutenberg, espacios y mayúsculas.
const llano = (s) => s.normalize('NFKC')
  .replace(/[\u2018\u2019\u201B\u2032\u0060\u00B4]/g, "'").replace(/[\u201C\u201D\u201F\u00AB\u00BB]/g, '"')
  .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/-{2,}/g, '-').replace(/\s*-\s*/g, '-')
  .replace(/_/g, '').replace(/[\u00A0\u2000-\u200B\u202F\u205F\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
// Solo las palabras hebreas, letra por letra y separadas por un espacio: fuera puntos, acentos y
// signos (U+0591 a U+05C7); el Nombre, escrito entero (yod, he, vav, he), con qof o abreviado con
// geresh, queda como una he. Los espacios de los extremos hacen que solo casen palabras enteras.
const NOMBRE = /\u05D9\u05D4\u05D5\u05D4|\u05D9\u05E7\u05D5\u05E7|\u05D4[\u05F3']/g;
const letras = (s) => ` ${s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').normalize('NFC')
  .replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '')
  .replace(NOMBRE, '\u05D4').replace(/[^\u05D0-\u05EA]+/g, ' ').trim()} `;
// Cifras de un texto del sitio, tal como están escritas («0,65», «19.951»).
const cifrasDe = (s) => s.match(/\d+(?:[.,]\d+)*/g) || [];

let resumen = { ok: 0, difiere: 0, 'no abre': 0 };
const DETALLE = process.argv.includes('--detalle');
function decir(estado, bloque, nombre, detalle = '') {
  resumen[estado]++;
  console.log(`${estado.padEnd(8)} ${bloque} · ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

// Prueba las fuentes en orden. «busca» puede ser una lista de tramos o una función sobre el texto.
function cotejar(bloque, nombre, fuentes, comprobar) {
  const cerradas = [];
  let difiere = null;
  for (const fuente of fuentes) {
    const r = abrir(fuente);
    if (r.error) { cerradas.push(`${r.donde}: ${r.error}`); continue; }
    if (fuente.ancla && r.texto !== undefined && !llano(r.texto).includes(llano(fuente.ancla))) {
      cerradas.push(`${r.donde}: respondió, pero sin el texto de la página`);
      continue;
    }
    const falta = comprobar(r);
    if (!falta) return decir('ok', bloque, nombre, DETALLE ? r.donde : '');
    difiere ??= `${falta} (${r.donde})`;
  }
  if (difiere) return decir('difiere', bloque, nombre, difiere);
  return decir('no abre', bloque, nombre, cerradas.join(' | '));
}
// ¿Está el tramo en el texto, como palabras enteras? («0.30» no vale dentro de «10.30», ni
// «compensate» dentro de «compensates».)
const ALFANUM = /[\p{L}\p{N}]/u;
function contiene(pajar, tramo) {
  for (let i = pajar.indexOf(tramo); i >= 0; i = pajar.indexOf(tramo, i + 1)) {
    const antes = pajar[i - 1] ?? ' ';
    const despues = pajar[i + tramo.length] ?? ' ';
    if (!(ALFANUM.test(tramo[0]) && ALFANUM.test(antes)) && !(ALFANUM.test(tramo.at(-1)) && ALFANUM.test(despues))) return true;
  }
  return false;
}
const faltan = (tramos) => ({ texto }) => {
  const pajar = llano(texto);
  const no = tramos.filter((t) => !contiene(pajar, llano(t)));
  return no.length ? `la fuente no dice ${no.map((t) => `«${t}»`).join(' ni ')}` : null;
};

// ───────────────────────────── Bloques ─────────────────────────────
const BLOQUES = {
  hebreo() {
    const conCita = cabala.ensenanzas.filter((e) => e.cita?.original);
    for (const e of conCita) {
      const ref = FUENTES.hebreo[e.id];
      const nombre = `${e.cita.referencia} («${e.id}»)`;
      if (!ref) { decir('difiere', 'hebreo', nombre, 'la cita no tiene referencia de Sefaria en FUENTES.hebreo'); continue; }
      cotejar('hebreo', nombre, [{ sefaria: ref }], ({ texto }) => {
        const pajar = letras(texto);
        let desde = 0;
        for (const tramo of e.cita.original.split('\u2026').map(letras).filter((t) => t.trim())) {
          const i = pajar.indexOf(tramo, desde);
          if (i < 0) return `Sefaria (${ref}) no trae, letra por letra y en este orden, el tramo «${tramo.trim()}»`;
          desde = i + tramo.length - 1; // el espacio final puede ser el inicial del tramo siguiente
        }
        return null;
      });
    }
    for (const id of Object.keys(FUENTES.hebreo)) if (!conCita.some((e) => e.id === id)) decir('difiere', 'hebreo', id, 'está en FUENTES.hebreo pero ya no hay cita hebrea con ese id en cabala.json');
  },

  citas() {
    const literal = (clave, nombre, original) => {
      const fuentes = FUENTES.citas[clave];
      if (!fuentes) return decir('difiere', 'citas', nombre, `la cita no tiene original en FUENTES.citas («${clave}»)`);
      // Un punto o una coma finales no cuentan: varían de una edición a otra.
      const tramo = original.replace(/[.,;:]+$/, '');
      cotejar('citas', nombre, fuentes, faltan([tramo]));
    };
    for (const p of hermetismo.principios) literal('principios del Kybalion', `Kybalion, principio ${p.numero} (${p.nombre})`, p.enunciado_original);
    for (const e of hermetismo.ensenanzas) if (e.cita?.original) literal(`hermetismo/${e.id}`, e.cita.referencia, e.cita.original);
    for (const m of maestros.maestros) if (m.cita?.original) literal(`maestros/${m.id}`, `${m.nombre}, ${m.cita.fuente}`, m.cita.original);
  },

  estudios() {
    for (const p of practicas.practicas) {
      const f = FUENTES.estudios[p.id];
      const nombre = `${p.estudio.cita.split(',')[0]} («${p.id}»)`;
      if (!f) { decir('difiere', 'estudios', nombre, 'la práctica no tiene entrada en FUENTES.estudios'); continue; }
      const ahora = cifrasDe(p.efecto);
      if (ahora.join(' ') !== f.sitio.join(' ')) { decir('difiere', 'estudios', nombre, `el sitio dice «${p.efecto}» y FUENTES.estudios se hizo para las cifras ${f.sitio.join(', ') || '(ninguna)'}: coteja de nuevo y actualiza la entrada`); continue; }
      cotejar('estudios', nombre, f.fuentes, faltan(f.busca));
    }
    for (const id of Object.keys(FUENTES.estudios)) if (!practicas.practicas.some((p) => p.id === id)) decir('difiere', 'estudios', id, 'está en FUENTES.estudios pero ya no hay práctica con ese id');
  },

  cifras() {
    for (const c of datos.cifras) {
      const f = FUENTES.cifras[c.id];
      const nombre = `${c.titulo}: ${c.valor} («${c.id}»)`;
      if (!f) { decir('difiere', 'cifras', nombre, 'la cifra no tiene entrada en FUENTES.cifras'); continue; }
      if (c.valor !== f.sitio) { decir('difiere', 'cifras', nombre, `el sitio dice «${c.valor}» y FUENTES.cifras se hizo para «${f.sitio}»: coteja de nuevo y actualiza la entrada`); continue; }
      if (f.calculo) { decir('ok', 'cifras', nombre, f.calculo); continue; }
      if (f.fuentes[0].fred) {
        cotejar('cifras', nombre, f.fuentes, ({ serie }) => {
          const [fecha, valor] = serie.at(-1);
          const ultimo = Number(valor).toFixed(1).replace('.', ',');
          return ultimo === c.valor ? null : `el último dato de la serie es ${ultimo} (${fecha}) y el sitio dice ${c.valor}`;
        });
        continue;
      }
      cotejar('cifras', nombre, f.fuentes, faltan(f.busca));
    }
    for (const id of Object.keys(FUENTES.cifras)) if (!datos.cifras.some((c) => c.id === id)) decir('difiere', 'cifras', id, 'está en FUENTES.cifras pero ya no hay cifra con ese id');
  },
};

// ───────────────────────────── Ejecución ─────────────────────────────
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const desconocidos = pedidos.filter((b) => !(b in BLOQUES));
if (desconocidos.length) { console.error(`No conozco: ${desconocidos.join(', ')}. Bloques: ${Object.keys(BLOQUES).join(', ')}.`); process.exit(2); }
if (spawnSync('curl', ['--version'], { encoding: 'utf8' }).error) { console.error('Hace falta curl en el PATH.'); process.exit(2); }
for (const bloque of pedidos.length ? pedidos : Object.keys(BLOQUES)) BLOQUES[bloque]();
console.log(`\n${resumen.ok} ok, ${resumen.difiere} difieren, ${resumen['no abre']} no abren`);
if (resumen['no abre']) console.log('Lo que no abre no cuenta como fallo: ábrelo a mano si quieres cerrarlo.');
process.exit(resumen.difiere ? 1 : 0);
