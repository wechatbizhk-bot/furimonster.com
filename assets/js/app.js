/* =========================================================================
 * assets/js/app.js — FURI MONSTER interactions.
 *
 * Everything here is progressive enhancement. The built HTML already contains
 * all headings, copy and character data in all three languages, so the site
 * is readable and crawlable with JavaScript off. This file adds:
 *   • locale boot + instant switching (no reload)
 *   • reveal-on-scroll
 *   • the Emotion Test and Personality Quiz
 *   • the Relationship Map
 *   • wallpaper / sticker / colouring downloads, generated from art.js
 *   • share buttons (Facebook, Threads, X, copy link)
 *   • form validation + submission with success/error states
 *   • news filtering
 *
 * Every interaction respects prefers-reduced-motion.
 * ========================================================================= */
(function (root) {
  'use strict';

  var FM = root.FM = root.FM || {};
  var doc = root.document;
  var D = FM.data;
  var I = FM.i18n;

  function track(n, p) { if (FM.analytics) FM.analytics.track(n, p); }
  function T(k) { return I.t(k); }
  function P(f) { return I.pick(f); }
  function esc(s) { return FM.chrome ? FM.chrome.esc(s) : String(s); }
  function reduced() {
    return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ===================================================================== *
   * locale
   * ===================================================================== */
  var rerenderers = [];

  function applyLocale(loc) {
    I.setLocale(loc);
    doc.documentElement.setAttribute('data-locale', loc);
    doc.documentElement.setAttribute('lang', loc);
    $$('.lang-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-locale') === loc));
    });
    rerenderers.forEach(function (fn) { try { fn(loc); } catch (e) {} });
  }

  function wireLangSwitch() {
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.lang-switch button');
      if (!b) return;
      var loc = b.getAttribute('data-locale');
      if (loc === I.getLocale()) return;
      applyLocale(loc);
      track('language_switch', { label: loc });
    });
  }

  /* ===================================================================== *
   * reveal on scroll
   * ===================================================================== */
  function wireReveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (reduced() || !('IntersectionObserver' in root)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ===================================================================== *
   * Emotion Test
   * ===================================================================== */
  function initEmotionLab() {
    var host = $('#emotion-lab');
    if (!host) return;
    var btns = $('#emotion-buttons');
    var result = $('#emotion-result');
    var current = null;

    function paint() {
      var html = '';
      D.emotions.forEach(function (em) {
        html += '<button class="emotion-btn" type="button" role="listitem" data-emotion="' + em.id +
          '" aria-pressed="' + (current === em.id) + '">' +
          '<span class="emo" aria-hidden="true">' + em.emoji + '</span>' +
          '<span class="lbl">' + P(em.label) + '</span></button>';
      });
      btns.innerHTML = html;
    }

    function show(id) {
      var em = null;
      D.emotions.forEach(function (e) { if (e.id === id) em = e; });
      if (!em) return;
      var ch = D.bySlug(em.character);
      if (!ch) return;
      current = id;
      $$('.emotion-btn', btns).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-emotion') === id));
      });
      result.style.setProperty('--accent', ch.theme.base);
      result.style.setProperty('--accent-deep', ch.theme.deep);
      result.style.setProperty('--accent-glow', ch.theme.glow);
      result.innerHTML =
        '<div class="emotion-result-art">' + FM.art.monster(ch.slug, { target: 230 }) + '</div>' +
        '<div>' +
          '<p class="emotion-result-kicker">' + esc(T('home.emotionResult')) + '</p>' +
          '<h3 class="emotion-result-name">' + esc(ch.name) +
            ' <span class="muted" style="font-size:.5em">' + esc(P(ch.nameAlt)) + '</span></h3>' +
          '<p class="emotion-result-line">“' + esc(P(em.line)) + '”</p>' +
          '<div class="btn-row" style="margin-top:20px">' +
            '<a class="btn btn--sm btn--primary" href="' + (FM.chrome ? FM.chrome.prefix() : '') + 'characters/' + ch.slug + '.html">' +
              esc(T('cta.seeCharacter')) + '</a>' +
            '<a class="btn btn--sm" href="#wallpapers">' + esc(T('cta.getWallpaper')) + '</a>' +
            shareRow(ch) +
          '</div>' +
        '</div>';
      result.classList.add('is-shown');
      wireShare(result);
      track('emotion_result', { slug: ch.slug, label: id });
    }

    btns.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-emotion]');
      if (b) show(b.getAttribute('data-emotion'));
    });

    paint();
    rerenderers.push(function () { paint(); if (current) show(current); });
  }

  /* ===================================================================== *
   * Personality Quiz
   * ===================================================================== */
  function initQuiz() {
    var stage = $('#quiz-stage');
    if (!stage) return;
    var scores = {};
    var idx = 0;

    function reset() {
      scores = {};
      idx = 0;
      D.characters.forEach(function (c) { scores[c.slug] = 0; });
      render();
    }

    function render() {
      if (idx >= I.quiz.length) return finish();
      var q = I.quiz[idx];
      var html = '<p class="eyebrow">' + esc(T('lab.quizProgress')
          .replace('{n}', String(idx + 1)).replace('{total}', String(I.quiz.length))) + '</p>' +
        '<h3 class="h2" style="font-size:clamp(22px,3vw,34px);margin-bottom:22px">' + esc(P(q.q)) + '</h3>' +
        '<div class="grid" style="gap:10px">';
      q.a.forEach(function (a, i) {
        html += '<button class="tile" type="button" data-answer="' + a.s + '" style="text-align:left">' +
          '<span class="mono tiny accent">' + String.fromCharCode(65 + i) + '</span> ' +
          '<span style="font-size:16px">' + esc(P(a.t)) + '</span></button>';
      });
      stage.innerHTML = html + '</div>';
    }

    function finish() {
      var best = D.characters[0].slug, top = -1;
      D.characters.forEach(function (c) {
        if (scores[c.slug] > top) { top = scores[c.slug]; best = c.slug; }
      });
      var ch = D.bySlug(best);
      stage.style.setProperty('--accent', ch.theme.base);
      stage.style.setProperty('--accent-deep', ch.theme.deep);
      stage.style.setProperty('--accent-glow', ch.theme.glow);
      stage.innerHTML =
        '<p class="emotion-result-kicker">' + esc(T('lab.quizResult')) + '</p>' +
        '<div class="emotion-result is-shown" style="--accent:' + ch.theme.base + '">' +
          '<div class="emotion-result-art">' + FM.art.monster(ch.slug, { target: 230 }) + '</div>' +
          '<div>' +
            '<h3 class="emotion-result-name">' + esc(ch.name) +
              ' <span class="muted" style="font-size:.45em">' + esc(P(ch.nameAlt)) + '</span></h3>' +
            '<p class="mono tiny accent" style="margin-bottom:10px">' + esc(P(ch.role)) + '</p>' +
            '<p class="emotion-result-line">“' + esc(P(ch.tagline)) + '”</p>' +
            '<div class="btn-row" style="margin-top:20px">' +
              '<a class="btn btn--sm btn--primary" href="' + (FM.chrome ? FM.chrome.prefix() : '') + 'characters/' + ch.slug + '.html">' + esc(T('cta.viewCharacter')) + '</a>' +
              '<button class="btn btn--sm" type="button" data-quiz-retake>' + esc(T('cta.retake')) + '</button>' +
              shareRow(ch) +
            '</div>' +
          '</div>' +
        '</div>';
      wireShare(stage);
      track('quiz_result', { slug: ch.slug });
    }

    stage.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-answer]');
      if (b) {
        scores[b.getAttribute('data-answer')] = (scores[b.getAttribute('data-answer')] || 0) + 1;
        idx++;
        render();
        return;
      }
      if (e.target.closest && e.target.closest('[data-quiz-retake]')) reset();
    });

    reset();
    rerenderers.push(function () { reset(); });
  }

  /* ===================================================================== *
   * Relationship Map
   * ===================================================================== */
  function initMap() {
    var host = $('#rel-map');
    if (!host) return;
    var svgHost = $('#rel-map-svg');
    var listHost = $('#rel-map-list');
    var active = null;

    function layout() {
      var R = 130, cx = 170, cy = 170;
      return D.characters.map(function (c, i) {
        var a = (i / D.characters.length) * Math.PI * 2 - Math.PI / 2;
        return { slug: c.slug, ch: c, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
      });
    }

    function paintSvg() {
      var nodes = layout();
      var pos = {};
      nodes.forEach(function (n) { pos[n.slug] = n; });
      var s = '<svg class="map-svg" viewBox="0 0 340 340" role="img" aria-label="' + esc(T('map.title')) + '">';
      /* faint orbit */
      s += '<circle cx="170" cy="170" r="130" fill="none" stroke="#1A1F2E" stroke-width="1" stroke-dasharray="3 6"/>';
      D.relations.forEach(function (r) {
        var a = pos[r.from], b = pos[r.to];
        if (!a || !b) return;
        var on = !active || r.from === active || r.to === active;
        var mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        var pull = r.type === 'conflict' ? 16 : -16;
        var mx = mid.x + (170 - mid.x) / 130 * pull;
        var my = mid.y + (170 - mid.y) / 130 * pull;
        s += '<path class="map-edge' + (on ? '' : ' is-dim') + '" d="M' + a.x + ',' + a.y + ' Q' + mx + ',' + my + ' ' + b.x + ',' + b.y +
          '" fill="none" stroke="' + (r.type === 'conflict' ? '#F389A0' : '#6E7688') +
          '" stroke-width="' + (r.type === 'conflict' ? 2 : 1.5) + '"' +
          (r.type === 'conflict' ? ' stroke-dasharray="5 5"' : '') + '/>';
      });
      nodes.forEach(function (n) {
        var on = !active || n.slug === active ||
          D.relations.some(function (r) {
            return (r.from === active && r.to === n.slug) || (r.to === active && r.from === n.slug);
          });
        s += '<g class="map-node' + (n.slug === active ? ' is-active' : '') + '" data-node="' + n.slug + '" tabindex="0" role="button" aria-label="' + esc(n.ch.name) + '" opacity="' + (on ? 1 : 0.35) + '">';
        s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="30" fill="' + n.ch.theme.base + '" stroke="#020202" stroke-width="3"/>';
        s += '<text x="' + n.x + '" y="' + (n.y + 4) + '" text-anchor="middle" font-size="11" font-family="Georgia,serif" fill="#020202">' +
          esc(n.ch.symbol.en.split(' ')[0].toUpperCase().slice(0, 9)) + '</text>';
        s += '</g>';
      });
      s += '</svg>';
      svgHost.innerHTML = s;
    }

    function paintList() {
      var rels = D.relations;
      var out = '';
      if (active) {
        out += '<p class="mono tiny accent">' + esc(T('map.showing')) + ' ' + esc(D.bySlug(active).name) + '</p>';
      }
      var shown = active ? rels.filter(function (r) { return r.from === active || r.to === active; }) : rels;
      shown.forEach(function (r) {
        var other = active ? (r.from === active ? r.to : r.from) : r.to;
        var a = D.bySlug(r.from), b = D.bySlug(r.to);
        var otherCh = D.bySlug(other);
        out += '<div class="rel-item">' +
          '<div class="rel-art">' + FM.art.monster(otherCh.slug, { target: 54 }) + '</div>' +
          '<div>' +
            '<div class="rel-head">' +
              '<span class="rel-name">' + esc(a.name) + ' — ' + esc(b.name) + '</span>' +
              '<span class="rel-type">' + esc(P(D.relationTypes[r.type])) + '</span>' +
            '</div>' +
            '<p class="rel-text">' + esc(P(r.text)) + '</p>' +
          '</div></div>';
      });
      listHost.innerHTML = out;
    }

    function paint() { paintSvg(); paintList(); }

    function pick(slug) {
      active = (active === slug) ? null : slug;
      paint();
      if (active) track('character_click', { slug: active, label: 'relationship_map' });
    }

    if (svgHost) {
      svgHost.addEventListener('click', function (e) {
        var g = e.target.closest && e.target.closest('[data-node]');
        if (g) pick(g.getAttribute('data-node'));
      });
      svgHost.addEventListener('keydown', function (e) {
        var g = e.target.closest && e.target.closest('[data-node]');
        if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(g.getAttribute('data-node')); }
      });
    }
    var reset = $('#rel-map-reset');
    if (reset) reset.addEventListener('click', function () { active = null; paint(); });

    paint();
    rerenderers.push(paint);
  }

  /* ===================================================================== *
   * Downloads — wallpaper, sticker, colouring
   * ===================================================================== */
  function download(name, blobOrString, mime) {
    var url, revoke = false;
    if (typeof blobOrString === 'string') {
      url = 'data:' + (mime || 'image/svg+xml') + ';charset=utf-8,' + encodeURIComponent(blobOrString);
    } else {
      url = root.URL.createObjectURL(blobOrString);
      revoke = true;
    }
    var a = doc.createElement('a');
    a.href = url;
    a.download = name;
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    if (revoke) setTimeout(function () { root.URL.revokeObjectURL(url); }, 4000);
  }

  /* Download a file that already exists on disk. A plain anchor with the
   * `download` attribute is enough, and unlike a blob it streams the real
   * generated PNG rather than re-encoding anything in the browser. */
  function downloadUrl(name, url) {
    var a = doc.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
  }

  function initDownloads() {
    var host = $('#lab-downloads');
    if (!host) return;

    function paint() {
      var out = '<div class="grid grid-3" style="gap:var(--gap)">';
      D.characters.forEach(function (c) {
        out += '<div class="tile" style="--accent:' + c.theme.base + '">' +
          '<div style="display:grid;place-items:center;margin-bottom:12px">' + FM.art.monster(c.slug, { target: 140 }) + '</div>' +
          '<h3 class="tile-title">' + esc(c.name) + '</h3>' +
          '<p class="mono tiny accent" style="margin-bottom:12px">' + esc(P(c.symbol)) + '</p>' +
          '<div class="btn-row">' +
            '<button class="btn btn--sm" type="button" data-dl="wallpaper-phone" data-slug="' + c.slug + '">' + esc(T('cta.download')) + ' 9:16</button>' +
            '<button class="btn btn--sm" type="button" data-dl="wallpaper-desktop" data-slug="' + c.slug + '">16:9</button>' +
            '<button class="btn btn--sm" type="button" data-dl="sticker" data-slug="' + c.slug + '">PNG</button>' +
            '<button class="btn btn--sm" type="button" data-dl="colouring" data-slug="' + c.slug + '">' + esc(T('cta.print')) + '</button>' +
          '</div></div>';
      });
      host.innerHTML = out + '</div>';
    }

    host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-dl]');
      if (!b) return;
      var slug = b.getAttribute('data-slug');
      var kind = b.getAttribute('data-dl');
      var ch = D.bySlug(slug);
      if (!ch) return;

      /* Every download is a real raster file generated from the supplied IP art
       * at build time (tools/build-art.js). Nothing is drawn in the browser any
       * more, and nothing is rasterised from SVG at click time — the previous
       * version did both, which is how the site ended up serving redrawn
       * monsters instead of the artwork. */
      if (kind === 'wallpaper-phone') {
        downloadUrl('furimonster-' + slug + '-wallpaper-phone.png', FM.art.wallpaperUrl(slug, 'phone'));
      } else if (kind === 'wallpaper-desktop') {
        downloadUrl('furimonster-' + slug + '-wallpaper-desktop.png', FM.art.wallpaperUrl(slug, 'desktop'));
      } else if (kind === 'colouring') {
        downloadUrl('furimonster-' + slug + '-colouring.png', FM.art.colouringUrl(slug));
      } else if (kind === 'sticker') {
        downloadUrl('furimonster-' + slug + '-sticker.png', FM.art.stickerUrl(slug));
      }
      track('lab_download', { slug: slug, label: kind });
    });

    paint();
    rerenderers.push(paint);
  }

  /* ===================================================================== *
   * Share buttons
   * ===================================================================== */
  function shareRow(ch) {
    var base = (FM.config.url || '') + '/characters/' + ch.slug + '.html';
    var text = ch.name + ' — ' + P(ch.symbol) + ' · FURI MONSTER';
    return '<span class="share-row" style="display:inline-flex;gap:8px;flex-wrap:wrap">' +
      '<a class="btn btn--sm" data-track="share" data-label="facebook" target="_blank" rel="noopener" ' +
        'href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(base) + '">Facebook</a>' +
      '<a class="btn btn--sm" data-track="share" data-label="threads" target="_blank" rel="noopener" ' +
        'href="https://www.threads.net/intent/post?text=' + encodeURIComponent(text + ' ' + base) + '">Threads</a>' +
      '<a class="btn btn--sm" data-track="share" data-label="x" target="_blank" rel="noopener" ' +
        'href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(base) + '">X</a>' +
      '<button class="btn btn--sm" type="button" data-copy="' + esc(base) + '">' + esc(T('cta.copyLink')) + '</button>' +
      '</span>';
  }

  function wireShare(ctx) {
    $$('[data-copy]', ctx || doc).forEach(function (b) {
      if (b.__wired) return;
      b.__wired = true;
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-copy');
        var done = function () {
          var old = b.textContent;
          b.textContent = T('cta.copied');
          setTimeout(function () { b.textContent = old; }, 1800);
        };
        if (root.navigator.clipboard) root.navigator.clipboard.writeText(v).then(done, done);
        else done();
        track('share', { label: 'copy_link' });
      });
    });
    $$('.share-row a', ctx || doc).forEach(function (a) {
      if (a.__wired) return;
      a.__wired = true;
      a.addEventListener('click', function () { track('share', { label: a.textContent.trim() }); });
    });
  }

  /* ===================================================================== *
   * Forms
   * ===================================================================== */
  function initForms() {
    $$('form[data-form]').forEach(function (form) {
      var status = $('[data-status]', form);
      var kind = form.getAttribute('data-form');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        $$('[required]', form).forEach(function (f) {
          var field = f.closest('.field') || f.parentNode;
          var err = field.querySelector ? field.querySelector('.err') : null;
          var v = (f.value || '').trim();
          var bad = !v;
          if (!bad && f.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
          if (err) err.textContent = bad ? (f.type === 'email' ? T('form.invalidEmail') : T('form.required')) : '';
          f.setAttribute('aria-invalid', String(bad));
          if (bad) ok = false;
        });
        if (!ok) {
          if (status) { status.className = 'form-status is-err'; status.textContent = T('form.error'); }
          return;
        }

        var endpoint = FM.config.forms.endpoint;
        function succeed() {
          if (status) { status.className = 'form-status is-ok'; status.textContent = T('form.success'); }
          form.reset();
          if (kind === 'licensing' || kind === 'collaboration') track('licensing_click', { label: kind });
          else track('contact_submit', { label: kind });
        }
        function fail() {
          if (status) { status.className = 'form-status is-err'; status.textContent = T('form.error'); }
        }

        if (!endpoint) {
          /* No endpoint configured yet. The form must not look like it worked:
           * the visitor is told plainly, and given a real address to use
           * instead, so the attempt still reaches someone.
           *
           * The link carries what they typed. Without that, the note told them
           * to email us and threw their message away — on a site whose main
           * business is licensing enquiries, retyping a filled-in form is
           * exactly where an enquiry is lost. */
          if (status) {
            status.className = 'form-status is-err';
            status.textContent = '';
            status.appendChild(root.document.createTextNode(P(FM.config.forms.fallbackNote) + ' '));
            /* the right address for THIS form, not one address for all of them */
            var route = (FM.config.forms.routeByKind || {})[kind] || 'general';
            var addr = FM.config.contact[route] || FM.config.contact.general || '';
            if (addr) {
              var mail = root.document.createElement('a');
              mail.href = buildMailto(form, addr, kind, status);
              mail.textContent = addr;
              mail.title = T('form.mailtoCta');
              status.appendChild(mail);
              status.appendChild(root.document.createTextNode(' · ' + T('form.mailtoCta')));
            }
          }
          track('contact_submit', { label: kind + '_no_endpoint' });
          return;
        }
        var data = new root.FormData(form);
        root.fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { r.ok ? succeed() : fail(); })
          .catch(fail);
      });
    });
    wireShare(doc);
  }

  /* ===================================================================== *
   * News filter
   * ===================================================================== */
  function initNewsFilter() {
    var row = $('#news-filter');
    if (!row) return;
    row.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-cat]');
      if (!b) return;
      var cat = b.getAttribute('data-cat');
      $$('button', row).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('#news-list [data-cat]').forEach(function (item) {
        item.style.display = (cat === 'all' || item.getAttribute('data-cat') === cat) ? '' : 'none';
      });
    });
  }

  /* ===================================================================== *
   * Comic library filter (stories.html)
   * Two independent axes — guardian and theme — combined with AND. The cards
   * carry their own data attributes, so filtering is a class toggle and the
   * whole library stays a plain crawlable list of links.
   * ===================================================================== */
  function initComicFilter() {
    var host = $('#comic-filter');
    var grid = $('#comic-grid');
    if (!host || !grid) return;

    var cards = $$('.comic-card', grid);
    var countEl = $('#comicCount');
    var emptyEl = $('#comic-empty');

    function selection(axis) {
      var b = host.querySelector('.filter-btn[data-filter="' + axis + '"][aria-pressed="true"]');
      return b ? b.getAttribute('data-value') : 'all';
    }

    function apply() {
      var ch = selection('char');
      var tg = selection('tag');
      var shown = 0;
      cards.forEach(function (c) {
        var okC = ch === 'all' || c.getAttribute('data-char') === ch;
        var okT = tg === 'all' || (c.getAttribute('data-tags') || '').split('|').indexOf(tg) !== -1;
        var on = okC && okT;
        c.classList.toggle('is-hidden', !on);
        if (on) shown++;
      });
      if (countEl) countEl.textContent = shown + ' / ' + cards.length;
      if (emptyEl) emptyEl.hidden = shown !== 0;
    }

    host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.filter-btn');
      if (!b) return;
      var axis = b.getAttribute('data-filter');
      $$('.filter-btn[data-filter="' + axis + '"]', host).forEach(function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      apply();
      track('comic_filter', { label: axis + ':' + b.getAttribute('data-value') });
    });

    /* deep link: stories.html?char=pinki lets a character page point straight
     * at one guardian's comics */
    var want = (root.location.search.match(/[?&]char=([a-z-]+)/) || [])[1];
    if (want) {
      var btn = host.querySelector('.filter-btn[data-filter="char"][data-value="' + want + '"]');
      if (btn) {
        $$('.filter-btn[data-filter="char"]', host).forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === btn));
        });
      }
    }
    apply();
    rerenderers.push(apply);
  }

  /* ===================================================================== *
   * Game embed (play.html)
   * ===================================================================== */
  function initGameEmbed() {
    var frame = $('#gameFrame');
    var bootLayer = $('#gameBoot');
    if (!frame) return;

    /* the game paints its own title screen; drop the placeholder once it has
     * actually loaded, so a slow or blocked load is still explained */
    frame.addEventListener('load', function () {
      if (bootLayer) bootLayer.style.display = 'none';
    });

    var req = $('#fsRequest');
    if (req) {
      req.addEventListener('click', function () {
        /* Fullscreen the iframe itself where supported: fullscreening the
         * whole page would leave the site chrome on screen and shrink the
         * cabinet, which is the opposite of the point. */
        var target = frame;
        var el = (target.requestFullscreen || target.webkitRequestFullscreen) ? target : doc.documentElement;
        var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (!fn) return;
        var pr = fn.call(el);
        if (pr && pr.then) {
          pr.then(function () {
            if (root.screen && root.screen.orientation && root.screen.orientation.lock) {
              try { root.screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
            }
          }).catch(function () {});
        }
        track('game_fullscreen', { label: 'play_page' });
      });
    }
  }

  /* Build a mailto: that carries what the visitor typed.
   *
   * Mail clients give up somewhere around 2000 characters, so the URL is capped
   * under that and the visitor is told when it was cut — silently dropping half
   * a licensing enquiry would be worse than saying so.
   *
   * The cap has to be on the ENCODED length, not the raw text: a body of 1600
   * characters containing newlines and colons encodes to well over 2000, which
   * is how the first version of this produced a URL no client would open.
   *
   * Returns the href, and appends the truncation note to `status` when needed. */
  var MAILTO_MAX_URL = 1900;
  function buildMailto(form, addr, kind, status) {
    var parts = [];
    var fields = form.querySelectorAll('input, textarea, select');
    Array.prototype.forEach.call(fields, function (el) {
      if (!el.name || el.type === 'hidden' || el.type === 'submit') return;
      if (el.type === 'checkbox' && !el.checked) return;
      var v = (el.value || '').trim();
      if (!v) return;
      var lab = el.id ? form.querySelector('label[for="' + el.id + '"]') : null;
      parts.push((lab ? lab.textContent.trim() : el.name) + ': ' + v);
    });
    var body = parts.join('\n');
    var head = 'mailto:' + addr +
      '?subject=' + encodeURIComponent('FURI MONSTER — ' + kind + ' enquiry');
    var url = head + (body ? '&body=' + encodeURIComponent(body) : '');
    var cut = false;
    var guard = 0;
    while (url.length > MAILTO_MAX_URL && body.length > 0 && guard++ < 20) {
      cut = true;
      var over = url.length - MAILTO_MAX_URL;
      body = body.slice(0, Math.max(0, body.length - over - 24));
      url = head + (body ? '&body=' + encodeURIComponent(body) : '');
    }
    if (cut && status) {
      status.appendChild(root.document.createTextNode(' ' + T('form.mailtoTruncated')));
    }
    return url;
  }

  /* ===================================================================== *
   * boot
   * ===================================================================== */
  function boot() {
    wireLangSwitch();
    applyLocale(I.detect());
    wireReveal();
    initEmotionLab();
    initQuiz();
    initMap();
    initDownloads();
    initForms();
    initNewsFilter();
    initComicFilter();
    initGameEmbed();

    /* keyboard shortcut: L cycles language (mirrors the older FURI tooling) */
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'l' && e.key !== 'L') return;
      var tag = (doc.activeElement && doc.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var ids = I.locales.map(function (l) { return l.id; });
      var next = ids[(ids.indexOf(I.getLocale()) + 1) % ids.length];
      applyLocale(next);
      track('language_switch', { label: next });
    });
  }

  FM.app = { boot: boot, applyLocale: applyLocale, shareRow: shareRow, download: download };

  if (doc) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
