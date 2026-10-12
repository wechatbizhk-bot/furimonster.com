/* =========================================================================
 * assets/js/affiliate.js — referral attribution.
 *
 * Captures ?ref=CODE on arrival, remembers it for a configurable window, and
 * reports it once through the analytics layer (which respects consent).
 *
 * This is ATTRIBUTION ONLY. There is no commission calculation and no payout:
 * those need an affiliate platform (Impact, PartnerStack, Rewardful…), which is
 * a paid third-party service. What this does is make referrals measurable so
 * the decision to pay for a platform can be made on evidence.
 * ========================================================================= */
(function (root) {
  'use strict';

  var cfg = (root.FM && root.FM.config && root.FM.config.affiliate) || { param: 'ref', days: 30 };
  var KEY = 'fm.ref.v1';
  var doc = root.document;

  function read() {
    try { return JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function save(v) {
    try { root.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }

  /* Keep the code to characters an affiliate network would actually issue, so a
   * crafted link cannot inject arbitrary text into a report. */
  function clean(s) {
    return String(s || '').replace(/[^\w.\-]/g, '').slice(0, 64);
  }

  function capture() {
    var m = new RegExp('[?&]' + cfg.param + '=([^&#]+)').exec(root.location.search);
    if (!m) return null;
    var code = clean(decodeURIComponent(m[1]));
    if (!code) return null;
    var rec = { code: code, at: Date.now(), landing: root.location.pathname, first: null };
    var prev = read();
    if (prev && prev.code === code) rec.first = prev.first;   /* keep the original landing */
    if (!rec.first) rec.first = rec.landing;
    save(rec);
    return rec;
  }

  function live(rec) {
    if (!rec || !rec.at) return false;
    return (Date.now() - rec.at) <= (cfg.days || 30) * 86400000;
  }

  var current = capture();
  if (!current) {
    var stored = read();
    current = live(stored) ? stored : null;
  }

  root.FM = root.FM || {};
  root.FM.affiliate = {
    /* the code to attach to a checkout or an outbound link, or '' */
    code: function () { return current ? current.code : ''; },
    record: function () { return current; },
    /* append the referral to a URL, for handing off to a shop or a partner */
    decorate: function (url) {
      if (!current || !url) return url;
      var join = url.indexOf('?') === -1 ? '?' : '&';
      return url + join + encodeURIComponent(cfg.param) + '=' + encodeURIComponent(current.code);
    },
    clear: function () { try { root.localStorage.removeItem(KEY); } catch (e) {} current = null; }
  };

  /* Report the referral once per landing, through the consent-aware layer. */
  function report() {
    if (!current) return;
    if (!(root.FM && root.FM.analytics && root.FM.analytics.track)) return;
    root.FM.analytics.track('affiliate_referral', {
      label: current.code,
      landing: current.first || current.landing
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', report);
  else report();
})(typeof globalThis !== 'undefined' ? globalThis : this);
