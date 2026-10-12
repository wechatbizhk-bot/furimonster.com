/* =========================================================================
 * assets/js/games.js — shared runtime for the games on this site
 *
 * Two jobs, both small:
 *
 *   1. Fill every [data-best] slot with the visitor's own best score, read
 *      from localStorage. Only games that really keep a score get a slot, so
 *      this never shows a number that can never change.
 *
 *   2. Run "Guess the Guardian" (play/guess.html) when that page is present.
 *
 * The guessing game is built entirely from the verified official artwork in
 * assets/img/art — the same files the character galleries use. The list of
 * variants is written into the page as JSON by tools/build.js, which scans the
 * art directory, so the game can never point at an image that is not there.
 *
 * Nothing here loads anything third-party, and no score leaves the device.
 * ========================================================================= */
(function (root) {
  'use strict';

  var doc = root.document;
  if (!doc) return;

  /* ---------- tiny helpers ---------------------------------------------- */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }
  function t(key) {
    return (root.FM && root.FM.i18n) ? root.FM.i18n.t(key) : key;
  }
  function pick(field) {
    if (root.FM && root.FM.i18n) return root.FM.i18n.pick(field);
    return (field && (field.en || field)) || '';
  }
  function locale() {
    return (root.FM && root.FM.i18n) ? root.FM.i18n.getLocale() : 'en';
  }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function now() {
    return (root.performance && root.performance.now)
      ? root.performance.now() : Date.now();
  }
  function track(name, params) {
    if (root.FM && root.FM.analytics) root.FM.analytics.track(name, params);
  }
  function rootPrefix() {
    return (root.FM && root.FM.chrome && root.FM.chrome.prefix)
      ? root.FM.chrome.prefix() : '';
  }
  function shuffled(a) {
    var out = a.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  /* ===================================================================== *
   * shared sound for the browser games
   *
   * Synthesised, like the claw cabinet: nothing to 404, and nothing plays
   * until the first tap or key (autoplay policy). Default is on. M toggles
   * it, and the choice stays on this device. Visual reduced-motion is
   * handled by each game separately and is left alone here.
   * ===================================================================== */
  var SFX_KEY = 'fm.games.muted';
  var sfxState = { ctx: null, master: null, muted: false };

  function sfxStoredMuted() {
    var s = store();
    return !!(s && s.getItem(SFX_KEY) === '1');
  }
  function sfxIsMuted() { return sfxState.muted || sfxStoredMuted(); }
  function paintSfxButtons() {
    $$('.fm-sfx').forEach(function (b) {
      var muted = sfxIsMuted();
      b.textContent = muted ? 'MUTED' : 'SOUND';
      b.setAttribute('aria-pressed', muted ? 'true' : 'false');
    });
  }
  function sfxSetMuted(on) {
    sfxState.muted = !!on;
    var s = store();
    try { if (s) s.setItem(SFX_KEY, on ? '1' : '0'); } catch (e) {}
    paintSfxButtons();
  }
  function sfxUnlock() {
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    if (!sfxState.ctx) {
      try { sfxState.ctx = new AC(); } catch (e) { return null; }
      sfxState.master = sfxState.ctx.createGain();
      sfxState.master.gain.value = 0.8;
      sfxState.master.connect(sfxState.ctx.destination);
    }
    if (sfxState.ctx.state === 'suspended') {
      try { sfxState.ctx.resume(); } catch (e) {}
    }
    return sfxState.ctx;
  }
  function sfxTone(freq, dur, type, gain, when) {
    var ctx = sfxState.ctx;
    if (!ctx || sfxIsMuted()) return;
    var t0 = when === undefined ? ctx.currentTime : when;
    var o = ctx.createOscillator();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxState.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sfxPlay(name) {
    sfxUnlock();
    var ctx = sfxState.ctx;
    /* Schedule even while the context is still flipping from suspended to
     * running. The resume() in this same gesture is what makes it audible;
     * bailing out here drops the very sound the tap was supposed to unlock. */
    if (!ctx || sfxIsMuted()) return;
    var t = ctx.currentTime;
    if (name === 'start' || name === 'ok') {
      sfxTone(523, 0.08, 'square', 0.1, t);
      sfxTone(784, 0.12, 'square', 0.09, t + 0.07);
    } else if (name === 'no') {
      sfxTone(196, 0.14, 'square', 0.1, t);
      sfxTone(146, 0.16, 'triangle', 0.08, t + 0.09);
    } else if (name === 'tick') {
      sfxTone(880, 0.04, 'square', 0.06, t);
    } else {
      sfxTone(660, 0.05, 'square', 0.08, t);
    }
  }
  function sfxToggle() {
    if (sfxIsMuted()) {
      sfxSetMuted(false);
      sfxUnlock();
      sfxPlay('tick');
    } else {
      sfxPlay('tick');
      sfxSetMuted(true);
    }
  }
  /* After Start, the instructions panel collapses and the board jumps up.
   * A fixed header then covers the top row, so taps and swipes hit the nav
   * instead of a tile. Pull the play panel just clear of that header. */
  function revealBelowHeader(node) {
    if (!node || !node.getBoundingClientRect) return;
    var header = doc.querySelector('.site-header');
    var h = 0;
    if (header) {
      var hs = header.getBoundingClientRect();
      if (hs.height > 0 && hs.bottom > 0) h = hs.bottom;
    }
    var top = node.getBoundingClientRect().top;
    if (top < h + 8) {
      var y = (root.scrollY || root.pageYOffset || 0) + top - h - 12;
      try { root.scrollTo(0, Math.max(0, y)); } catch (e) {}
    }
  }

  function mountSfx(host) {
    if (!host || host.querySelector('.fm-sfx')) return;
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--ghost btn--sm fm-sfx';
    b.setAttribute('aria-label', 'Sound');
    b.addEventListener('click', function () { sfxUnlock(); sfxToggle(); });
    host.insertBefore(b, host.firstChild);
    host.addEventListener('pointerdown', function () { sfxUnlock(); }, { passive: true });
    paintSfxButtons();
  }

  /* ===================================================================== *
   * 1. best scores
   * ===================================================================== */
  function store() {
    try {
      var s = root.localStorage;
      if (!s) return null;
      s.setItem('fm.probe', '1');
      s.removeItem('fm.probe');
      return s;
    } catch (e) { return null; }
  }

  function best(key) {
    var s = store();
    if (!s || !key) return 0;
    var v = parseInt(s.getItem(key), 10);
    return (isFinite(v) && v > 0) ? v : 0;
  }

  /* returns true when this is a new best */
  function saveBest(key, value) {
    var s = store();
    if (!s || !key || !(value > 0)) return false;
    if (value <= best(key)) return false;
    try { s.setItem(key, String(value)); } catch (e) { return false; }
    return true;
  }

  function renderBestSlots() {
    var slots = $$('[data-best]');
    if (!slots.length) return;
    slots.forEach(function (el) {
      var v = best(el.getAttribute('data-best'));
      el.textContent = v ? t('game.best') + ' ' + v : t('game.notPlayed');
    });
  }

  /* ===================================================================== *
   * 2. Guess the Guardian
   * ===================================================================== */

  /* score for answering when the artwork has cleared this far (0..1) */
  var TOP = 100;          /* answering instantly */
  var FLOOR = 20;         /* answering once it is fully clear */
  var CLEAR_MS = 9000;    /* time from "almost impossible" to fully clear */
  var ROUNDS = 10;
  var STREAK_STEP = 5;    /* bonus per consecutive correct answer */
  var STREAK_CAP = 5;     /* ... capped at 5 in a row */
  var BEST_KEY = 'fm.guess.best';

  function worth(progress) {
    return Math.max(FLOOR, Math.round(TOP * (1 - progress)));
  }

  function createGuess() {
    var host = $('#gg');
    if (!host) return null;

    var manifestEl = $('#fm-art-manifest');
    var artMap = {};
    if (manifestEl) {
      try { artMap = JSON.parse(manifestEl.textContent || '{}') || {}; }
      catch (e) { artMap = {}; }
    }
    var chars = (root.FM && root.FM.data && root.FM.data.characters) || [];

    /* One pool entry per official artwork file. A character with three
     * expression variants therefore appears three times, which is what makes
     * the game harder than simply learning six silhouettes. */
    var pool = [];
    chars.forEach(function (ch) {
      (artMap[ch.slug] || []).forEach(function (src) {
        pool.push({ slug: ch.slug, src: src });
      });
    });

    var el = {
      start: $('#ggStart'), startBtn: $('#ggStartBtn'),
      board: $('#ggBoard'), end: $('#ggEnd'),
      round: $('#ggRound'), score: $('#ggScore'), streak: $('#ggStreak'),
      best: $('#ggBest'),
      stage: $('#ggStage'), img: $('#ggImg'), bar: $('#ggBar'),
      points: $('#ggPoints'), tier: $('#ggTier'), answer: $('#ggAnswer'),
      msg: $('#ggMsg'), options: $('#ggOptions'), next: $('#ggNext'),
      quit: $('#ggQuit'),
      endScore: $('#ggEndScore'), endAcc: $('#ggEndAcc'), endBest: $('#ggEndBest'),
      again: $('#ggAgainBtn')
    };

    /* Without at least four characters there is no four-option question, and
     * without artwork there is no question at all. Rather than render a game
     * that cannot be played, the whole block stays hidden and the page's
     * written description stands on its own. */
    if (!el.board || !el.start || !el.end || pool.length < 4 || chars.length < 4) {
      if (host) host.setAttribute('hidden', '');
      return null;
    }

    var bySlug = {};
    chars.forEach(function (ch) { bySlug[ch.slug] = ch; });

    var st = {
      round: 0, score: 0, streak: 0, correct: 0,
      answer: null, last: null, locked: true, wasBest: false,
      t0: 0, raf: 0, timer: 0, iAnswer: -1
    };

    var BASE = rootPrefix();
    var reduced = false;
    try {
      reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { reduced = false; }

    function nameOf(slug) {
      var ch = bySlug[slug];
      return ch ? pick(ch.nameAlt) : slug;
    }

    function stopAnim() {
      if (st.raf) { root.cancelAnimationFrame(st.raf); st.raf = 0; }
    }
    function stopTimer() {
      if (st.timer) { root.clearTimeout(st.timer); st.timer = 0; }
    }
    function clearMsg() { el.msg.textContent = ''; }

    /* ---- HUD ---- */
    function hud() {
      el.round.textContent = String(st.round);
      el.score.textContent = String(st.score);
      el.streak.textContent = String(st.streak);
      var b = best(BEST_KEY);
      if (st.score > b) b = st.score;
      el.best.textContent = b ? String(b) : '0';
    }

    /* ---- options ---- */
    function buildOptions(answerSlug) {
      var correct = bySlug[answerSlug];
      var others = shuffled(chars.filter(function (c) {
        return c.slug !== answerSlug;
      })).slice(0, 3);
      var opts = shuffled([correct].concat(others));
      st.iAnswer = opts.indexOf(correct);

      el.options.innerHTML = opts.map(function (c, i) {
        var sub = locale() === 'en' ? '' :
          '<span class="gg-opt-en">' + esc(c.name) + '</span>';
        return '<button class="gg-opt" type="button" data-slug="' + esc(c.slug) + '"' +
          ' style="--accent:' + esc(c.theme && c.theme.base ? c.theme.base : 'var(--fur-gold)') + '">' +
          '<span class="gg-opt-key">' + (i + 1) + '</span>' +
          '<span class="gg-opt-name">' + esc(pick(c.nameAlt)) + '</span>' +
          sub +
          '</button>';
      }).join('');
    }

    /* ---- the blur reveal ---- */
    function frame() {
      if (st.locked) return;
      var p = Math.min(1, (now() - st.t0) / CLEAR_MS);
      el.img.style.filter = 'blur(' + ((1 - p) * 26).toFixed(2) + 'px)' +
        ' saturate(' + (0.55 + 0.45 * p).toFixed(2) + ')';
      el.bar.style.width = (p * 100).toFixed(1) + '%';
      el.points.textContent = String(worth(p));
      el.tier.textContent = t(p < 0.34 ? 'game.tier1' : (p < 0.72 ? 'game.tier2' : 'game.tier3'));
      st.raf = p < 1 ? root.requestAnimationFrame(frame) : 0;
    }

    /* ---- rounds ---- */
    function nextRound() {
      if (st.round >= ROUNDS) { finish(); return; }
      st.round++;

      var cand = pool.filter(function (p) { return p.slug !== st.last; });
      if (!cand.length) cand = pool;
      var item = cand[Math.floor(Math.random() * cand.length)];

      st.last = item.slug;
      st.answer = item.slug;
      st.locked = false;
      st.t0 = now();

      clearMsg();
      stopTimer();
      stopAnim();

      el.img.style.filter = reduced ? 'blur(14px)' : 'blur(26px) saturate(0.55)';
      el.img.setAttribute('src', BASE + item.src);
      el.img.setAttribute('alt', t('game.a11yImg'));
      el.answer.setAttribute('hidden', '');
      el.next.setAttribute('hidden', '');
      el.bar.style.width = '0%';
      el.points.textContent = String(TOP);
      el.tier.textContent = t('game.tier1');
      el.options.removeAttribute('data-done');

      buildOptions(item.slug);
      hud();

      if (reduced) {
        /* keep the mechanic, drop the animation: the artwork is simply shown
         * blurred and clears the moment the visitor acts */
        st.raf = 0;
      } else {
        st.raf = root.requestAnimationFrame(frame);
      }
    }

    function resolve(slug, btn) {
      if (st.locked) return;
      st.locked = true;
      stopAnim();
      stopTimer();

      var p = reduced ? 0 : Math.min(1, (now() - st.t0) / CLEAR_MS);
      var ok = slug === st.answer;

      el.img.style.filter = 'none';
      el.bar.style.width = '100%';
      el.points.textContent = reduced ? String(TOP) : String(worth(p));
      el.tier.textContent = t('game.tier3');
      el.options.setAttribute('data-done', '1');

      $$('.gg-opt', el.options).forEach(function (b) {
        b.disabled = true;
        var s = b.getAttribute('data-slug');
        if (s === st.answer) b.classList.add('is-right');
        else if (b === btn) b.classList.add('is-wrong');
      });

      var ch = bySlug[st.answer];
      el.answer.innerHTML =
        '<span class="gg-answer-k">' + esc(t('game.itWas')) + '</span>' +
        '<span class="gg-answer-n">' + esc(nameOf(st.answer)) + '</span>';
      el.answer.removeAttribute('hidden');

      if (ok) {
        sfxPlay('ok');
        st.streak++;
        st.correct++;
        var gain = (reduced ? TOP : worth(p)) +
          Math.min(st.streak - 1, STREAK_CAP) * STREAK_STEP;
        st.score += gain;
        el.msg.textContent = t('game.correct') + ' · +' + gain;
        el.msg.className = 'gg-msg is-ok';
      } else {
        sfxPlay('no');
        st.streak = 0;
        el.msg.textContent = t('game.wrong');
        el.msg.className = 'gg-msg is-no';
      }

      hud();
      el.next.removeAttribute('hidden');
      el.next.focus({ preventScroll: true });

      /* self-advancing keeps a run moving, but the button is already there for
       * anyone who wants to read the answer properly */
      st.timer = root.setTimeout(advance, 2300);
    }

    function advance() {
      stopTimer();
      if (st.round >= ROUNDS) finish();
      else nextRound();
    }

    /* The end panel is rendered from state rather than written once, so it can
     * be re-rendered when the visitor switches language after finishing. */
    function renderEnd() {
      el.endScore.textContent = String(st.score);
      el.endAcc.textContent = st.correct + ' / ' + ROUNDS;
      var b = best(BEST_KEY);
      el.endBest.textContent = (st.wasBest && st.score >= b)
        ? t('game.newBest')
        : t('game.best') + ' ' + b;
    }

    function finish() {
      stopAnim();
      stopTimer();
      st.locked = true;
      el.board.setAttribute('hidden', '');
      el.end.removeAttribute('hidden');

      st.wasBest = saveBest(BEST_KEY, st.score);
      renderEnd();

      track('game_end', { label: 'guess', value: st.score });
      renderBestSlots();
    }

    function startRun() {
      sfxUnlock();
      sfxPlay('start');
      st.round = 0; st.score = 0; st.streak = 0; st.correct = 0; st.last = null;
      el.start.setAttribute('hidden', '');
      el.end.setAttribute('hidden', '');
      el.board.removeAttribute('hidden');
      track('game_start', { label: 'guess' });
      revealBelowHeader(el.board);
      nextRound();
    }

    /* ---- wiring ---- */
    el.startBtn.addEventListener('click', startRun);
    if (el.again) el.again.addEventListener('click', startRun);
    el.next.addEventListener('click', advance);

    el.quit.addEventListener('click', function () {
      if (st.locked && st.round === 0) { return; }
      finish();
    });

    el.options.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.gg-opt');
      if (b) resolve(b.getAttribute('data-slug'), b);
    });

    el.stage.addEventListener('click', function () {
      if (st.locked && !el.next.hasAttribute('hidden')) advance();
    });

    doc.addEventListener('keydown', function (e) {
      if (el.board.hasAttribute('hidden')) return;
      if (e.key >= '1' && e.key <= '4') {
        var b = $$('.gg-opt', el.options)[parseInt(e.key, 10) - 1];
        if (b && !b.disabled) { e.preventDefault(); resolve(b.getAttribute('data-slug'), b); }
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && st.locked &&
          !el.next.hasAttribute('hidden')) {
        e.preventDefault();
        advance();
      }
    });

    /* A backgrounded tab stops the animation clock, which would otherwise make
     * the artwork snap into focus the moment the visitor came back. Restarting
     * the clock on return keeps the timing honest. */
    doc.addEventListener('visibilitychange', function () {
      if (!doc.hidden && !st.locked) {
        st.t0 = now();
        if (!reduced && !st.raf) st.raf = root.requestAnimationFrame(frame);
      }
    });

    /* translated text inside the game is re-rendered when the visitor switches
     * language mid-run — app.js handles the switch first, so read after it */
    doc.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.lang-switch button')) return;
      root.setTimeout(function () {
        if (!el.board.hasAttribute('hidden')) {
          el.img.setAttribute('alt', t('game.a11yImg'));
          if (st.locked) {
            $$('.gg-opt', el.options).forEach(function (b) {
              if (b.getAttribute('data-slug') === st.answer) b.classList.add('is-right');
            });
            el.answer.innerHTML =
              '<span class="gg-answer-k">' + esc(t('game.itWas')) + '</span>' +
              '<span class="gg-answer-n">' + esc(nameOf(st.answer)) + '</span>';
            el.tier.textContent = t('game.tier3');
          } else {
            el.tier.textContent = t('game.tier1');
          }
          hud();
        }
        if (!el.end.hasAttribute('hidden')) renderEnd();
        renderBestSlots();
      }, 0);
    });

    return { start: startRun, render: renderBestSlots };
  }

  /* ===================================================================== *
   * 3. FURI MATCH
   * ===================================================================== */

  /* Six tile types is not a tuned number: it is the six guardians, and six is
   * also the count a board this size needs to be neither trivial nor stuck.
   * No tile is invented to fill the set. */
  var MM_COLS = 7;
  var MM_ROWS = 7;
  var MM_MOVES = 30;
  var MM_PER_TILE = 10;
  var MM_CASCADE_CAP = 8;      /* chain multiplier stops doubling here */

  function createMatch() {
    var host = $('#mm');
    if (!host) return null;

    var manifestEl = $('#fm-art-manifest');
    var artMap = {};
    if (manifestEl) {
      try { artMap = JSON.parse(manifestEl.textContent || '{}') || {}; }
      catch (e) { artMap = {}; }
    }
    var chars = (root.FM && root.FM.data && root.FM.data.characters) || [];

    var types = chars.map(function (ch) {
      var files = artMap[ch.slug] || [];
      return {
        slug: ch.slug,
        name: pick(ch.nameAlt),
        latin: ch.name,
        src: files.length ? (rootPrefix() + files[0]) : '',
        colour: (ch.theme && ch.theme.base) || 'var(--fur-gold)'
      };
    }).filter(function (t) { return t.src; });

    var el = {
      start: $('#mmStart'), startBtn: $('#mmStartBtn'),
      wrap: $('#mmBoardWrap'), grid: $('#mmGrid'),
      moves: $('#mmMoves'), score: $('#mmScore'),
      chain: $('#mmChain'), best: $('#mmBest'),
      msg: $('#mmMsg'), endBtn: $('#mmEnd'),
      endPanel: $('#mmEndPanel'), endScore: $('#mmEndScore'),
      endChain: $('#mmEndChain'), endBest: $('#mmEndBest'), again: $('#mmAgain')
    };

    /* Without six usable tile faces there is no board worth showing, so the
     * block stays hidden and the written description stands alone. */
    if (!el.grid || !el.start || !el.endPanel || types.length < 4) {
      if (host) host.setAttribute('hidden', '');
      return null;
    }

    var N = MM_COLS * MM_ROWS;
    var EMPTY = -1;
    var st = {
      board: new Array(N).fill(0),
      sel: null, cursor: 0, moves: MM_MOVES, score: 0,
      chain: 0, bestChain: 0, busy: true, wasBest: false, timer: 0
    };
    var reduced = false;
    try {
      reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { reduced = false; }

    var px = function (r, c) { return r * MM_COLS + c; };
    var rowOf = function (i) { return Math.floor(i / MM_COLS); };
    var colOf = function (i) { return i % MM_COLS; };
    function pause(ms) {
      return new Promise(function (res) {
        st.timer = root.setTimeout(res, reduced ? 0 : ms);
      });
    }

    /* ---- board maths --------------------------------------------------- */

    function runsIn(b) {
      var hit = new Set();
      var r, c, run, i;
      /* horizontal */
      for (r = 0; r < MM_ROWS; r++) {
        run = 1;
        for (c = 1; c <= MM_COLS; c++) {
          var same = c < MM_COLS && b[px(r, c)] !== EMPTY && b[px(r, c)] === b[px(r, c - 1)];
          if (same) { run++; continue; }
          if (run >= 3) for (i = c - run; i < c; i++) hit.add(px(r, i));
          run = 1;
        }
      }
      /* vertical */
      for (c = 0; c < MM_COLS; c++) {
        run = 1;
        for (r = 1; r <= MM_ROWS; r++) {
          var same2 = r < MM_ROWS && b[px(r, c)] !== EMPTY && b[px(r, c)] === b[px(r - 1, c)];
          if (same2) { run++; continue; }
          if (run >= 3) for (i = r - run; i < r; i++) hit.add(px(i, c));
          run = 1;
        }
      }
      return hit;
    }

    function swapIn(b, a, d) { var t = b[a]; b[a] = b[d]; b[d] = t; }

    /* a swap is legal when it clears something — the board must never reach a
     * state where no move exists */
    function anyMove(b) {
      var i, r, c;
      for (i = 0; i < N; i++) {
        r = rowOf(i); c = colOf(i);
        if (c + 1 < MM_COLS) {
          swapIn(b, i, i + 1);
          var ok = runsIn(b).size > 0;
          swapIn(b, i, i + 1);
          if (ok) return true;
        }
        if (r + 1 < MM_ROWS) {
          swapIn(b, i, i + MM_COLS);
          var ok2 = runsIn(b).size > 0;
          swapIn(b, i, i + MM_COLS);
          if (ok2) return true;
        }
      }
      return false;
    }

    function freshBoard() {
      var b, guard = 0;
      do {
        b = new Array(N);
        for (var i = 0; i < N; i++) b[i] = Math.floor(Math.random() * types.length);
        /* clear any match the random fill created, so the opening board is
         * quiet and the visitor sees their own first move, not a free cascade */
        var g2 = 0;
        while (runsIn(b).size && g2++ < 400) {
          runsIn(b).forEach(function (k) { b[k] = Math.floor(Math.random() * types.length); });
        }
      } while (!anyMove(b) && guard++ < 60);
      return b;
    }

    function gravity(b) {
      for (var c = 0; c < MM_COLS; c++) {
        var write = MM_ROWS - 1;
        for (var r = MM_ROWS - 1; r >= 0; r--) {
          if (b[px(r, c)] === EMPTY) continue;
          b[px(write, c)] = b[px(r, c)];
          if (write !== r) b[px(r, c)] = EMPTY;
          write--;
        }
        while (write >= 0) { b[px(write, c)] = Math.floor(Math.random() * types.length); write--; }
      }
    }

    /* ---- rendering ----------------------------------------------------- */

    var cellEls = [];
    function buildGrid() {
      el.grid.innerHTML = '';
      cellEls = new Array(N);
      for (var i = 0; i < N; i++) {
        var d = doc.createElement('div');
        d.className = 'mm-cell';
        d.setAttribute('role', 'gridcell');
        d.setAttribute('data-r', String(rowOf(i)));
        d.setAttribute('data-c', String(colOf(i)));
        var t = doc.createElement('div');
        t.className = 'mm-tile';
        var img = doc.createElement('img');
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.decoding = 'async';
        img.width = 800; img.height = 800;
        t.appendChild(img);
        d.appendChild(t);
        el.grid.appendChild(d);
        cellEls[i] = { cell: d, tile: t, img: img, type: -2 };
      }
    }

    function paint(flash) {
      for (var i = 0; i < N; i++) {
        var t = st.board[i];
        var cell = cellEls[i];
        if (cell.type !== t) {
          cell.type = t;
          if (t === EMPTY) {
            cell.img.removeAttribute('src');
            cell.tile.setAttribute('data-t', 'empty');
          } else {
            cell.img.setAttribute('src', types[t].src);
            cell.tile.setAttribute('data-t', String(t));
            cell.tile.style.setProperty('--tc', types[t].colour);
          }
          cell.cell.setAttribute('aria-label', t === EMPTY ? '' :
            (types[t].name + ' — ' + (locale() === 'en' ? 'r' : '') + (rowOf(i) + 1) + ',' + (colOf(i) + 1)));
        }
        cell.tile.className = 'mm-tile' +
          (st.sel === i ? ' is-sel' : '') +
          (st.cursor === i ? ' is-cursor' : '') +
          (flash && flash.has(i) ? ' is-clear' : '');
      }
    }

    function hud() {
      el.moves.textContent = String(st.moves);
      el.score.textContent = String(st.score);
      el.chain.textContent = String(st.bestChain);
      var b = best(MM_BEST_KEY);
      if (st.score > b) b = st.score;
      el.best.textContent = String(b || 0);
    }

    function msg(text, cls) {
      el.msg.textContent = text;
      el.msg.className = 'gg-msg' + (cls ? ' ' + cls : '');
    }

    /* ---- one move ------------------------------------------------------ */

    /* returns the number of tiles cleared in total for this move */
    function settle() {
      var total = 0;
      st.chain = 0;
      return new Promise(function (resolve) {
        function step() {
          var hits = runsIn(st.board);
          if (!hits.size) { resolve(total); return; }
          st.chain++;
          if (st.chain > st.bestChain) st.bestChain = st.chain;
          var mult = Math.min(Math.pow(2, st.chain - 1), MM_CASCADE_CAP);
          var gain = hits.size * MM_PER_TILE * mult;
          st.score += gain;
          total += hits.size;
          paint(hits);
          if (st.chain > 1) msg(t('game.chain') + ' ' + st.chain + ' · +' + gain, 'is-ok');
          else msg('+' + gain, 'is-ok');
          hud();
          pause(200).then(function () {
            hits.forEach(function (k) { st.board[k] = EMPTY; });
            gravity(st.board);
            paint();
            pause(140).then(step);
          });
        }
        step();
      });
    }

    function trySwap(a, d) {
      if (st.busy) return Promise.resolve(false);
      swapIn(st.board, a, d);
      if (!runsIn(st.board).size) {
        /* put it straight back and do not spend the move — a swap that clears
         * nothing is a nudge, not a turn */
        swapIn(st.board, a, d);
        paint();
        msg(t('game.noMatch'));
        sfxPlay('no');
        return Promise.resolve(false);
      }
      st.busy = true;
      st.sel = null;
      st.moves--;
      hud();
      paint();
      sfxPlay('ok');
      return settle().then(function () {
        if (!anyMove(st.board)) {
          st.board = freshBoard();
          paint();
          msg(t('game.reshuffle'));
        }
        st.busy = false;
        st.sel = null;
        paint();
        hud();
        if (st.moves <= 0) { finish(); return true; }
        return true;
      });
    }

    function finish() {
      if (st.timer) { root.clearTimeout(st.timer); st.timer = 0; }
      st.busy = true;
      el.wrap.setAttribute('hidden', '');
      el.endPanel.removeAttribute('hidden');
      st.wasBest = saveBest(MM_BEST_KEY, st.score);
      renderEnd();
      track('game_end', { label: 'match', value: st.score });
      renderBestSlots();
    }

    function renderEnd() {
      el.endScore.textContent = String(st.score);
      el.endChain.textContent = String(st.bestChain);
      var b = best(MM_BEST_KEY);
      el.endBest.textContent = (st.wasBest && st.score >= b)
        ? t('game.newBest') : t('game.best') + ' ' + b;
    }

    function startRun() {
      sfxUnlock();
      sfxPlay('start');
      if (st.timer) { root.clearTimeout(st.timer); st.timer = 0; }
      st.board = freshBoard();
      st.sel = null; st.cursor = px(0, 0);
      st.moves = MM_MOVES; st.score = 0; st.chain = 0; st.bestChain = 0;
      st.busy = false; st.wasBest = false;
      el.start.setAttribute('hidden', '');
      el.endPanel.setAttribute('hidden', '');
      el.wrap.removeAttribute('hidden');
      buildGrid();
      paint();
      hud();
      msg('');
      track('game_start', { label: 'match' });
      revealBelowHeader(el.wrap);
      try { el.grid.focus({ preventScroll: true }); } catch (e) {}
    }

    /* ---- input --------------------------------------------------------- */

    function neighbours(i) {
      var r = rowOf(i), c = colOf(i);
      return { up: r > 0 ? i - MM_COLS : -1, down: r < MM_ROWS - 1 ? i + MM_COLS : -1,
               left: c > 0 ? i - 1 : -1, right: c < MM_COLS - 1 ? i + 1 : -1 };
    }

    function tap(i) {
      if (st.busy) return;
      if (st.sel === null) { st.sel = i; st.cursor = i; paint(); return; }
      if (st.sel === i) { st.sel = null; paint(); return; }
      var n = neighbours(st.sel);
      var adjacent = n.up === i || n.down === i || n.left === i || n.right === i;
      if (adjacent) {
        var a = st.sel;
        st.cursor = i;
        trySwap(a, i);
      } else {
        st.sel = i; st.cursor = i; paint();
      }
    }

    el.grid.addEventListener('click', function (e) {
      if (ignoreClick) { ignoreClick = false; return; }
      sfxUnlock();
      var cell = e.target.closest && e.target.closest('.mm-cell');
      if (!cell) return;
      tap(px(parseInt(cell.getAttribute('data-r'), 10), parseInt(cell.getAttribute('data-c'), 10)));
    });

    /* A tap is the click handler. A drag past 26px swaps with the neighbour
     * in that direction (both axes). The board sets touch-action: none, so
     * the page scrolls from outside the grid. */
    var touchStart = null;
    var ignoreClick = false;
    el.grid.addEventListener('touchstart', function (e) {
      sfxUnlock();
      var cell = e.target.closest && e.target.closest('.mm-cell');
      if (!cell || !e.touches || !e.touches.length) { touchStart = null; return; }
      touchStart = {
        x: e.touches[0].clientX, y: e.touches[0].clientY,
        i: px(parseInt(cell.getAttribute('data-r'), 10), parseInt(cell.getAttribute('data-c'), 10))
      };
    }, { passive: true });
    el.grid.addEventListener('touchend', function (e) {
      if (!touchStart) return;
      var t0 = touchStart; touchStart = null;
      var t1 = e.changedTouches && e.changedTouches[0];
      if (!t1) return;
      var dx = t1.clientX - t0.x, dy = t1.clientY - t0.y;
      if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return; /* a tap: the click handler swaps */
      var n = neighbours(t0.i);
      var dir = Math.abs(dx) >= Math.abs(dy)
        ? (dx > 0 ? n.right : n.left)
        : (dy > 0 ? n.down : n.up);
      if (dir >= 0 && !st.busy) {
        ignoreClick = true;
        st.sel = null;
        st.cursor = t0.i;
        trySwap(t0.i, dir);
      }
    }, { passive: true });

    el.grid.addEventListener('keydown', function (e) {
      var k = e.key;
      var n = neighbours(st.cursor);
      var handled = true;
      if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
        var target = k === 'ArrowUp' ? n.up : k === 'ArrowDown' ? n.down
          : k === 'ArrowLeft' ? n.left : n.right;
        if (st.sel !== null && target >= 0 && !st.busy) {
          st.cursor = target;
          trySwap(st.sel, target);
        } else if (target >= 0) {
          st.cursor = target;
          paint();
        }
      } else if (k === ' ' || k === 'Enter') {
        if (st.sel === null) st.sel = st.cursor;
        else st.sel = null;
        paint();
      } else if (k === 'Escape') {
        st.sel = null;
        paint();
      } else {
        handled = false;
      }
      if (handled) e.preventDefault();
    });

    el.startBtn.addEventListener('click', startRun);
    if (el.again) el.again.addEventListener('click', startRun);
    el.endBtn.addEventListener('click', function () {
      if (el.wrap.hasAttribute('hidden')) return;
      finish();
    });

    doc.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.lang-switch button')) return;
      root.setTimeout(function () {
        if (!el.wrap.hasAttribute('hidden')) {
          paint();
          if (st.busy && !st.moves) msg('');
          hud();
        }
        if (!el.endPanel.hasAttribute('hidden')) renderEnd();
        renderBestSlots();
      }, 0);
    });

    return { start: startRun, render: renderBestSlots };
  }

  var MM_BEST_KEY = 'fm.match.best';

  /* ===================================================================== *
   * 4. Emotion Match
   * ===================================================================== */

  /* Eighteen faces: the six guardians with all three of their official
   * expression variants. Each is dealt exactly twice, which is what makes the
   * board 36 cards and eighteen pairs. */
  var ME_PAIRS = 18;
  var ME_PER_MATCH = 100;
  var ME_PER_MISS = 10;
  var ME_BEST_KEY = 'fm.memory.best';

  function createMemory() {
    var host = $('#me');
    if (!host) return null;

    var manifestEl = $('#fm-art-manifest');
    var artMap = {};
    if (manifestEl) {
      try { artMap = JSON.parse(manifestEl.textContent || '{}') || {}; }
      catch (e) { artMap = {}; }
    }
    var chars = (root.FM && root.FM.data && root.FM.data.characters) || [];

    /* one face per official artwork file, so the board is built from the
     * verified art list and cannot contain a drawn substitute */
    var faces = [];
    chars.forEach(function (ch, ci) {
      (artMap[ch.slug] || []).forEach(function (src, vi) {
        faces.push({
          key: ch.slug + '-' + vi,
          src: rootPrefix() + src,
          name: pick(ch.nameAlt),
          latin: ch.name,
          colour: (ch.theme && ch.theme.base) || 'var(--fur-gold)'
        });
      });
    });

    var el = {
      start: $('#meStart'), startBtn: $('#meStartBtn'),
      wrap: $('#meBoardWrap'), grid: $('#meGrid'),
      pairs: $('#mePairs'), turns: $('#meTurns'),
      score: $('#meScore'), best: $('#meBest'),
      msg: $('#meMsg'), endBtn: $('#meEnd'),
      endPanel: $('#meEndPanel'), endScore: $('#meEndScore'),
      endTurns: $('#meEndTurns'), endBest: $('#meEndBest'), again: $('#meAgain')
    };

    if (!el.grid || !el.start || !el.endPanel || faces.length < ME_PAIRS) {
      if (host) host.setAttribute('hidden', '');
      return null;
    }

    var st = {
      deck: [], up: [], matched: 0, turns: 0, score: 0,
      busy: false, wasBest: false, cursor: 0, timer: 0
    };
    var reduced = false;
    try {
      reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { reduced = false; }

    var cardEls = [];

    function shuffled(a) {
      var out = a.slice();
      for (var i = out.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = out[i]; out[i] = out[j]; out[j] = t;
      }
      return out;
    }

    function hud() {
      el.pairs.textContent = String(st.matched);
      el.turns.textContent = String(st.turns);
      el.score.textContent = String(st.score);
      var b = best(ME_BEST_KEY);
      if (st.score > b) b = st.score;
      el.best.textContent = String(b || 0);
    }

    function msg(text, cls) {
      el.msg.textContent = text;
      el.msg.className = 'gg-msg' + (cls ? ' ' + cls : '');
    }

    function build() {
      /* take the first 18 faces of the pool in canonical order, then deal two
       * of each and shuffle — so the board is always the same 18 expressions
       * and always uses real artwork */
      var pool = faces.slice(0, ME_PAIRS);
      var deck = [];
      pool.forEach(function (face, i) {
        deck.push({ face: face, id: 'p' + i + 'a' });
        deck.push({ face: face, id: 'p' + i + 'b' });
      });
      st.deck = shuffled(deck);

      el.grid.innerHTML = '';
      cardEls = [];
      st.deck.forEach(function (card, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'me-card';
        b.setAttribute('role', 'gridcell');
        b.setAttribute('data-i', String(i));
        b.setAttribute('aria-label', t('game.cardDown'));
        b.style.setProperty('--tc', card.face.colour);
        b.innerHTML =
          '<span class="me-inner">' +
            '<span class="me-back" aria-hidden="true">' + CROWN_SVG + '</span>' +
            '<span class="me-front"><img src="' + esc(card.face.src) + '" alt="" ' +
              'aria-hidden="true" width="800" height="800" decoding="async"></span>' +
          '</span>';
        el.grid.appendChild(b);
        cardEls.push(b);
      });
    }

    function paint() {
      cardEls.forEach(function (b, i) {
        var up = st.up.indexOf(i) !== -1;
        var done = b.getAttribute('data-done') === '1';
        b.className = 'me-card' + (up ? ' is-up' : '') + (done ? ' is-matched' : '');
        if (up || done) b.setAttribute('aria-label', st.deck[i].face.name);
        else b.setAttribute('aria-label', t('game.cardDown'));
      });
    }

    function turn(i) {
      if (st.busy) return;
      var b = cardEls[i];
      if (!b || b.getAttribute('data-done') === '1') return;
      if (st.up.indexOf(i) !== -1) return;           /* already face up */
      sfxPlay('tick');
      st.up.push(i);
      paint();
      if (st.up.length < 2) return;

      st.turns++;
      var a = st.up[0], c = st.up[1];
      if (st.deck[a].face.key === st.deck[c].face.key) {
        st.matched++;
        st.score += ME_PER_MATCH;
        sfxPlay('ok');
        cardEls[a].setAttribute('data-done', '1');
        cardEls[c].setAttribute('data-done', '1');
        st.up = [];
        paint();
        hud();
        msg(t('game.paired') + ' · +' + ME_PER_MATCH, 'is-ok');
        if (st.matched >= ME_PAIRS) finish();
        return;
      }

      st.score = Math.max(0, st.score - ME_PER_MISS);
      sfxPlay('no');
      hud();
      msg(t('game.notPaired') + ' · −' + ME_PER_MISS);
      st.busy = true;
      st.timer = root.setTimeout(function () {
        st.up = [];
        st.busy = false;
        paint();
      }, reduced ? 120 : 850);
    }

    function finish() {
      if (st.timer) { root.clearTimeout(st.timer); st.timer = 0; }
      st.busy = true;
      el.wrap.setAttribute('hidden', '');
      el.endPanel.removeAttribute('hidden');
      st.wasBest = saveBest(ME_BEST_KEY, st.score);
      renderEnd();
      track('game_end', { label: 'memory', value: st.score });
      renderBestSlots();
    }

    function renderEnd() {
      el.endScore.textContent = String(st.score);
      el.endTurns.textContent = String(st.turns);
      var b = best(ME_BEST_KEY);
      el.endBest.textContent = (st.wasBest && st.score >= b)
        ? t('game.newBest') : t('game.best') + ' ' + b;
    }

    function startRun() {
      sfxUnlock();
      sfxPlay('start');
      if (st.timer) { root.clearTimeout(st.timer); st.timer = 0; }
      st.up = []; st.matched = 0; st.turns = 0; st.score = 0;
      st.busy = false; st.wasBest = false; st.cursor = 0;
      el.start.setAttribute('hidden', '');
      el.endPanel.setAttribute('hidden', '');
      el.wrap.removeAttribute('hidden');
      build();
      paint();
      hud();
      msg('');
      track('game_start', { label: 'memory' });
      revealBelowHeader(el.wrap);
      var first = cardEls[0];
      if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
      st.cursor = 0;
    }

    el.grid.addEventListener('click', function (e) {
      sfxUnlock();
      var b = e.target.closest && e.target.closest('.me-card');
      if (!b) return;
      turn(parseInt(b.getAttribute('data-i'), 10));
    });

    /* arrow keys move real focus between cards and the browser's own button
     * activation handles Space and Enter, so no synthetic click is needed */
    el.grid.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight') return;
      var b = e.target.closest && e.target.closest('.me-card');
      if (!b) return;
      var i = parseInt(b.getAttribute('data-i'), 10);
      var cols = 6;
      var r = Math.floor(i / cols), c = i % cols;
      if (k === 'ArrowUp') r = Math.max(0, r - 1);
      if (k === 'ArrowDown') r = Math.min(5, r + 1);
      if (k === 'ArrowLeft') c = Math.max(0, c - 1);
      if (k === 'ArrowRight') c = Math.min(cols - 1, c + 1);
      var next = cardEls[r * cols + c];
      if (next) { next.focus(); st.cursor = r * cols + c; }
      e.preventDefault();
    });

    el.startBtn.addEventListener('click', startRun);
    if (el.again) el.again.addEventListener('click', startRun);
    el.endBtn.addEventListener('click', function () {
      if (el.wrap.hasAttribute('hidden')) return;
      finish();
    });

    doc.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.lang-switch button')) return;
      root.setTimeout(function () {
        if (!el.wrap.hasAttribute('hidden')) { paint(); hud(); }
        if (!el.endPanel.hasAttribute('hidden')) renderEnd();
        renderBestSlots();
      }, 0);
    });

    return { start: startRun, render: renderBestSlots };
  }

  /* the card back: the same three-pointed crown the header brand uses, drawn
   * here so the card back needs no image request */
  var CROWN_SVG =
    '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<path d="M6 27 L6 12 L13 19 L20 7 L27 19 L34 12 L34 27 Z" fill="none" ' +
    'stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<circle cx="13" cy="31" r="2" fill="currentColor"/>' +
    '<circle cx="20" cy="31" r="2" fill="currentColor"/>' +
    '<circle cx="27" cy="31" r="2" fill="currentColor"/>' +
    '</svg>';

  /* ===================================================================== *
   * boot
   * ===================================================================== */
  function boot() {
    sfxState.muted = sfxStoredMuted();
    renderBestSlots();
    createGuess();
    createMatch();
    createMemory();
    mountSfx($('#gg'));
    mountSfx($('#mm'));
    mountSfx($('#me'));
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'm' && e.key !== 'M') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!$('#gg') && !$('#mm') && !$('#me')) return;
      e.preventDefault();
      sfxUnlock();
      sfxToggle();
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  root.FM = root.FM || {};
  root.FM.games = {
    best: best,
    saveBest: saveBest,
    renderBestSlots: renderBestSlots
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
