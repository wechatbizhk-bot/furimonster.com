'use strict';
/* =========================================================================
 * js/catalogue.js — the FURI MONSTER line, as it actually is.
 *
 * Six characters, from the official brand profile:
 *
 *   Furi Prince  情緒覺察領航者  Emotional Awareness Guide   — Memory
 *   Pinki        心聲陪伴者      Inner Voice Companion       — Heartbeat
 *   Winggo       呼吸釋放者      Breath and Release Guide    — Light of Nature
 *   Fluffu       溫柔安定者      Gentle Grounding Guide      — Seed
 *   Boxo         創意轉化者      Creative Transformation Guide — Material Cycle
 *   Bubi         情緒流動者      Emotional Flow Guide        — Water & Emotion
 *
 * The previous build of this game shipped a 43-character invented line with
 * six recolours each. That was placeholder content. This file replaces it with
 * the real six, so the cabinet now stocks the actual IP.
 *
 * Art is the real supplied artwork: each character carries a `sprite` block
 * naming its transparent PNG and recording the content box measured when the
 * background was removed. `art.js` uses that box to give every character the
 * same visual mass in the pile, so a tall character (Furi Prince) and a round
 * one (Bubi) both read as a plush of the same size.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var RARITY = NS.C.RARITY;
  var RARITY_ORDER = NS.C.RARITY_ORDER;

  /* Where the transparent character art lives.
   *
   * Resolved from THIS SCRIPT'S OWN URL, not from the page, so the game finds
   * its art whether it is opened as the game root, embedded at /play/, or
   * driven by tools/screenshot.html one directory deeper.
   *
   * This matters more than it looks. The base used to be a page-relative
   * '../../assets/img/ip/', which happened to resolve from the one deployed
   * location and from nowhere else. Everywhere else the images 404'd, art.js
   * fell back to its code-drawn line, and the game quietly showed the invented
   * placeholder monsters instead of the real IP. Silent fallbacks are how a
   * bug like that survives a screenshot review.
   *
   * The art therefore ships inside the game folder (img/ beside js/), and the
   * base is derived from js/catalogue.js so it cannot drift. */
  var SPRITE_BASE = (function () {
    if (root.CM_SPRITE_BASE) return root.CM_SPRITE_BASE;
    /* Guarded throughout: this runs in a mocked DOM during the bundle test,
     * which has no getElementsByTagName, and in Node with no document at all. */
    try {
      var doc = root.document;
      var sc = doc && doc.currentScript;
      if (!sc && doc && typeof doc.getElementsByTagName === 'function') {
        var all = doc.getElementsByTagName('script');
        for (var i = all.length - 1; i >= 0; i--) {
          if (/catalogue\.js/.test(all[i].src || '')) { sc = all[i]; break; }
        }
      }
      if (sc && sc.src) {
        /* .../js/catalogue.js  ->  .../img/ */
        return String(sc.src).replace(/js\/[^/?#]*$/, 'img/');
      }
    } catch (e) { /* fall through to the default */ }
    return 'img/';
  })();

  /* ---- colourways ------------------------------------------------------- *
   * The real line has no recolours, so there is exactly one colourway. The
   * array stays because the collection book, the save file and the prize ids
   * are all built from it.                                                */
  var COLORWAYS = [
    { id: 'classic', prefix: { en: '', zh: '' }, rarityShift: 0,
      valueMul: 1, massMul: 1, slipMul: 1, tint: null, crowned: false, shine: false }
  ];

  /* ---- the six ---------------------------------------------------------- *
   * `r`    physics radius in metres     `mass` in grams
   * `slip` 1.0 = grippy plush, 2.1 = a smooth vinyl sphere that slides out
   * `box`  the opaque content box of the sprite, in source pixels
   * `side` the square canvas the sprite was padded to, in source pixels
   * ---------------------------------------------------------------------- */
  function palette(fur, fur2, belly, accent, iris) {
    return { fur: fur, fur2: fur2, belly: belly, accent: accent,
             iris: iris || accent, eye: '#020202', nose: '#3A1620' };
  }

  var D = function (id, en, zh, tier, shape, r, mass, slip, pal, tags, sprite) {
    return { id: id, en: en, zh: zh, tier: tier, shape: shape, r: r, mass: mass,
             slip: slip, pal: pal, tags: tags, sprite: sprite };
  };

  var DESIGNS = [
    /* `shape` names a body spec in js/art.js. It only matters for the
     * code-drawn fallback used when a sprite image fails to load, but it must
     * still be a real key: the previous values ('round', 'ragged', 'squat')
     * were body *descriptions*, not spec names, so four of the six silently
     * fell through to the generic puff silhouette. Each is now mapped to the
     * spec that most resembles the character. */

    /* tier 0 — common: small, light, easy to hold. The one you learn on. */
    D('winggo', 'Winggo', '溫果', 0, 'buzz', 0.102, 122, 1.00,
      palette('#AAD387', '#83AE5F', '#FDFEFD', '#A3FF61', '#020202'), ['breath'],
      { file: 'winggo.png', box: [181, 111], side: 192 }),

    /* tier 1 — uncommon: a bit taller, a bit more slippery. */
    D('pinki', 'Pinki', '平奇', 1, 'dipsy', 0.110, 158, 1.12,
      palette('#F389A0', '#CE6A81', '#FDFEFD', '#6AC9CD', '#6AC9CD'), ['voice'],
      { file: 'pinki.png', box: [187, 225], side: 239 }),

    /* tier 2 — rare: Fluffu drips, so the prongs slide off the hem. */
    D('fluffu', 'Fluffu', '芙芙', 2, 'gloop', 0.118, 192, 1.30,
      palette('#C099C6', '#97709E', '#FDFEFD', '#7FE3E8', '#7FE3E8'), ['ground'],
      { file: 'fluffu.png', box: [142, 186], side: 198 }),

    D('boxo', 'Boxo', '盒子', 2, 'paintbot', 0.124, 232, 1.22,
      palette('#FEC82A', '#D2A00E', '#FDFEFD', '#FEC308', '#020202'), ['create'],
      { file: 'boxo.png', box: [199, 226], side: 240 }),

    /* tier 3 — epic: tall and heavy, and the crown catches on the way out. */
    D('furi-prince', 'Furi Prince', '皇子', 3, 'crownfuri', 0.132, 302, 1.40,
      palette('#6AC9CD', '#47999E', '#FDFEFD', '#F389A0', '#F389A0'), ['awareness'],
      { file: 'furi-prince.png', box: [120, 222], side: 236 }),

    /* tier 4 — legendary, and for a physical reason: Bubi is a smooth round
     * body with almost nothing for the fingers to grip. Slip 2.10 is the
     * highest in the line, so he is the one that always gets away. */
    D('bubi', 'Bubi', '布比', 4, 'mochi', 0.126, 214, 2.10,
      palette('#F389A0', '#CE6A81', '#FDFEFD', '#F389A0', '#020202'), ['flow'],
      { file: 'bubi.png', box: [227, 225], side: 241 })
  ];

  /* ---- scale ------------------------------------------------------------ *
   * The design table is authored at a legible 1x; these bring it up to the
   * cabinet, which is a big two-metre arcade machine.  A 40 cm plush really
   * does weigh a few hundred grams, which is why holding one is a struggle.  */
  var R_SCALE = 1.55, M_SCALE = 2.2;

  /* ---- build the prizes ------------------------------------------------- */
  var baseValue = [38, 72, 132, 224, 430];
  var PRIZES = [];
  var BY_ID = {};

  for (var di = 0; di < DESIGNS.length; di++) {
    var d = DESIGNS[di];
    for (var ci = 0; ci < COLORWAYS.length; ci++) {
      var c = COLORWAYS[ci];
      var tier = Math.min(4, d.tier + c.rarityShift);
      var rarity = RARITY[RARITY_ORDER[tier]];
      var pal = {};
      for (var k in d.pal) if (Object.prototype.hasOwnProperty.call(d.pal, k)) pal[k] = d.pal[k];
      if (c.tint) for (var k2 in c.tint) if (Object.prototype.hasOwnProperty.call(c.tint, k2)) pal[k2] = c.tint[k2];

      var value = Math.round(baseValue[d.tier] * c.valueMul / 2) * 2;
      var prize = {
        id: d.id + ':' + c.id,
        design: d.id,
        colorway: c.id,
        shape: d.shape,
        tier: tier,
        rarity: rarity.id,
        stars: rarity.stars,
        r: Math.round(d.r * R_SCALE * (1 + (c.massMul - 1) * 0.45) * 1000) / 1000,
        mass: Math.round(d.mass * M_SCALE * c.massMul),      // grams
        slip: Math.round(d.slip * c.slipMul * 100) / 100,
        value: value,
        pal: pal,
        shine: !!c.shine,
        crowned: !!c.crowned,
        tags: d.tags,
        sprite: {
          file: SPRITE_BASE + d.sprite.file,
          name: d.sprite.file,
          box: d.sprite.box,
          side: d.sprite.side
        },
        name: {
          en: (c.prefix.en + d.en).trim(),
          zh: c.prefix.zh + d.zh
        }
      };
      PRIZES.push(prize);
      BY_ID[prize.id] = prize;
    }
  }

  /* ---- cabinets --------------------------------------------------------- *
   * Three, not five: with a six-character line, five machines would each stock
   * almost the same pile. These three are genuinely different games — a gentle
   * one to learn on, a mixed one, and an endgame cabinet where most of the pile
   * is Epic. `mix` is a spawn weight per design tier.                       */
  var MACHINES = [
    {
      id: 'starter', name: { en: 'FURI STARTER', zh: 'FURI 入門機' },
      sub: { en: 'Breath, voice and ground', zh: '呼吸、心聲與安定' },
      creditCost: 1, count: 26, mix: [58, 30, 10, 2, 0],
      tags: ['breath', 'voice', 'ground'], seed: 20260328,
      art: { body: '#6AC9CD', body2: '#3E8F94', trim: '#FEC82A', led: '#73FFC7' }
    },
    {
      id: 'monsterpit', name: { en: 'MONSTER PIT', zh: '怪獸深坑' },
      sub: { en: 'All six, and worse grip', zh: '六隻都在，更難夾' },
      creditCost: 3, count: 26, mix: [10, 24, 34, 26, 6],
      tags: ['awareness', 'voice', 'breath', 'ground', 'create', 'flow'], seed: 771103,
      art: { body: '#F389A0', body2: '#B8546A', trim: '#FDFEFD', led: '#FF6BD4' }
    },
    {
      id: 'legends', name: { en: 'FURI LEGENDS', zh: 'FURI 傳說' },
      sub: { en: 'Mostly Epic. Very hard.', zh: '以史詩為主，極難。' },
      creditCost: 6, count: 22, mix: [0, 4, 18, 44, 34],
      tags: ['awareness', 'voice', 'breath', 'ground', 'create', 'flow'], seed: 999983,
      art: { body: '#1C1F26', body2: '#0B0C10', trim: '#FEC308', led: '#FEC308' }
    }
  ];

  /* ---- helpers ---------------------------------------------------------- */

  function hasTag(prize, tags) {
    for (var i = 0; i < tags.length; i++) {
      for (var k = 0; k < prize.tags.length; k++) if (tags[i] === prize.tags[k]) return true;
    }
    return false;
  }

  /* Build the pile for a machine.  Deterministic given the machine's seed and
   * the player's luck upgrade, so re-entering a cabinet is not a free re-roll
   * of the whole pile.                                                       */
  function spawnPile(machine, rng, luck) {
    var pool = [];
    for (var i = 0; i < PRIZES.length; i++) {
      var p = PRIZES[i];
      if (!hasTag(p, machine.tags)) continue;
      var w = machine.mix[p.tier];
      if (w <= 0) continue;
      if (luck) w *= (1 + luck * 0.05 * p.tier);
      for (var n = 0; n < Math.max(1, Math.round(w)); n++) pool.push(p);
    }
    if (!pool.length) pool = PRIZES.slice();

    var out = [];
    for (var s = 0; s < machine.count; s++) {
      out.push(pool[Math.floor(rng.next() * pool.length) % pool.length]);
    }
    return out;
  }

  function byId(id) { return BY_ID[id] || null; }
  function machineById(id) {
    for (var i = 0; i < MACHINES.length; i++) if (MACHINES[i].id === id) return MACHINES[i];
    return null;
  }
  function tierOf(prize) { return prize ? prize.tier : 0; }

  /* every prize a machine could ever stock, for the collection's progress bar */
  function catalogueFor(machine) {
    var out = [];
    for (var i = 0; i < PRIZES.length; i++) if (hasTag(PRIZES[i], machine.tags)) out.push(PRIZES[i]);
    return out;
  }

  /* every sprite the game needs, deduplicated, for the preloader */
  function sprites() {
    var seen = {}, out = [];
    for (var i = 0; i < PRIZES.length; i++) {
      var s = PRIZES[i].sprite;
      if (s && !seen[s.file]) { seen[s.file] = 1; out.push(s); }
    }
    return out;
  }

  NS.CAT = {
    DESIGNS: DESIGNS,
    COLORWAYS: COLORWAYS,
    PRIZES: PRIZES,
    BY_ID: BY_ID,
    MACHINES: MACHINES,
    byId: byId,
    machineById: machineById,
    spawnPile: spawnPile,
    hasTag: hasTag,
    catalogueFor: catalogueFor,
    sprites: sprites,
    baseValue: baseValue,
    R_SCALE: R_SCALE,
    SPRITE_BASE: SPRITE_BASE
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = NS.CAT;
})(typeof globalThis !== 'undefined' ? globalThis : this);
