/* =========================================================================
 * tools/check.js — FURI MONSTER build verification (zero dependencies).
 *
 * Checks the acceptance criteria from the brief (§17.3) that can be tested
 * without a browser:
 *   • every internal link and asset reference resolves (no 404s)
 *   • no unresolved {{PLACEHOLDER}} survives into the output
 *   • each page has title, description, canonical and an OG image
 *   • the three locales have identical key sets (no language bleed)
 *   • each page carries the same number of runs in all three languages
 *   • no duplicate element ids within a page
 *   • attribution/placeholder honesty: no unlabelled concept content
 *
 *   node tools/check.js
 * ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const JS = path.join(SITE, 'assets', 'js');

require(path.join(JS, 'site.config.js'));
require(path.join(JS, 'data.js'));
require(path.join(JS, 'i18n.js'));
require(path.join(JS, 'art.js'));
const FM = globalThis.FM;

const problems = [];
const notes = [];
function fail(msg) { problems.push(msg); }

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('_') || e.name === 'src' || e.name === 'tools') continue;
    /* the claw machine is a self-contained app embedded at /play/, not a site
     * page: it has its own shell and deliberately no canonical/OG/locale tags */
    if (e.name === 'claw-machine') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/* Strip <script> and <style> bodies before scanning markup. Without this the
 * id/link checks match string literals inside inline JavaScript — for example
 * a repair path that writes `innerHTML = '<div id="bootScale">…'` reads as a
 * duplicate id. */
function markupOnly(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
}

/* Text of ONE locale layer. Every translatable run is a
 * <span class="t…" data-l="LOC">…</span>, but the payload may contain nested
 * markup, so the closing tag is found by counting depth rather than by a
 * non-greedy match — a lazy regex would stop at the first inner </span> and
 * quietly under-report the text. */
function localeText(html, loc) {
  const open = new RegExp('<span class="t[^"]*" data-l="' + loc + '">', 'g');
  const tag = /<\/?span\b[^>]*>/g;
  let out = '', m;
  while ((m = open.exec(html))) {
    tag.lastIndex = open.lastIndex;
    let depth = 1, t;
    while ((t = tag.exec(html))) {
      if (t[0][1] === '/') { depth--; if (depth === 0) break; } else { depth++; }
    }
    out += ' ' + html.slice(open.lastIndex, t ? t.index : html.length);
  }
  return out;
}

/* Pages whose English layer is allowed to carry Han or kana. Empty: the whole
 * site is hand-authored in English and no proper noun needed CJK. Add an entry
 * with a reason rather than loosening the pattern. */
const EN_CJK_ALLOW = [];

const pages = walk(SITE);
if (!pages.length) fail('no built pages found — run tools/build.js first');

/* ---------- 1. links and assets ----------------------------------------- */
pages.forEach(p => {
  const raw = fs.readFileSync(p, 'utf8');
  const html = markupOnly(raw);
  const rel = path.relative(SITE, p).replace(/\\/g, '/');
  const dir = path.dirname(p);

  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  refs.forEach(r => {
    if (!r || r.startsWith('http') || r.startsWith('mailto:') || r.startsWith('#') ||
      r.startsWith('data:') || r.startsWith('tel:')) return;
    const target = r.split('#')[0].split('?')[0];
    if (!target) return;
    const resolved = path.resolve(dir, target);
    if (!fs.existsSync(resolved)) fail(`${rel}: broken link → ${r}`);
  });

  /* ---------- 2. unresolved placeholders -------------------------------- */
  const leftovers = html.match(/\{\{[^}]{0,60}\}\}/g);
  if (leftovers) fail(`${rel}: unresolved placeholder(s): ${[...new Set(leftovers)].slice(0, 4).join(' ')}`);

  /* ---------- 3. required head metadata --------------------------------- */
  if (!/<title>[^<]{8,}<\/title>/.test(html)) fail(`${rel}: missing or too-short <title>`);
  if (!/<meta name="description" content="[^"]{30,}"/.test(html)) fail(`${rel}: missing/short meta description`);
  if (rel !== '404.html') {
    if (!/<link rel="canonical" href="https:\/\/[^"]+"/.test(html)) fail(`${rel}: missing canonical`);
    if (!/property="og:image" content="[^"]+"/.test(html)) fail(`${rel}: missing og:image`);
  }
  if (!/<html lang="en" data-locale="en"[^>]*>/.test(html)) fail(`${rel}: root element missing locale bootstrap`);
  /* chrome.js reads the site-root prefix off <html data-root>, so every built
   * page must carry it — without it the header links and the game artwork on a
   * page inside a subdirectory resolve one level too high. */
  if (!/<html[^>]*\sdata-root="[^"]*"[^>]*>/.test(html)) fail(`${rel}: root element missing data-root prefix`);

  /* ---------- 4. locale parity within the page -------------------------- */
  const count = l => (html.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
  const c = {};
  FM.config.locales.forEach(l => { c[l] = count(l); });
  const counts = FM.config.locales.map(l => c[l]);
  if (new Set(counts).size !== 1) {
    fail(`${rel}: locale runs unbalanced — ` +
      FM.config.locales.map(l => `${l}=${c[l]}`).join(' '));
  }

  /* ---------- 5. duplicate ids ------------------------------------------ */
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupes.length) fail(`${rel}: duplicate id(s): ${[...new Set(dupes)].join(', ')}`);

  /* ---------- 6. accessibility spot checks ------------------------------ */
  if (!/<main id="main"/.test(html)) fail(`${rel}: missing <main id="main">`);
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  imgs.forEach(t => { if (!/alt="[^"]*"/.test(t)) fail(`${rel}: <img> without alt`); });

  /* ---------- 6b. the English layer must actually be English ------------
   * A machine-translated batch that never arrived once shipped with the
   * Simplified source pasted into all five locales, so pages read Chinese
   * whatever language you picked — and every structural check still passed,
   * because the markup was perfectly valid. Structural validity is not
   * translation. */
  if (EN_CJK_ALLOW.indexOf(rel) === -1) {
    const enText = localeText(html, 'en').replace(/<[^>]*>/g, ' ');
    const cjk = enText.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g);
    if (cjk) {
      const run = (enText.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff][^\s]{0,12}(\s[^\s]{0,12}){0,4}/) || [''])[0].trim();
      fail(`${rel}: English layer holds ${cjk.length} CJK character(s) — untranslated stub? e.g. “${run.slice(0, 48)}”`);
    }
  }

  /* ---------- 7. honesty: concept content must be labelled -------------- */
  if (/badge--concept|Concept design/.test(html) === false && /collection/i.test(rel)) {
    notes.push(`${rel}: no concept badge found (check collections page labelling)`);
  }
});
notes.push(`${pages.length} pages scanned`);

/* ---------- 8. dictionary key parity ----------------------------------- */
const locales = FM.i18n.locales.map(l => l.id);
const keys = {};
locales.forEach(l => { keys[l] = new Set(Object.keys(FM.i18n.dict[l] || {})); });
const allKeys = new Set([].concat(...locales.map(l => [...keys[l]])));
allKeys.forEach(k => {
  locales.forEach(l => { if (!keys[l].has(k)) fail(`i18n: key "${k}" missing from locale "${l}"`); });
});

/* ---------- 9. data integrity ----------------------------------------- */
const slugs = FM.data.characters.map(c => c.slug);
if (slugs.length !== 6) fail(`expected 6 characters, found ${slugs.length}`);
FM.data.characters.forEach(c => {
  ['name', 'slug', 'symbol', 'role', 'tagline', 'personality', 'likes', 'dislikes',
    'fear', 'mission', 'ability', 'primaryEmotion', 'origin', 'signatureMoment', 'theme']
    .forEach(f => { if (!c[f]) fail(`character ${c.slug}: missing field "${f}"`); });
  FM.config.locales.forEach(l => {
    ['symbol', 'role', 'tagline', 'mission'].forEach(f => {
      if (!c[f][l]) fail(`character ${c.slug}: field "${f}" missing locale "${l}"`);
    });
  });
  if (!FM.art.monster(c.slug, { size: 100 })) fail(`character ${c.slug}: art renderer returned empty`);
});
FM.data.relations.forEach(r => {
  if (!FM.data.bySlug(r.from)) fail(`relation references unknown slug "${r.from}"`);
  if (!FM.data.bySlug(r.to)) fail(`relation references unknown slug "${r.to}"`);
  if (!FM.data.relationTypes[r.type]) fail(`relation type "${r.type}" is not in relationTypes`);
});
FM.data.emotions.forEach(e => {
  if (!FM.data.bySlug(e.character)) fail(`emotion "${e.id}" maps to unknown character "${e.character}"`);
});
const emotionTargets = new Set(FM.data.emotions.map(e => e.character));
FM.data.characters.forEach(c => {
  if (!emotionTargets.has(c.slug)) notes.push(`character ${c.slug} is not reachable from the Emotion Lab`);
});

/* ---------- 10. config placeholders are visibly marked ----------------- */
if (FM.config.forms.endpoint) notes.push('forms.endpoint is set — form delivery is live');
else notes.push('forms.endpoint is EMPTY — forms validate but do not deliver (expected until configured)');
if (FM.config.analytics.ga4) notes.push('GA4 measurement id is set — analytics events are being sent');
else notes.push('GA4 id is EMPTY — analytics events are dispatched locally but not sent');
const unconfirmed = FM.config.social.filter(s => /NEEDS-CONFIRM|furimonster\.com\/furi/.test(s.href) || s.id === 'facebook');
notes.push('social links: ' + FM.config.social.filter(s => s.primary).length + ' primary accounts, ' +
  'QR artwork wired for ' + FM.config.social.filter(s => s.qr).length + ' — confirm the Facebook page URL before launch');

/* ---------- 11. Thai/Japanese translation debt -------------------------- *
 * Reported on every run rather than mentioned once. The failure this replaced
 * was English being served under a Thai or Japanese label with nothing said
 * about it, which is how 300-odd strings went missing unnoticed.
 *
 * The count comes from tools/mt-page-text.missing.json, which build.js rewrites
 * on every build — so this reflects the last build, and `pnpm build` runs them
 * in that order. */
{
  const mtPath = path.join(__dirname, 'mt-page-text.json');
  const missPath = path.join(__dirname, 'mt-page-text.missing.json');
  let translated = null;
  try { translated = Object.keys(JSON.parse(fs.readFileSync(mtPath, 'utf8')).runs || {}).length; }
  catch (e) { /* handled below */ }
  if (translated === null) {
    problems.push('tools/mt-page-text.json is missing or unreadable — every Thai and Japanese string falls back to English');
  } else {
    let missing = 0;
    let pages = 0;
    try {
      const miss = JSON.parse(fs.readFileSync(missPath, 'utf8'));
      missing = miss._counts.distinct;
      pages = miss._counts.pages;
    } catch (e) { missing = -1; }
    if (missing === -1) {
      problems.push('no Thai/Japanese outstanding list found — run `node tools/build.js` first');
    } else if (missing > 0) {
      /* A hard failure, not a note. English served under a Thai or Japanese
       * label is a defect, and the whole reason it survived for so long is that
       * nothing failed when it happened. */
      problems.push(`Thai/Japanese: ${missing} string(s) across ${pages} page(s) still fall back to English — ` +
        'see tools/mt-page-text.missing.json and add them to tools/mt-page-text.json');
    } else {
      notes.push(`Thai/Japanese: all ${translated} string(s) translated — no English fallback remains`);
    }
  }
}

/* ---------- report ------------------------------------------------------ */
console.log(`\nFURI MONSTER build check — ${pages.length} pages\n${'─'.repeat(60)}`);
if (notes.length) { console.log('\nNotes:'); notes.forEach(n => console.log('  · ' + n)); }
if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):`);
  problems.slice(0, 60).forEach(p => console.log('  ✗ ' + p));
  if (problems.length > 60) console.log(`  … and ${problems.length - 60} more`);
  process.exit(1);
}
console.log('\n✓ all checks passed');
