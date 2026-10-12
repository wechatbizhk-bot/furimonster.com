/* Merge the translated comic scripts into one site data module.
 *
 * Inputs:
 *   _extract/comics/src/<slug>.json      Simplified Chinese source (structure)
 *   _extract/comics/xx/labels.json       the 58 tag labels + 11 speaker names
 *   _extract/comics/xx/<slug>-<n>.json   translated stories (en/zh-Hant/th/ja)
 *
 * Output:
 *   furimonster.com/assets/js/data-comics.js    ->  FM.comics = { ... }
 *
 * The source file is the structural authority: ids, panel counts, `who` keys
 * and `tags` are taken from it, and every translated field is checked against
 * it, so a bad translation file fails the build instead of shipping.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const DIR = path.join(__dirname, '..', '..', '_extract', 'comics');
const SRC = path.join(DIR, 'src');
const XX = path.join(DIR, 'xx');

const SLUGS = ['furi-prince', 'pinki', 'winggo', 'fluffu', 'boxo', 'bubi'];
const LANGS = ['en', 'zh-Hant', 'zh-Hans', 'th', 'ja'];
/* Panels where zh-Hans deliberately deviates from the source DOCUMENT.
 *
 * bubi-20's final panel swallowed the source document's own 120-story index
 * appendix — a markdown table of every story with totals and a copyright line.
 * That is document furniture, not comic content, so it is cut from all five
 * languages including zh-Hans. Everything else keeps zh-Hans byte-exact, and
 * this list is the only permitted exception. */
const HANS_EXCEPTIONS = { 'bubi-20': [3] };

function hansAllowed(id, j) {
  return !!(HANS_EXCEPTIONS[id] && HANS_EXCEPTIONS[id].indexOf(j) !== -1);
}

const problems = [];
const stripped = [];

/* Cut document furniture that leaked into a scene string.
 *
 * bubi-20's final panel swallowed the source document's own 120-story index
 * appendix — a markdown table of every story with totals and a copyright line.
 * The HANS_EXCEPTIONS note below has always said that appendix "is cut from all
 * five languages", but nothing ever cut it: only the zh-Hans source was clean,
 * and the English value shipped with the whole table appended, which is how
 * "### Appendix: Master index of the 120 four-panel comics" ended up printed
 * inside the last panel of stories/bubi-20.html.
 *
 * It is cut here, at generation time, so a regeneration cannot reintroduce it
 * and the data file is never the only thing standing between this and the page.
 */
const DOC_FURNITURE = /\s*#{1,6}\s*Appendix\b[\s\S]*$/;

function stripDocFurniture(s, where) {
  if (typeof s !== 'string') return s;
  const m = s.match(DOC_FURNITURE);
  if (!m) return s;
  stripped.push(where + ': removed a trailing "Appendix" block (' + m[0].trim().length + ' chars)');
  return s.slice(0, m.index).trim();
}

function readJson(p, what) {
  if (!fs.existsSync(p)) { problems.push('missing ' + what + ': ' + p); return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { problems.push('invalid JSON in ' + what + ': ' + e.message); return null; }
}

const labels = readJson(path.join(XX, 'labels.json'), 'labels.json');
if (labels) {
  for (const k of Object.keys(labels.tags)) {
    for (const l of ['en', 'zh-Hant', 'th', 'ja']) if (!labels.tags[k][l]) problems.push('tag "' + k + '" missing ' + l);
  }
  for (const k of Object.keys(labels.speakers)) {
    for (const l of ['en', 'zh-Hant', 'th', 'ja']) if (!labels.speakers[k][l]) problems.push('speaker "' + k + '" missing ' + l);
  }
}

const stories = [];
let panelCount = 0, lineCount = 0;

for (const slug of SLUGS) {
  const src = readJson(path.join(SRC, slug + '.json'), 'src/' + slug + '.json');
  if (!src) continue;

  /* translated halves, in order */
  let translated = [];
  for (const n of [1, 2]) {
    const part = readJson(path.join(XX, slug + '-' + n + '.json'), 'xx/' + slug + '-' + n + '.json');
    if (part) translated = translated.concat(part);
  }
  if (translated.length !== src.length) {
    problems.push(slug + ': source has ' + src.length + ' stories but translations have ' + translated.length);
    continue;
  }

  src.forEach((s, i) => {
    const t = translated[i];
    if (!t) { problems.push(slug + '[' + i + ']: no translation'); return; }
    if (t.id !== s.id) problems.push(s.id + ': translated id is ' + t.id);
    if (t.character !== s.character) problems.push(s.id + ': character changed');
    if (JSON.stringify(t.tags) !== JSON.stringify(s.tags)) problems.push(s.id + ': tags changed');
    if (t.panels.length !== s.panels.length) problems.push(s.id + ': panel count ' + t.panels.length + ' vs ' + s.panels.length);

    for (const l of LANGS) if (!t.title || typeof t.title[l] !== 'string') problems.push(s.id + ': title missing ' + l);
    if (t.title && t.title['zh-Hans'] !== s.title) problems.push(s.id + ': title zh-Hans differs from source');

    const panels = s.panels.map((sp, j) => {
      const tp = t.panels[j] || {};
      /* before anything is compared or copied: drop document furniture, so the
       * zh-Hans equality check below is made against the cleaned strings */
      sp.scene = stripDocFurniture(sp.scene, s.id + ' p' + (j + 1) + ' src');
      if (tp.scene) {
        LANGS.forEach(l => { tp.scene[l] = stripDocFurniture(tp.scene[l], s.id + ' p' + (j + 1) + ' ' + l); });
      }
      if (!tp.scene) problems.push(s.id + ' panel ' + j + ': no scene');
      for (const l of LANGS) if (!tp.scene || typeof tp.scene[l] !== 'string') problems.push(s.id + ' p' + j + ': scene missing ' + l);
      if (tp.scene && tp.scene['zh-Hans'] !== sp.scene && !hansAllowed(s.id, j)) problems.push(s.id + ' p' + j + ': scene zh-Hans differs');

      const dialogue = sp.dialogue.map((sd, k) => {
        const td = (tp.dialogue || [])[k] || {};
        if (td.who !== sd.who) problems.push(s.id + ' p' + j + ' d' + k + ': who changed (' + td.who + ' vs ' + sd.who + ')');
        for (const l of LANGS) {
          if (!td.text || typeof td.text[l] !== 'string') problems.push(s.id + ' p' + j + ' d' + k + ': text missing ' + l);
          if (!td.stage || typeof td.stage[l] !== 'string') problems.push(s.id + ' p' + j + ' d' + k + ': stage missing ' + l);
        }
        if (td.text && td.text['zh-Hans'] !== sd.text) problems.push(s.id + ' p' + j + ' d' + k + ': text zh-Hans differs');
        lineCount++;
        return { who: sd.who, stage: td.stage, text: td.text };
      });

      panelCount++;
      return { n: sp.n, scene: tp.scene, dialogue: dialogue };
    });

    stories.push({
      id: s.id,
      character: s.character,
      index: stories.filter(x => x.character === s.character).length + 1,
      tags: s.tags,
      title: t.title,
      panels: panels
    });
  });
}

/* ---- write the module -------------------------------------------------- */
const banner = '/* =========================================================================\n' +
  ' * assets/js/data-comics.js — the four-panel comic library, GENERATED.\n' +
  ' *\n' +
  ' * Built by tools/build-comics-data.js from the 120-panel source document.\n' +
  ' * Do not edit by hand: edit the source in _extract/comics/ and regenerate.\n' +
  ' *\n' +
  ' * ' + stories.length + ' stories, ' + panelCount + ' panels, ' + lineCount + ' dialogue lines,\n' +
  ' * each string in five languages. The comic text is machine translated and\n' +
  ' * the site labels it as such, because the five authored site languages do\n' +
  ' * not cover this content.\n' +
  ' * ========================================================================= */\n';

const body = '(function (root) {\n' +
  '  \'use strict\';\n' +
  '  var DATA = ' + JSON.stringify({
    tagLabels: labels ? labels.tags : {},
    speakerLabels: labels ? labels.speakers : {},
    stories: stories
  }) + ';\n' +
  '  DATA.byId = function (id) {\n' +
  '    for (var i = 0; i < DATA.stories.length; i++) if (DATA.stories[i].id === id) return DATA.stories[i];\n' +
  '    return null;\n' +
  '  };\n' +
  '  DATA.forCharacter = function (slug) {\n' +
  '    return DATA.stories.filter(function (s) { return s.character === slug; });\n' +
  '  };\n' +
  '  DATA.tagCounts = function () {\n' +
  '    var c = {};\n' +
  '    DATA.stories.forEach(function (s) { s.tags.forEach(function (t) { c[t] = (c[t] || 0) + 1; }); });\n' +
  '    return c;\n' +
  '  };\n' +
  '  root.FM = root.FM || {};\n' +
  '  root.FM.comics = DATA;\n' +
  '  if (typeof module !== \'undefined\' && module.exports) module.exports = DATA;\n' +
  '})(typeof globalThis !== \'undefined\' ? globalThis : this);\n';

fs.writeFileSync(path.join(SITE, 'assets', 'js', 'data-comics.js'), banner + body);

console.log('stories merged : ' + stories.length);
console.log('panels         : ' + panelCount);
console.log('dialogue lines : ' + lineCount);
console.log('languages      : ' + LANGS.join(', '));
console.log('written        : assets/js/data-comics.js');
if (stripped.length) {
  console.log('');
  console.log('document furniture removed (' + stripped.length + '):');
  stripped.forEach(s => console.log('  · ' + s));
}
if (problems.length) {
  console.log('');
  console.log(problems.length + ' PROBLEM(S):');
  problems.slice(0, 40).forEach(p => console.log('  ✗ ' + p));
  if (problems.length > 40) console.log('  … and ' + (problems.length - 40) + ' more');
  process.exit(1);
}
console.log('integrity      : OK — structure, ids, tags, counts and zh-Hans all match the source');
