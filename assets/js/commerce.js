/* =========================================================================
 * assets/js/commerce.js — a working cart with NO payment provider.
 *
 * WHAT THIS IS: real cart mechanics. Items persist in localStorage, survive
 * navigation, can be added, changed and removed, and the drawer shows a correct
 * subtotal. Product data comes from site.config.js.
 *
 * WHAT THIS DELIBERATELY IS NOT: a shop. There is no payment provider, so the
 * order button is DISABLED and says why. Taking an order that cannot be
 * fulfilled would be worse than having no cart at all — and the site's own
 * honesty rule is that anything not yet real is labelled as such.
 *
 * TO GO LIVE: set commerce.providerCheckoutUrl (Shopify Buy Button, Snipcart,
 * Stripe Checkout…) and add products. The hand-off passes the referral code
 * from affiliate.js when one is present.
 * ========================================================================= */
(function (root) {
  'use strict';

  var doc = root.document;
  var cfg = (root.FM && root.FM.config && root.FM.config.commerce) || { enabled: false, products: [] };
  var KEY = 'fm.cart.v1';

  var STRINGS = {
    cart: { en: 'Cart', 'zh-Hant': '購物車', 'zh-Hans': '购物车', th: 'ตะกร้า', ja: 'カート' },
    empty: {
      en: 'Your cart is empty.',
      'zh-Hant': '你的購物車是空的。',
      'zh-Hans': '你的购物车是空的。',
      th: 'ตะกร้าของคุณว่างเปล่า',
      ja: 'カートは空です。'
    },
    add: { en: 'Add', 'zh-Hant': '加入', 'zh-Hans': '加入', th: 'เพิ่ม', ja: '追加' },
    remove: { en: 'Remove', 'zh-Hant': '移除', 'zh-Hans': '移除', th: 'ลบ', ja: '削除' },
    subtotal: { en: 'Subtotal', 'zh-Hant': '小計', 'zh-Hans': '小计', th: 'ยอดรวมย่อย', ja: '小計' },
    checkout: { en: 'Checkout', 'zh-Hant': '前往結帳', 'zh-Hans': '前往结账', th: 'ชำระเงิน', ja: 'レジへ' },
    notConnected: {
      en: 'Checkout is not connected — nothing on this site is on sale yet.',
      'zh-Hant': '結帳功能尚未連接 —— 本網站目前沒有任何商品發售。',
      'zh-Hans': '结账功能尚未连接 —— 本网站目前没有任何商品发售。',
      th: 'ยังไม่ได้เชื่อมต่อการชำระเงิน — ยังไม่มีสินค้าจำหน่ายบนเว็บนี้',
      ja: '決済は未接続です。このサイトに販売中の商品はありません。'
    },
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
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function money(n) {
    var cur = cfg.currency || 'HKD';
    try {
      return new root.Intl.NumberFormat(locale(), { style: 'currency', currency: cur }).format(n);
    } catch (e) {
      return cur + ' ' + Number(n).toFixed(2);
    }
  }

  var products = {};
  (cfg.products || []).forEach(function (p) { products[p.id] = p; });

  /* ---- state ----------------------------------------------------------- */
  function read() {
    try {
      var v = JSON.parse(root.localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(function (i) { return products[i.id]; }) : [];
    } catch (e) { return []; }
  }
  function write(v) {
    try { root.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
    render();
    doc.dispatchEvent(new root.CustomEvent('fm:cart', { detail: { items: v } }));
  }

  var items = read();

  function count() { return items.reduce(function (n, i) { return n + i.qty; }, 0); }
  function subtotal() {
    return items.reduce(function (n, i) {
      var p = products[i.id];
      return n + (p ? p.price * i.qty : 0);
    }, 0);
  }

  var api = {
    items: function () { return items.slice(); },
    count: count,
    subtotal: subtotal,
    add: function (id, qty) {
      if (!products[id]) return false;
      var found = items.filter(function (i) { return i.id === id; })[0];
      if (found) found.qty += (qty || 1);
      else items.push({ id: id, qty: qty || 1 });
      write(items);
      if (root.FM && root.FM.analytics) root.FM.analytics.track('cart_add', { label: id });
      return true;
    },
    setQty: function (id, qty) {
      items = items.map(function (i) { return i.id === id ? { id: i.id, qty: Math.max(1, qty) } : i; });
      write(items);
    },
    remove: function (id) {
      items = items.filter(function (i) { return i.id !== id; });
      write(items);
    },
    clear: function () { items = []; write(items); },
    canCheckout: function () { return !!(cfg.providerCheckoutUrl && items.length); }
  };

  /* ---- drawer ---------------------------------------------------------- */
  var drawer = null, badge = null;

  function render() {
    if (badge) {
      var n = count();
      badge.textContent = n ? String(n) : '';
      badge.hidden = !n;
    }
    if (!drawer) return;
    var body = drawer.querySelector('[data-cart-items]');
    if (!items.length) {
      body.innerHTML = '<p class="fm-cart-empty">' + esc(t(STRINGS.empty)) + '</p>';
    } else {
      body.innerHTML = items.map(function (i) {
        var p = products[i.id];
        if (!p) return '';
        return '<div class="fm-cart-row">' +
          '<span class="fm-cart-name">' + esc(p.name[locale()] || p.name.en) + '</span>' +
          '<input class="fm-cart-qty" type="number" min="1" value="' + i.qty + '" data-cart-qty="' + esc(i.id) + '" aria-label="Quantity">' +
          '<span class="fm-cart-price">' + esc(money(p.price * i.qty)) + '</span>' +
          '<button type="button" class="fm-cart-rm" data-cart-remove="' + esc(i.id) + '">&times;</button>' +
          '</div>';
      }).join('');
    }
    var foot = drawer.querySelector('[data-cart-foot]');
    var url = cfg.providerCheckoutUrl;
    var ready = api.canCheckout();
    if (url && root.FM && root.FM.affiliate) url = root.FM.affiliate.decorate(url);
    foot.innerHTML =
      '<div class="fm-cart-sub"><span>' + esc(t(STRINGS.subtotal)) + '</span><b>' + esc(money(subtotal())) + '</b></div>' +
      (ready
        ? '<a class="btn btn--sm btn--primary" href="' + esc(url) + '">' + esc(t(STRINGS.checkout)) + '</a>'
        : '<button class="btn btn--sm" type="button" disabled>' + esc(t(STRINGS.checkout)) + '</button>' +
          '<p class="fm-cart-note">' + esc(t(STRINGS.notConnected)) + '</p>');
    drawer.querySelectorAll('[data-cart-qty]').forEach(function (el) {
      el.addEventListener('change', function () { api.setQty(el.getAttribute('data-cart-qty'), parseInt(el.value, 10) || 1); });
    });
    drawer.querySelectorAll('[data-cart-remove]').forEach(function (el) {
      el.addEventListener('click', function () { api.remove(el.getAttribute('data-cart-remove')); });
    });
  }

  function buildDrawer() {
    drawer = doc.createElement('aside');
    drawer.id = 'fm-cart-drawer';
    drawer.setAttribute('aria-label', t(STRINGS.cart));
    drawer.innerHTML =
      '<div class="fm-cart-head"><strong>' + esc(t(STRINGS.cart)) + '</strong>' +
        '<button type="button" class="fm-cart-close" data-cart-close aria-label="' + esc(t(STRINGS.close)) + '">&times;</button></div>' +
      '<div class="fm-cart-body" data-cart-items></div>' +
      '<div class="fm-cart-foot" data-cart-foot></div>';
    doc.body.appendChild(drawer);

    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'fm-cart-btn';
    btn.setAttribute('data-cart-open', '');
    btn.innerHTML = '<span aria-hidden="true">🛒</span><span class="fm-cart-btn-label">' + esc(t(STRINGS.cart)) + '</span>' +
      '<span class="fm-cart-badge" hidden></span>';
    doc.body.appendChild(btn);
    badge = btn.querySelector('.fm-cart-badge');

    doc.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-cart-open]')) { drawer.classList.add('is-open'); return; }
      if (e.target.closest && e.target.closest('[data-cart-close]')) { drawer.classList.remove('is-open'); return; }
      var add = e.target.closest ? e.target.closest('[data-add-to-cart]') : null;
      if (add) {
        api.add(add.getAttribute('data-add-to-cart'), 1);
        drawer.classList.add('is-open');
      }
    });
  }

  root.FM = root.FM || {};
  root.FM.cart = api;

  function init() {
    if (!cfg.enabled) return;
    buildDrawer();
    render();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof globalThis !== 'undefined' ? globalThis : this);
