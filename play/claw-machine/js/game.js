'use strict';
/* =========================================================================
 * js/game.js — the shell: screens, the credit, the attempt, the result.
 *
 * One fixed 60 Hz step drives the machine; rendering happens once a frame.
 * Every screen is a small state machine over the same input object, and the
 * whole thing is DOM-free apart from a canvas, which is what lets the test
 * harness boot this exact object and play it.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, UI = NS.UI, CAT = NS.CAT;

  var MOVE_LIMIT = 45;

  function Game(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = new NS.Player({ lang: opts.lang || 'zh' });
    if (opts.storage !== undefined) this.storage = opts.storage;
    else this.storage = null;
    if (!opts.fresh) this.player.load(this.storage || undefined);

    this.lang = this.player.lang;
    this.screen = 'title';
    this.prevScreen = 'play';
    this.t = 0;
    this.acc = 0;
    this.last = 0;
    this.running = true;
    this.sel = 0;
    this.shopSel = 0;
    this.pauseSel = 0;
    this.collSel = 0;
    this.collPage = 0;
    this.filterRarity = null;
    this.filterOwnedOnly = false;
    this.resultAnim = 0;
    this.dropFlash = 0;
    this.diffId = this.player.diffId;
    this.playsByMachine = {};
    this.toasts = [];
    this.shake = 0;
    this.machine = null;
    this.machineDef = null;
    this.view = { t: 0, lang: this.lang };
    this.input = opts.input || null;
    this.frames = 0;
    this.lastPrizeAt = 0;
    this.gripWarned = false;

    if (NS.Audio) {
      NS.Audio.music(this.player.music);
      NS.Audio.sound(this.player.sfx);
    }
    if (opts.machine) this.openMachine(opts.machine);
  }

  Game.prototype.T = function (key) { return NS.I18N.T(key, this.lang); };

  /* ---- machines ---------------------------------------------------------- */

  Game.prototype.openMachine = function (id) {
    var def = CAT.machineById(id) || CAT.MACHINES[0];
    this.machineDef = def;
    this.player.diffId = this.diffId;
    this.machine = new NS.Machine(def, {
      seed: (def.seed + (this.playsByMachine[def.id] || 0)) | 0,
      diff: C.DIFF[this.diffId],
      stats: this.player.statBag()
    });
    return this.machine;
  };

  Game.prototype.applyUpgrades = function () {
    if (this.machine) this.machine.configure(this.player.statBag(), C.DIFF[this.diffId]);
  };

  /* ---- screens ----------------------------------------------------------- */

  Game.prototype.goto = function (screen) {
    this.prevScreen = this.screen;
    this.screen = screen;
    this.pauseSel = 0;
    if (screen === 'play') this.resultAnim = 1;
  };

  Game.prototype.pauseItems = function () {
    var p = this.player;
    return [
      { id: 'resume', label: this.T('resume') },
      { id: 'music', label: this.T('music') + ': ' + (p.music ? this.T('on') : this.T('off')) },
      { id: 'sfx', label: this.T('sfx') + ': ' + (p.sfx ? this.T('on') : this.T('off')) },
      { id: 'lang', label: this.T('language') + ': ' + (p.lang === 'zh' ? '繁中' : 'EN') },
      { id: 'help', label: this.T('help') },
      { id: 'quit', label: this.T('quit') }
    ];
  };

  Game.prototype.doPauseItem = function (id) {
    var p = this.player;
    if (id === 'resume') { this.screen = 'play'; return; }
    if (id === 'music') { p.music = !p.music; if (NS.Audio) NS.Audio.music(p.music); this.save(); return; }
    if (id === 'sfx') { p.sfx = !p.sfx; if (NS.Audio) NS.Audio.sound(p.sfx); this.save(); return; }
    if (id === 'lang') { this.toggleLang(); return; }
    if (id === 'help') { this.goto('help'); return; }
    if (id === 'quit') { this.goto('floor'); this.save(); return; }
  };

  Game.prototype.toggleLang = function () {
    this.lang = this.lang === 'zh' ? 'en' : 'zh';
    this.player.lang = this.lang;
    this.save();
    if (NS.Audio) NS.Audio.play('click');
  };

  Game.prototype.save = function () {
    try { this.player.save(this.storage || undefined); } catch (e) {}
  };

  Game.prototype.toast = function (text, colour, kind) {
    this.toasts.push({ text: text, colour: colour || UI.THEME.gold, t: 0, life: kind === 'trophy' ? 4.4 : 2.2, kind: kind });
    if (this.toasts.length > 4) this.toasts.shift();
  };

  /* ---- the collection filters ------------------------------------------- */

  Game.prototype.filteredList = function () {
    var out = [], i, p;
    for (i = 0; i < CAT.PRIZES.length; i++) {
      p = CAT.PRIZES[i];
      if (this.filterRarity && p.rarity !== this.filterRarity) continue;
      if (this.filterOwnedOnly && !this.player.isOwned(p.id)) continue;
      out.push(p);
    }
    return out;
  };

  /* ---- the credit ------------------------------------------------------- */

  Game.prototype.creditCost = function () {
    return this.machineDef ? this.machineDef.creditCost : 1;
  };

  /* Try to start a play.  Returns false when the player cannot pay. */
  Game.prototype.insertCoin = function () {
    var cost = this.creditCost();
    if (this.player.credits < cost) {
      if (this.player.buyCredits(5)) {
        if (NS.Audio) NS.Audio.play('coin');
        this.toast('+5 ' + this.T('credits'), UI.THEME.gold);
      } else {
        if (NS.Audio) NS.Audio.play('nope');
        this.toast(this.T('needMoney'), UI.THEME.red);
        return false;
      }
    }
    if (!this.player.payPlay(this.machineDef)) return false;
    if (NS.Audio) NS.Audio.play('coin');
    this.playsByMachine[this.machineDef.id] = (this.playsByMachine[this.machineDef.id] || 0) + 1;
    this.applyUpgrades();
    var ok = this.machine.startAttempt();
    if (ok) {
      this.gripWarned = false;
      this.resultAnim = 0;
      this.save();
    }
    return ok;
  };

  /* ---- the attempt finishes --------------------------------------------- */

  Game.prototype.finishAttempt = function () {
    var r = this.machine.result;
    if (!r) return;
    var rec = this.player.record(r, this.machineDef);
    this.lastResult = rec;
    this.resultAnim = 0;
    if (r.win) {
      if (NS.Audio) NS.Audio.play('win');
      this.shake = 0.35;
      for (var i = 0; i < rec.gained.length; i++) {
        var g = rec.gained[i];
        this.toast((g.isNew ? this.T('newPrize') + ' ' : '') + NS.I18N.pick(g.prize.name, this.lang),
          UI.RARITY_TINT[g.prize.rarity]);
      }
    } else {
      if (NS.Audio) NS.Audio.play('lose');
    }
    for (var k = 0; k < rec.unlocked.length; k++) {
      this.toast('★ ' + NS.I18N.pick({ en: rec.unlocked[k].en, zh: rec.unlocked[k].zh }, this.lang),
        UI.THEME.gold, 'trophy');
      if (NS.Audio) NS.Audio.play('trophy');
    }
    this.save();
  };

  /* ---- update ----------------------------------------------------------- */

  Game.prototype.update = function (dt) {
    this.t += dt;
    this.view.t = this.t;
    var inp = this.input;
    this.frames++;
    if (this.dropFlash > 0) this.dropFlash -= dt;
    if (this.shake > 0) this.shake -= dt;
    for (var i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].t += dt;
      if (this.toasts[i].t > this.toasts[i].life) this.toasts.splice(i, 1);
    }
    if (this.resultAnim < 1) this.resultAnim = Math.min(1, this.resultAnim + dt * 4.5);

    switch (this.screen) {
      case 'title': this.updateTitle(dt, inp); break;
      case 'floor': this.updateFloor(dt, inp); break;
      case 'play': this.updatePlay(dt, inp); break;
      case 'collection': this.updateCollection(dt, inp); break;
      case 'shop': this.updateShop(dt, inp); break;
      case 'trophies': this.updateTrophies(dt, inp); break;
      case 'pause': this.updatePause(dt, inp); break;
      case 'help': this.updateHelp(dt, inp); break;
    }
    if (inp) inp.endFrame();
    return this;
  };

  Game.prototype.backTo = function () {
    if (NS.Audio) NS.Audio.play('back');
    this.goto(this.prevScreen === 'play' && this.machine ? 'play' : 'floor');
  };

  /* any click on a labelled on-screen button is translated into a key press */
  Game.prototype.drainClicks = function (inp) {
    if (!inp) return null;
    var p, out = null;
    while ((p = inp.consumeClick())) {
      var b = inp.buttonAt(p);
      if (b === 'drop') { inp.pressed.Space = true; out = out || b; }
      else if (b === 'coin') { inp.pressed.KeyC = true; out = out || b; }
      else if (b === 'menu') { inp.pressed.Escape = true; out = out || b; }
      else if (b === 'mute') { inp.pressed.KeyM = true; out = out || b; }
      else if (b === 'lang') { inp.pressed.KeyL = true; out = out || b; }
      else if (b === 'help') { inp.pressed.Slash = true; out = out || b; }
      else {
        /* a bare click on the cabinet also drops / starts */
        if (this.screen === 'play' && !(this.machine && this.machine.result)) inp.pressed.Space = true;
      }
    }
    return out;
  };

  Game.prototype.enterPlay = function (machineId) {
    if (NS.Audio) NS.Audio.play('click');
    this.openMachine(machineId || (CAT.MACHINES[this.sel] && CAT.MACHINES[this.sel].id) || CAT.MACHINES[0].id);
    this.goto('play');
  };

  Game.prototype.updateTitle = function (dt, inp) {
    if (!inp) return;
    if (inp.hitOnce('KeyL')) { inp.clicks.length = 0; return this.toggleLang(); }
    if (inp.hitOnce('KeyM')) {
      inp.clicks.length = 0;
      this.player.sfx = !this.player.sfx;
      if (NS.Audio) NS.Audio.sound(this.player.sfx);
      return;
    }
    /* The drawn INSERT COIN control is canvas, not a DOM button. A tap
     * anywhere on this screen has to count, or a phone never gets past it. */
    if (inp.hitOnce('Enter') || inp.hitOnce('Space') || inp.hitOnce('NumpadEnter') || inp.clicks.length) {
      inp.clicks.length = 0;
      this.enterPlay();
    }
  };

  function floorCardRects() {
    var list = CAT.MACHINES;
    var cw = 236, gap = 16, top = 110, ch = 470;
    var totalW = list.length * cw + (list.length - 1) * gap;
    var x0 = (C.GAME_W - totalW) / 2;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      out.push({ i: i, x: x0 + i * (cw + gap), y: top - 8, w: cw, h: ch + 16 });
    }
    return out;
  }

  Game.prototype.updateFloor = function (dt, inp) {
    var n = CAT.MACHINES.length;
    if (inp && inp.clicks.length) {
      var cards = floorCardRects();
      var p = inp.clicks[0];
      for (var ci = 0; ci < cards.length; ci++) {
        var r = cards[ci];
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
          this.sel = r.i;
          inp.clicks.length = 0;
          this.enterPlay(CAT.MACHINES[r.i].id);
          return;
        }
      }
    }
    this.drainClicks(inp);
    if (!inp) return;
    if (inp.hitOnce('ArrowLeft') || inp.hitOnce('KeyA')) { this.sel = (this.sel + n - 1) % n; NS.Audio.play('move'); }
    if (inp.hitOnce('ArrowRight') || inp.hitOnce('KeyD')) { this.sel = (this.sel + 1) % n; NS.Audio.play('move'); }
    if (inp.hitOnce('KeyC')) { this.collSel = 0; this.collPage = 0; return this.goto('collection'); }
    if (inp.hitOnce('KeyS')) { return this.goto('shop'); }
    if (inp.hitOnce('KeyT')) { return this.goto('trophies'); }
    if (inp.hitOnce('KeyX')) {
      this.diffId = this.diffId === 'fun' ? 'real' : 'fun';
      this.player.diffId = this.diffId;
      NS.Audio.play('click');
      this.save();
      return;
    }
    if (inp.hitOnce('Escape')) { return this.goto('title'); }
    if (inp.hitOnce('Enter') || inp.hitOnce('Space') || inp.hitOnce('NumpadEnter')) {
      this.enterPlay(CAT.MACHINES[this.sel].id);
    }
  };

  Game.prototype.updatePlay = function (dt, inp) {
    this.drainClicks(inp);
    var m = this.machine;
    if (!m) { this.openMachine(CAT.MACHINES[0].id); m = this.machine; }
    if (!inp) { m.update(dt, null); this.handleEvents(); return; }

    if (inp.hitOnce('KeyL')) this.toggleLang();
    if (inp.hitOnce('KeyM')) { this.player.sfx = !this.player.sfx; NS.Audio.sound(this.player.sfx); }
    if (inp.hitOnce('Escape')) { NS.Audio.play('click'); return this.goto('pause'); }
    if (inp.hitOnce('Slash') || inp.hitOnce('KeyH')) { return this.goto('help'); }
    if (inp.hitOnce('KeyC')) {
      if (this.player.buyCredits(5)) { NS.Audio.play('coin'); this.toast('+5 ' + this.T('credits'), UI.THEME.gold); }
      else { NS.Audio.play('nope'); this.toast(this.T('needMoney'), UI.THEME.red); }
      return;
    }
    if (inp.hitOnce('KeyX')) {
      var p = this.player;
      var bag = p.statBag();
      p.sellDuplicates();
      this.applyUpgrades();
      NS.Audio.play('buy');
      this.toast(this.T('cashOut'), UI.THEME.green);
      return;
    }

    if (m.result) {
      if (inp.hitOnce('Enter') || inp.hitOnce('Space') || inp.hitOnce('NumpadEnter') || inp.hitOnce('Escape')) {
        m.conclude();
        this.resultAnim = 0;
        NS.Audio.play('click');
        this.applyUpgrades();
      }
      m.update(dt, null);
      this.handleEvents();
      return;
    }

    if (m.phase === 'ready') {
      if (inp.hitOnce('Space') || inp.hitOnce('Enter') || inp.hitOnce('NumpadEnter') || inp.hitOnce('KeyJ')) {
        this.insertCoin();
      }
      m.update(dt, null);
      this.handleEvents();
      return;
    }

    var mi = inp.machineInput();
    if (mi.drop) this.dropFlash = 0.16;
    var before = m.phase;
    m.update(dt, mi);
    if (m.phase !== before) {
      if (m.phase === 'close') NS.Audio.play('close');
      if (m.phase === 'drop') NS.Audio.play('servo');
      if (m.phase === 'lift') NS.Audio.play('servo');
      if (m.phase === 'release') NS.Audio.play('whoosh');
    }
    this.handleEvents();
  };

  Game.prototype.handleEvents = function () {
    var ev = this.machine.drainEvents();
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.type === 'grab') { NS.Audio.play('grab'); }
      else if (e.type === 'empty') { NS.Audio.play('empty'); }
      else if (e.type === 'slip') { NS.Audio.play('slip'); this.toast(this.T('gripLost'), UI.THEME.red); this.shake = 0.4; }
      else if (e.type === 'prize') { NS.Audio.play('plop'); this.shake = 0.3; }
      else if (e.type === 'win' || e.type === 'lose') { this.finishAttempt(); }
    }
    /* the gantry servo hums in proportion to how fast the claw is moving */
    var cl = this.machine.claw;
    var sp = Math.sqrt(cl.vx * cl.vx + cl.vy * cl.vy + cl.vz * cl.vz);
    if (NS.Audio) NS.Audio.setMotor(Math.min(1, sp / 0.8), this.machine.phase === 'drop' || this.machine.phase === 'lift' ? 'winch' : 'travel');
  };

  Game.prototype.updateCollection = function (dt, inp) {
    this.drainClicks(inp);
    if (!inp) return;
    var list = this.filteredList();
    var per = UI.GRID.cols * UI.GRID.rows;
    var pages = Math.max(1, Math.ceil(list.length / per));
    var moved = false;

    if (inp.hitOnce('ArrowLeft') || inp.hitOnce('KeyA')) { this.collSel = Math.max(0, this.collSel - 1); moved = true; }
    if (inp.hitOnce('ArrowRight') || inp.hitOnce('KeyD')) { this.collSel = Math.min(list.length - 1, this.collSel + 1); moved = true; }
    if (inp.hitOnce('ArrowUp') || inp.hitOnce('KeyW')) { this.collSel = Math.max(0, this.collSel - UI.GRID.cols); moved = true; }
    if (inp.hitOnce('ArrowDown') || inp.hitOnce('KeyS')) { this.collSel = Math.min(list.length - 1, this.collSel + UI.GRID.cols); moved = true; }
    if (inp.hitOnce('KeyQ')) { this.collPage = (this.collPage + pages - 1) % pages; this.collSel = this.collPage * per; moved = true; }
    if (inp.hitOnce('KeyE')) { this.collPage = (this.collPage + 1) % pages; this.collSel = this.collPage * per; moved = true; }

    this.collPage = C.clamp(Math.floor(this.collSel / per), 0, pages - 1);

    if (moved) {
      var page = Math.floor(this.collSel / per);
      if (page !== this.collPage) this.collPage = page;
      NS.Audio.play('move');
    }

    if (inp.hitOnce('KeyF')) {
      var order = [null, 'common', 'uncommon', 'rare', 'epic', 'legend'];
      var idx = order.indexOf(this.filterRarity);
      this.filterRarity = order[(idx + 1) % order.length];
      this.collSel = 0; this.collPage = 0;
      NS.Audio.play('click');
    }
    if (inp.hitOnce('KeyG')) {
      this.filterOwnedOnly = !this.filterOwnedOnly;
      this.collSel = 0; this.collPage = 0;
      NS.Audio.play('click');
    }
    if (inp.hitOnce('KeyX')) {
      var res = this.player.sellDuplicates();
      if (res.sold) { NS.Audio.play('buy'); this.toast('+' + UI.money(res.money), UI.THEME.green); this.save(); }
      else NS.Audio.play('nope');
    }
    if (inp.hitOnce('Enter') || inp.hitOnce('Space') || inp.hitOnce('NumpadEnter')) {
      var sel = list[this.collSel];
      if (sel && this.player.isOwned(sel.id)) {
        var added = this.player.toggleShelf(sel.id);
        if (added) { NS.Audio.play('click'); }
        else if (this.player.shelf.length >= NS.SHELF_SIZE && this.player.shelf.indexOf(sel.id) < 0) {
          NS.Audio.play('nope'); this.toast(this.T('shelfFull'), UI.THEME.red);
        } else NS.Audio.play('back');
        this.save();
      }
    }
    if (inp.hitOnce('Escape')) this.backTo();
  };

  Game.prototype.updateShop = function (dt, inp) {
    this.drainClicks(inp);
    if (!inp) return;
    var n = C.UPGRADES.length, cols = 3;
    if (inp.hitOnce('ArrowLeft') || inp.hitOnce('KeyA')) { this.shopSel = (this.shopSel + n - 1) % n; NS.Audio.play('move'); }
    if (inp.hitOnce('ArrowRight') || inp.hitOnce('KeyD')) { this.shopSel = (this.shopSel + 1) % n; NS.Audio.play('move'); }
    if (inp.hitOnce('ArrowUp') || inp.hitOnce('KeyW')) { this.shopSel = (this.shopSel + n - cols) % n; NS.Audio.play('move'); }
    if (inp.hitOnce('ArrowDown') || inp.hitOnce('KeyS')) { this.shopSel = (this.shopSel + cols) % n; NS.Audio.play('move'); }
    if (inp.hitOnce('Enter') || inp.hitOnce('Space') || inp.hitOnce('NumpadEnter')) {
      var u = C.UPGRADES[this.shopSel];
      if (this.player.buyUpgrade(u.id)) {
        NS.Audio.play('buy');
        this.applyUpgrades();
        this.toast(NS.I18N.pick(u.name, this.lang) + '  ' + this.T('level') + ' ' + this.player.upgradeLevel(u.id), UI.THEME.gold);
        this.save();
      } else { NS.Audio.play('nope'); }
    }
    if (inp.hitOnce('KeyB')) {
      if (this.player.buyCredits(5)) { NS.Audio.play('coin'); this.toast('+5 ' + this.T('credits'), UI.THEME.gold); this.save(); }
      else { NS.Audio.play('nope'); this.toast(this.T('needMoney'), UI.THEME.red); }
    }
    if (inp.hitOnce('KeyX')) {
      var res = this.player.sellDuplicates();
      if (res.sold) { NS.Audio.play('buy'); this.toast('+' + UI.money(res.money), UI.THEME.green); this.save(); }
      else NS.Audio.play('nope');
    }
    if (inp.hitOnce('Escape')) this.backTo();
  };

  Game.prototype.updateTrophies = function (dt, inp) {
    this.drainClicks(inp);
    if (!inp) return;
    if (inp.hitOnce('Escape') || inp.hitOnce('KeyT')) this.backTo();
  };

  Game.prototype.updateHelp = function (dt, inp) {
    this.drainClicks(inp);
    if (!inp) return;
    if (inp.anyPress || inp.hitOnce('Escape') || inp.hitOnce('Slash')) {
      if (NS.Audio) NS.Audio.play('back');
      this.screen = this.prevScreen === 'help' ? 'play' : this.prevScreen;
    }
  };

  Game.prototype.updatePause = function (dt, inp) {
    if (!inp) return;
    var items = this.pauseItems();
    /* Pause rows are drawn, not DOM. Hit-test them before drainClicks so a
     * tap cannot also fall through onto the cabinet's drop button. */
    if (inp.clicks.length) {
      var w = 460, h = 420;
      var x = (C.GAME_W - w) / 2, y = (C.GAME_H - h) / 2;
      var p = inp.clicks[0];
      var hit = -1;
      for (var i = 0; i < items.length; i++) {
        var rx = x + 50, ry = y + 92 + i * 54, rw = w - 100, rh = 44;
        if (p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh) hit = i;
      }
      inp.clicks.length = 0;
      if (hit >= 0) {
        this.pauseSel = hit;
        if (NS.Audio) NS.Audio.play('click');
        this.doPauseItem(items[hit].id);
        return;
      }
    }
    if (inp.hitOnce('ArrowUp') || inp.hitOnce('KeyW')) { this.pauseSel = (this.pauseSel + items.length - 1) % items.length; NS.Audio.play('move'); }
    if (inp.hitOnce('ArrowDown') || inp.hitOnce('KeyS')) { this.pauseSel = (this.pauseSel + 1) % items.length; NS.Audio.play('move'); }
    if (inp.hitOnce('Enter') || inp.hitOnce('Space') || inp.hitOnce('NumpadEnter')) {
      NS.Audio.play('click');
      this.doPauseItem(items[this.pauseSel].id);
    }
    if (inp.hitOnce('Escape')) { NS.Audio.play('back'); this.screen = 'play'; }
  };

  /* ---- render ----------------------------------------------------------- */

  Game.prototype.render = function () {
    var ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, C.GAME_W, C.GAME_H);
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    switch (this.screen) {
      case 'title':
        UI.drawTitle(ctx, this);
        break;

      case 'floor':
        UI.drawFloor(ctx, this);
        break;

      case 'collection':
        UI.drawCollection(ctx, this);
        break;

      case 'shop':
        UI.drawShop(ctx, this);
        break;

      case 'trophies':
        UI.drawTrophies(ctx, this);
        break;

      case 'play':
      case 'pause':
      case 'help': {
        var shakeX = 0, shakeY = 0;
        if (this.shake > 0) {
          var k = this.shake * 14;
          shakeX = (Math.sin(this.t * 90) * k);
          shakeY = (Math.cos(this.t * 77) * k);
        }
        ctx.save();
        ctx.translate(shakeX, shakeY);
        NS.Renderer.drawCabinet(ctx, this.machine, {
          t: this.t, lang: this.lang, cam: this.cam()
        });
        ctx.restore();
        UI.drawHUD(ctx, this);
        if (this.machine && this.machine.result) UI.drawResult(ctx, this);
        if (this.screen === 'pause') UI.drawPause(ctx, this);
        if (this.screen === 'help') UI.drawHelp(ctx, this);
        break;
      }
    }
    this.renderToasts(ctx);
    ctx.restore();
    return this;
  };

  Game.prototype.cam = function () {
    var cam = this.machineCam || (this.machineCam = new NS.Renderer.Camera());
    /* the cabinet bows very slightly as the claw moves, so the machine feels
       physical without ever getting in the way of the aim */
    var cl = this.machine ? this.machine.claw : null;
    cam.ox = cl ? cl.x * 7 : 0;
    cam.oy = cl ? -cl.y * 3 : 0;
    return cam;
  };

  Game.prototype.renderToasts = function (ctx) {
    for (var i = 0; i < this.toasts.length; i++) {
      var to = this.toasts[i];
      var fade = Math.min(1, (to.life - to.t) / 0.5);
      var slide = Math.min(1, to.t * 5);
      var w = 420, h = to.kind === 'trophy' ? 52 : 40;
      var x = C.GAME_W / 2 - w / 2;
      var y = 74 + i * (h + 8) - (1 - slide) * 20;
      ctx.save();
      ctx.globalAlpha = C.clamp(fade, 0, 1);
      UI.roundRectPath(ctx, x, y, w, h, 10);
      var g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, 'rgba(24,32,48,.96)');
      g.addColorStop(1, 'rgba(12,17,27,.96)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = to.colour;
      ctx.lineWidth = 1.6;
      if (to.kind === 'trophy') { ctx.shadowColor = to.colour; ctx.shadowBlur = 18; }
      ctx.stroke();
      ctx.restore();
      UI.text(ctx, to.text, C.GAME_W / 2, y + h / 2 + 5, {
        size: to.kind === 'trophy' ? 17 : 15, weight: 800, align: 'center',
        color: to.colour, family: to.kind === 'trophy' ? undefined : undefined
      });
    }
  };

  /* ---- the loop --------------------------------------------------------- */

  Game.prototype.frame = function (ms) {
    var now = ms === undefined ? (this.last + 16.7) : ms;
    var dt = this.last ? (now - this.last) / 1000 : 1 / 60;
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    this.acc += dt;
    var step = 1 / C.HZ;
    var guard = 0;
    while (this.acc >= step && guard++ < 8) {
      this.update(step);
      this.acc -= step;
    }
    this.render();
    return this;
  };

  /* ---- boot ------------------------------------------------------------- */

  function bootGame(canvas, opts) {
    opts = opts || {};
    var inp = opts.input;
    if (!inp && canvas.addEventListener) {
      inp = new NS.Input();
      try { inp.attach(canvas); } catch (e) {}
    }
    var game = new Game(canvas, { input: inp, lang: opts.lang, storage: opts.storage, fresh: opts.fresh, machine: opts.machine });
    if (inp) game.input = inp;
    /* INSERT COIN should land in a cabinet, not on a second title that only
     * a keyboard can leave. Callers that want the title pass screen:'title'. */
    if (opts.screen) game.screen = opts.screen;
    else if (opts.machine) game.screen = 'play';

    if (!opts.manual && root.requestAnimationFrame) {
      var loop = function (ms) {
        if (!game.running) return;
        game.frame(ms);
        root.requestAnimationFrame(loop);
      };
      root.requestAnimationFrame(loop);
    }
    return game;
  }

  NS.Game = Game;
  NS.bootGame = bootGame;
  NS.MOVE_LIMIT = MOVE_LIMIT;
  if (typeof module !== 'undefined' && module.exports) module.exports = bootGame;
})(typeof globalThis !== 'undefined' ? globalThis : this);
