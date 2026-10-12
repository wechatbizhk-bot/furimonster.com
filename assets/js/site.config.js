/* =========================================================================
 * assets/js/site.config.js — FURI MONSTER site configuration
 *
 * ⚠️  PLACEHOLDERS — CONFIRM BEFORE LAUNCH
 * Every value marked  NEEDS-CONFIRM  below is an editable placeholder.
 * No social handle, email address or territory has been confirmed, and per
 * the development brief (section 16, "Important content rule") nothing here
 * claims a completed partnership, award, investor or product availability.
 *
 * To update: edit this one file. The header, footer, share buttons, contact
 * page, licensing page and SEO tags all read from it.
 * ========================================================================= */
(function (root) {
  'use strict';

  var SITE = {
    /* ---- identity ------------------------------------------------------ */
    /* The live host serves the apex domain and redirects www to it (verified by
     * fetching https://www.furimonster.com), so the apex is the canonical host.
     * Using www here would make every canonical, og:url and sitemap entry point
     * at a URL that redirects. Change both lines together if that ever flips. */
    domain: 'furimonster.com',
    url: 'https://furimonster.com',                   // no trailing slash
    name: 'FURI MONSTER',
    tagline: {
      en: 'Anger can destroy a world, or become the power that protects one.',
      'zh-Hant': '憤怒可以毀滅一個世界，也可以成為守護世界的力量。',
      'zh-Hans': '愤怒可以毁灭一个世界，也可以成为守护世界的力量。',
      th: 'ความโกรธทำลายโลกได้ หรือจะกลายเป็นพลังที่ปกป้องโลกก็ได้',
      ja: '怒りは世界を壊すこともできるし、世界を守る力にもなれる。'
    },
    positioning: {
      en: 'An official character IP world — six guardians, one planet.',
      'zh-Hant': '官方角色 IP 世界 —— 六位守護者，一顆星球。',
      'zh-Hans': '官方角色 IP 世界 —— 六位守护者，一颗星球。',
      th: 'โลกของตัวละคร IP อย่างเป็นทางการ — ผู้พิทักษ์หกตน หนึ่งดาวเคราะห์',
      ja: '公式キャラクターIPの世界 — 6人の守護者、ひとつの惑星。'
    },
    /* The authored locale set. This array is the single source of truth:
     * tools/build.js, tools/forms.js, the language switcher and the build
     * check all read it, so adding a language is one edit here plus the
     * translation blocks in i18n.js and data.js. */
    defaultLocale: 'en',
    locales: ['en', 'zh-Hant', 'zh-Hans', 'th', 'ja'],

    /* ---- social ------------------------------------------------------- *
     * Handles below are taken from the official FURI MONSTER accounts and the
     * QR codes supplied in the "Furi Monster SNS folder":
     *   Instagram  @FURI.MONSTER      (from the IG QR card)
     *   Threads    furi.monster       (from the Threads profile card)
     *   Xiaohongshu 小紅書號 FURIMONSTER, id 9585945715
     *
     * NEEDS-CONFIRM: the Facebook *page* URL is not printed on any supplied
     * asset — the FB card only shows the display name "Furimonster" and the
     * website link. `facebook` below is the conventional guess; correct it
     * before launch. The Xiaohongshu href is the share link found in the
     * Threads bio, which survives their no-public-profile-URL policy.
     *
     * `qr` points at the supplied QR image, used by the share section.
     * ------------------------------------------------------------------ */
    social: [
      { id: 'instagram', label: 'Instagram', handle: '@furi.monster',
        href: 'https://www.instagram.com/furi.monster/',
        qr: 'assets/img/social/qr-instagram.jpg', icon: 'instagram', primary: true },
      { id: 'facebook', label: 'Facebook', handle: 'Furimonster',
        href: 'https://www.facebook.com/furimonster/',      /* NEEDS-CONFIRM */
        qr: 'assets/img/social/qr-facebook.png', icon: 'facebook', primary: true },
      { id: 'threads', label: 'Threads', handle: '@furi.monster',
        href: 'https://www.threads.net/@furi.monster',
        qr: 'assets/img/social/qr-threads.jpg', icon: 'threads', primary: true },
      { id: 'xiaohongshu', label: '小紅書', handle: 'FURIMONSTER',
        href: 'https://xhslink.com/m/8nXVk8kfbl9',
        qr: 'assets/img/social/qr-xiaohongshu.jpg', icon: 'xiaohongshu', primary: true,
        note: { en: 'Xiaohongshu ID: FURIMONSTER (9585945715)',
                'zh-Hant': '小紅書號：FURIMONSTER（9585945715）',
                'zh-Hans': '小红书号：FURIMONSTER（9585945715）',
                th: 'ไอดี Xiaohongshu: FURIMONSTER (9585945715)',
                ja: '小紅書ID：FURIMONSTER（9585945715）' } }
    ],

    /* ---- contact (NEEDS-CONFIRM) -------------------------------------- */
    contact: {
      general:     'hello@furimonster.com',
      licensing:   'licensing@furimonster.com',
      media:       'media@furimonster.com',
      exhibition:  'events@furimonster.com',
      distribution:'partners@furimonster.com'
    },

    /* ---- forms -------------------------------------------------------- *
     * Phase 1 uses a hosted form endpoint so the static build stays static.
     * Set `endpoint` to a Formspree (or equivalent) URL to go live.
     * While it is empty, forms validate and show the local success state,
     * and the README explains the two-step swap.
     * ------------------------------------------------------------------ */
    forms: {
      endpoint: '',                                 // NEEDS-CONFIRM, e.g. https://formspree.io/f/xxxxxxx
      /* Shown only while `endpoint` is empty. It must read as something a
       * VISITOR can act on — an earlier version told them to edit
       * assets/js/site.config.js, which is an instruction for whoever runs the
       * site, not for the person trying to get in touch.
       *
       * It no longer names an address: the address depends on which form was
       * used (see routeByKind below) and is printed next to this note by
       * assets/js/app.js. Naming one address here meant a licensing enquiry was
       * told to write to hello@ while the link beside it opened licensing@. */
      fallbackNote: {
        en: 'This form is not connected to our inbox yet. Send it as an email instead and we will reply:',
        'zh-Hant': '此表單尚未接上收件匣。請改用電郵送出，我們會回覆你：',
        'zh-Hans': '此表单尚未接上收件箱。请改用邮件送出，我们会回复你：',
        th: 'แบบฟอร์มนี้ยังไม่ได้เชื่อมต่อกับกล่องจดหมายของเรา กรุณาส่งเป็นอีเมลแทน แล้วเราจะตอบกลับ:',
        ja: 'このフォームはまだ受信箱に接続されていません。代わりにメールでお送りください。返信します：'
      },
      /* Which address the email fallback sends each form to. Keys are the form
       * kinds (`data-form` on the <form>); values are keys of `contact` above.
       * Change these if an enquiry should land somewhere else. */
      routeByKind: {
        contact: 'general',
        licensing: 'licensing',
        collaboration: 'distribution',
        distribution: 'distribution',
        media: 'media',
        exhibition: 'exhibition',
        newsletter: 'general'
      }
    },

    /* ---- analytics ---------------------------------------------------- *
     * Event hooks fire regardless; they only reach a network when a GA4
     * measurement id is set. See assets/js/analytics.js.
     * ------------------------------------------------------------------ */
    analytics: {
      ga4: '',                                      // NEEDS-CONFIRM, e.g. G-XXXXXXXXXX
      debug: false
    },

    /* ---- chat ---------------------------------------------------------- *
     * Empty by default, and then NO chat widget is loaded at all. Set
     * tawkPropertyId to switch on Tawk.to; even then it loads only after the
     * visitor allows chat in the consent panel.
     * ------------------------------------------------------------------ */
    chat: {
      tawkPropertyId: '',                           // NEEDS-CONFIRM, e.g. '5f1a2b3c4d5e6f7g8h9i'
      tawkWidgetId: 'default'
    },

    /* ---- newsletter / EDM ---------------------------------------------- *
     * Same mechanism as the contact forms: an endpoint from your email service
     * provider (Brevo, MailerLite, Mailchimp…). While it is empty the footer
     * form tells the visitor to email instead of pretending to subscribe them.
     * ------------------------------------------------------------------ */
    newsletter: {
      endpoint: '',                                 // NEEDS-CONFIRM
      requireConsent: true,
      fallbackNote: {
        en: 'The newsletter is not open yet — email hello@furimonster.com and we will add you.',
        'zh-Hant': '電子報尚未開放 —— 請電郵 hello@furimonster.com，我們會為你加入。',
        'zh-Hans': '电子报尚未开放 —— 请电邮 hello@furimonster.com，我们会为你加入。',
        th: 'จดหมายข่าวยังไม่เปิด — กรุณาอีเมล hello@furimonster.com แล้วเราจะเพิ่มให้',
        ja: 'ニュースレターはまだ開始していません。hello@furimonster.com までメールをお送りください。'
      }
    },

    /* ---- commerce (FRAMEWORK ONLY — no payment provider) --------------- *
     * The cart is a working cart: it keeps state in localStorage and survives
     * navigation. Checkout is deliberately NOT connected, and the UI says so,
     * because nothing on this site is for sale yet.
     *
     * To go live: add product entries below and set providerCheckoutUrl to a
     * Shopify Buy Button / Snipcart / Stripe Checkout URL. Nothing else changes.
     * ------------------------------------------------------------------ */
    commerce: {
      enabled: true,
      currency: 'HKD',
      providerCheckoutUrl: '',                      // NEEDS-CONFIRM — empty means checkout stays disabled
      /* Real products go here. Shape:
       * { id, name: {en,zh-Hant,zh-Hans,th,ja}, price, category, image, note } */
      products: []
    },

    /* ---- affiliate / referral ------------------------------------------ *
     * Captures ?ref= on arrival, remembers it, and reports it as an analytics
     * event. This is attribution only — there is no commission or payout, which
     * needs an affiliate platform.
     * ------------------------------------------------------------------ */
    affiliate: {
      param: 'ref',
      days: 30
    },

    /* ---- SEO defaults ------------------------------------------------- */
    seo: {
      ogImage: '/assets/img/og/default.png',
      twitter: '',                                  // NEEDS-CONFIRM
      themeColor: '#05060B'
    },

    /* ---- business status flags --------------------------------------- *
     * Drives the automatic "Concept / Coming Soon" badges that the brief
     * requires so nothing reads as already available.
     * ------------------------------------------------------------------ */
    status: {
      productsAvailable: false,     // no SKU is confirmed as shipping
      licensingOpen: true,          // licensing enquiries are welcome
      pressKitReady: false,         // brand deck not finalised
      territoriesPublished: false   // do not publish a territory list yet
    }
  };

  root.FM = root.FM || {};
  root.FM.config = SITE;
  if (typeof module !== 'undefined' && module.exports) module.exports = SITE;
})(typeof globalThis !== 'undefined' ? globalThis : this);
