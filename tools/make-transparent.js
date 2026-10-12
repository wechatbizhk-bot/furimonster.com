/* =========================================================================
 * tools/make-transparent.js — PNG background removal, zero dependencies.
 *
 * The FURI MONSTER character art supplied for this project is RGB with NO
 * alpha channel (PNG colour type 2), so every character sits on a solid
 * white card. Dropping those into the claw machine would put white boxes in
 * a dark cabinet.
 *
 * Why not "make every white pixel transparent": Boxo has a WHITE BELLY and
 * WHITE HORNS, Furi Prince has WHITE WINGS and white sneakers, Pinki has a
 * white pocket. A global white key would punch holes through the characters.
 * So the background is removed by flood-filling inward from the border only,
 * which can never reach an enclosed white area.
 *
 * Pipeline per image:
 *   1. decode PNG (colour type 2 or 6, 8-bit, non-interlaced)
 *   2. flood fill the background from the border, tolerating white
 *   3. a second pass eats the soft grey drop shadow (Boxo has one)
 *   4. anti-alias the cut edge so it does not look die-cut
 *   5. trim to the character's bounding box, then centre it on a square
 *      transparent canvas, so every character is framed consistently and the
 *      game can map one physics radius to one drawn size
 *   6. re-encode as RGBA PNG
 *
 * Usage:
 *   node tools/make-transparent.js <in.png> <out.png> [--white 200] [--sat 24]
 *                                  [--keep-shadow] [--no-square] [--pad 0.04]
 * ========================================================================= */
'use strict';

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ---------------- PNG decode ------------------------------------------- */

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  let off = 8, ihdr = null;
  const idat = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12]
      };
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  if (!ihdr) throw new Error('no IHDR');
  if (ihdr.depth !== 8) throw new Error('only 8-bit supported, got ' + ihdr.depth);
  if (ihdr.interlace !== 0) throw new Error('interlaced PNG not supported');

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[ihdr.colorType];
  if (!channels) throw new Error('unsupported colour type ' + ihdr.colorType);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width: w, height: h } = ihdr;
  const stride = w * channels;
  const out = Buffer.alloc(stride * h);

  /* un-filter scanlines */
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride);
    p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;         // left
      const b = prev ? prev[i] : 0;                            // above
      const c = prev && i >= channels ? prev[i - channels] : 0; // above-left
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      cur[i] = v & 255;
    }
  }

  /* normalise to RGBA */
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, j = 0; i < w * h; i++, j += channels) {
    const r = out[j];
    if (channels === 1) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = r; rgba[i * 4 + 3] = 255; }
    else if (channels === 2) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = r; rgba[i * 4 + 3] = out[j + 1]; }
    else { rgba[i * 4] = out[j]; rgba[i * 4 + 1] = out[j + 1]; rgba[i * 4 + 2] = out[j + 2]; rgba[i * 4 + 3] = channels === 4 ? out[j + 3] : 255; }
  }
  return { width: w, height: h, data: rgba };
}

function paeth(a, b, c) {
  const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/* ---------------- PNG encode (RGBA) ----------------------------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;                      // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------- background removal ---------------------------------- */

function removeBackground(img, opt) {
  const { width: w, height: h, data } = img;
  const bgMin = opt.white;       // a pixel this bright with low saturation is background
  const satMax = opt.sat;
  const greyMin = opt.greyMin;
  const greySat = opt.greySat;

  const isWhite = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mn >= bgMin && (mx - mn) <= satMax;
  };
  const isGrey = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return (mx - mn) <= greySat && mx <= bgMin && mx >= greyMin;
  };

  const removed = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qh = 0, qt = 0;

  /* A die-cut sticker has a white margin, then a soft drop shadow, then more
   * white, then the artwork's black outline. Flooding "white only" stops dead
   * at the shadow and leaves a white ring trapped inside it. So the flood is
   * allowed to pass through white OR shadow grey in one go — it still cannot
   * cross the near-black outline, which is the thing that actually bounds the
   * character. */
  const passable = opt.keepShadow ? isWhite : function (i) { return isWhite(i) || isGrey(i); };

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (removed[p]) return;
    if (!passable(p * 4)) return;
    removed[p] = 1;
    queue[qt++] = p;
  };

  /* Seed the flood.
   *
   * Two cases matter. If the image was split out of a sheet it already carries
   * transparent padding, and seeding only from the literal border would land
   * on fully transparent pixels and remove nothing at all — so anything
   * already transparent is treated as background and used as a seed. If the
   * image is opaque (the deck art), the border pixels themselves are the seed.
   * Both cases then expand through the same `passable` test. */
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] <= 16) { removed[p] = 1; queue[qt++] = p; }
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (qh < qt) {
    const p = queue[qh++];
    const x = p % w, y = (p / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  /* anti-alias: a kept pixel touching the cut gets alpha from how far it is
   * from the background white, so the silhouette does not look die-cut.
   * `--no-aa` skips this for source art that came through JPEG (the deck
   * images did), where a wide grey halo would otherwise read as a ghost. */
  if (!opt.noAA) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (removed[p]) { data[p * 4 + 3] = 0; continue; }
        let touches = false;
        if (x > 0 && removed[p - 1]) touches = true;
        else if (x < w - 1 && removed[p + 1]) touches = true;
        else if (y > 0 && removed[p - w]) touches = true;
        else if (y < h - 1 && removed[p + w]) touches = true;
        if (!touches) continue;
        const mn = Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
        if (mn > bgMin) {
          const a = (255 - mn) / Math.max(1, 255 - bgMin);
          data[p * 4 + 3] = Math.max(0, Math.min(255, Math.round(255 * a)));
        }
      }
    }
  } else {
    for (let p = 0; p < w * h; p++) if (removed[p]) data[p * 4 + 3] = 0;
  }

  return { width: w, height: h, data, removed };
}

/* ---------------- trim + centre on a square canvas -------------------- */

function trimAndSquare(img, padFrac) {
  const { width: w, height: h, data } = img;
  let minX = w, minY = h, maxX = -1, maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { width: w, height: h, data, box: null };

  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const side = Math.ceil(Math.max(cw, ch) * (1 + padFrac * 2));
  const out = Buffer.alloc(side * side * 4);
  const ox = Math.round((side - cw) / 2);
  const oy = Math.round((side - ch) / 2);

  for (let y = 0; y < ch; y++) {
    const src = ((minY + y) * w + minX) * 4;
    const dst = ((oy + y) * side + ox) * 4;
    data.copy(out, dst, src, src + cw * 4);
  }
  return { width: side, height: side, data: out, box: { w: cw, h: ch, minX, minY } };
}

function crop(img, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let j = 0; j < h; j++) {
    const src = ((y + j) * img.width + x) * 4;
    img.data.copy(out, j * w * 4, src, src + w * 4);
  }
  return { width: w, height: h, data: out };
}

/* ---------------- uniform-background removal --------------------------- *
 * The sticker sheet sits on an opaque flat dark grey. That is not white, so
 * the white/grey classifier will not touch it — and because the background is
 * connected, every sticker labels as a single component.
 *
 * This samples the actual background colour from the four corners and floods
 * in from the border with a colour-distance tolerance. A tolerance of ~40
 * removes the grey (about 46,46,46) and its anti-aliased skirt while leaving
 * the near-black outline (2,2,2), which is ~76 away, fully intact.
 * ---------------------------------------------------------------------- */
function removeUniformBg(img, dist) {
  const { width: w, height: h, data } = img;
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  let br = 0, bg = 0, bb = 0;
  corners.forEach(function (c) {
    const i = (c[1] * w + c[0]) * 4;
    br += data[i]; bg += data[i + 1]; bb += data[i + 2];
  });
  br /= 4; bg /= 4; bb /= 4;

  function distAt(i) {
    const dr = data[i] - br, dg = data[i + 1] - bg, db = data[i + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  const core = dist * 0.55;
  const removed = new Uint8Array(w * h);
  const q = new Int32Array(w * h);
  let qh = 0, qt = 0;

  function push(x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (removed[p] || distAt(p * 4) > core) return;
    removed[p] = 1;
    q[qt++] = p;
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (qh < qt) {
    const p = q[qh++];
    const x = p % w, y = (p / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (removed[p]) { data[p * 4 + 3] = 0; continue; }
      let touches = false;
      if (x > 0 && removed[p - 1]) touches = true;
      else if (x < w - 1 && removed[p + 1]) touches = true;
      else if (y > 0 && removed[p - w]) touches = true;
      else if (y < h - 1 && removed[p + w]) touches = true;
      if (!touches) continue;
      const d = distAt(p * 4);
      const a = Math.max(0, Math.min(1, (d - core) / (dist * 0.65)));
      data[p * 4 + 3] = Math.round(255 * a);
    }
  }
  return { width: w, height: h, data, removed, bg: [br, bg, bb] };
}

/* ---------------- connected-component splitting ----------------------- *
 * The supplied sticker sheet has all six characters already isolated on
 * transparency, so the cleanest way to get one file per character is to label
 * the alpha channel rather than guess crop boxes. Components are returned in
 * reading order (top-to-bottom, then left-to-right) so the output numbering is
 * stable and predictable.
 * ---------------------------------------------------------------------- */
function splitComponents(img, minArea) {
  const { width: w, height: h, data } = img;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const comps = [];

  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start * 4 + 3] <= 16) continue;
    let sp = 0;
    stack[sp++] = start;
    seen[start] = 1;

    let minX = w, minY = h, maxX = -1, maxY = -1, area = 0;
    while (sp > 0) {
      const p = stack[--sp];
      const x = p % w, y = (p / w) | 0;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      /* 8-connectivity: the sticker outline is joined at diagonals */
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (seen[np] || data[np * 4 + 3] <= 16) continue;
          seen[np] = 1;
          stack[sp++] = np;
        }
      }
    }
    if (area >= minArea) comps.push({ minX, minY, maxX, maxY, area, w: maxX - minX + 1, h: maxY - minY + 1 });
  }

  /* reading order: bucket into rows, then sort each row left to right */
  const rowTol = Math.max(8, Math.round(h * 0.06));
  comps.sort((a, b) => (a.minY - b.minY));
  const rows = [];
  comps.forEach(c => {
    const row = rows.find(r => Math.abs(r.y - c.minY) <= rowTol);
    if (row) { row.items.push(c); } else { rows.push({ y: c.minY, items: [c] }); }
  });
  rows.forEach(r => r.items.sort((a, b) => a.minX - b.minX));
  return rows.reduce((acc, r) => acc.concat(r.items), []);
}

/* ---------------- main ------------------------------------------------- */

function run(inFile, outFile, opt) {
  const src = fs.readFileSync(inFile);
  let img = decodePng(src);
  const orig = { w: img.width, h: img.height };
  if (opt.crop) {
    const [x, y, w, h] = opt.crop;
    img = crop(img, x, y, w, h);
  }
  img = removeBackground(img, opt);

  if (opt.square) {
    const r = trimAndSquare(img, opt.pad);
    img = { width: r.width, height: r.height, data: r.data };
    if (r.box) opt._box = r.box;
  }

  const png = encodePng(img.width, img.height, img.data);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, png);
  return { orig, out: { w: img.width, h: img.height }, bytes: png.length };
}

function parseArgs(argv) {
  const opt = {
    /* `greyMin` is deliberately low: the drop shadow under the supplied art is
     * a soft grey ramp, and its darker core sits well below 110. It is safe to
     * go low because the house outline is near-black (#020202), so a genuine
     * drawn line can never be mistaken for shadow. */
    white: 200, sat: 24, greyMin: 55, greySat: 30,
    keepShadow: false, square: true, pad: 0.04, _box: null,
    split: false, minArea: 400, names: null, bgDist: 40
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--white') opt.white = +argv[++i];
    else if (a === '--sat') opt.sat = +argv[++i];
    else if (a === '--grey-min') opt.greyMin = +argv[++i];
    else if (a === '--grey-sat') opt.greySat = +argv[++i];
    else if (a === '--pad') opt.pad = +argv[++i];
    else if (a === '--crop') opt.crop = argv[++i].split(',').map(Number);
    else if (a === '--split') opt.split = true;
    else if (a === '--min-area') opt.minArea = +argv[++i];
    else if (a === '--names') opt.names = argv[++i].split(',');
    else if (a === '--bg-dist') opt.bgDist = +argv[++i];
    else if (a === '--keep-shadow') opt.keepShadow = true;
    else if (a === '--no-aa') opt.noAA = true;
    else if (a === '--no-square') opt.square = false;
    else positional.push(a);
  }
  return { opt, positional };
}

module.exports = { decodePng, encodePng, removeBackground, trimAndSquare, run };

if (require.main === module) {
  const { opt, positional } = parseArgs(process.argv.slice(2));

  /* --split <sheet.png> <outDir> [--names a,b,c] : one file per component */
  if (opt.split) {
    const [inFile, outDir] = positional;
    if (!inFile || !outDir) {
      console.error('usage: node tools/make-transparent.js --split <sheet.png> <outDir> [--pad 0.04] [--names a,b,c]');
      process.exit(2);
    }
    try {
      let img = decodePng(fs.readFileSync(inFile));
      /* only strip a background if the sheet actually has one */
      const opaque = img.data[3] > 250 && img.data[(img.width * img.height - 1) * 4 + 3] > 250;
      if (opaque) img = removeUniformBg(img, opt.bgDist);

      const comps = splitComponents(img, opt.minArea);
      if (!comps.length) { console.error('no components found'); process.exit(1); }
      fs.mkdirSync(outDir, { recursive: true });

      comps.forEach((c, i) => {
        let piece = crop(img, c.minX, c.minY, c.w, c.h);
        if (opt.square) piece = trimAndSquare(piece, opt.pad);
        const name = (opt.names && opt.names[i]) ? opt.names[i] : String(i + 1).padStart(2, '0');
        const out = path.join(outDir, name + '.png');
        fs.writeFileSync(out, encodePng(piece.width, piece.height, piece.data));
        console.log(`  ${name}.png  src ${c.w}x${c.h} @${c.minX},${c.minY}  → ${piece.width}x${piece.height}`);
      });
      console.log(`${comps.length} components from ${path.basename(inFile)}`);
    } catch (e) {
      console.error('SPLIT FAILED: ' + e.message);
      process.exit(1);
    }
    return;
  }

  if (positional.length < 2) {
    console.error('usage: node tools/make-transparent.js <in.png> <out.png> [options]');
    process.exit(2);
  }
  const [inFile, outFile] = positional;
  try {
    const r = run(inFile, outFile, opt);
    const box = opt._box ? ` content ${opt._box.w}x${opt._box.h}` : '';
    console.log(`${path.basename(outFile)}  ${r.orig.w}x${r.orig.h} → ${r.out.w}x${r.out.h}${box}  ${(r.bytes / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.error('FAILED ' + inFile + ': ' + e.message);
    process.exit(1);
  }
}
