'use strict';
/* =========================================================================
 * js/player.js — the wallet, the collection book, the shop and the trophies.
 *
 * Pure state, no DOM: the shell drives it and the tests assert on it.  All of
 * it serialises to one JSON blob in localStorage, so a save file is just the
 * numbers and the prize ids.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, CAT = NS.CAT;

  var SAVE_KEY = 'clawmachine.save.v1';
  var SHELF_SIZE = 12;

  function emptyStats() {
    return {
      plays: 0, wins: 0, losses: 0, spent: 0, earned: 0,
      streak: 0, bestStreak: 0, dryStreak: 0, worstDry: 0,
      slips: 0, nudgedWins: 0, doubles: 0, firmWins: 0,
      heaviest: 0, bestValue: 0, legendWins: 0, grabs: 0, playSeconds: 0
    };
  }

  function Player(opts) {
    opts = opts || {};
    this.money = C.ECON.startMoney;
    this.credits = 10;
    this.owned = {};                 // prizeId -> count
    this.shelf = [];                 // prizeId, up to SHELF_SIZE
    this.upgrades = {};
    for (var i = 0; i < C.UPGRADES.length; i++) this.upgrades[C.UPGRADES[i].id] = 0;
    this.achievements = {};
    this.stats = emptyStats();
    this.machinesWon = {};
    this.lang = opts.lang || 'zh';
    this.diffId = opts.diff || 'fun';
    this.music = true;
    this.sfx = true;
    this.seen = {};                  // prizeId -> true, for the "new" badge
    this.notes = [];                 // recent trophy popups
  }

  /* ---- the shop's effect on the claw ------------------------------------ */
  Player.prototype.statBag = function () {
    var bag = { grip: 0, slipResist: 0, aim: 0, luck: 0, speed: 0, softClose: 0 };
    for (var i = 0; i < C.UPGRADES.length; i++) {
      var u = C.UPGRADES[i];
      var lvl = this.upgrades[u.id] || 0;
      if (lvl > 0) u.apply(bag, lvl);
    }
    return bag;
  };

  Player.prototype.difficulty = function () {
    return C.DIFF[this.diffId] || C.DIFF.fun;
  };

  /* ---- money ------------------------------------------------------------ */

  Player.prototype.canAffordCredits = function (n) {
    return this.money >= n * C.ECON.creditPrice;
  };

  Player.prototype.buyCredits = function (n) {
    var cost = n * C.ECON.creditPrice;
    if (this.money < cost) return false;
    this.money -= cost;
    this.credits += n;
    return true;
  };

  /* returns false when the player cannot pay */
  Player.prototype.payPlay = function (machineDef) {
    var cost = machineDef.creditCost;
    if (this.credits < cost) return false;
    this.credits -= cost;
    this.stats.spent += C.creditToMoney(cost);
    this.stats.plays++;
    return true;
  };

  Player.prototype.earn = function (amount) {
    this.money += amount;
    this.stats.earned += amount;
    return amount;
  };

  /* ---- the collection --------------------------------------------------- */

  Player.prototype.countOf = function (id) { return this.owned[id] || 0; };
  Player.prototype.uniqueCount = function () { return Object.keys(this.owned).length; };
  Player.prototype.isOwned = function (id) { return (this.owned[id] || 0) > 0; };

  Player.prototype.addPrize = function (prize) {
    var had = this.owned[prize.id] || 0;
    this.owned[prize.id] = had + 1;
    /* auto-display the first twelve distinct prizes you ever win */
    if (had === 0 && this.shelf.length < SHELF_SIZE) this.shelf.push(prize.id);
    return { isNew: had === 0, count: had + 1 };
  };

  Player.prototype.shelfIds = function () { return this.shelf.slice(); };

  Player.prototype.toggleShelf = function (id) {
    var i = this.shelf.indexOf(id);
    if (i >= 0) { this.shelf.splice(i, 1); return false; }
    if (!this.isOwned(id)) return false;
    if (this.shelf.length >= SHELF_SIZE) return false;
    this.shelf.push(id);
    return true;
  };

  Player.prototype.sellPrice = function (prize) {
    var mult = C.ECON.sellRate + (this.isOwned(prize.id) ? C.ECON.duplicateBonus : 0);
    return Math.max(1, Math.round(prize.value * mult));
  };

  /* one spare copy of every prize you own more than once */
  Player.prototype.duplicateList = function () {
    var out = [];
    for (var id in this.owned) {
      if (!Object.prototype.hasOwnProperty.call(this.owned, id)) continue;
      var extra = this.owned[id] - 1;
      if (extra > 0) out.push({ prize: CAT.byId(id), count: extra });
    }
    return out;
  };

  Player.prototype.sellDuplicates = function () {
    var list = this.duplicateList(), total = 0, sold = 0;
    for (var i = 0; i < list.length; i++) {
      var p = list[i].prize;
      if (!p) continue;
      var each = this.sellPrice(p);
      total += each * list[i].count;
      sold += list[i].count;
      this.owned[p.id] = 1;
    }
    if (total > 0) this.earn(total);
    return { money: total, sold: sold };
  };

  Player.prototype.collectionValue = function () {
    var v = 0;
    for (var id in this.owned) {
      if (!Object.prototype.hasOwnProperty.call(this.owned, id)) continue;
      var p = CAT.byId(id);
      if (p) v += p.value * this.owned[id];
    }
    return v;
  };

  /* ---- upgrades --------------------------------------------------------- */

  Player.prototype.upgradeLevel = function (id) { return this.upgrades[id] || 0; };

  Player.prototype.upgradeCost = function (id) {
    var u = this.def(id);
    if (!u) return 0;
    var lvl = this.upgradeLevel(id);
    if (lvl >= u.max) return 0;
    return u.cost(lvl);
  };

  Player.prototype.def = function (id) {
    for (var i = 0; i < C.UPGRADES.length; i++) if (C.UPGRADES[i].id === id) return C.UPGRADES[i];
    return null;
  };

  Player.prototype.buyUpgrade = function (id) {
    var u = this.def(id);
    if (!u) return false;
    var lvl = this.upgradeLevel(id);
    if (lvl >= u.max) return false;
    var cost = u.cost(lvl);
    if (this.money < cost) return false;
    this.money -= cost;
    this.upgrades[id] = lvl + 1;
    return true;
  };

  Player.prototype.totalUpgradeLevels = function () {
    var n = 0;
    for (var k in this.upgrades) if (Object.prototype.hasOwnProperty.call(this.upgrades, k)) n += this.upgrades[k];
    return n;
  };

  /* ---- recording a play -------------------------------------------------- */

  Player.prototype.record = function (result, machineDef) {
    var s = this.stats;
    var gained = [];
    var i;

    if (result.grabbed) s.grabs++;

    if (result.win) {
      s.wins++;
      s.streak++;
      s.dryStreak = 0;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
      if (result.double) s.doubles++;
      if (result.firm) s.firmWins++;
      if (result.nudgedWin) s.nudgedWins++;
      if (result.heaviest > s.heaviest) s.heaviest = result.heaviest;
      if (result.best > s.bestValue) s.bestValue = result.best;
      this.machinesWon[machineDef.id] = true;
      if (this.diffId === 'real') {
        for (i = 0; i < result.prizes.length; i++) if (result.prizes[i].tier >= 4) s.legendWins++;
      }
      for (i = 0; i < result.prizes.length; i++) {
        var prize = result.prizes[i];
        var add = this.addPrize(prize);
        gained.push({ prize: prize, isNew: add.isNew, count: add.count });
      }
    } else {
      s.losses++;
      s.streak = 0;
      s.dryStreak++;
      if (s.dryStreak > s.worstDry) s.worstDry = s.dryStreak;
      if (result.slipped) s.slips++;
    }
    if (result.slipped && result.win) s.slips++;

    var unlocked = this.checkAchievements();
    return { gained: gained, unlocked: unlocked };
  };

  /* ---- achievements ------------------------------------------------------ */

  var CHECKS = {
    first:      function (p) { return p.stats.wins >= 1; },
    ten:        function (p) { return p.uniqueCount() >= 10; },
    fifty:      function (p) { return p.uniqueCount() >= 50; },
    all:        function (p) { return p.uniqueCount() >= CAT.PRIZES.length; },
    streak3:    function (p) { return p.stats.bestStreak >= 3; },
    streak5:    function (p) { return p.stats.bestStreak >= 5; },
    spend100:   function (p) { return p.stats.spent >= 100; },
    dry10:      function (p) { return p.stats.worstDry >= 10; },
    slipped:    function (p) { return p.stats.slips >= 1; },
    slipmaster: function (p) { return p.stats.slips >= 10; },
    nudgewin:   function (p) { return p.stats.nudgedWins >= 1; },
    double:     function (p) { return p.stats.doubles >= 1; },
    /* 600 g, not 900 g: the heaviest prize in the real six is Furi Prince at
     * 664 g, so a 900 g threshold was unreachable and this trophy could never
     * fire in a real game — only in a synthetic test record. */
    heavy:      function (p) { return p.stats.heaviest >= 600; },
    legend:     function (p) { return p.stats.legendWins >= 1; },
    firm:       function (p) { return p.stats.firmWins >= 1; },
    fullshelf:  function (p) { return p.shelf.length >= SHELF_SIZE; },
    allmach:    function (p) { return Object.keys(p.machinesWon).length >= CAT.MACHINES.length; },
    jackpot:    function (p) { return p.stats.bestValue >= 400; }
  };

  Player.prototype.checkAchievements = function () {
    var unlocked = [];
    for (var i = 0; i < C.ACHIEVEMENTS.length; i++) {
      var a = C.ACHIEVEMENTS[i];
      if (this.achievements[a.id]) continue;
      var fn = CHECKS[a.id];
      if (fn && fn(this)) {
        this.achievements[a.id] = Date.now();
        unlocked.push(a);
        this.notes.push({ kind: 'trophy', id: a.id, at: Date.now() });
      }
    }
    return unlocked;
  };

  Player.prototype.achievementCount = function () {
    return Object.keys(this.achievements).length;
  };

  /* ---- looking at a prize for the first time ----------------------------- */
  Player.prototype.markSeen = function (id) {
    var fresh = !this.seen[id];
    this.seen[id] = true;
    return fresh;
  };

  /* ---- persistence ------------------------------------------------------- */

  Player.prototype.toJSON = function () {
    return {
      v: 1,
      money: this.money,
      credits: this.credits,
      owned: this.owned,
      shelf: this.shelf,
      upgrades: this.upgrades,
      achievements: this.achievements,
      stats: this.stats,
      machinesWon: this.machinesWon,
      lang: this.lang,
      diffId: this.diffId,
      music: this.music,
      sfx: this.sfx,
      seen: this.seen
    };
  };

  Player.prototype.fromJSON = function (data) {
    if (!data || typeof data !== 'object') return this;
    this.money = num(data.money, this.money);
    this.credits = num(data.credits, this.credits);
    this.shelf = Array.isArray(data.shelf) ? data.shelf.filter(function (id) { return !!CAT.byId(id); }).slice(0, SHELF_SIZE) : [];
    this.owned = {};
    if (data.owned) {
      for (var id in data.owned) {
        if (!Object.prototype.hasOwnProperty.call(data.owned, id)) continue;
        if (CAT.byId(id)) this.owned[id] = num(data.owned[id], 0);
      }
    }
    if (data.upgrades) {
      for (var i = 0; i < C.UPGRADES.length; i++) {
        var u = C.UPGRADES[i];
        this.upgrades[u.id] = C.clamp(num(data.upgrades[u.id], 0), 0, u.max);
      }
    }
    this.achievements = data.achievements && typeof data.achievements === 'object' ? data.achievements : {};
    var base = emptyStats();
    if (data.stats) for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) base[k] = num(data.stats[k], base[k]);
    this.stats = base;
    this.machinesWon = data.machinesWon && typeof data.machinesWon === 'object' ? data.machinesWon : {};
    if (data.lang === 'en' || data.lang === 'zh') this.lang = data.lang;
    if (data.diffId && C.DIFF[data.diffId]) this.diffId = data.diffId;
    this.music = data.music !== false;
    this.sfx = data.sfx !== false;
    this.seen = data.seen && typeof data.seen === 'object' ? data.seen : {};
    return this;
  };

  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }

  Player.prototype.save = function (storage) {
    var st = storage || safeStorage();
    if (!st) return false;
    try { st.setItem(SAVE_KEY, JSON.stringify(this.toJSON())); return true; }
    catch (e) { return false; }
  };

  Player.prototype.load = function (storage) {
    var st = storage || safeStorage();
    if (!st) return false;
    try {
      var raw = st.getItem(SAVE_KEY);
      if (!raw) return false;
      this.fromJSON(JSON.parse(raw));
      return true;
    } catch (e) { return false; }
  };

  Player.prototype.erase = function (storage) {
    var st = storage || safeStorage();
    try { if (st) st.removeItem(SAVE_KEY); } catch (e) {}
    var lang = this.lang, music = this.music, sfx = this.sfx;
    this.money = C.ECON.startMoney;
    this.credits = 10;
    this.owned = {};
    this.shelf = [];
    this.upgrades = {};
    this.achievements = {};
    this.stats = emptyStats();
    this.machinesWon = {};
    this.seen = {};
    this.lang = lang; this.music = music; this.sfx = sfx;
    return this;
  };

  function safeStorage() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return null;
      localStorage.setItem('__cm_probe', '1');
      localStorage.removeItem('__cm_probe');
      return localStorage;
    } catch (e) { return null; }
  }

  NS.Player = Player;
  NS.SAVE_KEY = SAVE_KEY;
  NS.SHELF_SIZE = SHELF_SIZE;
  if (typeof module !== 'undefined' && module.exports) module.exports = Player;
})(typeof globalThis !== 'undefined' ? globalThis : this);
