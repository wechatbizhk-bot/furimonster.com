/* =========================================================================
 * assets/js/chrome.js — shared header, drawer, footer and social links.
 *
 * The brief asks for a Header / MegaNav / LanguageSwitcher that behaves the
 * same on all 15 pages. Rather than paste the same nav into 15 files (where
 * it drifts), the chrome is built once here and injected on load. Each page
 * only declares which nav item is current, via <body data-page="...">.
 *
 * SEO note: primary content (headings, copy, character data) is written into
 * each page as real HTML, so it is crawlable without JS. Only the repeated
 * chrome is injected, and a <noscript> nav is provided as a fallback.
 * ========================================================================= */
(function (root) {
  'use strict';

  var FM = root.FM = root.FM || {};

  /* ---- inline social icons (no icon font, no network) ------------------ */
  var ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>',
    threads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21c4.4 0 7-2.7 7-6.6 0-2.9-1.6-4.7-3.7-5.3.5-2.4 2-3.6 3.7-3.3"/><path d="M12 21c-4.4 0-7-2.7-7-9s2.6-9 7-9c3.4 0 5.5 1.6 6.3 3.6"/><path d="M9.5 14.2c0-1.4 1.1-2.3 2.9-2.3 2.4 0 3.3 1.3 3.3 3.3 0 1.6-1 2.6-2.6 2.6-1.5 0-2.4-.9-2.4-2 0-1.5 1.4-2.4 4.2-2.4"/></svg>',
    xiaohongshu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3.5"/><path d="M7 10.2h4.2M9.1 8.2v4.6M6.2 15.6c2.6-1 5.6-1 8.6 0"/><path d="M15.4 9.4h3.2M17 8.2v4.4M15.6 14.6h3"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12s0-3-.4-4.3c-.2-.8-.9-1.4-1.6-1.6C18.6 5.7 12 5.7 12 5.7s-6.6 0-8 .4c-.7.2-1.4.8-1.6 1.6C2 9 2 12 2 12s0 3 .4 4.3c.2.8.9 1.4 1.6 1.6 1.4.4 8 .4 8 .4s6.6 0 8-.4c.7-.2 1.4-.8 1.6-1.6C22 15 22 12 22 12zM10 15.2V8.8l5.4 3.2z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3h-2.7v11.4a2.4 2.4 0 1 1-2.4-2.4c.2 0 .4 0 .6.1V9.3a5.1 5.1 0 1 0 4.4 5v-5a5.6 5.6 0 0 0 3.3 1.1V7.7a3.2 3.2 0 0 1-3.2-3.2z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>'
  };

  /* ---- nav model ------------------------------------------------------- *
   * `page` matches <body data-page="…">. Every item from the brief appears in
   * both the inline nav and the drawer; the drawer groups them into Explore /
   * Business so it stays scannable on a phone. Pages added afterwards (games,
   * stickers) join the Business group, which keeps the inline row — the part
   * that has a fixed width budget — exactly as it was.
   * -------------------------------------------------------------------- */
  var NAV = [
    { page: 'home',         href: 'index.html',          key: 'nav.home',           group: 'explore' },
    { page: 'furi-planet',  href: 'furi-planet.html',    key: 'nav.planet',         group: 'explore' },
    { page: 'characters',   href: 'characters.html',     key: 'nav.characters',     group: 'explore' },
    { page: 'stories',      href: 'stories.html',        key: 'nav.stories',        group: 'explore' },
    { page: 'furi-lab',     href: 'furi-lab.html',       key: 'nav.lab',            group: 'explore' },
    /* The claw machine is a long label (151px) and was not part of the agreed
     * primary navigation, so it lives in the More menu with the other
     * secondary pages. Inline, the seven explore items measured 609px inside
     * the 432px the header has left after the brand and the tools, so the row
     * overflowed its own box and painted the last two items on top of the
     * language pills at every width — the header wrap is a fixed 1240px, so a
     * wider viewport never relieved it. */
    { page: 'play',         href: 'play.html',           key: 'nav.play',           group: 'business' },
    { page: 'stickers',     href: 'stickers.html',       key: 'nav.stickers',       group: 'business' },
    { page: 'collections',  href: 'collections.html',    key: 'nav.collections',    group: 'business' },
    { page: 'collaborations', href: 'collaborations.html', key: 'nav.collaborations', group: 'business' },
    { page: 'licensing',    href: 'licensing.html',      key: 'nav.licensing',      group: 'business' },
    { page: 'creator',      href: 'creator.html',        key: 'nav.creator',        group: 'business' },
    { page: 'news',         href: 'news.html',           key: 'nav.news',           group: 'business' },
    { page: 'contact',      href: 'contact.html',        key: 'nav.contact',        group: 'business' }
  ];

  /* Pages that live one directory down need a prefix.
   *
   * The build stamps the correct value onto <html data-root>, which is
   * authoritative and works from file:// as well as a server. The path test
   * underneath is only a fallback for a page opened without the stamp — it
   * previously missed /play/, which made every header link on the game pages
   * point one directory too high. */
  function prefix() {
    var attr = root.document && root.document.documentElement
      ? root.document.documentElement.getAttribute('data-root') : '';
    if (attr !== null && attr !== undefined && attr !== '') return attr;
    var p = root.location && root.location.pathname ? root.location.pathname : '';
    return /\/characters\//.test(p) || /\/stories\//.test(p) || /\/play\//.test(p) ? '../' : '';
  }

  function t(key) { return FM.i18n ? FM.i18n.t(key) : key; }
  function pick(f) { return FM.i18n ? FM.i18n.pick(f) : (typeof f === 'string' ? f : f && f.en); }

  function logoMark() {
    /* the three-pointed crown, drawn as paths so it scales cleanly */
    return '<svg class="brand-mark" viewBox="0 0 40 40" role="img" aria-label="FURI MONSTER">' +
      '<circle cx="20" cy="20" r="18.5" fill="none" stroke="#FEC82A" stroke-width="2"/>' +
      '<path d="M10 25.5 L10 14 L15.5 19 L20 10.5 L24.5 19 L30 14 L30 25.5 Z" fill="#FEC82A" stroke="#020202" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="15.5" cy="27.5" r="1.6" fill="#FDFEFD"/><circle cx="20" cy="27.5" r="1.6" fill="#FDFEFD"/><circle cx="24.5" cy="27.5" r="1.6" fill="#FDFEFD"/>' +
      '</svg>';
  }

  /* full = spell the language out (footer / drawer); compact = short label */
  function langButtons(full) {
    var out = '';
    FM.i18n.locales.forEach(function (l) {
      var on = FM.i18n.getLocale() === l.id;
      out += '<button type="button" data-locale="' + l.id + '" aria-pressed="' + on +
        '" title="' + attr(l.name) + '">' + esc(full ? l.name : l.label) + '</button>';
    });
    return out;
  }

  function socialLinks(cls) {    var cfg = FM.config;
    var out = '<div class="social-row" role="list" aria-label="' + attr(t('a11y.socialLinks')) + '">';
    cfg.social.forEach(function (s) {
      out += '<a class="social-link ' + (cls || '') + '" role="listitem" href="' + attr(s.href) +
        '" target="_blank" rel="noopener noreferrer me" title="' + attr(s.label + ' — ' + s.handle) +
        '" aria-label="' + attr(s.label + ' — ' + s.handle) + '">' + (ICONS[s.icon] || '') + '</a>';
    });
    return out + '</div>';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function attr(s) { return esc(s); }

  /* ---- build ----------------------------------------------------------- */
  function headerHtml(currentPage) {
    var p = prefix();
    var inline = '';
    /* The header must never push the language switcher off the screen.
     *
     * With all twelve items inline the nav measured 1079px and the tools 326px
     * inside a 1240px container — a 476px overflow that put the language
     * pills and the Translate button past the right edge of the viewport, so
     * they were built and present but invisible. The five business pages now
     * live behind a labelled "More" menu, which is what keeps the row inside
     * its box at every width. The drawer still lists all twelve. */
    var inline = '', more = '', moreActive = false;
    NAV.forEach(function (n) {
      var cur = n.page === currentPage ? ' aria-current="page"' : '';
      var a = '<a href="' + p + n.href + '"' + cur + '>' + esc(t(n.key)) + '</a>';
      if (n.group === 'business') {
        more += a;
        if (n.page === currentPage) moreActive = true;
      } else {
        inline += '<li>' + a + '</li>';
      }
    });

    var langs = langButtons(false);

    return '' +
      '<a class="btn btn--sm" href="#main" style="position:absolute;left:-9999px;top:8px;z-index:99" onfocus="this.style.left=\'8px\'" onblur="this.style.left=\'-9999px\'">' + esc(t('nav.skip')) + '</a>' +
      '<div class="wrap header-inner">' +
        '<a class="brand" href="' + p + 'index.html">' + logoMark() +
          '<span class="brand-text"><span class="brand-name">Furi Monster</span>' +
          '<span class="brand-sub">Enter Furi Planet</span></span></a>' +
        '<nav class="nav-inline" aria-label="Primary"><ul>' + inline + '</ul></nav>' +
        '<div class="header-tools">' +
          '<div class="lang-switch" role="group" aria-label="' + attr(t('a11y.langSwitch')) + '">' + langs + '</div>' +
          '<div class="nav-more">' +
            '<button class="btn btn--sm more-btn" type="button" data-more-open aria-expanded="false" aria-controls="fm-more-panel"' +
              (moreActive ? ' data-active="true"' : '') + '>' +
              esc(t('nav.more')) + ' <span aria-hidden="true">▾</span></button>' +
            '<div class="nav-more-panel" id="fm-more-panel" role="menu">' + more + '</div>' +
          '</div>' +
          '<button class="btn btn--sm gt-btn" type="button" data-translate-open aria-expanded="false" ' +
            'title="' + attr(t('translate.more')) + '" ' +
            'aria-label="' + attr(t('translate.more')) + '">' + globesvg() +
            '<span class="gt-label">' + esc(t('translate.short')) + '</span></button>' +
          '<button class="btn btn--sm menu-btn" type="button" data-drawer-open aria-expanded="false" aria-controls="fm-drawer">' +
            '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>' +
            '<span class="label">' + esc(t('nav.menu')) + '</span></button>' +
        '</div>' +
      '</div>';
  }

  /* The globe needs explicit width/height attributes. With only a viewBox and
   * the global `svg { height: auto }` reset it measured 0px wide once the
   * header was under flex pressure, i.e. the Translate button rendered as an
   * empty pill. */
  function globesvg() {
    return '<svg class="gt-globe" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>';
  }

  function drawerHtml(currentPage) {
    var p = prefix();
    var groups = { explore: [], business: [] };
    NAV.forEach(function (n, i) { groups[n.group].push({ n: n, i: i }); });

    function list(items, titleKey) {
      var out = '<div class="footer-col"><h4>' + esc(t(titleKey)) + '</h4><ul>';
      items.forEach(function (o) {
        out += '<li><a href="' + p + o.n.href + '">' + esc(t(o.n.key)) + '</a></li>';
      });
      return out + '</ul></div>';
    }

    var big = '';
    NAV.forEach(function (n, i) {
      var cur = n.page === currentPage ? ' aria-current="page"' : '';
      big += '<a href="' + p + n.href + '"' + cur + '><span class="num">' +
        String(i + 1).padStart(2, '0') + '</span>' + esc(t(n.key)) + '</a>';
    });

    return '' +
      '<div class="drawer-inner">' +
        '<button class="drawer-close" type="button" data-drawer-close aria-label="' + attr(t('nav.close')) + '">✕</button>' +
        '<nav class="drawer-nav" aria-label="All pages">' + big + '</nav>' +
        '<div class="drawer-foot">' +
          langBlock() +
          '<div class="footer-col"><h4>' + esc(t('footer.follow')) + '</h4>' + socialLinks() + '</div>' +
          '<div class="footer-grid">' + list(groups.explore, 'footer.explore') + list(groups.business, 'footer.business') + '</div>' +
        '</div>' +
      '</div>';
  }

  /* Five language buttons take about 240px. On a phone that no longer fits
   * beside the brand mark, so below 760px the header switcher is hidden by CSS
   * and the full, spelled-out list lives here in the drawer instead. */
  function langBlock() {
    var out = '<div class="footer-col"><h4>' + esc(t('a11y.langSwitch')) + '</h4>' +
      '<div class="lang-switch lang-switch--drawer" role="group" aria-label="' + attr(t('a11y.langSwitch')) + '">';
    FM.i18n.locales.forEach(function (l) {
      var on = FM.i18n.getLocale() === l.id;
      out += '<button type="button" data-locale="' + l.id + '" aria-pressed="' + on + '" title="' + attr(l.name) + '">' +
        esc(l.name) + '</button>';
    });
    out += '</div>' +
      '<button class="btn btn--sm" type="button" data-translate-open style="margin-top:12px">' +
      '<span style="display:inline-flex;width:14px;height:14px">' + ICONS.globe + '</span> Google Translate &mdash; more languages</button>' +
      '</div>';
    return out;
  }

  function footerHtml() {
    var p = prefix();
    var cfg = FM.config;
    var explore = '', business = '';
    NAV.forEach(function (n) {
      var row = '<li><a href="' + p + n.href + '">' + esc(t(n.key)) + '</a></li>';
      if (n.group === 'explore') explore += row; else business += row;
    });

    function mail(k, label) {
      return '<li><a href="mailto:' + attr(cfg.contact[k]) + '">' + esc(label) + '</a></li>';
    }

    return '' +
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div class="footer-col">' +
            '<p class="footer-brandline">FURI MONSTER</p>' +
            '<p class="muted small">' + esc(pick(cfg.tagline)) + '</p>' +
            '<div style="margin-top:20px">' + socialLinks('social-link--sm') + '</div>' +
            '<form class="newsletter-form" data-form="newsletter" novalidate style="margin-top:20px">' +
              '<label class="tiny mono" for="nl-mail" style="align-self:center">' + esc(t('footer.newsletter')) + '</label>' +
              '<input id="nl-mail" name="email" type="email" required placeholder="you@example.com" aria-label="Email">' +
              '<button class="btn btn--sm btn--primary" type="submit">' + esc(t('footer.subscribe')) + '</button>' +
              '<div class="form-status" data-status></div>' +
            '</form>' +
          '</div>' +
          '<div class="footer-col"><h4>' + esc(t('footer.explore')) + '</h4><ul>' + explore + '</ul></div>' +
          '<div class="footer-col"><h4>' + esc(t('footer.business')) + '</h4><ul>' + business + '</ul></div>' +
          /* The language control belongs somewhere it cannot be missed. The
           * header has to hide its switcher below 760px, and a control that
           * only exists in a drawer is a control nobody finds — so the footer
           * spells all five languages out in full. */
          '<div class="footer-col footer-lang">' +
            '<h4>' + esc(t('footer.language')) + '</h4>' +
            '<div class="lang-switch lang-switch--footer" role="group" aria-label="' + attr(t('a11y.langSwitch')) + '">' + langButtons(true) + '</div>' +
            '<button class="btn btn--sm gt-btn" type="button" data-translate-open aria-expanded="false">' +
              globesvg() + '<span class="gt-label">' + esc(t('translate.short')) + '</span></button>' +
            '<p class="tiny muted" style="margin:10px 0 0">' + esc(t('translate.more')) + '</p>' +
          '</div>' +
          '<div class="footer-col"><h4>' + esc(t('footer.contact')) + '</h4><ul>' +
            mail('general', cfg.contact.general) +
            mail('licensing', cfg.contact.licensing) +
            mail('media', cfg.contact.media) +
            mail('exhibition', cfg.contact.exhibition) +
          '</ul></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>© ' + new Date().getFullYear() + ' FURI MONSTER. ' + esc(t('footer.rights')) + '</span>' +
          '<span class="pill-list">' +
            '<a class="pill" href="' + p + 'privacy.html">' + esc(t('footer.privacy')) + '</a>' +
            '<a class="pill" href="' + p + 'terms.html">' + esc(t('footer.terms')) + '</a>' +
            '<a class="pill" href="' + p + 'ai-content-notice.html">' + esc(t('footer.ai')) + '</a>' +
            /* consent must be as easy to withdraw as to give, so the control
               lives here on every page rather than only in the banner */
            '<button type="button" class="pill" data-consent-open>' + esc(t('footer.cookies')) + '</button>' +
          '</span>' +
        '</div>' +
        '<p class="tiny muted" style="margin-top:18px;max-width:70ch">' + esc(t('footer.unofficialNote')) + '</p>' +
        /* The Thai and Japanese page text is machine translated, and saying so
           is not optional: the alternative is a visitor reading a translation
           and assuming a human wrote it. This is the built-in Thai/Japanese
           copy, which is different from the on-demand Google Translate bar —
           that one carries its own warning. */
        '<p class="tiny muted" style="margin-top:8px;max-width:70ch" data-mt-notice>' +
          esc(t('footer.mtNotice')) + '</p>' +
      '</div>';
  }

  /* ---- mount ----------------------------------------------------------- */
  function mount() {
    var body = root.document.body;
    var page = body.getAttribute('data-page') || '';
    var header = root.document.getElementById('fm-header');
    var drawer = root.document.getElementById('fm-drawer');
    var footer = root.document.getElementById('fm-footer');

    /* Tell the art layer where it is. The sprites are referenced by every page,
     * including ones one directory down, so the base has to come from the same
     * place the chrome gets its link prefix. */
    if (FM.art && FM.art.setBase) FM.art.setBase(prefix());

    if (header) { header.className = 'site-header'; header.innerHTML = headerHtml(page); }
    if (drawer) { drawer.className = 'drawer'; drawer.id = 'fm-drawer'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.innerHTML = drawerHtml(page); }
    if (footer) { footer.className = 'site-footer'; footer.innerHTML = footerHtml(); }

    /* sticky state */
    var onScroll = function () {
      if (!header) return;
      header.classList.toggle('is-stuck', root.scrollY > 12);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* --- the "More" menu (the five business pages) --------------------- */
    var moreOpen = false;
    function openMore() {
      var panel = header && header.querySelector('.nav-more-panel');
      var btn = header && header.querySelector('[data-more-open]');
      if (!panel) return;
      moreOpen = true;
      panel.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
    function closeMore() {
      if (!moreOpen) return;
      var panel = header && header.querySelector('.nav-more-panel');
      var btn = header && header.querySelector('[data-more-open]');
      moreOpen = false;
      if (panel) panel.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    /* drawer open/close with focus trapping and Escape */
    var lastFocus = null;
    function open() {
      lastFocus = root.document.activeElement;
      drawer.classList.add('is-open');
      body.style.overflow = 'hidden';
      var btn = header && header.querySelector('[data-drawer-open]');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      var first = drawer.querySelector('[data-drawer-close]');
      if (first) first.focus();
    }
    function close() {
      drawer.classList.remove('is-open');
      body.style.overflow = '';
      var btn = header && header.querySelector('[data-drawer-open]');
      if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      else if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    root.document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-drawer-open]')) { closeMore(); open(); return; }
      if (e.target.closest && e.target.closest('[data-drawer-close]')) { close(); return; }
      if (drawer && drawer.classList.contains('is-open') && e.target === drawer) { close(); return; }

      /* the "More" menu holds the five business pages */
      var toggle = e.target.closest && e.target.closest('[data-more-open]');
      if (toggle) { moreOpen ? closeMore() : openMore(); return; }
      if (e.target.closest && e.target.closest('.nav-more-panel a')) { closeMore(); return; }
      if (moreOpen && !(e.target.closest && e.target.closest('.nav-more'))) closeMore();
    });
    root.document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (moreOpen) closeMore();
        if (drawer && drawer.classList.contains('is-open')) close();
      }
      /* simple focus trap */
      if (e.key === 'Tab' && drawer && drawer.classList.contains('is-open')) {
        var f = drawer.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && root.document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && root.document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  FM.chrome = {
    mount: mount,
    nav: NAV,
    icons: ICONS,
    socialLinks: socialLinks,
    prefix: prefix,
    esc: esc,
    logoMark: logoMark
  };

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
