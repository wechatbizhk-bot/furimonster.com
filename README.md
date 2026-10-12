# www.furimonster.com

The official FURI MONSTER website. Static output, zero runtime dependencies, no
framework. Twenty-two pages in five languages, plus the playable claw machine.

---

## Quick start

```bash
cd furimonster.com

node tools/build-art.js    # 1. raster derivatives from the character art
node tools/build.js        # 2. build the 22 pages
node tools/check.js        # 3. verify (links, locales, metadata, placeholders)
```

Then open `index.html` in a browser. There is no dev server and no install step:
every page is a real HTML file that works straight off the filesystem.

`tools/build.js` **fails loudly** if the Open Graph images are missing, because
an OG tag pointing at a file that does not exist is precisely the class of
breakage this project kept finding. So run `build-art.js` before `build.js` on a
fresh checkout.

---

## Deploying

`https://furimonster.com` currently serves a GoDaddy "Launching Soon" page, so
nothing here is live yet. The build writes into the folder root — and that same
root also holds **three things that must never be public**:

| must not ship | why |
|---|---|
| `src/` | the page source: unbuilt fragments and `_character.html`-style templates |
| `tools/` | the generator, the Thai/Japanese translation table, and the outstanding-string list |
| `README.md` | internal notes, including this checklist |

Uploading the folder as-is would publish all three. Build a bundle instead:

```
node tools/build.js                            # rebuild first, always
node _extract/tools/make-deploy-bundle.js      # -> _build/deploy/  (323 files, ~25 MB)
node _extract/tools/verify-deploy-bundle.js    # serves it over HTTP and checks it
```

The bundle command copies only shippable files, adds `.nojekyll` and `_headers`,
and **fails loudly** if a required file is missing or a build-time file leaked.
The verify command then serves the bundle on a local port and makes 43 real HTTP
requests: pages, assets with their MIME types, the ZIP and WEBP signatures, the
custom 404, `robots.txt` / `sitemap.xml` / `llms.txt`, and that `/src/`,
`/tools/` and `/README.md` return 404.

Then upload the **contents** of `_build/deploy/` to the web root.

**Host options**

- **Cloudflare Pages / Netlify** — build command `node tools/build.js`, output
  directory `.` (the folder root). `_headers` is read by both. You can also skip
  the build entirely: the built HTML is committed, so serving the folder is
  enough. Verified: `tools/build.js` reads nothing outside the site folder, so it
  runs on a clean checkout. Two tools are **not** deployable and must run here:
  `tools/build-comics-data.js` needs `_extract/comics/`, and the art conversion
  tools need the supplied library at `E:\FURI MONSTER\AI ChatGBT`. Neither is part
  of a normal build, because their outputs are already committed.
- **GitHub Pages** — **there is no git repository yet**, and `git` is not
  installed on this machine. Install git and create the repository first, or this
  path is not available.
- **GoDaddy / cPanel / any static host** — upload the bundle contents by FTP or
  the file manager. `_headers` will be ignored; set the cache policy by hand if
  the host offers one.

Whichever host is chosen, the domain has to be repointed at those files: either
replace the GoDaddy site, or move the nameservers to the new host. **There is
also no version control at all**, so a bad deploy cannot be rolled back — create
a repository before the first upload.

### Cloudflare Pages, step by step

Checked against this domain's actual DNS on the day of writing:

| record | value | what it means for the move |
|---|---|---|
| NS | `ns23.domaincontrol.com`, `ns24.domaincontrol.com` | GoDaddy runs the DNS. This is what changes. |
| A (apex) | `76.223.105.230`, `13.248.243.5` | GoDaddy's Website Builder, serving the "Launching Soon" page |
| www | alias of the apex | already matches the canonical host |
| **MX** | **none** | **no email runs on this domain, so moving nameservers breaks no mail** |
| **TXT** | **none** | no SPF or verification records to preserve |

Because there are no MX or TXT records, moving the nameservers is low-risk. If
that changes — if `info@furimonster.com` or Google Workspace is ever set up —
those records must be recreated in Cloudflare **before** the nameservers move,
or mail stops.

1. Create a free Cloudflare account.
2. **Workers & Pages → Create → Pages → Upload assets.** Name it
   `furimonster-com` (the name only affects the temporary `*.pages.dev` URL).
3. Upload `_build/deploy.zip`. Cloudflare unpacks it and publishes within
   seconds. **Test the `*.pages.dev` URL first** — every page, the claw machine,
   a sticker ZIP — before touching the domain.
4. **Custom domains → Set up a domain**, enter `furimonster.com`, then
   `www.furimonster.com`. Cloudflare will offer to add the domain as a zone.
5. Cloudflare then shows **two nameservers**. Replace GoDaddy's
   `ns23/ns24.domaincontrol.com` with them, in GoDaddy's
   *DNS → Nameservers → Change* screen. This is the step that takes the site
   live; propagation is usually minutes, up to 24 hours.
6. Keep the GoDaddy **domain registration** where it is. Only the nameservers
   move. Cancelling the GoDaddy **Website Builder** subscription is a separate
   decision, and doing it removes the "Launching Soon" page — which is the point.
7. Afterwards, check `https://furimonster.com` and `https://www.furimonster.com`.
   `www` already redirects to the apex, and the canonical tag and sitemap both
   name the apex, so the two agree.

To redeploy after a content change: rebuild, rebuild the bundle, and upload the
new ZIP to the same Pages project. Nothing about the domain has to be touched
again.

---

Before going live, set the real values in `assets/js/site.config.js`: the
Facebook page URL, `forms.endpoint` and the GA4 id (see *Pre-launch* below).

---

## Where everything is

```
index.html … news.html         22 built pages (do not edit these)
src/pages/*.html               the SOURCE. Edit here, then rebuild.
tools/build.js                 the generator: data -> pages
tools/build-art.js             raster derivatives from the character art
tools/make-transparent.js      background removal + sprite extraction
tools/png-compose.js           PNG scaling / compositing / line art
tools/check.js                 build verification
assets/js/site.config.js       social links, contacts, SEO defaults, flags
assets/js/data.js              ALL content, in five languages
assets/js/i18n.js              interface strings in five languages + the quiz
assets/js/art.js               places the character images
assets/js/chrome.js            header, drawer, footer, language switcher
assets/js/translate.js         Google Translate (opt-in, lazy)
assets/js/app.js               Emotion Lab, quiz, relationship map, forms
assets/css/style.css           the whole design system
play/claw-machine/             the claw machine (self-contained)
assets/img/ip/                 THE CHARACTER ART (see below)
```

**`src/pages/` is the source of truth.** Editing a built `.html` in the root is
wasted work — the next `node tools/build.js` overwrites it.

---

## Replacing the character art — read this first

Everything the site shows for a character comes from six transparent PNGs in
`assets/img/ip/`:

```
furi-prince.png  pinki.png  winggo.png  fluffu.png  boxo.png  bubi.png
```

**To swap in new artwork:**

1. Export each character as a transparent PNG, ideally **2000 px or more on the
   long edge**. Name the files exactly as above (lowercase, hyphenated).
2. Drop them into `assets/img/ip/`.
3. Record each character's **opaque content box** in `assets/js/art.js` (`META`)
   and in the claw machine's `js/catalogue.js` (the `sprite.box` / `sprite.side`
   fields). The display size is normalised from those numbers so every character
   reads at the same visual weight; wrong numbers mean one character looks tiny
   or huge. `tools/make-transparent.js` prints the content box when it cuts a
   character out:
   ```
   node tools/make-transparent.js source.png assets/img/ip/pinki.png
   # pinki.png  245x245 → 240x240 content 187x225
   ```
4. Copy `assets/img/ip/*.png` into `play/claw-machine/img/` — the game ships its
   own copy so it can never depend on where it is deployed.
5. Regenerate the derivatives and rebuild:
   ```
   node tools/build-art.js && node tools/build.js && node tools/check.js
   ```

**If the source art arrives on a solid background** rather than transparent:

```
# a plain white card
node tools/make-transparent.js raw/pinki.png assets/img/ip/pinki.png

# a die-cut sticker sheet: split it into one file per character first
node tools/make-transparent.js --split raw/stickers.png raw/split --names furi-prince,pinki,winggo,fluffu,boxo,bubi
# then strip each die-cut ring
node tools/make-transparent.js raw/split/pinki.png assets/img/ip/pinki.png
```

The cut-out is a **flood fill inward from the border**, never a global white
key. That is not a stylistic choice: Boxo has a white belly and white horns,
Furi Prince has white wings and white sneakers, Pinki has a white pocket. Keying
white would punch holes through all of them. The flood is also allowed to cross
the soft grey drop shadow, because a die-cut sticker's shadow traps a ring of
white behind it.

### What is generated from the art

`tools/build-art.js` produces, so nothing has to be drawn in the browser:

| Output | Used by |
| --- | --- |
| `assets/img/ip-line/<slug>.png` | the colouring pages in Furi Lab |
| `assets/img/wallpaper/<slug>-phone.png` (1080×1920) | wallpaper download |
| `assets/img/wallpaper/<slug>-desktop.png` (1920×1080) | wallpaper download |
| `assets/img/og/<slug>.png` (1200×630) | Open Graph / social cards |
| `assets/img/og/default.png` | site-wide OG fallback |

OG cards are PNG, not SVG: social scrapers do not render SVG, and an SVG that
references an external image renders as nothing at all.

---

## The five languages

`en`, `zh-Hant`, `zh-Hans`, `th`, `ja` — all **authored**, not machine
translated. Every string exists in every locale, and the build check fails if
one is missing.

All five are present in the built HTML at once. Each translatable run is a
`<span class="t" data-l="…">` and CSS shows only the active locale, so switching
is instant, needs no reload, and every language is crawlable.

**To add a language:**
1. Add the id to `locales` in `assets/js/site.config.js` — this one array is
   read by the generator, the forms, the language switcher and the build check.
2. Add the block to `DICT` in `assets/js/i18n.js` (same key list as `en`).
3. Add it to `L()` in `assets/js/data.js` and translate the content.
4. Add the `data-l` visibility rule and a font stack in `assets/css/style.css`
   (see the existing per-locale rules — Japanese must not render with
   Traditional Chinese glyph shapes).
5. `node tools/build.js && node tools/check.js`.

`node tools/check.js` verifies that every locale has identical key sets and that
every page carries the same number of runs in all five, so a half-translated
page cannot ship silently.

### Google Translate

`assets/js/translate.js` adds an opt-in control for **any** language beyond the
five. It is deliberately lazy: the third-party script is only fetched when a
visitor opens it, so a normal page load makes no request to Google at all. When
it is active the page shows a bar saying that machine translation is on and
offering a way back, because machine output reads as published copy otherwise.
It needs a live `https://` origin (it will not work from `file://`) and is
unavailable on some networks.

---

## The claw machine

`play/claw-machine/` is a self-contained app: `index.html`, `js/`, and its own
`img/`. The art base is derived from `js/catalogue.js`'s own script URL, so the
game finds its art wherever it is served from.

- **Desktop:** arrow keys or WASD, `Space` to drop, `Shift` to creep.
- **Phone:** drag the joystick, tap the red button. Landscape is the real
  experience; in portrait the game shows a rotate prompt rather than a 219 px
  tall cabinet nobody can use. Fullscreen also attempts a landscape orientation
  lock on Android (iOS Safari does not implement orientation lock).

`claw-machine/` at the repository root is the game's **development source**.
Edit there, run `node test/all.js`, then copy `index.html`, `js/` and `img/` into
`play/claw-machine/`.

---

## The games lobby and Guess the Guardian

Games are data, not markup: `GAMES` in `assets/js/data.js` drives both the lobby
grid (`{{GAME_CARDS}}` in `play.html`) and each game's own header. Adding a game
is one entry.

| Route | What it is |
|---|---|
| `play.html` | The lobby. Cards come from `GAMES`; a game is a link only when `status` is `live`, so nothing invites a click that goes nowhere. |
| `play/claw.html` | The claw machine's own page, holding the detail copy and the embedded cabinet. Kept at `claw.html`, **not** `claw-machine.html`, so it cannot collide with the `play/claw-machine/` directory on hosts with clean URLs. |
| `play/guess.html` | Guess the Guardian. |

**Guess the Guardian** shows one piece of real official artwork per round, blurred
and clearing over about nine seconds; the earlier the answer, the higher the score
(100 down to a floor of 20, plus up to +25 for a streak). Ten rounds, four choices,
one guess. `assets/js/games.js` runs it and also fills every `[data-best]` slot
with the visitor's own best score.

Two things worth knowing before changing it:

- The artwork list is **not** hand-written. `{{GAME_ART}}` emits a JSON manifest
  built by scanning `assets/img/art/`, so the game can never point at a file that
  was renamed or removed.
- `bestKey` is only set on games that really keep a score. The claw machine keeps
  an internal save instead, so its card carries no best-score line rather than one
  that would sit at zero forever.

Game state never leaves the device: best scores are one localStorage key, there is
no account and no leaderboard. `_shots/test-guess.html` is a build-time-only
harness that drives the real page in a same-origin iframe and asserts 45
behaviours (48 with `--force-prefers-reduced-motion`). It lives outside
`furimonster.com/` and is never deployed.

---

## Sticker packs

`stickers.html` publishes two packs, both derived from files that already existed
for the die-cut sticker proof:

| Pack | Source directory | ZIP |
|---|---|---|
| 01 — die-cut stickers | `assets/img/stickers/` | `assets/downloads/furimonster-stickers-pack-01.zip` |
| 02 — colour-in line art | `assets/img/ip-line/` | `assets/downloads/furimonster-colour-in-pack-02.zip` |

- The page and the ZIPs are generated from the **same file lists**, so a pack can
  never advertise a sticker that is not on disk.
- The ZIP writer is ~70 lines of `Buffer` in `tools/build.js`. No archiver or
  jszip: `node tools/build.js` has no install step and must stay that way. PNG is
  already compressed, so entries are stored, not deflated.
- `surface: 'light'` in the pack data switches the board to a paper background.
  The line art is black on transparent and is unreadable on the dark board the
  die-cut stickers use — the artwork decides this, not taste.
- The die-cut masters are **250 px on the long side**. That is the master size;
  nothing is upscaled, and the pack note says plainly that WhatsApp and Telegram
  want 512 px and will look soft. Do not claim platform-ready sizes that the
  files do not have.
- `E:\FURI MONSTER\FM 貼紙` holds only the 1195×743 die-cut proof sheet, so there
  is **no higher-resolution source** in the project. A 512 px pack needs a fresh
  export from the original design files.

---

## Supplied artwork (the `AI ChatGBT` library)

The site carries artwork converted from the supplied library at
`E:\FURI MONSTER\AI ChatGBT`. The site itself stays dependency-free: the
converter runs only at build time and lives outside it, in `_tools/`.

```
cd _tools && pnpm add sharp          # once
node _extract/tools/convert-art.js       # character galleries
node _extract/tools/convert-comics.js    # the 45 finished comics
```

- **Character galleries** — three verified images per guardian, cut out of their
  studio background and encoded to WebP, in `assets/img/art/`. Every image is
  recorded in `_extract/art-manifest.json` with the IP traits it was checked
  against. Nothing goes in on the strength of a filename: the source files carry
  only timestamps and their PNG metadata holds no prompt (the C2PA box records
  just `gpt-image 2.0`), so each pick was confirmed by eye.
- **FURI PLANET art** — `world-*.webp`: the six guardians together and each of
  them standing on their own world, shown in *The world* section on
  `furi-planet.html`. These are full-bleed scenes, so unlike the portraits they
  keep their backgrounds.
- **On-stage art** — `stage-*.webp`: the concert series, shown in *On stage* on
  `collections.html`.
- **Finished comics** — the 45 drawn comics in `assets/img/comics/`, shown on the
  Stories page. Their dialogue is **baked into the artwork in Traditional
  Chinese**, so that gallery is labelled Chinese-only and is not part of the
  five-language library.

The five FURI PLANET *lore* beats (a planet with everything / the fleets arrived
/ the planet let go / only six remain / mission) deliberately keep their
placeholders. Nothing in the supplied library depicts the planet before the
extraction, the fleets arriving, or the collapse, and filling those frames with
unrelated art would contradict the text beside them. They need purpose-drawn
art.

### Filling the 120 story panels

**Current status: 0 of 480 panels are mapped. The brief and the cutting tool now
exist; the artwork does not.**

`assets/img/panels/` does not exist and every `image` field in
`_extract/panel-map.template.json` is empty, so all 480 frames take the
official-art fallback below. Nothing is broken and no frame is empty — but no
frame is yet the illustration of its own panel. Check it with
`node tools/verify-comics.js`, which prints the three counts.

**The 45 finished comics are not this content and cannot fill these frames.**
They are a **separate 45-story school-arc series** (`校園篇`), one complete
four-panel page per story, in 8 source groups (`4格漫畫/0001`–`0008`). None of
their titles appears among the 120 library's titles, and the 120 library's
titles contain no school arc at all. They are correctly published already, as
the Chinese-only featured gallery on `stories.html`. (`0001-01.webp`, for
example, is one 900×1200 page titled 「Boxo 校園篇｜作品失敗了？」 with all four
panels drawn in it.)

So the worksheet is **not a mapping table waiting for filenames — it is a
production brief.** Each row already carries the character, the story title and
an English description of what happens in that panel.

#### The two tools

```
# 1. turn the worksheet into prompts a producer or an image model can work from
node _extract/tools/panel-brief.js
#    -> _extract/panel-prompts.json   machine-readable, one entry per story
#    -> _extract/PANEL-BRIEF.md       readable, per character, copy-paste blocks
#    -> _extract/panel-art-reference.webp   the 18 expression busts + 6 world poses

# 2. cut one finished four-panel page per story into the four files the site wants
node _extract/tools/slice-comic-pages.js <sourceDir>
#    -> assets/img/panels/{story}-{1..4}.webp
```

Things the brief encodes that are easy to get wrong:

- **Panels must be 4:3 landscape.** The story pages frame each panel at
  `aspect-ratio: 4/3` with `object-fit: cover`, so a portrait panel is cropped
  on the live page. The slicer **refuses** a page whose panels are not roughly
  4:3 rather than shipping a crop.
- **No lettering in the artwork.** The site prints the panel number, the scene
  text and the dialogue itself in five languages. Text baked into the image would
  be wrong in four of them — which is exactly why the 45 finished comics can only
  be shown as a Chinese-only gallery. Note that the style reference they provide
  (title banner, numbered badges, lettered balloons) is therefore a list of things
  to *leave out*, and the brief says so in those words.
- **The 18 expression files are head-only busts.** They lock a face and an
  emotion and say nothing about a body; the six `world-*.webp` poses lock
  proportions, costume and props. A panel needs both, which is why the reference
  sheet carries four rows rather than three.
- **Four panels have no script text at all** (`pinki-05 p4`, `pinki-08 p4`,
  `pinki-15 p3`, `pinki-17 p4`). Their prompts say so explicitly instead of
  leaving a blank an illustrator would fill by invention.

The slicer **detects the gutters from the pixels** instead of cutting into
quarters: measured on `assets/img/comics`, the upper panel row is about 522 px
tall and the lower about 564 px, because the title banner eats into the top.
Cutting at 50% would slice through the bottom of the upper panels. It refuses
when the gutters cannot be found, when a panel is too small, when the aspect is
wrong, when the story id is not one of the 120, and when output files already
exist (unless `--force`).

#### One data defect this work uncovered

`bubi-20`'s final panel had swallowed the source document's own 120-story index
appendix — a markdown table of every story with totals and a copyright line — and
it was printing inside the last panel of `stories/bubi-20.html`, in English only,
because the other four languages had been translated from clean text.
`tools/build-comics-data.js` had a comment saying that appendix "is cut from all
five languages" but nothing ever cut it. It is cut at generation time now, in
`stripDocFurniture()`, and the generator reports what it removed. That is why the
comic data is regenerated by `node tools/build-comics-data.js` rather than patched
by hand: the guard has to live where the data is made.

#### FURI PLANET narrative slots

The five lore beats on `furi-planet.html` (01–05) are **text-only, on purpose**.
They used to carry a dashed "artwork in production" frame. Nothing in the supplied
library depicts a planet before the collapse, an extraction fleet, a collapse or a
mission, and standing a character portrait in for one of those beats would
misrepresent the story rather than illustrate it — so the frame is gone and the
page does not promise a picture it does not have.

They are set as an editorial split (`.scene--text`: numeral and title left, the
beat right on desktop, stacked on a phone), which fills the width the picture
would have filled. The brief for those five images, if they are ever
commissioned, is `_extract/FURI-PLANET-ART-BRIEF.md`. Adding the art later means
putting an `<img>` back inside `.scene` and dropping the `--text` modifier;
nothing else blocks it.

#### The six written episodes

The episode cards on `index.html` and `stories.html` used to carry the same dashed
"Artwork in production" label. Their scripts exist but their animation and comics
do not, and "in production" is a claim about work nobody has started, so the label
is gone. The card's media slot is now a **script-cover plate** (`.card-media--ep`)
showing the episode number and the real status — "Script written · not released" —
which is both true and more useful than the label was.

The episode number and duration used to be printed twice (once in the plate, once
in `.card-top`); they now appear on the plate and in the card footer only.

With that, **"Artwork in production" appears nowhere on the site.** Any future
placeholder needs a status that is actually true of the thing it sits on.

Each of the 480 panel frames shows something, in this order of priority:

1. **a mapped panel illustration** — `assets/img/panels/<story>-<panel>.webp`;
2. **the guardian's official character art** — the fallback, so a frame is never
   empty. The page says above the strip that these are the guardian's official
   images and that the panel illustrations are still in production;
3. **the dashed slot** — only if that guardian has no art at all.

The mapping comes from you, because there is no machine-readable link between
the art library and the stories:

1. Start from the generated list of all 480 panels:

   ```
   node _extract/tools/make-panel-map-template.js
   # writes _extract/panel-map.template.json — every panel with its character
   # and scene direction, and an empty "image" field to fill in
   ```

2. Fill `image` on the panels you want (`story` is one of the 120 ids, `panel`
   is 1–4). Leave the rest empty — they keep the official art.
3. Validate without writing: `node _extract/tools/import-panel-art.js --dry-run`
   It refuses to write anything if a story id is unknown, a panel is out of
   range, a panel is assigned twice, or the image is missing.
4. Save as `_extract/panel-map.json`, run the importer without `--dry-run`, then
   `node tools/build.js`.

**Seeing it work without committing to a mapping**

```
node _extract/tools/panel-map-demo.js          # maps two stories, 8 panels
cd furimonster.com && node tools/build.js
# then, to undo:
node _extract/tools/panel-map-demo-revert.js
cd furimonster.com && node tools/build.js
```

The revert refuses to run unless the table is the demo file, so a real mapping
cannot be wiped by accident.

---

## SEO and GEO

Both are generated by `tools/build.js`, so they cannot drift from the pages.

**Search (SEO)**

- Per page: `<title>`, meta description, `rel=canonical`, `og:*`, `twitter:*`
  and an OG image. `tools/check.js` fails the build if any is missing.
- `sitemap.xml` — every page except `404.html`, with `lastmod` (the build date),
  `changefreq` and a `priority` derived from the information architecture.
- `robots.txt` — allows everything except the build-time folders (`/src/`,
  `/tools/`, `/README.md`), which must never be deployed.
- JSON-LD on every page as one `@graph`: `Organization` (name, description,
  slogan, logo, founder, `sameAs`) and `WebSite` (`inLanguage`, publisher). Pages
  add their own node — `Person` on Creator, `VideoGame` on Play, `Service` on
  Licensing, `CreativeWork` + `FAQPage` on Furi Planet, `CreativeWork` on each
  character page.

**Answer engines (GEO)**

- `llms.txt` — a short factual map of the site: what the IP is, the six
  guardians with their localised names, the creator, the languages, the comic
  counts, the page list, and citation notes. Generated from the same data the
  pages use.
- `robots.txt` names the AI crawlers explicitly (GPTBot, OAI-SearchBot,
  ClaudeBot, PerplexityBot, Google-Extended, CCBot) and allows them. Blocking
  them would be the reflexive move and is wrong here: the point of the site is
  to be the authoritative source for what FURI MONSTER is.
- A visible FAQ on `furi-planet.html` is mirrored as `FAQPage` schema, so an
  answer engine can quote a direct answer instead of inferring one.

**One limitation worth knowing.** The five languages live in a single URL and
switch client-side, so a crawler sees one page, not five. That is a deliberate
trade — instant switching with no reload — but it does mean the site cannot
rank separately per language. Separate language URLs would be the fix if that
ever matters more than the instant switch.

---

## Visitor features (consent, chat, cart, referrals)

All four are driven by `assets/js/site.config.js` and stay inert until configured.

**Consent — `assets/js/consent.js`**

- **No banner unless something needs one.** The site sets no cookies of its own,
  so the panel appears only when a GA4 id or a chat id is actually configured.
- Deny by default: `FM.consent.allows('analytics' | 'chat')` returns false until
  the visitor answers. GA4 is gated on it, so nothing third-party loads first.
- Withdrawable: the footer has a **Cookie settings** control on every page.
- The privacy policy has a matching cookies and third-party services section.

**On-site assistant — `assets/js/chatbot.js`**

- Answers from `FM.data.faq`, the same array that renders the FAQ and the
  `FAQPage` schema. No network, no third party, no cost.
- It refuses to guess: if nothing scores, it says so and offers the contact page.
- If `chat.tawkPropertyId` is set **and** the visitor allowed chat, the Tawk.to
  widget loads instead and the local launcher hides, so there are never two
  chat buttons.

**Referrals — `assets/js/affiliate.js`**

- Captures `?ref=CODE`, remembers it for `affiliate.days`, and reports one
  `affiliate_referral` analytics event.
- **Attribution only.** No commission, no payout — that needs a paid affiliate
  platform. `FM.affiliate.decorate(url)` appends the code to a checkout URL.

**Cart — `assets/js/commerce.js`**

- A real cart: `FM.cart` with add / setQty / remove / clear, persisted in
  localStorage, surviving navigation, with a drawer and a count badge.
- **No payment provider, and the UI says so.** The order button is disabled
  until `commerce.providerCheckoutUrl` is set, because taking an order that
  cannot be fulfilled would be worse than having no cart.
- Product cards come from `commerce.products`; with none configured,
  `collections.html` shows an honest empty state rather than an invented grid.

---

## Pre-launch checklist

Nothing here blocks the site from being *served*; each item is something that
would be wrong or missing once it is. Checked against the build, not from memory.

**Blocking a real launch — a visitor would notice these**

- [ ] **`forms.endpoint` is empty**, so all six forms (contact, licensing,
      collaboration, media, distribution, newsletter) validate and then say
      plainly that the message was not delivered. For a site whose main business
      is licensing enquiries that is the biggest functional gap. Set it to a
      form-handling URL.
- [ ] **Confirm the Facebook page URL** in `assets/js/site.config.js`. It is
      currently the conventional guess `facebook.com/furimonster/`, marked
      `NEEDS-CONFIRM` in the file. Instagram (`@furi.monster`), Threads
      (`furi.monster`) and Xiaohongshu (`FURIMONSTER`, id 9585945715) come from
      the supplied QR cards and are evidenced.
- [ ] **The footer carries a concept-build note on every page**: "Concept build.
      Social handles, contact addresses and form endpoints are not final."
      Decide whether that stays once the handles are confirmed.
- [ ] **Have `privacy.html`, `terms.html` and `ai-content-notice.html` reviewed.**
      They describe what the site as built actually does, including the fact that
      Thai and Japanese are machine translated, but they are templates and not
      legal advice.

**Copy quality**

- [ ] **Native review of the Thai and Japanese copy.** It **is machine
      translated** — 282 strings, written for this build and listed in
      `tools/mt-page-text.json`, with a notice in the footer of every page saying
      so. An earlier version of this checklist claimed it was authored; it is
      not, and the notice is the honest part. A speaker should check the tone,
      and the legal pages first because a mistranslation there costs most.
- [ ] **Chinese and English are authored**, including the character names, and
      need no such review.

**Content that is real but temporary**

- [ ] The two news entries ("Official website launch", "How the six were drawn")
      are marked as samples. Replace them when there is real news.
- [ ] `D.creator.portrait` is empty, so the creator page shows the brand
      lock-up rather than a photograph. Nothing claims a photograph exists.
      Add one when there is one.
- [ ] 0 of 480 comic panels are illustrated; every frame shows the guardian's
      official art and the page says so. See *Filling the 120 story panels*.
- [ ] The FURI PLANET lore beats 01–05 are text-only by design, not by
      omission. The brief for the five images is
      `_extract/FURI-PLANET-ART-BRIEF.md`.

**Measurement and delivery**

- [ ] **Set the GA4 id.** Every required event (`character_click`, `story_view`,
      `emotion_result`, `licensing_click`, `contact_submit`, `language_switch`)
      is already dispatched locally; without an id nothing is sent.
- [ ] `chat.tawkPropertyId` is empty, so no chat widget loads. Optional; the
      on-site assistant works from `D.faq` without it.
- [ ] `commerce.providerCheckoutUrl` is empty and `commerce.products` is empty,
      so the cart is built but checkout is disabled and the shop shows an honest
      empty state. Nothing is on sale.
- [ ] **Check that `play/claw-machine/img/` matches `assets/img/ip/`** after any
      art change. `node claw-machine/test/rig.js` asserts the game's copy exists.
- [ ] **Export higher-resolution character art** from `furimonster.ai`. That file
      is pure vector, but no PDF rasteriser is available in this environment, so
      the current sprites are the highest-resolution raster available and upscale
      about 2–3× in the claw machine.

---

## Verification

`node tools/check.js` is not a linter; it is the list of things that have
actually gone wrong here:

* every internal link and asset reference resolves (no 404s);
* no `{{PLACEHOLDER}}` survives into the output;
* every page has a title, description, canonical and OG image;
* all five locales have identical key sets and balanced runs per page;
* no duplicate element ids, no `<img>` without `alt`;
* every character has the fields and locales the pages read;
* every relation and emotion points at a character that exists.

It skips `play/claw-machine/`, which is an embedded app with its own shell, and
it strips `<script>`/`<style>` bodies before scanning so string literals inside
inline JavaScript are not mistaken for markup.
