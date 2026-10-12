/* =========================================================================
 * tools/build-art.js — generate every raster derivative the website needs,
 * from the supplied FURI MONSTER character art.
 *
 * The site must show the real IP, so nothing is redrawn. This turns the six
 * canonical sprites (assets/img/ip/*.png) into:
 *
 *   assets/img/ip-line/<slug>.png            colouring pages (real outline art)
 *   assets/img/wallpaper/<slug>-phone.png    1080x1920
 *   assets/img/wallpaper/<slug>-desktop.png  1920x1080
 *   assets/img/og/<slug>.png                 1200x630 Open Graph cards
 *   assets/img/og/default.png                1200x630 site fallback
 *
 * Open Graph cards are PNG rather than SVG on purpose: social scrapers do not
 * render SVG, and an SVG that references an external image renders as nothing
 * at all. The card is composited here instead of at runtime for the same
 * reason a build step exists.
 *
 *   node tools/build-art.js
 * ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const P = require('./png-compose.js');

const SITE = path.join(__dirname, '..');
const IP = path.join(SITE, 'assets', 'img', 'ip');
const OUT_LINE = path.join(SITE, 'assets', 'img', 'ip-line');
const OUT_WALL = path.join(SITE, 'assets', 'img', 'wallpaper');
const OUT_OG = path.join(SITE, 'assets', 'img', 'og');

/* keep in step with assets/js/data.js themes */
const THEMES = {
  'furi-prince': { base: [254, 200, 42], glow: [255, 232, 128], name: 'FURI PRINCE', symbol: 'MEMORY' },
  'pinki': { base: [243, 137, 160], glow: [255, 107, 212], name: 'PINKI', symbol: 'HEARTBEAT' },
  'winggo': { base: [115, 255, 199], glow: [163, 255, 97], name: 'WINGGO', symbol: 'LIGHT OF NATURE' },
  'fluffu': { base: [170, 211, 135], glow: [163, 255, 97], name: 'FLUFFU', symbol: 'SEED' },
  'boxo': { base: [245, 166, 97], glow: [255, 138, 76], name: 'BOXO', symbol: 'MATERIAL CYCLE' },
  'bubi': { base: [106, 201, 205], glow: [85, 200, 240], name: 'BUBI', symbol: 'WATER & EMOTION' }
};

const ORDER = ['furi-prince', 'pinki', 'winggo', 'fluffu', 'boxo', 'bubi'];

const INK = [5, 6, 11];
const PAPER = [253, 254, 253];

function read(slug) {
  return P.decodePng(fs.readFileSync(path.join(IP, slug + '.png')));
}

function write(dir, name, img) {
  fs.mkdirSync(dir, { recursive: true });
  const buf = P.encodePng(img.width, img.height, img.data);
  fs.writeFileSync(path.join(dir, name), buf);
  return buf.length;
}

/* fit an image into a box, preserving aspect */
function fit(img, maxW, maxH) {
  const r = Math.min(maxW / img.width, maxH / img.height);
  return P.scale(img, Math.max(1, Math.round(img.width * r)), Math.max(1, Math.round(img.height * r)));
}

/* The cosmic card the site uses: near-black ground, a wide accent bloom behind
 * the character, a tighter glow core, and the name in the lower third. */
function card(slug, w, h, opts) {
  opts = opts || {};
  const t = THEMES[slug] || THEMES['furi-prince'];
  const img = P.vgradient(w, h, [8, 10, 18], INK);
  P.glow(img, w / 2, h * (opts.glowY || 0.42), w * 0.46, t.base, 0.20);
  P.glow(img, w / 2, h * (opts.glowY || 0.42), w * 0.28, t.glow, 0.16);
  if (opts.scatter) scatter(img, slug, t);
  return img;
}

/* a few deterministic dots so the field is not a flat wash */
function scatter(img, slug, t) {
  let seed = 2166136261;
  for (let i = 0; i < slug.length; i++) { seed ^= slug.charCodeAt(i); seed = Math.imul(seed, 16777619); }
  const rnd = () => {
    seed += 0x6D2B79F5;
    let x = seed;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const n = 90;
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd() * img.width);
    const y = Math.floor(rnd() * img.height);
    const rad = 1 + rnd() * 2.2;
    const a = 0.10 + rnd() * 0.38;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = x + dx, py = y + dy;
        if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > rad) continue;
        const al = a * (1 - d / (rad + 0.001));
        const i = (py * img.width + px) * 4;
        const da = img.data[i + 3] / 255;
        const oa = al + da * (1 - al);
        for (let c = 0; c < 3; c++) {
          img.data[i + c] = Math.round((PAPER[c] * al + img.data[i + c] * da * (1 - al)) / (oa || 1));
        }
        img.data[i + 3] = Math.round(oa * 255);
      }
    }
  }
}

/* a 5x7 pixel font, big enough for a legible OG title without a font file */
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '11110', '10001', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '11110', '10000', '10000', '10000', '11111'],
  F: ['11111', '10000', '11110', '10000', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '11111', '10001', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '11100', '10010', '10010', '10001', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10011', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '01110', '00001', '00001', '10001', '01110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '™': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

function text(img, str, x, y, px, colour) {
  let cx = x;
  for (const chRaw of String(str).toUpperCase()) {
    const g = GLYPHS[chRaw] || (chRaw === '-' ? GLYPHS['.'] : null);
    if (g) {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (g[row][col] !== '1') continue;
          for (let sy = 0; sy < px; sy++) {
            for (let sx = 0; sx < px; sx++) {
              const tx = cx + col * px + sx, ty = y + row * px + sy;
              if (tx < 0 || ty < 0 || tx >= img.width || ty >= img.height) continue;
              const i = (ty * img.width + tx) * 4;
              img.data[i] = colour[0]; img.data[i + 1] = colour[1];
              img.data[i + 2] = colour[2]; img.data[i + 3] = 255;
            }
          }
        }
      }
    }
    cx += 6 * px;
  }
  return cx;
}

function textWidth(str, px) { return String(str).length * 6 * px; }

/* ---- outputs ----------------------------------------------------------- */
const report = [];

ORDER.forEach(slug => {
  const t = THEMES[slug];
  const src = read(slug);

  /* 1. colouring page */
  const line = P.lineArt(src);
  report.push(['ip-line/' + slug + '.png', write(OUT_LINE, slug + '.png', line)]);

  /* 2. wallpapers */
  const phoneW = 1080, phoneH = 1920;
  const phone = card(slug, phoneW, phoneH, { glowY: 0.40, scatter: true });
  const fitted = fit(src, Math.round(phoneW * 0.72), Math.round(phoneH * 0.42));
  P.over(phone, fitted, Math.round((phoneW - fitted.width) / 2), Math.round(phoneH * 0.20));
  let ty = Math.round(phoneH * 0.72);
  text(phone, t.name, Math.round((phoneW - textWidth(t.name, 9)) / 2), ty, 9, PAPER);
  text(phone, t.symbol, Math.round((phoneW - textWidth(t.symbol, 4)) / 2), ty + 90, 4, t.base);
  text(phone, 'FURI MONSTER', Math.round((phoneW - textWidth('FURI MONSTER', 3)) / 2), ty + 170, 3, [138, 144, 166]);
  report.push(['wallpaper/' + slug + '-phone.png', write(OUT_WALL, slug + '-phone.png', phone)]);

  const dW = 1920, dH = 1080;
  const desk = card(slug, dW, dH, { glowY: 0.44, scatter: true });
  const fd = fit(src, Math.round(dW * 0.34), Math.round(dH * 0.74));
  P.over(desk, fd, Math.round(dW * 0.10), Math.round(dH * 0.13));
  text(desk, t.name, Math.round(dW * 0.55), Math.round(dH * 0.40), 13, PAPER);
  text(desk, t.symbol, Math.round(dW * 0.55), Math.round(dH * 0.40) + 130, 5, t.base);
  text(desk, 'FURI MONSTER', Math.round(dW * 0.55), Math.round(dH * 0.40) + 215, 4, [138, 144, 166]);
  report.push(['wallpaper/' + slug + '-desktop.png', write(OUT_WALL, slug + '-desktop.png', desk)]);

  /* 3. Open Graph card, 1200x630 */
  const oW = 1200, oH = 630;
  const og = card(slug, oW, oH, { glowY: 0.46, scatter: false });
  const fo = fit(src, Math.round(oW * 0.32), Math.round(oH * 0.82));
  P.over(og, fo, Math.round(oW * 0.06), Math.round((oH - fo.height) / 2));
  text(og, t.name, Math.round(oW * 0.44), Math.round(oH * 0.34), 11, PAPER);
  text(og, t.symbol, Math.round(oW * 0.44), Math.round(oH * 0.34) + 115, 4, t.base);
  text(og, 'FURI MONSTER', Math.round(oW * 0.44), Math.round(oH * 0.34) + 190, 3, [138, 144, 166]);
  report.push(['og/' + slug + '.png', write(OUT_OG, slug + '.png', og)]);
});

/* 4. the site default OG card: the six together */
(function () {
  const w = 1200, h = 630;
  const img = P.vgradient(w, h, [10, 12, 20], INK);
  P.glow(img, w / 2, h * 0.5, w * 0.5, [254, 200, 42], 0.16);
  P.glow(img, w * 0.25, h * 0.5, w * 0.3, [106, 201, 205], 0.12);
  P.glow(img, w * 0.75, h * 0.5, w * 0.3, [196, 145, 255], 0.12);
  const each = Math.floor(w / 6);
  ORDER.forEach((slug, i) => {
    const s = read(slug);
    const f = fit(s, Math.round(each * 0.78), Math.round(h * 0.42));
    P.over(img, f, Math.round(i * each + (each - f.width) / 2), Math.round(h * 0.16));
  });
  text(img, 'FURI MONSTER', Math.round((w - textWidth('FURI MONSTER', 10)) / 2), Math.round(h * 0.66), 10, PAPER);
  text(img, 'ANGER CAN DESTROY A WORLD, OR BECOME THE POWER THAT PROTECTS ONE',
    Math.round((w - textWidth('ANGER CAN DESTROY A WORLD, OR BECOME THE POWER THAT PROTECTS ONE', 2)) / 2),
    Math.round(h * 0.80), 2, [154, 162, 184]);
  report.push(['og/default.png', write(OUT_OG, 'default.png', img)]);
})();

report.forEach(([name, bytes]) => console.log('  ' + name.padEnd(34) + (bytes / 1024).toFixed(1) + ' KB'));
console.log(report.length + ' raster derivatives written from the supplied IP art');
