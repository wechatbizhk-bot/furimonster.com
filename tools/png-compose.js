/* =========================================================================
 * tools/png-compose.js — a tiny RGBA image pipeline on top of the PNG codec
 * already in make-transparent.js. Zero dependencies; Node's zlib does the
 * compression.
 *
 * This exists because the website must show the SUPPLIED IP ART, not a redraw.
 * That means the site needs real raster derivatives — colouring pages,
 * wallpapers and Open Graph cards — and there is no image library available
 * here. So: bilinear scaling, alpha compositing, a luminance-to-line-art
 * transform, and a cosmic background painted per pixel.
 * ========================================================================= */
'use strict';

const { decodePng, encodePng } = require('./make-transparent.js');

function blank(w, h, rgba) {
  const d = Buffer.alloc(w * h * 4);
  const c = rgba || [0, 0, 0, 0];
  for (let i = 0; i < w * h; i++) {
    d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = c[3];
  }
  return { width: w, height: h, data: d };
}

/* bilinear resize of an RGBA image */
function scale(img, nw, nh) {
  const { width: w, height: h, data } = img;
  const out = Buffer.alloc(nw * nh * 4);
  const xr = w / nw, yr = h / nh;
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(h - 1, Math.max(0, (y + 0.5) * yr - 0.5));
    const y0 = Math.floor(sy), y1 = Math.min(h - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(w - 1, Math.max(0, (x + 0.5) * xr - 0.5));
      const x0 = Math.floor(sx), x1 = Math.min(w - 1, x0 + 1), fx = sx - x0;
      const o = (y * nw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = data[(y0 * w + x0) * 4 + c], p10 = data[(y0 * w + x1) * 4 + c];
        const p01 = data[(y1 * w + x0) * 4 + c], p11 = data[(y1 * w + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bot = p01 + (p11 - p01) * fx;
        out[o + c] = Math.round(top + (bot - top) * fy);
      }
    }
  }
  return { width: nw, height: nh, data: out };
}

/* source-over alpha composite of `src` onto `dst` at (dx,dy) */
function over(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width) continue;
      const s = (y * src.width + x) * 4, d = (ty * dst.width + tx) * 4;
      const sa = src.data[s + 3] / 255;
      if (sa <= 0) continue;
      const da = dst.data[d + 3] / 255;
      const oa = sa + da * (1 - sa);
      if (oa <= 0) { dst.data[d + 3] = 0; continue; }
      for (let c = 0; c < 3; c++) {
        dst.data[d + c] = Math.round((src.data[s + c] * sa + dst.data[d + c] * da * (1 - sa)) / oa);
      }
      dst.data[d + 3] = Math.round(oa * 255);
    }
  }
  return dst;
}

/* radial glow: add `colour` with alpha falling off from the centre */
function glow(img, cx, cy, radius, colour, strength) {
  const { width: w, height: h, data } = img;
  const r2 = radius * radius;
  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const t = 1 - Math.sqrt(d2 / r2);
      const a = Math.pow(t, 1.8) * strength;
      if (a <= 0.001) continue;
      const i = (y * w + x) * 4;
      const da = data[i + 3] / 255;
      const oa = a + da * (1 - a);
      for (let c = 0; c < 3; c++) {
        data[i + c] = Math.round((colour[c] * a + data[i + c] * da * (1 - a)) / (oa || 1));
      }
      data[i + 3] = Math.round(oa * 255);
    }
  }
  return img;
}

/* vertical two-colour gradient background */
function vgradient(w, h, top, bottom) {
  const img = blank(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / Math.max(1, h - 1);
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  return img;
}

/* Line art for the colouring pages: alpha follows darkness, colour is dropped
 * to the house ink. The character's own near-black outline survives at full
 * strength while every flat fill goes transparent — which is exactly the
 * colouring page, produced from the real artwork rather than a redraw. */
function lineArt(img) {
  const out = Buffer.alloc(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3];
    if (a === 0) { out[i * 4 + 3] = 0; continue; }
    const r = img.data[i * 4], g = img.data[i * 4 + 1], b = img.data[i * 4 + 2];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    /* ink strength: 1 at pure black, 0 at mid grey and lighter */
    let t = (0.55 - lum) / 0.45;
    t = Math.max(0, Math.min(1, t));
    const alpha = Math.round(255 * Math.pow(t, 1.35) * (a / 255));
    out[i * 4] = 2; out[i * 4 + 1] = 2; out[i * 4 + 2] = 2;
    out[i * 4 + 3] = alpha;
  }
  return { width: img.width, height: img.height, data: out };
}

module.exports = { decodePng, encodePng, blank, scale, over, glow, vgradient, lineArt };
