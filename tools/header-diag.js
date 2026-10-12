/* Measures the site header: does the nav push the language switcher and the
 * Google Translate button out of the container? Writes the numbers into a
 * fixed overlay so a headless screenshot reports them. */
'use strict';
const fs = require('fs');
const path = require('path');
const SITE = path.join(__dirname, '..');
const src = process.argv[2] || 'index.html';
const out = process.argv[3] || '_headdiag.html';

const SCRIPT = `
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var out = [];
    var inner = document.querySelector('.site-header .header-inner');
    var nav = document.querySelector('.nav-inline');
    var tools = document.querySelector('.header-tools');
    var langs = document.querySelector('.header-tools .lang-switch');
    var gt = document.querySelector('[data-translate-open]');
    var menu = document.querySelector('[data-drawer-open]');
    function box(name, el) {
      if (!el) { out.push('  ' + name + ': NOT RENDERED'); return; }
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el);
      out.push('  ' + name + ': x=' + Math.round(r.left) + '..' + Math.round(r.right) +
               ' w=' + Math.round(r.width) + ' display=' + cs.display + ' vis=' + cs.visibility);
    }
    out.push('viewport=' + window.innerWidth + '  docScrollW=' + document.documentElement.scrollWidth);
    if (inner) out.push('  .header-inner: clientW=' + inner.clientWidth + ' scrollW=' + inner.scrollWidth +
      (inner.scrollWidth > inner.clientWidth + 1 ? '   <-- OVERFLOWS by ' + (inner.scrollWidth - inner.clientWidth) : '   (fits)'));
    box('nav-inline', nav);
    box('header-tools', tools);
    box('lang-switch', langs);
    box('[data-translate-open]', gt);
    box('[data-drawer-open]', menu);
    if (gt) {
      var svg = gt.querySelector('svg');
      out.push('  globe svg: ' + (svg ? 'w=' + Math.round(svg.getBoundingClientRect().width) + ' h=' + Math.round(svg.getBoundingClientRect().height) : 'MISSING'));
    }
    var off = [];
    document.querySelectorAll('.header-inner *').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.right > window.innerWidth || r.left < 0) off.push(el.tagName + '.' + String(el.className || '').split(' ')[0]);
    });
    out.push('  header children outside viewport: ' + (off.length ? off.slice(0, 6).join(', ') : 'none'));
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:100%;background:#000;color:#0f0;font:11px/1.6 monospace;padding:8px;white-space:pre-wrap';
    d.textContent = out.join('\\n');
    document.body.appendChild(d);
  }, 400);
});
<\/script>
`;
fs.writeFileSync(path.join(SITE, out), fs.readFileSync(path.join(SITE, src), 'utf8').replace('</body>', SCRIPT + '</body>'));
console.log('wrote ' + out);
