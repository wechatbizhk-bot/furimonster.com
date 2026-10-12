/* =========================================================================
 * assets/js/art.js — the website's character art layer.
 *
 * This file used to DRAW the monsters as inline SVG. That was wrong: it meant
 * the site showed an original redraw rather than the supplied FURI MONSTER IP,
 * so the character cards, the hero strip, the Emotion Lab and the quiz all
 * displayed invented figures while the real artwork sat unused in
 * assets/img/ip/. Nothing failed, because a redraw is still a picture of a
 * monster — which is exactly why it survived review.
 *
 * Now every character image on the site is the real transparent PNG. This
 * module is only responsible for placing it correctly.
 *
 * Two details matter for it not to look wrong:
 *
 * 1. The sprites are square canvases with the character centred and padded, so
 *    a fixed square box would make a wide character (Winggo, 181x111) look
 *    much smaller than a tall one (Boxo, 199x226). `size` is therefore derived
 *    from the opaque content box so every character reads at the same visual
 *    weight — the same normalisation the claw machine uses:
 *
 *        size = target * side / sqrt(box.w * box.h)
 *
 * 2. Derivative images (wallpapers, colouring pages, OG cards) are generated at
 *    build time by tools/build-art.js and simply linked here. They are not
 *    drawn in the browser.
 * ========================================================================= */
(function (root) {
  'use strict';

  var INK = '#020202';
  var WHITE = '#FDFEFD';

  /* opaque content box and square canvas side for each sprite, in source
   * pixels. Mirrors the sprite metadata in the game's js/catalogue.js — if the
   * art is re-exported, both must be updated together, which is why the game's
   * rig test asserts the files on disk. */
  var META = {
    'furi-prince': { box: [120, 222], side: 236 },
    'pinki': { box: [187, 225], side: 239 },
    'winggo': { box: [181, 111], side: 192 },
    'fluffu': { box: [142, 186], side: 198 },
    'boxo': { box: [199, 226], side: 240 },
    'bubi': { box: [227, 225], side: 241 }
  };

  var BASE = '';

  function setBase(b) { BASE = b || ''; }
  function base() { return BASE; }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pick(f) {
    if (f === null || f === undefined) return '';
    if (typeof f === 'string') return f;
    return (root.FM && root.FM.i18n) ? root.FM.i18n.pick(f) : (f.en || '');
  }

  function bySlug(slug) {
    return (root.FM && root.FM.data && root.FM.data.bySlug) ? root.FM.data.bySlug(slug) : null;
  }

  /* Display size that gives every character the same visual mass. */
  function displaySize(slug, target) {
    var m = META[slug];
    if (!m) return target;
    var content = Math.sqrt(m.box[0] * m.box[1]);
    return Math.round(target * m.side / content);
  }

  function srcFor(slug, opts) {
    opts = opts || {};
    var dir = opts.mode === 'outline' ? 'assets/img/ip-line/' : 'assets/img/ip/';
    var basePath = opts.root !== undefined ? opts.root : BASE;
    return basePath + dir + slug + '.png';
  }

  /* The public call. Returns an <img> pointing at the real artwork.
   * opts: { target | size, mode:'outline', root, className, alt, eager } */
  function monster(slug, opts) {
    opts = opts || {};
    if (!META[slug]) return '';
    var box = opts.size || displaySize(slug, opts.target || 200);
    var d = bySlug(slug);
    var alt = opts.alt || (d ? d.name + ' — ' + pick(d.symbol) : slug);
    return '<img class="fm-art' + (opts.className ? ' ' + opts.className : '') + '"' +
      ' src="' + esc(srcFor(slug, opts)) + '"' +
      ' width="' + box + '" height="' + box + '"' +
      ' alt="' + esc(alt) + '"' +
      (opts.eager ? ' decoding="async"' : ' loading="lazy" decoding="async"') +
      '>';
  }

  /* Pre-generated raster derivative paths (see tools/build-art.js). */
  function wallpaperUrl(slug, kind, opts) {
    var basePath = (opts && opts.root !== undefined) ? opts.root : BASE;
    var size = kind === 'desktop' ? 'desktop' : 'phone';
    return basePath + 'assets/img/wallpaper/' + slug + '-' + size + '.png';
  }

  function colouringUrl(slug, opts) {
    var basePath = (opts && opts.root !== undefined) ? opts.root : BASE;
    return basePath + 'assets/img/ip-line/' + slug + '.png';
  }

  function stickerUrl(slug, opts) {
    var basePath = (opts && opts.root !== undefined) ? opts.root : BASE;
    return basePath + 'assets/img/stickers/' + slug + '.png';
  }

  function ogUrl(slug, opts) {
    var basePath = (opts && opts.root !== undefined) ? opts.root : BASE;
    return basePath + 'assets/img/og/' + slug + '.png';
  }

  var api = {
    monster: monster,
    displaySize: displaySize,
    wallpaperUrl: wallpaperUrl,
    colouringUrl: colouringUrl,
    stickerUrl: stickerUrl,
    ogUrl: ogUrl,
    setBase: setBase,
    base: base,
    esc: esc,
    meta: META,
    INK: INK,
    WHITE: WHITE,
    slugs: Object.keys(META)
  };

  root.FM = root.FM || {};
  root.FM.art = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
