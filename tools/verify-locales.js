/* =========================================================================
 * tools/verify-locales.js — does Thai and Japanese actually reach the page?
 *
 * tools/build.js reports what it *intended* to translate; this reads the built
 * HTML and reports what a visitor would actually be served. A string is counted
 * as untranslated when the Thai or Japanese span is byte-identical to the
 * English one — the exact symptom that went unnoticed for so long.
 *
 * Some of those are legitimate: FURI PLANET, Furi Lab, LINE and WhatsApp are
 * the same in every language on purpose. So the identical list is printed
 * rather than only counted, and the legitimate ones can be seen at a glance.
 *
 *   node tools/verify-locales.js
 * ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const LOCALES = [
  { id: 'en', label: 'English' },
  { id: 'zh-Hant', label: '繁中' },
  { id: 'zh-Hans', label: '简中' },
  { id: 'th', label: 'ไทย' },
  { id: 'ja', label: '日本語' }
];

function pages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/* pull every <span class="t …" data-l="xx">…</span>, in document order.
 * The site never nests these, so a non-greedy match is exact. The locale id
 * needs A-Z as well as a-z: zh-Hant and zh-Hans are not lowercase. */
const SPAN = /<span class="t[^"]*" data-l="([A-Za-z-]+)">([\s\S]*?)<\/span>/g;

function decode(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

const files = pages(SITE).filter(f => !/[\\/](src|tools|_extract)[\\/]/.test(f));
const stats = {};
LOCALES.forEach(l => { stats[l.id] = { total: 0, identical: new Map() }; });
let runsChecked = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  /* group the spans of one page into runs of five, by order */
  const found = [...html.matchAll(SPAN)].map(m => ({ loc: m[1], text: decode(m[2]) }));
  for (let i = 0; i + 4 < found.length; i += 5) {
    const run = found.slice(i, i + 5);
    const byLoc = {};
    run.forEach(r => { byLoc[r.loc] = r.text; });
    if (Object.keys(byLoc).length !== 5) continue;      // not a clean five-locale run
    runsChecked++;
    const en = byLoc.en;
    ['th', 'ja'].forEach(l => {
      stats[l].total++;
      if (byLoc[l] === en) {
        stats[l].identical.set(en, (stats[l].identical.get(en) || 0) + 1);
      }
    });
  }
}

console.log('FURI MONSTER locale verification — ' + files.length + ' built pages');
console.log('language runs checked: ' + runsChecked + '\n');

let problems = 0;
const gaps = [];
['th', 'ja'].forEach(l => {
  const s = stats[l];
  const label = l === 'th' ? 'Thai' : 'Japanese';
  /* empty payloads are legitimate (a comic panel with no dialogue emits one),
   * so they are dropped rather than listed as untranslated */
  const list = [...s.identical.keys()].filter(x => x.trim() !== '').sort();
  const real = list.filter(x => x.length > 60);
  /* Anything this long that is still English is prose, not a brand name or a
   * key hint. Every legitimate identical string on this site is short — 404,
   * LINE, WhatsApp, FURI PLANET, (B), “Pinki!!!” — so length is the reliable
   * dividing line and a long one is a genuine gap. */
  const pct = s.total ? ((s.total - s.identical.size) / s.total * 100).toFixed(1) : '0.0';
  console.log(`${label}: ${s.total} runs, ${s.identical.size} distinct string(s) identical to English ` +
    `(${pct}% carry real ${label} text)`);
  if (real.length) {
    console.log(`  ${real.length} look like a real gap (English prose, over 60 characters):`);
    real.forEach(x => console.log('    ! ' + x));
  }
  const review = list.filter(x => x.length <= 60);
  if (review.length) {
    console.log(`  ${review.length} short identical string(s) — expected: numerals, brand and platform names, key hints:`);
    review.forEach(x => console.log('    · ' + x));
  }
  console.log('');
  problems += real.length;
  gaps.push.apply(gaps, real);
});

console.log(problems === 0
  ? 'PASSED — no English prose is left untranslated in Thai or Japanese'
  : `${problems} string(s) of English prose are still served untranslated`);

/* ---------- script sanity ------------------------------------------------- *
 * A translation table written by hand is one paste away from carrying the
 * wrong script. Thai text must not contain CJK and Japanese must not contain
 * Thai, so both are checked here rather than trusted. */
const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const THAI = /[\u0E00-\u0E7F]/;
let scriptProblems = 0;
try {
  const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'mt-page-text.json'), 'utf8')).runs || {};
  console.log('\nscript sanity — ' + Object.keys(table).length + ' table entries');
  Object.keys(table).forEach(key => {
    const row = table[key] || {};
    if (row.th && CJK.test(row.th)) {
      scriptProblems++;
      console.log('  ! Thai value contains CJK characters: ' + JSON.stringify(row.th.slice(0, 60)));
    }
    if (row.ja && THAI.test(row.ja)) {
      scriptProblems++;
      console.log('  ! Japanese value contains Thai characters: ' + JSON.stringify(row.ja.slice(0, 60)));
    }
  });
  if (!scriptProblems) console.log('  no wrong-script values found');
} catch (e) {
  console.log('\nscript sanity — could not read tools/mt-page-text.json: ' + e.message);
  scriptProblems = 1;
}
console.log(scriptProblems === 0
  ? 'PASSED — every Thai and Japanese value is in the right script'
  : `${scriptProblems} value(s) are in the wrong script`);
