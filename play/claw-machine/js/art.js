'use strict';
/* =========================================================================
 * js/art.js — the FURI MONSTER toy line, drawn from code.
 *
 * The house style, taken straight off the reference sheet:
 *
 *   · a heavy, uniform black outline on every shape — nothing has a soft edge
 *   · flat fills, no gradients and no shading
 *   · a wobbly, hand-drawn silhouette rather than a clean ellipse
 *   · little "3"-shaped fur squiggles scattered inside the body
 *   · plain white horns, wings and belly patches
 *   · big cartoon eyes and one simple mouth
 *
 * Colour comes from the prize palette, which the colourways in
 * js/catalogue.js rewrite, so 42 monsters become 252 distinct toys.  The grey
 * ink never changes: it is what makes them all look like the same product.
 *
 * Every shape is authored in a local space where one unit is the prize's
 * physics radius, so a monster is drawn exactly as big as the sphere the
 * physics thinks it is.  The same function therefore serves a 26-pixel
 * collection-grid icon and a 300-pixel toy hanging off the claw.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var TAU = Math.PI * 2;

  /* ---- the brand --------------------------------------------------------- */
  var INK = '#020202';          // the outline.  Sampled from furimonster.ai
  var OUT = 0.072;              // outline weight, in local units
  var THIN = 0.040;
  var BRAND = {
    teal: '#6AC9CD', pink: '#F389A0', green: '#AAD387',
    purple: '#C099C6', gold: '#FEC82A', deep: '#FEC308',
    white: '#FDFEFD', ink: INK,
    neonPink: '#FF6BD4', neonMint: '#73FFC7', neonLilac: '#C491FF', neonLime: '#A3FF61'
  };

  /* ---------------- colour helpers --------------------------------------- */

  function hex2rgb(h) {
    h = String(h || '#888888').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) return { r: 136, g: 136, b: 136 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgb2hex(r, g, b) {
    var f = function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); };
    return '#' + f(r) + f(g) + f(b);
  }
  function shade(hex, amt) {
    var c = hex2rgb(hex);
    if (amt >= 0) return rgb2hex(c.r + (255 - c.r) * amt, c.g + (255 - c.g) * amt, c.b + (255 - c.b) * amt);
    var k = 1 + amt;
    return rgb2hex(c.r * k, c.g * k, c.b * k);
  }
  function rgba(hex, a) {
    var c = hex2rgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function readable(hex) {
    var c = hex2rgb(hex);
    return (c.r * 0.299 + c.g * 0.587 + c.b * 0.114) > 150 ? INK : BRAND.white;
  }

  /* ---- deterministic wobble --------------------------------------------- *
   * The hand-drawn look has to be stable: the same monster must wobble the
   * same way every frame and in every cabinet, so the jitter is generated once
   * per shape from a hash of its name and then cached.                      */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngFor(key) {
    var s = hash(key) || 1;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var CACHE = {};

  /* ---------------- drawing primitives ----------------------------------- */

  /* fill, then outline — the single most important rule of the house style */
  function inked(ctx, fill, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = lw === undefined ? OUT : lw;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function E(ctx, x, y, rx, ry, fill, rot, lw) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.001, rx), Math.max(0.001, ry), rot || 0, 0, TAU);
    inked(ctx, fill, lw);
  }
  function C(ctx, x, y, r, fill, lw) { E(ctx, x, y, r, r, fill, 0, lw); }

  function poly(ctx, pts, fill, lw) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    inked(ctx, fill, lw);
  }

  /* a closed organic curve through jittered points around an ellipse */
  function blob(ctx, cx, cy, rx, ry, pts, jitter, rng) {
    var P = [], i;
    for (i = 0; i < pts; i++) {
      var a = (i / pts) * TAU - Math.PI / 2;
      var k = 1 + (rng() - 0.5) * 2 * jitter;
      P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    ctx.beginPath();
    ctx.moveTo((P[0][0] + P[pts - 1][0]) / 2, (P[0][1] + P[pts - 1][1]) / 2);
    for (i = 0; i < pts; i++) {
      var p1 = P[i], p2 = P[(i + 1) % pts];
      ctx.quadraticCurveTo(p1[0], p1[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    }
    ctx.closePath();
  }

  function roundRect(ctx, x, y, w, h, r, fill, lw) {
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    inked(ctx, fill, lw);
  }

  /* ---------------- monsters --------------------------------------------- */

  /* Body silhouettes.  Each kind is one closed path — fill it, clip to it, or
   * reuse it — and each monster gets its own wobble from its own name, so the
   * line looks hand-drawn but never shimmers between frames.
   *
   * Two of them cheat the outline itself: `puff` alternates the radius of
   * every vertex to make a scalloped fuzzy edge, and `ragged` pushes the lower
   * vertices out into a lumpy drippy hem.  Doing it in the silhouette rather
   * than with separate shapes means there is exactly one black outline, which
   * is what the house style demands.                                        */
  var BODIES = {
    round:  { rx: 0.92, ry: 0.86, cy: 0.02, pts: 12, jit: 0.040 },
    tall:   { rx: 0.74, ry: 1.00, cy: -0.02, pts: 11, jit: 0.044 },
    squat:  { rx: 0.98, ry: 0.74, cy: 0.14, pts: 11, jit: 0.038 },
    egg:    { rx: 0.86, ry: 0.96, cy: 0.00, pts: 11, jit: 0.038 },
    puff:   { belly: 1, rx: 0.88, ry: 0.84, cy: 0.02, pts: 17, jit: 0.020, scallop: 0.090 },
    ragged: { rx: 0.86, ry: 0.80, cy: 0.06, pts: 13, jit: 0.050, drip: 0.30 }
  };

  function silhouette(ctx, kind, rng) {
    var b = BODIES[kind] || BODIES.round;
    var P = [], i;
    for (i = 0; i < b.pts; i++) {
      var a = (i / b.pts) * TAU - Math.PI / 2;
      var k = 1 + (rng() - 0.5) * 2 * b.jit;
      if (b.scallop) k += (i % 2 ? b.scallop : -b.scallop * 0.45);
      if (b.drip && Math.sin(a) > 0.15) k += Math.sin(a) * b.drip * (0.45 + rng() * 0.9);
      P.push([Math.cos(a) * b.rx * k, b.cy + Math.sin(a) * b.ry * k]);
    }
    ctx.beginPath();
    ctx.moveTo((P[0][0] + P[b.pts - 1][0]) / 2, (P[0][1] + P[b.pts - 1][1]) / 2);
    for (i = 0; i < b.pts; i++) {
      var p1 = P[i], p2 = P[(i + 1) % b.pts];
      ctx.quadraticCurveTo(p1[0], p1[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    }
    ctx.closePath();
    return {
      rx: b.rx, ry: b.ry, cy: b.cy,
      rx2: b.rx * 0.82, ry2: b.ry * 0.56, cy2: b.cy + b.ry * 0.36,
      bottom: b.cy + b.ry * (b.drip ? 1.28 : 1.0)
    };
  }

  /* the little "3" fur squiggles that cover every FURI body */
  function furMarks(ctx, g, rng, colour, count, len) {
    if (!count) return;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = OUT * 0.72;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var L = len === undefined ? 0.13 : len;
    for (var i = 0; i < count; i++) {
      var a = rng() * TAU;
      var r = 0.30 + rng() * 0.56;
      var x = Math.cos(a) * g.rx * r;
      var y = g.cy + Math.sin(a) * g.ry * r * 0.92;
      var s = L * (0.7 + rng() * 0.7);
      var rot = (rng() - 0.5) * 0.9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.42);
      ctx.quadraticCurveTo(-s * 0.2, -s * 0.5, s * 0.55, s * 0.24);
      ctx.quadraticCurveTo(s * 0.6, s * 0.8, -s * 0.15, s * 0.7);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* plain white horn, curved, with the ink outline */
  function horn(ctx, x, y, h, w, rot, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(-w * 0.72, -h * 0.66, 0, -h);
    ctx.quadraticCurveTo(w * 0.72, -h * 0.66, w, 0);
    ctx.quadraticCurveTo(0, h * 0.26, -w, 0);
    ctx.closePath();
    inked(ctx, fill || BRAND.white, OUT * 0.95);
    ctx.restore();
  }

  /* the three-lobed FURI wing */
  function wing(ctx, x, y, s, flip, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -1 : 1, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 0.10, -s * 0.85, -s * 0.92, -s * 0.72);
    ctx.quadraticCurveTo(-s * 0.66, -s * 0.42, -s * 0.98, -s * 0.24);
    ctx.quadraticCurveTo(-s * 0.62, -s * 0.08, -s * 0.90, s * 0.20);
    ctx.quadraticCurveTo(-s * 0.40, s * 0.18, 0, s * 0.28);
    ctx.closePath();
    inked(ctx, fill || BRAND.white, OUT * 0.95);
    ctx.restore();
  }

  /* stubby arm, optionally holding something */
  function arm(ctx, x, y, s, flip, fill, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -1 : 1, 1);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.40);
    ctx.quadraticCurveTo(-s * 1.20, -s * 0.10, -s * 1.02, s * 0.62);
    ctx.quadraticCurveTo(-s * 0.70, s * 0.86, -s * 0.34, s * 0.58);
    ctx.quadraticCurveTo(-s * 0.10, s * 0.30, 0, s * 0.42);
    ctx.closePath();
    inked(ctx, fill, OUT * 0.95);
    ctx.restore();
  }

  function foot(ctx, x, y, s, fill, shoe, shoeAccent) {
    if (shoe) {
      ctx.save();
      ctx.translate(x, y);
      roundRect(ctx, -s * 1.05, -s * 0.42, s * 2.10, s * 0.92, s * 0.42, shoe, OUT * 0.9);
      ctx.beginPath();
      ctx.moveTo(-s * 1.02, s * 0.30);
      ctx.quadraticCurveTo(0, s * 0.66, s * 1.02, s * 0.30);
      ctx.lineTo(s * 1.02, s * 0.40);
      ctx.quadraticCurveTo(0, s * 0.78, -s * 1.02, s * 0.40);
      ctx.closePath();
      inked(ctx, shoeAccent || BRAND.white, OUT * 0.7);
      ctx.restore();
      return;
    }
    E(ctx, x, y, s * 0.62, s * 0.44, fill, 0, OUT * 0.9);
  }

  /* ---- eyes -------------------------------------------------------------- *
   * `style` is one of: dots, dots3, big, big3, angry, angry3, stack3, wide,
   * cross, glow                                                              */
  function eyes(ctx, pal, style, cx, cy, spread, r) {
    var white = BRAND.white;
    var iris = pal.iris || pal.accent || BRAND.teal;
    var pupil = INK;
    var i, a, x, y;

    function roundEye(ex, ey, er, ir) {
      C(ctx, ex, ey, er, white, OUT * 0.85);
      if (ir) {
        C(ctx, ex, ey, er * 0.55, iris, OUT * 0.5);
        C(ctx, ex, ey, er * 0.30, pupil, OUT * 0.35);
        C(ctx, ex - er * 0.22, ey - er * 0.26, er * 0.16, white, 0);
      }
    }
    function dotEye(ex, ey, er, col) { C(ctx, ex, ey, er, col || pupil, OUT * 0.6); }

    switch (style) {
      case 'dots3':
        dotEye(cx - spread, cy, r * 0.44);
        dotEye(cx + spread, cy, r * 0.44);
        dotEye(cx, cy - spread * 0.86, r * 0.38);
        break;
      case 'dots':
        dotEye(cx - spread, cy, r * 0.5);
        dotEye(cx + spread, cy, r * 0.5);
        break;
      case 'big3':
        roundEye(cx - spread, cy + r * 0.20, r * 0.66, true);
        roundEye(cx + spread, cy + r * 0.20, r * 0.66, true);
        roundEye(cx, cy - r * 0.72, r * 0.56, true);
        break;
      case 'big':
        roundEye(cx - spread, cy, r * 0.78, true);
        roundEye(cx + spread, cy, r * 0.78, true);
        break;
      case 'stack3':
        for (i = -1; i <= 1; i++) roundEye(cx, cy + i * r * 1.15, r * 0.50, true);
        break;
      case 'angry':
      case 'angry3':
        var n = style === 'angry3' ? 3 : 2;
        for (i = 0; i < n; i++) {
          x = n === 2 ? cx + (i * 2 - 1) * spread : cx + (i - 1) * spread * 1.15;
          y = cy + (n === 3 ? Math.abs(i - 1) * r * 0.6 : 0);
          C(ctx, x, y, r * 0.60, white, OUT * 0.8);
          C(ctx, x, y, r * 0.34, iris, OUT * 0.45);
          C(ctx, x, y, r * 0.17, pupil, OUT * 0.3);
          /* the brow that makes it angry */
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x - r * 0.72, y - r * 0.86);
          ctx.lineTo(x + r * 0.72, y - r * 0.40);
          ctx.lineWidth = OUT * 1.5;
          ctx.strokeStyle = INK;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
        break;
      case 'wide':
        for (i = -1; i <= 1; i++) {
          x = cx + i * spread;
          C(ctx, x, cy, r * 0.42, white, OUT * 0.7);
          C(ctx, x, cy, r * 0.20, pupil, OUT * 0.35);
        }
        break;
      case 'cross':
        for (i = -1; i <= 1; i += 2) {
          x = cx + i * spread;
          ctx.save();
          ctx.strokeStyle = INK;
          ctx.lineWidth = OUT * 1.1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x - r * 0.42, cy - r * 0.42); ctx.lineTo(x + r * 0.42, cy + r * 0.42);
          ctx.moveTo(x + r * 0.42, cy - r * 0.42); ctx.lineTo(x - r * 0.42, cy + r * 0.42);
          ctx.stroke();
          ctx.restore();
        }
        break;
      case 'glow':
        for (i = -1; i <= 1; i += 2) {
          C(ctx, cx + i * spread, cy, r * 0.52, INK, OUT * 0.7);
          C(ctx, cx + i * spread, cy, r * 0.26, pal.eye || BRAND.neonMint, 0);
        }
        break;
      default: /* 'big' with a single eye */
        roundEye(cx, cy, r * 0.95, true);
    }
  }

  /* ---- mouths ------------------------------------------------------------ */
  function mouth(ctx, style, cx, cy, w, h, pal) {
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = OUT * 1.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var i;
    switch (style) {
      case 'fang':
        ctx.beginPath();
        ctx.moveTo(cx - w, cy);
        ctx.quadraticCurveTo(cx, cy + h * 2.0, cx + w, cy);
        ctx.closePath();
        inked(ctx, '#3A1620', OUT * 0.85);
        poly(ctx, [[cx - w * 0.34, cy + h * 0.42], [cx - w * 0.06, cy + h * 0.42], [cx - w * 0.20, cy + h * 1.22]], BRAND.white, OUT * 0.7);
        break;
      case 'jag':
        ctx.beginPath();
        ctx.moveTo(cx - w, cy);
        var n = 5, step = (w * 2) / n;
        for (i = 0; i < n; i++) {
          ctx.lineTo(cx - w + step * (i + 0.5), cy + (i % 2 ? h * 0.9 : -h * 0.5));
        }
        ctx.lineTo(cx + w, cy);
        ctx.closePath();
        inked(ctx, '#3A1620', OUT * 0.85);
        break;
      case 'open':
        E(ctx, cx, cy + h * 0.45, w * 0.62, h * 0.95, '#3A1620', 0, OUT * 0.85);
        break;
      case 'wavy':
        ctx.beginPath();
        ctx.moveTo(cx - w, cy + h * 0.2);
        ctx.quadraticCurveTo(cx - w * 0.5, cy - h * 0.7, cx, cy + h * 0.2);
        ctx.quadraticCurveTo(cx + w * 0.5, cy + h * 1.0, cx + w, cy + h * 0.1);
        ctx.stroke();
        break;
      case 'smile':
        ctx.beginPath();
        ctx.arc(cx, cy - h * 0.55, w * 1.05, 0.20 * Math.PI, 0.80 * Math.PI);
        ctx.stroke();
        break;
      case 'flat':
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.7, cy + h * 0.3);
        ctx.lineTo(cx + w * 0.7, cy + h * 0.3);
        ctx.stroke();
        break;
      case 'none':
      default:
        break;
    }
    ctx.restore();
  }

  function cheeks(ctx, pal, cx, cy, spread, r) {
    if (!pal.accent) return;
    ctx.save();
    ctx.globalAlpha = 0.75;
    C(ctx, cx - spread, cy, r, pal.accent, 0);
    C(ctx, cx + spread, cy, r, pal.accent, 0);
    ctx.restore();
  }

  /* ---- accessories ------------------------------------------------------- */

  function crown(ctx, x, y, s, fill) {
    var c = fill || BRAND.gold;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.55);
    ctx.lineTo(-s * 0.98, -s * 0.30);
    ctx.lineTo(-s * 0.52, s * 0.06);
    ctx.lineTo(-s * 0.30, -s * 0.66);
    ctx.lineTo(0, s * 0.02);
    ctx.lineTo(s * 0.30, -s * 0.66);
    ctx.lineTo(s * 0.52, s * 0.06);
    ctx.lineTo(s * 0.98, -s * 0.30);
    ctx.lineTo(s, s * 0.55);
    ctx.closePath();
    inked(ctx, c, OUT * 0.95);
    /* the three ball finials */
    C(ctx, -s * 0.30, -s * 0.84, s * 0.20, c, OUT * 0.8);
    C(ctx, 0, -s * 0.28, s * 0.20, c, OUT * 0.8);
    C(ctx, s * 0.30, -s * 0.84, s * 0.20, c, OUT * 0.8);
    ctx.restore();
  }


  function paintRoller(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.5);
    roundRect(ctx, -s * 0.24, -s * 1.0, s * 0.48, s * 1.6, s * 0.16, '#C98A4B', OUT * 0.85);
    roundRect(ctx, -s * 0.62, -s * 1.36, s * 1.24, s * 0.62, s * 0.22, BRAND.neonMint, OUT * 0.85);
    ctx.restore();
  }
  function paintBucket(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, -s * 0.36);
    ctx.lineTo(s * 0.62, -s * 0.36);
    ctx.lineTo(s * 0.46, s * 0.62);
    ctx.lineTo(-s * 0.46, s * 0.62);
    ctx.closePath();
    inked(ctx, BRAND.white, OUT * 0.85);
    roundRect(ctx, -s * 0.70, -s * 0.46, s * 1.40, s * 0.20, s * 0.08, '#9AA3AE', OUT * 0.7);
    ctx.restore();
  }

  /* ---------------- the composed monster ---------------------------------- */

  function monster(ctx, pal, spec, name) {
    var body = pal.fur;
    var second = pal.fur2 || shade(body, -0.22);
    var belly = pal.belly || BRAND.white;
    var accent = pal.accent || BRAND.pink;
    var kind = spec.body || 'round';
    var seed = name + '|sil';

    /* --- things that live behind the body --- */
    if (spec.wings) {
      wing(ctx, -0.72, -0.22, 0.56, true, spec.wingFill || BRAND.white);
      wing(ctx, 0.72, -0.22, 0.56, false, spec.wingFill || BRAND.white);
    }
    if (spec.arms !== false) {
      arm(ctx, -0.74, 0.20, 0.32, true, second, spec.armRot || 0);
      arm(ctx, 0.74, 0.20, 0.32, false, second, -(spec.armRot || 0));
    }

    /* --- the legs, so the feet peek out below --- */
    var probe = silhouette(ctx, kind, rngFor(seed));
    if (spec.shoes) {
      foot(ctx, -0.36, probe.bottom + 0.22, 0.26, second, BRAND.white, '#E8453C');
      foot(ctx, 0.36, probe.bottom + 0.22, 0.26, second, BRAND.white, '#E8453C');
    } else if (spec.legs !== false) {
      E(ctx, -0.34, probe.bottom + 0.10, 0.20, 0.24, second, 0, OUT * 0.9);
      E(ctx, 0.34, probe.bottom + 0.10, 0.20, 0.24, second, 0, OUT * 0.9);
    }

    /* --- the body: one silhouette, so there is exactly one outline --- */
    var g = silhouette(ctx, kind, rngFor(seed));
    inked(ctx, body, OUT);

    /* everything from here is painted inside the silhouette */
    ctx.save();
    silhouette(ctx, kind, rngFor(seed));
    ctx.clip();

    /* The belly patch is opt-in.  Most of the line is a plain flat body — a
     * patch on everything turns the whole toy line into white blobs.       */
    if (spec.belly) {
      E(ctx, 0, g.cy2 + (spec.bellyY || 0), g.rx2 * (spec.bellyW || 1), g.ry2 * (spec.bellyH || 1), belly, 0, OUT * 0.62);
    }
    if (spec.patch) {
      E(ctx, -g.rx * 0.42, g.cy - g.ry * 0.30, g.rx * 0.34, g.ry * 0.24, spec.patch, -0.4, OUT * 0.75);
      E(ctx, g.rx * 0.46, g.cy + g.ry * 0.30, g.rx * 0.24, g.ry * 0.18, spec.patch, 0.3, OUT * 0.75);
    }
    furMarks(ctx, g, rngFor(name + '|fur'), spec.mark || shade(body, -0.38), spec.fur === undefined ? 7 : spec.fur, spec.furLen);
    if (spec.stripes) {
      ctx.save();
      ctx.strokeStyle = spec.mark || shade(body, -0.30);
      ctx.lineWidth = OUT * 1.1;
      ctx.lineCap = 'round';
      for (var s = -1; s <= 1; s += 2) {
        for (var k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(s * g.rx * 0.50, g.cy - 0.30 + k * 0.30);
          ctx.lineTo(s * g.rx * 0.96, g.cy - 0.40 + k * 0.30);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    ctx.restore();

    /* --- horns, behind the face but over the body top --- */
    if (spec.horns) {
      horn(ctx, -spec.hornX, g.cy - g.ry * 0.90, spec.hornH * 1.22, spec.hornW * 1.15, -0.40, spec.hornFill);
      horn(ctx, spec.hornX, g.cy - g.ry * 0.90, spec.hornH * 1.22, spec.hornW * 1.15, 0.40, spec.hornFill);
    }
    if (spec.ears === 'long') {
      longEar(ctx, -0.32, g.cy - g.ry * 0.82, 0.19, 0.70, body, second, -0.16);
      longEar(ctx, 0.32, g.cy - g.ry * 0.82, 0.19, 0.70, body, second, 0.16);
    }
    if (spec.ears === 'round') {
      C(ctx, -0.60, g.cy - g.ry * 0.76, 0.26, body, OUT * 0.95);
      C(ctx, 0.60, g.cy - g.ry * 0.76, 0.26, body, OUT * 0.95);
      C(ctx, -0.60, g.cy - g.ry * 0.76, 0.13, second, 0);
      C(ctx, 0.60, g.cy - g.ry * 0.76, 0.13, second, 0);
    }
    if (spec.antenna) {
      for (var ai = -1; ai <= 1; ai += 2) {
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.lineWidth = OUT * 0.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ai * 0.24, g.cy - g.ry * 0.92);
        ctx.quadraticCurveTo(ai * 0.44, g.cy - g.ry * 1.30, ai * 0.30, g.cy - g.ry * 1.52);
        ctx.stroke();
        ctx.restore();
        C(ctx, ai * 0.30, g.cy - g.ry * 1.58, 0.12, accent, OUT * 0.8);
      }
    }
    if (spec.sprout) {
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = OUT * 0.9;
      ctx.beginPath();
      ctx.moveTo(0, g.cy - g.ry * 0.94);
      ctx.lineTo(0, g.cy - g.ry * 1.24);
      ctx.stroke();
      ctx.restore();
      E(ctx, -0.18, g.cy - g.ry * 1.30, 0.20, 0.13, BRAND.green, -0.5, OUT * 0.8);
      E(ctx, 0.18, g.cy - g.ry * 1.30, 0.20, 0.13, BRAND.green, 0.5, OUT * 0.8);
    }

    /* --- the face --- */
    var fy = g.cy - g.ry * (spec.faceY === undefined ? 0.26 : spec.faceY);
    var er = spec.eyeR || 0.21;
    var ex = spec.eyeX || 0.32;
    if (spec.browband) {
      E(ctx, 0, fy - er * 1.5, g.rx * 0.74, er * 0.90, spec.browband, 0, OUT * 0.8);
    }
    cheeks(ctx, { accent: spec.cheek === null ? null : (spec.cheek || accent) }, 0, fy + er * (spec.cheekY || 1.45), ex + er * 0.85, er * 0.55);
    eyes(ctx, pal, spec.eyes || 'dots', 0, fy, ex, er);
    if (spec.mouth !== 'none') {
      mouth(ctx, spec.mouth || 'smile', spec.mouthX || 0, fy + er * (spec.mouthY || 1.9), spec.mouthW || 0.24, spec.mouthH || 0.15, pal);
    }
    if (spec.scar) {
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = OUT * 0.8;
      ctx.lineCap = 'round';
      ctx.translate(g.rx * 0.44, g.cy - g.ry * 0.62);
      for (var si = 0; si < 2; si++) {
        ctx.beginPath();
        ctx.moveTo(-0.10, -0.10 + si * 0.20);
        ctx.lineTo(0.10, 0.10 + si * 0.20 - 0.20);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* --- things that sit in front --- */
    if (spec.holdRoller) paintRoller(ctx, -0.90, 0.26, 0.32);
    if (spec.holdBucket) paintBucket(ctx, 0.84, 0.52, 0.26);
    if (spec.apron) {
      ctx.beginPath();
      ctx.moveTo(-0.36, g.cy + g.ry * 0.18);
      ctx.lineTo(0.36, g.cy + g.ry * 0.18);
      ctx.lineTo(0.42, g.cy + g.ry * 0.92);
      ctx.quadraticCurveTo(0, g.cy + g.ry * 1.04, -0.42, g.cy + g.ry * 0.92);
      ctx.closePath();
      inked(ctx, spec.apron, OUT * 0.8);
    }
    if (spec.cape) {
      ctx.beginPath();
      ctx.moveTo(-0.84, g.cy - g.ry * 0.34);
      ctx.quadraticCurveTo(-1.14, g.cy + g.ry * 0.60, -0.74, g.cy + g.ry * 0.96);
      ctx.lineTo(0.74, g.cy + g.ry * 0.96);
      ctx.quadraticCurveTo(1.14, g.cy + g.ry * 0.60, 0.84, g.cy - g.ry * 0.34);
      ctx.closePath();
      inked(ctx, spec.cape, OUT * 0.9);
    }
    if (spec.crown) {
      /* sit it above whatever headgear the monster already has */
      var lift = spec.horns ? g.ry * 0.06 : 0;
      crown(ctx, 0, g.cy - g.ry * 1.02 - lift, spec.crownSize || 0.34, spec.crownFill || BRAND.gold);
    }
  }


  function longEar(ctx, x, y, w, h, fill, inner, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    E(ctx, 0, -h * 0.5, w, h * 0.62, fill, 0, OUT * 0.95);
    E(ctx, 0, -h * 0.52, w * 0.44, h * 0.40, inner, 0, OUT * 0.6);
    ctx.restore();
  }

  /* ====================================================================== *
   *  The roster.  Five are taken straight off the reference sheet — CROWN,
   *  PAINT BUN, PUFF, GRUMP and SUNNY.  The rest are new characters drawn to
   *  the same rules so the machine has a full toy line to stock.
   * ====================================================================== */
  var SPEC = {
    /* --- from the reference sheet --------------------------------------- */
    crownfuri: { body: 'tall', wings: 1, horns: 1, hornX: 0.46, hornH: 0.34, hornW: 0.10,
                 eyes: 'angry', eyeR: 0.22, eyeX: 0.33, mouth: 'fang', mouthW: 0.15, mouthH: 0.09,
                 fur: 12, furLen: 0.17, shoes: 1, crown: 1, crownSize: 0.30, cheek: '#F389A0' },
    paintbun: { body: 'round', ears: 'long', eyes: 'big3', eyeR: 0.20, eyeX: 0.33,
                mouth: 'smile', mouthW: 0.16, mouthH: 0.10, fur: 8, shoes: 1,
                holdRoller: 1, holdBucket: 1, apron: '#BFE3F2', cheek: '#F389A0', belly: 0 },
    puff:     { body: 'puff', tufts: 13, wings: 1, horns: 1, hornX: 0.34, hornH: 0.24, hornW: 0.08,
                eyes: 'dots3', eyeR: 0.20, eyeX: 0.32, mouth: 'flat', mouthW: 0.12, mouthH: 0.07,
                fur: 5, legs: false, belly: 0, cheek: null },
    grump:    { body: 'ragged', horns: 1, hornX: 0.40, hornH: 0.32, hornW: 0.10,
                eyes: 'angry', eyeR: 0.21, eyeX: 0.33, mouth: 'jag', mouthW: 0.26, mouthH: 0.10,
                fur: 4, arms: 1, legs: false, belly: 0, cheek: null, dripCount: 5 },
    sunny:    { belly: 1, body: 'squat', horns: 1, hornX: 0.44, hornH: 0.30, hornW: 0.11,
                eyes: 'stack3', eyeR: 0.23, mouth: 'fang', mouthW: 0.16, mouthH: 0.10,
                fur: 4, scar: 1, cheek: null, arms: 1 },

    /* --- the puff family ------------------------------------------------- */
    blip:     { belly: 1, body: 'round', eyes: 'dots', eyeR: 0.23, eyeX: 0.32, mouth: 'smile', fur: 8, cheek: 1 },
    squeak:   { belly: 1, body: 'round', ears: 'round', eyes: 'big', eyeR: 0.21, eyeX: 0.30, mouth: 'open', fur: 5 },
    mochi:    { belly: 1, body: 'squat', eyes: 'dots', eyeR: 0.20, eyeX: 0.30, mouth: 'flat', fur: 3, cheek: 1 },
    wisp:     { body: 'puff', tufts: 11, eyes: 'dots3', eyeR: 0.19, eyeX: 0.30, mouth: 'flat', fur: 3, legs: false, cheek: null },
    dot:      { body: 'round', eyes: 'dots', eyeR: 0.22, eyeX: 0.33, mouth: 'none', fur: 4, legs: false },

    /* --- the fang family ------------------------------------------------- */
    chomp:    { belly: 1, body: 'round', eyes: 'dots', eyeR: 0.21, eyeX: 0.32, mouth: 'fang', fur: 6, cheek: 1 },
    fang:     { body: 'egg', horns: 1, hornX: 0.42, hornH: 0.30, hornW: 0.10,
                eyes: 'big', eyeR: 0.22, eyeX: 0.32, mouth: 'fang', mouthW: 0.20, mouthH: 0.13, fur: 7 },
    spike:    { body: 'egg', eyes: 'angry', eyeR: 0.20, eyeX: 0.32, mouth: 'jag', mouthW: 0.22, mouthH: 0.09,
                fur: 5, spikes: 1 },
    ember:    { body: 'round', eyes: 'angry', eyeR: 0.20, eyeX: 0.32, mouth: 'jag', fur: 6,
                sprout: 0, horns: 1, hornX: 0.36, hornH: 0.26, hornW: 0.09, cheek: null },
    grub:     { belly: 1, body: 'egg', eyes: 'dots', eyeR: 0.20, eyeX: 0.30, mouth: 'wavy', fur: 6, legs: false, cheek: null },
    muzz:     { belly: 1, body: 'ragged', eyes: 'dots', eyeR: 0.20, eyeX: 0.32, mouth: 'wavy', fur: 3, legs: false, cheek: null },
    tiki:     { belly: 1, body: 'egg', eyes: 'angry', eyeR: 0.21, eyeX: 0.33, mouth: 'jag', mouthW: 0.24, mouthH: 0.11,
                fur: 3, browband: '#F389A0', cheek: null },

    /* --- the wing family ------------------------------------------------- */
    buzz:     { body: 'round', wings: 1, antenna: 1, eyes: 'big', eyeR: 0.23, eyeX: 0,
                mouth: 'smile', fur: 4, stripes: 1, cheek: 1 },
    bat:      { body: 'round', wings: 1, ears: 'long', eyes: 'dots', eyeR: 0.20, eyeX: 0.30,
                mouth: 'fang', mouthW: 0.14, mouthH: 0.08, fur: 4, cheek: null, wingFill: '#C099C6' },
    winger:   { body: 'egg', wings: 1, eyes: 'dots3', eyeR: 0.20, eyeX: 0.32, mouth: 'flat',
                fur: 5, wingFill: '#FDFEFD', cheek: 1 },
    phantom:  { body: 'ragged', wings: 1, eyes: 'glow', eyeR: 0.20, eyeX: 0.32, mouth: 'open',
                fur: 2, legs: false, cheek: null, dripCount: 6 },
    frost:    { belly: 1, body: 'round', wings: 1, horns: 1, hornX: 0.38, hornH: 0.28, hornW: 0.09,
                eyes: 'dots', eyeR: 0.21, eyeX: 0.32, mouth: 'smile', fur: 7, cheek: 1 },
    noodle:   { body: 'tall', eyes: 'dots', eyeR: 0.20, eyeX: 0.30, mouth: 'wavy', fur: 6, legs: false, cheek: null },

    /* --- the royal family ------------------------------------------------ */
    kingfuri: { body: 'tall', wings: 1, horns: 1, hornX: 0.48, hornH: 0.38, hornW: 0.11,
                eyes: 'angry3', eyeR: 0.20, eyeX: 0.32, mouth: 'fang', mouthW: 0.17, mouthH: 0.10,
                fur: 10, shoes: 1, crown: 1, crownSize: 0.40, cape: '#FEC82A', cheek: '#F389A0' },
    royal:    { body: 'egg', wings: 1, eyes: 'dots3', eyeR: 0.20, eyeX: 0.32, mouth: 'smile',
                fur: 6, crown: 1, crownSize: 0.30, cape: '#C099C6', cheek: 1 },
    primemon: { body: 'tall', wings: 1, horns: 1, hornX: 0.46, hornH: 0.36, hornW: 0.11,
                eyes: 'big3', eyeR: 0.20, eyeX: 0.32, mouth: 'smile', fur: 11, shoes: 1,
                crown: 1, crownSize: 0.44, cape: '#73FFC7', cheek: '#F389A0' },
    chimera:  { body: 'egg', wings: 1, horns: 1, hornX: 0.40, hornH: 0.34, hornW: 0.10,
                eyes: 'big3', eyeR: 0.20, eyeX: 0.32, mouth: 'fang', mouthW: 0.18, mouthH: 0.11,
                fur: 8, scar: 1, cheek: null },
    omega:    { body: 'tall', horns: 1, hornX: 0.44, hornH: 0.40, hornW: 0.12,
                eyes: 'glow', eyeR: 0.21, eyeX: 0.32, mouth: 'jag', mouthW: 0.24, mouthH: 0.10,
                fur: 9, cape: '#020202', crown: 1, crownSize: 0.34, cheek: null },
    regal:    { body: 'squat', wings: 1, eyes: 'angry', eyeR: 0.22, eyeX: 0.33,
                mouth: 'flat', mouthW: 0.16, mouthH: 0.08, fur: 6, crown: 1, crownSize: 0.32, cheek: 1 },

    /* --- the glitch family ----------------------------------------------- */
    robot:    { body: 'squat', eyes: 'wide', eyeR: 0.23, eyeX: 0.33, mouth: 'flat', fur: 0,
                antenna: 1, belly: 1, bellyW: 0.80, bellyH: 0.78, cheek: null, arms: 1 },
    mecha:    { body: 'egg', horns: 1, hornX: 0.40, hornH: 0.26, hornW: 0.10,
                eyes: 'glow', eyeR: 0.20, eyeX: 0.32, mouth: 'flat', fur: 0, stripes: 1, cheek: null },
    glitch:   { body: 'round', eyes: 'cross', eyeR: 0.21, eyeX: 0.33, mouth: 'jag',
                mouthW: 0.22, mouthH: 0.09, fur: 4, cheek: null },
    voidmon:  { body: 'round', eyes: 'glow', eyeR: 0.23, eyeX: 0.33, mouth: 'none',
                fur: 0, belly: 0, cheek: null, horns: 1, hornX: 0.40, hornH: 0.30, hornW: 0.10, hornFill: '#020202' },
    gadget:   { belly: 1, body: 'squat', eyes: 'wide', eyeR: 0.22, eyeX: 0.32, mouth: 'smile', fur: 0,
                antenna: 1, cheek: null, crown: 0 },
    bolt:     { belly: 1, body: 'egg', eyes: 'angry', eyeR: 0.21, eyeX: 0.32, mouth: 'fang',
                mouthW: 0.16, mouthH: 0.10, fur: 0, stripes: 1, cheek: null, horns: 1, hornX: 0.34, hornH: 0.24, hornW: 0.08 },
    glimmer:  { belly: 1, body: 'puff', tufts: 10, eyes: 'big3', eyeR: 0.19, eyeX: 0.30, mouth: 'smile',
                fur: 3, legs: false, cheek: 1 },
    circuit:  { body: 'round', eyes: 'wide', eyeR: 0.21, eyeX: 0.33, mouth: 'flat',
                fur: 0, stripes: 1, cheek: null },

    /* --- the paint family ------------------------------------------------ */
    paintbot: { body: 'squat', eyes: 'wide', eyeR: 0.21, eyeX: 0.32, mouth: 'smile', fur: 0, belly: 1,
                holdRoller: 1, cheek: null, apron: '#FDFEFD' },
    dipsy:    { belly: 1, body: 'round', ears: 'long', eyes: 'big', eyeR: 0.21, eyeX: 0.32,
                mouth: 'open', fur: 6, holdBucket: 1, cheek: 1 },
    splash:   { body: 'puff', tufts: 12, eyes: 'dots', eyeR: 0.20, eyeX: 0.32, mouth: 'smile',
                fur: 0, legs: false, cheek: 1 },
    scribble: { body: 'egg', eyes: 'dots3', eyeR: 0.19, eyeX: 0.32, mouth: 'wavy',
                fur: 12, furLen: 0.20, cheek: 1 },
    stencil:  { belly: 1, body: 'squat', eyes: 'big', eyeR: 0.22, eyeX: 0.32, mouth: 'flat', fur: 4,
                patch: '#FDFEFD', cheek: null },
    gloop:    { body: 'ragged', eyes: 'dots', eyeR: 0.20, eyeX: 0.32, mouth: 'wavy',
                fur: 3, legs: false, dripCount: 6, cheek: 1 }
  };

  /* the shape functions the catalogue refers to */
  var SHAPES = {};
  Object.keys(SPEC).forEach(function (name) {
    SHAPES[name] = function (ctx, pal) {
      monster(ctx, pal, SPEC[name], name);
    };
  });

  /* ---------------- the FURI MONSTER wordmark ---------------------------- *
   * The crown with feathered wings, then the name in heavy caps.  Drawn from
   * paths so it scales to a marquee or a title screen without artefacts.    */
  function crownLogo(ctx, cx, cy, w, inkColour) {
    var ink = inkColour || INK;
    var s = w * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    /* wings */
    for (var side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(s * 0.60, s * 0.20);
      ctx.quadraticCurveTo(s * 1.42, -s * 0.16, s * 1.72, s * 0.14);
      ctx.quadraticCurveTo(s * 1.36, s * 0.12, s * 1.30, s * 0.42);
      ctx.quadraticCurveTo(s * 1.02, s * 0.24, s * 0.86, s * 0.52);
      ctx.quadraticCurveTo(s * 0.70, s * 0.34, s * 0.60, s * 0.34);
      ctx.closePath();
      ctx.fillStyle = BRAND.white;
      ctx.fill();
      ctx.lineWidth = s * 0.10;
      ctx.strokeStyle = ink;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    /* the crown */
    ctx.beginPath();
    ctx.moveTo(-s * 0.86, s * 0.62);
    ctx.lineTo(-s * 0.80, -s * 0.20);
    ctx.lineTo(-s * 0.42, s * 0.18);
    ctx.lineTo(-s * 0.26, -s * 0.66);
    ctx.lineTo(0, s * 0.06);
    ctx.lineTo(s * 0.26, -s * 0.66);
    ctx.lineTo(s * 0.42, s * 0.18);
    ctx.lineTo(s * 0.80, -s * 0.20);
    ctx.lineTo(s * 0.86, s * 0.62);
    ctx.closePath();
    ctx.fillStyle = BRAND.gold;
    ctx.fill();
    ctx.lineWidth = s * 0.11;
    ctx.strokeStyle = ink;
    ctx.stroke();
    /* finials */
    var balls = [[-s * 0.26, -s * 0.80, s * 0.17], [0, -s * 0.20, s * 0.17], [s * 0.26, -s * 0.80, s * 0.17]];
    for (var i = 0; i < balls.length; i++) {
      ctx.beginPath();
      ctx.arc(balls[i][0], balls[i][1], balls[i][2], 0, TAU);
      ctx.fillStyle = BRAND.gold;
      ctx.fill();
      ctx.lineWidth = s * 0.09;
      ctx.strokeStyle = ink;
      ctx.stroke();
    }
    /* the band across the base */
    ctx.beginPath();
    ctx.moveTo(-s * 0.86, s * 0.40);
    ctx.lineTo(s * 0.86, s * 0.40);
    ctx.strokeStyle = ink;
    ctx.lineWidth = s * 0.075;
    ctx.stroke();
    ctx.restore();
  }

  /* the full lockup: crown + FURIMONSTER, black on nothing */
  function wordmark(ctx, cx, cy, w, o) {
    o = o || {};
    var size = w * 0.115;
    var ink = o.ink || INK;
    crownLogo(ctx, cx, cy - size * 1.15, w * 0.20, ink);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ink;
    /* FURI is lighter, MONSTER is the heavy half — exactly as on the sheet */
    var f1 = size, f2 = size * 1.16;
    ctx.font = '800 ' + f1.toFixed(1) + 'px "Arial Black", Impact, "Microsoft JhengHei", sans-serif';
    var w1 = ctx.measureText('FURI').width;
    ctx.font = '900 ' + f2.toFixed(1) + 'px "Arial Black", Impact, "Microsoft JhengHei", sans-serif';
    var w2 = ctx.measureText('MONSTER').width;
    var total = w1 + w2 * 0.94;
    var x = cx - total / 2;
    ctx.textAlign = 'left';
    ctx.font = '800 ' + f1.toFixed(1) + 'px "Arial Black", Impact, "Microsoft JhengHei", sans-serif';
    ctx.fillText('FURI', x, cy);
    ctx.font = '900 ' + f2.toFixed(1) + 'px "Arial Black", Impact, "Microsoft JhengHei", sans-serif';
    ctx.fillText('MONSTER', x + w1, cy);
    ctx.restore();
  }

  /* ---------------- the public entry point -------------------------------- */

  var BASE_PHASE = {};
  Object.keys(SPEC).forEach(function (n, i) { BASE_PHASE[n] = i * 0.77; });

  /* ---------------- the real supplied artwork ---------------------------- *
   * The six guardians now ship as the actual transparent PNGs from the brand
   * profile, so `draw` prefers a sprite whenever one is loaded and falls back
   * to the code-drawn line otherwise. That keeps the whole existing simulation,
   * sprite-free tests and any character without art working unchanged.
   * ---------------------------------------------------------------------- */
  var SPRITES = {};

  /* Preload the sprite list from CAT.sprites(). Calls back with how many
   * loaded and how many failed, so the shell can report a partial load rather
   * than silently drawing placeholder art.
   *
   * `CAT.sprites()` already carries an absolute URL derived from the catalogue
   * script's own location, so the first candidate normally wins. The extra
   * bases exist so a hand-assembled or relocated build still finds its art
   * instead of quietly falling back to the code-drawn line. */
  var FALLBACK_BASES = ['img/', '../../assets/img/ip/', '../assets/img/ip/', 'assets/img/ip/'];
  var STATUS = { total: 0, loaded: 0, failed: 0, missing: [] };

  function spriteStatus() { return { total: STATUS.total, loaded: STATUS.loaded, failed: STATUS.failed, missing: STATUS.missing.slice() }; }

  function loadSprites(list, done) {
    done = done || function () {};
    STATUS.total = list.length; STATUS.loaded = 0; STATUS.failed = 0; STATUS.missing = [];
    if (typeof Image === 'undefined') { done(0, 0); return; }   // Node / tests
    var pending = list.length, failed = 0;
    if (!pending) { done(0, 0); return; }
    var finish = function () { if (--pending <= 0) { STATUS.loaded = list.length - failed; STATUS.failed = failed; done(list.length - failed, failed); } };

    list.forEach(function (spec) {
      var candidates = [spec.file];
      if (spec.name) {
        FALLBACK_BASES.forEach(function (b) {
          if (spec.file !== b + spec.name) candidates.push(b + spec.name);
        });
      }
      var i = 0;
      (function tryNext() {
        if (i >= candidates.length) {
          failed++;
          STATUS.missing.push(spec.name || spec.file);
          if (root.console) root.console.error('[FURI MONSTER] character art failed to load: ' + (spec.name || spec.file) +
            ' — tried: ' + candidates.join(', ') + '. The game is drawing its placeholder monsters instead of the real IP.');
          finish();
          return;
        }
        var url = candidates[i];
        var img = new Image();
        img.onload = function () {
          SPRITES[spec.file] = img;      // draw() looks up by spec.file
          SPRITES[url] = img;
          finish();
        };
        img.onerror = function () { i++; tryNext(); };
        img.src = url;
      })();
    });
  }

  function spritesLoaded() { return Object.keys(SPRITES).length; }

  function drawSprite(ctx, img, prize, x, y, s, o) {
    var t = o.t || 0;
    var spec = prize.sprite;

    /* Span, in local units where 1 is the physics radius. Normalising by the
     * geometric mean of the opaque content box gives every character the same
     * visual mass, so a tall character (Furi Prince, 121x248) and a round one
     * (Bubi, 141x136) both read as the same size of plush in the pile. Without
     * this, normalising by the longest edge would make Furi Prince tower over
     * the cabinet and Winggo look like a pebble. */
    var span = 2 * spec.side / Math.sqrt(spec.box[0] * spec.box[1]);

    ctx.save();
    ctx.translate(x, y);

    if (o.shadow !== false) {
      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.beginPath();
      ctx.ellipse(0.04, 1.02, 0.86, 0.20, 0, 0, TAU);
      ctx.fillStyle = '#05070c';
      ctx.fill();
      ctx.restore();
    }

    if (o.rot) ctx.rotate(o.rot);
    if (o.lean) ctx.rotate(o.lean * 0.45);
    var sq = o.squash || 0;
    var breathe = Math.sin(t * 1.7 + (BASE_PHASE[prize.shape] || 0)) * 0.006;
    ctx.scale(s * (1 + sq * 0.5 + breathe), s * (1 - sq * 0.65 - breathe));

    if (ctx.imageSmoothingEnabled !== undefined) {
      ctx.imageSmoothingEnabled = true;
      if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    }
    ctx.drawImage(img, -span / 2, -span / 2, span, span);
    ctx.restore();
  }

  function draw(ctx, prize, x, y, s, o) {
    if (!prize || s <= 0.2) return;
    o = o || {};

    var spec = prize.sprite;
    var img = spec ? SPRITES[spec.file] : null;
    if (img) { drawSprite(ctx, img, prize, x, y, s, o); return; }

    var fn = SHAPES[prize.shape] || SHAPES.puff;
    var t = o.t || 0;

    ctx.save();
    ctx.translate(x, y);

    if (o.shadow !== false) {
      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.beginPath();
      ctx.ellipse(0.04, 1.02, 0.86, 0.20, 0, 0, TAU);
      ctx.fillStyle = '#05070c';
      ctx.fill();
      ctx.restore();
    }

    if (o.rot) ctx.rotate(o.rot);
    if (o.lean) ctx.rotate(o.lean * 0.45);
    var sq = o.squash || 0;
    var breathe = Math.sin(t * 1.7 + (BASE_PHASE[prize.shape] || 0)) * 0.008;
    ctx.scale(s * (1 + sq * 0.5 + breathe), s * (1 - sq * 0.65 - breathe));

    fn(ctx, prize.pal, t);

    /* the Crown Gold colourway: a crown on every monster, and a gleam */
    if (prize.crowned) {
      crown(ctx, 0, -0.96, 0.30, BRAND.deep);
    }
    if (prize.shine) {
      ctx.save();
      ctx.globalAlpha = 0.16 + 0.10 * Math.sin(t * 3.0);
      ctx.beginPath();
      ctx.ellipse(-0.30, -0.36, 0.34, 0.22, -0.5, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  NS.ART = {
    draw: draw,
    loadSprites: loadSprites,
    spritesLoaded: spritesLoaded,
    spriteStatus: spriteStatus,
    spriteBase: function () { return (NS.CAT && NS.CAT.SPRITE_BASE) || null; },
    shapes: SHAPES,
    spec: SPEC,
    shade: shade,
    rgba: rgba,
    readable: readable,
    crown: crown,
    crownLogo: crownLogo,
    wordmark: wordmark,
    BRAND: BRAND,
    INK: INK,
    prim: { E: E, C: C, poly: poly, blob: blob, roundRect: roundRect, inked: inked,
            horn: horn, wing: wing, crown: crown, mouth: mouth, eyes: eyes, furMarks: furMarks }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = NS.ART;
})(typeof globalThis !== 'undefined' ? globalThis : this);
