/* Injects a measurement overlay into a built page so a headless screenshot
 * reports the real layout widths. Used to diagnose horizontal overflow. */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const src = process.argv[2] || 'index.html';
const outName = process.argv[3] || '_diag.html';

const html = fs.readFileSync(path.join(SITE, src), 'utf8');

const SCRIPT = `
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var out = [];
    out.push('innerWidth=' + window.innerWidth + '  docScrollW=' + document.documentElement.scrollWidth +
             '  bodyScrollW=' + document.body.scrollWidth);
    var sels = ['.site-header .header-inner', '#main', '.hero', '.hero-inner', '.hero-tagline',
                '.hero-position', '.btn-row', '.hero-strip', '.hero-strip a', '.section', '.wrap'];
    sels.forEach(function (s) {
      var el = document.querySelector(s);
      if (el) out.push('  ' + s + ' w=' + Math.round(el.getBoundingClientRect().width));
    });
    var wmax = 0, worst = null;
    document.querySelectorAll('body *').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.right > wmax) { wmax = r.right; worst = el; }
    });
    out.push('widest right=' + Math.round(wmax) + '  <- ' + (worst ? worst.tagName + '.' +
      String(worst.className || '').split(' ').slice(0, 3).join('.') : 'none'));
    /* list every element that sticks out past the viewport */
    var over = [];
    document.querySelectorAll('body *').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 && r.width > 4) {
        over.push(el.tagName + '.' + String(el.className || '').split(' ').slice(0, 2).join('.') +
                  ' w=' + Math.round(r.width) + ' right=' + Math.round(r.right));
      }
    });
    out.push('overflowing elements: ' + over.length);
    over.slice(0, 12).forEach(function (s) { out.push('  ' + s); });
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:100%;background:#000;' +
      'color:#0f0;font:10px/1.5 monospace;padding:8px;white-space:pre-wrap;word-break:break-all';
    d.textContent = out.join('\\n');
    document.body.appendChild(d);
  }, 350);
});
<\/script>
`;

const patched = html.replace('</body>', SCRIPT + '</body>');
fs.writeFileSync(path.join(SITE, outName), patched);
console.log('wrote ' + outName + ' (' + patched.length + ' bytes)');
