/* =========================================================================
 * tools/mt.js — the Thai/Japanese translation table, shared by every build-time
 * markup generator.
 *
 * This is its own module for a concrete reason. tools/forms.js emits the same
 * <span class="t" data-l="th"> markup as tools/build.js, but it had its own
 * copy of the emitter that fell back to English and recorded nothing. The
 * result: the build reported "all strings resolved" while four pages shipped
 * English under Thai and Japanese labels in the licensing and newsletter forms.
 *
 * So anything that emits a language span goes through here. A miss is recorded
 * in `missing`, and tools/build.js writes that list out for the next
 * translation batch.
 *
 * The key is the exact English payload. Change the English and the lookup
 * misses, which is the point: a stale translation cannot survive an edit
 * unnoticed.
 * ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const TABLE_PATH = path.join(__dirname, 'mt-page-text.json');

let RUNS = {};
try {
  RUNS = (JSON.parse(fs.readFileSync(TABLE_PATH, 'utf8')).runs) || {};
} catch (e) {
  if (fs.existsSync(TABLE_PATH)) {
    throw new Error('tools/mt-page-text.json is not valid JSON: ' + e.message);
  }
  RUNS = {};
}

const missing = new Set();
const byPage = new Map();
let page = '(shared)';

function setPage(p) { page = p || '(shared)'; }
function getPage() { return page; }

/* Record one English string as having no Thai or Japanese translation. Empty
 * payloads are legitimately empty — a comic panel with no dialogue produces
 * one — so they are not debt. */
function note(enText) {
  if (!enText) return;
  missing.add(enText);
  if (!byPage.has(page)) byPage.set(page, new Set());
  byPage.get(page).add(enText);
}

function lookup(enText, locale) {
  const row = RUNS[enText];
  return (row && row[locale]) ? row[locale] : null;
}

/* Fill the Thai and Japanese slots of a five-language field from the table.
 * Returns a new object; never mutates the input. */
function fill(field) {
  const out = {};
  Object.keys(field).forEach(k => { out[k] = field[k]; });
  ['th', 'ja'].forEach(l => {
    if (out[l] === undefined || out[l] === '') {
      const mt = lookup(field.en, l);
      if (mt === null) { note(field.en); out[l] = field.en; }
      else out[l] = mt;
    }
  });
  return out;
}

module.exports = {
  tablePath: TABLE_PATH,
  runs: RUNS,
  lookup: lookup,
  fill: fill,
  note: note,
  missing: missing,
  byPage: byPage,
  setPage: setPage,
  getPage: getPage
};
