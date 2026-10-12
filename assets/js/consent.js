/* =========================================================================
 * assets/js/consent.js — cookie / storage consent, and the gate for anything
 * third-party.
 *
 * Design decisions worth keeping:
 *
 *  • NO BANNER UNLESS SOMETHING ACTUALLY NEEDS IT. The site sets no cookies of
 *    its own: the language choice lives in localStorage and never leaves the
 *    browser. A banner is shown only when a feature that genuinely requires
 *    consent is configured (a GA4 id, or a chat widget). Most sites get this
 *    wrong and interrupt every visitor for nothing.
 *
 *  • DENY BY DEFAULT. Nothing third-party loads until the visitor says yes, and
 *    "essential only" is a real, non-punishing option.
 *
 *  • THE CHOICE IS REVERSIBLE. A footer link reopens the panel, so consent is
 *    as easy to withdraw as to give.
 * ========================================================================= */
(function (root) {
  'use strict';

  var cfg = (root.FM && root.FM.config) || {};
  var KEY = 'fm.consent.v1';
  var doc = root.document;

  var STRINGS = {
    title: {
      en: 'Cookies and third-party services',
      'zh-Hant': 'Cookie 與第三方服務',
      'zh-Hans': 'Cookie 与第三方服务',
      th: 'คุกกี้และบริการของบุคคลที่สาม',
      ja: 'Cookie と第三者サービス'
    },
    body: {
      en: 'This site sets no cookies of its own. Everything below is optional and stays off until you allow it.',
      'zh-Hant': '本網站本身不使用 Cookie。以下各項均為選擇性，未經您允許不會啟用。',
      'zh-Hans': '本网站本身不使用 Cookie。以下各项均为可选，未经您允许不会启用。',
      th: 'เว็บไซต์นี้ไม่ใช้คุกกี้ของตัวเอง สิ่งด้านล่างเป็นทางเลือก และจะไม่ทำงานจนกว่าคุณจะอนุญาต',
      ja: 'このサイト自体は Cookie を使用しません。以下はすべて任意で、許可するまで動作しません。'
    },
    analytics: {
      en: 'Analytics — aggregate page and event counts',
      'zh-Hant': '分析 —— 彙總頁面與事件計數',
      'zh-Hans': '分析 —— 汇总页面与事件计数',
      th: 'การวิเคราะห์ — จำนวนหน้าและเหตุการณ์แบบรวม',
      ja: 'アクセス解析 — ページとイベントの集計'
    },
    chat: {
      en: 'Chat — the support widget, when configured',
      'zh-Hant': '聊天 —— 客服小工具（如已設定）',
      'zh-Hans': '聊天 —— 客服小工具（如已配置）',
      th: 'แชท — วิดเจ็ตช่วยเหลือ (เมื่อตั้งค่าแล้ว)',
      ja: 'チャット — サポートウィジェット（設定時）'
    },
    accept: {
      en: 'Allow all', 'zh-Hant': '全部允許', 'zh-Hans': '全部允许',
      th: 'อนุญาตทั้งหมด', ja: 'すべて許可'
    },
    essential: {
      en: 'Essential only', 'zh-Hant': '只允許必要', 'zh-Hans': '只允许必要',
      th: 'เฉพาะที่จำเป็น', ja: '必須のみ'
    },
    more: {
      en: 'Read the privacy policy', 'zh-Hant': '閱讀隱私政策', 'zh-Hans': '阅读隐私政策',
      th: 'อ่านนโยบายความเป็นส่วนตัว', ja: 'プライバシーポリシーを読む'
    },
    manage: {
      en: 'Cookie settings', 'zh-Hant': 'Cookie 設定', 'zh-Hans': 'Cookie 设置',
      th: 'ตั้งค่าคุกกี้', ja: 'Cookie 設定'
    }
  };

  /* Which optional features are configured at all? */
  function features() {
    var a = cfg.analytics || {};
    var c = cfg.chat || {};
    return {
      analytics: !!a.ga4,
      chat: !!(c.tawkPropertyId && c.tawkPropertyId.length)
    };
  }
  function anythingOptional() {
    var f = features();
    return f.analytics || f.chat;
  }

  function read() {
    try { return JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function write(v) {
    try { root.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }

  var state = read();

  function pick(field) {
    var loc = (root.FM && root.FM.i18n && root.FM.i18n.locale && root.FM.i18n.locale()) || 'en';
    return field[loc] || field.en;
  }

  function announce() {
    try {
      doc.dispatchEvent(new root.CustomEvent('fm:consent', { detail: state }));
    } catch (e) { /* very old browser: the poll below still works */ }
  }

  function save(next) {
    state = next;
    state.at = new Date().toISOString();
    write(state);
    announce();
    hide();
  }

  /* ---- the banner ------------------------------------------------------ */
  var el = null;

  function build() {
    var f = features();
    var rows = '';
    if (f.analytics) {
      rows += '<li><b>' + esc(pick(STRINGS.analytics)) + '</b></li>';
    }
    if (f.chat) {
      rows += '<li><b>' + esc(pick(STRINGS.chat)) + '</b></li>';
    }
    el = doc.createElement('div');
    el.id = 'fm-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', pick(STRINGS.title));
    el.innerHTML =
      '<div class="fm-consent-inner">' +
        '<p class="fm-consent-title">' + esc(pick(STRINGS.title)) + '</p>' +
        '<p class="fm-consent-body">' + esc(pick(STRINGS.body)) + '</p>' +
        (rows ? '<ul class="fm-consent-list">' + rows + '</ul>' : '') +
        '<div class="fm-consent-actions">' +
          '<button type="button" class="btn btn--sm btn--primary" data-consent="all">' + esc(pick(STRINGS.accept)) + '</button>' +
          '<button type="button" class="btn btn--sm" data-consent="essential">' + esc(pick(STRINGS.essential)) + '</button>' +
          '<a class="fm-consent-link" href="' + rootPath() + 'privacy.html">' + esc(pick(STRINGS.more)) + '</a>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-consent]') : null;
      if (!b) return;
      var kind = b.getAttribute('data-consent');
      save({ analytics: kind === 'all', chat: kind === 'all' });
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function rootPath() {
    /* the consent banner is injected on every page, at every depth */
    var segs = root.location.pathname.split('/').filter(Boolean);
    var file = segs[segs.length - 1] || '';
    var dirs = file.indexOf('.html') !== -1 ? segs.length - 1 : segs.length;
    return new Array(Math.max(0, dirs)).fill('..').join('/') + (dirs ? '/' : '');
  }

  function show() {
    if (!el) build();
    el.classList.add('is-open');
  }
  function hide() {
    if (el) el.classList.remove('is-open');
  }

  /* ---- public API ------------------------------------------------------ */
  var api = {
    /* may this category load? */
    allows: function (kind) {
      if (!features()[kind]) return false;
      if (!state) return false;
      return state[kind] === true;
    },
    /* has the visitor answered at all? */
    answered: function () { return !!state; },
    open: show,
    reset: function () {
      try { root.localStorage.removeItem(KEY); } catch (e) {}
      state = null;
      show();
    },
    strings: STRINGS
  };

  root.FM = root.FM || {};
  root.FM.consent = api;

  /* Ask only when there is something to ask about and no answer on file. */
  function init() {
    if (anythingOptional() && !state) show();
    /* a footer link, present on every page, reopens the panel */
    doc.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-consent-open]') : null;
      if (!t) return;
      e.preventDefault();
      show();
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof globalThis !== 'undefined' ? globalThis : this);
