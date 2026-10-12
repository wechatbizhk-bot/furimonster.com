'use strict';
/* =========================================================================
 * js/constants.js — world geometry, camera, simulation tuning, economy,
 * difficulty presets, upgrades, achievements and the shared maths helpers.
 *
 * Everything here is data.  The playfield is described in metres so that the
 * physics is honest: a 1 kg plush in a 2 m cabinet really does need a claw
 * that grips harder than its weight times the slipperiness of its fabric.
 * ========================================================================= */
(function (root) {
  var C = {};

  /* ---- viewport --------------------------------------------------------- */
  C.GAME_W = 1280;
  C.GAME_H = 720;
  C.HZ = 60;                     // logic steps per second in the shell

  /* ---- the cabinet interior, in metres ---------------------------------- *
   * x: left (-) to right (+)      z: back (-) to front glass (+)
   * y: floor (0) upwards.  The glass is at +Z, the prize pile starts at the
   * back.  The prize chute is a hole cut in the floor at the front-left.     */
  C.BOX = { hx: 1.02, hz: 0.64, top: 1.58 };

  /* the hole in the floor.  A toy whose centre is inside this rectangle has no
   * floor under it at all and drops straight into the prize bin.  Around the
   * hole runs a low raised rim, so a toy that is merely resting near the edge
   * leans against the rim instead of rolling in: a prize only goes down the
   * hole if it is genuinely shoved over the rim or dropped in from above.   */
  C.CHUTE = { x0: -0.96, x1: -0.32, z0: 0.10, z1: 0.56 };
  C.CHUTE.cx = (C.CHUTE.x0 + C.CHUTE.x1) / 2;
  C.CHUTE.cz = (C.CHUTE.z0 + C.CHUTE.z1) / 2;
  C.CHUTE_LIP = 0.055;           // how high the rim stands, in metres
  C.CHUTE_HOLD = 0.45;           // rim contact footprint, as a fraction of r
  C.CHUTE_PUSH = 0.0022;         // rim stiffness, per solver pass (metres)

  /* where the claw parks and where it releases what it is holding */
  C.HOME = { x: C.CHUTE.cx, z: C.CHUTE.cz, y: 0.98 };

  /* the claw travels on a gantry; it cannot reach the extreme corners the
   * floor allows, which is what keeps the chute corner a real target.       */
  C.RAIL = { x0: -0.94, x1: 0.94, z0: -0.52, z1: 0.54 };

  /* ---- camera ----------------------------------------------------------- *
   * A front view tilted down through the glass.  `pitch` is how far the
   * camera looks down; the projection is a plain pinhole.                   */
  C.CAM = { x: 0, y: 2.01, z: 3.32, pitch: 0.430, fovY: 0.700, roll: 0 };
  C.CAM.f = (C.GAME_H / 2) / Math.tan(C.CAM.fovY / 2);

  /* ---- simulation ------------------------------------------------------- *
   * A pile of spheres is a nasty thing to keep still.  Positional correction
   * is what stops them sinking into one another, but it is also what makes a
   * heap "boil": every correction lifts a toy slightly, and gravity turns that
   * into motion again.  The cure is a generous slop (resting contacts are
   * simply never corrected), a gentler correction spread over more iterations,
   * and a rest threshold high enough to catch the leftovers.  Tuned together,
   * these take the settled kinetic energy of a 26-toy heap from 1.38 to zero. */
  C.PHYS = {
    g: 9.81,                     // m/s^2
    dt: 1 / 180,                 // fixed physics step
    maxSteps: 12,                // per frame, so a stalled frame cannot spiral
    linDamp: 1.35,               // per second, velocity *= 1/(1+damp*dt)
    contactDamp: 3.2,            // extra damping for anything with support
    restitution: 0.06,           // plush does not bounce
    friction: 0.55,              // tangential impulse / normal impulse
    iterations: 8,               // sequential impulse passes
    slop: 0.006,                 // penetration ignored while at rest
    correction: 0.18,            // fraction of penetration pushed out per pass
    maxCorrection: 0.004,        // metres of positional push per body per step
    restVel: 0.06,               // below this a supported body is put to rest
    maxVel: 6.0                  // hard clamp, so nothing can ever run away
  };

  /* ---- the claw --------------------------------------------------------- *
   * The grip model is the heart of the game.  A closed claw applies a finite
   * clamping force; the plush pulls back with its weight times how slippery
   * it is, plus whatever the claw's own acceleration adds.  When the demand
   * exceeds the supply, grip integrity drains and the prize starts to droop
   * through the prongs before it finally falls.                            */
  C.CLAW = {
    fingerDropOpen: 0.15,        // how far below the hub the finger tips hang
    fingerDropClosed: 0.09,
    reachOpen: 0.150,            // finger tip radius from the hub when open
    reachClosed: 0.038,
    hubR: 0.050,
    tipR: 0.015,
    openRate: 3.2,               // prong open/close speed (1/s)
    dropSpeed: 0.62,             // m/s descending
    liftSpeed: 0.72,             // m/s ascending
    travelSpeed: 0.72,           // m/s on the gantry in x/z
    homeSpeed: 1.05,             // m/s when returning by itself
    moveAccel: 2.6,              // m/s^2, ramping the gantry up to speed
    holdHeight: 0.12,            // default clearance for the held prize
    gripRecover: 0.55,           // integrity regained per second when slack
    joltRate: 0.11,              // chance/second of a random "machine hiccup"
    joltPower: 0.55,             // extra demand multiplier a jolt adds
    sweepPush: 0.9,              // how hard the closing prongs shove neighbours
    droopMax: 0.085              // how far a prize sags as integrity falls
  };

  /* difficulty.  `fun` is the arcade feel; `realistic` is a real machine:
   * the claw barely holds anything, and it does not always hold at all.     */
  C.DIFF = {
    fun: {
      id: 'fun',
      label: { en: 'FUN', zh: '趣味' },
      grip: 5.60,                // nominal clamping force, in "newtons"
      centeringWeight: 0.42,     // how much off-centre placement matters
      sizeMismatch: 0.55,        // penalty when the claw is too small/large
      slipRate: 1.10,            // integrity lost per second per unit of excess
      slipCurve: 0.55,           // how sharply excess demand drains integrity
      jolt: 0.35,                // multiplier on the random-hiccup rate
      accelPenalty: 0.18,        // how much gantry acceleration costs grip
      velPenalty: 0.10,
      dropSpeed: 0.78,
      jackpotChance: 0.10,       // chance of a "firm grab" that never slips
      nudges: 0.28,              // how much the claw shoves the pile around
      startCredits: 24
    },
    real: {
      id: 'real',
      label: { en: 'REALISTIC', zh: '真實' },
      grip: 2.10,
      centeringWeight: 0.86,
      sizeMismatch: 1.0,
      slipRate: 0.62,             // how fast a losing grip actually drains
      slipCurve: 1.0,
      jolt: 1.0,
      accelPenalty: 0.62,
      velPenalty: 0.30,
      dropSpeed: 0.62,
      jackpotChance: 0.045,
      nudges: 0.38,
      startCredits: 18
    }
  };

  /* ---- prizes ----------------------------------------------------------- */
  C.RARITY = {
    common: { id: 'common', en: 'Common', zh: '普通', tint: '#8fa3bd', stars: 1 },
    uncommon: { id: 'uncommon', en: 'Uncommon', zh: '少見', tint: '#5fd18a', stars: 2 },
    rare: { id: 'rare', en: 'Rare', zh: '稀有', tint: '#4fa8ff', stars: 3 },
    epic: { id: 'epic', en: 'Epic', zh: '史詩', tint: '#b06bff', stars: 4 },
    legend: { id: 'legend', en: 'Legendary', zh: '傳說', tint: '#ffc23d', stars: 5 }
  };
  C.RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legend'];

  /* ---- economy ---------------------------------------------------------- */
  C.ECON = {
    creditPrice: 5,              // what one play costs, in dollars
    startMoney: 120,
    sellRate: 0.55,              // fraction of a prize's value when sold
    duplicateBonus: 0.15,        // extra resale on a prize you already own
    dailyPeek: 0                // (unused, kept for save compatibility)
  };

  /* ---- upgrades --------------------------------------------------------- *
   * `cost` is a function of the current level so the shop scales.           */
  C.UPGRADES = [
    {
      id: 'grip', max: 5, name: { en: 'Claw Pressure', zh: '爪力加壓' },
      desc: { en: 'More clamping force. Fewer prizes slip on the way home.',
              zh: '提高夾爪夾力，減少獎品在運送途中滑落。' },
      cost: function (l) { return 260 + l * 240; },
      apply: function (s, l) { s.grip += l * 0.90; }
    },
    {
      id: 'pad', max: 5, name: { en: 'Rubber Pads', zh: '防滑膠墊' },
      desc: { en: 'Grippier pads: slippery vinyl toys stop squirting out.',
              zh: '增加膠墊摩擦力，滑溜的膠公仔不易溜走。' },
      cost: function (l) { return 300 + l * 260; },
      apply: function (s, l) { s.slipResist += l * 0.16; }
    },
    {
      id: 'aim', max: 4, name: { en: 'Precision Gantry', zh: '精密滑軌' },
      desc: { en: 'Finer alignment: the claw lands where you meant it to.',
              zh: '提升對位精度，夾爪落點更準確。' },
      cost: function (l) { return 220 + l * 210; },
      apply: function (s, l) { s.aim += l * 0.30; }
    },
    {
      id: 'motor', max: 4, name: { en: 'Servo Motors', zh: '伺服馬達' },
      desc: { en: 'Faster drop, lift and travel. Less time for a weak grip.',
              zh: '加快下降、上升與移動速度，抓緊時間完成搬運。' },
      cost: function (l) { return 240 + l * 200; },
      apply: function (s, l) { s.speed += l * 0.16; }
    },
    {
      id: 'luck', max: 5, name: { en: 'Lucky Coin', zh: '幸運硬幣' },
      desc: { en: 'Better odds of a firm grab, and of rare toys in the pile.',
              zh: '提高「穩固抓取」機率，機台亦較易出現稀有獎品。' },
      cost: function (l) { return 340 + l * 300; },
      apply: function (s, l) { s.luck += l * 0.4; }
    },
    {
      id: 'nudge', max: 3, name: { en: 'Soft-Close Prongs', zh: '慢合夾爪' },
      desc: { en: 'Prongs close gently and shove less of the pile away.',
              zh: '夾爪緩慢合上，減少把周圍獎品推走。' },
      cost: function (l) { return 280 + l * 240; },
      apply: function (s, l) { s.softClose += l * 0.35; }
    }
  ];

  /* ---- achievements ----------------------------------------------------- */
  C.ACHIEVEMENTS = [
    { id: 'first',      en: 'First Blood',        zh: '第一件戰利品',  hint: { en: 'Win your first prize.', zh: '贏得第一件獎品。' } },
    { id: 'ten',        en: 'Collector',          zh: '收藏家',        hint: { en: 'Own 10 different prizes.', zh: '收集 10 款不同獎品。' } },
    { id: 'fifty',      en: 'Curator',            zh: '館長',          hint: { en: 'Own 50 different prizes.', zh: '收集 50 款不同獎品。' } },
    { id: 'all',        en: 'Completionist',      zh: '圖鑑完成',      hint: { en: 'Own every prize in the catalogue.', zh: '收集全部獎品。' } },
    { id: 'streak3',    en: 'Three In A Row',     zh: '哇哦，三連勝！', hint: { en: 'Win three plays in a row.', zh: '連續三次成功夾到獎品。' } },
    { id: 'streak5',    en: 'On Fire',            zh: '氣勢如虹',      hint: { en: 'Win five plays in a row.', zh: '連續五次成功夾到獎品。' } },
    { id: 'spend100',   en: 'You Just Saved 100', zh: '你剛剛省下了100€！', hint: { en: 'Spend 100 on plays.', zh: '累計花費 100 於夾取。' } },
    { id: 'dry10',      en: 'Not Your Day',       zh: '也許今天不是你的幸運日！', hint: { en: 'Ten plays in a row with nothing.', zh: '連續十次空手而回。' } },
    { id: 'slipped',    en: 'So Close',           zh: '就差一點',      hint: { en: 'Lose a prize during the lift or the return.', zh: '獎品在上升或回程途中滑落。' } },
    { id: 'slipmaster', en: 'Butterfingers',      zh: '手滑大師',      hint: { en: 'Lose 10 prizes to a slipping grip.', zh: '累計 10 次因滑落而失去獎品。' } },
    { id: 'nudgewin',   en: 'Nudge Master',       zh: '推土機',        hint: { en: 'Win a prize you never picked up.', zh: '贏得一件你從未夾起的獎品。' } },
    { id: 'double',     en: 'Two At Once',        zh: '一箭雙鵰',      hint: { en: 'Win two prizes in a single play.', zh: '一次夾取贏得兩件獎品。' } },
    { id: 'heavy',      en: 'Heavy Lifter',       zh: '大力士',        hint: { en: 'Win a prize weighing 600 g or more.', zh: '贏得一件 600 克或以上的獎品。' } },
    { id: 'legend',     en: 'Impossible Odds',    zh: '不可能的挑戰',  hint: { en: 'Win a legendary prize on Realistic.', zh: '在真實難度贏得傳說級獎品。' } },
    { id: 'firm',       en: 'Firm Grip',          zh: '穩如泰山',      hint: { en: 'Win on a firm grab that never slipped.', zh: '以「穩固抓取」零滑落完勝。' } },
    { id: 'fullshelf',  en: 'Full Shelf',         zh: '滿架而歸',      hint: { en: 'Display 12 prizes on the shelf.', zh: '在展示架上擺放 12 件獎品。' } },
    { id: 'allmach',    en: 'Floor Walker',       zh: '巡場高手',      hint: { en: 'Win a prize on every machine.', zh: '在每部機台都贏得獎品。' } },
    { id: 'jackpot',    en: 'Jackpot',            zh: '中頭獎',        hint: { en: 'Win a prize worth 400 or more.', zh: '贏得價值 400 或以上的獎品。' } }
  ];

  /* ---------------- maths helpers ---------------------------------------- */

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function invLerp(a, b, v) { return b === a ? 0 : (v - a) / (b - a); }

  /* mulberry32 — small, fast, and reproducible, which is what lets the tests
   * replay a whole attempt and assert on the outcome.                      */
  function Rng(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  Rng.prototype.next = function () {
    var t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Rng.prototype.range = function (a, b) { return a + this.next() * (b - a); };
  Rng.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length) % arr.length]; };
  Rng.prototype.chance = function (p) { return this.next() < p; };

  C.clamp = clamp;
  C.lerp = lerp;
  C.smooth = smooth;
  C.invLerp = invLerp;
  C.Rng = Rng;

  /* point-in-chute test used by the floor constraint.  `margin` shrinks the
   * hole so that a toy has to be genuinely over it, not merely touching.   */
  C.overChute = function (x, z, margin) {
    var m = margin || 0;
    return x > C.CHUTE.x0 + m && x < C.CHUTE.x1 - m &&
           z > C.CHUTE.z0 + m && z < C.CHUTE.z1 - m;
  };

  C.creditToMoney = function (c) { return c * C.ECON.creditPrice; };

  root.CM = root.CM || {};
  root.CM.C = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof globalThis !== 'undefined' ? globalThis : this);
