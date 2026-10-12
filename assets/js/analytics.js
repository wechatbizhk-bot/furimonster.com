/* =========================================================================
 * assets/js/analytics.js — FURI MONSTER event hooks.
 *
 * The brief (§16) requires hooks for: character_click, story_view,
 * emotion_result, licensing_click, contact_submit, language_switch.
 *
 * Behaviour: every event is always dispatched as a DOM CustomEvent (so any
 * tag manager can listen) and pushed to window.dataLayer. Nothing is sent
 * over the network until a GA4 measurement id is set in site.config.js —
 * which means the site ships with zero third-party requests by default.
 * ========================================================================= */
(function (root) {
  'use strict';

  var FM = root.FM = root.FM || {};
  var cfg = (FM.config && FM.config.analytics) || { ga4: '', debug: false };
  var queue = [];

  function loadGa4(id) {
    if (!id || root.__fmGa4) return;
    /* Consent gate. Nothing third-party loads until the visitor says yes; this
     * is checked here as well as at init, because consent can be granted (or
     * withdrawn) after the page has loaded. */
    if (!(FM.consent && FM.consent.allows('analytics'))) return;
    root.__fmGa4 = true;
    var s = root.document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    root.document.head.appendChild(s);
    root.dataLayer = root.dataLayer || [];
    root.gtag = function () { root.dataLayer.push(arguments); };
    root.gtag('js', new Date());
    /* the brief asks for no unnecessary cookies; deny ads by default */
    root.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    root.gtag('config', id, { anonymize_ip: true });
  }

  /* If consent is granted after load, start then. */
  root.document.addEventListener('fm:consent', function (e) {
    if (e.detail && e.detail.analytics) loadGa4(cfg.ga4);
  });

  function track(name, params) {
    var payload = { event: name, fm_locale: FM.i18n ? FM.i18n.getLocale() : 'en' };
    if (params) for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k];

    queue.push(payload);
    root.dataLayer = root.dataLayer || [];
    root.dataLayer.push(payload);

    try {
      root.document.dispatchEvent(new CustomEvent('fm:track', { detail: payload }));
    } catch (e) { /* CustomEvent unsupported: the dataLayer push already happened */ }

    if (cfg.debug && root.console) root.console.log('[fm:track]', name, payload);
    return payload;
  }

  /* Delegated listeners so new markup is tracked without re-binding. */
  function wire() {
    loadGa4(cfg.ga4);

    root.document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-track]') : null;
      if (!el) return;
      var name = el.getAttribute('data-track');
      var params = {};
      ['slug', 'story', 'label', 'href'].forEach(function (k) {
        var v = el.getAttribute('data-' + k);
        if (v) params[k] = v;
      });
      track(name, params);
    });

    /* outbound social + email clicks */
    root.document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="http"], a[href^="mailto:"]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('furimonster.com') !== -1) return;
      track('outbound_click', { href: href, label: (a.textContent || '').trim().slice(0, 60) });
    });
  }

  FM.analytics = { track: track, wire: wire, queue: queue };

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', wire);
    else wire();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
