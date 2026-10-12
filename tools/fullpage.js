/* tools/fullpage.js — writes a copy of a built page with the full-viewport
 * hero and the scroll-reveal animation disabled, so a single tall headless
 * screenshot captures the entire page. Diagnostic only; the copy is written
 * next to the build and skipped by tools/check.js (leading underscore). */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const src = process.argv[2] || 'index.html';
const out = process.argv[3] || '_fullpage.html';

const html = fs.readFileSync(path.join(SITE, src), 'utf8');
const inject = `
<style>
  /* diagnostic: show the whole page in one screenshot */
  .hero { min-height: auto !important; padding-top: 150px !important; padding-bottom: 40px !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  .reveal.is-in { transition: none !important; }
  html { scroll-behavior: auto !important; }
</style>
`;
fs.writeFileSync(path.join(SITE, out), html.replace('</head>', inject + '</head>'));
console.log('wrote ' + out);
