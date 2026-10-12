/* =========================================================================
 * assets/js/translate.js — Google Translate, as an opt-in extra.
 *
 * Design decision: the five authored languages (EN / 繁中 / 簡中 / ไทย / 日本語)
 * do NOT use Google Translate. They are real translated content baked into the
 * HTML, so they work offline, load instantly, are crawlable, and read the way
 * a human wrote them.
 *
 * Google Translate is offered as a separate control for every OTHER language a
 * visitor might want. It is loaded lazily — the third-party script is only
 * fetched when someone actually opens the control — so the default page load
 * makes no request to Google at all.
 *
 * The switcher uses the standard `googtrans` cookie, because that is the only
 * reliable way to drive the widget's language from outside its own <select>.
 * A cookie set on a file:// page will not work; Google Translate needs a real
 * deployed origin, and is unavailable on some networks (notably mainland
 * China). Both cases are reported to the user rather than failing silently.
 * ========================================================================= */
(function (root) {
  'use strict';

  var FM = root.FM = root.FM || {};
  var doc = root.document;

  /* Languages the widget offers. Deliberately a curated list, not all ~130,
   * because a 130-item list is unusable on a phone. */
  var OFFERED = [
    ['ko', '한국어'], ['vi', 'Tiếng Việt'], ['id', 'Bahasa Indonesia'],
    ['ms', 'Bahasa Melayu'], ['fr', 'Français'], ['de', 'Deutsch'],
    ['es', 'Español'], ['pt', 'Português'], ['it', 'Italiano'],
    ['nl', 'Nederlands'], ['ru', 'Русский'], ['ar', 'العربية'],
    ['hi', 'हिन्दी'], ['tr', 'Türkçe'], ['pl', 'Polski'], ['sv', 'Svenska']
  ];

  /* our locale ids -> Google's codes */
  var TO_GOOGLE = { 'en': 'en', 'zh-Hant': 'zh-TW', 'zh-Hans': 'zh-CN', 'th': 'th', 'ja': 'ja' };

  var loaded = false;
  var loading = false;
  var panel = null;

  function t(k) { return FM.i18n ? FM.i18n.t(k) : k; }
  function esc(s) { return FM.chrome ? FM.chrome.esc(s) : String(s); }

  /* ---- cookie plumbing ------------------------------------------------- */
  function readCookie(name) {
    var m = doc.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setCookie(name, value, days) {
    var exp = '';
    if (days) {
      var d = new Date();
      d.setTime(d.getTime() + days * 864e5);
      exp = '; expires=' + d.toUTCString();
    }
    /* Google reads the cookie on both the bare host and the leading-dot host,
     * so write both; a missing one silently disables translation. */
    doc.cookie = name + '=' + value + exp + '; path=/';
    doc.cookie = name + '=' + value + exp + '; path=/; domain=' + root.location.hostname;
  }

  function clearCookie(name) {
    doc.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }

  /* Which locale is Google currently serving, if any. */
  function activeGoogleLocale() {
    var c = readCookie('googtrans');
    if (!c) return null;
    var parts = c.split('/');           // /en/th
    return parts.length === 3 ? parts[2] : null;
  }

  function isMachineTranslated() { return !!activeGoogleLocale(); }

  /* ---- the widget ------------------------------------------------------ */
  function loadWidget() {
    if (loaded || loading) return;
    loading = true;

    root.googleTranslateElementInit = function () {
      loaded = true;
      loading = false;
      try {
        /* eslint-disable no-undef */
        new root.google.translate.TranslateElement({
          pageLanguage: TO_GOOGLE[FM.i18n.getLocale()] || 'en',
          includedLanguages: OFFERED.map(function (o) { return o[0]; }).join(','),
          layout: root.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true
        }, 'fm-google-translate');
        /* eslint-enable no-undef */
      } catch (e) {
        showError();
      }
    };

    var s = doc.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = function () { loading = false; showError(); };
    doc.head.appendChild(s);

    /* if the script never calls back, say so rather than hanging */
    setTimeout(function () {
      if (!loaded) { loading = false; showError(); }
    }, 9000);
  }

  function showError() {
    var host = doc.getElementById('fm-google-translate');
    if (!host) return;
    host.innerHTML = '<p class="tiny" style="color:var(--fur-pink);margin:0">' +
      'Google Translate could not be reached from this page. It needs a live ' +
      'https:// address and is blocked on some networks &mdash; the language menu ' +
      'above does not have this limitation.</p>'
      + taplist();
  }

  /* a plain link list as a fallback / alternative to the widget's own select */
  function taplist() {
    var cur = activeGoogleLocale();
    var out = '<div class="pill-list" style="margin-top:12px">';
    OFFERED.forEach(function (o) {
      out += '<button class="pill" type="button" data-gt="' + o[0] + '"' +
        (cur === o[0] ? ' style="border-color:var(--accent);color:var(--accent)"' : '') +
        '>' + esc(o[1]) + '</button>';
    });
    return out + '</div>';
  }

  /* ---- panel ----------------------------------------------------------- */
  function buildPanel() {
    if (panel) return panel;
    panel = doc.createElement('div');
    panel.className = 'drawer';
    panel.id = 'fm-translate-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.innerHTML =
      '<div class="drawer-inner" style="max-width:720px">' +
        '<button class="drawer-close" type="button" data-translate-close aria-label="Close">✕</button>' +
        '<p class="eyebrow">Google Translate</p>' +
        '<h2 class="h2" style="margin-bottom:12px">Read this page in another language</h2>' +
        '<p class="muted small" style="margin-bottom:8px">The five languages in the header are translated by hand. ' +
          'For any other language, this uses Google Translate, which is machine translation.</p>' +
        '<div class="notice" style="margin-bottom:18px">' +
          'Machine translation can mistranslate character names and the brand voice. ' +
          'Treat it as a reading aid, not as published copy.' +
        '</div>' +
        '<div id="fm-google-translate" style="min-height:56px"></div>' +
        '<div id="fm-gt-list">' + taplist() + '</div>' +
        '<div class="btn-row" style="margin-top:18px">' +
          '<button class="btn btn--sm" type="button" data-gt="off">Back to the original</button>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(panel);
    return panel;
  }

  function openPanel() {
    var p = buildPanel();
    p.classList.add('is-open');
    doc.body.style.overflow = 'hidden';
    loadWidget();
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('is-open');
    doc.body.style.overflow = '';
  }

  function apply(lang) {
    if (lang === 'off' || !lang) {
      clearCookie('googtrans');
      root.location.reload();
      return;
    }
    var source = TO_GOOGLE[FM.i18n.getLocale()] || 'en';
    setCookie('googtrans', '/' + source + '/' + lang, 365);
    root.location.reload();
  }

  /* ---- wiring ---------------------------------------------------------- */
  function wire() {
    doc.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-translate-open]') : null;
      if (el) { openPanel(); return; }
      if (e.target.closest && e.target.closest('[data-translate-close]')) { closePanel(); return; }
      var gt = e.target.closest ? e.target.closest('[data-gt]') : null;
      if (gt) { apply(gt.getAttribute('data-gt')); return; }
      if (panel && panel.classList.contains('is-open') && e.target === panel) closePanel();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });

    /* If Google Translate is active, say so plainly and offer a way back —
     * otherwise a visitor can be stuck reading machine translation with no
     * indication that it is machine translation. */
    var active = activeGoogleLocale();
    if (active) {
      var bar = doc.createElement('div');
      bar.id = 'fm-gt-bar';
      bar.innerHTML = '<span>Machine translation is on. Character names and tone may be wrong.</span>' +
        '<button class="btn btn--sm" type="button" data-gt="off">Original</button>';
      doc.body.appendChild(bar);
      doc.documentElement.setAttribute('data-machine-translated', active);
    }
  }

  FM.translate = {
    open: openPanel,
    close: closePanel,
    apply: apply,
    offered: OFFERED,
    isMachineTranslated: isMachineTranslated,
    activeGoogleLocale: activeGoogleLocale,
    wire: wire
  };

  if (doc) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', wire);
    else wire();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
