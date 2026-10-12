/* =========================================================================
 * assets/js/chatbot.js — the on-site assistant.
 *
 * TWO LAYERS, and the honest one is the default:
 *
 *  1. A local assistant that answers from the site's own FAQ data. No network,
 *     no third party, no cookies, no cost, and it cannot invent an answer it
 *     does not have — when it does not know, it says so and offers the contact
 *     page. This is always available.
 *
 *  2. Optionally, a Tawk.to live-chat widget. It is loaded ONLY when a property
 *     id is configured AND the visitor has allowed chat in the consent panel,
 *     because it is a third party that sets cookies.
 * ========================================================================= */
(function (root) {
  'use strict';

  var doc = root.document;
  var cfg = (root.FM && root.FM.config) || {};
  var chatCfg = cfg.chat || {};

  var STRINGS = {
    open: { en: 'Ask about FURI', 'zh-Hant': '查詢 FURI', 'zh-Hans': '查询 FURI', th: 'ถามเกี่ยวกับ FURI', ja: 'FURI に質問' },
    title: { en: 'FURI assistant', 'zh-Hant': 'FURI 助理', 'zh-Hans': 'FURI 助理', th: 'ผู้ช่วย FURI', ja: 'FURI アシスタント' },
    intro: {
      en: 'I answer from this site\u2019s own pages. Pick a question or type your own.',
      'zh-Hant': '我會用本網站自己嘅內容回答。請選一個問題，或自行輸入。',
      'zh-Hans': '我会用本网站自己的内容回答。请选一个问题，或自行输入。',
      th: 'ฉันตอบจากเนื้อหาของเว็บไซต์นี้ เลือกคำถามหรือพิมพ์เองได้เลย',
      ja: 'このサイトの内容からお答えします。質問を選ぶか、入力してください。'
    },
    placeholder: { en: 'Type a question…', 'zh-Hant': '輸入問題…', 'zh-Hans': '输入问题…', th: 'พิมพ์คำถาม…', ja: '質問を入力…' },
    send: { en: 'Send', 'zh-Hant': '送出', 'zh-Hans': '发送', th: 'ส่ง', ja: '送信' },
    unknown: {
      en: 'I do not have that on this site yet. The contact page reaches a person.',
      'zh-Hant': '網站目前未有呢個答案。聯絡頁可以找到真人。',
      'zh-Hans': '网站目前没有这个答案。联系页可以找到真人。',
      th: 'ยังไม่มีคำตอบนี้บนเว็บไซต์ หน้าติดต่อจะถึงตัวบุคคล',
      ja: 'このサイトにはまだその答えがありません。お問い合わせページで担当者に届きます。'
    },
    contact: { en: 'Contact us', 'zh-Hant': '聯絡我們', 'zh-Hans': '联系我们', th: 'ติดต่อเรา', ja: 'お問い合わせ' },
    live: { en: 'Live chat', 'zh-Hant': '真人對話', 'zh-Hans': '真人对话', th: 'แชทสด', ja: 'ライブチャット' },
    close: { en: 'Close', 'zh-Hant': '關閉', 'zh-Hans': '关闭', th: 'ปิด', ja: '閉じる' }
  };

  function locale() {
    return (root.FM && root.FM.i18n && root.FM.i18n.getLocale && root.FM.i18n.getLocale()) || 'en';
  }
  function t(field) {
    var l = locale();
    return (field && (field[l] || field.en)) || '';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function rootPath() {
    var segs = root.location.pathname.split('/').filter(Boolean);
    var file = segs[segs.length - 1] || '';
    var dirs = file.indexOf('.html') !== -1 ? segs.length - 1 : segs.length;
    return new Array(Math.max(0, dirs)).fill('..').join('/') + (dirs ? '/' : '');
  }

  /* ---- the knowledge base ---------------------------------------------- */
  function kb() {
    var d = (root.FM && root.FM.data) || {};
    return d.faq || [];
  }

  var STOP = ('a,an,and,are,as,at,be,but,by,can,do,does,for,from,has,have,how,i,in,is,it,its,me,my,of,on,or,that,the,their,them,then,there,these,this,to,was,were,what,when,where,which,who,why,will,with,you,your,' +
    '嘅,係,同,及,或,我,你,佢,的,了,嗎,呢,係咪,可以,有,無,係唔係,請問,想,要').split(',');

  function terms(s) {
    var out = String(s || '').toLowerCase().match(/[a-z0-9\u4e00-\u9fff\u0e00-\u0e7f\u3040-\u30ff]+/g) || [];
    return out.filter(function (w) { return w.length > 1 && STOP.indexOf(w) === -1; });
  }

  /* Score every FAQ entry against the question and return the best, but only if
   * it clears a floor — a wrong confident answer is worse than admitting the
   * gap, especially on a site whose whole point is not overclaiming. */
  function answer(query) {
    var q = terms(query);
    if (!q.length) return null;
    var l = locale();
    var best = null;
    kb().forEach(function (item) {
      var text = terms((item.q[l] || item.q.en) + ' ' + (item.a[l] || item.a.en)).join(' ');
      var score = 0;
      q.forEach(function (w) { if (text.indexOf(w) !== -1) score += w.length > 3 ? 2 : 1; });
      if (!best || score > best.score) best = { item: item, score: score };
    });
    return best && best.score >= 2 ? best.item : null;
  }

  /* ---- UI --------------------------------------------------------------- */
  var wrap = null, log = null, input = null;

  function build() {
    wrap = doc.createElement('div');
    wrap.id = 'fm-assistant';
    wrap.innerHTML =
      '<button type="button" class="fm-asst-btn" data-asst-toggle aria-expanded="false">' +
        '<span aria-hidden="true">?</span><span class="fm-asst-btn-label">' + esc(t(STRINGS.open)) + '</span>' +
      '</button>' +
      '<div class="fm-asst-panel" role="dialog" aria-label="' + esc(t(STRINGS.title)) + '" hidden>' +
        '<div class="fm-asst-head">' +
          '<strong>' + esc(t(STRINGS.title)) + '</strong>' +
          '<button type="button" class="fm-asst-close" data-asst-close aria-label="' + esc(t(STRINGS.close)) + '">&times;</button>' +
        '</div>' +
        '<div class="fm-asst-log" data-asst-log aria-live="polite"></div>' +
        '<div class="fm-asst-chips" data-asst-chips></div>' +
        '<form class="fm-asst-form" data-asst-form>' +
          '<input type="text" data-asst-input placeholder="' + esc(t(STRINGS.placeholder)) + '" aria-label="' + esc(t(STRINGS.placeholder)) + '">' +
          '<button class="btn btn--sm btn--primary" type="submit">' + esc(t(STRINGS.send)) + '</button>' +
        '</form>' +
      '</div>';
    doc.body.appendChild(wrap);

    log = wrap.querySelector('[data-asst-log]');
    input = wrap.querySelector('[data-asst-input]');

    say(t(STRINGS.intro), 'bot');
    renderChips();

    wrap.addEventListener('click', function (e) {
      var tg = e.target.closest ? e.target.closest('[data-asst-toggle]') : null;
      var cl = e.target.closest ? e.target.closest('[data-asst-close]') : null;
      var chip = e.target.closest ? e.target.closest('[data-asst-chip]') : null;
      if (tg) { toggle(); return; }
      if (cl) { toggle(false); return; }
      if (chip) {
        var id = chip.getAttribute('data-asst-chip');
        var item = kb().filter(function (i) { return i.id === id; })[0];
        /* t() — item.q is the five-language object, not a string. Passing the
         * object straight in made the matcher score "[object Object]" and fall
         * through to "I do not know" for every chip. */
        if (item) { ask(t(item.q)); }
      }
    });
    wrap.querySelector('[data-asst-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      ask(v);
      input.value = '';
    });
  }

  function renderChips() {
    var box = wrap.querySelector('[data-asst-chips]');
    box.innerHTML = kb().slice(0, 5).map(function (i) {
      return '<button type="button" class="fm-asst-chip" data-asst-chip="' + esc(i.id) + '">' +
        esc(t(i.q)) + '</button>';
    }).join('');
  }

  function say(text, who, links) {
    var p = doc.createElement('div');
    p.className = 'fm-asst-msg fm-asst-msg--' + who;
    p.innerHTML = esc(text);
    if (links && links.length) {
      links.forEach(function (l) {
        var a = doc.createElement('a');
        a.href = l.href;
        a.textContent = l.label;
        p.appendChild(doc.createElement('br'));
        p.appendChild(a);
      });
    }
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  function ask(question) {
    say(question, 'me');
    var hit = answer(question);
    var l = locale();
    if (hit) {
      var links = (hit.links || []).map(function (x) {
        return { href: rootPath() + x.href, label: (x.label[l] || x.label.en) };
      });
      say(hit.a[l] || hit.a.en, 'bot', links);
      if (root.FM && root.FM.analytics) root.FM.analytics.track('assistant_answer', { label: hit.id });
    } else {
      say(t(STRINGS.unknown), 'bot', [{ href: rootPath() + 'contact.html', label: t(STRINGS.contact) }]);
      if (root.FM && root.FM.analytics) root.FM.analytics.track('assistant_unknown', { label: question.slice(0, 60) });
    }
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : wrap.querySelector('.fm-asst-panel').hidden;
    wrap.querySelector('.fm-asst-panel').hidden = !open;
    wrap.querySelector('[data-asst-toggle]').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && input) input.focus();
  }

  /* ---- optional Tawk.to live chat -------------------------------------- */
  function loadTawk() {
    if (!chatCfg.tawkPropertyId) return false;
    if (!(root.FM && root.FM.consent && root.FM.consent.allows('chat'))) return false;
    if (root.__fmTawk) return true;
    root.__fmTawk = true;
    root.Tawk_API = root.Tawk_API || {};
    root.Tawk_LoadStart = new Date();
    var s = doc.createElement('script');
    s.async = true;
    s.src = 'https://embed.tawk.to/' + chatCfg.tawkPropertyId + '/' + (chatCfg.tawkWidgetId || 'default');
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    doc.head.appendChild(s);
    return true;
  }

  function init() {
    if (kb().length) build();
    if (loadTawk()) {
      /* a configured, consented live chat takes over: hide the local launcher
       * so visitors are not offered two chat buttons */
      if (wrap) wrap.hidden = true;
      return;
    }
    doc.addEventListener('fm:consent', function (e) {
      if (e.detail && e.detail.chat && loadTawk() && wrap) wrap.hidden = true;
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof globalThis !== 'undefined' ? globalThis : this);
