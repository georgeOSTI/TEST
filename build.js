// Bilingual static site build script.
// Edit text in i18n/<page>.json (en/es pairs), then run: node build.js
// Requires: npm install cheerio  (one-time)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const I18N_DIR = path.join(ROOT, 'i18n');

const SLUG_MAP = {
  '/': '/es/',
  '/portable-restroom-rental.html': '/es/renta-de-banos-portatiles.html',
  '/luxury-restroom-trailers.html': '/es/banos-de-lujo.html',
  '/septic-tank-pumping.html': '/es/limpieza-fosas-septicas.html',
  '/construction-site-equipment.html': '/es/equipo-para-construccion.html',
  '/service-area.html': '/es/zona-de-servicio.html',
  '/about.html': '/es/nosotros.html',
  '/contact.html': '/es/contacto.html'
};
const REVERSE_SLUG_MAP = Object.fromEntries(Object.entries(SLUG_MAP).map(([en, es]) => [es, en]));

const PAGES = [
  { key: 'index', enOut: 'index.html' },
  { key: 'about', enOut: 'about.html' },
  { key: 'contact', enOut: 'contact.html' },
  { key: 'service-area', enOut: 'service-area.html' },
  { key: 'portable-restroom-rental', enOut: 'portable-restroom-rental.html' },
  { key: 'luxury-restroom-trailers', enOut: 'luxury-restroom-trailers.html' },
  { key: 'septic-tank-pumping', enOut: 'septic-tank-pumping.html' },
  { key: 'construction-site-equipment', enOut: 'construction-site-equipment.html' }
];

function localizeHref(href, lang) {
  if (lang === 'en') return REVERSE_SLUG_MAP[href] || href;
  return SLUG_MAP[href] || href;
}

function substituteTokens(template, translations, lang) {
  return template.replace(/\{\{(k\d+)\}\}/g, (m, key) => {
    const t = translations[key];
    if (!t) return m;
    return lang === 'es' ? t.es : t.en;
  });
}

function localizeMarkup(html, lang) {
  const $ = cheerio.load(html, { decodeEntities: false });
  $('html').attr('lang', lang === 'es' ? 'es' : 'en');

  $('[href]').each((_, el) => {
    const $el = $(el);
    if ($el.is('link[rel="alternate"]')) return; // hreflang block: identical in both outputs, never localized
    const href = $el.attr('href');
    if (!href) return;
    const abs = href.startsWith('https://oarestroomservices.com');
    const p = abs ? href.replace('https://oarestroomservices.com', '') || '/' : href;

    // Cross-language toggle links (e.g. "Español"/"English"): the EN-sourced template
    // already points AT the Spanish page (correct as-is for EN output). For ES output,
    // flip it back to the English equivalent instead of forward-mapping it again.
    const isEsShaped = p === '/es/' || p.startsWith('/es/');
    const localized = isEsShaped
      ? (lang === 'es' ? (REVERSE_SLUG_MAP[p] || p) : p)
      : localizeHref(p, lang);

    if (localized !== p) {
      $el.attr('href', abs ? 'https://oarestroomservices.com' + localized : localized);
    }
  });

  return $.html();
}

let built = 0;
for (const page of PAGES) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, page.key + '.html'), 'utf8');
  const data = JSON.parse(fs.readFileSync(path.join(I18N_DIR, page.key + '.json'), 'utf8'));

  const enHtml = localizeMarkup(substituteTokens(template, data.translations, 'en'), 'en');
  const esHtml = localizeMarkup(substituteTokens(template, data.translations, 'es'), 'es');

  fs.writeFileSync(path.join(ROOT, page.enOut), enHtml, 'utf8');

  const esRelPath = page.key === 'index'
    ? 'es/index.html'
    : SLUG_MAP['/' + page.enOut].replace(/^\//, '');
  const esFullPath = path.join(ROOT, esRelPath);
  fs.mkdirSync(path.dirname(esFullPath), { recursive: true });
  fs.writeFileSync(esFullPath, esHtml, 'utf8');

  console.log('built', page.enOut, '+', esRelPath);
  built++;
}
console.log(`\n${built} page pairs built.`);
